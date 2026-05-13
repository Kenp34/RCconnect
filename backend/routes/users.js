const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const { protect } = require('../middleware/auth');
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