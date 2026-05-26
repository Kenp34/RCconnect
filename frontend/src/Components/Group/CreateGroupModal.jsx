import { useState } from 'react';
import axios from 'axios';
import styles from './CreateGroupModal.module.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function CreateGroupModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const fd = new FormData();
    fd.append('name', name);
    fd.append('description', description);
    fd.append('isPrivate', isPrivate);
    if (avatar) fd.append('avatar', avatar);
    try {
      await axios.post(`${API}/groups`, fd);
      onCreated();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h2>Créer un groupe</h2>
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Nom *" value={name} onChange={e => setName(e.target.value)} required />
          <textarea placeholder="Description" rows="3" value={description} onChange={e => setDescription(e.target.value)} />
          <label><input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} /> Groupe privé</label>
          <input type="file" accept="image/*" onChange={e => setAvatar(e.target.files[0])} />
          <div className={styles.buttons}>
            <button type="button" onClick={onClose}>Annuler</button>
            <button type="submit" disabled={loading}>{loading ? '...' : 'Créer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}