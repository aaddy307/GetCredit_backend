import XLSX from 'xlsx';
import HomeLoanEnquiry from '../models/HomeLoanEnquiry.js';
import LAPEnquiry from '../models/LAPEnquiry.js';
import EducationLoanEnquiry from '../models/EducationLoanEnquiry.js';
import PersonalLoanEnquiry from '../models/PersonalLoanEnquiry.js';
import BusinessLoanEnquiry from '../models/BusinessLoanEnquiry.js';
import VehicleLoanEnquiry from '../models/VehicleLoanEnquiry.js';
import { sendCustomerEmail, sendAdminNotification } from '../utils/sendEmail.js';

const validateEnquiry = (data) => {
  const errors = [];

  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.push('fullName: Enter a valid name (min 2 characters)');
  }

  if (!data.mobile || !/^[6-9]\d{9}$/.test(data.mobile)) {
    errors.push('mobile: Enter a valid 10-digit Indian mobile number');
  }

  if (!data.email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(data.email)) {
    errors.push('email: Enter a valid email address');
  }

  if (!data.city || data.city.trim().length === 0) {
    errors.push('city: City is required');
  }

  if (!data.loanAmount || data.loanAmount < 10000) {
    errors.push('loanAmount: Enter a valid loan amount');
  }

  if (!data.interestRate || data.interestRate < 0) {
    errors.push('interestRate: Enter a valid interest rate');
  }

  if (!data.tenureYears || data.tenureYears < 1) {
    errors.push('tenureYears: Enter a valid tenure');
  }

  return errors;
};

const createLoanEnquiry = (Model, extraFields, loanTypeLabel) => async (req, res) => {
  try {
    const errors = validateEnquiry(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const {
      fullName, mobile, email, city, loanAmount,
      interestRate, tenureYears, calculatedEMI, totalInterest, totalPayable,
      tenureUnit, ...rest
    } = req.body;

    const enquiry = await Model.create({
      fullName, mobile, email, city, loanAmount,
      interestRate, tenureYears, calculatedEMI,
      tenureUnit: tenureUnit || 'Years',
      totalInterest: totalInterest || 0,
      totalPayable: totalPayable || 0,
      ...extraFields.reduce((acc, field) => {
        if (rest[field] !== undefined) acc[field] = rest[field];
        return acc;
      }, {}),
      source: req.body.source || extraFields.source
    });

    const unit = tenureUnit || 'Years';
    let emailWarning = null;
    try {
      await sendCustomerEmail(enquiry.email, enquiry.fullName, loanTypeLabel, enquiry.calculatedEMI, enquiry.tenureYears, unit, enquiry.mobile, enquiry.city, enquiry.loanAmount);
      await sendAdminNotification({
        fullName: enquiry.fullName, phone: enquiry.mobile, email: enquiry.email,
        city: enquiry.city, loanType: loanTypeLabel, loanAmount: enquiry.loanAmount,
        interestRate: enquiry.interestRate, tenure: enquiry.tenureYears,
        tenureUnit: unit, emi: enquiry.calculatedEMI, createdAt: enquiry.createdAt
      });
    } catch (e) {
      emailWarning = e.message;
    }

    res.status(201).json({ success: true, message: 'Enquiry submitted successfully', data: enquiry, ...(emailWarning ? { emailWarning } : {}) });
  } catch (error) {
    res.status(500).json({ success: false, errors: ['Server error. Please try again.'] });
  }
};

export const createHomeLoanEnquiry = createLoanEnquiry(HomeLoanEnquiry, ['propertyType', 'propertyLocation', 'employmentType'], 'Home Loan');
export const createLAPEnquiry = createLoanEnquiry(LAPEnquiry, ['propertyValue', 'mortgagePropertyType', 'propertyType', 'employmentType'], 'Loan Against Property');
export const createEducationLoanEnquiry = createLoanEnquiry(EducationLoanEnquiry, ['qualification', 'degreeType', 'institutionName'], 'Education Loan');
export const createPersonalLoanEnquiry = createLoanEnquiry(PersonalLoanEnquiry, ['employmentType'], 'Personal Loan');
export const createBusinessLoanEnquiry = createLoanEnquiry(BusinessLoanEnquiry, ['employmentType', 'businessVintage'], 'Business Loan');
export const createVehicleLoanEnquiry = createLoanEnquiry(VehicleLoanEnquiry, ['vehicleType', 'downPayment'], 'Vehicle Loan');

export const getEMIEnquiries = async (req, res) => {
  try {
    const { type, search, startDate, endDate, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const searchRegex = search ? new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;
    const commonSearch = searchRegex ? {
      $or: [
        { fullName: searchRegex }, { mobile: searchRegex },
        { email: searchRegex }, { city: searchRegex }
      ]
    } : {};

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    const dateQuery = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    const baseQuery = { ...commonSearch, ...dateQuery };

    const getEnquiries = (Model, extraMatch = {}) =>
      Model.find({ ...baseQuery, ...extraMatch }).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean();
    const getCount = (Model, extraMatch = {}) => Model.countDocuments({ ...baseQuery, ...extraMatch });

    let results = [];
    let total = 0;

    const modelConfigs = [
      { type: 'home_loan', Model: HomeLoanEnquiry, label: 'home_loan' },
      { type: 'loan_against_property', Model: LAPEnquiry, label: 'loan_against_property' },
      { type: 'education_loan', Model: EducationLoanEnquiry, label: 'education_loan' },
      { type: 'personal_loan', Model: PersonalLoanEnquiry, label: 'personal_loan' },
      { type: 'business_loan', Model: BusinessLoanEnquiry, label: 'business_loan' },
      { type: 'vehicle_loan', Model: VehicleLoanEnquiry, label: 'vehicle_loan' },
    ];

    for (const config of modelConfigs) {
      if (!type || type === config.type) {
        const enquiries = await getEnquiries(config.Model);
        results = [...results, ...enquiries.map(e => ({ ...e, loanType: config.label }))];
        total += await getCount(config.Model);
      }
    }

    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    results = results.slice(0, limitNum);

    const counts = await Promise.all(modelConfigs.map(c => getCount(c.Model)));
    const [homeLoanCount, lapCount, eduLoanCount, personalLoanCount, businessLoanCount, vehicleLoanCount] = counts;

    res.json({
      success: true,
      data: results,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
      stats: {
        total: homeLoanCount + lapCount + eduLoanCount + personalLoanCount + businessLoanCount + vehicleLoanCount,
        homeLoan: homeLoanCount, lap: lapCount, educationLoan: eduLoanCount,
        personalLoan: personalLoanCount, businessLoan: businessLoanCount, vehicleLoan: vehicleLoanCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

export const exportEMIEnquiries = async (req, res) => {
  try {
    const { type, search, startDate, endDate } = req.query;
    const searchRegex = search ? new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;
    const commonSearch = searchRegex ? {
      $or: [
        { fullName: searchRegex }, { mobile: searchRegex },
        { email: searchRegex }, { city: searchRegex }
      ]
    } : {};

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    const dateQuery = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};
    const baseQuery = { ...commonSearch, ...dateQuery };

    let allEnquiries = [];
    const formatDate = (date) => new Date(date).toLocaleDateString();

    const modelConfigs = [
      { type: 'home_loan', Model: HomeLoanEnquiry, loanType: 'Home Loan', map: (e) => ({
        Name: e.fullName, Mobile: e.mobile, Email: e.email, City: e.city,
        'Loan Type': 'Home Loan', 'Loan Amount': e.loanAmount, EMI: e.calculatedEMI,
        'Interest Rate': e.interestRate, 'Tenure (Years)': e.tenureYears,
        'Property Type': e.propertyType || '-', 'Property Location': e.propertyLocation || '-',
        'Employment Type': e.employmentType || '-', 'Total Interest': e.totalInterest || '-',
        'Total Payable': e.totalPayable || '-', Date: formatDate(e.createdAt)
      })},
      { type: 'loan_against_property', Model: LAPEnquiry, loanType: 'Loan Against Property', map: (e) => ({
        Name: e.fullName, Mobile: e.mobile, Email: e.email, City: e.city,
        'Loan Type': 'Loan Against Property', 'Loan Amount': e.loanAmount, EMI: e.calculatedEMI,
        'Interest Rate': e.interestRate, 'Tenure (Years)': e.tenureYears,
        'Property Type': e.mortgagePropertyType || '-', 'Employment Type': e.employmentType || '-',
        'Total Interest': e.totalInterest || '-', 'Total Payable': e.totalPayable || '-',
        Date: formatDate(e.createdAt)
      })},
      { type: 'education_loan', Model: EducationLoanEnquiry, loanType: 'Education Loan', map: (e) => ({
        Name: e.fullName, Mobile: e.mobile, Email: e.email, City: e.city,
        'Loan Type': 'Education Loan', 'Loan Amount': e.loanAmount, EMI: e.calculatedEMI,
        'Interest Rate': e.interestRate, 'Tenure (Years)': e.tenureYears,
        Qualification: e.qualification || '-', 'Degree Type': e.degreeType || '-',
        'University': e.institutionName || '-',
        'Total Interest': e.totalInterest || '-', 'Total Payable': e.totalPayable || '-',
        Date: formatDate(e.createdAt)
      })},
      { type: 'personal_loan', Model: PersonalLoanEnquiry, loanType: 'Personal Loan', map: (e) => ({
        Name: e.fullName, Mobile: e.mobile, Email: e.email, City: e.city,
        'Loan Type': 'Personal Loan', 'Loan Amount': e.loanAmount, EMI: e.calculatedEMI,
        'Interest Rate': e.interestRate, 'Tenure (Years)': e.tenureYears,
        'Employment Type': e.employmentType || '-', 'Total Interest': e.totalInterest || '-',
        'Total Payable': e.totalPayable || '-', Date: formatDate(e.createdAt)
      })},
      { type: 'business_loan', Model: BusinessLoanEnquiry, loanType: 'Business Loan', map: (e) => ({
        Name: e.fullName, Mobile: e.mobile, Email: e.email, City: e.city,
        'Loan Type': 'Business Loan', 'Loan Amount': e.loanAmount, EMI: e.calculatedEMI,
        'Interest Rate': e.interestRate, 'Tenure (Years)': e.tenureYears,
        'Employment Type': e.employmentType || '-', 'Business Vintage (Months)': e.businessVintage || '-',
        'Total Interest': e.totalInterest || '-', 'Total Payable': e.totalPayable || '-',
        Date: formatDate(e.createdAt)
      })},
      { type: 'vehicle_loan', Model: VehicleLoanEnquiry, loanType: 'Vehicle Loan', map: (e) => ({
        Name: e.fullName, Mobile: e.mobile, Email: e.email, City: e.city,
        'Loan Type': 'Vehicle Loan', 'Loan Amount': e.loanAmount, EMI: e.calculatedEMI,
        'Interest Rate': e.interestRate, 'Tenure (Years)': e.tenureYears,
        'Vehicle Type': e.vehicleType || '-', 'Down Payment': e.downPayment || '-',
        'Total Interest': e.totalInterest || '-', 'Total Payable': e.totalPayable || '-',
        Date: formatDate(e.createdAt)
      })},
    ];

    for (const config of modelConfigs) {
      if (!type || type === config.type) {
        const docs = await config.Model.find(baseQuery).sort({ createdAt: -1 }).lean();
        allEnquiries = [...allEnquiries, ...docs.map(config.map)];
      }
    }

    const worksheet = XLSX.utils.json_to_sheet(allEnquiries);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Enquiries');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const date = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="enquiries-${date}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Export failed. Please try again.' });
  }
};