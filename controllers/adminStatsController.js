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

    const countPromises = [
      Enquiry.countDocuments(dateFilter),
      ...emiModels.map(m => m.countDocuments(dateFilter)),
      CallbackRequest.countDocuments(dateFilter),
      Enquiry.countDocuments(),
      ...emiModels.map(m => m.countDocuments()),
      CallbackRequest.countDocuments(),
    ];

    const counts = await Promise.all(countPromises);
    const [todayEnq, ...rest] = counts;
    const todayEmi = rest.slice(0, 6).reduce((a, b) => a + b, 0);
    const todayCallbacks = rest[6];
    const totalEnq = rest[7];
    const totalEmi = rest.slice(8, 14).reduce((a, b) => a + b, 0);
    const totalCallbacks = rest[14];

    const todayLeads = todayEnq + todayEmi;
    const totalLeads = totalEnq + totalEmi;

    const pendingCallbacks = await CallbackRequest.countDocuments({ status: 'Pending' });
    const approvedLeads = await Enquiry.countDocuments({ status: 'Approved' });
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
