import { sendAdminComposeEmail } from '../services/emailService.js';

export const sendEmail = async (req, res) => {
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

    await sendAdminComposeEmail({ to: recipients, subject, body });

    res.json({ success: true, message: `Email sent successfully to ${recipients.join(', ')}` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send email. Please try again.' });
  }
};