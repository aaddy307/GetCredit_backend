import mongoose from 'mongoose';

const LOAN_TYPES = ['Home Loan', 'Loan Against Property', 'Education Loan', 'Personal Loan', 'Business Loan', 'Vehicle Loan'];

const PROPERTY_TYPES_HOME = ['Ready to Move', 'Under Construction', 'Plot + Construction', 'Resale'];
const PROPERTY_TYPES_LAP = ['Residential', 'Commercial', 'Industrial', 'Plot'];
const VEHICLE_TYPES = ['New Car', 'Used Car', 'Two Wheeler', 'Commercial Vehicle'];
const QUALIFICATIONS = ['10th', '12th', 'Undergraduate', 'Postgraduate', 'Diploma'];
const DEGREES = ['B.Tech', 'MBA', 'MBBS', 'B.Sc', 'M.Tech', 'LLB', 'Others'];
const EMPLOYMENT_TYPES = ['Salaried', 'Self-Employed', 'Business Owner'];

const loanEnquirySchema = new mongoose.Schema({
  loanType: {
    type: String,
    required: [true, 'Loan type is required'],
    enum: {
      values: LOAN_TYPES,
      message: 'Invalid loan type'
    }
  },

  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: 100
  },

  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    maxlength: 10,
    validate: {
      validator: function(v) {
        return /^[6-9]\d{9}$/.test(v);
      },
      message: 'Please enter a valid 10-digit Indian mobile number'
    }
  },

  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    maxlength: 254,
    match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter a valid email']
  },

  city: {
    type: String,
    trim: true,
    maxlength: 100
  },

  loanAmount: {
    type: Number,
    required: [true, 'Loan amount is required'],
    min: [10000, 'Loan amount must be at least ₹10,000'],
    max: [150000000, 'Loan amount cannot exceed ₹15 Crore']
  },

  interestRate: {
    type: Number,
    required: [true, 'Interest rate is required'],
    min: 0,
    max: 50
  },

  tenure: {
    type: Number,
    required: [true, 'Tenure is required'],
    min: 1,
    max: 420
  },

  tenureUnit: {
    type: String,
    enum: ['Years', 'Months'],
    default: 'Years'
  },

  calculatedEMI: {
    type: Number,
    required: [true, 'EMI is required']
  },

  totalInterest: {
    type: Number,
    default: 0
  },

  totalPayable: {
    type: Number,
    default: 0
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
  },

  source: {
    type: String,
    default: 'Website'
  },

  downPayment: {
    type: Number,
    default: 0,
    min: 0
  },

  propertyType: {
    type: String,
    enum: [...PROPERTY_TYPES_HOME, ...PROPERTY_TYPES_LAP]
  },

  propertyLocation: {
    type: String,
    trim: true,
    maxlength: 200
  },

  propertyValue: {
    type: Number,
    min: 0,
    max: 300000000
  },

  employmentType: {
    type: String,
    enum: EMPLOYMENT_TYPES
  },

  qualification: {
    type: String,
    enum: QUALIFICATIONS
  },

  degree: {
    type: String,
    enum: DEGREES
  },

  institutionName: {
    type: String,
    trim: true,
    maxlength: 200
  },

  vehicleType: {
    type: String,
    enum: VEHICLE_TYPES
  },

  businessVintage: {
    type: Number,
    min: 0,
    max: 360
  },

  mortgagePropertyType: {
    type: String,
    enum: PROPERTY_TYPES_LAP
  }

}, {
  timestamps: true
});

loanEnquirySchema.index({ email: 1 });
loanEnquirySchema.index({ phone: 1 });
loanEnquirySchema.index({ loanType: 1 });
loanEnquirySchema.index({ status: 1 });
loanEnquirySchema.index({ createdAt: -1 });
loanEnquirySchema.index({ city: 1 });
loanEnquirySchema.index({ loanType: 1, status: 1, createdAt: -1 });

loanEnquirySchema.pre('save', function(next) {
  if (this.loanType === 'Home Loan' && this.tenureUnit === 'Years' && this.tenure > 30) {
    this.tenureUnit = 'Months';
    this.tenure = this.tenure * 12;
  }
  next();
});

export default mongoose.model('LoanEnquiry', loanEnquirySchema);
