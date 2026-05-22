const { Resend } = require('resend');
const Admin = require('../models/Admin');

const isTest = process.env.NODE_ENV === 'test';
const resend = isTest ? null : new Resend(process.env.RESEND_API_KEY);

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
  if (isTest) return;
  try {
    if (!resend) {
      console.log('Resend not configured. Skipping customer email.');
      return;
    }

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
  if (isTest) return;
  try {
    if (!resend) {
      console.log('Resend not configured. Skipping admin notification.');
      return;
    }

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
