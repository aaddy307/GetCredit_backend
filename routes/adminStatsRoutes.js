import { Router } from 'express';
import { getTodayStats } from '../controllers/adminStatsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/stats/today', protect, getTodayStats);

export default router;