


const mongoose = require('mongoose');
const validator = require('validator');
 
const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    projectType: {
      type: String,
      required: [true, 'Project type is required'],
      enum: {
        values: ['web-development', 'full-stack', 'ai-integration', 'consulting', 'other'],
        message: 'Please select a valid project type',
      },
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      minlength: [10, 'Message must be at least 10 characters'],
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    budget: {
      type: String,
      enum: {
        values: ['under-5k', '5k-10k', '10k-25k', '25k+'],
        message: 'Please select a valid budget range',
      },
      default: null,
    },
    status: {
      type: String,
      enum: ['new', 'read', 'replied'],
      default: 'new',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);
 
// Index for faster queries
contactSchema.index({ email: 1 });
contactSchema.index({ createdAt: -1 });
contactSchema.index({ status: 1 });
 
module.exports = mongoose.model('Contact', contactSchema);
 