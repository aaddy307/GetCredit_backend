import 'dotenv/config';
import mongoose from 'mongoose';
import Enquiry from '../models/Enquiry.js';
import HomeLoanEnquiry from '../models/HomeLoanEnquiry.js';
import LAPEnquiry from '../models/LAPEnquiry.js';
import EducationLoanEnquiry from '../models/EducationLoanEnquiry.js';
import PersonalLoanEnquiry from '../models/PersonalLoanEnquiry.js';
import BusinessLoanEnquiry from '../models/BusinessLoanEnquiry.js';
import VehicleLoanEnquiry from '../models/VehicleLoanEnquiry.js';
import CallbackRequest from '../models/CallbackRequest.js';

const collections = [
  { name: 'Enquiries', model: Enquiry },
  { name: 'Home Loan Enquiries', model: HomeLoanEnquiry },
  { name: 'LAP Enquiries', model: LAPEnquiry },
  { name: 'Education Loan Enquiries', model: EducationLoanEnquiry },
  { name: 'Personal Loan Enquiries', model: PersonalLoanEnquiry },
  { name: 'Business Loan Enquiries', model: BusinessLoanEnquiry },
  { name: 'Vehicle Loan Enquiries', model: VehicleLoanEnquiry },
  { name: 'Callback Requests', model: CallbackRequest },
];

async function cleanup() {
  if (process.env.CLEANUP_CONFIRM !== 'yes') {
    console.error('ERROR: This script permanently deletes ALL lead data.');
    console.error('Set CLEANUP_CONFIRM=yes environment variable to run.');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    let totalDeleted = 0;

    for (const { name, model } of collections) {
      const count = await model.countDocuments();
      if (count > 0) {
        await model.deleteMany({});
        console.log(`Deleted ${count} documents from ${name}`);
        totalDeleted += count;
      } else {
        console.log(`${name} — already empty`);
      }
    }

    console.log(`\nDone. Total documents deleted: ${totalDeleted}`);
  } catch (error) {
    console.error('Cleanup error:', error.message);
    process.exit(1);
  }
  process.exit(0);
}

cleanup();