const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getAllLeads, exportAllLeads, updateLead, deleteLead } = require('../controllers/adminAllLeadsController');

router.get('/all-leads', protect, getAllLeads);
router.get('/all-leads/export', protect, exportAllLeads);
router.put('/lead/:id', protect, updateLead);
router.delete('/lead/:id', protect, deleteLead);

module.exports = router;
