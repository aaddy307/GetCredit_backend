import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Admin from '../models/Admin.js';

const ACCESS_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY = '30d';

const generateToken = (id, type = 'access') => {
  const expiry = type === 'access' ? ACCESS_TOKEN_EXPIRY : REFRESH_TOKEN_EXPIRY;
  return jwt.sign({ id, type }, process.env.JWT_SECRET, { expiresIn: expiry });
};

const generateSessionToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const validatePassword = (password) => {
  if (!password || password.length < 12) {
    return { valid: false, message: 'Password must be at least 12 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }
  return { valid: true };
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (admin.allTokensInvalidated) {
      admin.allTokensInvalidated = false;
      await admin.save();
    }

    const isMatch = await admin.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const accessToken = generateToken(admin._id, 'access');
    const refreshToken = generateToken(admin._id, 'refresh');
    const sessionToken = generateSessionToken();

    admin.sessionTokens.push({
      token: sessionToken,
      refreshToken: refreshToken,
      createdAt: new Date(),
      lastUsed: new Date(),
      userAgent: req.get('User-Agent') || 'Unknown',
      ip: req.ip,
    });

    if (admin.sessionTokens.length > 10) {
      admin.sessionTokens = admin.sessionTokens.slice(-10);
    }

    await admin.save();

    res.json({
      success: true,
      message: 'Login successful',
      token: accessToken,
      refreshToken,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token && req.admin) {
      const admin = await Admin.findById(req.admin._id);
      if (admin) {
        admin.sessionTokens = admin.sessionTokens.filter(st => st.token !== token);
        await admin.save();
      }
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

export const logoutAll = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);
    if (admin) {
      admin.sessionTokens = [];
      await admin.save();
    }

    res.json({
      success: true,
      message: 'Logged out from all devices successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ success: false, message: 'Invalid token type' });
    }

    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Admin not found' });
    }

    if (admin.allTokensInvalidated) {
      return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
    }

    const session = admin.sessionTokens.find(st => st.refreshToken === refreshToken);
    if (!session) {
      return res.status(401).json({ success: false, message: 'Session not found. Please login again.' });
    }

    const newAccessToken = generateToken(admin._id, 'access');
    const newRefreshToken = generateToken(admin._id, 'refresh');

    session.token = generateSessionToken();
    session.refreshToken = newRefreshToken;
    session.lastUsed = new Date();
    await admin.save();

    res.json({
      success: true,
      token: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('-password -sessionTokens');
    res.json({
      success: true,
      admin
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

export const getSessions = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('sessionTokens');
    const sessions = (admin?.sessionTokens || []).map(st => ({
      createdAt: st.createdAt,
      lastUsed: st.lastUsed,
      userAgent: st.userAgent,
      ip: st.ip,
    }));

    res.json({
      success: true,
      sessions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

export const invalidateAllSessions = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);
    if (admin) {
      admin.allTokensInvalidated = true;
      admin.sessionTokens = [];
      await admin.save();
    }

    res.json({
      success: true,
      message: 'All sessions invalidated. Please login again.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

export const createAdmin = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ success: false, message: passwordValidation.message });
    }

    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ success: false, message: 'Admin already exists' });
    }

    const admin = await Admin.create({
      email,
      password,
      name,
      role: 'admin'
    });

    const accessToken = generateToken(admin._id, 'access');
    const refreshToken = generateToken(admin._id, 'refresh');

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      token: accessToken,
      refreshToken,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};
