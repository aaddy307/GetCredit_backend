const Enquiry = require('../models/Enquiry');
const xlsx = require('xlsx');

exports.exportExcel = async (req, res) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });

    const data = enquiries.map(enquiry => ({
      'Full Name': enquiry.fullName,
      'Phone': enquiry.phone,
      'Email': enquiry.email,
      'City': enquiry.city || '',
      'Loan Type': enquiry.loanType,
      'Loan Amount': enquiry.loanAmount,
      'Interest Rate': enquiry.interestRate,
      'Tenure (Years)': enquiry.tenure,
      'Monthly EMI': enquiry.emi,
      'Status': enquiry.status,
      'Lead Source': enquiry.leadSource,
      'Assigned To': enquiry.assignedTo || '',
      'Notes': enquiry.notes || '',
      'Follow Up Date': enquiry.followUpDate ? new Date(enquiry.followUpDate).toLocaleDateString() : '',
      'Created Date': new Date(enquiry.createdAt).toLocaleDateString(),
      'Created Time': new Date(enquiry.createdAt).toLocaleTimeString()
    }));

    const ws = xlsx.utils.json_to_sheet(data);
    
    const columnWidths = [
      { wch: 20 },
      { wch: 15 },
      { wch: 30 },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 30 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 }
    ];
    
    ws['!cols'] = columnWidths;

    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Enquiries');

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=GetCredit_Enquiries.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};