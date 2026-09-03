import { useState, useEffect } from 'react';
import axios from 'axios';
import { can } from '../utils/Permissions';
import { useAuth } from '../context/AuthContext';
import { getAvatarUrl } from '../helpers/rooms';
import styles from '../Components/Css/AdminPanel.module.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

function AdminPanel() {
    const { user, token, loading: authLoading } = useAuth(); // ✅ Récupérer loading
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 🔍 Debug : Vérifier l'état
    console.log('🔍 AdminPanel - user:', user);
    console.log('🔍 AdminPanel - token:', token);
    console.log('🔍 AdminPanel - authLoading:', authLoading);
    console.log('🔍 AdminPanel - headers axios:', axios.defaults.headers.common['Authorization']);

    useEffect(() => {
        // ✅ Attendre que l'auth soit chargée
        if (authLoading) {
            console.log('⏳ Auth en cours de chargement...');
            return;
        }



        const fetchUsers = async () => {

            // ✅ Vérifier que user et token existent
            if (!user || !token) {
                console.log('❌ Pas d\'utilisateur ou de token');
                setLoading(false);
                setError('Vous devez être connecté');
                return;
            }
            try {
                setLoading(true);
                console.log('📡 Appel API avec token:', token);

                const response = await axios.get(`${API}/users`);
                console.log('✅ Réponse reçue:', response.data);
                const { data } = await axios.get(`${API}/users`);
                console.log("RÉPONSE BRUTE /api/users : ",Array.isArray(response.data))
                const list =  Array.isArray(response.data) ? data : (data.users || data.data || [])
                setUsers(list);
                setError(null);
            } catch (err) {
                console.error('❌ Erreur API:', err);
                console.error('❌ Response:', err.response);

                if (err.response?.status === 401) {
                    setError('Session expirée. Veuillez vous reconnecter.');
                    // ✅ Rediriger vers login
                    // window.location.href = '/login';
                } else {
                    setError(err.response?.data?.message || 'Impossible de charger les utilisateurs');
                }
                setUsers([]);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [user, token, authLoading]); // ✅ Dépendances

    // ✅ Si auth en cours de chargement
    if (authLoading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #e2e8f0',
                    borderTopColor: '#4F8EF7',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 16px'
                }} />
                <p>Chargement de la session...</p>
            </div>
        );
    }
      // ✅ Si pas connecté
    if (!user || !token) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <p style={{ color: '#ef4444' }}>⛔ Non autorisé - Veuillez vous reconnecter</p>
                <button 
                    onClick={() => window.location.href = '/login'}
                    style={{
                        marginTop: '16px',
                        padding: '8px 24px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#4F8EF7',
                        color: '#fff',
                        cursor: 'pointer'
                    }}
                >
                    Se connecter
                </button>
            </div>
        );
    }

    const handleRoleChange = async (userId, newRole) => {
        try {
            const response = await axios.put(`${API}/users/${userId}/role`, { role: newRole });
            setUsers(prev => prev.map(u => u._id === userId ? response.data : u));
        } catch (err) {
            alert(err.response?.data?.message || "Erreur lors du changement de rôle");
        }
    };

    const handleToggleActive = async (userId, currentStatus) => {
        try {
            const response = await axios.put(`${API}/users/${userId}/deactivate`, {
                isActive: !currentStatus
            });
            setUsers(prev => prev.map(u =>
                u._id === userId ? { ...u, isActive: response.data.isActive } : u
            ));
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la mise à jour');
        }
    };

    const handleDelete = async (userId, userName) => {
        if (!window.confirm(`Supprimer définitivement le compte de ${userName} ?`)) return;
        try {
            await axios.delete(`${API}/users/${userId}`);
            setUsers(prev => prev.filter(u => u._id !== userId));
        } catch (err) {
            alert(err.response?.data?.message || "Erreur lors de la suppression");
        }
    };

    if (loading) return <div className={styles.container}>⏳ Chargement...</div>;
    if (error) return <div className={styles.container}>❌ {error}</div>;

    return (
        <div className={styles.container}>
            <h1>👑 Administration — Gestion des utilisateurs</h1>
            <p>Connecté en tant que <strong>{user?.name}</strong> ({user?.role})</p>

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Utilisateur</th>
                        <th>Email</th>
                        <th>Rôle</th>
                        <th>Statut</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u._id}>
                            <td className={styles.userCell}>
                                <img src={getAvatarUrl(u.avatar)} alt={u.name} className={styles.avatarSmall} />
                                {u.name}
                            </td>
                            <td>{u.email}</td>
                            <td>
                                {can(user, 'users', 'changeRole') ? (
                                    <select
                                        value={u.role}
                                        disabled={u._id === user._id}
                                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                    >
                                        <option value="employe">Employé</option>
                                        <option value="manager">Manager</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                ) : (
                                    <span>{u.role}</span>
                                )}
                            </td>
                            <td>
                                <span className={u.isActive ? styles.statusActive : styles.statusInactive}>
                                    {u.isActive ? 'Actif' : 'Désactivé'}
                                </span>
                            </td>
                            <td className={styles.actions}>
                                {/* Bouton Désactiver / Réactiver */}
                                {can(user, 'users', 'deactivate') && (
                                    <button
                                        disabled={
                                            u._id === user._id ||                           // Ne pas se désactiver soi-même
                                            (user.role === 'manager' && u.role === 'admin') // Manager ne peut pas toucher aux admins
                                        }
                                        onClick={() => handleToggleActive(u._id, u.isActive)}
                                    >
                                        {u.isActive ? 'Désactiver' : 'Réactiver'}
                                    </button>
                                )}

                                {/* Bouton Supprimer */}
                                {can(user, 'users', 'delete') && (
                                    <button
                                        disabled={
                                            u._id === user._id ||                           // Ne pas se supprimer soi-même
                                            (user.role === 'manager' && u.role === 'admin') // Manager ne peut pas supprimer un admin
                                        }
                                        className={styles.deleteBtn}
                                        onClick={() => handleDelete(u._id, u.name)}
                                    >
                                        Supprimer
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

    );
}

export default AdminPanel;