import { resend, FROM_ADDRESS } from '../lib/resend.js';
import {
  buildCallbackClientEmail,
  buildCallbackAdminEmail,
  buildEnquiryClientEmail,
  buildEnquiryAdminEmail,
  buildAdminComposeEmail,
} from './emailTemplates.js';

const isTest = process.env.NODE_ENV === 'test';

function sanitizeHtml(input) {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*on\w+\s*=\s*["'][^"']*["'][^>]*>/gi, '')
    .replace(/<[^>]*on\w+\s*=\s*[^\s>]+[^>]*>/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/onerror\s*=/gi, '');
}

async function sendEmail({ to, subject, html }) {
  if (isTest) return;

  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('Resend not configured. Skipping email.');
      return;
    }

    const recipients = Array.isArray(to) ? to : [to];

    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: recipients,
      subject,
      html,
    });

    if (result?.error) {
      throw new Error(`Resend error: ${result.error.message || JSON.stringify(result.error)}`);
    }
  } catch (error) {
    throw error;
  }
}

export async function sendCallbackClient(name, phone, loanType, createdAt, toEmail) {
  const html = buildCallbackClientEmail({ name, phone, loanType, createdAt });
  return sendEmail({
    to: toEmail,
    subject: 'Callback Request Received – Get Credit',
    html,
  });
}

export async function sendCallbackAdmin({ name, phone, email, city, loanType, source, createdAt }) {
  const adminEmail = process.env.ADMIN_EMAIL || 'support@get-credit.in';
  const html = buildCallbackAdminEmail({ name, phone, email, city, loanType, source, createdAt });
  return sendEmail({
    to: adminEmail,
    subject: 'New Callback Request – Get Credit Admin',
    html,
  });
}

export async function sendEnquiryClient({ name, loanType, loanAmount, emi, tenure, tenureUnit, city, createdAt, toEmail }) {
  const html = buildEnquiryClientEmail({ name, loanType, loanAmount, emi, tenure, tenureUnit, city, createdAt });
  return sendEmail({
    to: toEmail,
    subject: 'Enquiry Submitted Successfully – Get Credit',
    html,
  });
}

export async function sendEnquiryAdmin({ name, phone, email, city, loanType, loanAmount, emi, tenure, tenureUnit, interestRate, source, createdAt }) {
  const adminEmail = process.env.ADMIN_EMAIL || 'support@get-credit.in';
  const html = buildEnquiryAdminEmail({ name, phone, email, city, loanType, loanAmount, emi, tenure, tenureUnit, interestRate, source, createdAt });
  return sendEmail({
    to: adminEmail,
    subject: `New ${loanType || 'Loan'} Enquiry – Get Credit Admin`,
    html,
  });
}

export async function sendAdminComposeEmail({ to, subject, body }) {
  const html = buildAdminComposeEmail({ body: sanitizeHtml(body).replace(/\n/g, '<br>') });
  return sendEmail({
    to,
    subject,
    html,
  });
}
