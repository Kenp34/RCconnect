Voici l'ensemble du code qui concerne spécifiquement les **PDF**, extrait et expliqué à travers toute la chaîne (backend → frontend), plus un ajout utile : la **prévisualisation du PDF dans le navigateur** (pas seulement le téléchargement).

## 1. Backend — Détection du type PDF

```js
// backend/helpers/document.js
const getDocumentType = (mimetype) => {
  if (!mimetype) return null;
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype === 'application/pdf') return 'pdf';   // ← c'est ici que le PDF est reconnu
  // ... autres types (word, excel, powerpoint...)
  return 'other';
};
```
**Explication** : chaque fichier uploadé possède un `mimetype` (envoyé par le navigateur). Pour un PDF, ce type est toujours exactement `application/pdf`. La fonction compare ce type et renvoie la chaîne `'pdf'`, stockée ensuite dans le champ `documentType` du modèle (`Post`, `Message` ou `GroupMessage`).

## 2. Backend — Autorisation du PDF à l'upload

```js
// backend/middleware/upload.js
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', // ← le PDF est explicitement autorisé ici
    'application/msword',
    // ... autres formats
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);   // fichier accepté
  } else {
    cb(new Error(`Format non supporté : ${file.mimetype}`));
  }
};
```
**Explication** : sans cette ligne `'application/pdf'` dans la liste, Multer rejetterait tout PDF envoyé, même si le reste du code le gère correctement plus loin. C'est le premier verrou de sécurité/format.

## 3. Backend — Stockage physique du PDF

```js
// backend/middleware/upload.js
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = './uploads/documents'; // ← un PDF atterrit ici par défaut
    if (file.mimetype.startsWith('image/')) dest = './uploads/images';
    if (req.baseUrl?.includes('messages')) dest = './uploads/messages';
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname); // conserve l'extension .pdf
    cb(null, unique + ext);
  }
});
```
**Explication** : un PDF n'est pas une image, donc il tombe dans le `else` implicite et va dans `./uploads/documents`. Le nom de fichier final ressemble à `1735689421-847293651.pdf` — un nom unique généré, pas le nom original (pour éviter les collisions et les caractères problématiques), mais l'extension `.pdf` est préservée.

## 4. Backend — Enregistrement en base lors de la création d'un post

```js
// backend/routes/posts.js
if (req.files?.document?.[0]) {
  const doc = req.files.document[0];
  postData.document = `/uploads/documents/${doc.filename}`; // ex: /uploads/documents/1735689421-847293651.pdf
  postData.documentType = getDocumentType(doc.mimetype);     // 'pdf'
  postData.documentName = doc.originalname;                  // ex: "Rapport_Q3.pdf" (nom lisible pour l'utilisateur)
  postData.documentSize = doc.size;                           // en octets
}
```
**Explication** : on stocke deux noms différents et complémentaires — `document` (chemin technique unique, utilisé pour retrouver le fichier sur le disque) et `documentName` (nom original, uniquement pour l'affichage et le téléchargement, jamais utilisé pour localiser le fichier).

## 5. Backend — Téléchargement sécurisé

```js
// backend/routes/posts.js
router.get('/:id/download', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post introuvable' });
    if (!post.document) return res.status(404).json({ message: 'Aucun document attaché' });

    const filePath = path.join(__dirname, '..', post.document);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Fichier introuvable' });
    }

    const fileName = post.documentName || path.basename(post.document);
    res.download(filePath, fileName); // renvoie le PDF avec son nom original
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
```
**Explication** : `res.download()` envoie le fichier avec un en-tête `Content-Disposition: attachment`, ce qui force le navigateur à **télécharger** le PDF plutôt que de l'afficher. C'est parfait pour "enregistrer le fichier", mais pas idéal si l'utilisateur veut juste **lire** le PDF sans le télécharger — voir le point 8 pour la prévisualisation.

## 6. Frontend — Formulaire d'upload (accepte les PDF)

```jsx
// frontend/src/components/CreatePost.jsx
<input
  ref={documentInputRef}
  type="file"
  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.zip,.rar,.7z"
  //     ^^^^ le PDF est le premier format listé
  onChange={e => setDocument(e.target.files[0])}
/>
```
**Explication** : l'attribut `accept` ne fait que **suggérer** un filtre visuel dans le sélecteur de fichier du système — ce n'est pas une sécurité (un utilisateur peut toujours choisir "Tous les fichiers"). La vraie vérification reste le `fileFilter` côté serveur (point 2).

## 7. Frontend — Affichage de la carte PDF

```jsx
// frontend/src/components/DocumentCard.jsx
import { formatFileSize, getDocumentIcon, getDocumentLabel } from '../helpers/document';

export default function DocumentCard({ document, downloadUrl }) {
  if (!document) return null;

  return (
    <div className={styles.documentCard}>
      <span className={styles.documentIcon}>
        {getDocumentIcon(document.documentType)} {/* renvoie 📄 pour 'pdf' */}
      </span>
      <div className={styles.documentInfo}>
        <span className={styles.documentName}>{document.documentName}</span>
        <span className={styles.documentMeta}>
          {getDocumentLabel(document.documentType)} · {formatFileSize(document.documentSize)}
          {/* → "PDF · 2.4 MB" */}
        </span>
      </div>
      <a href={downloadUrl} target="_blank" rel="noopener noreferrer">⬇️</a>
    </div>
  );
}
```
```js
// frontend/src/helpers/document.js
export const DOCUMENT_ICONS = { pdf: '📄', word: '📝', /* ... */ };
export const DOCUMENT_LABELS = { pdf: 'PDF', word: 'Word', /* ... */ };
```
**Explication** : quand `document.documentType === 'pdf'`, la carte affiche automatiquement l'icône 📄 et le libellé "PDF" grâce aux deux dictionnaires, sans code spécifique supplémentaire — c'est tout l'intérêt d'avoir généralisé le système par type plutôt que de coder un cas par format.

## 8. Nouveauté — Prévisualiser le PDF sans le télécharger

Actuellement, cliquer sur ⬇️ **télécharge** le PDF (à cause de `res.download`). Voici comment ajouter un bouton "Aperçu" qui **affiche** le PDF dans un nouvel onglet ou une modale, en plus du téléchargement :

**Backend — nouvelle route de visualisation (sans forcer le téléchargement)**
```js
// backend/routes/posts.js
router.get('/:id/view', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post?.document) return res.status(404).json({ message: 'Aucun document' });

    const filePath = path.join(__dirname, '..', post.document);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'Fichier introuvable' });

    // Pas de res.download() ici : on sert le fichier tel quel,
    // le navigateur décide de l'afficher car le Content-Type est application/pdf
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline'); // "inline" au lieu de "attachment"
    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
```
**Explication** : la différence tient entièrement à l'en-tête `Content-Disposition`. `attachment` (utilisé par `res.download()`) force le téléchargement ; `inline` indique au navigateur qu'il peut afficher le fichier directement s'il sait le faire — ce que tous les navigateurs modernes savent faire nativement pour un PDF.

**Frontend — bouton Aperçu dans DocumentCard**
```jsx
// frontend/src/components/DocumentCard.jsx
export default function DocumentCard({ document, downloadUrl, viewUrl }) {
  if (!document) return null;
  const isPdf = document.documentType === 'pdf';

  return (
    <div className={styles.documentCard}>
      <span className={styles.documentIcon}>{getDocumentIcon(document.documentType)}</span>
      <div className={styles.documentInfo}>
        <span className={styles.documentName}>{document.documentName}</span>
        <span className={styles.documentMeta}>
          {getDocumentLabel(document.documentType)} · {formatFileSize(document.documentSize)}
        </span>
      </div>

      {/* Bouton Aperçu, uniquement pour les PDF */}
      {isPdf && (
        <a href={viewUrl} target="_blank" rel="noopener noreferrer" title="Aperçu">
          👁️
        </a>
      )}

      <a href={downloadUrl} target="_blank" rel="noopener noreferrer" title="Télécharger">
        ⬇️
      </a>
    </div>
  );
}
```
**Explication** : `isPdf` conditionne l'affichage du bouton 👁️, car la prévisualisation native dans le navigateur ne fonctionne fiablement que pour les PDF (les fichiers Word/Excel nécessiteraient un visualiseur externe type Google Docs Viewer ou Office Online, plus complexe à mettre en place).

**Mise à jour de l'appel dans PostCard.jsx**
```jsx
// frontend/src/components/PostCard.jsx
{post.document && (
  <DocumentCard
    document={post}
    downloadUrl={`${API}/posts/${post._id}/download`}
    viewUrl={`${API}/posts/${post._id}/view`} // ← nouvelle prop
  />
)}
```

**Ce qu'il reste à dupliquer** : la même route `/view` et la même prop `viewUrl` devraient être ajoutées pour `/api/messages/:id/view` et `/api/groups/:id/messages/:msgId/download` si vous voulez la prévisualisation PDF aussi en messagerie — même logique, juste `req.params` différents.









Bonne pratique : sortez la configuration Helmet dans son propre fichier, exactement comme vous l'avez fait pour `rateLimiter.js`. Ça garde `server.js` lisible et centralise tous vos réglages de sécurité au même endroit.

## `backend/middleware/security.js` (nouveau fichier)

```js
const helmet = require('helmet');

const helmetConfig = helmet({
  // Politique de sécurité du contenu — autorise vos propres ressources
  // + les images uploadées + la connexion Socket.io
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", process.env.CLIENT_URL || "http://localhost:5173"],
      connectSrc: [
        "'self'",
        process.env.CLIENT_URL || "http://localhost:5173",
        "ws://localhost:5001", // Socket.io en développement
      ],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // souvent nécessaire pour le CSS injecté par React
    },
  },

  // Autorise le chargement d'images/documents uploadés depuis un autre domaine
  // (utile si le frontend et le backend ne sont pas sur le même domaine en prod)
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

module.exports = helmetConfig;
```

## `backend/server.js` (intégration)

```js
const express = require('express');
const cors = require('cors');
const helmetConfig = require('./middleware/security');
const { generalLimiter } = require('./middleware/rateLimiter');

const app = express();

// ✅ Sécurité — toujours en tout premier, avant tout le reste
app.use(helmetConfig);
app.use(cors());
app.use(express.json());

// ✅ Limitation de débit
app.use('/api/', generalLimiter);

// ... vos routes existantes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
// ...
```

## Pourquoi cette structure plutôt que `app.use(helmet())` inline

| Approche | Avantage |
|---|---|
| `app.use(helmet())` directement dans `server.js` | Rapide à écrire, mais `server.js` devient vite chargé si vous ajoutez d'autres options plus tard |
| Fichier `security.js` dédié | `server.js` reste un simple point d'assemblage ; toute modification de la politique de sécurité (ajouter un domaine autorisé, ajuster la CSP) se fait à un seul endroit, facile à retrouver et à documenter |

Cette organisation est cohérente avec ce que vous avez déjà : `middleware/auth.js` pour le JWT, `middleware/upload.js` pour Multer, `middleware/rateLimiter.js` pour le débit — `middleware/security.js` complète naturellement cette famille de fichiers.

**À vérifier après intégration** : ouvrez les DevTools → onglet Network → cliquez sur une requête vers votre API → onglet "Headers" → section "Response Headers". Vous devez y voir apparaître `content-security-policy`, `x-content-type-options: nosniff`, `x-frame-options: SAMEORIGIN`, etc. Si des ressources (images, Socket.io) sont bloquées, la console affichera une erreur CSP explicite indiquant quelle directive ajuster.







## Code appliqué (version consolidée)

**`backend/middleware/rateLimiter.js`** (nouveau fichier)
```js
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: 'Trop de requêtes, merci de ralentir.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, generalLimiter };
```

**`backend/server.js`** (modifications à intégrer à votre fichier existant)
```js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { generalLimiter } = require('./middleware/rateLimiter');

const app = express();

// ✅ Sécurité globale — à placer tout en haut, avant tout le reste
app.use(helmet());
app.use(cors());
app.use(express.json());

// ✅ Limite générale sur toute l'API
app.use('/api/', generalLimiter);

// ... vos routes existantes, inchangées
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/users', require('./routes/users'));
```

**`backend/routes/auth.js`** (ajout de `authLimiter` sur les deux routes concernées, reste inchangé)
```js
const express = require('express');
const router = express.Router();
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, async (req, res) => {
  // ... votre code existant, non modifié
});

router.post('/login', authLimiter, async (req, res) => {
  // ... votre code existant, non modifié
});

module.exports = router;
```

---

## Ce que Helmet règle, en détail

Helmet n'ajoute pas de logique métier — il envoie des **en-têtes HTTP** dans chaque réponse, qui indiquent au navigateur comment se comporter face à votre site. Sans ces en-têtes, le navigateur applique des comportements par défaut moins sûrs. Voici les protections principales, activées automatiquement par `helmet()` :

**1. `X-Content-Type-Options: nosniff`**
Problème réglé : sans cet en-tête, un navigateur peut essayer de "deviner" le type réel d'un fichier au lieu de faire confiance au `Content-Type` déclaré. Un attaquant qui uploaderait un fichier `.jpg` contenant en réalité du JavaScript pourrait alors le faire exécuter comme script par le navigateur dans certains contextes. Cet en-tête interdit ce "sniffing".

**2. `X-Frame-Options: SAMEORIGIN`**
Problème réglé : le **clickjacking**. Sans cette protection, un site malveillant pourrait charger votre application EnterpriseConnect dans une `<iframe>` invisible superposée à ses propres boutons, pour piéger un utilisateur connecté et lui faire cliquer sur une action (like, suppression, changement de rôle) sans qu'il s'en rende compte. Cet en-tête interdit à n'importe quel autre site d'afficher votre page dans une iframe.

**3. Suppression de `X-Powered-By: Express`**
Problème réglé : par défaut, Express annonce publiquement qu'il tourne sur Express dans chaque réponse HTTP. Un attaquant qui scanne votre site sait immédiatement quelle techno cibler et peut chercher des vulnérabilités connues spécifiques à Express/Node. Helmet retire cet en-tête pour ne pas donner cette information gratuitement.

**4. `Strict-Transport-Security` (HSTS)**
Problème réglé : force le navigateur à toujours utiliser HTTPS pour votre domaine, même si l'utilisateur tape `http://` par erreur ou clique sur un vieux lien en HTTP. Sans ça, une connexion pourrait démarrer en HTTP non chiffré le temps d'une redirection, laps de temps pendant lequel un attaquant sur le même réseau (Wi-Fi public par exemple) pourrait intercepter des données sensibles (cookies, tokens).

**5. `X-XSS-Protection`**
Problème réglé : active un filtre anti-XSS intégré dans certains navigateurs plus anciens, qui bloque le rendu de la page si un script injecté est détecté dans l'URL ou les paramètres de la requête. C'est une protection historique, complémentaire à une bonne sanitization côté code, pas un remplacement.

**6. `Content-Security-Policy` (CSP) — configuration de base**
Problème réglé : limite d'où le navigateur a le droit de charger des scripts, styles, images, etc. Cela réduit fortement l'impact d'une faille XSS : même si un attaquant réussissait à injecter du code, la CSP peut empêcher ce code de charger des ressources externes malveillantes ou d'envoyer des données volées vers un autre domaine.

**7. `Referrer-Policy`**
Problème réglé : contrôle quelles informations sont envoyées dans l'en-tête `Referer` quand un utilisateur clique sur un lien sortant depuis votre application. Sans restriction, l'URL complète de la page visitée en interne (potentiellement avec des IDs sensibles) pourrait fuiter vers un site tiers.

## Point important à connaître pour votre projet

La CSP par défaut de Helmet est **stricte** et peut bloquer des ressources légitimes si votre frontend charge des scripts externes (CDN, polices Google, etc.). Si vous constatez des ressources bloquées dans la console après activation, il faudra l'assouplir précisément plutôt que la désactiver entièrement :

```js
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "http://localhost:5001"], // autorise vos images uploadées
      connectSrc: ["'self'", "http://localhost:5001", "ws://localhost:5001"], // autorise Socket.io
    },
  },
}));
```

**À tester après mise en place** : ouvrez votre app dans le navigateur, vérifiez dans l'onglet Network que les en-têtes de réponse contiennent bien `X-Content-Type-Options`, `X-Frame-Options`, etc., et surveillez la console pour d'éventuels blocages CSP sur vos images ou votre connexion Socket.io.





## Ce que ça règle

**`express-rate-limit`** — limite le nombre de requêtes qu'une même IP peut faire sur une période donnée. Sans ça, rien n'empêche un attaquant d'envoyer des milliers de tentatives de mot de passe par minute sur `/api/auth/login` (attaque par **brute-force**) ou de créer des centaines de faux comptes en boucle sur `/api/auth/register` (spam/abus). C'est exactement la recommandation "non encore implémentée" qu'on avait identifiée dans votre documentation S5.

**`helmet`** — ne bloque rien lui-même, mais configure automatiquement une série d'en-têtes HTTP de sécurité qu'Express n'envoie pas par défaut :
- Empêche le navigateur de deviner le type MIME d'un fichier (protection contre certaines attaques XSS)
- Empêche votre site d'être affiché dans une `<iframe>` sur un autre site (protection contre le **clickjacking**)
- Cache l'en-tête `X-Powered-By: Express`, qui donne gratuitement à un attaquant l'information que vous utilisez Express (et donc les failles connues d'Express à essayer)
- Force certaines politiques de sécurité navigateur (CSP de base, HSTS, etc.)

## Installation

```bash
npm install express-rate-limit helmet
```

## 1. Helmet — à activer globalement, une seule fois

```js
// backend/server.js
const helmet = require('helmet');

const app = express();

app.use(helmet()); // ← à mettre tout en haut, avant vos routes
app.use(cors());
app.use(express.json());
// ... reste de vos middlewares et routes
```
**Explication** : `helmet()` est un middleware global qui s'applique à **toutes** les requêtes, sans configuration nécessaire pour commencer. Il doit être placé le plus tôt possible dans la chaîne de middlewares.

## 2. Rate-limit — deux limiteurs différents (login/register vs reste de l'API)

Il ne faut **pas** appliquer la même limite partout : le login mérite une limite stricte (peu de tentatives autorisées), alors que le reste de l'API (feed, messages...) a besoin d'une limite plus large pour ne pas gêner un usage normal.

```js
// backend/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

// ✅ Limiteur strict pour login/register (protection brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // fenêtre de 15 minutes
  max: 5,                    // 5 tentatives max par IP sur cette fenêtre
  message: { message: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  standardHeaders: true,     // renvoie les infos de quota dans les headers (RateLimit-*)
  legacyHeaders: false,
  skipSuccessfulRequests: true, // une connexion réussie ne compte pas dans le quota
});

// ✅ Limiteur plus permissif pour l'ensemble de l'API
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,                  // 200 requêtes par IP toutes les 15 minutes
  message: { message: 'Trop de requêtes, merci de ralentir.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, generalLimiter };
```

**Explication des options clés** :
- `windowMs` : la durée de la fenêtre de comptage (ici 15 minutes)
- `max` : le nombre de requêtes autorisées dans cette fenêtre avant blocage
- `skipSuccessfulRequests: true` sur `authLimiter` : une tentative de login qui **réussit** ne consomme pas le quota — seules les tentatives ratées (mauvais mot de passe) comptent, ce qui protège un utilisateur légitime qui se trompe une fois sans bloquer ses connexions suivantes

## 3. Application aux routes concernées

```js
// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, async (req, res) => {
  // ... code existant inchangé
});

router.post('/login', authLimiter, async (req, res) => {
  // ... code existant inchangé
});

module.exports = router;
```

```js
// backend/server.js
const { generalLimiter } = require('./middleware/rateLimiter');

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/', generalLimiter); // ← s'applique à toutes les routes /api/*
app.use('/api/auth', authRoutes);  // authLimiter prend le dessus sur ces deux routes précises
app.use('/api/posts', postRoutes);
app.use('/api/messages', messageRoutes);
// ...
```

**Explication de l'ordre** : `generalLimiter` s'applique à tout `/api/`, puis `authLimiter` s'ajoute spécifiquement sur `/register` et `/login` — les deux limiteurs comptent **indépendamment**, donc une IP qui rate son login 5 fois se fait bloquer par `authLimiter` sans que ça affecte son quota `generalLimiter` sur les autres routes.

## Comportement concret après mise en place

```json
// Réponse après la 6e tentative de login échouée en moins de 15 minutes
HTTP/1.1 429 Too Many Requests
{
  "message": "Trop de tentatives. Réessayez dans 15 minutes."
}
```

Le code **429** (Too Many Requests) est renvoyé automatiquement par le middleware, sans que vous ayez à l'écrire vous-même dans vos routes.

**À tester avec Postman** (pour compléter votre check-list de sécurité section 31.1) : envoyer 6 requêtes `POST /api/auth/login` avec un mauvais mot de passe en moins de 15 minutes → la 6e doit renvoyer 429 plutôt que 401.