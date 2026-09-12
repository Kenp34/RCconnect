const mongoose = require('mongoose');
require('dotenv').config()
const User = require('../models/User');
const { generateUniqueUsername } = require('../utils/generateUsername');
async function migrate() {
  try {

    
    await mongoose.connect(process.env.MONGODB_URI)
    const users = await User.find({ username: { $exists: false } });
    for (const user of users) {
      user.username = await generateUniqueUsername(user.name, User);
      await user.save();
    }
    console.log(`${users.length} utilisateurs migrés`);

  }

  catch (err) {
    console.error('Erreur migration:', err.message);

  }

  finally {
    await mongoose.disconnect();
  }
}
migrate();