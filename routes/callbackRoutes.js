const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { 
  createCallbackRequest, 
  getCallbackRequests, 
  getCallbackRequest,
  updateCallbackRequest,
  updateCallbackStatus,
  deleteCallbackRequest
} = require('../controllers/callbackController');
const { protect } = require('../middleware/authMiddleware');

const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  skip: () => process.env.NODE_ENV === 'test',
  message: { success: false, errors: ['Too many requests. Please try again later.'] }
});

router.post('/', publicLimiter, createCallbackRequest);

router.get('/', protect, getCallbackRequests);
router.get('/:id', protect, getCallbackRequest);
router.put('/:id', protect, updateCallbackRequest);
router.patch('/:id/status', protect, updateCallbackStatus);
router.delete('/:id', protect, deleteCallbackRequest);

module.exports = router;