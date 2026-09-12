import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import styles from './Directory.module.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const COLORS = [
  'linear-gradient(135deg,#4F8EF7,#A78BFA)',
  'linear-gradient(135deg,#34D399,#059669)',
  'linear-gradient(135deg,#F87171,#EC4899)',
  'linear-gradient(135deg,#FBBF24,#F59E0B)',
];

const DEPARTMENTS = ['Informatique', 'Marketing', 'RH', 'Finance', 'Direction', 'Design'];

export default function Directory() {
  const { user: me, token } = useAuth();
  const navigate = useNavigate();
 
  const [users, setUsers] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [followMessage, setFollowMessage] = useState({ show: false, text: '', type: '' });
  const [followingIds, setFollowingIds] = useState([]);

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };


  const getProfileIdentifier = (user)=> user?.username || user?._id
  const showMessage = (text, type = 'success') => {
    setFollowMessage({ show: true, text, type });
    setTimeout(() => setFollowMessage({ show: false, text: '', type: '' }), 3000);
  };


  // Récupérer tous les utilisateurs
  useEffect(() => {
    const fetchUsers = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const { data } = await axios.get(`${API}/users`, axiosConfig);
        setUsers(data);
       
        // Récupérer les IDs suivis par l'utilisateur courant
        const { data: meData } = await axios.get(`${API}/users/me`, axiosConfig);
        const followedIds = meData.following?.map(f => f._id || f) || [];
        setFollowingIds(followedIds);
       
        // Filtrer les suggestions (utilisateurs non suivis et pas moi-même)
        const suggestionsList = data.filter(user =>
          user._id !== me?._id && !followedIds.includes(user._id)
        ).slice(0, 5);
        setSuggestions(suggestionsList);
       
      } catch (error) {
        console.error("Erreur chargement users:", error);
      } finally {
        setLoading(false);
      }
    };
   
    fetchUsers();
  }, [token, me?._id]);

  // Follow / Unfollow
  const handleFollow = async (userId, userName) => {
    try {
      const { data } = await axios.post(`${API}/users/${userId}/follow`, {}, axiosConfig);
     
      if (data.following) {
        setFollowingIds(prev => [...prev, userId]);
        setSuggestions(prev => prev.filter(u => u._id !== userId));
        showMessage(`✅ Vous suivez maintenant ${userName}`, 'success');
      } else {
        setFollowingIds(prev => prev.filter(id => id !== userId));
        showMessage(`❌ Vous ne suivez plus ${userName}`, 'success');
      }
     
      // Mettre à jour la liste des utilisateurs
      setUsers(prev => prev.map(user =>
        user._id === userId
          ? { ...user, isFollowing: data.following }
          : user
      ));
     
    } catch (err) {
      console.error('Erreur follow:', err);
      showMessage(err.response?.data?.message || 'Erreur lors du follow', 'error');
    }
  };

  // Filtrer les utilisateurs
  const filteredUsers = users.filter(user => {
    if (user._id === me?._id) return false; // Ne pas afficher l'utilisateur courant
   
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.department?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !selectedDepartment || user.department === selectedDepartment;
   
    return matchesSearch && matchesDepartment;
  });

  if (loading) return (
    <div className={styles.loadingPage}>
      <div className={styles.spinner} />
    </div>
  );

  return (
    <div className={styles.directoryPage}>
     
      {/* Message de notification */}
      {followMessage.show && (
        <div className={`${styles.notification} ${
          followMessage.type === 'success' ? styles.notificationSuccess : styles.notificationError
        }`}>
          {followMessage.text}
        </div>
      )}

      {/* Section Suggestions */}
      {suggestions.length > 0 && (
        <section className={styles.suggestions}>
          <h3 className={styles.sectionTitle}>
            👥 Suggestions - Personnes à suivre
          </h3>

          <div className={styles.suggestionsGrid}>
            {suggestions.map(user => (
              <div key={user._id} className={styles.suggestionCard}>
                <div
                  className={styles.suggestionAvatar}
                  onClick={() => navigate(`/profile/${getProfileIdentifier(user)}`)}
                >
                  {user.name?.[0]?.toUpperCase()}
                </div>

                <div
                  className={styles.suggestionInfo}
                  onClick={() => navigate(`/profile/${getProfileIdentifier(user)}`)}
                >
                  <p className={styles.suggestionName}>{user.name}</p>

                  {user.department && (
                    <p className={styles.suggestionDepartment}>
                      🏢 {user.department}
                    </p>
                  )}
                </div>

                <button
                  className={styles.followSuggestionButton}
                  onClick={() => handleFollow(user._id, user.name)}
                >
                  Suivre
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Annuaire des membres */}
      <section className={styles.directoryCard}>
        {/* En-tête */}
        <div className={styles.directoryHeader}>
          <h2 className={styles.directoryTitle}>
            👥 Annuaire des membres
          </h2>
          <p className={styles.directoryCount}>
            {filteredUsers.length} membre{filteredUsers.length > 1 ? 's' : ''} trouvé{filteredUsers.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Filtres */}
        <div className={styles.filters}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="🔍 Rechercher par nom ou département..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className={styles.departmentSelect}
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            <option value="">Tous les départements</option>
            {DEPARTMENTS.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Liste des membres */}
        <div className={styles.membersContainer}>
          {filteredUsers.length === 0 ? (
            <div className={styles.emptyState}>
              Aucun membre trouvé
            </div>
          ) : (
            <div className={styles.membersGrid}>
              {filteredUsers.map((user, index) => (
                <article
                  key={user._id}
                  className={styles.memberCard}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div className={styles.memberHeader}>
                    <div
                      className={styles.memberAvatar}
                      style={{
                        background: COLORS[index % COLORS.length],
                      }}
                      onClick={() => navigate(`/profile/${getProfileIdentifier(user)}`)}
                    >
                      {user.name?.[0]?.toUpperCase()}
                    </div>

                    <div
                      className={styles.memberInfo}
                      onClick={() => navigate(`/profile/${getProfileIdentifier(user)}`)}
                    >
                      <h3 className={styles.memberName}>{user.name}</h3>

                      {user.department && (
                        <p className={styles.memberDepartment}>
                          🏢 {user.department}
                        </p>
                      )}
                    </div>
                  </div>

                  {user.bio && (
                    <p className={styles.memberBio}>
                      {user.bio.length > 80
                        ? user.bio.substring(0, 80) + '...'
                        : user.bio}
                    </p>
                  )}

                  <div className={styles.memberActions}>
                    <button
                      className={styles.profileButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/profile/${getProfileIdentifier(user)}`);
                      }}
                    >
                      Voir profil
                    </button>

                    <button
                      className={`${styles.followButton} ${
                        followingIds.includes(user._id) ? styles.following : ''
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFollow(user._id, user.name);
                      }}
                    >
                      {followingIds.includes(user._id) ? '✓ Suivi' : '+ Suivre'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}