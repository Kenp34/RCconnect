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
  const { identifier } = useParams(); // ✅ username OU _id (depuis l'URL)
  const navigate = useNavigate();
  const { user } = useAuth();

  const [group, setGroup] = useState(null);
  const [groupId, setGroupId] = useState(null); // ✅ _id réel du groupe
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
  const [replyingTo, setReplyingTo] = useState(null);

  const { joinGroupRoom, leaveGroupRoom, sendTypingGroup, registerCallbacks } = useSocket();

  // Scroll automatique
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ✅ Callbacks socket (on utilise groupId si dispo, sinon identifier)
  useEffect(() => {
    const roomKey = groupId || identifier;

    registerCallbacks({
      onNewGroupMessage: (msg) => {
        if (String(msg.sender?._id) === String(user._id)) return;
        if (
          String(msg.group) === roomKey ||
          String(msg.group?._id) === roomKey ||
          String(msg.group?._id) === groupId
        ) {
          setMessages((prev) => {
            return prev.some((m) => m._id === msg._id) ? prev : [...prev, msg];
          });
        }
      },
      onGroupMessageEdited: ({ messageId, content, editedAt }) => {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === messageId ? { ...m, content, edited: true, editedAt } : m
          )
        );
      },
      onGroupMessageDeleted: ({ messageId }) => {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === messageId ? { ...m, deleted: true, content: '[Message supprimé]' } : m
          )
        );
      },
      onTypingGroup: (userId, userName, isTyping) => {
        if (userId === user._id) return;
        setTypingUsers((prev) => {
          if (isTyping) {
            if (prev.find((t) => t.id === userId)) return prev;
            return [...prev, { id: userId, name: userName }];
          }
          return prev.filter((t) => t.id !== userId);
        });
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((t) => t.id !== userId));
        }, 2000);
      },
    });
  }, [identifier, groupId, user._id, registerCallbacks]);

  // =========================
  // CHARGEMENT GROUPE ET MESSAGES
  // =========================
  useEffect(() => {
    

    let cancelled = false;

    const fetchData = async () => {
      try {
        let realGroupId = identifier;

        // ✅ Étape 1 : si l'URL contient un username (pas un ObjectId),
        // on récupère l'_id via la nouvelle route /by-username/:username
        const isObjectId = /^[a-fA-F0-9]{24}$/.test(identifier);

        if (!isObjectId) {
          const { data: found } = await axios.get(
            `${API}/groups/by-username/${identifier}`
          );
          realGroupId = found._id;
        }

        // ✅ Étape 2 : on charge le groupe par son _id réel
        const { data: groupData } = await axios.get(`${API}/groups/${realGroupId}`);
        if (cancelled) return;

        setGroup(groupData);
        setGroupId(groupData._id); // ✅ on mémorise l'_id réel
        setIsMember(groupData.isMember);
        setIsAdmin(groupData.isAdmin);
        setMembers(groupData.members || []);

        // ✅ Étape 3 : on charge les messages avec l'_id
        if (groupData.isMember) {
          const { data: messagesData } = await axios.get(
            `${API}/groups/${realGroupId}/messages`
          );
          if (cancelled) return;

          setMessages(messagesData);
          joinGroupRoom(realGroupId);
        }
      } catch (err) {
        console.error(err);
        if (err.response?.status === 404) navigate('/groups');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
      if (groupId) leaveGroupRoom(groupId);
    };
  }, [identifier, navigate, joinGroupRoom, leaveGroupRoom]);

  // ENVOI
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !isMember || sending || !groupId) return;

    const content = input.trim();
    const replyToId = replyingTo?._id || null;

    setInput('');
    setSending(true);
    sendTypingGroup(groupId, false);

    const tempMsg = {
      _id: Date.now(),
      content,
      sender: { _id: user._id, name: user.name, avatar: user.avatar },
      createdAt: new Date().toISOString(),
      isTemp: true,
      replyTo: replyingTo || null,
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const { data } = await axios.post(`${API}/groups/${groupId}/messages`, {
        content,
        replyTo: replyToId,
      });
      setMessages((prev) => prev.map((m) => (m._id === tempMsg._id ? data : m)));
      setReplyingTo(null);
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m._id !== tempMsg._id));
      alert(err.response?.data?.message || "Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    if (groupId) sendTypingGroup(groupId, true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (groupId) sendTypingGroup(groupId, false);
    }, 1500);
  };

  // MESSAGES
  const handleEdit = (messageId, oldContent) => {
    setEditModal({ open: true, messageId, content: oldContent });
  };

  const handleEditSubmit = async () => {
    const { messageId, content } = editModal;
    if (!content || !content.trim() || !groupId) return;

    const newContent = content.trim();
    const oldMessage = messages.find((m) => m._id === messageId);

    setMessages((prev) =>
      prev.map((m) =>
        m._id === messageId
          ? {
              ...m,
              content: newContent,
              edited: true,
              editedAt: new Date().toISOString(),
              isUpdating: true,
            }
          : m
      )
    );
    setEditModal({ open: false, messageId: null, content: '' });

    try {
      await axios.put(`${API}/groups/${groupId}/messages/${messageId}`, {
        content: newContent,
      });
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, isUpdating: false } : m))
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? { ...m, content: oldMessage?.content, edited: false, isUpdating: false }
            : m
        )
      );
      alert(err.response?.data?.message || 'Erreur lors de la modification');
    }
  };

  const handleDeleteClick = (messageId) => {
    setDeleteModal({ open: true, messageId });
  };

  const handleDeleteConfirm = async () => {
    const { messageId } = deleteModal;
    const oldMessage = messages.find((m) => m._id === messageId);
    if (!groupId) return;

    setMessages((prev) =>
      prev.map((m) =>
        m._id === messageId
          ? { ...m, deleted: true, content: '[Message supprimé]', isDeleting: true }
          : m
      )
    );
    setDeleteModal({ open: false, messageId: null });

    try {
      await axios.delete(`${API}/groups/${groupId}/messages/${messageId}`);
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, isDeleting: false } : m))
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? { ...m, deleted: false, content: oldMessage?.content, isDeleting: false }
            : m
        )
      );
      alert(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  // GROUPE
  const handleJoin = async () => {
    if (!groupId) return;
    try {
      await axios.post(`${API}/groups/${groupId}/join`);
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  const handleKick = (memberId, memberName) => {
    setKickModal({ open: true, memberId, memberName });
  };

  const confirmKick = async (memberId) => {
    if (!groupId) return;
    try {
      await axios.delete(`${API}/groups/${groupId}/members/${memberId}`);
      setMembers((prev) =>
        prev.filter((m) => (m.user?._id || m.user) !== memberId)
      );
      setKickModal({ open: false, memberId: null, memberName: '' });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Erreur lors de l'exclusion");
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupId) return;
    try {
      await axios.delete(`${API}/groups/${groupId}`);
      navigate('/groups');
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression du groupe');
    } finally {
      setShowDeleteGroupModal(false);
    }
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return "À l'instant";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const getGroupColor = (name) => {
    return COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];
  };

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
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/groups')}>
          ←
        </button>
        <div className={styles.headerInfo}>
          <h2>{group.name}</h2>
          <div className={styles.headerStats}>
            <span>
              👥 {members.length} membre{members.length > 1 ? 's' : ''}
            </span>
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

      <div className={styles.main}>
        <div className={styles.chatArea}>
          {!isMember ? (
            <div className={styles.locked}>
              <div className={styles.lockedIcon}>🔒</div>
              <h3>Groupe privé</h3>
              <p>
                Rejoignez ce groupe pour voir les messages et participer à la discussion
              </p>
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
                        className={`${styles.message} ${
                          isOwn ? styles.own : styles.other
                        }`}
                      >
                        {!isOwn && (
                          <div
                            className={styles.avatar}
                            style={{ background: senderColor }}
                          >
                            {senderName[0]?.toUpperCase()}
                          </div>
                        )}
                        <div className={styles.messageContent}>
                          {!isOwn && (
                            <div className={styles.sender}>
                              {senderName}
                              {msg.sender?.department && (
                                <span className={styles.department}>
                                  {' '}
                                  · {msg.sender.department}
                                </span>
                              )}
                            </div>
                          )}

                          {msg.replyTo && !msg.replyTo.deleted && (
                            <div
                              className={styles.replyPreview}
                              onClick={() => {
                                const el = document.getElementById(
                                  `msg-${msg.replyTo._id}`
                                );
                                if (el)
                                  el.scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'center',
                                  });
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

                          <div
                            className={`${styles.bubble} ${
                              isOwn ? styles.bubbleOwn : styles.bubbleOther
                            }`}
                          >
                            {msg.content}
                            {msg.edited && (
                              <span className={styles.edited}> (modifié)</span>
                            )}
                            {msg.isUpdating && (
                              <span className={styles.syncing}> ✎</span>
                            )}
                          </div>

                          <div className={styles.meta}>
                            <span className={styles.time}>
                              {formatTime(msg.createdAt)}
                            </span>
                            {isOwn && (
                              <span className={styles.status}>
                                {msg.readBy?.length > 1 ? '✓✓' : '✓'}
                              </span>
                            )}
                            <div className={styles.actions}>
                              <button
                                onClick={() => setReplyingTo(msg)}
                                className={styles.replyBtn}
                                title="Répondre à ce message"
                              >
                                ↩️
                              </button>
                              {isOwn && (
                                <>
                                  <button
                                    onClick={() => handleEdit(msg._id, msg.content)}
                                  >
                                    ✏️
                                  </button>
                                  <button onClick={() => handleDeleteClick(msg._id)}>
                                    🗑️
                                  </button>
                                </>
                              )}
                              {!isOwn && isAdmin && (
                                <button
                                  className={styles.adminDelete}
                                  onClick={() => handleDeleteClick(msg._id)}
                                >
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
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <p>
                      {typingUsers.map((t) => t.name).join(', ')}
                      {typingUsers.length > 1 ? ' écrivent' : ' écrit'}...
                    </p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} className={styles.inputForm}>
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
                  <button
                    type="submit"
                    disabled={!input.trim() || sending}
                    className={styles.sendBtn}
                  >
                    {sending ? '...' : '→'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {showMembers && (
          <div className={styles.membersPanel}>
            <div className={styles.membersHeader}>
              <h3>Membres ({members.length})</h3>
              <button
                onClick={() => setShowMembers(false)}
                className={styles.closePanel}
              >
                ✕
              </button>
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
                    <div
                      className={styles.memberAvatar}
                      style={{ background: memberColor }}
                    >
                      {memberName[0]?.toUpperCase()}
                    </div>
                    <div className={styles.memberInfo}>
                      <div className={styles.memberName}>
                        {memberName}
                        {isMe && <span className={styles.youTag}> (Vous)</span>}
                      </div>
                      {memberDept && (
                        <div className={styles.memberDept}>{memberDept}</div>
                      )}
                    </div>
                    <div className={styles.memberBadges}>
                      {m.role === 'admin' && (
                        <span className={styles.adminBadge}>Admin</span>
                      )}
                      {isAdmin && !isMe && m.role !== 'admin' && (
                        <button
                          onClick={() => handleKick(memberId, memberName)}
                          className={styles.kickBtn}
                        >
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

      {editModal.open && (
        <div
          className={styles.modalOverlay}
          onClick={() =>
            setEditModal({ open: false, messageId: null, content: '' })
          }
        >
          <div className={styles.editModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>✏️ Modifier le message</h3>
              <button
                onClick={() =>
                  setEditModal({ open: false, messageId: null, content: '' })
                }
                className={styles.closeModal}
              >
                ✕
              </button>
            </div>
            <textarea
              value={editModal.content}
              onChange={(e) =>
                setEditModal((prev) => ({ ...prev, content: e.target.value }))
              }
              className={styles.modalTextarea}
              rows={4}
              autoFocus
            />
            <div className={styles.modalFooter}>
              <button
                onClick={() =>
                  setEditModal({ open: false, messageId: null, content: '' })
                }
                className={styles.cancelModalBtn}
              >
                Annuler
              </button>
              <button onClick={handleEditSubmit} className={styles.submitModalBtn}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModal.open && (
        <div
          className={styles.modalOverlay}
          onClick={() => setDeleteModal({ open: false, messageId: null })}
        >
          <div className={styles.deleteModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIcon}>🗑️</div>
            <h3>Supprimer ce message ?</h3>
            <p>Cette action est irréversible.</p>
            <div className={styles.modalFooter}>
              <button
                onClick={() => setDeleteModal({ open: false, messageId: null })}
                className={styles.cancelModalBtn}
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteConfirm}
                className={styles.deleteModalBtn}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {kickModal.open && (
        <div
          className={styles.modalOverlay}
          onClick={() =>
            setKickModal({ open: false, memberId: null, memberName: '' })
          }
        >
          <div className={styles.deleteModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIcon}>🚫</div>
            <h3>Exclure le membre</h3>
            <p>
              Voulez-vous vraiment exclure{' '}
              <strong>{kickModal.memberName}</strong> du groupe ?
            </p>
            <p style={{ color: '#ef4444', fontSize: '0.9rem', marginTop: '4px' }}>
              Cette action est irréversible.
            </p>
            <div className={styles.modalFooter}>
              <button
                onClick={() =>
                  setKickModal({ open: false, memberId: null, memberName: '' })
                }
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