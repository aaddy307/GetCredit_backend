import { Router } from 'express';
import {
  login,
  logout,
  logoutAll,
  refreshAccessToken,
  getProfile,
  getSessions,
  invalidateAllSessions,
  createAdmin
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import Admin from '../models/Admin.js';

const router = Router();

const checkFirstAdmin = async (req, res, next) => {
  const adminCount = await Admin.countDocuments();
  if (adminCount > 0) {
    return res.status(403).json({ success: false, message: 'Admin creation is disabled. Please login.' });
  }
  next();
};

router.post('/login', login);
router.post('/logout', protect, logout);
router.post('/logout-all', protect, logoutAll);
router.post('/refresh', refreshAccessToken);
router.post('/invalidate-sessions', protect, invalidateAllSessions);
router.post('/create', checkFirstAdmin, createAdmin);
router.get('/profile', protect, getProfile);
router.get('/sessions', protect, getSessions);

export default router;
