import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';

import HomeLoanEnquiry from '../models/HomeLoanEnquiry.js';
import LAPEnquiry from '../models/LAPEnquiry.js';
import EducationLoanEnquiry from '../models/EducationLoanEnquiry.js';
import PersonalLoanEnquiry from '../models/PersonalLoanEnquiry.js';
import BusinessLoanEnquiry from '../models/BusinessLoanEnquiry.js';
import VehicleLoanEnquiry from '../models/VehicleLoanEnquiry.js';
import LoanEnquiry from '../models/LoanEnquiry.js';

const modelConfigs = [
  { Model: HomeLoanEnquiry, loanType: 'Home Loan', typeKey: 'home' },
  { Model: LAPEnquiry, loanType: 'Loan Against Property', typeKey: 'lap' },
  { Model: EducationLoanEnquiry, loanType: 'Education Loan', typeKey: 'education' },
  { Model: PersonalLoanEnquiry, loanType: 'Personal Loan', typeKey: 'personal' },
  { Model: BusinessLoanEnquiry, loanType: 'Business Loan', typeKey: 'business' },
  { Model: VehicleLoanEnquiry, loanType: 'Vehicle Loan', typeKey: 'vehicle' },
];

const transformDocument = (doc, loanType) => {
  const base = {
    loanType,
    fullName: doc.fullName,
    phone: doc.mobile || doc.phone,
    email: doc.email,
    city: doc.city,
    loanAmount: doc.loanAmount,
    interestRate: doc.interestRate,
    tenure: doc.tenure || doc.tenureYears,
    tenureUnit: doc.tenureUnit || 'Years',
    calculatedEMI: doc.calculatedEMI,
    totalInterest: doc.totalInterest || 0,
    totalPayable: doc.totalPayable || 0,
    status: doc.status || 'Pending',
    notes: doc.notes,
    leadSource: doc.leadSource || 'EMI Calculator',
    source: doc.source || 'Website',
    downPayment: doc.downPayment || 0,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };

  switch (loanType) {
    case 'Home Loan':
      return {
        ...base,
        propertyType: doc.propertyType,
        propertyLocation: doc.propertyLocation,
        employmentType: doc.employmentType,
      };
    case 'Loan Against Property':
      return {
        ...base,
        propertyValue: doc.propertyValue,
        mortgagePropertyType: doc.mortgagePropertyType,
        propertyType: doc.propertyType,
        employmentType: doc.employmentType,
      };
    case 'Education Loan':
      return {
        ...base,
        qualification: doc.qualification,
        degree: doc.degreeType,
        institutionName: doc.institutionName,
      };
    case 'Personal Loan':
      return {
        ...base,
        employmentType: doc.employmentType,
      };
    case 'Business Loan':
      return {
        ...base,
        employmentType: doc.employmentType,
        businessVintage: doc.businessVintage,
      };
    case 'Vehicle Loan':
      return {
        ...base,
        vehicleType: doc.vehicleType,
        downPayment: doc.downPayment || 0,
      };
    default:
      return base;
  }
};

export const migrateEmiToLoanEnquiry = async (options = {}) => {
  const { dryRun = false, batchSize = 100 } = options;

  console.log(`Starting migration${dryRun ? ' (DRY RUN)' : ''}...`);
  console.log(`Batch size: ${batchSize}`);

  let totalMigrated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const config of modelConfigs) {
    const { Model, loanType } = config;
    console.log(`\nProcessing ${loanType}...`);

    const count = await Model.countDocuments();
    console.log(`Found ${count} documents in ${Model.modelName}`);

    if (count === 0) {
      console.log('No documents to migrate, skipping...');
      continue;
    }

    const existingInTarget = await LoanEnquiry.countDocuments({ loanType });
    console.log(`Already migrated: ${existingInTarget} documents`);

    const toMigrate = count - Math.min(existingInTarget, count);
    console.log(`Need to migrate: ${toMigrate} documents`);

    if (toMigrate === 0) {
      console.log('All documents already migrated, skipping...');
      continue;
    }

    let processed = 0;
    let batchNum = 0;

    while (processed < toMigrate) {
      batchNum++;
      const skip = processed;
      const limit = batchSize;

      const docs = await Model.find({})
        .skip(skip)
        .limit(limit)
        .lean();

      if (docs.length === 0) break;

      for (const doc of docs) {
        try {
          const existing = await LoanEnquiry.findOne({
            email: doc.email,
            loanType,
            createdAt: doc.createdAt,
          });

          if (existing) {
            totalSkipped++;
            continue;
          }

          if (!dryRun) {
            const transformed = transformDocument(doc, loanType);
            await LoanEnquiry.create(transformed);
          }

          totalMigrated++;
        } catch (error) {
          console.error(`Error migrating document ${doc._id}:`, error.message);
          totalErrors++;
        }
      }

      processed += docs.length;
      console.log(`Batch ${batchNum}: Processed ${processed}/${toMigrate}`);
    }
  }

  console.log('\n=== Migration Summary ===');
  console.log(`Total migrated: ${totalMigrated}`);
  console.log(`Total skipped: ${totalSkipped}`);
  console.log(`Total errors: ${totalErrors}`);

  if (dryRun) {
    console.log('\nThis was a DRY RUN. No actual changes were made.');
  }

  return { totalMigrated, totalSkipped, totalErrors };
};

export const verifyMigration = async () => {
  console.log('\n=== Verifying Migration ===');

  const results = [];

  for (const config of modelConfigs) {
    const { Model, loanType } = config;
    const sourceCount = await Model.countDocuments();
    const targetCount = await LoanEnquiry.countDocuments({ loanType });

    const match = sourceCount === targetCount;
    console.log(`${loanType}: Source=${sourceCount}, Target=${targetCount} ${match ? '✓' : '✗ MISMATCH'}`);

    results.push({
      loanType,
      sourceCount,
      targetCount,
      match,
    });
  }

  const totalSource = results.reduce((sum, r) => sum + r.sourceCount, 0);
  const totalTarget = await LoanEnquiry.countDocuments();
  console.log(`\nTotal: Source=${totalSource}, Target=${totalTarget}`);

  return results;
};

const runMigration = async () => {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const verify = args.includes('--verify');
  const batchSize = parseInt(args.find(arg => arg.startsWith('--batch='))?.split('=')[1] || '100');

  try {
    await connectDB();
    console.log('Connected to MongoDB');

    if (verify) {
      await verifyMigration();
    } else {
      await migrateEmiToLoanEnquiry({ dryRun, batchSize });
    }

    console.log('\nMigration complete!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

if (process.argv[1]?.includes('migrateEmiToLoanEnquiry')) {
  runMigration();
}

export default migrateEmiToLoanEnquiry;
