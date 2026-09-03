const router = require('express').Router();
const mongoose = require('mongoose');
const { protect } = require('../middleware/auth');
const Group = require('../models/Group');
const GroupMessage = require('../models/GroupMessage');
const PERMISSIONS = require('../config/permissions');

// ── GET / — Liste groupes ──────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    let query = {};

    if (req.query.type === 'my') {
      query = { 'members.user': req.user._id };
    } else {
      query = { isPrivate: false };
    }

    const groups = await Group.find(query)
      .populate('createdBy', 'name')
      .populate('members.user', 'name avatar department')
      .sort({ createdAt: -1 });

    const enriched = groups.map(g => {
      const me = g.members.find(
        m => m.user?._id?.toString() === req.user._id.toString()
      );
      const isSystemAdmin = !!PERMISSIONS[req.user.role]?.groups.deleteGroup;
      return {
        ...g.toObject(),
        isMember: !!me,
        isAdmin: me?.role === 'admin' || isSystemAdmin,
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /:id — Détail groupe ───────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: 'ID invalide' });

    const group = await Group.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('members.user', 'name avatar department');

    if (!group)
      return res.status(404).json({ message: 'Groupe introuvable' });

    const me = group.members.find(
      m => m.user?._id?.toString() === req.user._id.toString()
    );
    const isSystemAdmin = !!PERMISSIONS[req.user.role]?.groups.deleteGroup;

    res.json({
      ...group.toObject(),
      isMember: !!me,
      isAdmin: me?.role === 'admin' || isSystemAdmin,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST / — Créer groupe ──────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, isPrivate } = req.body;

    if (!name?.trim())
      return res.status(400).json({ message: 'Le nom est obligatoire' });

    const exists = await Group.findOne({ name: name.trim() });
    if (exists)
      return res.status(400).json({ message: 'Ce nom existe déjà' });

    const group = await Group.create({
      name: name.trim(),
      description: description?.trim() || '',
      isPrivate: isPrivate || false,
      createdBy: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
    });

    await group.populate('members.user', 'name avatar department');
    await group.populate('createdBy', 'name');

    res.status(201).json({
      ...group.toObject(),
      isMember: true,
      isAdmin: true,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /:id — Modifier groupe ─────────────────────────────
router.put('/:id', protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: 'ID invalide' });

    const group = await Group.findById(req.params.id);
    if (!group)
      return res.status(404).json({ message: 'Groupe introuvable' });

    if (!group.isAdmin(req.user._id))
      return res.status(403).json({ message: 'Réservé aux admins' });

    const { name, description, isPrivate } = req.body;

    if (name && name.trim() !== group.name) {
      const exists = await Group.findOne({ name: name.trim() });
      if (exists)
        return res.status(400).json({ message: 'Ce nom existe déjà' });
      group.name = name.trim();
    }

    if (description !== undefined) group.description = description.trim();
    if (isPrivate !== undefined) group.isPrivate = isPrivate;

    await group.save();
    await group.populate('members.user', 'name avatar department');
    await group.populate('createdBy', 'name');

    res.json({
      ...group.toObject(),
      isMember: true,
      isAdmin: true,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /:id/join — Rejoindre / Quitter (toggle) ──────────
router.post('/:id/join', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Groupe introuvable' });

    const isMember = group.members.some(
      m => m.user.toString() === req.user._id.toString()
    );

    if (isMember) {
      const me = group.members.find(
        m => m.user.toString() === req.user._id.toString()
      );
      const adminCount = group.members.filter(m => m.role === 'admin').length;

      if (me.role === 'admin' && adminCount === 1) {
        return res.status(400).json({
          message: 'Vous êtes le dernier admin. Promouvez un autre membre avant de quitter.'
        });
      }

      group.members = group.members.filter(
        m => m.user.toString() !== req.user._id.toString()
      );
      await group.save();
      return res.json({ joined: false, message: 'Vous avez quitté le groupe' });
    } else {
      group.members.push({ user: req.user._id, role: 'member' });
      await group.save();
      return res.json({ joined: true, message: 'Vous avez rejoint le groupe' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /:id/leave — Quitter ──────────────────────────────
router.post('/:id/leave', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group)
      return res.status(404).json({ message: 'Groupe introuvable' });

    if (!group.isMember(req.user._id))
      return res.status(400).json({ message: 'Vous n\'êtes pas membre' });

    const isAdmin = group.isAdmin(req.user._id);
    const otherAdmins = group.members.filter(
      m => m.role === 'admin' &&
        m.user?.toString() !== req.user._id.toString()
    );

    if (isAdmin && otherAdmins.length === 0 && group.members.length > 1)
      return res.status(400).json({
        message: 'Transférez l\'admin avant de quitter'
      });

    group.members = group.members.filter(
      m => m.user?.toString() !== req.user._id.toString()
    );
    await group.save();

    res.json({ joined: false, message: 'Vous avez quitté le groupe' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ── DELETE /:id/members/:userId — Exclure membre ──────────
router.delete('/:id/members/:userId', protect, async (req, res) => {
  try {
    // Vérifier que l'ID du groupe est valide    
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: 'ID de groupe invalide' });
    // Vérifier que l'ID du membre est valide    
    if (!mongoose.Types.ObjectId.isValid(req.params.userId))
      return res.status(400).json({ message: 'ID de membre invalide' });

    const group = await Group.findById(req.params.id);
    if (!group)
      return res.status(404).json({ message: 'Groupe introuvable' });
    // Vérifier que l'utilisateur actuel est admin
    if (!group.isAdmin(req.user._id)) {
      return res.status(403).json({ message: 'Réservé aux admins du groupe' });
    }    // Vérifier que le membre cible existe  

    const targetMember = group.members.find(m => m.user.toString() === req.params.userId);
    if (!targetMember) {

      return res.status(404).json({ message: 'Ce membre ne fait pas partie du groupe' });
    }
    // Empêcher l'auto-exclusion (doit passer par /leave) 
    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Utilisez la fonction "Quitter le groupe" pour vous-même' });
    }

    // Empêcher l'exclusion du dernier admin  
    const adminCount = group.members.filter(m => m.role === 'admin').length;
    if (targetMember.role === 'admin' && adminCount === 1) {
      return res.status(400).json({ message: 'Impossible d\'exclure le dernier admin. Promouvez un autre membre d\'abord.' });
    }
    // Supprimer le membre  
    group.members = group.members.filter(m => m.user.toString() !== req.params.userId);
    await group.save();
    // Émettre un événement socket pour mettre à jour les clients   
    const io = req.app.get('io'); if (io) {
      io.to(`group_${req.params.id}`).emit('memberKicked', {
        groupId: req.params.id, userId: req.params.userId,
        kickedBy: req.user._id
      });
    } res.json({ success: true, message: 'Membre exclu du groupe avec succès' });
  }
  catch (err) { console.error('Erreur lors de l\'exclusion:', err); res.status(500).json({ message: err.message }); }
});


// ── DELETE /:id — Supprimer groupe ────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Groupe introuvable' });

    const isGroupAdmin = group.isAdmin(req.user._id);
    const isSystemAdmin = !!PERMISSIONS[req.user.role]?.groups.deleteGroup;

    if (!isGroupAdmin && !isSystemAdmin) {
      return res.status(403).json({ message: 'Réservé aux admins du groupe ou aux admins système' });
    }

    await group.deleteOne();
    res.json({ message: 'Groupe supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /:id/messages — Charger messages ──────────────────
router.get('/:id/messages', protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: 'ID invalide' });

    const group = await Group.findById(req.params.id);
    if (!group)
      return res.status(404).json({ message: 'Groupe introuvable' });

    if (!group.isMember(req.user._id))
      return res.status(403).json({ message: 'Membres uniquement' });

    const page = parseInt(req.query.page) || 1;
    const limit = 100;

    const messages = await GroupMessage.find({
      group: req.params.id,
    })
      .populate('sender', 'name avatar department')
      // ✅ Peupler replyTo pour les messages cités
      .populate({
        path: 'replyTo',
        select: 'content sender deleted',
        populate: { path: 'sender', select: 'name' }
      })
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // ✅ Marquer les messages comme lus
    await GroupMessage.updateMany(
      { 
        group: req.params.id, 
        readBy: { $ne: req.user._id } 
      },
      { $addToSet: { readBy: req.user._id } }
    );

    res.json(messages);
  } catch (err) {
    console.error('❌ Erreur GET messages:', err);
    res.status(500).json({ message: err.message });
  }
});

// ── POST /:id/messages — Envoyer message ──────────────────
router.post('/:id/messages', protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: 'ID invalide' });

    const group = await Group.findById(req.params.id);
    if (!group)
      return res.status(404).json({ message: 'Groupe introuvable' });

    if (!group.isMember(req.user._id))
      return res.status(403).json({ message: 'Membres uniquement' });

    if (!req.body.content?.trim())
      return res.status(400).json({ message: 'Contenu vide' });

    // ✅ CORRECTION : Utiliser req.params.id et req.body.replyTo
    const replyToId = req.body.replyTo || null;

    // ✅ Vérifier le message cité
    if (replyToId) {
      const original = await GroupMessage.findOne({ 
        _id: replyToId, 
        group: req.params.id 
      });
      if (!original) {
        return res.status(400).json({ 
          message: 'Message cité introuvable dans ce groupe' 
        });
      }
    }

    // ✅ Création du message
    const message = await GroupMessage.create({
      sender: req.user._id,
      group: req.params.id,
      content: req.body.content.trim(),
      readBy: [req.user._id],
      replyTo: replyToId  // ✅ Ajout du replyTo
    });

    // ✅ Peupler le sender
    await message.populate('sender', 'name avatar department');
    
    // ✅ Peupler le replyTo si présent
    if (message.replyTo) {
      await message.populate({
        path: 'replyTo',
        select: 'content sender deleted',
        populate: { path: 'sender', select: 'name' }
      });
    }

    // ✅ Émettre via Socket.io
    const io = req.app.get('io');
    io.to(`group_${req.params.id}`).emit('newGroupMessage', message);

    res.status(201).json(message);
  } catch (err) {
    console.error('❌ Erreur POST message:', err);
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /:id/messages/:msgId — Modifier message ───────────
router.put('/:id/messages/:msgId', protect, async (req, res) => {
  try {
    const message = await GroupMessage.findById(req.params.msgId);
    if (!message)
      return res.status(404).json({ message: 'Message introuvable' });

    if (message.sender.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Non autorisé' });

    message.oldContent = message.content;
    message.content = req.body.content.trim();
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    const io = req.app.get('io');
    io.to(`group_${req.params.id}`).emit('groupMessageEdited', {
      messageId: message._id,
      content: message.content,
      edited: true,
      editedAt: message.editedAt,
    });

    res.json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /:id/messages/:msgId — Supprimer message ───────
router.delete('/:id/messages/:msgId', protect, async (req, res) => {
  try {
    const message = await GroupMessage.findById(req.params.msgId);
    if (!message)
      return res.status(404).json({ message: 'Message introuvable' });

    const group = await Group.findById(req.params.id);
    const isOwner = message.sender.toString() === req.user._id.toString();
    const isAdmin = group?.isAdmin(req.user._id);

    if (!isOwner && !isAdmin)
      return res.status(403).json({ message: 'Non autorisé' });

    message.deleted = true;
    message.deletedAt = new Date();
    message.content = '[Message supprimé]';
    await message.save();

    const io = req.app.get('io');
    io.to(`group_${req.params.id}`).emit('groupMessageDeleted', {
      messageId: message._id,
    });

    res.json({ message: 'Message supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;






// ── DELETE /:id/members/:userId — Exclure membre ──────────
/*
router.delete('/:id/members/:userId', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Groupe introuvable' });
    if (!group.isAdmin(req.user._id)) {
      return res.status(403).json({ message: 'Réservé aux admins du groupe' });
    }
    const targetIsMember = group.members.some(m => m.user.toString() === req.params.userId);
    if (!targetIsMember) return res.status(404).json({ message: 'Ce membre ne fait pas partie du groupe' });
    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Utilisez la fonction "Quitter le groupe" pour vous-même' });
    }
    group.members = group.members.filter(m => m.user.toString() !== req.params.userId);
    await group.save();
    res.json({ message: 'Membre exclu du groupe' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
*/