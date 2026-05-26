import { Router } from 'express';
import {
  createCallbackRequest,
  getCallbackRequests,
  getCallbackRequest,
  updateCallbackRequest,
  updateCallbackStatus,
  deleteCallbackRequest
} from '../controllers/callbackController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', createCallbackRequest);
router.get('/', protect, getCallbackRequests);
router.get('/:id', protect, getCallbackRequest);
router.put('/:id', protect, updateCallbackRequest);
router.patch('/:id/status', protect, updateCallbackStatus);
router.delete('/:id', protect, deleteCallbackRequest);

export default router;