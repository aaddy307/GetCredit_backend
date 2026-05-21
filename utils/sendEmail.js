const nodemailer = require('nodemailer');
const Admin = require('../models/Admin');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.log('SMTP Error:', error);
  } else {
    console.log('SMTP Server Ready');
  }
});

const sendCustomerEmail = async (email, name, loanType, emi, tenure) => {
  if (!process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your_email_password_here') {
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Enquiry Submitted Successfully - Get Credit',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #C9952A; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .highlight { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Get Credit</h1>
            <p>Fast & Easy Loan Solutions</p>
          </div>
          <div class="content">
            <h2>Dear ${name},</h2>
            <p>Thank you for choosing Get Credit! Your loan enquiry has been submitted successfully.</p>
            <div class="highlight">
              <h3 style="margin: 0 0 10px 0; color: #C9952A;">Your Loan Details</h3>
              <p><strong>Loan Type:</strong> ${loanType}</p>
              <p><strong>Monthly EMI:</strong> ₹${emi.toLocaleString()}</p>
              <p><strong>Tenure:</strong> ${tenure} Years</p>
            </div>
            <p>Our executive will contact you within 24 hours to guide you through the next steps.</p>
            <p>If you have any questions, feel free to reach us at <strong>info@getcredit.com</strong></p>
            <p>Best regards,<br>The Get Credit Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} Get Credit. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
  }
};

const sendAdminNotification = async (enquiry) => {
  if (!process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your_app_password_here') {
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const isCallbackRequest = enquiry.loanType === 'Callback Request';

  try {
    const admin = await Admin.findOne();
    if (admin) {
      if (isCallbackRequest && !admin.notifications?.emailOnCallbackRequest) {
        return;
      }
    }
  } catch (err) {
  }

  let subject, html;

  if (isCallbackRequest) {
    // Simpler email for callback requests
    subject = '🔔 New Callback Request - Get Credit';
    html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #C9952A; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .contact-info { font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🔔 Callback Request</h1>
            <p>Get Credit Admin</p>
          </div>
          <div class="content">
            <h2>New Callback Request Received</h2>
            <div class="info-box">
              <p><strong>Name:</strong> ${enquiry.fullName}</p>
              <p class="contact-info"><strong>📞 Phone:</strong> ${enquiry.phone}</p>
              <p><strong>📧 Email:</strong> ${enquiry.email}</p>
              <p><strong>🏠 City:</strong> ${enquiry.city || 'N/A'}</p>
              <p><strong>📅 Requested:</strong> ${new Date(enquiry.createdAt).toLocaleString()}</p>
            </div>
            ${enquiry.message ? `<p><strong>Message:</strong> ${enquiry.message}</p>` : ''}
            <p style="color: #C9952A; font-weight: bold;">⚡ Action Required: Call the customer immediately!</p>
          </div>
        </div>
      </body>
      </html>
    `;
  } else {
    // Detailed email for regular enquiries
    subject = 'New Loan Enquiry Received - Get Credit';
    html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1a1a2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #C9952A; color: white; }
          .urgent { background: #ffcccc; padding: 10px; border-radius: 5px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Get Credit Admin</h1>
            <p>New Enquiry Alert</p>
          </div>
          <div class="content">
            <h2>New Loan Enquiry Received</h2>
            <table>
              <tr><th>Field</th><th>Details</th></tr>
              <tr><td><strong>Name</strong></td><td>${enquiry.fullName}</td></tr>
              <tr><td><strong>Phone</strong></td><td>${enquiry.phone}</td></tr>
              <tr><td><strong>Email</strong></td><td>${enquiry.email}</td></tr>
              <tr><td><strong>City</strong></td><td>${enquiry.city || 'N/A'}</td></tr>
              <tr><td><strong>Loan Type</strong></td><td>${enquiry.loanType}</td></tr>
              <tr><td><strong>Loan Amount</strong></td><td>₹${enquiry.loanAmount.toLocaleString()}</td></tr>
              <tr><td><strong>Interest Rate</strong></td><td>${enquiry.interestRate}%</td></tr>
              <tr><td><strong>Tenure</strong></td><td>${enquiry.tenure} Years</td></tr>
              <tr><td><strong>Monthly EMI</strong></td><td><strong style="color: #C9952A;">₹${enquiry.emi.toLocaleString()}</strong></td></tr>
            </table>
            <div class="urgent"><strong>Action Required:</strong> Contact the customer within 24 hours.</div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: adminEmail,
    subject,
    html
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Admin notification sent to ${adminEmail}`);
  } catch (error) {
    console.log('Admin notification not sent (server may not be configured)');
  }
};

module.exports = { sendCustomerEmail, sendAdminNotification };