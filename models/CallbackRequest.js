import mongoose from 'mongoose';

const callbackRequestSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
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
    trim: true,
    maxlength: 100
  },
  status: {
    type: String,
    enum: ['Pending', 'Called', 'Closed'],
    default: 'Pending'
  },
  notes: {
    type: String,
    maxlength: 2000
  },
  source: {
    type: String,
    default: 'Website - Callback Request'
  }
}, {
  timestamps: true
});

callbackRequestSchema.index({ email: 1 });
callbackRequestSchema.index({ phone: 1 });
callbackRequestSchema.index({ status: 1 });
callbackRequestSchema.index({ createdAt: -1 });
callbackRequestSchema.index({ city: 1 });

export default mongoose.model('CallbackRequest', callbackRequestSchema);