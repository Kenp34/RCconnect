import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import GroupCard from '../components//Group/GroupCard';
import CreateGroupModal from '../Components/Group/CreateGroupModal.jsx';
import styles from './Group.module.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function Groups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  // Charger les groupes
  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      try {
        if (activeTab === 'my') {
          const res = await axios.get(`${API}/groups?type=my`);
          setMyGroups(res.data);
        } else {
          const url = search ? `${API}/groups?search=${search}` : `${API}/groups`;
          const res = await axios.get(url);
          setGroups(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, [activeTab, search]);

  const handleJoin = async (groupId) => {
    try {
      await axios.post(`${API}/groups/${groupId}/join`);
      // Recharger
      if (activeTab === 'my') {
        const res = await axios.get(`${API}/groups?type=my`);
        setMyGroups(res.data);
      } else {
        const res = await axios.get(`${API}/groups`);
        setGroups(res.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  const handleLeave = async (groupId) => {
    if (!confirm('Quitter ce groupe ?')) return;
    try {
      await axios.post(`${API}/groups/${groupId}/leave`);
      if (activeTab === 'my') {
        const res = await axios.get(`${API}/groups?type=my`);
        setMyGroups(res.data);
      } else {
        const res = await axios.get(`${API}/groups`);
        setGroups(res.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  const displayGroups = activeTab === 'my' ? myGroups : groups;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Groupes</h1>
        <button className={styles.createBtn} onClick={() => setShowModal(true)}>+ Créer</button>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`} onClick={() => { setActiveTab('all'); setSearch(''); }}>Tous</button>
        <button className={`${styles.tab} ${activeTab === 'my' ? styles.active : ''}`} onClick={() => setActiveTab('my')}>Mes groupes</button>
      </div>

      {activeTab === 'all' && (
        <input type="text" className={styles.search} placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
      )}

      {loading ? (
        <div className={styles.loading}>Chargement...</div>
      ) : displayGroups.length === 0 ? (
        <div className={styles.empty}>Aucun groupe</div>
      ) : (
        <div className={styles.grid}>
          {displayGroups.map(g => <GroupCard key={g._id} group={g} currentUser={user} onJoin={handleJoin} onLeave={handleLeave} />)}
        </div>
      )}

      {showModal && <CreateGroupModal onClose={() => setShowModal(false)} onCreated={() => window.location.reload()} />}
    </div>
  );
}