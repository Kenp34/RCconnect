const router = require('express').Router();
const {protect} = require('../middleware/auth');
const upload = require('../middleware/upload');
const Group = require('../models/Group');
const Post = require('../models/Post');

// Créer un groupe
router.post('/', protect, upload.single('avatar'), async (req, res) => {
  try {
    const { name, description, isPrivate } = req.body;
    const existing = await Group.findOne({ name });
    if (existing) return res.status(400).json({ message: 'Nom déjà pris' });
    
    const group = await Group.create({
      name, description: description || '', isPrivate: isPrivate === 'true',
      createdBy: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
      avatar: req.file ? `/uploads/${req.file.filename}` : null
    });
    await group.populate('createdBy', 'name avatar');
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Lister les groupes
router.get('/', protect, async (req, res) => {
  try {
    const { type, search } = req.query;
    let query = type === 'my' ? { 'members.user': req.user._id } : { isPrivate: false };
    if (search) query.name = { $regex: search, $options: 'i' };
    
    const groups = await Group.find(query).populate('createdBy', 'name avatar');
    const result = groups.map(g => ({
      ...g.toObject(),
      isMember: g.isMember(req.user._id),
      memberCount: g.members.length
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Détail d'un groupe
router.get('/:id', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('createdBy', 'name avatar')
      .populate('members.user', 'name avatar');
    if (!group) return res.status(404).json({ message: 'Groupe non trouvé' });
    if (group.isPrivate && !group.isMember(req.user._id)) return res.status(403).json({ message: 'Groupe privé' });
    
    res.json({
      ...group.toObject(),
      isMember: group.isMember(req.user._id),
      isAdmin: group.isAdmin(req.user._id),
      memberCount: group.members.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Rejoindre
router.post('/:id/join', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Groupe non trouvé' });
    if (group.isMember(req.user._id)) return res.status(400).json({ message: 'Déjà membre' });
    if (group.isPrivate) return res.status(403).json({ message: 'Groupe privé' });
    
    group.members.push({ user: req.user._id, role: 'member' });
    await group.save();
    res.json({ message: 'Rejoint !' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Quitter
router.post('/:id/leave', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Groupe non trouvé' });
    if (!group.isMember(req.user._id)) return res.status(400).json({ message: 'Pas membre' });
    
    group.members = group.members.filter(m => m.user.toString() !== req.user._id.toString());
    await group.save();
    res.json({ message: 'Quitté !' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Ajouter à la fin du fichier routes/groups.js

// GET /api/groups/:id/messages - Récupérer les messages du groupe
router.get('/:id/messages', protect, async (req, res) => {
  try {
    const GroupMessage = require('../models/GroupMessage');
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ message: 'Groupe non trouvé' });
    }
    
    if (!group.isMember(req.user._id)) {
      return res.status(403).json({ message: 'Accès réservé aux membres' });
    }
    
    const messages = await GroupMessage.find({ group: req.params.id })
      .populate('sender', 'name avatar department')
      .sort({ createdAt: 1 })
      .limit(100);
    
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/groups/:id/messages - Envoyer un message dans le groupe
router.post('/:id/messages', protect, async (req, res) => {
  try {
    const GroupMessage = require('../models/GroupMessage');
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ message: 'Groupe non trouvé' });
    }
    
    if (!group.isMember(req.user._id)) {
      return res.status(403).json({ message: 'Seuls les membres peuvent envoyer des messages' });
    }
    
    const { content } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Message vide' });
    }
    
    const message = await GroupMessage.create({
      sender: req.user._id,
      group: req.params.id,
      content: content.trim()
    });
    
    await message.populate('sender', 'name avatar department');
    
    // Émettre via Socket.io
    const io = req.app.get('io');
    io.to(`group_${req.params.id}`).emit('newGroupMessage', message);
    
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;