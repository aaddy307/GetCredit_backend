const { MongoMemoryServer } = require('mongodb-memory-server');
const fs = require('fs');
const path = require('path');

module.exports = async () => {
  const instance = await MongoMemoryServer.create();
  const uri = instance.getUri();

  const dbPath = path.join(__dirname, '.db-uri');
  fs.writeFileSync(dbPath, uri, 'utf-8');

  process.env.MONGO_URI = uri;
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret_key_2024';
  process.env.ADMIN_EMAIL = 'test@get-credit.in';
  process.env.RESEND_API_KEY = 're_test_key';
  process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
};
