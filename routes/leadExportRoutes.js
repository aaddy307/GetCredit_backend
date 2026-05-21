const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const Enquiry = require('../models/Enquiry');
const xlsx = require('xlsx');

router.get('/export', protect, requirePermission('leads', 'export'), async (req, res) => {
  try {
    const { status, loanType, startDate, endDate, format = 'xlsx' } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (loanType) query.loanType = loanType;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const leads = await Enquiry.find(query).sort({ createdAt: -1 }).lean();

    const data = leads.map(l => ({
      Name: l.fullName,
      Phone: l.phone,
      Email: l.email,
      City: l.city || '',
      'Loan Type': l.loanType,
      Amount: l.loanAmount,
      Status: l.status,
      Source: l.leadSource || '',
      'Created At': l.createdAt ? new Date(l.createdAt).toLocaleString() : ''
    }));

    if (format === 'csv') {
      const header = Object.keys(data[0] || {}).join(',');
      const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(','));
      const csv = [header, ...rows].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=leads.csv');
      return res.send(csv);
    }

    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Leads');
    
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=leads.xlsx');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/import', protect, requirePermission('leads', 'import'), async (req, res) => {
  try {
    const { leads } = req.body;

    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ success: false, message: 'No leads data provided' });
    }

    const results = { success: 0, failed: 0, errors: [] };

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      try {
        if (!lead.fullName || !lead.phone || !lead.email) {
          results.failed++;
          results.errors.push({ row: i + 1, error: 'Missing required fields: fullName, phone, email' });
          continue;
        }

        await Enquiry.create({
          fullName: lead.fullName,
          phone: lead.phone,
          email: lead.email,
          city: lead.city || '',
          loanType: lead.loanType || 'Home Loan',
          loanAmount: parseInt(lead.loanAmount) || 0,
          status: lead.status || 'Pending',
          leadSource: lead.leadSource || 'Import'
        });
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push({ row: i + 1, error: err.message });
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
