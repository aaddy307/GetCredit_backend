const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { 
  createHomeLoanEnquiry, createLAPEnquiry, createEducationLoanEnquiry,
  createPersonalLoanEnquiry, createBusinessLoanEnquiry, createVehicleLoanEnquiry,
  getEMIEnquiries, exportEMIEnquiries
} = require('../controllers/emiEnquiryController');
const { protect } = require('../middleware/authMiddleware');

const publicEnquiryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  skip: () => process.env.NODE_ENV === 'test',
  message: { success: false, errors: ['Too many enquiries submitted. Please try again later.'] }
});

router.post('/home-loan', publicEnquiryLimiter, createHomeLoanEnquiry);
router.post('/lap', publicEnquiryLimiter, createLAPEnquiry);
router.post('/education-loan', publicEnquiryLimiter, createEducationLoanEnquiry);
router.post('/personal-loan', publicEnquiryLimiter, createPersonalLoanEnquiry);
router.post('/business-loan', publicEnquiryLimiter, createBusinessLoanEnquiry);
router.post('/vehicle-loan', publicEnquiryLimiter, createVehicleLoanEnquiry);

router.get('/admin/emi-enquiries', protect, getEMIEnquiries);
router.get('/admin/emi-enquiries/export', protect, exportEMIEnquiries);

module.exports = router;
