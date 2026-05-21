const Enquiry = require('../models/Enquiry');
const CallbackRequest = require('../models/CallbackRequest');
const Blog = require('../models/Blog');
const HomeLoanEnquiry = require('../models/HomeLoanEnquiry');
const LAPEnquiry = require('../models/LAPEnquiry');
const EducationLoanEnquiry = require('../models/EducationLoanEnquiry');
const PersonalLoanEnquiry = require('../models/PersonalLoanEnquiry');
const BusinessLoanEnquiry = require('../models/BusinessLoanEnquiry');
const VehicleLoanEnquiry = require('../models/VehicleLoanEnquiry');

const emiModels = [HomeLoanEnquiry, LAPEnquiry, EducationLoanEnquiry, PersonalLoanEnquiry, BusinessLoanEnquiry, VehicleLoanEnquiry];

const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ success: true, results: [] });
    }

    const searchRegex = new RegExp(q, 'i');
    const limit = 5;

    const searchQuery = {
      $or: [
        { fullName: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
        { city: searchRegex }
      ]
    };

    const mobileSearchQuery = {
      $or: [
        { fullName: searchRegex },
        { mobile: searchRegex },
        { email: searchRegex },
        { city: searchRegex }
      ]
    };

    const allSearches = await Promise.all([
      Enquiry.find(searchQuery).select('fullName phone email city loanType').limit(limit).lean(),
      ...emiModels.map(m => m.find(mobileSearchQuery).select('fullName mobile email city').limit(limit).lean()),
      CallbackRequest.find(searchQuery).select('fullName phone email city').limit(limit).lean(),
      Blog.find({ $or: [{ title: searchRegex }, { content: searchRegex }] }).select('title category').limit(limit).lean(),
    ]);

    const results = [];

    allSearches[0].forEach(lead => {
      results.push({ type: 'lead', title: lead.fullName, subtitle: `${lead.phone} • ${lead.city || 'N/A'}`, label: 'Lead' });
    });

    for (let i = 0; i < 6; i++) {
      const label = ['Home Loan', 'LAP', 'Education Loan', 'Personal Loan', 'Business Loan', 'Vehicle Loan'][i];
      allSearches[i + 1].forEach(e => {
        results.push({ type: 'lead', title: e.fullName, subtitle: `${e.mobile || e.phone} • ${e.city || 'N/A'}`, label });
      });
    }

    const callbacksIdx = 7;
    allSearches[callbacksIdx].forEach(callback => {
      results.push({ type: 'callback', title: callback.fullName, subtitle: `${callback.phone} • ${callback.email}` });
    });

    const blogIdx = 8;
    allSearches[blogIdx].forEach(blog => {
      results.push({ type: 'blog', title: blog.title, subtitle: blog.category });
    });

    res.json({ success: true, results });
  } catch (error) {
    console.error('Global Search Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { globalSearch };
