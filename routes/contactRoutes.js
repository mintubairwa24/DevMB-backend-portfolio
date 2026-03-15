

const express = require('express');
const router = express.Router();
const { createContact, getAllContacts, getContact } = require('../controllers/contactController');
const validateContact = require('../middleware/validation');
 
// POST /api/contact - Create new contact
router.post('/', validateContact, createContact);
 
// GET /api/contact - Get all contacts
router.get('/', getAllContacts);
 
// GET /api/contact/:id - Get single contact
router.get('/:id', getContact);
 
module.exports = router;