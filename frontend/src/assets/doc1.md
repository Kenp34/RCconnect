Voici la version **complète et corrigée** de `GroupChat.jsx` avec la fonctionnalité **Reply** entièrement intégrée :

---  

New-NetFirewallRule -DisplayName "RCconnect Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "RCconnect Backend" -Direction Inbound -LocalPort 5001 -Protocol TCP -Action Allow

## 📄 frontend/src/pages/GroupChat.jsx (COMPLET AVEC REPLY)

```jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import ConfirmModal from '../components/ConfirmModal';
import styles from './GroupChat.module.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const COLORS = [
  'linear-gradient(135deg, #4F8EF7, #A78BFA)',
  'linear-gradient(135deg, #34D399, #059669)',
  'linear-gradient(135deg, #F87171, #EC4899)',
  'linear-gradient(135deg, #FBBF24, #F59E0B)',
  'linear-gradient(135deg, #06B6D4, #3B82F6)',
  'linear-gradient(135deg, #8B5CF6, #EC4899)',
];

export default function GroupChat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [sending, setSending] = useState(false);
  const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false);
  const [kickModal, setKickModal] = useState({ open: false, memberId: null, memberName: '' });
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [editModal, setEditModal] = useState({ open: false, messageId: null, content: '' });
  const [deleteModal, setDeleteModal] = useState({ open: false, messageId: null });

  // ✅ État pour le REPLY
  const [replyingTo, setReplyingTo] = useState(null);

  const { joinGroupRoom, leaveGroupRoom, sendTypingGroup, registerCallbacks } = useSocket();

  // Scroll automatique
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ✅ Callbacks socket
  useEffect(() => {
    registerCallbacks({
      onNewGroupMessage: (msg) => {
        if (String(msg.sender?._id) === String(user._id)) return;
        if (String(msg.group) === id || String(msg.group?._id) === id) {
          setMessages(prev => {
            return prev.some(m => m._id === msg._id) ? prev : [...prev, msg];
          });
        }
      },
      onGroupMessageEdited: ({ messageId, content, editedAt }) => {
        setMessages(prev => prev.map(m =>
          m._id === messageId ? { ...m, content, edited: true, editedAt } : m
        ));
      },
      onGroupMessageDeleted: ({ messageId }) => {
        setMessages(prev => prev.map(m =>
          m._id === messageId ? { ...m, deleted: true, content: '[Message supprimé]' } : m
        ));
      },
      onTypingGroup: (userId, userName, isTyping) => {
        if (userId === user._id) return;
        setTypingUsers(prev => {
          if (isTyping) {
            if (prev.find(t => t.id === userId)) return prev;
            return [...prev, { id: userId, name: userName }];
          }
          return prev.filter(t => t.id !== userId);
        });
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(t => t.id !== userId));
        }, 2000);
      },
    });
  }, [id, user._id, registerCallbacks]);

  // Charger groupe et messages
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: groupData } = await axios.get(`${API}/groups/${id}`);
        setGroup(groupData);
        setIsMember(groupData.isMember);
        setIsAdmin(groupData.isAdmin);
        setMembers(groupData.members || []);

        if (groupData.isMember) {
          const { data: messagesData } = await axios.get(`${API}/groups/${id}/messages`);
          setMessages(messagesData);
          joinGroupRoom(id);
        }
      } catch (err) {
        console.error(err);
        if (err.response?.status === 404) navigate('/groups');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      leaveGroupRoom(id);
    };
  }, [id, navigate, joinGroupRoom, leaveGroupRoom]);

  // =========================
  // ENVOI DE MESSAGE AVEC REPLY
  // =========================
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !isMember || sending) return;

    const content = input.trim();
    const replyToId = replyingTo?._id || null;

    setInput('');
    setSending(true);
    sendTypingGroup(id, false);

    // ✅ Message temporaire avec replyTo
    const tempMsg = {
      _id: Date.now(),
      content,
      sender: { _id: user._id, name: user.name, avatar: user.avatar },
      createdAt: new Date().toISOString(),
      isTemp: true,
      replyTo: replyingTo || null
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const { data } = await axios.post(`${API}/groups/${id}/messages`, {
        content,
        replyTo: replyToId
      });
      setMessages(prev => prev.map(m => m._id === tempMsg._id ? data : m));

      // ✅ Réinitialiser le reply après envoi réussi
      setReplyingTo(null);
    } catch (err) {
      setMessages(prev => prev.filter(m => m._id !== tempMsg._id));
      alert(err.response?.data?.message || 'Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  // Indicateur de frappe
  const handleTyping = (e) => {
    setInput(e.target.value);
    sendTypingGroup(id, true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingGroup(id, false);
    }, 1500);
  };

  // =========================
  // GESTION DES MESSAGES
  // =========================

  const handleEdit = (messageId, oldContent) => {
    setEditModal({ open: true, messageId, content: oldContent });
  };

  const handleEditSubmit = async () => {
    const { messageId, content } = editModal;
    if (!content || !content.trim()) return;

    const newContent = content.trim();
    const oldMessage = messages.find(m => m._id === messageId);

    setMessages(prev => prev.map(m =>
      m._id === messageId
        ? { ...m, content: newContent, edited: true, editedAt: new Date().toISOString(), isUpdating: true }
        : m
    ));
    setEditModal({ open: false, messageId: null, content: '' });

    try {
      await axios.put(`${API}/groups/${id}/messages/${messageId}`, { content: newContent });
      setMessages(prev => prev.map(m =>
        m._id === messageId ? { ...m, isUpdating: false } : m
      ));
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m._id === messageId
          ? { ...m, content: oldMessage?.content, edited: false, isUpdating: false }
          : m
      ));
      alert(err.response?.data?.message || 'Erreur lors de la modification');
    }
  };

  const handleDeleteClick = (messageId) => {
    setDeleteModal({ open: true, messageId });
  };

  const handleDeleteConfirm = async () => {
    const { messageId } = deleteModal;
    const oldMessage = messages.find(m => m._id === messageId);

    setMessages(prev => prev.map(m =>
      m._id === messageId
        ? { ...m, deleted: true, content: '[Message supprimé]', isDeleting: true }
        : m
    ));
    setDeleteModal({ open: false, messageId: null });

    try {
      await axios.delete(`${API}/groups/${id}/messages/${messageId}`);
      setMessages(prev => prev.map(m =>
        m._id === messageId ? { ...m, isDeleting: false } : m
      ));
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m._id === messageId
          ? { ...m, deleted: false, content: oldMessage?.content, isDeleting: false }
          : m
      ));
      alert(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  // =========================
  // GESTION DU GROUPE
  // =========================

  const handleJoin = async () => {
    try {
      await axios.post(`${API}/groups/${id}/join`);
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  const handleKick = (memberId, memberName) => {
    setKickModal({ open: true, memberId, memberName });
  };

  const confirmKick = async (memberId) => {
    try {
      await axios.delete(`${API}/groups/${id}/members/${memberId}`);
      setMembers(prev => prev.filter(m => (m.user?._id || m.user) !== memberId));
      setKickModal({ open: false, memberId: null, memberName: '' });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Erreur lors de l'exclusion");
    }
  };

  const handleDeleteGroup = async () => {
    try {
      await axios.delete(`${API}/groups/${id}`);
      navigate('/groups');
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de la suppression du groupe");
    } finally {
      setShowDeleteGroupModal(false);
    }
  };

  // =========================
  // UTILITAIRES
  // =========================

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'À l\'instant';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const getGroupColor = (name) => {
    return COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];
  };

  // =========================
  // RENDU
  // =========================

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Chargement du groupe...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className={styles.notFound}>
        <span>😕</span>
        <p>Groupe introuvable</p>
        <button onClick={() => navigate('/groups')}>Retour aux groupes</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/groups')}>
          ←
        </button>

        <div className={styles.headerInfo}>
          <h2>{group.name}</h2>
          <div className={styles.headerStats}>
            <span>👥 {members.length} membre{members.length > 1 ? 's' : ''}</span>
            {group.isPrivate && <span className={styles.privateBadge}>🔒 Privé</span>}
          </div>
        </div>

        {isAdmin && (
          <button
            className={styles.deleteBtn}
            title="Supprimer le groupe"
            onClick={() => setShowDeleteGroupModal(true)}
          >
            🗑️
          </button>
        )}

        <button
          className={`${styles.membersBtn} ${showMembers ? styles.active : ''}`}
          onClick={() => setShowMembers(!showMembers)}
        >
          👥
        </button>
      </div>

      {/* Main content */}
      <div className={styles.main}>
        <div className={styles.chatArea}>
          {!isMember ? (
            <div className={styles.locked}>
              <div className={styles.lockedIcon}>🔒</div>
              <h3>Groupe privé</h3>
              <p>Rejoignez ce groupe pour voir les messages et participer à la discussion</p>
              <button onClick={handleJoin} className={styles.joinBtn}>
                + Rejoindre le groupe
              </button>
            </div>
          ) : (
            <>
              <div className={styles.messages}>
                {messages.length === 0 ? (
                  <div className={styles.emptyMessages}>
                    <span>💬</span>
                    <p>Aucun message pour le moment</p>
                    <small>Soyez le premier à envoyer un message !</small>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.sender?._id === user._id;
                    const senderName = msg.sender?.name || 'Membre';
                    const senderColor = getGroupColor(senderName);

                    if (msg.deleted) {
                      return (
                        <div key={msg._id} className={styles.deletedMessage}>
                          <em>🗑️ Message supprimé</em>
                          {msg.isDeleting && <span className={styles.syncing}> 🔄</span>}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg._id}
                        className={`${styles.message} ${isOwn ? styles.own : styles.other}`}
                      >
                        {!isOwn && (
                          <div className={styles.avatar} style={{ background: senderColor }}>
                            {senderName[0]?.toUpperCase()}
                          </div>
                        )}
                        <div className={styles.messageContent}>
                          {!isOwn && (
                            <div className={styles.sender}>
                              {senderName}
                              {msg.sender?.department && (
                                <span className={styles.department}> · {msg.sender.department}</span>
                              )}
                            </div>
                          )}

                          {/* ✅ AFFICHAGE DU MESSAGE CITÉ (REPLY) */}
                          {msg.replyTo && !msg.replyTo.deleted && (
                            <div
                              className={styles.replyPreview}
                              onClick={() => {
                                const el = document.getElementById(`msg-${msg.replyTo._id}`);
                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }}
                            >
                              <span className={styles.replyAuthor}>
                                {msg.replyTo.sender?.name || 'Utilisateur inconnu'}
                              </span>
                              <p className={styles.replyContent}>
                                {msg.replyTo.content?.substring(0, 80)}
                                {msg.replyTo.content?.length > 80 ? '...' : ''}
                              </p>
                            </div>
                          )}

                          {msg.replyTo?.deleted && (
                            <div className={styles.replyPreviewDeleted}>
                              <span>🗑️ Message cité supprimé</span>
                            </div>
                          )}

                          <div className={`${styles.bubble} ${isOwn ? styles.bubbleOwn : styles.bubbleOther}`}>
                            {msg.content}
                            {msg.edited && <span className={styles.edited}> (modifié)</span>}
                            {msg.isUpdating && <span className={styles.syncing}> ✎</span>}
                          </div>

                          <div className={styles.meta}>
                            <span className={styles.time}>{formatTime(msg.createdAt)}</span>

                            {/* ✅ MENU D'ACTIONS AVEC REPLY */}
                            <div className={styles.actions}>
                              {/* ✅ Bouton Répondre - disponible pour TOUS */}
                              <button
                                onClick={() => setReplyingTo(msg)}
                                className={styles.replyBtn}
                                title="Répondre à ce message"
                              >
                                ↩️
                              </button>

                              {isOwn && (
                                <>
                                  <button onClick={() => handleEdit(msg._id, msg.content)}>✏️</button>
                                  <button onClick={() => handleDeleteClick(msg._id)}>🗑️</button>
                                </>
                              )}
                              {!isOwn && isAdmin && (
                                <button className={styles.adminDelete} onClick={() => handleDeleteClick(msg._id)}>
                                  🗑️
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {typingUsers.length > 0 && (
                  <div className={styles.typingIndicator}>
                    <div className={styles.typingBubble}>
                      <span></span><span></span><span></span>
                    </div>
                    <p>
                      {typingUsers.map(t => t.name).join(', ')}
                      {typingUsers.length > 1 ? ' écrivent' : ' écrit'}...
                    </p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* ========================= */}
              {/* FORMULAIRE D'ENVOI AVEC REPLY */}
              {/* ========================= */}
              <form onSubmit={handleSend} className={styles.inputForm}>
                {/* ✅ BANDEAU DE RÉPONSE */}
                {replyingTo && (
                  <div className={styles.replyBanner}>
                    <div className={styles.replyBannerContent}>
                      <span className={styles.replyBannerAuthor}>
                        ↩️ En réponse à {replyingTo.sender?.name}
                      </span>
                      <p className={styles.replyBannerText}>
                        {replyingTo.content?.substring(0, 80)}
                        {replyingTo.content?.length > 80 ? '...' : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      className={styles.replyCancelBtn}
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className={styles.inputRow}>
                  <input
                    type="text"
                    value={input}
                    onChange={handleTyping}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                    placeholder={
                      replyingTo
                        ? `Répondre à ${replyingTo.sender?.name}...`
                        : 'Écrivez un message... (Entrée pour envoyer)'
                    }
                    className={styles.input}
                  />
                  <button type="submit" disabled={!input.trim() || sending} className={styles.sendBtn}>
                    {sending ? '...' : '→'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Membres Panel */}
        {showMembers && (
          <div className={styles.membersPanel}>
            <div className={styles.membersHeader}>
              <h3>Membres ({members.length})</h3>
              <button onClick={() => setShowMembers(false)} className={styles.closePanel}>✕</button>
            </div>
            <div className={styles.membersList}>
              {members.map((m, idx) => {
                const memberId = m.user?._id || m.user;
                const memberName = m.user?.name || 'Membre';
                const memberDept = m.user?.department || '';
                const isMe = memberId === user._id;
                const memberColor = getGroupColor(memberName);

                return (
                  <div key={memberId || idx} className={styles.memberItem}>
                    <div className={styles.memberAvatar} style={{ background: memberColor }}>
                      {memberName[0]?.toUpperCase()}
                    </div>
                    <div className={styles.memberInfo}>
                      <div className={styles.memberName}>
                        {memberName}
                        {isMe && <span className={styles.youTag}> (Vous)</span>}
                      </div>
                      {memberDept && <div className={styles.memberDept}>{memberDept}</div>}
                    </div>
                    <div className={styles.memberBadges}>
                      {m.role === 'admin' && <span className={styles.adminBadge}>Admin</span>}
                      {isAdmin && !isMe && m.role !== 'admin' && (
                        <button onClick={() => handleKick(memberId, memberName)} className={styles.kickBtn}>
                          Exclure
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* MODALE D'ÉDITION */}
      {editModal.open && (
        <div className={styles.modalOverlay} onClick={() => setEditModal({ open: false, messageId: null, content: '' })}>
          <div className={styles.editModal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>✏️ Modifier le message</h3>
              <button onClick={() => setEditModal({ open: false, messageId: null, content: '' })} className={styles.closeModal}>✕</button>
            </div>
            <textarea
              value={editModal.content}
              onChange={e => setEditModal(prev => ({ ...prev, content: e.target.value }))}
              className={styles.modalTextarea}
              rows={4}
              autoFocus
            />
            <div className={styles.modalFooter}>
              <button onClick={() => setEditModal({ open: false, messageId: null, content: '' })} className={styles.cancelModalBtn}>
                Annuler
              </button>
              <button onClick={handleEditSubmit} className={styles.submitModalBtn}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE DE CONFIRMATION SUPPRESSION MESSAGE */}
      {deleteModal.open && (
        <div className={styles.modalOverlay} onClick={() => setDeleteModal({ open: false, messageId: null })}>
          <div className={styles.deleteModal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalIcon}>🗑️</div>
            <h3>Supprimer ce message ?</h3>
            <p>Cette action est irréversible.</p>
            <div className={styles.modalFooter}>
              <button onClick={() => setDeleteModal({ open: false, messageId: null })} className={styles.cancelModalBtn}>
                Annuler
              </button>
              <button onClick={handleDeleteConfirm} className={styles.deleteModalBtn}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE DE CONFIRMATION EXCLUSION MEMBRE */}
      {kickModal.open && (
        <div
          className={styles.modalOverlay}
          onClick={() => setKickModal({ open: false, memberId: null, memberName: '' })}
        >
          <div className={styles.deleteModal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalIcon}>🚫</div>
            <h3>Exclure le membre</h3>
            <p>
              Voulez-vous vraiment exclure <strong>{kickModal.memberName}</strong> du groupe ?
            </p>
            <p style={{ color: '#ef4444', fontSize: '0.9rem', marginTop: '4px' }}>
              Cette action est irréversible.
            </p>
            <div className={styles.modalFooter}>
              <button
                onClick={() => setKickModal({ open: false, memberId: null, memberName: '' })}
                className={styles.cancelModalBtn}
              >
                Annuler
              </button>
              <button
                onClick={() => confirmKick(kickModal.memberId)}
                className={styles.dangerModalBtn}
              >
                Exclure
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE DE CONFIRMATION SUPPRESSION GROUPE */}
      <ConfirmModal
        isOpen={showDeleteGroupModal}
        title="Supprimer le groupe"
        message={`Êtes-vous sûr de vouloir supprimer définitivement "${group.name}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        danger
        onConfirm={handleDeleteGroup}
        onCancel={() => setShowDeleteGroupModal(false)}
      />
    </div>
  );
}
```

---

## 📄 CSS À AJOUTER dans `GroupChat.module.css`

```css
/* ============================================
   REPLY PREVIEW (dans le message)
   ============================================ */

.replyPreview {
  background: rgba(79, 142, 247, 0.08);
  border-left: 3px solid #4F8EF7;
  border-radius: 8px;
  padding: 6px 12px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: background 0.2s;
  max-width: 100%;
}

.replyPreview:hover {
  background: rgba(79, 142, 247, 0.15);
}

.replyAuthor {
  font-size: 11px;
  font-weight: 600;
  color: #4F8EF7;
}

.replyContent {
  font-size: 12px;
  color: #94A3B8;
  margin: 2px 0 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.replyPreviewDeleted {
  background: rgba(248, 113, 113, 0.08);
  border-left: 3px solid #F87171;
  border-radius: 8px;
  padding: 6px 12px;
  margin-bottom: 6px;
  font-size: 12px;
  color: #94A3B8;
}

/* ============================================
   REPLY BANNER (dans l'input)
   ============================================ */

.replyBanner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #1E2336;
  border-left: 3px solid #4F8EF7;
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 8px;
  width: 100%;
  box-sizing: border-box;
}

.replyBannerContent {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.replyBannerAuthor {
  font-size: 11px;
  font-weight: 600;
  color: #4F8EF7;
}

.replyBannerText {
  font-size: 12px;
  color: #94A3B8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}

.replyCancelBtn {
  background: transparent;
  border: none;
  color: #64748B;
  cursor: pointer;
  font-size: 14px;
  padding: 4px;
  flex-shrink: 0;
}

.replyCancelBtn:hover {
  color: #F87171;
}

/* ============================================
   BOUTON RÉPONDRE
   ============================================ */

.replyBtn {
  background: transparent;
  border: none;
  color: #64748B;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.2s;
}

.replyBtn:hover {
  background: rgba(79, 142, 247, 0.15);
  color: #4F8EF7;
}

/* ============================================
   INPUT ROW
   ============================================ */

.inputRow {
  display: flex;
  gap: 10px;
  align-items: center;
}

.input {
  flex: 1;
  background: #1E2336;
  border: 1px solid #2A2F45;
  border-radius: 28px;
  padding: 10px 18px;
  color: #E2E8F0;
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
}

.input:focus {
  border-color: #4F8EF7;
  box-shadow: 0 0 0 2px rgba(79, 142, 247, 0.2);
}

.input::placeholder {
  color: #64748B;
}
```

---

## Récapitulatif des modifications pour le Reply

| Fichier | Modification |
|---------|--------------|
| `GroupChat.jsx` | ✅ Ajout de `replyingTo` state |
| `GroupChat.jsx` | ✅ Modification de `handleSend` pour envoyer `replyTo` |
| `GroupChat.jsx` | ✅ Affichage du message cité (`replyPreview`) |
| `GroupChat.jsx` | ✅ Bouton `↩️ Répondre` dans les actions du message |
| `GroupChat.jsx` | ✅ Bandeau de réponse dans l'input |
| `GroupChat.jsx` | ✅ Annulation de la réponse avec bouton ✕ |
| `GroupChat.module.css` | ✅ Styles pour `replyPreview`, `replyBanner`, etc. |