import {
  sendCallbackClient,
  sendCallbackAdmin,
  sendEnquiryClient,
  sendEnquiryAdmin,
} from '../services/emailService.js';

const isTest = process.env.NODE_ENV === 'test';

export const sendCustomerEmail = async (email, name, loanType, emi, tenure, tenureUnit, phone = '', city = '', loanAmount) => {
  if (isTest) return;
  try {
    const isCallback = loanType === 'Callback Request';

    if (isCallback) {
      await sendCallbackClient(name, phone, loanType, new Date().toISOString(), email);
      return;
    }

    await sendEnquiryClient({
      toEmail: email,
      name,
      loanType,
      loanAmount: loanAmount || undefined,
      emi: emi || undefined,
      tenure: tenure || undefined,
      tenureUnit: tenureUnit || undefined,
      city: city || undefined,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`Customer email to ${email} failed:`, error.message);
  }
};

export const sendAdminNotification = async (enquiry) => {
  if (isTest) return;
  try {
    const isCallbackRequest = enquiry.loanType === 'Callback Request';

    if (isCallbackRequest) {
      await sendCallbackAdmin({
        name: enquiry.fullName || '',
        phone: enquiry.phone || enquiry.mobile || '',
        email: enquiry.email || '',
        city: enquiry.city || '',
        loanType: enquiry.loanType || '',
        source: enquiry.leadSource || 'Website',
        createdAt: enquiry.createdAt,
      });
      return;
    }

    await sendEnquiryAdmin({
      name: enquiry.fullName || '',
      phone: enquiry.phone || enquiry.mobile || '',
      email: enquiry.email || '',
      city: enquiry.city || '',
      loanType: enquiry.loanType || '',
      loanAmount: enquiry.loanAmount || 0,
      emi: enquiry.emi || enquiry.calculatedEMI || undefined,
      tenure: enquiry.tenure || enquiry.tenureYears || undefined,
      tenureUnit: enquiry.tenureUnit || undefined,
      interestRate: enquiry.interestRate || undefined,
      source: enquiry.leadSource || 'Website',
      createdAt: enquiry.createdAt,
    });
  } catch (error) {
    console.error(`Admin notification for ${enquiry?.fullName || 'unknown'} failed:`, error.message);
  }
};