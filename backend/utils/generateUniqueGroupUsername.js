// backend/utils/generateUniqueGroupUsername.js
const Group = require('../models/Group'); // ✅ attention au chemin : ../models/Group
/**
* Génère un username unique à partir du nom du groupe
* Exemple : "Les Développeurs" → "les_developpeurs", "les_developpeurs_2", ...
*/
async function generateUniqueGroupUsername(name) {
  if (!name || typeof name !== 'string') {
    throw new Error('Nom de groupe invalide');
  }
  // Nettoyer le nom
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // retire les accents
    .replace(/[^a-z0-9]+/g, '_')     // tout ce qui n'est pas alphanumérique → _
    .replace(/^_+|_+$/g, '')         // retire les _ au début et à la fin
    .substring(0, 30) || 'groupe';
  let username = base;
  let counter = 1;
  // Boucle tant qu'un groupe avec ce username existe
  while (await Group.findOne({ username })) {
    username = `${base}_${counter}`;
    counter++;
  }
  return username;
}
module.exports = { generateUniqueGroupUsername };