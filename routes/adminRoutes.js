const express = require('express');
const router = express.Router();
const { login, logout, getProfile, createAdmin } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const Admin = require('../models/Admin');

const checkFirstAdmin = async (req, res, next) => {
  const adminCount = await Admin.countDocuments();
  if (adminCount > 0) {
    return res.status(403).json({ success: false, message: 'Admin creation is disabled. Please login.' });
  }
  next();
};

router.post('/login', login);
router.post('/logout', logout);
router.post('/create', checkFirstAdmin, createAdmin);
router.get('/profile', protect, getProfile);

module.exports = router;