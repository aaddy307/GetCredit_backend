import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getMonthlyLeads,
  getLoanDistribution,
  getSummary,
  getRecentLeads
} from '../controllers/adminAnalyticsController.js';

const router = Router();

router.get('/monthly-leads', protect, getMonthlyLeads);
router.get('/loan-distribution', protect, getLoanDistribution);
router.get('/summary', protect, getSummary);
router.get('/recent-leads', protect, getRecentLeads);

export default router;