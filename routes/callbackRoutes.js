const express = require('express');
const router = express.Router();
const { 
  createCallbackRequest, 
  getCallbackRequests, 
  getCallbackRequest,
  updateCallbackRequest,
  updateCallbackStatus,
  deleteCallbackRequest
} = require('../controllers/callbackController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', createCallbackRequest);

router.get('/', protect, getCallbackRequests);
router.get('/:id', protect, getCallbackRequest);
router.put('/:id', protect, updateCallbackRequest);
router.patch('/:id/status', protect, updateCallbackStatus);
router.delete('/:id', protect, deleteCallbackRequest);

module.exports = router;