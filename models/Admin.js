import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ROLES = {
  ADMIN: 'admin'
};

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 12,
    maxlength: 128
  },
  name: {
    type: String,
    default: 'Admin',
    trim: true,
    maxlength: 100
  },
  role: {
    type: String,
    default: ROLES.ADMIN
  },
  phone: {
    type: String,
    default: '',
    trim: true,
    maxlength: 20
  },
  notifications: {
    emailOnNewLead: {
      type: Boolean,
      default: true
    },
    emailOnStatusChange: {
      type: Boolean,
      default: true
    },
    emailOnCallbackRequest: {
      type: Boolean,
      default: true
    },
    dailyLeadsSummary: {
      type: Boolean,
      default: false
    }
  },
  business: {
    name: {
      type: String,
      default: 'Get Credit',
      maxlength: 100
    },
    supportEmail: {
      type: String,
      default: '',
      trim: true
    },
    supportPhone: {
      type: String,
      default: '',
      trim: true,
      maxlength: 20
    },
    websiteUrl: {
      type: String,
      default: '',
      trim: true
    }
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  },
  sessionTokens: [{
    token: {
      type: String,
      required: true
    },
    refreshToken: {
      type: String,
      required: true
    },
    createdAt: { type: Date, default: Date.now },
    lastUsed: { type: Date, default: Date.now },
    userAgent: String,
    ip: String
  }],
  allTokensInvalidated: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

adminSchema.pre('save', async function(next) {
  if (this.isModified('role') && this.role && this.role !== 'admin') {
    this.role = 'admin';
  }
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

adminSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

adminSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

adminSchema.methods.incrementLoginAttempts = function() {
  this.loginAttempts += 1;
  if (this.loginAttempts >= 5) {
    this.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
  }
};

adminSchema.methods.resetLoginAttempts = function() {
  this.loginAttempts = 0;
  this.lockUntil = null;
};

adminSchema.methods.invalidateAllSessions = function() {
  this.allTokensInvalidated = true;
  this.sessionTokens = [];
};

export default mongoose.model('Admin', adminSchema);