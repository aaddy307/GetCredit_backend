const express = require('express');
const router = express.Router();
const { getTodayStats } = require('../controllers/adminStatsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/stats/today', protect, getTodayStats);

module.exports = router;