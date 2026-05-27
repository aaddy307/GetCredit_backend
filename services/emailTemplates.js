const YEAR = new Date().getFullYear();

const MONTH_TENURE_LOANS = ['Personal Loan', 'Non-Salaried Loan', 'Business Loan'];

function fmtDate(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
}

function fmtDateShort(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
}

function fmtInr(n) {
  return '\u20B9' + Number(n).toLocaleString('en-IN');
}

function getTenureUnit(loanType, tenureUnit) {
  if (tenureUnit) return tenureUnit;
  return MONTH_TENURE_LOANS.includes(loanType) ? 'Months' : 'Years';
}

function esc(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildEmailLayout(previewText, bodyHtml) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Get Credit</title>
<style>@media only screen and (max-width:600px){.email-container{width:100%!important}.email-padding{padding:24px 20px!important}.email-header{padding:32px 20px 24px!important}.email-footer{padding:20px!important}}</style>
</head>
<body style="margin:0;padding:0;background:#f0f0f5;font-family:Arial,Helvetica,sans-serif;width:100%;">
  <div style="display:none;font-size:1px;color:#f0f0f5;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${esc(previewText)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f5;">
    <tr><td style="padding:40px 16px;">
      <table class="email-container" role="presentation" align="center" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.08);">
        <tr><td class="email-header" style="background:linear-gradient(135deg,#caa646,#d4af37);padding:40px 32px 32px;text-align:center;">
          <img src="https://res.cloudinary.com/dkxensqtm/image/upload/v1779855800/WhatsApp_Image_2026-05-22_at_11.18.47_AM_myiqvp.jpg" alt="Get Credit" width="56" height="56" style="display:block;margin:0 auto 14px;border-radius:14px;border:0;" />
          <h1 style="margin:0;font-size:24px;color:#fff;font-weight:700;letter-spacing:-0.3px;">Get Credit</h1>
          <p style="margin:4px 0 0;font-size:14px;color:rgba(255,255,255,0.85);font-weight:400;">Your Trusted Loan Partner</p>
        </td></tr>
        <tr><td class="email-padding" style="padding:32px 32px 28px;color:#4a4a4a;font-size:15px;line-height:1.7;">
          ${bodyHtml}
        </td></tr>
        <tr><td class="email-footer" style="background:#1a1a2e;padding:24px 32px 20px;text-align:center;">
          <div style="width:32px;height:2px;background:#caa646;margin:0 auto 12px;border-radius:2px;"></div>
          <p style="margin:0 0 10px;font-size:12px;">
            <a href="https://get-credit.in" style="color:rgba(255,255,255,0.45);text-decoration:none;margin:0 10px;font-size:12px;">Home</a>
            <a href="https://get-credit.in/services" style="color:rgba(255,255,255,0.45);text-decoration:none;margin:0 10px;font-size:12px;">Services</a>
            <a href="https://get-credit.in/contact" style="color:rgba(255,255,255,0.45);text-decoration:none;margin:0 10px;font-size:12px;">Contact</a>
            <a href="https://get-credit.in/privacy-policy" style="color:rgba(255,255,255,0.45);text-decoration:none;margin:0 10px;font-size:12px;">Privacy</a>
          </p>
          <p style="margin:3px 0;font-size:11px;color:rgba(255,255,255,0.3);line-height:1.6;">Phone: +91 7738205198 / +91 8408926551 / +91 8793604734</p>
          <p style="margin:3px 0 10px;font-size:11px;color:rgba(255,255,255,0.3);line-height:1.6;">
            <a href="mailto:support@get-credit.in" style="color:#d4af37;text-decoration:none;font-size:12px;">support@get-credit.in</a>
          </p>
          <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:10px 0;">
          <p style="margin:3px 0;font-size:11px;color:rgba(255,255,255,0.25);line-height:1.5;">This is an automated message from Get Credit. Please do not reply directly.</p>
          <p style="margin:3px 0;font-size:11px;color:rgba(255,255,255,0.25);">&copy; ${YEAR} Get Credit. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildSummaryCard(title, rows) {
  if (!rows || rows.length === 0) return '';
  const rowsHtml = rows.map(({ label, value, emi }) => {
    const val = emi
      ? fmtInr(value)
      : (value != null && value !== '' ? String(value) : '\u2014');
    const valStyle = emi
      ? 'padding:12px 0;width:60%;color:#b8912c;font-size:18px;font-weight:800;vertical-align:top;border-bottom:1px solid #eeeef6;letter-spacing:-0.3px;'
      : 'padding:12px 0;width:60%;color:#1f1f1f;font-size:15px;font-weight:600;vertical-align:top;border-bottom:1px solid #eeeef6;';
    return `<tr>
  <td style="padding:12px 16px 12px 0;width:40%;color:#8a8a8a;font-size:14px;font-weight:500;vertical-align:top;border-bottom:1px solid #eeeef6;white-space:nowrap;">${esc(label)}</td>
  <td style="${valStyle}">${esc(val)}</td>
</tr>`;
  }).join('');

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafe;border:1px solid #e8e8f0;border-radius:14px;margin:20px 0;">
  <tr><td style="padding:24px;">
    ${title ? `<div style="margin-bottom:16px;padding-bottom:14px;border-bottom:2px solid #caa646;"><p style="margin:0;color:#b8912c;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">${esc(title)}</p></div>` : ''}
    <table style="width:100%;border-collapse:collapse;" cellpadding="0" cellspacing="0">
      <tbody>${rowsHtml}</tbody>
    </table>
  </td></tr>
</table>`;
}

function buildLeadBadge() {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="text-align:center;margin-bottom:20px;">
  <tr><td style="text-align:center;">
    <span style="display:inline-block;background:rgba(202,166,70,0.12);color:#b8912c;padding:6px 20px;border-radius:20px;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">New Lead</span>
  </td></tr>
</table>`;
}

export function buildCallbackClientEmail({ name, phone, loanType, createdAt }) {
  const dateStr = fmtDate(createdAt);
  const body = `
    <p style="font-size:17px;color:#1a1a2e;font-weight:600;margin:0 0 16px;">Dear ${esc(name || '')},</p>
    <p>Thank you for reaching out to <strong>Get Credit</strong>. We have received your callback request and one of our dedicated loan experts will contact you within <strong>24 hours</strong>.</p>
    ${buildSummaryCard('Callback Request Summary', [
      { label: 'Name', value: name },
      { label: 'Phone', value: phone },
      { label: 'Loan Type', value: loanType },
      { label: 'Requested At', value: dateStr },
    ])}
    <p>Our team is ready to assist you with the best loan options tailored to your needs. We look forward to speaking with you.</p>
    <p style="margin-top:24px;color:#888;font-size:14px;">For any assistance, feel free to contact our support team at <strong>support@get-credit.in</strong>.</p>
    <p style="margin-top:24px;">Warm regards,<br><strong style="color:#b8912c;font-size:16px;">The Get Credit Team</strong></p>
  `;
  return buildEmailLayout("We've received your callback request — Get Credit", body);
}

export function buildCallbackAdminEmail({ name, phone, email, city, loanType, source, createdAt }) {
  const dateStr = fmtDate(createdAt);
  const body = `
    ${buildLeadBadge()}
    <p style="font-size:17px;color:#1a1a2e;font-weight:600;margin:0 0 16px;">New Callback Request Received</p>
    <p>A new customer has requested a callback. Details are provided below for immediate follow-up.</p>
    ${buildSummaryCard('Lead Details', [
      { label: 'Name', value: name },
      { label: 'Phone', value: phone },
      { label: 'Email', value: email },
      { label: 'City', value: city },
      { label: 'Loan Type', value: loanType },
      { label: 'Source', value: source || 'Website' },
      { label: 'Submitted At', value: dateStr },
    ])}
    <p style="margin-top:24px;color:#888;font-size:14px;">Please follow up with this lead at the earliest opportunity. Contact the customer using the details above.</p>
    <p style="margin-top:24px;">Regards,<br><strong style="color:#b8912c;font-size:16px;">Get Credit System</strong></p>
  `;
  return buildEmailLayout('New Callback Request — Get Credit Admin', body);
}

export function buildEnquiryClientEmail({ name, loanType, loanAmount, emi, tenure, tenureUnit, city, createdAt }) {
  const unit = getTenureUnit(loanType, tenureUnit);
  const dateStr = fmtDateShort(createdAt);
  const rows = [
    { label: 'Loan Type', value: loanType },
    { label: 'Loan Amount', value: loanAmount ? fmtInr(loanAmount) : '\u2014' },
    ...(emi ? [{ label: 'Monthly EMI', value: emi, emi: true }] : []),
    { label: 'Tenure', value: tenure ? `${tenure} ${unit}` : '\u2014' },
    { label: 'City', value: city },
    { label: 'Submitted On', value: dateStr },
  ];

  const body = `
    <p style="font-size:17px;color:#1a1a2e;font-weight:600;margin:0 0 16px;">Dear ${esc(name || '')},</p>
    <p>Thank you for choosing <strong>Get Credit</strong> for your loan needs. Your enquiry has been submitted successfully and our experienced team will review your details shortly.</p>
    ${buildSummaryCard('Enquiry Summary', rows)}
    <p>Our team will review your application and contact you with personalized loan solutions within <strong>24 hours</strong>.</p>
    <p style="margin-top:24px;color:#888;font-size:14px;">For any assistance, feel free to contact our support team at <strong>support@get-credit.in</strong>.</p>
    <p style="margin-top:24px;">Warm regards,<br><strong style="color:#b8912c;font-size:16px;">The Get Credit Team</strong></p>
  `;
  return buildEmailLayout('Your loan enquiry has been submitted — Get Credit', body);
}

export function buildEnquiryAdminEmail({ name, phone, email, city, loanType, loanAmount, emi, tenure, tenureUnit, interestRate, source, createdAt }) {
  const unit = getTenureUnit(loanType, tenureUnit);
  const dateStr = fmtDate(createdAt);

  const loanRows = [
    { label: 'Loan Type', value: loanType },
    { label: 'Loan Amount', value: loanAmount, emi: true },
    ...(emi ? [{ label: 'Monthly EMI', value: emi, emi: true }] : []),
    { label: 'Tenure', value: tenure ? `${tenure} ${unit}` : '\u2014' },
    ...(interestRate ? [{ label: 'Interest Rate', value: `${interestRate}%` }] : []),
    { label: 'Source', value: source || 'Website' },
    { label: 'Submitted At', value: dateStr },
  ];

  const body = `
    ${buildLeadBadge()}
    <p style="font-size:17px;color:#1a1a2e;font-weight:600;margin:0 0 16px;">New ${esc(loanType || 'Loan')} Enquiry</p>
    <p>A new customer has submitted a loan enquiry. Details are provided below for review and follow-up.</p>
    ${buildSummaryCard('Contact Details', [
      { label: 'Name', value: name },
      { label: 'Phone', value: phone },
      { label: 'Email', value: email },
      { label: 'City', value: city },
    ])}
    ${buildSummaryCard('Loan Details', loanRows)}
    <p style="margin-top:24px;color:#888;font-size:14px;">Please review this new enquiry and follow up with the customer at the earliest opportunity using the contact details above.</p>
    <p style="margin-top:24px;">Regards,<br><strong style="color:#b8912c;font-size:16px;">Get Credit System</strong></p>
  `;
  return buildEmailLayout('New Loan Enquiry — Get Credit Admin', body);
}

export function buildAdminComposeEmail({ body }) {
  const bodyHtml = `
    ${body || ''}
    <p style="margin-top:24px;">Warm regards,<br><strong style="color:#b8912c;font-size:16px;">The Get Credit Team</strong></p>
  `;
  return buildEmailLayout('Message from Get Credit Admin', bodyHtml);
}
