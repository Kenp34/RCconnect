require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const email = "fredessama@gmail.com"

if (!email) {
  console.error('Usage: node scripts/createAdmin.js email@example.com');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const user = await User.findOneAndUpdate(
      { email },
      { role: 'admin' },
      { new: true }
    );
    if (!user) {
      console.error('❌ Utilisateur introuvable avec cet email');
    } else {
      console.log(`✅ ${user.name} est maintenant admin`);
    }
    process.exit(0);
  })
  .catch(err => { console.error(err); process.exit(1); });