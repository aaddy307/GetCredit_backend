import Enquiry from '../models/Enquiry.js';
import HomeLoanEnquiry from '../models/HomeLoanEnquiry.js';
import LAPEnquiry from '../models/LAPEnquiry.js';
import EducationLoanEnquiry from '../models/EducationLoanEnquiry.js';
import PersonalLoanEnquiry from '../models/PersonalLoanEnquiry.js';
import BusinessLoanEnquiry from '../models/BusinessLoanEnquiry.js';
import VehicleLoanEnquiry from '../models/VehicleLoanEnquiry.js';
import XLSX from 'xlsx';

const emiModels = [
  { model: HomeLoanEnquiry, type: 'Home Loan', source: 'EMI Calculator' },
  { model: LAPEnquiry, type: 'Loan Against Property', source: 'EMI Calculator' },
  { model: EducationLoanEnquiry, type: 'Education Loan', source: 'EMI Calculator' },
  { model: PersonalLoanEnquiry, type: 'Personal Loan', source: 'EMI Calculator' },
  { model: BusinessLoanEnquiry, type: 'Business Loan', source: 'EMI Calculator' },
  { model: VehicleLoanEnquiry, type: 'Vehicle Loan', source: 'EMI Calculator' },
];

const normalizeLead = (doc, collection, loanType, source) => ({
  _id: doc._id,
  fullName: doc.fullName || '',
  phone: doc.phone || doc.mobile || '',
  email: doc.email || '',
  city: doc.city || '',
  loanType: loanType || doc.loanType || '',
  loanAmount: doc.loanAmount || 0,
  status: doc.status || 'Pending',
  leadSource: source || doc.leadSource || 'Website',
  tenure: doc.tenure || doc.tenureYears || null,
  tenureUnit: doc.tenureUnit || null,
  interestRate: doc.interestRate || null,
  createdAt: doc.createdAt,
  _collection: collection,
  _isEMI: collection !== 'enquiries',
});

export const getAllLeads = async (req, res) => {
  try {
    const { search, status, loanType, source, startDate, endDate, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(Math.max(1, parseInt(limit)), 100);
    const skip = (pageNum - 1) * limitNum;

    const searchRegex = search ? new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;

    const buildQuery = (extraFields = []) => {
      const conditions = [];
      if (searchRegex) {
        const searchFields = ['fullName', 'email', 'city', ...extraFields];
        conditions.push({ $or: searchFields.map(f => ({ [f]: searchRegex })) });
      }
      if (status && status !== 'All') conditions.push({ status });
      if (loanType && loanType !== 'All') conditions.push({ loanType });
      if (source && source !== 'All') conditions.push({ leadSource: { $regex: source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } });
      if (startDate || endDate) {
        const dateFilter = {};
        if (startDate) dateFilter.$gte = new Date(startDate);
        if (endDate) dateFilter.$lte = new Date(endDate);
        conditions.push({ createdAt: dateFilter });
      }
      return conditions.length > 0 ? { $and: conditions } : {};
    };

    const enqQuery = buildQuery(['phone']);
    const emiQuery = buildQuery(['mobile']);

    const [enquiries, ...emiResults] = await Promise.all([
      Enquiry.find(enqQuery).sort({ createdAt: -1 }).lean(),
      ...emiModels.map(({ model }) => model.find(emiQuery).sort({ createdAt: -1 }).lean()),
    ]);

    let allLeads = [
      ...enquiries.map(e => normalizeLead(e, 'enquiries', e.loanType, e.leadSource)),
      ...emiResults.flatMap((docs, i) =>
        docs.map(d => normalizeLead(d, emiModels[i].type.toLowerCase().replace(/\s+/g, '_'), emiModels[i].type, emiModels[i].source))
      ),
    ];

    allLeads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const total = allLeads.length;
    allLeads = allLeads.slice(skip, skip + limitNum);

    res.json({
      success: true,
      count: allLeads.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      leads: allLeads,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

const modelMap = {
  'enquiries': Enquiry,
  'home_loan': HomeLoanEnquiry,
  'loan_against_property': LAPEnquiry,
  'education_loan': EducationLoanEnquiry,
  'personal_loan': PersonalLoanEnquiry,
  'business_loan': BusinessLoanEnquiry,
  'vehicle_loan': VehicleLoanEnquiry,
};

export const updateLead = async (req, res) => {
  try {
    const { _collection, ...updateData } = req.body;
    if (!_collection || !modelMap[_collection]) {
      return res.status(400).json({ success: false, message: 'Invalid lead type' });
    }

    const Model = modelMap[_collection];

    if (_collection !== 'enquiries' && updateData.phone) {
      updateData.mobile = updateData.phone;
      delete updateData.phone;
    }

    const ALLOWED_FIELDS = ['fullName', 'phone', 'mobile', 'email', 'city', 'loanType', 'loanAmount', 'status', 'notes', 'leadSource', 'tenure', 'tenureUnit'];
    const sanitized = {};
    for (const key of ALLOWED_FIELDS) {
      if (updateData[key] !== undefined) {
        sanitized[key] = updateData[key];
      }
    }

    if (sanitized.loanAmount) sanitized.loanAmount = Number(sanitized.loanAmount);

    const doc = await Model.findByIdAndUpdate(req.params.id, sanitized, { new: true, runValidators: true });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    res.json({ success: true, message: 'Lead updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

export const deleteLead = async (req, res) => {
  try {
    const { collection } = req.query;
    if (!collection || !modelMap[collection]) {
      return res.status(400).json({ success: false, message: 'Invalid lead type' });
    }

    const Model = modelMap[collection];
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

export const exportAllLeads = async (req, res) => {
  try {
    const { status, loanType, startDate, endDate, format = 'xlsx' } = req.query;
    const buildQuery = () => {
      const conditions = [];
      if (status && status !== 'All') conditions.push({ status });
      if (loanType && loanType !== 'All') conditions.push({ loanType });
      if (startDate || endDate) {
        const dateFilter = {};
        if (startDate) dateFilter.$gte = new Date(startDate);
        if (endDate) dateFilter.$lte = new Date(endDate);
        conditions.push({ createdAt: dateFilter });
      }
      return conditions.length > 0 ? { $and: conditions } : {};
    };
    const query = buildQuery();

    const [enquiries, ...emiResults] = await Promise.all([
      Enquiry.find(query).sort({ createdAt: -1 }).lean(),
      ...emiModels.map(({ model }) => model.find(query).sort({ createdAt: -1 }).lean()),
    ]);

    const MONTH_TENURE_LOANS = ['Personal Loan', 'Non-Salaried Loan', 'Business Loan'];
    const getUnit = (loanType, doc) => doc.tenureUnit || (MONTH_TENURE_LOANS.includes(loanType) ? 'Months' : 'Years');

    const rows = [
      ...enquiries.map(e => ({
        Name: e.fullName, Phone: e.phone, Email: e.email, City: e.city || '',
        'Loan Type': e.loanType, Amount: e.loanAmount, Status: e.status,
        Tenure: e.tenure ? `${e.tenure} ${getUnit(e.loanType, e)}` : '-',
        Source: e.leadSource || 'Website',
        'Created At': e.createdAt ? new Date(e.createdAt).toLocaleString() : '',
      })),
      ...emiResults.flatMap((docs, i) =>
        docs.map(d => ({
          Name: d.fullName, Phone: d.mobile || d.phone || '', Email: d.email, City: d.city || '',
          'Loan Type': emiModels[i].type, Amount: d.loanAmount, Status: d.status || 'Pending',
          Tenure: d.tenureYears ? `${d.tenureYears} ${getUnit(emiModels[i].type, d)}` : '-',
          Source: emiModels[i].source,
          'Created At': d.createdAt ? new Date(d.createdAt).toLocaleString() : '',
        }))
      ),
    ];

    if (format === 'csv') {
      const header = Object.keys(rows[0] || {}).join(',');
      const csvRows = rows.map(row => Object.values(row).map(v => `"${v || ''}"`).join(','));
      const csv = [header, ...csvRows].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=all-leads.csv');
      return res.send(csv);
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'All Leads');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=all-leads.xlsx');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};