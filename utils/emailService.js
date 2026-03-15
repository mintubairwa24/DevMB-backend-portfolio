const nodemailer = require('nodemailer');
const logger = require('./logger');
 
// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});
 
// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    logger.error('Email transporter error:', error.message);
  } else {
    logger.info('✅ Email service is ready');
  }
});
 
// Send email function
const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };
 
    await transporter.sendMail(mailOptions);
    logger.info(`📧 Email sent to ${options.to}`);
    return true;
  } catch (error) {
    logger.error('Email sending error:', error.message);
    throw error;
  }
};
 
module.exports = sendEmail;
 