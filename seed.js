require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

console.warn('WARNING: This seed script uses a hardcoded default password.');
console.warn('Change the password immediately after first login.\n');

const seedAdmin = async () => {
  await connectDB();

  const adminExists = await Admin.findOne({ email: 'admin@getcredit.com' });

  if (adminExists) {
    console.log('Admin already exists');
  } else {
    await Admin.create({
      email: 'admin@getcredit.com',
      password: 'Admin@123456',
      name: 'Admin'
    });
    console.log('Admin created successfully');
    console.log('Email: admin@getcredit.com');
    console.log('Password: Admin@123456');
    console.warn('\nIMPORTANT: Change the default password after first login.');
  }

  process.exit();
};

seedAdmin();