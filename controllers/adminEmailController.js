const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = 'Get Credit <support@get-credit.in>';

const baseStyles = `
  body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f0f0f5; -webkit-font-smoothing: antialiased; }
  .wrapper { background: #f0f0f5; padding: 40px 16px; }
  .container { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 40px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #C9A84C 0%, #E5C76B 100%); padding: 36px 32px 32px; text-align: center; position: relative; }
  .header::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 20% 80%, rgba(255,255,255,0.15) 0%, transparent 50%); }
  .header-logo { width: 52px; height: 52px; background: rgba(255,255,255,0.2); border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px; }
  .header-logo span { font-size: 24px; font-weight: 800; color: #fff; letter-spacing: -1px; }
  .header h1 { position: relative; margin: 0; font-size: 26px; color: #fff; letter-spacing: -0.5px; font-weight: 700; }
  .header p { position: relative; margin: 4px 0 0; font-size: 14px; color: rgba(255,255,255,0.85); }
  .body { padding: 36px 32px; color: #4a4a4a; font-size: 15px; line-height: 1.7; }
  .footer { background: #1e1e32; padding: 28px 32px; text-align: center; }
  .footer-links { margin: 0 0 12px; font-size: 13px; }
  .footer-links a { color: rgba(255,255,255,0.6); text-decoration: none; margin: 0 12px; }
  .footer-links a:hover { color: #E5C76B; }
  .footer p { margin: 3px 0; font-size: 12px; color: rgba(255,255,255,0.4); line-height: 1.6; }
  @media only screen and (max-width: 480px) { .wrapper { padding: 20px 8px; } .body { padding: 24px 20px; } .header { padding: 28px 20px 24px; } }
`;

function footerHTML(body) {
  const year = new Date().getFullYear();
  return `
    <div class="footer">
      <div class="footer-links">
        <a href="https://get-credit.in/privacy-policy">Privacy Policy</a>
        <a href="https://get-credit.in/terms">Terms &amp; Conditions</a>
      </div>
      <p>${body}</p>
      <p>&copy; ${year} Get Credit. All rights reserved.</p>
    </div>`;
}

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

    const html = `
      <!DOCTYPE html>
      <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <style>${baseStyles}</style></head>
      <body><div class="wrapper"><div class="container">
        <div class="header">
          <div class="header-logo"><span>GC</span></div>
          <h1>Get Credit</h1>
          <p>Your Trusted Loan Partner</p>
        </div>
        <div class="body">${body}</div>
        ${footerHTML('This is an automated message from Get Credit.')}
      </div></div></body></html>`;

    await resend.emails.send({
      from: FROM_ADDRESS,
      to: recipients,
      subject,
      html,
    });

    res.json({ success: true, message: `Email sent successfully to ${recipients.join(', ')}` });
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
