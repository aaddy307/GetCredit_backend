require('dotenv').config();
const mongoose = require('mongoose');
const Enquiry = require('../models/Enquiry');
const HomeLoanEnquiry = require('../models/HomeLoanEnquiry');
const LAPEnquiry = require('../models/LAPEnquiry');
const EducationLoanEnquiry = require('../models/EducationLoanEnquiry');
const PersonalLoanEnquiry = require('../models/PersonalLoanEnquiry');
const BusinessLoanEnquiry = require('../models/BusinessLoanEnquiry');
const VehicleLoanEnquiry = require('../models/VehicleLoanEnquiry');
const CallbackRequest = require('../models/CallbackRequest');

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
