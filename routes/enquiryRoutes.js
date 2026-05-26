const express = require('express');
const router = express.Router();
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
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      const decoded = jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET);
      req.admin = await Admin.findById(decoded.id);
    }
  } catch {}
  next();
};

router.post('/', optionalAuth, createEnquiry);
router.get('/', protect, getAllEnquiries);
router.get('/stats', protect, getDashboardStats);
router.get('/:id', protect, getEnquiry);
router.put('/:id', protect, updateEnquiryStatus);
router.delete('/:id', protect, deleteEnquiry);

module.exports = router;