import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/permissionMiddleware.js';
import Admin from '../models/Admin.js';

const router = Router();

router.get('/', protect, requirePermission('users', 'read'), async (req, res) => {
  try {
    const admins = await Admin.find().select('-password -sessionTokens -allTokensInvalidated -loginAttempts -lockUntil');
    res.json({ success: true, admins });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

router.post('/', protect, requirePermission('users', 'create'), async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    if (role && role !== 'admin') {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const exists = await Admin.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const admin = await Admin.create({ email, password, name, role });
    res.status(201).json({
      success: true,
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

router.put('/:id', protect, requirePermission('users', 'update'), async (req, res) => {
  try {
    const { name, role } = req.body;
    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    if (name) admin.name = name;
    if (role === 'admin') admin.role = role;

    await admin.save();
    res.json({
      success: true,
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

router.delete('/:id', protect, requirePermission('users', 'delete'), async (req, res) => {
  try {
    if (req.params.id === req.admin._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
    }

    const admin = await Admin.findByIdAndDelete(req.params.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    res.json({ success: true, message: 'Admin deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

export default router;