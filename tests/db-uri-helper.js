const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function connectDB() {
  const dbPath = path.join(__dirname, '.db-uri');
  if (fs.existsSync(dbPath)) {
    const uri = fs.readFileSync(dbPath, 'utf-8').trim();
    if (mongoose.connection.readyState !== 1 && mongoose.connection.readyState !== 2) {
      await mongoose.connect(uri);
    }
  }
}

async function disconnectDB() {
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
}

async function clearDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

module.exports = { connectDB, disconnectDB, clearDB };
