const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { 
  createEnquiry, 
  getAllEnquiries, 
  getEnquiry, 
  updateEnquiryStatus, 
  deleteEnquiry,
  getDashboardStats
} = require('../controllers/enquiryController');
const { protect } = require('../middleware/authMiddleware');

const optionalAuth = async (req, res, next) => {
  try {
    if (req.cookies.token) {
      const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
      req.admin = await Admin.findById(decoded.id);
    }
  } catch {}
  next();
};

const publicEnquiryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  skip: (req) => !!req.admin || process.env.NODE_ENV === 'test',
  message: { success: false, message: 'Too many enquiries submitted. Please try again later.' }
});

router.post('/', optionalAuth, publicEnquiryLimiter, createEnquiry);
router.get('/', protect, getAllEnquiries);
router.get('/stats', protect, getDashboardStats);
router.get('/:id', protect, getEnquiry);
router.put('/:id', protect, updateEnquiryStatus);
router.delete('/:id', protect, deleteEnquiry);

module.exports = router;