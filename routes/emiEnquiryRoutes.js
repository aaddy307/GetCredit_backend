const express = require('express');
const router = express.Router();
const { 
  createHomeLoanEnquiry, createLAPEnquiry, createEducationLoanEnquiry,
  createPersonalLoanEnquiry, createBusinessLoanEnquiry, createVehicleLoanEnquiry,
  getEMIEnquiries, exportEMIEnquiries
} = require('../controllers/emiEnquiryController');
const { protect } = require('../middleware/authMiddleware');

router.post('/home-loan', createHomeLoanEnquiry);
router.post('/lap', createLAPEnquiry);
router.post('/education-loan', createEducationLoanEnquiry);
router.post('/personal-loan', createPersonalLoanEnquiry);
router.post('/business-loan', createBusinessLoanEnquiry);
router.post('/vehicle-loan', createVehicleLoanEnquiry);

router.get('/admin/emi-enquiries', protect, getEMIEnquiries);
router.get('/admin/emi-enquiries/export', protect, exportEMIEnquiries);

module.exports = router;
