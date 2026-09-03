Ah ! Vous voulez implémenter une **recherche dans le feed** qui filtre les publications en temps réel. Voici une solution complète :

## ✅ Solution : Recherche dans le Feed

### 1. Modifiez `Feed.jsx` - Ajout de la recherche

```jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import styles from './feed.module.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function Feed() {
    const [posts, setPosts] = useState([]);
    const [filteredPosts, setFilteredPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Charger les posts
    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setLoading(true);
                const { data } = await axios.get(`${API}/posts/feed`);
                setPosts(data);
                setFilteredPosts(data); // ✅ Initialiser avec tous les posts
            } catch (err) {
                console.error('Erreur chargement feed:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, []);

    // ✅ FILTRE DE RECHERCHE en temps réel
    useEffect(() => {
        if (!search.trim()) {
            setFilteredPosts(posts);
            return;
        }

        const searchLower = search.toLowerCase().trim();
        const filtered = posts.filter(post => {
            // Recherche dans le contenu du post
            const contentMatch = post.content?.toLowerCase().includes(searchLower);
            
            // Recherche dans le nom de l'auteur
            const authorMatch = post.author?.name?.toLowerCase().includes(searchLower);
            
            // Recherche dans le département
            const departmentMatch = post.author?.department?.toLowerCase().includes(searchLower);
            
            return contentMatch || authorMatch || departmentMatch;
        });

        setFilteredPosts(filtered);
    }, [search, posts]);

    // ✅ Recharger après création
    const handleCreated = async () => {
        try {
            const { data } = await axios.get(`${API}/posts/feed`);
            setPosts(data);
            setFilteredPosts(data);
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner} />
                <p>Chargement des publications...</p>
            </div>
        );
    }

    return (
        <div className={styles.feed}>
            {/* ✅ Barre de recherche intégrée */}
            <div className={styles.searchContainer}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher publications, auteurs, départements..."
                    className={styles.searchInput}
                />
                {search && (
                    <button 
                        className={styles.clearSearch}
                        onClick={() => setSearch('')}
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Affichage du nombre de résultats */}
            {search && (
                <p className={styles.resultCount}>
                    {filteredPosts.length} résultat{filteredPosts.length > 1 ? 's' : ''} 
                    {filteredPosts.length === 0 ? ' (aucun résultat)' : ''}
                </p>
            )}

            <CreatePost onCreated={handleCreated} />

            {filteredPosts.length === 0 ? (
                <div className={styles.emptyState}>
                    {search ? (
                        <>
                            <p>🔍 Aucune publication ne correspond à "<strong>{search}</strong>"</p>
                            <button 
                                className={styles.clearSearchBtn}
                                onClick={() => setSearch('')}
                            >
                                Effacer la recherche
                            </button>
                        </>
                    ) : (
                        <p>Aucune publication pour le moment.</p>
                    )}
                </div>
            ) : (
                filteredPosts.map(post => (
                    <PostCard
                        key={post._id}
                        post={post}
                        onDeleted={(id) => {
                            setPosts(prev => prev.filter(p => p._id !== id));
                            setFilteredPosts(prev => prev.filter(p => p._id !== id));
                        }}
                    />
                ))
            )}
        </div>
    );
}
```

---

### 2. Mettez à jour `feed.module.css`

```css
/* ========== FEED ========== */
.feed {
    max-width: 680px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 20px 16px;
    background-color: #0f0f0f;
    min-height: 100vh;
}

/* ========== BARRE DE RECHERCHE ========== */
.searchContainer {
    position: relative;
    width: 100%;
    background: #181C27;
    border: 1px solid #2A2F45;
    border-radius: 28px;
    padding: 0 16px;
    display: flex;
    align-items: center;
    transition: border-color 0.3s, box-shadow 0.3s;
}

.searchContainer:focus-within {
    border-color: #4F8EF7;
    box-shadow: 0 0 0 3px rgba(79, 142, 247, 0.15);
}

.searchIcon {
    font-size: 16px;
    color: #64748B;
    margin-right: 12px;
    flex-shrink: 0;
}

.searchInput {
    flex: 1;
    background: transparent;
    border: none;
    padding: 12px 0;
    font-size: 14px;
    color: #E2E8F0;
    outline: none;
    font-family: inherit;
}

.searchInput::placeholder {
    color: #64748B;
    font-size: 13px;
}

.clearSearch {
    background: none;
    border: none;
    color: #64748B;
    cursor: pointer;
    font-size: 16px;
    padding: 4px 8px;
    border-radius: 50%;
    transition: all 0.2s;
    flex-shrink: 0;
}

.clearSearch:hover {
    color: #F87171;
    background: rgba(248, 113, 113, 0.1);
}

/* ========== NOMBRE DE RÉSULTATS ========== */
.resultCount {
    font-size: 13px;
    color: #64748B;
    margin: 0 0 4px 4px;
    padding: 0;
}

/* ========== ÉTAT VIDE AVEC RECHERCHE ========== */
.emptyState {
    text-align: center;
    padding: 48px 24px;
    color: #94a3b8;
    background: #181C27;
    border-radius: 16px;
    border: 1px solid #2A2F45;
}

.emptyState p {
    font-size: 15px;
    margin-bottom: 16px;
    line-height: 1.6;
}

.emptyState strong {
    color: #E2E8F0;
}

.clearSearchBtn {
    background: transparent;
    border: 1px solid #4F8EF7;
    color: #4F8EF7;
    padding: 8px 20px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s;
}

.clearSearchBtn:hover {
    background: #4F8EF7;
    color: white;
}

/* ========== LOADING ========== */
.loadingContainer {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    gap: 16px;
    color: #94a3b8;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #2A2F45;
    border-top-color: #4F8EF7;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* ========== RESPONSIVE ========== */
@media (max-width: 768px) {
    .feed {
        padding: 12px 12px;
        gap: 16px;
    }

    .searchContainer {
        padding: 0 12px;
        border-radius: 24px;
    }

    .searchInput {
        font-size: 13px;
        padding: 10px 0;
    }

    .searchInput::placeholder {
        font-size: 12px;
    }

    .resultCount {
        font-size: 12px;
    }
}

@media (max-width: 480px) {
    .feed {
        padding: 8px 8px;
        gap: 12px;
    }

    .searchContainer {
        border-radius: 20px;
        padding: 0 10px;
    }

    .searchIcon {
        font-size: 14px;
        margin-right: 8px;
    }

    .searchInput {
        font-size: 12px;
        padding: 8px 0;
    }

    .searchInput::placeholder {
        font-size: 11px;
    }
}
```

---

## 🎯 Fonctionnalités implémentées

| Fonctionnalité | Description |
|----------------|-------------|
| 🔍 **Recherche en temps réel** | Filtre les posts à chaque frappe |
| 👤 **Recherche par auteur** | Trouve les posts d'un collègue |
| 🏢 **Recherche par département** | Filtre par service |
| 📝 **Recherche dans le contenu** | Trouve des mots dans les posts |
| ❌ **Bouton effacer** | Réinitialise la recherche en un clic |
| 📊 **Nombre de résultats** | Affiche combien de posts trouvés |
| 📱 **Responsive** | S'adapte à toutes les tailles d'écran |

---

## 📝 Exemple d'utilisation

1. **Taper "Zogo"** → Affiche tous les posts de Zogo
2. **Taper "finance"** → Affiche tous les posts du département Finance
3. **Taper "réunion"** → Affiche tous les posts contenant "réunion"
4. **Taper "Jean"** → Affiche tous les posts de Jean ET ceux où il est mentionné

---

## 🔧 Optimisation (si beaucoup de posts)

Si vous avez des centaines de posts, ajoutez un **debounce** :

```jsx
// Ajoutez ceci dans Feed.jsx
useEffect(() => {
    const timer = setTimeout(() => {
        // Votre logique de filtrage ici
        if (!search.trim()) {
            setFilteredPosts(posts);
            return;
        }
        // ... filtrage
    }, 300); // Attendre 300ms après la dernière frappe

    return () => clearTimeout(timer);
}, [search, posts]);
```

La recherche fonctionne maintenant parfaitement ! 🎉