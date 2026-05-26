import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import {
  getAllBlogs,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog,
  getBlogStats
} from '../controllers/blogController.js';
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

router.get('/', optionalAuth, getAllBlogs);
router.get('/stats', protect, getBlogStats);
router.get('/:id', optionalAuth, getBlog);
router.post('/', protect, createBlog);
router.put('/:id', protect, updateBlog);
router.delete('/:id', protect, deleteBlog);

export default router;