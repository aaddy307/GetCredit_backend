const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendEmail = async (req, res) => {
  try {
    const { to, subject, body } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ success: false, message: 'To, subject, and body are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const recipients = Array.isArray(to) ? to : to.split(',').map(e => e.trim());
    const invalid = recipients.filter(e => !emailRegex.test(e));
    if (invalid.length) {
      return res.status(400).json({ success: false, message: `Invalid email(s): ${invalid.join(', ')}` });
    }

    const mailOptions = {
      from: `"Get Credit" <${process.env.EMAIL_USER}>`,
      to: recipients.join(', '),
      subject,
      html: `
        <!DOCTYPE html>
        <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
        <style>
          body { margin:0; padding:0; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif; background:#f4f4f6; }
          .wrapper { background:#f4f4f6; padding:30px 10px; }
          .container { max-width:600px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08); }
          .header { background:linear-gradient(135deg,#C9A84C,#E5C76B); padding:32px 24px; text-align:center; }
          .header h1 { margin:0; font-size:28px; color:#fff; }
          .header p { margin:6px 0 0; font-size:14px; color:rgba(255,255,255,0.85); }
          .body { padding:32px 28px; color:#4a4a4a; font-size:15px; line-height:1.7; }
          .footer { background:#2d2d44; padding:24px 28px; text-align:center; }
          .footer p { margin:4px 0; font-size:12px; color:rgba(255,255,255,0.6); }
          .footer a { color:#E5C76B; text-decoration:none; }
          .footer-links { margin:10px 0; font-size:12px; }
          .footer-links a { color:rgba(255,255,255,0.7); text-decoration:none; margin:0 10px; }
          .footer-links a:hover { color:#E5C76B; }
          @media only screen and (max-width:480px) { .body { padding:20px 16px; } .header { padding:24px 16px; } }
        </style></head>
        <body><div class="wrapper"><div class="container">
          <div class="header"><h1>Get Credit</h1><p>Your Trusted Loan Partner</p></div>
          <div class="body">${body}</div>
          <div class="footer">
            <div class="footer-links">
              <a href="https://get-credit.in/privacy-policy">Privacy Policy</a>
              &nbsp;|&nbsp;
              <a href="https://get-credit.in/terms">Terms &amp; Conditions</a>
            </div>
            <p>This is an automated message from Get Credit.</p>
            <p>&copy; ${new Date().getFullYear()} Get Credit. All rights reserved.</p>
          </div>
        </div></div></body></html>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: `Email sent successfully to ${recipients.join(', ')}` });
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
