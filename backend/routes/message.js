const router  = require('express').Router();
const {protect}    = require('../middleware/auth');
const Message = require('../models/Message');
const { getRoomId } = require('../helpers/room');


// GET /api/messages/:userId — Historique d'une conversation
router.get('/:userId', protect, async (req, res) => {
  try {
    const roomId = getRoomId(req.user._id, req.params.userId);

    const messages = await Message.find({ room: roomId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 })   // Chronologique (ancien en premier)
      .limit(50);               // 50 derniers messages

    // Marquer les messages non lus comme lus
    await Message.updateMany(
      { room: roomId, recipient: req.user._id, read: false },
      { read: true }
    );

    res.json(messages);
  } catch (err) { res.status(500).json({ message: err.message }); }
});


// GET /api/messages — Liste des conversations récentes
router.get('/', protect, async (req, res) => {
  try {
    // Trouver tous les messages où je suis impliqué
    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { recipient: req.user._id }]
    })
    .populate('sender', 'name avatar')
    .populate('recipient', 'name avatar')
    .sort({ createdAt: -1 });

    // Grouper par room et garder le dernier message de chaque
    const conversations = {};
    messages.forEach(msg => {
      if (!conversations[msg.room]) conversations[msg.room] = msg;
    });

    res.json(Object.values(conversations));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
