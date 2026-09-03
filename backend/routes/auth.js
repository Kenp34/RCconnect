const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Générer JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @route   POST /api/auth/register
// @desc    Inscription utilisateur
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // Vérifier si l'utilisateur existe déjà
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'admin' : 'employe';
    const user = await User.create({ ...req.body, role });
    /*
            // Créer l'utilisateur
            const user = await User.create({
                name,
                email,
                password,
                role
            });*/
    // Générer le token
    const token = generateToken(user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      token
    });
  } catch (error) {
    console.error(error);
    //res.status(500).json({ message: 'Erreur serveur', error: error.message });
    if(error.name === 'ValidationError'){
      const messages= Object.values(error.errors).map(e=>e.message);
      return res.status(400).json({message: messages.join(', ')});

    }
    res.status(500).json({ error: error.message });
  }
});



// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'Ce compte a été désactivé, contactez un administrateur' });
    }
    res.json({ token: generateToken(user._id), user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;