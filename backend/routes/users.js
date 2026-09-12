const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const PERMISSIONS = require('../config/permissions');

// Middleware générique basé sur la config
const requirePermission = (resource, action) => (req, res, next) => {
  const allowed = PERMISSIONS[req.user.role]?.[resource]?.[action];
  if (!allowed) {
    return res.status(403).json({ message: 'Permission insuffisante pour cette action' });
  }
  next();
}

// GET /api/users - Récupérer tous les utilisateurs (pour l'annuaire)
router.get('/', protect, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('-password')
      .limit(50);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/me - Voir son propre profil
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('following', 'name avatar username')
      .populate('followers', 'name avatar username');

    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
/*
// GET /api/users/:id - Voir le profil d'un utilisateur
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('following', 'name avatar')
      .populate('followers', 'name avatar');
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
*/

const mongoose = require('mongoose');

// GET /api/users/:identifier  (username OU _id, pour compatibilité)
router.get('/:identifier', protect, async (req, res) => {
  try {
    const { identifier } = req.params;
    console.log("identifier :" , identifier)
    const query = mongoose.isValidObjectId(identifier)
      ? { _id: identifier }
      : { username: identifier.toLowerCase() };

      console.log(query)
    const user = await User.findOne(query)
      .select('-password')
      .populate('following', 'name avatar username')
      .populate('followers', 'name avatar username');
//.populate('following', 'name avatar')
    //   .populate('followers', 'name avatar');
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// PUT /api/users/me - Modifier son propre profil
router.put('/me', protect, async (req, res) => {
  try {
    const { name, bio, department } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, bio, department },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/me/avatar - Upload avatar
router.put('/me/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    const avatarPath = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarPath },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// ============================================
// DÉSACTIVER / RÉACTIVER UN UTILISATEUR
// ============================================
router.put('/:id/deactivate', protect, requirePermission('users', 'deactivate'), async (req, res) => {
  const { isActive } = req.body;

  // 1. Vérifier que isActive est un booléen
  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ message: 'Le champ isActive (booléen) est requis' });
  }

  // 2. Récupérer l'utilisateur cible
  const targetUser = await User.findById(req.params.id);
  if (!targetUser) {
    return res.status(404).json({ message: 'Utilisateur introuvable' });
  }

  // 3. 🚫 EMPÊCHER UN MANAGER DE DÉSACTIVER UN ADMIN
  if (req.user.role === 'manager' && targetUser.role === 'admin') {
    return res.status(403).json({
      message: 'Un manager ne peut pas désactiver un administrateur.'
    });
  }

  // 4. 🚫 EMPÊCHER DE SE DÉSACTIVER SOI-MÊME
  if (targetUser._id.toString() === req.user._id.toString()) {
    return res.status(403).json({
      message: 'Vous ne pouvez pas désactiver votre propre compte.'
    });
  }

  // 5. ✅ Mise à jour
  targetUser.isActive = isActive;
  await targetUser.save();

  // 6. Retourner l'utilisateur sans mot de passe
  const userWithoutPassword = targetUser.toObject();
  delete userWithoutPassword.password;

  res.json(userWithoutPassword);
});

// ============================================
// CHANGER LE RÔLE
// ============================================
router.put('/:id/role', protect, requirePermission('users', 'changeRole'), async (req, res) => {
  const { role } = req.body;
  const validRoles = ['employe', 'manager', 'admin'];
   
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'Rôle invalide' });
  }

  // Récupérer l'utilisateur cible
  const targetUser = await User.findById(req.params.id);
  if (!targetUser) {
    return res.status(404).json({ message: 'Utilisateur introuvable' });
  }

  // 🚫 Empêcher de changer son propre rôle
  if (targetUser._id.toString() === req.user._id.toString()) {
    return res.status(403).json({
      message: 'Vous ne pouvez pas modifier votre propre rôle.'
    });
  }

  // 🚫 Un manager ne peut pas promouvoir en admin
  if (req.user.role === 'manager' && role === 'admin') {
    return res.status(403).json({
      message: 'Un manager ne peut pas promouvoir un utilisateur en administrateur.'
    });
  }

  // Mise à jour
  targetUser.role = role;
  await targetUser.save();

  const io =req.app.get('io');
  io.to(`user_${targetUser._id}`).emit('roleUpdated', {
    userId: targetUser._id,
    role: targetUser.role,
    updatedBy: {
      _id: req.user._id,
      name: req.user.name,
      role: req.user.role
    }
  });
  // 2. (Optionnel) Créer une notification dans la base de données
  const Notification = require('../models/Notification');
  await Notification.create({
    recipient: targetUser._id,
    sender: req.user._id,
    type: 'system',
    message: `Votre rôle a été changé en : ${role}`
  });
  // 3. (Optionnel) Émettre aussi une notification générique
  io.to(`user_${targetUser._id}`).emit('notification', {
    type: 'system',
    message: `🔑 Votre rôle a été changé en : ${role}`,
    createdAt: new Date()
  });
  const userWithoutPassword = targetUser.toObject();
  delete userWithoutPassword.password;

  res.json(userWithoutPassword);
});

// ============================================
// SUPPRIMER UN UTILISATEUR
// ============================================
router.delete('/:id', protect, requirePermission('users', 'delete'), async (req, res) => {
  const targetUser = await User.findById(req.params.id);
  if (!targetUser) {
    return res.status(404).json({ message: 'Utilisateur introuvable' });
  }

  // 🚫 Empêcher de se supprimer soi-même
  if (targetUser._id.toString() === req.user._id.toString()) {
    return res.status(403).json({
      message: 'Vous ne pouvez pas supprimer votre propre compte.'
    });
  }

  // 🚫 Un manager ne peut pas supprimer un admin
  if (req.user.role === 'manager' && targetUser.role === 'admin') {
    return res.status(403).json({
      message: 'Un manager ne peut pas supprimer un administrateur.'
    });
  }

  await targetUser.deleteOne();
  res.json({ message: 'Compte supprimé avec succès.' });
});




// Supprimer un compte (admin uniquement)


// POST /api/users/:id/follow - Follow/Unfollow
router.post('/:id/follow', protect, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "Auto-follow interdit" });
    }

    const target = await User.findById(req.params.id);
    const me = await User.findById(req.user._id);

    if (!target || !me) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    const isFollowing = me.following.includes(target._id);

    if (isFollowing) {
      me.following.pull(target._id);
      target.followers.pull(me._id);
      await me.save();
      await target.save();
      return res.json({ message: "Utilisateur désabonné", following: false });
    }

    else {
      me.following.push(target._id);
      target.followers.push(me._id);

      // Créer une notification
      const Notification = require('../models/Notification');
      const notification = await Notification.create({
        recipient: target._id,
        sender: req.user._id,
        type: 'follow',
        message: `${req.user.name} a commencé à vous suivre`
      });

      // Émettre via Socket.io
      const io = req.app.get('io');
      io.to(`user_${target._id}`).emit('notification', {
        _id: notification._id,
        type: 'follow',
        sender: { _id: req.user._id, name: req.user.name, avatar: req.user.avatar },
        message: notification.message,
        createdAt: notification.createdAt,
        read: false
      });


      await me.save();
      await target.save();
      return res.json({ message: "Utilisateur suivi", following: true });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;



























/*
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')           // Jamais le mot de passe
      .populate('following', 'name avatar')  // Infos des personnes suivies
      .populate('followers', 'name avatar')// Infos des abonnés

    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
});


router.put('/me',protect,async (req, res) => {
  try {
    const { name, bio, department } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,              // ID de l'uti]lisateur connecté
      { name, bio, department }, // Champs à mettre à jour
      { new: true }              // Retourner le document MIS A JOUR
    ).select('-password');

    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }

})


router.get('/:id', async (req, res) => {
try {
const user = await User.findById(req.params.id)
.select('-password')
.populate('followers', 'name avatar')
.populate('following', 'name avatar');
if (!user) {
return res.status(404).json({ message: 'Utilisateur non trouvé' });
}
res.json(user);
} catch (error) {
res.status(500).json({ message: error.message });
}
});

router.post('/:id/follow', protect, async (req, res) => {
  try {
    // Empêcher l'auto-follow
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        message: "Auto-follow interdit"
      });
    }
    const target = await User.findById(req.params.id);
    const me = await User.findById(req.user._id);

    // Vérifier les utilisateurs
    if (!target || !me) {
      return res.status(404).json({
        message: "Utilisateur introuvable"
      });
    }
    // Vérifier si déjà follow
    const isFollowing = me.following.includes(target._id);
    if (isFollowing) {
      // UNFOLLOW
      me.following.pull(target._id);
      target.followers.pull(me._id);

      await me.save();
      await target.save();

      return res.json({
        message: "Utilisateur désabonné"
      });

    } else {

      // FOLLOW
      me.following.push(target._id);
      target.followers.push(me._id);

      await me.save();
      await target.save();

      return res.json({
        message: "Utilisateur suivi"
      });
    }

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erreur serveur"
    });
  }
})
module.exports = router;



// GET /api/users/me — Voir son propre profil
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('following', 'name avatar department')
      .populate('followers', 'name avatar department');

    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/users/:id — Voir le profil d'un autre utilisateur
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('following', 'name avatar department')
      .populate('followers', 'name avatar department');

    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/users/me — Modifier son propre profil
router.put('/me', protect, async (req, res) => {
  try {
    const { name, bio, department } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, bio, department },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/users/me/avatar — Upload avatar
router.put('/me/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier envoyé' });

    const avatarPath = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarPath },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/users/:id/follow — Suivre / Ne plus suivre
router.post('/:id/follow', protect, async (req, res) => {
  try {
    // Empêcher l'auto-follow
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "Auto-follow interdit" });
    }

    const target = await User.findById(req.params.id);
    const me = await User.findById(req.user._id);

    if (!target || !me) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    const isFollowing = me.following.includes(target._id);

    if (isFollowing) {
      // UNFOLLOW
      me.following.pull(target._id);
      target.followers.pull(me._id);
      await me.save();
      await target.save();

      // ✅ Retourner { following: false }
      return res.json({ following: false, message: "Utilisateur désabonné" });

    } else {
      // FOLLOW
      me.following.push(target._id);
      target.followers.push(me._id);
      await me.save();
      await target.save();

      // ✅ Retourner { following: true }
      return res.json({ following: true, message: "Utilisateur suivi" });
    }

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
});


















*/