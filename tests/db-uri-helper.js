import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function connectDB() {
  const dbPath = path.join(__dirname, '.db-uri');
  if (fs.existsSync(dbPath)) {
    const uri = fs.readFileSync(dbPath, 'utf-8').trim();
    if (mongoose.connection.readyState !== 1 && mongoose.connection.readyState !== 2) {
      await mongoose.connect(uri);
    }
  }
}

export async function disconnectDB() {
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
}

export async function clearDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}