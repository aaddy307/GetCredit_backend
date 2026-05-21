const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  getMonthlyLeads, 
  getLoanDistribution, 
  getSummary,
  getRecentLeads 
} = require('../controllers/adminAnalyticsController');

router.get('/monthly-leads', protect, getMonthlyLeads);
router.get('/loan-distribution', protect, getLoanDistribution);
router.get('/summary', protect, getSummary);
router.get('/recent-leads', protect, getRecentLeads);

module.exports = router;