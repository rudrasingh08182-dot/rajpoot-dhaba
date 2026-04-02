const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// POST /api/admin/register — register a new admin user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    const user = new User({ username, email, password, role });
    await user.save();

    res.status(201).json({ message: 'Admin user created successfully' });
  } catch (err) {
    res.status(400).json({ message: 'Error creating user', error: err.message });
  }
});

// POST /api/admin/login — authenticate and receive a JWT
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: 'Error logging in', error: err.message });
  }
});

// GET /api/admin/me — get current authenticated user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile', error: err.message });
  }
});

// GET /api/admin/dashboard — summary stats (admin only)
router.get('/dashboard', auth, async (req, res) => {
  try {
    const Order = require('../models/Order');
    const Booking = require('../models/Booking');
    const Contact = require('../models/Contact');
    const Menu = require('../models/Menu');

    const [totalOrders, totalBookings, unreadMessages, menuItems] = await Promise.all([
      Order.countDocuments(),
      Booking.countDocuments(),
      Contact.countDocuments({ isRead: false }),
      Menu.countDocuments({ isAvailable: true }),
    ]);

    res.json({ totalOrders, totalBookings, unreadMessages, menuItems });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching dashboard stats', error: err.message });
  }
});

module.exports = router;
