const express = require('express');
const router = express.Router();
const { 
  calculateHomeLoan, 
  calculateLAP, 
  calculateEducationLoan,
  calculatePersonalLoan,
  calculateBusinessLoan,
  calculateVehicleLoan
} = require('../controllers/calculatorController');

router.post('/home-loan', calculateHomeLoan);
router.post('/lap', calculateLAP);
router.post('/education-loan', calculateEducationLoan);
router.post('/personal-loan', calculatePersonalLoan);
router.post('/business-loan', calculateBusinessLoan);
router.post('/vehicle-loan', calculateVehicleLoan);

module.exports = router;
