const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { login, logout, getProfile, createAdmin } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const Admin = require('../models/Admin');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' }
});

const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many admin creation attempts. Please try again later.' }
});

const checkFirstAdmin = async (req, res, next) => {
  const adminCount = await Admin.countDocuments();
  if (adminCount > 0) {
    return res.status(403).json({ success: false, message: 'Admin creation is disabled. Please login.' });
  }
  next();
};

router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.post('/create', createLimiter, checkFirstAdmin, createAdmin);
router.get('/profile', protect, getProfile);

module.exports = router;