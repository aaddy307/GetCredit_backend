import { Router } from 'express';
import {
  createHomeLoanEnquiry, createLAPEnquiry, createEducationLoanEnquiry,
  createPersonalLoanEnquiry, createBusinessLoanEnquiry, createVehicleLoanEnquiry,
  getEMIEnquiries, exportEMIEnquiries
} from '../controllers/emiEnquiryController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/home-loan', createHomeLoanEnquiry);
router.post('/lap', createLAPEnquiry);
router.post('/education-loan', createEducationLoanEnquiry);
router.post('/personal-loan', createPersonalLoanEnquiry);
router.post('/business-loan', createBusinessLoanEnquiry);
router.post('/vehicle-loan', createVehicleLoanEnquiry);

router.get('/admin/emi-enquiries', protect, getEMIEnquiries);
router.get('/admin/emi-enquiries/export', protect, exportEMIEnquiries);

export default router;