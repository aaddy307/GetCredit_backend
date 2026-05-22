const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const Admin = require('../models/Admin');

async function connectTestDB() {
  const dbPath = path.join(__dirname, '.db-uri');
  if (fs.existsSync(dbPath)) {
    const uri = fs.readFileSync(dbPath, 'utf-8').trim();
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(uri);
    }
  }
}

async function disconnectTestDB() {
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
}

async function clearCollections() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

async function createTestAdmin(overrides = {}) {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(overrides.password || 'TestAdmin@123', salt);

  const admin = await Admin.create({
    name: overrides.name || 'Test Admin',
    email: overrides.email || 'admin@test.com',
    password: hashedPassword,
    role: 'admin',
    phone: '9876543210',
    notifications: { email: true, dashboard: true },
    business: {
      companyName: 'Test Company',
      companyEmail: 'test@company.com',
      companyPhone: '9876543210',
      address: 'Test Address',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      gstNumber: '',
    },
    ...overrides,
  });

  return admin;
}

function generateToken(adminId) {
  return jwt.sign({ id: adminId.toString() }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

module.exports = {
  connectTestDB,
  disconnectTestDB,
  clearCollections,
  createTestAdmin,
  generateToken,
};
