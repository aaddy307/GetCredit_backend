const { Resend } = require('resend');
const Admin = require('../models/Admin');

const resend = new Resend(process.env.RESEND_API_KEY);

const BRAND = {
  name: 'Get Credit',
  tagline: 'Your Trusted Loan Partner',
  gold: '#C9A84C',
  goldDark: '#A8892A',
  goldLight: '#E5C76B',
  dark: '#1a1a2e',
  text: '#4a4a4a',
  bg: '#ffffff',
  footerBg: '#1e1e32',
};

const baseStyles = `
  body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f0f0f5; -webkit-font-smoothing: antialiased; }
  .wrapper { background: #f0f0f5; padding: 40px 16px; }
  .container { max-width: 560px; margin: 0 auto; background: ${BRAND.bg}; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 40px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, ${BRAND.gold} 0%, ${BRAND.goldLight} 100%); padding: 36px 32px 32px; text-align: center; position: relative; }
  .header::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 20% 80%, rgba(255,255,255,0.15) 0%, transparent 50%); }
  .header-logo { width: 52px; height: 52px; background: rgba(255,255,255,0.2); border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px; backdrop-filter: blur(4px); }
  .header-logo span { font-size: 24px; font-weight: 800; color: #fff; letter-spacing: -1px; }
  .header h1 { position: relative; margin: 0; font-size: 26px; color: #fff; letter-spacing: -0.5px; font-weight: 700; }
  .header p { position: relative; margin: 4px 0 0; font-size: 14px; color: rgba(255,255,255,0.85); font-weight: 400; }
  .body { padding: 36px 32px; color: ${BRAND.text}; font-size: 15px; line-height: 1.7; }
  .body h2 { color: ${BRAND.dark}; font-size: 20px; margin: 0 0 12px; font-weight: 700; }
  .card { background: #f8f8fc; border: 1px solid #e8e8f0; border-radius: 12px; padding: 24px; margin: 20px 0; }
  .card h3 { margin: 0 0 16px; color: ${BRAND.goldDark}; font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  .card-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; }
  .card-row + .card-row { border-top: 1px solid #eeeef6; }
  .label { color: #888; font-size: 13px; }
  .value { color: ${BRAND.dark}; font-weight: 600; text-align: right; }
  .emi-value { color: ${BRAND.goldDark}; font-weight: 700; font-size: 20px; }
  .divider { height: 1px; background: linear-gradient(to right, transparent, #e0e0ea, transparent); margin: 24px 0; }
  .contact-block { background: #f8f8fc; border-radius: 12px; padding: 20px 24px; margin: 20px 0; }
  .contact-block p { margin: 6px 0; font-size: 14px; color: ${BRAND.text}; }
  .contact-block strong { color: ${BRAND.dark}; }
  table { width: 100%; border-collapse: separate; border-spacing: 0; margin: 16px 0; font-size: 14px; border-radius: 10px; overflow: hidden; border: 1px solid #e8e8f0; }
  th { background: ${BRAND.gold}; color: #fff; padding: 12px 16px; text-align: left; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
  td { padding: 12px 16px; border-bottom: 1px solid #eeeef6; color: ${BRAND.text}; }
  tr:last-child td { border-bottom: none; }
  td:first-child { font-weight: 500; color: #888; }
  td:last-child { font-weight: 600; color: ${BRAND.dark}; }
  .badge { display: inline-block; background: rgba(201,168,76,0.12); color: ${BRAND.goldDark}; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; letter-spacing: 0.3px; }
  .cta-wrapper { text-align: center; margin: 24px 0 8px; }
  .cta { display: inline-block; background: linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldLight}); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 16px rgba(201,168,76,0.3); }
  .cta:hover { box-shadow: 0 6px 24px rgba(201,168,76,0.4); }
  .action-required { text-align: center; color: #d43b3b; font-weight: 700; font-size: 14px; margin-top: 20px; padding: 12px; background: #fef2f2; border-radius: 10px; }
  .footer { background: ${BRAND.footerBg}; padding: 28px 32px; text-align: center; }
  .footer-links { margin: 0 0 12px; font-size: 13px; }
  .footer-links a { color: rgba(255,255,255,0.6); text-decoration: none; margin: 0 12px; transition: color 0.2s; }
  .footer-links a:hover { color: ${BRAND.goldLight}; }
  .footer p { margin: 3px 0; font-size: 12px; color: rgba(255,255,255,0.4); line-height: 1.6; }
  .greeting { font-size: 16px; color: ${BRAND.dark}; }
  @media only screen and (max-width: 480px) { .wrapper { padding: 20px 8px; } .body { padding: 24px 20px; } .header { padding: 28px 20px 24px; } .card { padding: 16px; } .contact-block { padding: 16px 20px; } .cta { display: block; } }
`;

function footerHTML() {
  const year = new Date().getFullYear();
  return `
    <div class="footer">
      <div class="footer-links">
        <a href="https://get-credit.in/privacy-policy">Privacy Policy</a>
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
        <div class="header-logo"><span>GC</span></div>
        <h1>${BRAND.name}</h1>
        <p>${BRAND.tagline}</p>
      </div>
      <div class="body">${content}</div>
      ${footerHTML()}
    </div></div></body></html>`;
}

function contactHTML() {
  return `
    <div class="contact-block">
      <p>📞 <strong>+91 7738205198</strong> &nbsp;/&nbsp; <strong>+91 8408926551</strong> &nbsp;/&nbsp; <strong>+91 8793604734</strong></p>
      <p>✉️ <strong>support@get-credit.in</strong></p>
    </div>`;
}

const FROM_ADDRESS = 'Get Credit <support@get-credit.in>';

const sendCustomerEmail = async (email, name, loanType, emi, tenure) => {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_xxxxxxxxxxxx') return;

  const isCallback = loanType === 'Callback Request';
  const formattedEmi = emi ? `₹${Number(emi).toLocaleString()}` : '—';

  let detailsHTML = '';
  if (!isCallback) {
    detailsHTML = `
      <div class="card">
        <h3>Loan Details</h3>
        <div class="card-row"><span class="label">Loan Type</span><span class="value">${loanType}</span></div>
        <div class="card-row"><span class="label">Estimated EMI</span><span class="emi-value">${formattedEmi}</span></div>
        ${tenure ? `<div class="card-row"><span class="label">Tenure</span><span class="value">${tenure} Year${tenure > 1 ? 's' : ''}</span></div>` : ''}
      </div>`;
  }

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: isCallback
        ? 'Callback Request Received – Get Credit'
        : 'Enquiry Submitted Successfully – Get Credit',
      html: baseWrapper(`
        <p class="greeting">Dear ${name},</p>
        <p>Thank you for reaching out to <strong>${BRAND.name}</strong>.</p>
        <p>${isCallback
          ? 'We have received your callback request. One of our loan experts will contact you within <strong>24 hours</strong>.'
          : 'Your loan enquiry has been submitted successfully. Our team will review your details and get back to you shortly.'}</p>
        ${detailsHTML}
        <div class="divider"></div>
        <p style="font-size:14px;color:#888;">If you have any questions in the meantime, feel free to contact us:</p>
        ${contactHTML()}
        <p style="margin-top:20px;">Warm regards,<br><strong style="color:${BRAND.goldDark};">The ${BRAND.name} Team</strong></p>
      `),
    });
  } catch (error) {
    console.error('Customer email error:', error.message);
    if (error.statusCode) console.error('Status:', error.statusCode);
  }
};

const sendAdminNotification = async (enquiry) => {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_xxxxxxxxxxxx') return;

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
      <div style="text-align:center;margin-bottom:4px;"><span class="badge">Callback Request</span></div>
      <h2 style="text-align:center;">New Callback Request</h2>
      <div class="card">
        <div class="card-row"><span class="label">Name</span><span class="value">${enquiry.fullName}</span></div>
        <div class="card-row"><span class="label">Phone</span><span class="value" style="font-size:16px;">${enquiry.phone}</span></div>
        <div class="card-row"><span class="label">Email</span><span class="value">${enquiry.email}</span></div>
        <div class="card-row"><span class="label">City</span><span class="value">${enquiry.city || 'N/A'}</span></div>
        <div class="card-row"><span class="label">Requested On</span><span class="value">${timestamp}</span></div>
      </div>
      ${enquiry.message ? `<div class="card"><div class="card-row"><span class="label">Message</span></div><p style="margin:8px 0 0;color:#4a4a4a;">${enquiry.message}</p></div>` : ''}
      <div class="cta-wrapper"><a href="https://get-credit.in/admin/dashboard" class="cta">View in Dashboard</a></div>
      <div class="action-required">⚡ Action Required — Contact the customer promptly</div>`;
  } else {
    content = `
      <div style="text-align:center;margin-bottom:4px;"><span class="badge">New Enquiry</span></div>
      <h2 style="text-align:center;">Loan Enquiry Received</h2>
      <div class="card">
        <div class="card-row"><span class="label">Name</span><span class="value">${enquiry.fullName}</span></div>
        <div class="card-row"><span class="label">Phone</span><span class="value" style="font-size:16px;">${enquiry.phone}</span></div>
        <div class="card-row"><span class="label">Email</span><span class="value">${enquiry.email}</span></div>
        <div class="card-row"><span class="label">City</span><span class="value">${enquiry.city || 'N/A'}</span></div>
      </div>
      <table>
        <tr><th colspan="2">Enquiry Details</th></tr>
        <tr><td>Loan Type</td><td>${enquiry.loanType}</td></tr>
        <tr><td>Loan Amount</td><td>₹${Number(enquiry.loanAmount).toLocaleString()}</td></tr>
        ${enquiry.interestRate ? `<tr><td>Interest Rate</td><td>${enquiry.interestRate}%</td></tr>` : ''}
        ${enquiry.tenure ? `<tr><td>Tenure</td><td>${enquiry.tenure} Years</td></tr>` : ''}
        ${enquiry.emi ? `<tr><td>Monthly EMI</td><td style="color:${BRAND.goldDark};font-weight:700;">₹${Number(enquiry.emi).toLocaleString()}</td></tr>` : ''}
        <tr><td>Requested On</td><td>${timestamp}</td></tr>
      </table>
      <div class="cta-wrapper"><a href="https://get-credit.in/admin/dashboard" class="cta">View in Dashboard</a></div>
      <div class="action-required">⚡ Action Required — Contact the customer within 24 hours</div>`;
  }

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: adminEmail,
      subject: isCallbackRequest
        ? 'New Callback Request – Get Credit Admin'
        : `New ${enquiry.loanType} Enquiry – Get Credit Admin`,
      html: baseWrapper(content),
    });
    console.log(`Admin notification sent to ${adminEmail}`);
  } catch (error) {
    console.error('Admin notification error:', error.message);
    if (error.statusCode) console.error('Status:', error.statusCode);
  }
};

module.exports = { sendCustomerEmail, sendAdminNotification };
