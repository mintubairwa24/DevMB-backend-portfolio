

const Contact = require('../models/Contact');
const sendEmail = require('../utils/emailService');
const logger = require('../utils/logger');
 
// Create new contact
exports.createContact = async (req, res, next) => {
  try {
    const { name, email, projectType, message, budget } = req.body;

    // Create new contact document
    const contact = await Contact.create({
      name,
      email,
      projectType,
      message,
      budget,
    });

    // Return success response first to avoid client timeouts
    res.status(201).json({
      success: true,
      message: 'Message sent successfully! I will get back to you soon.',
      data: {
        id: contact._id,
        name: contact.name,
        email: contact.email,
      },
    });

    logger.info(`Contact created successfully: ${contact._id}`);

    // Send emails in background so slow SMTP doesn't block the response
    setImmediate(async () => {
      // Send email notification to portfolio owner
      try {
        await sendEmail({
          to: process.env.EMAIL_USER,
          subject: `New Contact: ${name} - ${projectType}`,
          html: `
            <h2>New Contact Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Project Type:</strong> ${projectType}</p>
            <p><strong>Budget:</strong> ${budget || 'Not specified'}</p>
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
            <p><strong>Submitted at:</strong> ${new Date().toLocaleString()}</p>
          `,
        });

        logger.info(`Email notification sent for contact from ${email}`);
      } catch (emailError) {
        logger.error('Email sending failed:', emailError.message);
      }

      // Send confirmation email to user
      try {
        await sendEmail({
          to: email,
          subject: 'We Got Your Message!',
          html: `
            <h2>Thank you for taking the time to reach out! Your message just landed in our inbox, and we're excited to learn more about your project.</h2>
            <p>Hii ${name},</p>
            <p>We're currently reviewing all the details you shared and will prioritize your request. You can expect a detailed response from us within 24-48 hours.</p>
            <p><strong>Here's what we received:</strong></p>
            <p>Project Type: ${projectType}</p>
            <p>Budget Range: ${budget || 'Not specified'}</p>
            <p>In the meantime, if you have any additional questions or want to share more about your vision, feel free to reply to this email.</p>
            <p>Best regards,<br>MB.Dev</p>
            <p>Full-Stack Developer & Creative Problem Solver</p>
          `,
        });

        logger.info(`Confirmation email sent to ${email}`);
      } catch (emailError) {
        logger.error('Confirmation email failed:', emailError.message);
      }
    });
  } catch (error) {
    logger.error('Error creating contact:', error.message);
    next(error);
  }
};
 
// Get all contacts (admin only - optional)
exports.getAllContacts = async (req, res, next) => {
  try {
    const contacts = await Contact.find()
      .sort({ createdAt: -1 })
      .limit(100);
 
    res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts,
    });
  } catch (error) {
    logger.error('Error fetching contacts:', error.message);
    next(error);
  }
};
 
// Get single contact
exports.getContact = async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id);
 
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }
 
    res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    logger.error('Error fetching contact:', error.message);
    next(error);
  }
};