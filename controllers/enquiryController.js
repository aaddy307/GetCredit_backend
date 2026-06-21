import Enquiry from '../models/Enquiry.js';
import { sendCustomerEmail, sendAdminNotification } from '../utils/sendEmail.js';

const ALLOWED_CREATE_FIELDS = [
  'fullName', 'phone', 'email', 'city', 'message', 'loanType',
  'loanAmount', 'downPayment', 'interestRate', 'tenure', 'tenureUnit', 'emi',
  'qualification', 'degree', 'abroad', 'propertyType',
  'propertyLocation', 'employmentType', 'institutionName', 'propertyValue',
  'websiteUrl', 'businessVintage', 'vehicleType'
];

const ALLOWED_UPDATE_FIELDS = [
  'fullName', 'phone', 'email', 'city', 'message', 'loanType',
  'loanAmount', 'status', 'notes', 'followUpDate', 'assignedTo',
  'propertyType', 'propertyLocation', 'employmentType',
  'institutionName', 'propertyValue', 'qualification', 'degree',
  'businessVintage', 'vehicleType', 'downPayment', 'tenure', 'tenureUnit'
];

const VALID_STATUSES = ['Pending', 'In Review', 'Approved', 'Rejected', 'Closed', 'Running', 'Completed'];
const VALID_LOAN_TYPES = ['Home Loan', 'Loan Against Property', 'Education Loan', 'Personal Loan', 'Non-Salaried Loan', 'Business Loan', 'Vehicle Loan', 'Callback Request', 'Contact Form'];

const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>/g, '').trim();
};

export const createEnquiry = async (req, res) => {
  try {
    if (req.body.websiteUrl) {
      return res.status(201).json({
        success: true,
        message: 'Enquiry submitted successfully'
      });
    }

    const {
      fullName, phone, email, city, message, loanType, loanAmount,
      downPayment, interestRate, tenure, tenureUnit, emi,
      qualification, degree, abroad, propertyType, propertyLocation,
      employmentType, institutionName, propertyValue, leadSource,
      businessVintage, vehicleType
    } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }
    if (!email || !email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid email is required' });
    }
    if (!loanType || !VALID_LOAN_TYPES.includes(loanType)) {
      return res.status(400).json({ success: false, message: 'Valid loan type is required' });
    }

    const isCallbackRequest = loanType === 'Callback Request';
    if (!isCallbackRequest && (!loanAmount || isNaN(loanAmount) || loanAmount <= 0)) {
      return res.status(400).json({ success: false, message: 'Valid loan amount is required' });
    }

    let calculatedEmi = emi || 0;
    if (!calculatedEmi && loanAmount && interestRate !== undefined && interestRate !== null && tenure) {
      const monthlyRate = interestRate / 12 / 100;
      const months = tenure * 12;
      if (monthlyRate === 0) {
        calculatedEmi = Math.round(loanAmount / months);
      } else {
        const compoundFactor = Math.pow(1 + monthlyRate, months);
        calculatedEmi = compoundFactor > 1
          ? Math.round((loanAmount * monthlyRate * compoundFactor) / (compoundFactor - 1))
          : Math.round(loanAmount / months);
      }
    }

    const enquiryData = {
      fullName: sanitizeString(fullName),
      phone: sanitizeString(phone),
      email: email.toLowerCase().trim(),
      city: city ? sanitizeString(city) : '',
      message: message ? sanitizeString(message) : '',
      loanType,
      status: 'Pending',
      leadSource: leadSource || 'Website - Enquiry Page'
    };

    if (isCallbackRequest) {
      enquiryData.loanAmount = 0;
      enquiryData.callbackStatus = 'Pending';
    } else {
      enquiryData.loanAmount = Number(loanAmount);
      enquiryData.downPayment = downPayment ? Number(downPayment) : 0;
      enquiryData.interestRate = interestRate ? Number(interestRate) : undefined;
      enquiryData.tenure = tenure ? Number(tenure) : undefined;
      enquiryData.tenureUnit = tenureUnit === 'Years' || tenureUnit === 'Months' ? tenureUnit : undefined;
      enquiryData.emi = calculatedEmi;
      enquiryData.qualification = qualification ? sanitizeString(qualification) : '';
      enquiryData.degree = degree ? sanitizeString(degree) : '';
      enquiryData.abroad = abroad ? sanitizeString(abroad) : '';
      enquiryData.propertyType = propertyType ? sanitizeString(propertyType) : '';
      enquiryData.propertyLocation = propertyLocation ? sanitizeString(propertyLocation) : '';
      if (employmentType && ['Salaried', 'Self-Employed', 'Business Owner'].includes(employmentType)) {
        enquiryData.employmentType = sanitizeString(employmentType);
      }
      enquiryData.institutionName = institutionName ? sanitizeString(institutionName) : '';
      enquiryData.propertyValue = propertyValue ? Number(propertyValue) : undefined;
      enquiryData.businessVintage = businessVintage ? Number(businessVintage) : undefined;
      enquiryData.vehicleType = vehicleType ? sanitizeString(vehicleType) : '';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [existingByEmail, existingByPhone] = await Promise.all([
      Enquiry.findOne({
        email: email.toLowerCase().trim(),
        createdAt: { $gte: today, $lt: tomorrow }
      }),
      Enquiry.findOne({
        phone: sanitizeString(phone),
        createdAt: { $gte: today, $lt: tomorrow }
      })
    ]);

    if (existingByEmail) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered today. Our executive will contact you shortly.'
      });
    }

    if (existingByPhone) {
      return res.status(409).json({
        success: false,
        message: 'This phone number is already registered today. Our executive will contact you shortly.'
      });
    }

    const enquiry = await Enquiry.create(enquiryData);

    let emailWarning = null;
    try {
      if (!isCallbackRequest) {
        await sendCustomerEmail(email, fullName, loanType, calculatedEmi, tenure, tenureUnit, phone, city, loanAmount);
      }
      await sendAdminNotification(enquiry);
    } catch (e) {
      emailWarning = e.message;
    }

    res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully',
      ...(emailWarning ? { emailWarning } : {})
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

export const getAllEnquiries = async (req, res) => {
  try {
    const { page = 1, limit = 50, search, status, loanType, dateFrom, dateTo, leadSource } = req.query;
    const limitNum = Math.min(Math.max(1, parseInt(limit) || 50), 100);
    const skip = (Math.max(1, parseInt(page)) - 1) * limitNum;

    let query = {};

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { fullName: { $regex: escaped, $options: 'i' } },
        { phone: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
        { city: { $regex: escaped, $options: 'i' } }
      ];
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (loanType && loanType !== 'All') {
      query.loanType = loanType;
    }

    if (leadSource && leadSource !== 'All') {
      query.leadSource = { $regex: leadSource.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const enquiries = await Enquiry.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Enquiry.countDocuments(query);

    res.json({
      success: true,
      count: enquiries.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limitNum),
      enquiries
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

export const getEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    res.json({ success: true, enquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

export const updateEnquiryStatus = async (req, res) => {
  try {
    const updateData = {};

    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (req.body[field] !== undefined) {
        let value = req.body[field];

        if (typeof value === 'string') {
          value = sanitizeString(value);
        }

        if (field === 'status' && !VALID_STATUSES.includes(value)) {
          return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        if (field === 'loanType' && !VALID_LOAN_TYPES.includes(value)) {
          return res.status(400).json({ success: false, message: 'Invalid loan type' });
        }

        updateData[field] = value;
      }
    }

    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    res.json({
      success: true,
      message: 'Enquiry updated successfully',
      enquiry
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

export const deleteEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findByIdAndDelete(req.params.id);

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    res.json({ success: true, message: 'Enquiry deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const totalLeads = await Enquiry.countDocuments();
    const newLeads = await Enquiry.countDocuments({ status: 'Pending' });
    const running = await Enquiry.countDocuments({ status: 'Running' });
    const completed = await Enquiry.countDocuments({ status: 'Completed' });
    const rejected = await Enquiry.countDocuments({ status: 'Rejected' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayFollowUps = await Enquiry.countDocuments({
      followUpDate: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    });

    res.json({
      success: true,
      data: {
        totalLeads,
        newLeads,
        pending: newLeads,
        running,
        completed,
        rejected,
        todayFollowUps
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};