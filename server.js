require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');

const adminRoutes = require('./routes/adminRoutes');
const adminAnalyticsRoutes = require('./routes/adminAnalyticsRoutes');

const adminUsersRoutes = require('./routes/adminUsersRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');
const calculatorRoutes = require('./routes/calculatorRoutes');

const blogRoutes = require('./routes/blogRoutes');
const emiEnquiryRoutes = require('./routes/emiEnquiryRoutes');
const callbackRoutes = require('./routes/callbackRoutes');
const adminStatsRoutes = require('./routes/adminStatsRoutes');
const searchRoutes = require('./routes/searchRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const leadExportRoutes = require('./routes/leadExportRoutes');
const adminAllLeadsRoutes = require('./routes/adminAllLeadsRoutes');
const adminEmailRoutes = require('./routes/adminEmailRoutes');
const exportRoutes = require('./routes/exportRoutes');

const app = express();

app.set('trust proxy', 1);

const migrateRoles = async () => {
  const Admin = require('./models/Admin');
  const result = await Admin.updateMany(
    { role: { $nin: ['admin'] } },
    { $set: { role: 'admin' } }
  );
  if (result.modifiedCount > 0) {
    console.log(`Migrated ${result.modifiedCount} admin(s) to new role schema`);
  }
};

// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : null;
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || !allowedOrigins) return callback(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o.replace(/\/$/, '')))) {
      return callback(null, true);
    }
    callback(null, false);
  },
  credentials: true
}));

// Body size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Failed-login IP rate limiter: escalating lockout
//   6 failed attempts → 5 min lock, then 10, 15, 20, 25, 30 (cap)
const failedLoginLimiter = (() => {
  const attempts = new Map();

  // Cleanup stale entries every 5 minutes (skip in test mode)
  if (process.env.NODE_ENV !== 'test') {
    setInterval(() => {
      const now = Date.now();
      for (const [ip, data] of attempts) {
        if (!data.lockedUntil && now - data.lastAttempt > 30 * 60 * 1000) {
          attempts.delete(ip);
        }
      }
    }, 5 * 60 * 1000);
  }

  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    let record = attempts.get(ip);

    if (!record) {
      record = { count: 0, lockLevel: 0, lockedUntil: null, lastAttempt: now };
      attempts.set(ip, record);
    }

    // Check if currently locked
    if (record.lockedUntil && now < record.lockedUntil) {
      const remaining = Math.ceil((record.lockedUntil - now) / 60000);
      return res.status(429).json({
        success: false,
        message: `Too many failed login attempts. Please try again after ${remaining} minute${remaining !== 1 ? 's' : ''}.`
      });
    }

    // Lock has expired — clear it
    if (record.lockedUntil) {
      record.lockedUntil = null;
    }

    const originalJson = res.json.bind(res);
    res.json = function (body) {
      if (res.statusCode === 400 || res.statusCode === 401 || res.statusCode === 423) {
        record.count++;
        record.lastAttempt = Date.now();

        if (record.count >= 6) {
          const lockMinutes = Math.min((record.lockLevel + 1) * 5, 30);
          record.lockedUntil = Date.now() + lockMinutes * 60 * 1000;
          record.lockLevel++;
          record.count = 0;
        }
      }

      // Successful login — reset everything
      if (res.statusCode === 200 && body && body.success) {
        attempts.delete(ip);
      }

      return originalJson(body);
    };

    next();
  };
})();

app.use('/api/admin/login', failedLoginLimiter);

app.use('/api/admin', adminRoutes);
app.use('/api/admin/analytics', adminAnalyticsRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/enquiry', enquiryRoutes);
app.use('/api/calculator', calculatorRoutes);

app.use('/api/blogs', blogRoutes);
app.use('/api/emi', emiEnquiryRoutes);
app.use('/api/callback', callbackRoutes);
app.use('/api/admin', adminStatsRoutes);
app.use('/api/admin', searchRoutes);
app.use('/api/admin/notifications', notificationRoutes);
app.use('/api/admin', adminAllLeadsRoutes);
app.use('/api/admin/leads', leadExportRoutes);
app.use('/api/admin/email', adminEmailRoutes);
app.use('/api/export', exportRoutes);


// Health endpoint (must be before catch-all)
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Get Credit API is running' });
});

// Catch-all for undefined API routes - returns JSON, not HTML
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!'
  });
});

// Graceful shutdown
const closeServers = () => {
  process.exit(0);
};

process.on('SIGTERM', closeServers);
process.on('SIGINT', closeServers);

// Handle unhandled promise rejections to prevent server crashes
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
});

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  await migrateRoles();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

if (process.env.NODE_ENV !== 'test') {
  start();
}

module.exports = { app, start };
