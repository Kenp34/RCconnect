const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Group = require('../models/Group');
const { generateUniqueGroupUsername } = require('../utils/generateUniqueGroupUsername');

async function migrateGroups() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const groups = await Group.find({ username: { $exists: false } });
    console.log(`${groups.length} groupe(s) à migrer`);
    for (const group of groups) {
      group.username = await generateUniqueGroupUsername(group.name);
      await group.save();
      console.log(`✅ "${group.name}" → username: ${group.username}`);
    }
    console.log(`🎉 ${groups.length} groupe(s) migré(s)`);
  } catch (err) {
    console.error('Erreur:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}
migrateGroups();