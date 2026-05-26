import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import {
  createEnquiry,
  getAllEnquiries,
  getEnquiry,
  updateEnquiryStatus,
  deleteEnquiry,
  getDashboardStats
} from '../controllers/enquiryController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

const optionalAuth = async (req, res, next) => {
  try {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      const decoded = jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET);
      req.admin = await Admin.findById(decoded.id);
    }
  } catch {}
  next();
};

router.post('/', optionalAuth, createEnquiry);
router.get('/', protect, getAllEnquiries);
router.get('/stats', protect, getDashboardStats);
router.get('/:id', protect, getEnquiry);
router.put('/:id', protect, updateEnquiryStatus);
router.delete('/:id', protect, deleteEnquiry);

export default router;