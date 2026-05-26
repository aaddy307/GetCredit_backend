import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from './config/db.js';
import Admin from './models/Admin.js';

import adminRoutes from './routes/adminRoutes.js';
import adminAnalyticsRoutes from './routes/adminAnalyticsRoutes.js';
import adminUsersRoutes from './routes/adminUsersRoutes.js';
import enquiryRoutes from './routes/enquiryRoutes.js';
import calculatorRoutes from './routes/calculatorRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import emiEnquiryRoutes from './routes/emiEnquiryRoutes.js';
import callbackRoutes from './routes/callbackRoutes.js';
import adminStatsRoutes from './routes/adminStatsRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import leadExportRoutes from './routes/leadExportRoutes.js';
import adminAllLeadsRoutes from './routes/adminAllLeadsRoutes.js';
import adminEmailRoutes from './routes/adminEmailRoutes.js';
import exportRoutes from './routes/exportRoutes.js';

const app = express();

app.set('trust proxy', 1);

const migrateRoles = async () => {
  try {
    const result = await Admin.updateMany(
      { role: { $nin: ['admin'] } },
      { $set: { role: 'admin' } }
    );
    if (result.modifiedCount > 0) {
      console.log(`Migrated ${result.modifiedCount} admin(s) to new role schema`);
    }
  } catch (err) {
    console.error('Role migration error:', err.message);
  }
};

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
}));

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

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const failedLoginAttempts = new Map();

export const resetRateLimiter = () => {
  failedLoginAttempts.clear();
};

const failedLoginLimiter = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  let record = failedLoginAttempts.get(ip);

  if (!record) {
    record = { count: 0, lockedUntil: null, lastAttempt: now };
    failedLoginAttempts.set(ip, record);
  }

  record.lastAttempt = now;

  if (record.lockedUntil && now < record.lockedUntil) {
    const remaining = Math.ceil((record.lockedUntil - now) / 60000);
    return res.status(429).json({
      success: false,
      message: `Too many failed login attempts. Please try again after ${remaining} minute${remaining !== 1 ? 's' : ''}.`
    });
  }

  if (record.lockedUntil) {
    record.lockedUntil = null;
  }

  record.req = req;
  record.res = res;

  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (res.statusCode === 401) {
      record.count++;
      if (record.count >= 6) {
        record.lockedUntil = Date.now() + 5 * 60 * 1000;
        record.count = 0;
      }
    }

    if (res.statusCode === 200 && body && body.success) {
      failedLoginAttempts.delete(ip);
    }

    return originalJson(body);
  };

  next();
};

if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of failedLoginAttempts) {
      if (!data.lockedUntil && now - data.lastAttempt > 30 * 60 * 1000) {
        failedLoginAttempts.delete(ip);
      }
    }
  }, 5 * 60 * 1000);
}

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

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Get Credit API is running' });
});

app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong!' });
});

const closeServers = () => {
  process.exit(0);
};

process.on('SIGTERM', closeServers);
process.on('SIGINT', closeServers);

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

export { app, start };