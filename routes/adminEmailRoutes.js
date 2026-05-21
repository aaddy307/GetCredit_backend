const express = require('express');
const router = express.Router();
const { sendEmail } = require('../controllers/adminEmailController');
const { protect } = require('../middleware/authMiddleware');

router.post('/send', protect, sendEmail);

module.exports = router;
