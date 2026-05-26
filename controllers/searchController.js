import Enquiry from '../models/Enquiry.js';
import CallbackRequest from '../models/CallbackRequest.js';
import Blog from '../models/Blog.js';
import HomeLoanEnquiry from '../models/HomeLoanEnquiry.js';
import LAPEnquiry from '../models/LAPEnquiry.js';
import EducationLoanEnquiry from '../models/EducationLoanEnquiry.js';
import PersonalLoanEnquiry from '../models/PersonalLoanEnquiry.js';
import BusinessLoanEnquiry from '../models/BusinessLoanEnquiry.js';
import VehicleLoanEnquiry from '../models/VehicleLoanEnquiry.js';

const emiModels = [HomeLoanEnquiry, LAPEnquiry, EducationLoanEnquiry, PersonalLoanEnquiry, BusinessLoanEnquiry, VehicleLoanEnquiry];

export const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ success: true, results: [] });
    }

    const searchRegex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
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

    const modelLabels = ['Home Loan', 'LAP', 'Education Loan', 'Personal Loan', 'Business Loan', 'Vehicle Loan'];
    const callbackIdx = 1 + emiModels.length;
    const blogIdx = callbackIdx + 1;

    allSearches[0].forEach(lead => {
      results.push({ type: 'lead', title: lead.fullName, subtitle: `${lead.phone} • ${lead.city || 'N/A'}`, label: 'Lead' });
    });

    for (let i = 0; i < emiModels.length; i++) {
      allSearches[i + 1].forEach(e => {
        results.push({ type: 'lead', title: e.fullName, subtitle: `${e.mobile || e.phone} • ${e.city || 'N/A'}`, label: modelLabels[i] });
      });
    }

    allSearches[callbackIdx].forEach(callback => {
      results.push({ type: 'callback', title: callback.fullName, subtitle: `${callback.phone} • ${callback.email}` });
    });

    allSearches[blogIdx].forEach(blog => {
      results.push({ type: 'blog', title: blog.title, subtitle: blog.category });
    });

    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};