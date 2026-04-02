const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const auth = require('../middleware/auth');

// POST /api/bookings — create a new table booking
router.post('/', async (req, res) => {
  try {
    const booking = new Booking(req.body);
    await booking.save();
    res.status(201).json({ message: 'Booking confirmed', booking });
  } catch (err) {
    res.status(400).json({ message: 'Error creating booking', error: err.message });
  }
});

// GET /api/bookings — get all bookings (admin only)
router.get('/', auth, async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ date: 1, time: 1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching bookings', error: err.message });
  }
});

// GET /api/bookings/:id — get a single booking (admin only)
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching booking', error: err.message });
  }
});

// PUT /api/bookings/:id — update booking status (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    res.status(400).json({ message: 'Error updating booking', error: err.message });
  }
});

// DELETE /api/bookings/:id — delete a booking (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json({ message: 'Booking deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting booking', error: err.message });
  }
});

module.exports = router;
