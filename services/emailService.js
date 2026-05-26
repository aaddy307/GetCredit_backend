const { resend, FROM_ADDRESS } = require('../lib/resend');

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const isTest = process.env.NODE_ENV === 'test';

async function renderTemplate(template, data) {
  try {
    const response = await fetch(`${APP_URL}/api/emails/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template, data }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Render failed');
    }

    const { html } = await response.json();
    return html;
  } catch (error) {
    console.error(`Render error for template "${template}":`, error.message);
    throw error;
  }
}

async function sendEmail({ to, subject, template, data }) {
  if (isTest) return;

  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('Resend not configured. Skipping email.');
      return;
    }

    const html = await renderTemplate(template, data);

    const recipients = Array.isArray(to) ? to : [to];

    await resend.emails.send({
      from: FROM_ADDRESS,
      to: recipients,
      subject,
      html,
    });

    console.log(`Email sent: "${subject}" to ${recipients.join(', ')}`);
  } catch (error) {
    console.error(`Email send error for "${subject}":`, error.message);
    throw error;
  }
}

async function sendCallbackClient(name, phone, loanType, createdAt, toEmail) {
  return sendEmail({
    to: toEmail,
    subject: 'Callback Request Received – Get Credit',
    template: 'callbackClient',
    data: { name, phone, loanType, createdAt },
  });
}

async function sendCallbackAdmin({ name, phone, email, city, loanType, source, createdAt }) {
  const adminEmail = process.env.ADMIN_EMAIL || 'support@get-credit.in';
  return sendEmail({
    to: adminEmail,
    subject: 'New Callback Request – Get Credit Admin',
    template: 'callbackAdmin',
    data: { name, phone, email, city, loanType, source, createdAt },
  });
}

async function sendEnquiryClient({ name, loanType, loanAmount, emi, tenure, tenureUnit, city, createdAt, toEmail }) {
  return sendEmail({
    to: toEmail,
    subject: 'Enquiry Submitted Successfully – Get Credit',
    template: 'enquiryClient',
    data: { name, loanType, loanAmount, emi, tenure, tenureUnit, city, createdAt },
  });
}

async function sendEnquiryAdmin({ name, phone, email, city, loanType, loanAmount, emi, tenure, tenureUnit, interestRate, source, createdAt }) {
  const adminEmail = process.env.ADMIN_EMAIL || 'support@get-credit.in';
  return sendEmail({
    to: adminEmail,
    subject: `New ${loanType || 'Loan'} Enquiry – Get Credit Admin`,
    template: 'enquiryAdmin',
    data: { name, phone, email, city, loanType, loanAmount, emi, tenure, tenureUnit, interestRate, source, createdAt },
  });
}

function sanitizeHtml(input) {
  const safe = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*on\w+\s*=\s*["'][^"']*["'][^>]*>/gi, '')
    .replace(/<[^>]*on\w+\s*=\s*[^\s>]+[^>]*>/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/onerror\s*=/gi, '');
  return safe;
}

async function sendAdminComposeEmail({ to, subject, body }) {
  return sendEmail({
    to,
    subject,
    template: 'adminCompose',
    data: { body: sanitizeHtml(body).replace(/\n/g, '<br>') },
  });
}

module.exports = {
  sendCallbackClient,
  sendCallbackAdmin,
  sendEnquiryClient,
  sendEnquiryAdmin,
  sendAdminComposeEmail,
};
