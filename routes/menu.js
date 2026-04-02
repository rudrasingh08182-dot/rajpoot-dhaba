const express = require('express');
const router = express.Router();
const Menu = require('../models/Menu');
const auth = require('../middleware/auth');

// GET /api/menu — get all available menu items
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { isAvailable: true };
    if (category) filter.category = category;

    const items = await Menu.find(filter).sort({ category: 1, name: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching menu', error: err.message });
  }
});

// GET /api/menu/:id — get a single menu item
router.get('/:id', async (req, res) => {
  try {
    const item = await Menu.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Menu item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching menu item', error: err.message });
  }
});

// POST /api/menu — create a menu item (admin only)
router.post('/', auth, async (req, res) => {
  try {
    const item = new Menu(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ message: 'Error creating menu item', error: err.message });
  }
});

// PUT /api/menu/:id — update a menu item (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const item = await Menu.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({ message: 'Menu item not found' });
    res.json(item);
  } catch (err) {
    res.status(400).json({ message: 'Error updating menu item', error: err.message });
  }
});

// DELETE /api/menu/:id — delete a menu item (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await Menu.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Menu item not found' });
    res.json({ message: 'Menu item deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting menu item', error: err.message });
  }
});

module.exports = router;
