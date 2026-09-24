import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

import PostCard from '../components/PostCard';
import styles from './profile.module.css';




const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const BASE =
  import.meta.env.VITE_API_URL?.replace('/api', '') ||
  'http://localhost:5001';

const COLORS = [
  'linear-gradient(135deg,#4F8EF7,#A78BFA)',
  'linear-gradient(135deg,#34D399,#059669)',
  'linear-gradient(135deg,#F87171,#EC4899)',
  'linear-gradient(135deg,#FBBF24,#F59E0B)',
];

const DEPARTMENTS = [
  'Informatique',
  'Marketing',
  'RH',
  'Finance',
  'Direction',
  'Design',
];

export default function Profile() {
  const { identifier } = useParams();
  const { user: me, token } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  const [followMessage, setFollowMessage] = useState({
    show: false,
    text: '',
    type: '',
  });

  // ✅ Détection de "mon profil" :
  // - soit l'URL est /profile/me
  // - soit l'identifier correspond à mon _id
  // - soit l'identifier correspond à mon username
  const isMe =
    identifier === 'me' ||
    identifier === me?._id ||
    identifier === me?.username;

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const showMessage = (text, type = 'success') => {
    setFollowMessage({ show: true, text, type });
    setTimeout(() => {
      setFollowMessage({ show: false, text: '', type: '' });
    }, 3000);
  };

  // =========================
  // CHARGEMENT PROFIL
  // =========================
  useEffect(() => {
   

    const fetchProfileAndPosts = async () => {
      setLoading(true);
      try {
        const endpoint = isMe ? '/users/me' : `/users/${identifier}`;
        console.log('Appel API :', `${API}${endpoint}`);

        const { data: profData } = await axios.get(
          `${API}${endpoint}`,
          axiosConfig
        );
        setProfile(profData);

        if (!isMe && me) {
          setIsFollowing(
            profData.followers?.some(
              (f) => (f._id || f).toString() === me._id?.toString()
            )
          );
        }

        // On utilise l'_id réel pour récupérer les posts
        const userId = isMe ? me?._id : profData._id;

        if (userId) {
          try {
            const { data: userPosts } = await axios.get(
              `${API}/posts/user/${userId}`,
              axiosConfig
            );
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

    if (token && me) fetchProfileAndPosts();
  }, [identifier, me?._id, isMe, token]);

 
  // =========================
  // FOLLOW / UNFOLLOW
  // =========================
  const handleFollow = async () => {
    if (!profile?._id || !me) return;

    try {
      // ✅ On utilise l'_id du profil chargé (fiable)
      const { data } = await axios.post(
        `${API}/users/${profile._id}/follow`,
        {},
        axiosConfig
      );

      setIsFollowing(data.following);

      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          followers: data.following
            ? [
                ...(prev.followers || []),
                { _id: me._id, name: me.name, avatar: me.avatar },
              ]
            : (prev.followers || []).filter(
                (f) => (f._id || f).toString() !== me._id.toString()
              ),
        };
      });

      showMessage(
        data.following
          ? `✅ Vous suivez maintenant ${profile?.name}`
          : `❌ Vous ne suivez plus ${profile?.name}`
      );
    } catch (err) {
      console.error('Erreur follow:', err);
      showMessage(
        err.response?.data?.message || 'Erreur lors du follow',
        'error'
      );
    }
  };

  // =========================
  // MODIFICATION PROFIL
  // =========================
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      const { data } = await axios.put(
        `${API}/users/me`,
        {
          name: formData.get('name'),
          bio: formData.get('bio'),
          department: formData.get('department'),
        },
        axiosConfig
      );

      setProfile(data);
      setEditSuccess(true);
      setTimeout(() => setEditSuccess(false), 3000);
      setActiveTab('posts');
      showMessage('✅ Profil mis à jour avec succès !', 'success');
    } catch (err) {
      showMessage('Erreur: ' + err.message, 'error');
    }
  };

  // =========================
  // UPLOAD AVATAR
  // =========================
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarLoading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);

      const { data } = await axios.put(`${API}/users/me/avatar`, fd, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      setProfile(data);
      showMessage('✅ Avatar mis à jour !', 'success');
    } catch (err) {
      showMessage('Erreur upload avatar: ' + err.message, 'error');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  const goToCreatePost = () => navigate('/create-post');

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  // =========================
  // PROFIL INTROUVABLE
  // =========================
  if (!profile) {
    return (
      <div className={styles.notFound}>Utilisateur introuvable</div>
    );
  }

  const color =
    COLORS[(profile.name?.charCodeAt(0) || 0) % COLORS.length];

  return (
    <main className={styles.profilePage}>
      {followMessage.show && (
        <div
          className={`${styles.notification} ${
            followMessage.type === 'error'
              ? styles.notificationError
              : styles.notificationSuccess
          }`}
        >
          {followMessage.text}
        </div>
      )}

      <section className={styles.profileCard}>
        <div className={styles.cover} style={{ background: color }} />

        <div className={styles.profileBody}>
          <div className={styles.profileTop}>
            <div className={styles.avatarWrapper}>
              <div
                className={styles.avatar}
                style={{
                  background: profile.avatar ? 'transparent' : color,
                }}
              >
                {profile.avatar ? (
                  <img src={`${BASE}${profile.avatar}`} alt="Avatar" />
                ) : (
                  profile.name?.[0]?.toUpperCase()
                )}
              </div>

              {isMe && (
                <label className={styles.avatarButton}>
                  {avatarLoading ? '⏳' : '📷'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                  />
                </label>
              )}
            </div>

            <div className={styles.profileAction}>
              {isMe ? (
                <button
                  className={styles.secondaryButton}
                  onClick={() => setActiveTab('edit')}
                >
                  ✏️ <span>Modifier le profil</span>
                </button>
              ) : (
                <button
                  className={
                    isFollowing ? styles.followingButton : styles.followButton
                  }
                  onClick={handleFollow}
                >
                  {isFollowing ? '✓ Suivi' : '+ Suivre'}
                </button>
              )}
            </div>
          </div>

          <div className={styles.profileInfo}>
            <h1>{profile.name}</h1>
            {profile.department && (
              <div className={styles.department}>🏢 {profile.department}</div>
            )}
            {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
          </div>

          <div className={styles.stats}>
            <button className={styles.stat} onClick={() => setActiveTab('posts')}>
              <strong>{posts.length}</strong>
              <span>Publications</span>
            </button>
            <button
              className={styles.stat}
              onClick={() => setActiveTab('followers')}
            >
              <strong>{profile.followers?.length || 0}</strong>
              <span>Abonnés</span>
            </button>
            <button
              className={styles.stat}
              onClick={() => setActiveTab('following')}
            >
              <strong>{profile.following?.length || 0}</strong>
              <span>Abonnements</span>
            </button>
          </div>
        </div>
      </section>

      <nav className={styles.tabs}>
        <button
          className={activeTab === 'posts' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('posts')}
        >
          📄 Publications <span>({posts.length})</span>
        </button>
        <button
          className={activeTab === 'followers' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('followers')}
        >
          👥 Abonnés <span>({profile.followers?.length || 0})</span>
        </button>
        <button
          className={activeTab === 'following' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('following')}
        >
          📌 Abonnements <span>({profile.following?.length || 0})</span>
        </button>
        {isMe && (
          <button
            className={activeTab === 'edit' ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab('edit')}
          >
            ✏️ Modifier
          </button>
        )}
      </nav>

      <section className={styles.contentCard}>
        {activeTab === 'posts' && (
          <div>
            {isMe && (
              <button
                className={styles.createPostButton}
                onClick={goToCreatePost}
              >
                ✏️ Créer une publication
              </button>
            )}
            <div className={styles.postsList}>
              {posts.length === 0 ? (
                <div className={styles.emptyState}>
                  <div>📭</div>
                  <p>Aucune publication</p>
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onDeleted={handlePostDeleted}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'followers' && (
          <UserList
            users={profile.followers}
            emptyMessage="Aucun abonné"
            navigate={navigate}
            me={me}
          />
        )}

        {activeTab === 'following' && (
          <UserList
            users={profile.following}
            emptyMessage="Aucun abonnement"
            navigate={navigate}
            me={me}
          />
        )}

        {activeTab === 'edit' && isMe && (
          <form onSubmit={handleUpdateProfile} className={styles.editForm}>
            {editSuccess && (
              <div className={styles.successMessage}>
                ✅ Profil mis à jour !
              </div>
            )}

            <div className={styles.formGroup}>
              <label>Nom</label>
              <input name="name" defaultValue={profile.name} required />
            </div>

            <div className={styles.formGroup}>
              <label>Département</label>
              <select name="department" defaultValue={profile.department || ''}>
                <option value="">Sélectionner un département</option>
                {DEPARTMENTS.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Biographie</label>
              <textarea
                name="bio"
                defaultValue={profile.bio}
                placeholder="Parlez-nous de vous..."
                rows="4"
              />
            </div>

            <button type="submit" className={styles.saveButton}>
              💾 Sauvegarder
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

/* =====================================================
   LISTE UTILISATEURS
===================================================== */
function UserList({ users, emptyMessage, navigate, me }) {
  if (!users || users.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div>👤</div>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={styles.userList}>
      {users.map((user, index) => {
        const avatarColor = COLORS[index % COLORS.length];

        // ✅ On navigue TOUJOURS avec un username (jamais "me")
        const targetUsername =
          user._id === me?._id
            ? me?.username || user.username
            : user.username || user._id;

        return (
          <button
            key={user._id}
            className={styles.userItem}
            onClick={() => navigate(`/profile/${targetUsername}`)}
          >
            <div
              className={styles.userAvatar}
              style={{ background: user.avatar ? 'transparent' : avatarColor }}
            >
              {user.avatar ? (
                <img src={`${BASE}${user.avatar}`} alt="" />
              ) : (
                user.name?.[0]?.toUpperCase()
              )}
            </div>

            <div className={styles.userInfo}>
              <strong>{user.name}</strong>
              {user.department && <span>{user.department}</span>}
            </div>

            <span className={styles.userArrow}>›</span>
          </button>
        );
      })}
    </div>
  );
}