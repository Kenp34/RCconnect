const router       = require('express').Router();
const {protect }       = require('../middleware/auth');
const Notification = require('../models/Notification');

// GET /api/notifications — Mes notifications
router.get('/', protect, async (req, res) => {
  try {
    const notifs = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'name avatar')
      .populate('post', 'content')
      .sort({ createdAt: -1 })
      .limit(30);
    res.json(notifs);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/notifications/read — Tout marquer comme lu
router.put('/read',protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );
    res.json({ message: 'Notifications lues' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
