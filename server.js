const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env')
});

const app = express();

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));
app.use(express.json());

// ============================================
// SIMPLE IN-MEMORY DATABASE (No MongoDB needed)
// ============================================
let contacts = [];

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is running'
  });
});

// Get all contacts
app.get('/api/contact', (req, res) => {
  res.json({
    success: true,
    count: contacts.length,
    data: contacts
  });
});

// Get single contact
app.get('/api/contact/:id', (req, res) => {
  const contact = contacts.find(c => c.id === req.params.id);
  if (!contact) {
    return res.status(404).json({
      success: false,
      message: 'Contact not found'
    });
  }
  res.json({ success: true, data: contact });
});

// Create contact (MAIN ENDPOINT)
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, projectType, message, budget } = req.body;

    // STEP 1: Validate
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        errors: {
          name: !name ? 'Name required' : '',
          email: !email ? 'Email required' : '',
          message: !message ? 'Message required' : ''
        }
      });
    }

    if (message.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Message too short',
        errors: { message: 'Message must be at least 10 characters' }
      });
    }

    // STEP 2: Create contact object
    const contact = {
      id: Date.now().toString(),
      name,
      email,
      projectType: projectType || 'general',
      message,
      budget: budget || 'not specified',
      createdAt: new Date().toISOString()
    };

    // STEP 3: Save to memory (in-memory database)
    contacts.push(contact);
    console.log(`✅ Contact saved: ${contact.id}`);

    // STEP 4: Send emails (fire and forget - don't wait)
    sendEmails(contact).catch(err => {
      console.error('❌ Email failed:', err.message);
    });

    // STEP 5: Send success response immediately
    res.status(201).json({
      success: true,
      message: 'Message sent successfully! We will get back to you soon.',
      data: {
        id: contact.id,
        name: contact.name,
        email: contact.email
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ============================================
// EMAIL SYSTEM (Simple & Free)
// ============================================

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

async function sendEmails(contact) {
  try {
    // EMAIL 1: Send to YOU (owner)
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_USER,
      subject: `New Contact from ${contact.name}`,
      html: `
        <h2>New Contact Submission</h2>
        <p><strong>From:</strong> ${contact.name}</p>
        <p><strong>Email:</strong> ${contact.email}</p>
        <p><strong>Project:</strong> ${contact.projectType}</p>
        <p><strong>Budget:</strong> ${contact.budget}</p>
        <h3>Message:</h3>
        <p>${contact.message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><small>Received: ${contact.createdAt}</small></p>
      `
    });
    console.log(`✅ Owner email sent to ${process.env.EMAIL_USER}`);

    // EMAIL 2: Send confirmation to USER
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: contact.email,
      subject: 'Thank you for contacting us!',
      html: `
        <h2>Thank you, ${contact.name}!</h2>
        <p>We received your message and will get back to you as soon as possible.</p>
        <hr>
        <h3>Your Message Details:</h3>
        <p><strong>Project Type:</strong> ${contact.projectType}</p>
        <p><strong>Budget:</strong> ${contact.budget}</p>
        <p><strong>Message:</strong></p>
        <p>${contact.message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p>Best regards,<br>MB.Dev</p>
      `
    });
    console.log(`✅ Confirmation email sent to ${contact.email}`);

  } catch (error) {
    console.error('Email error:', error.message);
  }
}

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
  console.log(`🔗 Frontend: ${process.env.FRONTEND_URL}`);
  console.log(`📧 Owner email: ${process.env.EMAIL_USER}`);
});
