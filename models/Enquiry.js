import mongoose from 'mongoose';

const enquirySchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
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
  message: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  loanType: {
    type: String,
    required: [true, 'Loan type is required'],
    enum: {
      values: ['Home Loan', 'Loan Against Property', 'Education Loan', 'Personal Loan', 'Non-Salaried Loan', 'Business Loan', 'Vehicle Loan', 'Callback Request', 'Contact Form'],
      message: 'Invalid loan type'
    }
  },
  loanAmount: {
    type: Number,
    default: 0,
    min: [10000, 'Loan amount must be at least ₹10,000'],
    validate: {
      validator: function(v) {
        if (this.loanType === 'Non-Salaried Loan' && v > 1000000) {
          throw new Error('Loan amount cannot exceed ₹10 lakhs');
        }
        if (v > 100000000) {
          throw new Error('Loan amount cannot exceed ₹10 Crore');
        }
        return true;
      }
    }
  },
  callbackStatus: {
    type: String,
    enum: ['Pending', 'Contacted', 'Completed'],
    default: 'Pending'
  },
  downPayment: {
    type: Number,
    default: 0,
    min: 0
  },
  interestRate: {
    type: Number,
    min: 0,
    max: 50
  },
  tenure: {
    type: Number,
    min: 1,
    max: 84
  },
  tenureUnit: {
    type: String,
    enum: ['Years', 'Months'],
    default: 'Years'
  },
  emi: {
    type: Number
  },
  qualification: {
    type: String,
    maxlength: 100
  },
  degree: {
    type: String,
    maxlength: 100
  },
  abroad: {
    type: String,
    maxlength: 100
  },
  status: {
    type: String,
    enum: {
      values: ['Pending', 'In Review', 'Approved', 'Rejected', 'Closed', 'Running', 'Completed'],
      message: 'Invalid status'
    },
    default: 'Pending'
  },
  leadSource: {
    type: String,
    default: 'Website',
    enum: ['Website - Apply Now', 'Website - Enquiry Page', 'Website - EMI Calculator', 'Website - Contact Form', 'Website - Callback Request', 'Admin', 'Admin - Manual Entry', 'Referral', 'Advertisement', 'Other']
  },
  notes: {
    type: String,
    maxlength: 2000
  },
  followUpDate: {
    type: Date
  },
  assignedTo: {
    type: String,
    maxlength: 100
  },
  propertyType: {
    type: String,
    maxlength: 100
  },
  propertyLocation: {
    type: String,
    maxlength: 200
  },
  employmentType: {
    type: String,
    maxlength: 50,
    enum: ['Salaried', 'Self-Employed', 'Business Owner']
  },
  institutionName: {
    type: String,
    maxlength: 200
  },
  propertyValue: {
    type: Number,
    min: 0,
    max: 100000000
  },
  businessVintage: {
    type: Number,
    min: 0,
    max: 50
  },
  vehicleType: {
    type: String,
    trim: true,
    maxlength: 100
  }
}, {
  timestamps: true
});

enquirySchema.index({ email: 1 });
enquirySchema.index({ phone: 1 });
enquirySchema.index({ status: 1 });
enquirySchema.index({ createdAt: -1 });
enquirySchema.index({ loanType: 1 });
enquirySchema.index({ status: 1, createdAt: -1 });
enquirySchema.index({ assignedTo: 1, status: 1 });
enquirySchema.index({ followUpDate: 1 });
enquirySchema.index({ assignedTo: 1 });

export default mongoose.model('Enquiry', enquirySchema);