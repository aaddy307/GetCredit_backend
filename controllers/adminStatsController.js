import Enquiry from '../models/Enquiry.js';
import CallbackRequest from '../models/CallbackRequest.js';
import HomeLoanEnquiry from '../models/HomeLoanEnquiry.js';
import LAPEnquiry from '../models/LAPEnquiry.js';
import EducationLoanEnquiry from '../models/EducationLoanEnquiry.js';
import PersonalLoanEnquiry from '../models/PersonalLoanEnquiry.js';
import BusinessLoanEnquiry from '../models/BusinessLoanEnquiry.js';
import VehicleLoanEnquiry from '../models/VehicleLoanEnquiry.js';

const emiModels = [HomeLoanEnquiry, LAPEnquiry, EducationLoanEnquiry, PersonalLoanEnquiry, BusinessLoanEnquiry, VehicleLoanEnquiry];

export const getTodayStats = async (req, res) => {
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
      stats: { todayLeads, todayCallbacks, totalLeads, pendingCallbacks, conversionRate }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};