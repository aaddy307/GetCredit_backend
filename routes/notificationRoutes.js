const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

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

router.get('/stream', protect, (req, res) => {
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

module.exports = router;
