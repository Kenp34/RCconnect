function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

async function generateUniqueUsername(name, User) {
  let base = slugify(name);
  if (!base) base = 'user'; // cas nom vide/caractères spéciaux uniquement

  let username = base;
  let count = 1;

  while (await User.findOne({ username })) {
    username = `${base}_${count}`;
    count++;
  }
  return username;
}

module.exports = { slugify, generateUniqueUsername };