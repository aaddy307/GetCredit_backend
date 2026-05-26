import { Router } from 'express';
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

router.get('/', getAllBlogs);
router.get('/stats', protect, getBlogStats);
router.get('/:id', getBlog);
router.post('/', protect, createBlog);
router.put('/:id', protect, updateBlog);
router.delete('/:id', protect, deleteBlog);

export default router;