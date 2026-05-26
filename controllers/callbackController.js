import CallbackRequest from '../models/CallbackRequest.js';
import { sendCustomerEmail, sendAdminNotification } from '../utils/sendEmail.js';

const VALID_STATUSES = ['Pending', 'Called', 'Closed'];

const validateCallbackRequest = (data, isUpdate = false) => {
  const errors = [];

  if (!isUpdate || data.fullName !== undefined) {
    if (!data.fullName || data.fullName.trim().length < 2) {
      errors.push('Full name must be at least 2 characters');
    }
  }

  if (!isUpdate || data.phone !== undefined) {
    if (!data.phone || !/^[6-9]\d{9}$/.test(data.phone)) {
      errors.push('Please enter a valid 10-digit Indian mobile number');
    }
  }

  if (!isUpdate || data.email !== undefined) {
    if (!data.email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(data.email)) {
      errors.push('Please enter a valid email address');
    }
  }

  return errors;
};

export const createCallbackRequest = async (req, res) => {
  try {
    const errors = validateCallbackRequest(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const { fullName, phone, email, city } = req.body;

    // Duplicate prevention: reject same phone in same day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingToday = await CallbackRequest.findOne({
      phone,
      createdAt: { $gte: today, $lt: tomorrow }
    });

    if (existingToday) {
      return res.status(400).json({
        success: false,
        message: 'A callback request with this phone number was already submitted today.'
      });
    }

    const callback = await CallbackRequest.create({
      fullName,
      phone,
      email,
      city: city || '',
      status: 'Pending',
      source: 'Website - Callback Request'
    });

    let emailWarning = null;
    try {
      await sendCustomerEmail(callback.email, callback.fullName, 'Callback Request', 0, 0, '', callback.phone);
      await sendAdminNotification({
        fullName: callback.fullName,
        phone: callback.phone,
        email: callback.email,
        city: callback.city,
        loanType: 'Callback Request',
        loanAmount: 0,
        interestRate: 0,
        tenure: 0,
        emi: 0,
        createdAt: callback.createdAt
      });
    } catch (e) {
      emailWarning = e.message;
    }

    res.status(201).json({
      success: true,
      message: 'Callback request submitted successfully',
      data: callback,
      ...(emailWarning ? { emailWarning } : {})
    });
  } catch (error) {
    res.status(500).json({ success: false, errors: ['Server error. Please try again.'] });
  }
};

export const getCallbackRequests = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { fullName: { $regex: escaped, $options: 'i' } },
        { phone: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
        { city: { $regex: escaped, $options: 'i' } }
      ];
    }

    const [callbacks, total, pendingCount, calledCount, closedCount] = await Promise.all([
      CallbackRequest.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      CallbackRequest.countDocuments(query),
      CallbackRequest.countDocuments({ status: 'Pending' }),
      CallbackRequest.countDocuments({ status: 'Called' }),
      CallbackRequest.countDocuments({ status: 'Closed' })
    ]);

    res.json({
      success: true,
      data: callbacks,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      },
      stats: {
        total: pendingCount + calledCount + closedCount,
        pending: pendingCount,
        called: calledCount,
        closed: closedCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

export const getCallbackRequest = async (req, res) => {
  try {
    const callback = await CallbackRequest.findById(req.params.id);

    if (!callback) {
      return res.status(404).json({ success: false, message: 'Callback request not found' });
    }

    res.json({ success: true, data: callback });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

export const updateCallbackRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const errors = validateCallbackRequest(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const updateFields = {};
    const allowed = ['fullName', 'phone', 'email', 'city', 'status', 'notes'];
    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        updateFields[field] = field === 'city' || field === 'notes' ? req.body[field] || '' : req.body[field];
      }
    }
    if (updateFields.status && !VALID_STATUSES.includes(updateFields.status)) {
      return res.status(400).json({ success: false, message: `Valid status is required: ${VALID_STATUSES.join(', ')}` });
    }

    const callback = await CallbackRequest.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!callback) {
      return res.status(404).json({ success: false, message: 'Callback request not found' });
    }

    res.json({
      success: true,
      message: 'Callback request updated successfully',
      data: callback
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

export const updateCallbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Valid status is required: ${VALID_STATUSES.join(', ')}`
      });
    }

    const callback = await CallbackRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!callback) {
      return res.status(404).json({ success: false, message: 'Callback request not found' });
    }

    res.json({
      success: true,
      message: 'Status updated successfully',
      data: callback
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

export const deleteCallbackRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const callback = await CallbackRequest.findByIdAndDelete(id);

    if (!callback) {
      return res.status(404).json({ success: false, message: 'Callback request not found' });
    }

    res.json({ success: true, message: 'Callback request deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};