const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

beforeAll(async () => {
  const dbPath = path.join(__dirname, '.db-uri');
  if (fs.existsSync(dbPath)) {
    const uri = fs.readFileSync(dbPath, 'utf-8').trim();
    process.env.MONGO_URI = uri;
    await mongoose.connect(uri);
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
