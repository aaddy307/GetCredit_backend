import 'dotenv/config';
import mongoose from 'mongoose';
import Admin from './models/Admin.js';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const seedAdmin = async () => {
  await connectDB();

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@getcredit.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@123456';

  console.warn('WARNING: This seed script uses a default password.');

  const adminExists = await Admin.findOne({ email: adminEmail });

  if (adminExists) {
    console.log('Admin already exists');
  } else {
    await Admin.create({
      email: adminEmail,
      password: adminPassword,
      name: 'Admin'
    });
    console.log('Admin created successfully');
    console.log(`Email: ${adminEmail}`);
    if (!process.env.SEED_ADMIN_PASSWORD) {
      console.warn('\nIMPORTANT: Change the default password after first login.');
    }
  }

  process.exit();
};

seedAdmin();