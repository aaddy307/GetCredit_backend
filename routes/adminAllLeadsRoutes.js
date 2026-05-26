import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getAllLeads, exportAllLeads, updateLead, deleteLead } from '../controllers/adminAllLeadsController.js';

const router = Router();

router.get('/all-leads', protect, getAllLeads);
router.get('/all-leads/export', protect, exportAllLeads);
router.put('/lead/:id', protect, updateLead);
router.delete('/lead/:id', protect, deleteLead);

export default router;