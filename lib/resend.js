const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = 'Get Credit <support@get-credit.in>';

module.exports = { resend, FROM_ADDRESS };
