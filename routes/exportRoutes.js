const express = require('express');
const router = express.Router();
const { exportExcel } = require('../controllers/exportController');
const { protect } = require('../middleware/authMiddleware');

router.get('/excel', protect, exportExcel);

module.exports = router;