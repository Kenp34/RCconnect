import { useEffect,useState,useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const COLORS = [
  'linear-gradient(135deg,#4F8EF7,#A78BFA)',
  'linear-gradient(135deg,#34D399,#059669)',
  'linear-gradient(135deg,#F87171,#EC4899)',
  'linear-gradient(135deg,#FBBF24,#F59E0B)',
];

const DEPARTMENTS = ['Tous', 'Informatique', 'Marketing', 'RH', 'Finance', 'Direction', 'Design'];

export default function Directory() {
  const { token, user: me } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('Tous');
  const [followStatus, setFollowStatus] = useState({});

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  // ✅ 1er useEffect : Charger les utilisateurs
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API}/users`, axiosConfig);
        const filteredData=data.filter(user=>user._id!==me?._id);
        setUsers(filteredData);
       
        // Initialiser le statut de follow
        const status = {};
        data.forEach(user => {
          status[user._id] = false;
        });
        setFollowStatus(status);
      } catch (err) {
        console.error("Erreur chargement utilisateurs:", err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchUsers();
    }
  }, [token]);

 
 const filteredUsers= useMemo(() => {
    if (users.length === 0) return;
   
    let filtered = [...users];
   
    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
   
    // Filtre par département
    if (selectedDepartment !== 'Tous') {
      filtered = filtered.filter(user =>
        user.department === selectedDepartment
      );
    }
   
    return filtered;
  }, [searchTerm, selectedDepartment, users]); // ✅ Dépendances correctes

  const handleFollow = async (userId, userName) => {
    try {
      const { data } = await axios.post(`${API}/users/${userId}/follow`, {}, axiosConfig);
     
      setFollowStatus(prev => ({
        ...prev,
        [userId]: data.following
      }));
     
      // ✅ Optionnel: Mettre à jour la liste filtrée aussi
      if (!data.following) {
        // Si on unfollow, on pourrait refresh ou juste garder l'état
      }
     
      alert(data.following ? `✅ Vous suivez maintenant ${userName}` : `❌ Vous ne suivez plus ${userName}`);
    } catch (err) {
      console.error('Erreur follow:', err);
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
      <div style={{
        width: '48px', height: '48px',
        border: '4px solid #2A2F45',
        borderTopColor: '#4F8EF7',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
     
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ color: '#E2E8F0', fontSize: '28px', marginBottom: '8px' }}>
          👥 Annuaire des membres
        </h1>
        <p style={{ color: '#64748B' }}>
          {filteredUsers.length} membres trouvés
        </p>
      </div>

      <div style={{
        background: '#181C27', border: '1px solid #2A2F45',
        borderRadius: '16px', padding: '20px',
        marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="🔍 Rechercher un membre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 2,
              padding: '12px 16px',
              background: '#1E2336',
              border: '1px solid #2A2F45',
              borderRadius: '12px',
              color: '#E2E8F0',
              fontSize: '14px',
              outline: 'none',
            }}
          />
         
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: '#1E2336',
              border: '1px solid #2A2F45',
              borderRadius: '12px',
              color: '#E2E8F0',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            {DEPARTMENTS.map(dept => (
              <option key={dept} value={dept}>{dept === 'Tous' ? '📌 Tous les départements' : `🏢 ${dept}`}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{
        background: '#181C27', border: '1px solid #2A2F45',
        borderRadius: '16px', overflow: 'hidden',
      }}>
        {filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748B' }}>
            Aucun membre trouvé
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredUsers.map((user, index) => {
              const color = COLORS[(user.name?.charCodeAt(0) || 0) % COLORS.length];
              const isFollowing = followStatus[user._id];
             
              return (
                <div
                  key={user._id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '16px 20px',
                    borderBottom: index < filteredUsers.length - 1 ? '1px solid #2A2F45' : 'none',
                    transition: 'background 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1E2336'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div
                    onClick={() => navigate(`/profile/${user._id}`)}
                    style={{
                      width: '56px', height: '56px', borderRadius: '50%',
                      background: user.avatar ? 'transparent' : color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '24px', fontWeight: 'bold', color: 'white',
                      overflow: 'hidden',
                    }}
                  >
                    {user.avatar ? (
                      <img src={`${API.replace('/api', '')}${user.avatar}`} alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      user.name?.[0]?.toUpperCase()
                    )}
                  </div>
                 
                  <div style={{ flex: 1 }} onClick={() => navigate(`/profile/${user._id}`)}>
                    <h3 style={{ color: '#E2E8F0', fontSize: '16px', fontWeight: '600', margin: 0 }}>
                      {user.name}
                    </h3>
                    {user.department && (
                      <p style={{ color: '#4F8EF7', fontSize: '13px', margin: '4px 0 0' }}>
                        🏢 {user.department}
                      </p>
                    )}
                    {user.bio && (
                      <p style={{ color: '#64748B', fontSize: '12px', margin: '4px 0 0' }}>
                        {user.bio.substring(0, 60)}...
                      </p>
                    )}
                  </div>
                 
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFollow(user._id, user.name);
                    }}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '25px',
                      border: 'none',
                      background: isFollowing ? '#1E2336' : 'linear-gradient(135deg,#4F8EF7,#A78BFA)',
                      color: isFollowing ? '#64748B' : 'white',
                      fontWeight: '600',
                      fontSize: '13px',
                      cursor: 'pointer',
                      Border: isFollowing ? '1px solid #2A2F45' : 'none',
                      transition: 'transform 0.2s',
                    }}
                    onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                  >
                    {isFollowing ? '✓ Suivi' : '+ Suivre'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}