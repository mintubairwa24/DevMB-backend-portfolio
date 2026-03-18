const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config({
  path: path.resolve(__dirname, '../.env')
});

const app = express();
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));
app.use(express.json());

let contacts = [];

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is running'
  });
});

app.get('/api/contact', (req, res) => {
  res.json({
    success: true,
    count: contacts.length,
    data: contacts
  });
});

app.get('/api/contact/:id', (req, res) => {
  const contact = contacts.find((item) => item.id === req.params.id);

  if (!contact) {
    return res.status(404).json({
      success: false,
      message: 'Contact not found'
    });
  }

  return res.json({ success: true, data: contact });
});

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, projectType, message, budget } = req.body;

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
        errors: {
          message: 'Message must be at least 10 characters'
        }
      });
    }

    const contact = {
      id: Date.now().toString(),
      name,
      email,
      projectType: projectType || 'general',
      message,
      budget: budget || 'not specified',
      createdAt: new Date().toISOString()
    };

    contacts.push(contact);
    console.log(`Contact saved: ${contact.id}`);

    sendEmails(contact).catch((error) => {
      console.error('Email failed:', error.message);
    });

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully! We will get back to you soon.',
      data: {
        id: contact.id,
        name: contact.name,
        email: contact.email
      }
    });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function sendBrevoEmail({ to, subject, htmlContent }) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || 'MB.Dev';

  if (!apiKey || !senderEmail || !process.env.OWNER_EMAIL) {
    throw new Error('Missing Brevo configuration in environment variables');
  }

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender: {
        email: senderEmail,
        name: senderName
      },
      to,
      subject,
      htmlContent
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Brevo API error ${response.status}: ${errorText}`);
  }
}

async function sendEmails(contact) {
  const safeName = escapeHtml(contact.name);
  const safeEmail = escapeHtml(contact.email);
  const safeProjectType = escapeHtml(contact.projectType);
  const safeBudget = escapeHtml(contact.budget);
  const safeMessage = escapeHtml(contact.message).replace(/\n/g, '<br>');
  const safeCreatedAt = escapeHtml(contact.createdAt);

  try {
    await sendBrevoEmail({
      to: [
        {
          email: process.env.OWNER_EMAIL,
          name: process.env.BREVO_SENDER_NAME || 'Portfolio Owner'
        }
      ],
      subject: `New Contact from ${contact.name}`,
      htmlContent: `
        <h2>New Contact Submission</h2>
        <p><strong>From:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Project:</strong> ${safeProjectType}</p>
        <p><strong>Budget:</strong> ${safeBudget}</p>
        <h3>Message:</h3>
        <p>${safeMessage}</p>
        <hr>
        <p><small>Received: ${safeCreatedAt}</small></p>
      `
    });
    console.log(`Owner email sent to ${process.env.OWNER_EMAIL}`);

    await sendBrevoEmail({
      to: [
        {
          email: contact.email,
          name: contact.name
        }
      ],
      subject: 'Thank you for contacting us!',
      htmlContent: `
        <h2>Thank you, ${safeName}!</h2>
        <p>We received your message and will get back to you as soon as possible.</p>
        <hr>
        <h3>Your Message Details:</h3>
        <p><strong>Project Type:</strong> ${safeProjectType}</p>
        <p><strong>Budget:</strong> ${safeBudget}</p>
        <p><strong>Message:</strong></p>
        <p>${safeMessage}</p>
        <hr>
        <p>Best regards,<br>MB.Dev</p>
      `
    });
    console.log(`Confirmation email sent to ${contact.email}`);
  } catch (error) {
    console.error('Email error:', error.message);
  }
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  console.log(`Frontend: ${process.env.FRONTEND_URL}`);
  console.log(`Owner email: ${process.env.OWNER_EMAIL}`);
});
