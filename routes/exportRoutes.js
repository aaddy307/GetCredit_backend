import { Router } from 'express';
import { exportExcel } from '../controllers/exportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/excel', protect, exportExcel);

export default router;