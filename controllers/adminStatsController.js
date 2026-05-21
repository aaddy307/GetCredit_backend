const Enquiry = require('../models/Enquiry');
const CallbackRequest = require('../models/CallbackRequest');
const HomeLoanEnquiry = require('../models/HomeLoanEnquiry');
const LAPEnquiry = require('../models/LAPEnquiry');
const EducationLoanEnquiry = require('../models/EducationLoanEnquiry');
const PersonalLoanEnquiry = require('../models/PersonalLoanEnquiry');
const BusinessLoanEnquiry = require('../models/BusinessLoanEnquiry');
const VehicleLoanEnquiry = require('../models/VehicleLoanEnquiry');

const emiModels = [HomeLoanEnquiry, LAPEnquiry, EducationLoanEnquiry, PersonalLoanEnquiry, BusinessLoanEnquiry, VehicleLoanEnquiry];

const getTodayStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateFilter = { createdAt: { $gte: today, $lt: tomorrow } };

    const [todayEnquiries, ...todayEmiCounts] = await Promise.all([
      Enquiry.countDocuments(dateFilter),
      ...emiModels.map(m => m.countDocuments(dateFilter)),
    ]);
    const todayCallbacks = await CallbackRequest.countDocuments(dateFilter);
    const [totalEnquiries, ...totalEmiCounts] = await Promise.all([
      Enquiry.countDocuments(),
      ...emiModels.map(m => m.countDocuments()),
    ]);
    const totalCallbacks = await CallbackRequest.countDocuments();

    const todayEmi = todayEmiCounts.reduce((a, b) => a + b, 0);
    const totalEmi = totalEmiCounts.reduce((a, b) => a + b, 0);

    const todayLeads = todayEnquiries + todayEmi;
    const totalLeads = totalEnquiries + totalEmi;

    const pendingCallbacks = await CallbackRequest.countDocuments({ status: 'Pending' });
    const [enqApproved, ...emiApproved] = await Promise.all([
      Enquiry.countDocuments({ status: 'Approved' }),
      ...emiModels.map(m => m.countDocuments({ status: 'Approved' })),
    ]);
    const approvedLeads = enqApproved + emiApproved.reduce((a, b) => a + b, 0);
    const conversionRate = totalLeads > 0 ? Math.round((approvedLeads / totalLeads) * 100) : 0;

    res.json({
      success: true,
      stats: {
        todayLeads,
        todayCallbacks,
        totalLeads,
        pendingCallbacks,
        conversionRate
      }
    });
  } catch (error) {
    console.error('Get Today Stats Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getTodayStats };
