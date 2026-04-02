const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const auth = require('../middleware/auth');

// POST /api/contacts — submit a contact message
router.post('/', async (req, res) => {
  try {
    const contact = new Contact(req.body);
    await contact.save();
    res.status(201).json({ message: 'Message received, we will get back to you soon!' });
  } catch (err) {
    res.status(400).json({ message: 'Error submitting message', error: err.message });
  }
});

// GET /api/contacts — get all contact messages (admin only)
router.get('/', auth, async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching messages', error: err.message });
  }
});

// GET /api/contacts/:id — get a single contact message (admin only)
router.get('/:id', auth, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ message: 'Message not found' });
    res.json(contact);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching message', error: err.message });
  }
});

// PUT /api/contacts/:id/read — mark a message as read (admin only)
router.put('/:id/read', auth, async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!contact) return res.status(404).json({ message: 'Message not found' });
    res.json(contact);
  } catch (err) {
    res.status(400).json({ message: 'Error updating message', error: err.message });
  }
});

// DELETE /api/contacts/:id — delete a contact message (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) return res.status(404).json({ message: 'Message not found' });
    res.json({ message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting message', error: err.message });
  }
});

module.exports = router;
