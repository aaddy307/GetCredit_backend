const Enquiry = require('../models/Enquiry');
const HomeLoanEnquiry = require('../models/HomeLoanEnquiry');
const LAPEnquiry = require('../models/LAPEnquiry');
const EducationLoanEnquiry = require('../models/EducationLoanEnquiry');
const PersonalLoanEnquiry = require('../models/PersonalLoanEnquiry');
const BusinessLoanEnquiry = require('../models/BusinessLoanEnquiry');
const VehicleLoanEnquiry = require('../models/VehicleLoanEnquiry');

const emiModels = [HomeLoanEnquiry, LAPEnquiry, EducationLoanEnquiry, PersonalLoanEnquiry, BusinessLoanEnquiry, VehicleLoanEnquiry];
const emiLabels = ['Home Loan', 'Loan Against Property', 'Education Loan', 'Personal Loan', 'Business Loan', 'Vehicle Loan'];

const countAll = async (query = {}) => {
  const counts = await Promise.all([
    Enquiry.countDocuments(query),
    ...emiModels.map(m => m.countDocuments(query)),
  ]);
  return counts.reduce((a, b) => a + b, 0);
};

exports.getMonthlyLeads = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const now = new Date();
    const yearFilter = { createdAt: { $gte: startOfYear, $lte: now } };

    const allPending = await Promise.all([
      Enquiry.find(yearFilter).select('createdAt').lean(),
      ...emiModels.map(m => m.find(yearFilter).select('createdAt').lean()),
    ]);

    const allDocs = allPending.flat();

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = now.getMonth();
    const monthData = months.slice(0, currentMonth + 1).map(month => {
      const monthIndex = months.indexOf(month);
      const count = allDocs.filter(d => new Date(d.createdAt).getMonth() === monthIndex).length;
      return { month, count };
    });

    res.json({ success: true, data: monthData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLoanDistribution = async (req, res) => {
  try {
    const totalLeads = await countAll();

    const enqDist = await Promise.all(
      emiLabels.map(async (type) => {
        const count = await Enquiry.countDocuments({ loanType: type });
        return { type, count };
      })
    );

    const counts = await Promise.all(emiModels.map(m => m.countDocuments()));
    const emiDist = emiLabels.map((type, i) => ({ type, count: counts[i] }));

    const distribution = [...enqDist, ...emiDist].reduce((acc, item) => {
      const existing = acc.find(d => d.type === item.type);
      if (existing) existing.count += item.count;
      else acc.push({ type: item.type, count: item.count });
      return acc;
    }, []);

    distribution.forEach(d => {
      d.percentage = totalLeads > 0 ? Math.round((d.count / totalLeads) * 100) : 0;
    });

    res.json({ success: true, data: distribution });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const countStatusAll = async (statusFilter) => {
  const counts = await Promise.all([
    Enquiry.countDocuments({ status: statusFilter }),
    ...emiModels.map(m => m.countDocuments({ status: statusFilter })),
  ]);
  return counts.reduce((a, b) => a + b, 0);
};

exports.getSummary = async (req, res) => {
  try {
    const totalLeads = await countAll();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentFilter = { createdAt: { $gte: sevenDaysAgo } };

    const newLeads = await countAll(recentFilter);
    const pending = await countStatusAll('Pending');
    const running = await countStatusAll('In Review');
    const completed = await countStatusAll({ $in: ['Approved', 'Closed'] });
    const rejected = await countStatusAll('Rejected');

    res.json({
      success: true,
      data: { totalLeads, newLeads, pending, running, completed, rejected }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRecentLeads = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const [enquiries, ...emiDocs] = await Promise.all([
      Enquiry.find().sort({ createdAt: -1 }).limit(limit).select('fullName phone email city loanType loanAmount status createdAt leadSource').lean(),
      ...emiModels.map(m => m.find().sort({ createdAt: -1 }).limit(limit).select('fullName mobile email city loanType tenureYears loanAmount status createdAt').lean()),
    ]);

    const allLeads = [
      ...enquiries.map(e => ({ ...e, _isEMI: false, phone: e.phone })),
      ...emiDocs.flat().map(d => ({ ...d, _isEMI: true, phone: d.mobile })),
    ];

    allLeads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, data: allLeads.slice(0, limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
