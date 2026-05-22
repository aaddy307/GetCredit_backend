const nodemailer = require('nodemailer');
const Admin = require('../models/Admin');

const BRAND = {
  name: 'Get Credit',
  tagline: 'Your Trusted Loan Partner',
  gold: '#C9A84C',
  goldDark: '#A8892A',
  goldLight: '#E5C76B',
  dark: '#1a1a2e',
  text: '#4a4a4a',
  bg: '#ffffff',
  footerBg: '#2d2d44',
};

const baseStyles = `
  body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f4f6; }
  .wrapper { background: #f4f4f6; padding: 30px 10px; }
  .container { max-width: 600px; margin: 0 auto; background: ${BRAND.bg}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldLight}); padding: 32px 24px; text-align: center; }
  .header h1 { margin: 0; font-size: 28px; color: #fff; letter-spacing: -0.5px; }
  .header p { margin: 6px 0 0; font-size: 14px; color: rgba(255,255,255,0.85); }
  .body { padding: 32px 28px; color: ${BRAND.text}; font-size: 15px; line-height: 1.7; }
  .body h2 { color: ${BRAND.dark}; font-size: 20px; margin: 0 0 16px; }
  .card { background: #fafafc; border: 1px solid #e8e8ee; border-radius: 10px; padding: 20px; margin: 20px 0; }
  .card h3 { margin: 0 0 14px; color: ${BRAND.goldDark}; font-size: 16px; }
  .card p { margin: 6px 0; }
  .label { color: #888; font-size: 13px; }
  .value { color: ${BRAND.dark}; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
  th { background: ${BRAND.gold}; color: #fff; padding: 10px 14px; text-align: left; font-weight: 600; }
  td { padding: 10px 14px; border-bottom: 1px solid #eee; }
  tr:last-child td { border-bottom: none; }
  .badge { display: inline-block; background: ${BRAND.gold}15; color: ${BRAND.goldDark}; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
  .divider { height: 1px; background: #eee; margin: 20px 0; }
  .cta { display: inline-block; background: linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldLight}); color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 8px 0; }
  .footer { background: ${BRAND.footerBg}; padding: 24px 28px; text-align: center; }
  .footer p { margin: 4px 0; font-size: 12px; color: rgba(255,255,255,0.6); }
  .footer a { color: ${BRAND.goldLight}; text-decoration: none; }
  .footer a:hover { text-decoration: underline; }
  .footer-links { margin: 10px 0; font-size: 12px; }
  .footer-links a { color: rgba(255,255,255,0.7); text-decoration: none; margin: 0 10px; }
  .footer-links a:hover { color: ${BRAND.goldLight}; }
  @media only screen and (max-width: 480px) { .body { padding: 20px 16px; } .header { padding: 24px 16px; } }
`;

function footerHTML() {
  const year = new Date().getFullYear();
  return `
    <div class="footer">
      <div class="footer-links">
        <a href="https://get-credit.in/privacy-policy">Privacy Policy</a>
        &nbsp;|&nbsp;
        <a href="https://get-credit.in/terms">Terms &amp; Conditions</a>
      </div>
      <p>This is an automated message from ${BRAND.name}. Please do not reply directly.</p>
      <p>&copy; ${year} ${BRAND.name}. All rights reserved.</p>
    </div>`;
}

function baseWrapper(content) {
  return `
    <!DOCTYPE html>
    <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <style>${baseStyles}</style></head>
    <body><div class="wrapper"><div class="container">
      <div class="header">
        <h1>${BRAND.name}</h1>
        <p>${BRAND.tagline}</p>
      </div>
      <div class="body">${content}</div>
      ${footerHTML()}
    </div></div></body></html>`;
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.log('SMTP Error:', error);
  } else {
    console.log('SMTP Server Ready');
  }
});

const sendCustomerEmail = async (email, name, loanType, emi, tenure) => {
  if (!process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your_email_password_here') return;

  const isCallback = loanType === 'Callback Request';
  const formattedEmi = emi ? `₹${Number(emi).toLocaleString()}` : '—';

  let detailsHTML = '';
  if (!isCallback) {
    detailsHTML = `
      <div class="card">
        <h3>Loan Details</h3>
        <p><span class="label">Loan Type</span><br><span class="value">${loanType}</span></p>
        <p><span class="label">Estimated Monthly EMI</span><br><span class="value" style="color:${BRAND.goldDark};font-size:18px;">${formattedEmi}</span></p>
        ${tenure ? `<p><span class="label">Tenure</span><br><span class="value">${tenure} Year${tenure > 1 ? 's' : ''}</span></p>` : ''}
      </div>`;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: isCallback
      ? 'Callback Request Received – Get Credit'
      : 'Enquiry Submitted Successfully – Get Credit',
    html: baseWrapper(`
      <h2>Dear ${name},</h2>
      <p>Thank you for reaching out to <strong>${BRAND.name}</strong>.</p>
      <p>${isCallback
        ? 'We have received your callback request. One of our loan experts will contact you within <strong>24 hours</strong>.'
        : 'Your loan enquiry has been submitted successfully. Our team will review your details and get back to you shortly.'}</p>
      ${detailsHTML}
      <div class="divider"></div>
      <p style="font-size:14px;">If you have any questions in the meantime, feel free to:</p>
      <p style="font-size:14px;">📞 <strong>+91 7738205198</strong> / <strong>+91 8408926551</strong> / <strong>+91 8793604734</strong> &nbsp;|&nbsp; ✉️ <strong>support@get-credit.in</strong></p>
      <p>Warm regards,<br><strong>The ${BRAND.name} Team</strong></p>
    `),
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {}
};

const sendAdminNotification = async (enquiry) => {
  if (!process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your_app_password_here') return;

  const adminEmail = process.env.ADMIN_EMAIL;
  const isCallbackRequest = enquiry.loanType === 'Callback Request';

  try {
    const admin = await Admin.findOne();
    if (admin && isCallbackRequest && !admin.notifications?.emailOnCallbackRequest) return;
  } catch (err) {}

  const timestamp = new Date(enquiry.createdAt).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  let content;
  if (isCallbackRequest) {
    content = `
      <div style="text-align:center;margin-bottom:8px;"><span class="badge">Callback Request</span></div>
      <h2>New Callback Request</h2>
      <div class="card">
        <p><span class="label">Name</span><br><span class="value">${enquiry.fullName}</span></p>
        <p><span class="label">Phone</span><br><span class="value" style="font-size:17px;">${enquiry.phone}</span></p>
        <p><span class="label">Email</span><br><span class="value">${enquiry.email}</span></p>
        <p><span class="label">City</span><br><span class="value">${enquiry.city || 'N/A'}</span></p>
        <p><span class="label">Requested On</span><br><span class="value">${timestamp}</span></p>
        ${enquiry.message ? `<div class="divider"></div><p><span class="label">Message</span><br>${enquiry.message}</p>` : ''}
      </div>
      <p style="text-align:center;margin:0;"><a href="https://get-credit.in/admin/dashboard" class="cta">View in Dashboard</a></p>
      <p style="text-align:center;color:#cc4444;font-weight:600;margin-top:16px;">⚡ Action Required — Contact the customer promptly.</p>`;
  } else {
    content = `
      <div style="text-align:center;margin-bottom:8px;"><span class="badge">New Enquiry</span></div>
      <h2>Loan Enquiry Received</h2>
      <div class="card">
        <p><span class="label">Name</span><br><span class="value">${enquiry.fullName}</span></p>
        <p><span class="label">Phone</span><br><span class="value" style="font-size:17px;">${enquiry.phone}</span></p>
        <p><span class="label">Email</span><br><span class="value">${enquiry.email}</span></p>
        <p><span class="label">City</span><br><span class="value">${enquiry.city || 'N/A'}</span></p>
      </div>
      <table>
        <tr><th>Field</th><th>Details</th></tr>
        <tr><td>Loan Type</td><td><strong>${enquiry.loanType}</strong></td></tr>
        <tr><td>Loan Amount</td><td><strong>₹${Number(enquiry.loanAmount).toLocaleString()}</strong></td></tr>
        ${enquiry.interestRate ? `<tr><td>Interest Rate</td><td>${enquiry.interestRate}%</td></tr>` : ''}
        ${enquiry.tenure ? `<tr><td>Tenure</td><td>${enquiry.tenure} Years</td></tr>` : ''}
        ${enquiry.emi ? `<tr><td>Monthly EMI</td><td><strong style="color:${BRAND.goldDark};">₹${Number(enquiry.emi).toLocaleString()}</strong></td></tr>` : ''}
        <tr><td>Requested On</td><td>${timestamp}</td></tr>
      </table>
      <p style="text-align:center;margin:0;"><a href="https://get-credit.in/admin/dashboard" class="cta">View in Dashboard</a></p>
      <p style="text-align:center;color:#cc4444;font-weight:600;margin-top:16px;">⚡ Action Required — Contact the customer within 24 hours.</p>`;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: adminEmail,
    subject: isCallbackRequest
      ? 'New Callback Request – Get Credit Admin'
      : `New ${enquiry.loanType} Enquiry – Get Credit Admin`,
    html: baseWrapper(content),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Admin notification sent to ${adminEmail}`);
  } catch (error) {
    console.log('Admin notification not sent (server may not be configured)');
  }
};

module.exports = { sendCustomerEmail, sendAdminNotification };