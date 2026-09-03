Excellente question ! L'envoi de documents dans un réseau social d'entreprise est une fonctionnalité essentielle. Actuellement, votre application ne gère que les **images** (via Multer). Je vais vous montrer comment étendre cela pour supporter **tous les types de documents** (PDF, Word, Excel, PowerPoint, etc.).

---

## Solution complète pour l'envoi de documents

### 1. Backend - Configuration Multer pour les documents

**📄 backend/middleware/upload.js (modifié)**

```javascript
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ✅ Créer les dossiers s'ils n'existent pas
const uploadsDir = './uploads';
const documentsDir = './uploads/documents';
const imagesDir = './uploads/images';

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(documentsDir)) fs.mkdirSync(documentsDir);
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir);

// ✅ Configuration du stockage
const storage = multer.diskStorage({
  // Dossier de destination selon le type de fichier
  destination: (req, file, cb) => {
    const isImage = file.mimetype.startsWith('image/');
    const dest = isImage ? './uploads/images' : './uploads/documents';
    cb(null, dest);
  },
  // Nom du fichier : timestamp + nombre aléatoire + extension originale
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});

// ✅ Filtre pour accepter images ET documents
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    // Images
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    // Documents
    'application/pdf',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-powerpoint', // .ppt
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'text/plain', // .txt
    'application/rtf', // .rtf
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Format non supporté : ${file.mimetype}`));
  }
};

// ✅ Configuration Multer avec limites
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 Mo max (contre 5 Mo pour les images)
  },
  fileFilter,
});

// ✅ Export des middlewares spécialisés
module.exports = {
  upload,
  // Pour les images (posts, avatars) - 5 Mo max
  uploadImage: multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Seules les images sont autorisées'));
      }
    }
  }),
  // Pour les documents - 10 Mo max
  uploadDocument: multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter,
  }),
};
```

### 2. Backend - Modèle Post avec champ document

**📄 backend/models/Post.js (modifié)**

```javascript
const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  // ✅ Image (pour les photos)
  image: {
    type: String,
    default: null
  },
  // ✅ Document (pour les fichiers PDF, Word, etc.)
  document: {
    type: String,
    default: null
  },
  // ✅ Type de document pour l'affichage
  documentType: {
    type: String,
    enum: [null, 'pdf', 'word', 'excel', 'powerpoint', 'text', 'zip', 'other'],
    default: null
  },
  documentName: {
    type: String,
    default: null
  },
  documentSize: {
    type: Number,
    default: null
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: {
      type: String,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  pinned: {
    type: Boolean,
    default: false
  },
  isAnnouncement: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Post', PostSchema);
```

### 3. Backend - Route pour créer un post avec document

**📄 backend/routes/posts.js (modifié)**

```javascript
const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload'); // ✅ Import du nouvel upload
const Post = require('../models/Post');
const { processMentions, emitMentionNotifications } = require('../helpers/mentions');

// ✅ Fonction pour détecter le type de document
const getDocumentType = (mimetype) => {
  if (!mimetype) return null;
  
  if (mimetype === 'application/pdf') return 'pdf';
  if (mimetype === 'application/msword' || 
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'word';
  if (mimetype === 'application/vnd.ms-excel' || 
      mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return 'excel';
  if (mimetype === 'application/vnd.ms-powerpoint' || 
      mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return 'powerpoint';
  if (mimetype === 'text/plain' || mimetype === 'application/rtf') return 'text';
  if (mimetype === 'application/zip' || 
      mimetype === 'application/x-rar-compressed' || 
      mimetype === 'application/x-7z-compressed') return 'zip';
  return 'other';
};

// ✅ Fonction pour formater la taille du fichier
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// ✅ POST /api/posts - Créer un post (avec image OU document)
router.post('/', protect, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'document', maxCount: 1 }
]), async (req, res) => {
  try {
    const postData = {
      author: req.user._id,
      content: req.body.content,
    };

    // ✅ Gestion de l'image
    if (req.files && req.files.image && req.files.image[0]) {
      postData.image = `/uploads/images/${req.files.image[0].filename}`;
    }

    // ✅ Gestion du document
    if (req.files && req.files.document && req.files.document[0]) {
      const doc = req.files.document[0];
      postData.document = `/uploads/documents/${doc.filename}`;
      postData.documentType = getDocumentType(doc.mimetype);
      postData.documentName = doc.originalname;
      postData.documentSize = doc.size;
    }

    const post = await Post.create(postData);
    await post.populate('author', 'name avatar department role');

    // ✅ Traiter les mentions
    const mentions = await processMentions(
      req.body.content,
      req.user._id,
      post._id,
      'post'
    );

    if (mentions.length > 0) {
      const io = req.app.get('io');
      emitMentionNotifications(io, mentions);
    }

    res.status(201).json(post);

  } catch (err) {
    console.error('Erreur création post:', err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ POST /api/posts/announcement - Créer une annonce (avec document)
router.post('/announcement', protect, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'document', maxCount: 1 }
]), async (req, res) => {
  try {
    const allowedRoles = ['manager', 'admin'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Seuls les managers et administrateurs peuvent publier des annonces'
      });
    }

    const { content, expiresAt } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Le contenu est requis' });
    }

    const postData = {
      author: req.user._id,
      content: content.trim(),
      isAnnouncement: true,
      expiresAt: expiresAt || null,
    };

    // ✅ Gestion de l'image
    if (req.files && req.files.image && req.files.image[0]) {
      postData.image = `/uploads/images/${req.files.image[0].filename}`;
    }

    // ✅ Gestion du document
    if (req.files && req.files.document && req.files.document[0]) {
      const doc = req.files.document[0];
      postData.document = `/uploads/documents/${doc.filename}`;
      postData.documentType = getDocumentType(doc.mimetype);
      postData.documentName = doc.originalname;
      postData.documentSize = doc.size;
    }

    const post = await Post.create(postData);
    await post.populate('author', 'name avatar department role');

    // ✅ Notifier tous les utilisateurs
    const User = require('../models/User');
    const Notification = require('../models/Notification');
    const users = await User.find({ _id: { $ne: req.user._id } });

    const notifications = users.map(user => ({
      recipient: user._id,
      sender: req.user._id,
      type: 'announcement',
      post: post._id,
      message: `📢 Nouvelle annonce officielle de ${req.user.name}`
    }));

    await Notification.insertMany(notifications);

    const io = req.app.get('io');
    io.emit('newAnnouncement', {
      post,
      notification: `📢 Nouvelle annonce de ${req.user.name}`
    });

    res.status(201).json(post);

  } catch (err) {
    console.error('Erreur création annonce:', err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ GET /api/posts/:id/download - Télécharger un document
router.get('/:id/download', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post introuvable' });
    }

    if (!post.document) {
      return res.status(404).json({ message: 'Aucun document attaché' });
    }

    // ✅ Vérifier que l'utilisateur a accès au document
    // (pour les groupes, vérifier l'appartenance)
    const filePath = path.join(__dirname, '..', post.document);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Fichier introuvable' });
    }

    // ✅ Définir le nom du fichier pour le téléchargement
    const fileName = post.documentName || path.basename(post.document);
    res.download(filePath, fileName);

  } catch (err) {
    console.error('Erreur téléchargement:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
```

### 4. Frontend - CreatePost avec upload de document

**📄 frontend/src/components/CreatePost.jsx**

```jsx
import { useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import styles from './Css/CreatePost.module.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function CreatePost({ onCreated }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [document, setDocument] = useState(null); // ✅ Nouvel état pour le document
  const [loading, setLoading] = useState(false);
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [expiresIn, setExpiresIn] = useState('7');
  
  const imageInputRef = useRef(null);
  const documentInputRef = useRef(null);

  // ✅ Vérifier si l'utilisateur peut publier des annonces
  const canAnnounce = user?.role === 'manager' || user?.role === 'admin';

  // ✅ Fonction pour formater la taille du fichier
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // ✅ Fonction pour obtenir l'icône du document
  const getDocumentIcon = (file) => {
    const type = file.type;
    if (type === 'application/pdf') return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('powerpoint')) return '📽️';
    if (type === 'text/plain') return '📃';
    if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return '📦';
    return '📎';
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('content', content);
      
      // ✅ Ajouter l'image si présente
      if (image) {
        formData.append('image', image);
      }
      
      // ✅ Ajouter le document si présent
      if (document) {
        formData.append('document', document);
      }

      const endpoint = isAnnouncement ? '/posts/announcement' : '/posts';
      
      if (isAnnouncement && expiresIn) {
        const days = parseInt(expiresIn);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);
        formData.append('expiresAt', expiresAt.toISOString());
      }

      await axios.post(`${API}${endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setContent('');
      setImage(null);
      setDocument(null);
      setIsAnnouncement(false);
      onCreated();

    } catch (err) {
      console.error('Erreur publication:', err);
      alert(err.response?.data?.message || 'Erreur lors de la publication');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Annuler l'upload d'image
  const handleRemoveImage = () => {
    setImage(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  // ✅ Annuler l'upload de document
  const handleRemoveDocument = () => {
    setDocument(null);
    if (documentInputRef.current) {
      documentInputRef.current.value = '';
    }
  };

  return (
    <div className={styles.createPost}>
      <div className={styles.header}>
        <div className={styles.avatar}>
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <textarea
          className={styles.input}
          rows="3"
          placeholder="Partagez une actualité avec vos collègues..."
          value={content}
          onChange={e => setContent(e.target.value)}
        />
      </div>

      {/* ✅ Aperçu de l'image */}
      {image && (
        <div className={styles.imagePreview}>
          <span>🖼️ {image.name}</span>
          <button onClick={handleRemoveImage} className={styles.removeBtn}>
            ✕
          </button>
        </div>
      )}

      {/* ✅ Aperçu du document */}
      {document && (
        <div className={styles.documentPreview}>
          <div className={styles.documentInfo}>
            <span className={styles.documentIcon}>
              {getDocumentIcon(document)}
            </span>
            <div className={styles.documentDetails}>
              <span className={styles.documentName}>{document.name}</span>
              <span className={styles.documentSize}>
                {formatFileSize(document.size)}
              </span>
            </div>
          </div>
          <button onClick={handleRemoveDocument} className={styles.removeBtn}>
            ✕
          </button>
        </div>
      )}

      <div className={styles.actions}>
        <div className={styles.leftActions}>
          {/* ✅ Bouton image */}
          <label className={styles.actionLabel}>
            🖼️ Image
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className={styles.fileInput}
              onChange={e => setImage(e.target.files[0])}
            />
          </label>

          {/* ✅ Bouton document */}
          <label className={styles.actionLabel}>
            📎 Document
            <input
              ref={documentInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.zip,.rar,.7z"
              className={styles.fileInput}
              onChange={e => setDocument(e.target.files[0])}
            />
          </label>
        </div>

        <div className={styles.rightActions}>
          {/* ✅ Option Annonce */}
          {canAnnounce && (
            <div className={styles.announcementOptions}>
              <label className={styles.announcementCheck}>
                <input
                  type="checkbox"
                  checked={isAnnouncement}
                  onChange={e => setIsAnnouncement(e.target.checked)}
                />
                📢 Annonce
              </label>
              
              {isAnnouncement && (
                <select
                  value={expiresIn}
                  onChange={e => setExpiresIn(e.target.value)}
                  className={styles.expiresSelect}
                >
                  <option value="1">1 jour</option>
                  <option value="3">3 jours</option>
                  <option value="7">7 jours</option>
                  <option value="30">30 jours</option>
                  <option value="0">Jamais</option>
                </select>
              )}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !content.trim()}
            className={`${styles.submitBtn} ${isAnnouncement ? styles.announcementBtn : ''}`}
          >
            {loading ? 'Publication...' : isAnnouncement ? '📢 Publier' : 'Publier →'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 5. Frontend - PostCard avec affichage du document

**📄 frontend/src/components/PostCard.jsx (extrait modifié)**

```jsx
// ✅ Icônes par type de document
const DOCUMENT_ICONS = {
  pdf: '📄',
  word: '📝',
  excel: '📊',
  powerpoint: '📽️',
  text: '📃',
  zip: '📦',
  other: '📎'
};

const DOCUMENT_LABELS = {
  pdf: 'PDF',
  word: 'Word',
  excel: 'Excel',
  powerpoint: 'PowerPoint',
  text: 'Texte',
  zip: 'Archive',
  other: 'Document'
};

// ✅ Fonction pour formater la taille
const formatFileSize = (bytes) => {
  if (!bytes) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// ✅ Dans le rendu, après le contenu
return (
  <div className={styles.postCard}>
    {/* ... header, contenu ... */}

    {/* ✅ Affichage de l'image */}
    {post.image && (
      <img
        src={`${BASE}${post.image}`}
        alt=""
        className={styles.image}
      />
    )}

    {/* ✅ Affichage du document */}
    {post.document && (
      <div className={styles.documentCard}>
        <div className={styles.documentIcon}>
          {DOCUMENT_ICONS[post.documentType] || '📎'}
        </div>
        <div className={styles.documentInfo}>
          <div className={styles.documentName}>
            {post.documentName || 'Document'}
          </div>
          <div className={styles.documentMeta}>
            <span className={styles.documentType}>
              {DOCUMENT_LABELS[post.documentType] || 'Document'}
            </span>
            <span className={styles.documentSize}>
              {formatFileSize(post.documentSize)}
            </span>
          </div>
        </div>
        <a
          href={`${API}/posts/${post._id}/download`}
          className={styles.downloadBtn}
          target="_blank"
          rel="noopener noreferrer"
        >
          ⬇️ Télécharger
        </a>
      </div>
    )}

    {/* ... actions, commentaires ... */}
  </div>
);
```

### 6. CSS pour l'affichage des documents

**📄 frontend/src/components/Css/PostCard.module.css (ajouts)**

```css
/* ============================================
   DOCUMENT CARD
   ============================================ */

.documentCard {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  transition: all 0.2s;
}

.documentCard:hover {
  border-color: var(--color-primary);
  background: var(--bg-hover);
}

.documentIcon {
  font-size: 32px;
  flex-shrink: 0;
  width: 48px;
  text-align: center;
}

.documentInfo {
  flex: 1;
  min-width: 0;
}

.documentName {
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.documentMeta {
  display: flex;
  gap: var(--spacing-sm);
  font-size: var(--font-xs);
  color: var(--text-muted);
}

.downloadBtn {
  padding: 6px 14px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-pill);
  font-size: var(--font-sm);
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
  flex-shrink: 0;
  cursor: pointer;
}

.downloadBtn:hover {
  opacity: 0.85;
  transform: scale(1.02);
}

/* ============================================
   RESPONSIVE - Document card
   ============================================ */

@media (max-width: 480px) {
  .documentCard {
    flex-wrap: wrap;
    padding: var(--spacing-sm);
  }

  .documentIcon {
    font-size: 24px;
    width: 36px;
  }

  .documentName {
    font-size: var(--font-xs);
  }

  .downloadBtn {
    width: 100%;
    text-align: center;
    padding: 8px;
    margin-top: var(--spacing-xs);
  }
}
```

**📄 frontend/src/components/Css/CreatePost.module.css (ajouts)**

```css
/* ============================================
   DOCUMENT PREVIEW
   ============================================ */

.documentPreview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.documentInfo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex: 1;
  min-width: 0;
}

.documentIcon {
  font-size: 24px;
}

.documentDetails {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.documentName {
  font-size: var(--font-sm);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.documentSize {
  font-size: var(--font-xs);
  color: var(--text-muted);
}

.removeBtn {
  background: none;
  border: none;
  color: var(--color-danger);
  cursor: pointer;
  font-size: var(--font-lg);
  padding: var(--spacing-xs);
  flex-shrink: 0;
}

.removeBtn:hover {
  transform: scale(1.2);
}

/* ============================================
   ACTIONS
   ============================================ */

.leftActions {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.rightActions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.actionLabel {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  font-size: var(--font-sm);
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.actionLabel:hover {
  background: var(--bg-hover);
  border-color: var(--color-primary);
  color: var(--text-primary);
}

.fileInput {
  display: none;
}

/* ============================================
   RESPONSIVE - CreatePost
   ============================================ */

@media (max-width: 480px) {
  .leftActions {
    flex-direction: column;
    width: 100%;
  }

  .actionLabel {
    justify-content: center;
    width: 100%;
  }

  .rightActions {
    flex-direction: column;
    width: 100%;
  }

  .announcementOptions {
    flex-direction: column;
    width: 100%;
  }

  .submitBtn {
    width: 100%;
    justify-content: center;
  }
}
```

---

## Récapitulatif des fichiers modifiés

| Fichier | Modification |
|---------|--------------|
| `backend/middleware/upload.js` | Support des documents (PDF, Word, Excel, etc.) |
| `backend/models/Post.js` | Nouveaux champs : document, documentType, documentName, documentSize |
| `backend/routes/posts.js` | Routes POST avec `upload.fields()`, GET `/download` |
| `frontend/src/components/CreatePost.jsx` | Upload de documents + aperçu |
| `frontend/src/components/PostCard.jsx` | Affichage des documents avec icônes |
| `frontend/src/components/Css/CreatePost.module.css` | Styles pour l'aperçu des documents |
| `frontend/src/components/Css/PostCard.module.css` | Styles pour l'affichage des documents |

---

## Tests à effectuer

1. ✅ Uploader un PDF → Voir l'icône 📄 et le bouton "Télécharger"
2. ✅ Uploader un Word → Voir l'icône 📝
3. ✅ Uploader un Excel → Voir l'icône 📊
4. ✅ Uploader une image → S'affiche normalement
5. ✅ Télécharger un document → Le fichier est téléchargé avec son nom original
6. ✅ Uploader un fichier trop volumineux (>10 Mo) → Erreur
7. ✅ Uploader un format non supporté → Erreur

---

**C'est fait !** Votre application peut maintenant gérer tous les types de documents. Voulez-vous que je vous aide à intégrer une fonctionnalité de **prévisualisation en ligne** (PDF viewer intégré) ou un **stockage cloud** (Cloudinary, AWS S3) pour la production ?




==================================================================================================================================================================================================================================================================================================================


Excellente question ! L'envoi de documents dans les **messages individuels** et les **messages de groupe** est tout aussi important que dans les posts. Voici comment l'implémenter.

---

## Architecture pour l'envoi de documents dans les messages

### Schéma de principe

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                        │
├─────────────────────────────────────────────────────────────┤
│  MessageInput.jsx                                          │
│  ├── Textarea (contenu)                                    │
│  ├── Bouton 📎 (sélection fichier)                         │
│  ├── Aperçu du document                                    │
│  └── Bouton Envoyer                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND (Node.js)                       │
├─────────────────────────────────────────────────────────────┤
│  routes/messages.js                                        │
│  ├── POST /api/messages (avec upload)                      │
│  ├── GET /api/messages/:id/download                        │
│  └── Socket.io : sendMessage + document                    │
│                                                             │
│  socket/index.js                                           │
│  └── sendMessage avec gestion de document                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BASE DE DONNÉES                          │
├─────────────────────────────────────────────────────────────┤
│  models/Message.js                                         │
│  ├── document: String                                      │
│  ├── documentType: String                                  │
│  ├── documentName: String                                  │
│  └── documentSize: Number                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Backend - Modification du modèle Message

**📄 backend/models/Message.js**

```javascript
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  room: {
    type: String,
    required: true
  },
  // ✅ NOUVEAU : Document attaché au message
  document: {
    type: String,
    default: null
  },
  documentType: {
    type: String,
    enum: [null, 'pdf', 'word', 'excel', 'powerpoint', 'text', 'zip', 'image', 'other'],
    default: null
  },
  documentName: {
    type: String,
    default: null
  },
  documentSize: {
    type: Number,
    default: null
  },
  read: {
    type: Boolean,
    default: false
  },
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  oldContent: {
    type: String
  },
  // ✅ NOUVEAU : Pour les messages de groupe
  isGroupMessage: {
    type: Boolean,
    default: false
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  }
}, { timestamps: true });

// Index pour accélérer les requêtes
MessageSchema.index({ room: 1, createdAt: -1 });
MessageSchema.index({ recipient: 1, read: 1 });
MessageSchema.index({ group: 1, createdAt: -1 });

module.exports = mongoose.model('Message', MessageSchema);
```

---

## 2. Backend - Modification du modèle GroupMessage

**📄 backend/models/GroupMessage.js**

```javascript
const mongoose = require('mongoose');

const GroupMessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  // ✅ NOUVEAU : Document attaché
  document: {
    type: String,
    default: null
  },
  documentType: {
    type: String,
    enum: [null, 'pdf', 'word', 'excel', 'powerpoint', 'text', 'zip', 'image', 'other'],
    default: null
  },
  documentName: {
    type: String,
    default: null
  },
  documentSize: {
    type: Number,
    default: null
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  oldContent: {
    type: String,
    default: null
  }
}, { timestamps: true });

GroupMessageSchema.index({ group: 1, createdAt: -1 });

module.exports = mongoose.model('GroupMessage', GroupMessageSchema);
```

---

## 3. Backend - Middleware d'upload pour les messages

**📄 backend/middleware/upload.js (ajout)**

```javascript
// ✅ Configuration pour les messages (10 Mo max)
const uploadMessage = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 Mo
  },
  fileFilter,
});

// ✅ Export des middlewares
module.exports = {
  upload,
  uploadImage,
  uploadDocument,
  uploadMessage, // ✅ Nouveau pour les messages
};
```

---

## 4. Backend - Routes messages avec upload

**📄 backend/routes/messages.js (modifié)**

```javascript
const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { uploadMessage } = require('../middleware/upload');
const Message = require('../models/Message');
const { getRoomId } = require('../helpers/room');
const fs = require('fs');
const path = require('path');

// ✅ Fonction pour détecter le type de document
const getDocumentType = (mimetype) => {
  if (!mimetype) return null;
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype === 'application/pdf') return 'pdf';
  if (mimetype === 'application/msword' ||
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'word';
  if (mimetype === 'application/vnd.ms-excel' ||
      mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return 'excel';
  if (mimetype === 'application/vnd.ms-powerpoint' ||
      mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return 'powerpoint';
  if (mimetype === 'text/plain' || mimetype === 'application/rtf') return 'text';
  if (mimetype === 'application/zip' ||
      mimetype === 'application/x-rar-compressed' ||
      mimetype === 'application/x-7z-compressed') return 'zip';
  return 'other';
};

// ✅ POST /api/messages - Envoyer un message (avec document)
router.post('/', protect, uploadMessage.single('document'), async (req, res) => {
  try {
    const { recipientId, content, replyTo } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Message vide' });
    }

    const roomId = getRoomId(req.user._id, recipientId);

    // ✅ Vérifier le replyTo si présent
    if (replyTo) {
      const original = await Message.findOne({ _id: replyTo, room: roomId });
      if (!original) {
        return res.status(400).json({ message: 'Message cité introuvable dans cette conversation' });
      }
    }

    // ✅ Construction du message
    const messageData = {
      sender: req.user._id,
      recipient: recipientId,
      content: content.trim(),
      room: roomId,
      replyTo: replyTo || null,
    };

    // ✅ Gestion du document
    if (req.file) {
      const doc = req.file;
      messageData.document = `/uploads/messages/${doc.filename}`;
      messageData.documentType = getDocumentType(doc.mimetype);
      messageData.documentName = doc.originalname;
      messageData.documentSize = doc.size;
    }

    const message = await Message.create(messageData);

    await message.populate('sender', 'name avatar department');
    await message.populate('recipient', 'name avatar');
    if (message.replyTo) {
      await message.populate({
        path: 'replyTo',
        select: 'content sender deleted',
        populate: { path: 'sender', select: 'name' }
      });
    }

    // ✅ Émettre le message à la room
    const io = req.app.get('io');
    io.to(roomId).emit('newMessage', message);

    // ✅ Notification au destinataire
    const Notification = require('../models/Notification');
    const notification = await Notification.create({
      recipient: recipientId,
      sender: req.user._id,
      type: 'message',
      message: content.trim().substring(0, 100),
      metadata: {
        messageId: message._id,
        roomId,
        hasDocument: !!message.document
      }
    });

    io.to(`user_${recipientId}`).emit('notification', {
      _id: notification._id,
      type: 'message',
      sender: {
        _id: req.user._id,
        name: req.user.name,
        avatar: req.user.avatar
      },
      message: content.trim().substring(0, 100),
      hasDocument: !!message.document,
      createdAt: notification.createdAt,
      read: false
    });

    res.status(201).json(message);

  } catch (err) {
    console.error('❌ Erreur envoi message:', err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ GET /api/messages/:id/download - Télécharger un document
router.get('/:id/download', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message introuvable' });
    }

    // ✅ Vérifier que l'utilisateur a accès
    if (message.sender.toString() !== req.user._id.toString() &&
        message.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    if (!message.document) {
      return res.status(404).json({ message: 'Aucun document attaché' });
    }

    const filePath = path.join(__dirname, '..', message.document);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Fichier introuvable' });
    }

    const fileName = message.documentName || path.basename(message.document);
    res.download(filePath, fileName);

  } catch (err) {
    console.error('❌ Erreur téléchargement:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
```

---

## 5. Backend - Routes Groupes avec messages documents

**📄 backend/routes/groups.js (ajout)**

```javascript
// ✅ POST /api/groups/:id/messages - Envoyer un message de groupe avec document
router.post('/:id/messages', protect, uploadMessage.single('document'), async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Message vide' });
    }

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ message: 'Groupe introuvable' });
    }

    if (!group.isMember(req.user._id)) {
      return res.status(403).json({ message: 'Vous n\'êtes pas membre de ce groupe' });
    }

    // ✅ Construction du message
    const messageData = {
      sender: req.user._id,
      group: id,
      content: content.trim(),
    };

    // ✅ Gestion du document
    if (req.file) {
      const doc = req.file;
      messageData.document = `/uploads/messages/${doc.filename}`;
      messageData.documentType = getDocumentType(doc.mimetype);
      messageData.documentName = doc.originalname;
      messageData.documentSize = doc.size;
    }

    const message = await GroupMessage.create(messageData);
    await message.populate('sender', 'name avatar department');

    // ✅ Émettre à tous les membres du groupe
    const io = req.app.get('io');
    io.to(`group_${id}`).emit('newGroupMessage', message);

    res.status(201).json(message);

  } catch (err) {
    console.error('❌ Erreur envoi message groupe:', err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ GET /api/groups/:id/messages/:msgId/download - Télécharger un document
router.get('/:id/messages/:msgId/download', protect, async (req, res) => {
  try {
    const { id, msgId } = req.params;

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ message: 'Groupe introuvable' });
    }

    if (!group.isMember(req.user._id)) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const message = await GroupMessage.findById(msgId);
    if (!message) {
      return res.status(404).json({ message: 'Message introuvable' });
    }

    if (message.group.toString() !== id) {
      return res.status(403).json({ message: 'Message non lié à ce groupe' });
    }

    if (!message.document) {
      return res.status(404).json({ message: 'Aucun document attaché' });
    }

    const filePath = path.join(__dirname, '..', message.document);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Fichier introuvable' });
    }

    const fileName = message.documentName || path.basename(message.document);
    res.download(filePath, fileName);

  } catch (err) {
    console.error('❌ Erreur téléchargement:', err);
    res.status(500).json({ message: err.message });
  }
});
```

---

## 6. Frontend - MessageInput avec upload de document

**📄 frontend/src/components/message/MessageInput.jsx**

```jsx
import { useState, useRef } from 'react';
import styles from './MessageInput.module.css';

export default function MessageInput({
  onSendMessage,
  onTyping,
  replyingTo,
  onCancelReply,
  onSendDocument // ✅ Nouvelle prop
}) {
  const [content, setContent] = useState('');
  const [document, setDocument] = useState(null); // ✅ État pour le document
  const [uploading, setUploading] = useState(false);
  const typingTimeout = useRef(null);
  const fileInputRef = useRef(null);

  // ✅ Fonction pour formater la taille
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // ✅ Fonction pour obtenir l'icône du document
  const getDocumentIcon = (file) => {
    const type = file.type;
    if (type === 'application/pdf') return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('powerpoint')) return '📽️';
    if (type === 'text/plain') return '📃';
    if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return '📦';
    if (type.startsWith('image/')) return '🖼️';
    return '📎';
  };

  const handleChange = (e) => {
    setContent(e.target.value);
    onTyping(true);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => onTyping(false), 1500);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim() && !document) return;

    // ✅ Envoyer le message avec le document
    const formData = new FormData();
    formData.append('content', content.trim());
    if (document) {
      formData.append('document', document);
    }
    if (replyingTo?._id) {
      formData.append('replyTo', replyingTo._id);
    }

    onSendMessage(formData);
    setContent('');
    setDocument(null);
    onTyping(false);
    onCancelReply?.();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ✅ Gestion de la sélection de fichier
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // ✅ Vérifier la taille (10 Mo max)
      if (file.size > 10 * 1024 * 1024) {
        alert('Le fichier est trop volumineux (max 10 Mo)');
        e.target.value = '';
        return;
      }
      setDocument(file);
    }
  };

  // ✅ Supprimer le document sélectionné
  const handleRemoveDocument = () => {
    setDocument(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.inputContainer}>
      {/* ✅ Barre de citation (reply) */}
      {replyingTo && (
        <div className={styles.replyBanner}>
          <div className={styles.replyBannerContent}>
            <span className={styles.replyBannerAuthor}>
              En réponse à {replyingTo.sender?.name}
            </span>
            <p className={styles.replyBannerText}>{replyingTo.content}</p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className={styles.replyCancelBtn}
          >
            ✕
          </button>
        </div>
      )}

      {/* ✅ Aperçu du document */}
      {document && (
        <div className={styles.documentPreview}>
          <div className={styles.documentInfo}>
            <span className={styles.documentIcon}>
              {getDocumentIcon(document)}
            </span>
            <div className={styles.documentDetails}>
              <span className={styles.documentName}>{document.name}</span>
              <span className={styles.documentSize}>
                {formatFileSize(document.size)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemoveDocument}
            className={styles.documentRemoveBtn}
          >
            ✕
          </button>
        </div>
      )}

      <div className={styles.inputRow}>
        <textarea
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={
            document
              ? 'Ajoutez un commentaire (optionnel)'
              : 'Votre message... (Entrée pour envoyer)'
          }
          className={styles.textarea}
          rows={1}
          disabled={uploading}
        />

        {/* ✅ Bouton d'upload de document */}
        <label className={styles.uploadBtn}>
          📎
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.zip,.rar,.7z,image/*"
            onChange={handleFileSelect}
            className={styles.fileInput}
            disabled={uploading}
          />
        </label>

        <button
          type="submit"
          disabled={(!content.trim() && !document) || uploading}
          className={styles.sendButton}
        >
          {uploading ? '⏳' : '→'}
        </button>
      </div>
    </form>
  );
}
```

---

## 7. Frontend - MessageBubble avec affichage du document

**📄 frontend/src/components/message/MessageBubble.jsx (extrait modifié)**

```jsx
// ✅ Icônes par type de document
const DOCUMENT_ICONS = {
  pdf: '📄',
  word: '📝',
  excel: '📊',
  powerpoint: '📽️',
  text: '📃',
  zip: '📦',
  image: '🖼️',
  other: '📎'
};

const DOCUMENT_LABELS = {
  pdf: 'PDF',
  word: 'Word',
  excel: 'Excel',
  powerpoint: 'PowerPoint',
  text: 'Texte',
  zip: 'Archive',
  image: 'Image',
  other: 'Document'
};

// ✅ Fonction pour formater la taille
const formatFileSize = (bytes) => {
  if (!bytes) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// ✅ Dans le rendu, après la bulle de message
return (
  <div className={...}>
    {/* ... message content ... */}
    
    {/* ✅ Affichage du document */}
    {message.document && (
      <div className={styles.documentCard}>
        <div className={styles.documentIcon}>
          {DOCUMENT_ICONS[message.documentType] || '📎'}
        </div>
        <div className={styles.documentInfo}>
          <div className={styles.documentName}>
            {message.documentName || 'Document'}
          </div>
          <div className={styles.documentMeta}>
            <span>{DOCUMENT_LABELS[message.documentType] || 'Document'}</span>
            <span>•</span>
            <span>{formatFileSize(message.documentSize)}</span>
          </div>
        </div>
        <a
          href={`${API}/messages/${message._id}/download`}
          className={styles.downloadBtn}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          ⬇️
        </a>
      </div>
    )}
  </div>
);
```

---

## 8. Frontend - Messages.jsx (orchestrateur) modifié

**📄 frontend/src/pages/Messages.jsx (extrait modifié)**

```jsx
// ✅ handleSendMessage modifié pour accepter FormData
const handleSendMessage = useCallback(async (formData) => {
  if (!activeConversation) return;

  const content = formData.get('content') || '';
  if (!content.trim() && !formData.has('document')) return;

  const tempId = Date.now();

  // ✅ Message temporaire pour l'optimistic update
  const tempMessage = {
    _id: tempId,
    content: content.trim() || '📎 Document',
    sender: { _id: user._id, name: user.name, avatar: user.avatar },
    recipient: activeConversation,
    createdAt: new Date().toISOString(),
    read: false,
    document: formData.has('document') ? '/uploads/messages/temp' : null,
    documentName: formData.get('document')?.name || null,
    documentType: 'other',
    documentSize: formData.get('document')?.size || null,
    sending: true
  };

  setMessages(prev => [...prev, tempMessage]);
  updateConversationLastMessage(tempMessage);

  try {
    // ✅ Envoyer le FormData directement
    const { data } = await axios.post(`${API}/messages`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    setMessages(prev => prev.map(msg =>
      msg._id === tempId ? data : msg
    ));
    updateConversationLastMessage(data);

  } catch (err) {
    console.error('❌ Erreur envoi message:', err);
    setMessages(prev => prev.filter(msg => msg._id !== tempId));
    alert(err.response?.data?.message || 'Erreur lors de l\'envoi du message');
  }
}, [activeConversation, user, updateConversationLastMessage]);
```

---

## 9. CSS pour l'affichage des documents dans les messages

**📄 frontend/src/components/message/MessageBubble.module.css (ajouts)**

```css
/* ============================================
   DOCUMENT CARD (dans les messages)
   ============================================ */

.documentCard {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  margin-top: 6px;
  transition: all 0.2s;
  min-width: 0;
}

.documentCard:hover {
  border-color: var(--color-primary);
}

.documentIcon {
  font-size: 24px;
  flex-shrink: 0;
}

.documentInfo {
  flex: 1;
  min-width: 0;
}

.documentName {
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.documentMeta {
  display: flex;
  gap: 6px;
  font-size: var(--font-xs);
  color: var(--text-muted);
}

.downloadBtn {
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: background 0.2s;
  color: var(--text-primary);
  text-decoration: none;
  flex-shrink: 0;
}

.downloadBtn:hover {
  background: var(--bg-hover);
}

/* ============================================
   RESPONSIVE
   ============================================ */

@media (max-width: 480px) {
  .documentCard {
    flex-wrap: wrap;
    padding: 6px 10px;
  }

  .documentIcon {
    font-size: 20px;
  }

  .documentName {
    font-size: var(--font-xs);
  }

  .downloadBtn {
    font-size: 16px;
    padding: 2px 6px;
  }
}
```

**📄 frontend/src/components/message/MessageInput.module.css (ajouts)**

```css
/* ============================================
   UPLOAD BUTTON
   ============================================ */

.uploadBtn {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 8px 10px;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  height: 40px;
  width: 40px;
}

.uploadBtn:hover {
  background: var(--bg-hover);
  border-color: var(--color-primary);
}

.fileInput {
  display: none;
}

/* ============================================
   DOCUMENT PREVIEW
   ============================================ */

.documentPreview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 6px 10px;
  margin-bottom: 6px;
  width: 100%;
  box-sizing: border-box;
}

.documentInfo {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.documentIcon {
  font-size: 20px;
  flex-shrink: 0;
}

.documentDetails {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.documentName {
  font-size: var(--font-sm);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.documentSize {
  font-size: var(--font-xs);
  color: var(--text-muted);
}

.documentRemoveBtn {
  background: none;
  border: none;
  color: var(--color-danger);
  cursor: pointer;
  font-size: 16px;
  padding: 2px 6px;
  flex-shrink: 0;
}

.documentRemoveBtn:hover {
  transform: scale(1.2);
}

/* ============================================
   INPUT ROW
   ============================================ */

.inputRow {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  width: 100%;
}

.textarea {
  flex: 1;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  color: var(--text-primary);
  font-size: var(--font-sm);
  outline: none;
  resize: none;
  max-height: 120px;
  overflow-y: auto;
  line-height: 1.5;
  font-family: inherit;
  transition: border-color 0.2s;
  min-height: 40px;
  box-sizing: border-box;
}

.textarea:focus {
  border-color: var(--color-primary);
}

.textarea::placeholder {
  color: var(--text-muted);
}

.sendButton {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
  transition: opacity 0.2s;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
}

.sendButton:hover {
  opacity: 0.85;
}

.sendButton:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
```

---

## 10. Socket.io - Gestion des documents en temps réel

**📄 backend/socket/index.js (extrait modifié)**

```javascript
// ✅ sendMessage avec gestion du document
socket.on('sendMessage', async ({ recipientId, content, documentData }) => {
  try {
    const Message = require('../models/Message');
    const roomId = getRoomId(socket.user._id, recipientId);

    const messageData = {
      sender: socket.user._id,
      recipient: recipientId,
      content,
      room: roomId,
    };

    // ✅ Si un document est envoyé via Socket.io
    if (documentData) {
      messageData.document = documentData.path;
      messageData.documentType = documentData.type;
      messageData.documentName = documentData.name;
      messageData.documentSize = documentData.size;
    }

    const message = await Message.create(messageData);
    await message.populate('sender', 'name avatar department');
    await message.populate('recipient', 'name avatar');

    io.to(roomId).emit('newMessage', message);

    // Notification avec indication de document
    io.to(`user_${recipientId}`).emit('notification', {
      type: 'message',
      sender: { _id: socket.user._id, name: socket.user.name, avatar: socket.user.avatar },
      message: content || '📎 Document envoyé',
      hasDocument: !!message.document,
      createdAt: new Date()
    });

  } catch (err) {
    socket.emit('error', { message: err.message });
  }
});
```

---

## Récapitulatif des modifications

| Fichier | Modifications |
|---------|---------------|
| `models/Message.js` | Ajout des champs document, documentType, documentName, documentSize |
| `models/GroupMessage.js` | Ajout des mêmes champs |
| `middleware/upload.js` | Ajout de `uploadMessage` |
| `routes/messages.js` | POST avec upload, GET /download |
| `routes/groups.js` | POST messages avec upload, GET /download |
| `socket/index.js` | sendMessage avec documentData |
| `MessageInput.jsx` | Upload de document + aperçu |
| `MessageBubble.jsx` | Affichage du document + bouton téléchargement |
| `Messages.jsx` | handleSendMessage avec FormData |
| `*.module.css` | Styles pour documents dans les messages |

---

## Tests à effectuer

1. ✅ Envoyer un PDF en message privé → Voir l'icône 📄 + téléchargement
2. ✅ Envoyer un Word en message privé → Voir l'icône 📝
3. ✅ Envoyer un Excel en message privé → Voir l'icône 📊
4. ✅ Envoyer un document dans un groupe → Tous les membres le voient
5. ✅ Télécharger un document depuis un message → Fichier téléchargé
6. ✅ Envoyer un message avec texte + document → Les deux sont visibles
7. ✅ Fichier > 10 Mo → Refusé avec message d'erreur

---

**C'est fait !** Votre application gère maintenant l'envoi de documents dans :
- ✅ Les publications (posts)
- ✅ Les annonces officielles
- ✅ Les messages privés
- ✅ Les messages de groupe

Voulez-vous que j'ajoute la **prévisualisation des PDF** directement dans l'application (sans téléchargement) ou un **indicateur de progression** pour l'upload de fichiers volumineux ?