import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

const clients = new Map();

const sendToAll = (data) => {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  for (const [id, res] of clients) {
    try {
      res.write(message);
    } catch (e) {
      clients.delete(id);
    }
  }
};

const verifyTokenFromQuery = async (req) => {
  let token = req.query.token;

  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type && decoded.type !== 'access') return null;

    const admin = await Admin.findById(decoded.id);
    if (!admin || admin.allTokensInvalidated) return null;

    return admin;
  } catch {
    return null;
  }
};

const protectSSE = async (req, res, next) => {
  const admin = await verifyTokenFromQuery(req);
  if (!admin) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
  req.admin = admin;
  next();
};

router.get('/stream', protectSSE, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const clientId = Date.now();
  clients.set(clientId, res);

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(clientId);
  });

  res.write(`data: ${JSON.stringify({ type: 'connected', id: clientId })}\n\n`);
});

router.post('/send', protect, (req, res) => {
  const { type, payload } = req.body;
  sendToAll({ type, payload, timestamp: new Date().toISOString() });
  res.json({ success: true, clients: clients.size });
});

export default router;