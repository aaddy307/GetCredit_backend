const express = require('express');
const router = express.Router();
const { 
  getAllBlogs, 
  getBlog, 
  createBlog, 
  updateBlog, 
  deleteBlog,
  getBlogStats
} = require('../controllers/blogController');
const { protect } = require('../middleware/authMiddleware');

// Public routes - list all blogs (for public website)
router.get('/', getAllBlogs);
router.get('/:id', getBlog);

// Protected routes - require authentication
router.get('/stats', protect, getBlogStats);
router.post('/', protect, createBlog);
router.put('/:id', protect, updateBlog);
router.delete('/:id', protect, deleteBlog);

module.exports = router;