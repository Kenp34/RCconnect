## Cas à gérer avant le code (sinon ça casse en prod)

1. **Doublons de username** — deux "Jean Dupont" → collision de slug. Géré par le suffixe numérique déjà proposé.
2. **Utilisateurs existants en base** — ils n'ont pas de `username`, donc `findOne({username})` échouera pour eux tant qu'on n'a pas migré.
3. **Anciens liens/bookmarks** avec l'`_id` brut (comme celui de ta capture) — ils doivent continuer à fonctionner, sinon 404 pour tout le monde qui a déjà partagé un lien.
4. **Nom vide ou uniquement caractères spéciaux** — `slugify('')` ou `slugify('!!!')` donne une chaîne vide → il faut un fallback.
5. **Casse** — `username` doit être insensible à la casse en recherche (déjà géré par `lowercase: true`, mais il faut aussi lowercase à la recherche).

## 1. Modèle `User.js`

```js
username: {
  type: String,
  unique: true,
  index: true,
  lowercase: true,
  trim: true,
}
```

## 2. `utils/generateUsername.js` — gérer le fallback vide

```js
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
```

## 3. `routes/auth.js` — `/register`

```js
const { generateUniqueUsername } = require('../utils/generateUsername');

router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'admin' : 'employe';
    const username = await generateUniqueUsername(name, User);

    const user = await User.create({ ...req.body, role, username });
    const token = generateToken(user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      token
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ error: error.message });
  }
});
```

## 4. `routes/users.js` — route publique compatible ID **et** username

Pour ne pas casser les anciens liens (`/profile/6a974a92...`), on accepte les deux formats :

```js
const mongoose = require('mongoose');

// GET /api/users/:identifier  (username OU _id, pour compatibilité)
router.get('/:identifier', protect, async (req, res) => {
  try {
    const { identifier } = req.params;

    const query = mongoose.isValidObjectId(identifier)
      ? { _id: identifier }
      : { username: identifier.toLowerCase() };

    const user = await User.findOne(query)
      .select('-password')
      .populate('following', 'name avatar')
      .populate('followers', 'name avatar');

    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
```

## 5. `App.jsx` — une seule route dynamique

```jsx
<Route path="/profile/:identifier" element={
  <ProtectedRoute>
    <Layout><Profile /></Layout>
  </ProtectedRoute>
} />

<Route path="/profile/me" element={
  <ProtectedRoute>
    <Layout><Profile /></Layout>
  </ProtectedRoute>
} />
```

## 6. `Profile.jsx` — nettoyage complet

```js
const { identifier } = useParams();
const { user: me, token } = useAuth();
const navigate = useNavigate();

const isMe = !identifier || identifier === 'me' || identifier === me?._id || identifier === me?.username;

useEffect(() => {
  const fetchProfileAndPosts = async () => {
    setLoading(true);
    try {
      const endpoint = isMe ? '/users/me' : `/users/${identifier}`;
      const { data: profData } = await axios.get(`${API}${endpoint}`, axiosConfig);
      setProfile(profData);

      if (!isMe && me) {
        setIsFollowing(
          profData.followers?.some(f => (f._id || f).toString() === me._id?.toString())
        );
      }

      const userId = isMe ? me?._id : profData._id; // toujours l'_id réel pour l'appel posts, jamais visible dans l'URL

      if (userId) {
        try {
          const { data: userPosts } = await axios.get(`${API}/posts/user/${userId}`, axiosConfig);
          setPosts(userPosts || []);
        } catch (postErr) {
          console.error('Erreur chargement posts:', postErr);
          setPosts([]);
        }
      }
    } catch (err) {
      console.error('Erreur profil:', err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  if (token && (me || isMe)) fetchProfileAndPosts();
}, [identifier, me?._id, isMe, token]);
```

## 7. `UserList` — ne jamais pousser l'`_id` dans l'URL

```js
onClick={() =>
  navigate(user._id === me?._id ? '/profile/me' : `/profile/${user.username}`)
}
```

## 8. Ton problème exact sur la capture

Le lien qui génère `/profile/6a974a9228c6959dc03b61a2` vient forcément d'un composant que tu n'as pas encore montré (probablement le menu déroulant "Administration - Manager" ou le clic sur ton avatar en haut à droite dans `Layout`/`Navbar`). Cherche dedans une occurrence de `me._id` ou `user._id` passée à `navigate`/`Link to=` et remplace-la par `/profile/me`.

```bash
grep -rn "profile/\${.*_id\|profile/\" + .*_id" src/
```

## 9. Migration des comptes déjà en base

Script à exécuter une fois :

```js
const mongoose = require('mongoose');
const User = require('../models/User');
const { generateUniqueUsername } = require('../utils/generateUsername');

async function migrate() {
  const users = await User.find({ username: { $exists: false } });
  for (const user of users) {
    user.username = await generateUniqueUsername(user.name, User);
    await user.save();
  }
  console.log(`${users.length} utilisateurs migrés`);
  mongoose.disconnect();
}
migrate();
```

Veux-tu que je te montre aussi le composant `Layout`/`Navbar` pour repérer précisément où est généré ce lien vers `_id`, si tu me le colles ?


Ce script sert à corriger les comptes créés **avant** que tu ajoutes le champ `username` au modèle.

## Le problème qu'il résout

Tu as déjà des utilisateurs en base (créés avec l'ancien code, sans `username`). Une fois que tu ajoutes la route `/users/:identifier` qui cherche par `username`, ces anciens comptes seront introuvables via leur URL de profil — ils n'ont tout simplement pas cette donnée.

La génération automatique du `username` ne se déclenche que dans `/register`, donc elle ne s'applique qu'aux **nouveaux** inscrits. Les anciens restent orphelins de ce champ.

## Ce que fait le script, étape par étape

```js
const users = await User.find({ username: { $exists: false } });
```
Récupère tous les utilisateurs qui n'ont **pas encore** de champ `username`.

```js
for (const user of users) {
  user.username = await generateUniqueUsername(user.name, User);
  await user.save();
}
```
Pour chacun, génère un slug unique à partir de son `name` existant (ex: "Zogo Essama" → `zogo_essama`), en vérifiant les doublons contre la base — puis sauvegarde.

## Comment l'exécuter

Une seule fois, à la racine du backend :

```bash
node scripts/migrate.js
```

(à adapter selon l'emplacement où tu le places, par exemple `scripts/migrateUsernames.js`)

## Point d'attention

Il faut le lancer **une seule fois**, après avoir déployé le nouveau modèle avec le champ `username`, et **avant** de basculer le frontend sur les nouvelles URLs `/profile/:identifier`. Sinon, entre les deux, certains profils resteront inaccessibles par username.

Veux-tu que je te montre comment vérifier après coup qu'aucun utilisateur n'a été oublié (script de contrôle) ?