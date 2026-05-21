require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
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
const exportRoutes = require('./routes/exportRoutes');

const app = express();

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
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Body size limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Rate limiters
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { success: false, message: 'Too many login attempts. Please try again later.' }
});

// Apply general rate limiter to all API routes
app.use('/api', generalLimiter);

// Apply stricter limiter to auth routes
app.use('/api/admin/login', authLimiter);

// Note: Enquiry routes have rate limiting applied at route level (see enquiryRoutes.js)

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

start();
