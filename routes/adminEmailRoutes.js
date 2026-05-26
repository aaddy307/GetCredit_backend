import { Router } from 'express';
import { sendEmail } from '../controllers/adminEmailController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/send', protect, sendEmail);

export default router;