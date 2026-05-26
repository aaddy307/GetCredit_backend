import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Admin from '../models/Admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function connectTestDB() {
  const dbPath = path.join(__dirname, '.db-uri');
  if (fs.existsSync(dbPath)) {
    const uri = fs.readFileSync(dbPath, 'utf-8').trim();
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(uri);
    }
  }
}

export async function disconnectTestDB() {
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
}

export async function clearCollections() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

export async function createTestAdmin(overrides = {}) {
  const plainPassword = overrides.password || 'TestAdmin@123';

  const admin = await Admin.create({
    name: overrides.name || 'Test Admin',
    email: overrides.email || 'admin@test.com',
    password: plainPassword,
    role: 'admin',
    phone: '9876543210',
    ...overrides,
  });

  return admin;
}

export function generateToken(adminId) {
  return jwt.sign({ id: adminId.toString() }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}