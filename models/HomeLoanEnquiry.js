const mongoose = require('mongoose');

const homeLoanEnquirySchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter a valid email']
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    maxlength: 100
  },
  loanAmount: {
    type: Number,
    required: [true, 'Loan amount is required'],
    min: [10000, 'Loan amount must be at least ₹10,000'],
    max: [100000000, 'Loan amount cannot exceed ₹10 Crore']
  },
  propertyType: {
    type: String,
    enum: ['Ready to Move', 'Under Construction', 'Plot + Construction', 'Resale'],
    default: 'Ready to Move'
  },
  propertyLocation: {
    type: String,
    trim: true,
    maxlength: 200
  },
  employmentType: {
    type: String,
    enum: ['Salaried', 'Self-Employed', 'Business Owner'],
    default: 'Salaried'
  },
  interestRate: {
    type: Number,
    required: [true, 'Interest rate is required'],
    min: 0,
    max: 50
  },
  tenureYears: {
    type: Number,
    required: [true, 'Tenure is required'],
    min: 1,
    max: 30
  },
  calculatedEMI: {
    type: Number,
    required: [true, 'EMI is required']
  },
  totalInterest: {
    type: Number
  },
  totalPayable: {
    type: Number
  },
  source: {
    type: String,
    default: 'home_loan'
  },
  status: {
    type: String,
    enum: ['Pending', 'In Review', 'Approved', 'Rejected', 'Closed'],
    default: 'Pending'
  },
  notes: {
    type: String,
    maxlength: 2000
  },
  leadSource: {
    type: String,
    default: 'EMI Calculator'
  }
}, {
  timestamps: true
});

homeLoanEnquirySchema.index({ email: 1 });
homeLoanEnquirySchema.index({ mobile: 1 });
homeLoanEnquirySchema.index({ createdAt: -1 });
homeLoanEnquirySchema.index({ status: 1 });
homeLoanEnquirySchema.index({ city: 1 });

module.exports = mongoose.model('HomeLoanEnquiry', homeLoanEnquirySchema);