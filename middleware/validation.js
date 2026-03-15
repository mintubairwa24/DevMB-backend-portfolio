

const validator = require('validator');
const logger = require('../utils/logger');

const validateContact = (req, res, next) => {
  const { name, email, projectType, message, budget } = req.body;
  const errors = {};

  // Validate name
  if (!name || !name.trim()) {
    errors.name = 'Name is required';
  } else if (name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  } else if (name.trim().length > 50) {
    errors.name = 'Name cannot exceed 50 characters';
  }

  // Validate email
  if (!email || !email.trim()) {
    errors.email = 'Email is required';
  } else if (!validator.isEmail(email)) {
    errors.email = 'Please provide a valid email';
  }

  // Validate project type
  const validProjectTypes = ['web-development', 'full-stack', 'ai-integration', 'consulting', 'other'];
  if (!projectType) {
    errors.projectType = 'Project type is required';
  } else if (!validProjectTypes.includes(projectType)) {
    errors.projectType = 'Invalid project type';
  }

  // Validate message
  if (!message || !message.trim()) {
    errors.message = 'Message is required';
  } else if (message.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters';
  } else if (message.trim().length > 2000) {
    errors.message = 'Message cannot exceed 2000 characters';
  }

  // Validate budget (optional)
  if (budget) {
    const validBudgets = ['under-5k', '5k-10k', '10k-25k', '25k+'];
    if (!validBudgets.includes(budget)) {
      errors.budget = 'Invalid budget range';
    }
  }

  // Return errors if any
  if (Object.keys(errors).length > 0) {
    logger.warn('Validation error:', errors);
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors,
    });
  }

  next();
};

module.exports = validateContact;