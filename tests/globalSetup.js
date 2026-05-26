import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async () => {
  const instance = await MongoMemoryServer.create();
  const uri = instance.getUri();

  const dbPath = path.join(__dirname, '.db-uri');
  fs.writeFileSync(dbPath, uri, 'utf-8');

  process.env.MONGO_URI = uri;
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'c5f8a2d9b3e74106f1e8d4c9a7b6f2e3d1c0a5b8f9e6d7c4a3b2f1e0d9c8a7b6';
  process.env.ADMIN_EMAIL = 'test@get-credit.in';
  process.env.RESEND_API_KEY = 're_test_key';
  process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
};