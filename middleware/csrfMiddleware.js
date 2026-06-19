import crypto from 'crypto';

const CSRF_SECRET = process.env.JWT_SECRET || 'default-csrf-secret-change-in-production';

const tokens = new Map();

export const generateCSRFToken = (sessionId) => {
  const timestamp = Date.now();
  const randomPart = crypto.randomBytes(32).toString('hex');
  const signature = crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(`${sessionId}-${timestamp}-${randomPart}`)
    .digest('hex');

  const token = `${timestamp}.${randomPart}.${signature}`;

  if (tokens.size > 10000) {
    const oldestKeys = [...tokens.entries()]
      .sort((a, b) => a[1] - b[1])
      .slice(0, 1000)
      .map(e => e[0]);
    oldestKeys.forEach(key => tokens.delete(key));
  }

  tokens.set(token, { createdAt: timestamp, sessionId });

  return token;
};

export const verifyCSRFToken = (token, sessionId) => {
  if (!token || typeof token !== 'string') {
    return { valid: false, reason: 'Token is missing or invalid' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, reason: 'Invalid token format' };
  }

  const [timestampStr, randomPart, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);

  if (isNaN(timestamp)) {
    return { valid: false, reason: 'Invalid timestamp' };
  }

  const tokenAge = Date.now() - timestamp;
  const maxAge = 24 * 60 * 60 * 1000;
  if (tokenAge > maxAge) {
    return { valid: false, reason: 'Token expired' };
  }

  const expectedSignature = crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(`${sessionId || ''}-${timestampStr}-${randomPart}`)
    .digest('hex');

  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isValid) {
      return { valid: false, reason: 'Invalid signature' };
    }

    const tokenData = tokens.get(token);
    if (!tokenData) {
      return { valid: false, reason: 'Token not found' };
    }

    return { valid: true };
  } catch {
    return { valid: false, reason: 'Token verification failed' };
  }
};

export const csrfMiddleware = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  const headerToken = req.headers['csrf-token'] || req.headers['x-csrf-token'];

  if (!headerToken) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token missing. Please obtain a token from /api/csrf-token'
    });
  }

  const sessionId = req.ip;
  const result = verifyCSRFToken(headerToken, sessionId);

  if (!result.valid) {
    return res.status(403).json({
      success: false,
      message: `Invalid CSRF token: ${result.reason}`
    });
  }

  next();
};

export const getCSRFTokenForClient = (req) => {
  return generateCSRFToken(req.ip);
};
