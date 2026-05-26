import { Router } from 'express';
import {
  calculateHomeLoan,
  calculateLAP,
  calculateEducationLoan,
  calculatePersonalLoan,
  calculateBusinessLoan,
  calculateVehicleLoan
} from '../controllers/calculatorController.js';

const router = Router();

router.post('/home-loan', calculateHomeLoan);
router.post('/lap', calculateLAP);
router.post('/education-loan', calculateEducationLoan);
router.post('/personal-loan', calculatePersonalLoan);
router.post('/business-loan', calculateBusinessLoan);
router.post('/vehicle-loan', calculateVehicleLoan);

export default router;