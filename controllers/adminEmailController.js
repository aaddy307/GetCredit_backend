const { sendAdminComposeEmail } = require('../services/emailService');

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

    await sendAdminComposeEmail({
      to: recipients,
      subject,
      body: body.replace(/\n/g, '<br>'),
    });

    res.json({ success: true, message: `Email sent successfully to ${recipients.join(', ')}` });
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
