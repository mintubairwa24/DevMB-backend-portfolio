const logger = require('./logger');

const RESEND_API_URL = 'https://api.resend.com/emails';

if (!process.env.RESEND_API_KEY) {
  logger.warn('Resend API key is not configured. Email sending is disabled.');
} else {
  logger.info('Email service is configured with Resend');
}

const sendEmail = async (options) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('Missing RESEND_API_KEY');
    }

    if (!process.env.EMAIL_FROM) {
      throw new Error('Missing EMAIL_FROM');
    }

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || data?.error || 'Unknown Resend error');
    }

    logger.info(
      `Email sent to ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`
    );
    return true;
  } catch (error) {
    logger.error('Email sending error:', error.message);
    throw error;
  }
};

module.exports = sendEmail;
