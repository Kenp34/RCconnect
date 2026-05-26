import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSocket } from '../hooks/useSocket';
import styles from './Notification.module.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const TYPE_CONFIG = {
  like:    { icon: '💜', label: 'a aimé votre publication',   color: '#A78BFA' },
  comment: { icon: '💬', label: 'a commenté votre publication', color: '#4F8EF7' },
  follow:  { icon: '👤', label: 'vous suit maintenant',        color: '#34D399' },
  mention: { icon: '@',  label: 'vous a mentionné',            color: '#FBBF24' },
  message: { icon: '✉️', label: 'vous a envoyé un message',    color: '#F87171' },
};

const COLORS = [
  'linear-gradient(135deg,#4F8EF7,#A78BFA)',
  'linear-gradient(135deg,#34D399,#059669)',
  'linear-gradient(135deg,#F87171,#EC4899)',
  'linear-gradient(135deg,#FBBF24,#F59E0B)',
];

export default function Notifications() {
  const [notifs, setNotifs]   = useState([]);
  const [filter, setFilter]   = useState('tout');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Recevoir notifs temps réel via Socket
  useSocket(
    () => {},
    () => {},
    () => {},
    () => {},
    (notif) => setNotifs(prev => [notif, ...prev])
  );

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const { data } = await axios.get(`${API}/notifications`);
        setNotifs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifs();
  }, []);

  const markAllRead = async () => {
    await axios.put(`${API}/notifications/read`);
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotif = async (e, notifId) => {
    e.stopPropagation();
    await axios.delete(`${API}/notifications/${notifId}`);
    setNotifs(prev => prev.filter(n => n._id !== notifId));
  };

  const handleClick = (notif) => {
    if (!notif.read) {
      setNotifs(prev =>
        prev.map(n => n._id === notif._id ? { ...n, read: true } : n)
      );
    }
    if (notif.post) navigate(`/feed`);
    else if (notif.type === 'follow') navigate(`/profile/${notif.sender._id}`);
    else if (notif.type === 'message') navigate('/messages');
  };

  const filters = ['tout', 'like', 'comment', 'follow', 'message'];

  const filtered = filter === 'tout'
    ? notifs
    : notifs.filter(n => n.type === filter);

  const unread = notifs.filter(n => !n.read).length;

  return (
    <div className={styles.container}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Notifications</h1>
          {unread > 0 && (
            <span className={styles.unreadCount}>{unread}</span>
          )}
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className={styles.markAllBtn}>
            ✓ Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Filtres */}
      <div className={styles.filterBar}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`${styles.filterBtn}
                        ${filter === f ? styles.filterBtnActive : ''}`}>
            {f === 'tout'    ? '✦ Tout'
            : f === 'like'   ? '💜 Likes'
            : f === 'comment'? '💬 Commentaires'
            : f === 'follow' ? '👤 Abonnements'
            :                  '✉️ Messages'}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🔔</span>
          <p>Aucune notification</p>
          <small>Vos interactions apparaîtront ici</small>
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map((notif, i) => {
            const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.like;
            return (
              <div key={notif._id}
                onClick={() => handleClick(notif)}
                className={`${styles.notifItem}
                            ${!notif.read ? styles.unread : ''}`}>

                {/* Avatar + icône type */}
                <div className={styles.avatarWrapper}>
                  <div className={styles.avatar}
                    style={{ background: COLORS[i % COLORS.length] }}>
                    {notif.sender?.name?.[0]?.toUpperCase()}
                  </div>
                  <div className={styles.typeIcon}
                    style={{ background: config.color }}>
                    {config.icon}
                  </div>
                </div>

                {/* Contenu */}
                <div className={styles.content}>
                  <p className={styles.message}>
                    <strong>{notif.sender?.name}</strong>{' '}
                    {notif.message || config.label}
                  </p>
                  {notif.post?.content && (
                    <p className={styles.postPreview}>
                      "{notif.post.content.substring(0, 60)}
                      {notif.post.content.length > 60 ? '...' : ''}"
                    </p>
                  )}
                  <p className={styles.time}>
                    {new Date(notif.createdAt).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: 'short',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>

                {/* Indicateur non lu */}
                {!notif.read && (
                  <div className={styles.unreadDot} />
                )}

                {/* Supprimer */}
                <button
                  onClick={(e) => deleteNotif(e, notif._id)}
                  className={styles.deleteBtn}>
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}