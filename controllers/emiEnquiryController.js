const XLSX = require('xlsx');
const HomeLoanEnquiry = require('../models/HomeLoanEnquiry');
const LAPEnquiry = require('../models/LAPEnquiry');
const EducationLoanEnquiry = require('../models/EducationLoanEnquiry');
const PersonalLoanEnquiry = require('../models/PersonalLoanEnquiry');
const BusinessLoanEnquiry = require('../models/BusinessLoanEnquiry');
const VehicleLoanEnquiry = require('../models/VehicleLoanEnquiry');
const { sendCustomerEmail, sendAdminNotification } = require('../utils/sendEmail');

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

const createHomeLoanEnquiry = async (req, res) => {
  try {
    const errors = validateEnquiry(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const { 
      fullName, mobile, email, city, loanAmount, 
      propertyType, propertyLocation, employmentType,
      interestRate, tenureYears, calculatedEMI, totalInterest, totalPayable,
      tenureUnit
    } = req.body;

    const enquiry = await HomeLoanEnquiry.create({
      fullName, mobile, email, city, loanAmount,
      propertyType: propertyType || 'Ready to Move',
      propertyLocation: propertyLocation || '',
      employmentType: employmentType || 'Salaried',
      interestRate, tenureYears, calculatedEMI,
      tenureUnit: tenureUnit || 'Years',
      totalInterest: totalInterest || 0, totalPayable: totalPayable || 0,
      source: 'home_loan'
    });

    const unit = tenureUnit || 'Years';
    sendCustomerEmail(enquiry.email, enquiry.fullName, 'Home Loan', enquiry.calculatedEMI, enquiry.tenureYears, unit).catch(() => {});
    sendAdminNotification({
      fullName: enquiry.fullName, phone: enquiry.mobile, email: enquiry.email,
      city: enquiry.city, loanType: 'Home Loan', loanAmount: enquiry.loanAmount,
      interestRate: enquiry.interestRate, tenure: enquiry.tenureYears,
      tenureUnit: unit,
      emi: enquiry.calculatedEMI, createdAt: enquiry.createdAt
    }).catch(() => {});

    res.status(201).json({ success: true, message: 'Enquiry submitted successfully', data: enquiry });
  } catch (error) {
    console.error('Home Loan Enquiry Error:', error);
    res.status(500).json({ success: false, errors: ['Server error. Please try again.'] });
  }
};

const createLAPEnquiry = async (req, res) => {
  try {
    const errors = validateEnquiry(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const { 
      fullName, mobile, email, city, loanAmount, 
      propertyType, propertyValue, employmentType,
      interestRate, tenureYears, calculatedEMI, totalInterest, totalPayable,
      tenureUnit
    } = req.body;

    const enquiry = await LAPEnquiry.create({
      fullName, mobile, email, city, loanAmount,
      propertyValue: propertyValue || undefined,
      mortgagePropertyType: propertyType || 'Residential',
      employmentType: employmentType || 'Salaried',
      interestRate, tenureYears, calculatedEMI,
      tenureUnit: tenureUnit || 'Years',
      totalInterest: totalInterest || 0, totalPayable: totalPayable || 0,
      source: 'loan_against_property'
    });

    const unit = tenureUnit || 'Years';
    sendCustomerEmail(enquiry.email, enquiry.fullName, 'Loan Against Property', enquiry.calculatedEMI, enquiry.tenureYears, unit).catch(() => {});
    sendAdminNotification({
      fullName: enquiry.fullName, phone: enquiry.mobile, email: enquiry.email,
      city: enquiry.city, loanType: 'Loan Against Property', loanAmount: enquiry.loanAmount,
      interestRate: enquiry.interestRate, tenure: enquiry.tenureYears,
      tenureUnit: unit,
      emi: enquiry.calculatedEMI, createdAt: enquiry.createdAt
    }).catch(() => {});

    res.status(201).json({ success: true, message: 'Enquiry submitted successfully', data: enquiry });
  } catch (error) {
    console.error('LAP Enquiry Error:', error);
    res.status(500).json({ success: false, errors: ['Server error. Please try again.'] });
  }
};

const createEducationLoanEnquiry = async (req, res) => {
  try {
    const errors = validateEnquiry(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const { 
      fullName, mobile, email, city, loanAmount, 
      qualification, degreeType, institutionName,
      interestRate, tenureYears, calculatedEMI, totalInterest, totalPayable,
      tenureUnit
    } = req.body;

    if (!qualification) {
      return res.status(400).json({ success: false, errors: ['qualification: Qualification is required'] });
    }

    const enquiry = await EducationLoanEnquiry.create({
      fullName, mobile, email, city, loanAmount,
      qualification, degreeType, institutionName,
      interestRate, tenureYears, calculatedEMI,
      tenureUnit: tenureUnit || 'Years',
      totalInterest: totalInterest || 0, totalPayable: totalPayable || 0,
      source: 'education_loan'
    });

    const unit = tenureUnit || 'Years';
    sendCustomerEmail(enquiry.email, enquiry.fullName, 'Education Loan', enquiry.calculatedEMI, enquiry.tenureYears, unit).catch(() => {});
    sendAdminNotification({
      fullName: enquiry.fullName, phone: enquiry.mobile, email: enquiry.email,
      city: enquiry.city, loanType: 'Education Loan', loanAmount: enquiry.loanAmount,
      interestRate: enquiry.interestRate, tenure: enquiry.tenureYears,
      tenureUnit: unit,
      emi: enquiry.calculatedEMI, createdAt: enquiry.createdAt
    }).catch(() => {});

    res.status(201).json({ success: true, message: 'Enquiry submitted successfully', data: enquiry });
  } catch (error) {
    console.error('Education Loan Enquiry Error:', error);
    res.status(500).json({ success: false, errors: ['Server error. Please try again.'] });
  }
};

const createPersonalLoanEnquiry = async (req, res) => {
  try {
    const errors = validateEnquiry(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const { 
      fullName, mobile, email, city, loanAmount,
      employmentType,
      interestRate, tenureYears, calculatedEMI, totalInterest, totalPayable,
      tenureUnit
    } = req.body;

    const enquiry = await PersonalLoanEnquiry.create({
      fullName, mobile, email, city, loanAmount,
      employmentType: employmentType || 'Salaried',
      interestRate, tenureYears, calculatedEMI,
      tenureUnit: tenureUnit || 'Months',
      totalInterest: totalInterest || 0, totalPayable: totalPayable || 0,
      source: 'personal_loan'
    });

    const unit = tenureUnit || 'Months';
    sendCustomerEmail(enquiry.email, enquiry.fullName, 'Personal Loan', enquiry.calculatedEMI, enquiry.tenureYears, unit).catch(() => {});
    sendAdminNotification({
      fullName: enquiry.fullName, phone: enquiry.mobile, email: enquiry.email,
      city: enquiry.city, loanType: 'Personal Loan', loanAmount: enquiry.loanAmount,
      interestRate: enquiry.interestRate, tenure: enquiry.tenureYears,
      tenureUnit: unit,
      emi: enquiry.calculatedEMI, createdAt: enquiry.createdAt
    }).catch(() => {});

    res.status(201).json({ success: true, message: 'Enquiry submitted successfully', data: enquiry });
  } catch (error) {
    console.error('Personal Loan Enquiry Error:', error);
    res.status(500).json({ success: false, errors: ['Server error. Please try again.'] });
  }
};

const createBusinessLoanEnquiry = async (req, res) => {
  try {
    const errors = validateEnquiry(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const { 
      fullName, mobile, email, city, loanAmount,
      employmentType,
      interestRate, tenureYears, calculatedEMI, totalInterest, totalPayable,
      businessVintage,
      tenureUnit
    } = req.body;

    const enquiry = await BusinessLoanEnquiry.create({
      fullName, mobile, email, city, loanAmount,
      employmentType: employmentType || 'Salaried',
      interestRate, tenureYears, calculatedEMI,
      tenureUnit: tenureUnit || 'Months',
      totalInterest: totalInterest || 0, totalPayable: totalPayable || 0,
      businessVintage: businessVintage || 0,
      source: 'business_loan'
    });

    const unit = tenureUnit || 'Months';
    sendCustomerEmail(enquiry.email, enquiry.fullName, 'Business Loan', enquiry.calculatedEMI, enquiry.tenureYears, unit).catch(() => {});
    sendAdminNotification({
      fullName: enquiry.fullName, phone: enquiry.mobile, email: enquiry.email,
      city: enquiry.city, loanType: 'Business Loan', loanAmount: enquiry.loanAmount,
      interestRate: enquiry.interestRate, tenure: enquiry.tenureYears,
      tenureUnit: unit,
      emi: enquiry.calculatedEMI, createdAt: enquiry.createdAt
    }).catch(() => {});

    res.status(201).json({ success: true, message: 'Enquiry submitted successfully', data: enquiry });
  } catch (error) {
    console.error('Business Loan Enquiry Error:', error);
    res.status(500).json({ success: false, errors: ['Server error. Please try again.'] });
  }
};

const createVehicleLoanEnquiry = async (req, res) => {
  try {
    const errors = validateEnquiry(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const { 
      fullName, mobile, email, city, loanAmount, downPayment = 0,
      interestRate, tenureYears, calculatedEMI, totalInterest, totalPayable,
      vehicleType,
      tenureUnit
    } = req.body;

    const enquiry = await VehicleLoanEnquiry.create({
      fullName, mobile, email, city, loanAmount, downPayment,
      interestRate, tenureYears, calculatedEMI,
      tenureUnit: tenureUnit || 'Years',
      totalInterest: totalInterest || 0, totalPayable: totalPayable || 0,
      vehicleType: vehicleType || 'New Car',
      source: 'vehicle_loan'
    });

    const unit = tenureUnit || 'Years';
    sendCustomerEmail(enquiry.email, enquiry.fullName, 'Vehicle Loan', enquiry.calculatedEMI, enquiry.tenureYears, unit).catch(() => {});
    sendAdminNotification({
      fullName: enquiry.fullName, phone: enquiry.mobile, email: enquiry.email,
      city: enquiry.city, loanType: 'Vehicle Loan', loanAmount: enquiry.loanAmount,
      interestRate: enquiry.interestRate, tenure: enquiry.tenureYears,
      tenureUnit: unit,
      emi: enquiry.calculatedEMI, createdAt: enquiry.createdAt
    }).catch(() => {});

    res.status(201).json({ success: true, message: 'Enquiry submitted successfully', data: enquiry });
  } catch (error) {
    console.error('Vehicle Loan Enquiry Error:', error);
    res.status(500).json({ success: false, errors: ['Server error. Please try again.'] });
  }
};

const getEMIEnquiries = async (req, res) => {
  try {
    const { type, search, startDate, endDate, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const searchRegex = search ? new RegExp(search, 'i') : null;
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
    console.error('Get EMI Enquiries Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const exportEMIEnquiries = async (req, res) => {
  try {
    const { type, search, startDate, endDate } = req.query;
    const searchRegex = search ? new RegExp(search, 'i') : null;
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

    if (!type || type === 'home_loan') {
      const homeLoans = await HomeLoanEnquiry.find(baseQuery).sort({ createdAt: -1 }).lean();
      allEnquiries = [...allEnquiries, ...homeLoans.map(e => ({
        Name: e.fullName, Mobile: e.mobile, Email: e.email, City: e.city,
        'Loan Type': 'Home Loan', 'Loan Amount': e.loanAmount, EMI: e.calculatedEMI,
        'Interest Rate': e.interestRate, 'Tenure (Years)': e.tenureYears,
        'Property Type': e.propertyType || '-', 'Property Location': e.propertyLocation || '-',
        'Employment Type': e.employmentType || '-', 'Total Interest': e.totalInterest || '-',
        'Total Payable': e.totalPayable || '-', Date: formatDate(e.createdAt)
      }))];
    }

    if (!type || type === 'loan_against_property') {
      const laps = await LAPEnquiry.find(baseQuery).sort({ createdAt: -1 }).lean();
      allEnquiries = [...allEnquiries, ...laps.map(e => ({
        Name: e.fullName, Mobile: e.mobile, Email: e.email, City: e.city,
        'Loan Type': 'Loan Against Property', 'Loan Amount': e.loanAmount, EMI: e.calculatedEMI,
        'Interest Rate': e.interestRate, 'Tenure (Years)': e.tenureYears,
        'Property Type': e.mortgagePropertyType || '-', 'Employment Type': e.employmentType || '-',
        'Total Interest': e.totalInterest || '-', 'Total Payable': e.totalPayable || '-',
        Date: formatDate(e.createdAt)
      }))];
    }

    if (!type || type === 'education_loan') {
      const eduLoans = await EducationLoanEnquiry.find(baseQuery).sort({ createdAt: -1 }).lean();
      allEnquiries = [...allEnquiries, ...eduLoans.map(e => ({
        Name: e.fullName, Mobile: e.mobile, Email: e.email, City: e.city,
        'Loan Type': 'Education Loan', 'Loan Amount': e.loanAmount, EMI: e.calculatedEMI,
        'Interest Rate': e.interestRate, 'Tenure (Years)': e.tenureYears,
        Qualification: e.qualification || '-', 'Degree Type': e.degreeType || '-',
        'University': e.institutionName || '-',
        'Total Interest': e.totalInterest || '-', 'Total Payable': e.totalPayable || '-',
        Date: formatDate(e.createdAt)
      }))];
    }

    if (!type || type === 'personal_loan') {
      const personalLoans = await PersonalLoanEnquiry.find(baseQuery).sort({ createdAt: -1 }).lean();
      allEnquiries = [...allEnquiries, ...personalLoans.map(e => ({
        Name: e.fullName, Mobile: e.mobile, Email: e.email, City: e.city,
        'Loan Type': 'Personal Loan', 'Loan Amount': e.loanAmount, EMI: e.calculatedEMI,
        'Interest Rate': e.interestRate, 'Tenure (Years)': e.tenureYears,
        'Employment Type': e.employmentType || '-', 'Total Interest': e.totalInterest || '-',
        'Total Payable': e.totalPayable || '-', Date: formatDate(e.createdAt)
      }))];
    }

    if (!type || type === 'business_loan') {
      const businessLoans = await BusinessLoanEnquiry.find(baseQuery).sort({ createdAt: -1 }).lean();
      allEnquiries = [...allEnquiries, ...businessLoans.map(e => ({
        Name: e.fullName, Mobile: e.mobile, Email: e.email, City: e.city,
        'Loan Type': 'Business Loan', 'Loan Amount': e.loanAmount, EMI: e.calculatedEMI,
        'Interest Rate': e.interestRate, 'Tenure (Years)': e.tenureYears,
        'Employment Type': e.employmentType || '-', 'Business Vintage (Months)': e.businessVintage || '-',
        'Total Interest': e.totalInterest || '-', 'Total Payable': e.totalPayable || '-',
        Date: formatDate(e.createdAt)
      }))];
    }

    if (!type || type === 'vehicle_loan') {
      const vehicleLoans = await VehicleLoanEnquiry.find(baseQuery).sort({ createdAt: -1 }).lean();
      allEnquiries = [...allEnquiries, ...vehicleLoans.map(e => ({
        Name: e.fullName, Mobile: e.mobile, Email: e.email, City: e.city,
        'Loan Type': 'Vehicle Loan', 'Loan Amount': e.loanAmount, EMI: e.calculatedEMI,
        'Interest Rate': e.interestRate, 'Tenure (Years)': e.tenureYears,
        'Vehicle Type': e.vehicleType || '-', 'Down Payment': e.downPayment || '-',
        'Total Interest': e.totalInterest || '-', 'Total Payable': e.totalPayable || '-',
        Date: formatDate(e.createdAt)
      }))];
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
    console.error('Export EMI Enquiries Error:', error);
    res.status(500).json({ success: false, message: 'Export failed' });
  }
};

module.exports = {
  createHomeLoanEnquiry, createLAPEnquiry, createEducationLoanEnquiry,
  createPersonalLoanEnquiry, createBusinessLoanEnquiry, createVehicleLoanEnquiry,
  getEMIEnquiries, exportEMIEnquiries
};
