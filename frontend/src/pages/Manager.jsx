import { useState, useEffect } from 'react';
import axios from 'axios';
import { can } from '../utils/Permissions'
import { useAuth } from '../context/AuthContext';
import { getAvatarUrl } from '../helpers/rooms';
import styles from '../Components/Css/Manager.module.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

function Manage() {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {

        const fetchUsers = async () => {
            try {
                const { data } = await axios.get(`${API}/users`);
                console.log("RÉPONSE BRUTE /api/users : ", { data })
                const list = Array.isArray(data) ? data : (data.users || data.data || [])
                setUsers(list);
            } catch (err) {
                setError(err, " : Impossible de charger la liste des utilisateurs");
                setUsers([])
            } finally {
                setLoading(false);
            }
        }
        fetchUsers()

    }, []);



    const handleRoleChange = async (userId, newRole) => {
        try {
            const { data } = await axios.put(`${API}/users/${userId}/role`, { role: newRole });
            setUsers(prev => prev.map(u => u._id === userId ? data : u));
        } catch (err) {
            alert(err.response?.data?.message || "Erreur lors du changement de rôle");
        }
    };

    const handleToggleActive = async (userId, currentStatus) => {
        try {
            const { data } = await axios.put(`${API}/users/${userId}/deactivate`, {
                isActive: !currentStatus
            });
            setUsers(prev => prev.map(u => u._id === userId ? data : u));
        } catch (err) {
            alert(err.response?.data?.message || "Erreur lors de la mise à jour");
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

    if (loading) return <div className={styles.container}>Chargement...</div>;
    if (error) return <div className={styles.container}>{error}</div>;

    return (
        <div className={styles.container}>
            <h1>Administration — Gestion des utilisateurs</h1>
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

export default Manage;