import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import styles from './GroupDetail.module.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  
  const messagesEndRef = useRef(null);
  const isMounted = useRef(true);

  // Scroll auto
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Nettoyage
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (socket && id) {
        socket.emit('leaveGroupRoom', id);
      }
    };
  }, [socket, id]);

  // Charger les infos du groupe
  useEffect(() => {
    const fetchGroup = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${API}/groups/${id}`);
        
        if (!isMounted.current) return;
        
        const isMember = data.members?.some(m => m.user?._id === user._id);
        const isAdmin = data.members?.some(m => m.user?._id === user._id && m.role === 'admin');
        
        setGroup({
          ...data,
          isMember,
          isAdmin,
          memberCount: data.members?.length || 0
        });
      } catch (err) {
        console.error('Erreur:', err);
        if (err.response?.status === 404) {
          setTimeout(() => navigate('/groups'), 2000);
        }
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };
    
    if (id) {
      fetchGroup();
    }
  }, [id, navigate, user._id]);

  // Charger les messages et rejoindre la room
  useEffect(() => {
    if (!group?.isMember || !socket || !isConnected) return;
    
    // Rejoindre la room du groupe
    socket.emit('joinGroupRoom', id);
    
    // Charger l'historique
    const fetchMessages = async () => {
      try {
        const { data } = await axios.get(`${API}/groups/${id}/messages`);
        if (isMounted.current) {
          setMessages(data);
        }
      } catch (err) {
        console.error('Erreur chargement messages:', err);
      }
    };
    
    fetchMessages();
    
    // Écouter les nouveaux messages
    const onNewMessage = (message) => {
      if (message.groupId === id) {
        setMessages(prev => [...prev, message]);
      }
    };
    
    // Écouter les indicateurs de frappe
    const onTyping = ({ groupId, userName, isTyping }) => {
      if (groupId === id) {
        setTypingUsers(prev => {
          if (isTyping) {
            if (!prev.includes(userName)) {
              return [...prev, userName];
            }
          } else {
            return prev.filter(name => name !== userName);
          }
          return prev;
        });
        
        // Effacer l'indicateur après 2 secondes
        if (isTyping) {
          setTimeout(() => {
            setTypingUsers(prev => prev.filter(name => name !== userName));
          }, 2000);
        }
      }
    };
    
    socket.on('newGroupMessage', onNewMessage);
    socket.on('groupTyping', onTyping);
    
    return () => {
      socket.off('newGroupMessage', onNewMessage);
      socket.off('groupTyping', onTyping);
    };
  }, [group?.isMember, socket, isConnected, id]);

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      await axios.post(`${API}/groups/${id}/join`);
      // Recharger le groupe
      const { data } = await axios.get(`${API}/groups/${id}`);
      const isMember = data.members?.some(m => m.user?._id === user._id);
      const isAdmin = data.members?.some(m => m.user?._id === user._id && m.role === 'admin');
      
      setGroup({
        ...data,
        isMember,
        isAdmin,
        memberCount: data.members?.length || 0
      });
    } catch (err) {
      console.error('Erreur:', err);
      alert(err.response?.data?.message || 'Erreur');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm('Voulez-vous vraiment quitter ce groupe ?')) return;
    
    try {
      await axios.post(`${API}/groups/${id}/leave`);
      navigate('/groups');
    } catch (err) {
      console.error('Erreur:', err);
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket || !group?.isMember) {
       console.log("pb")
        return;
    }
        
    
    const content = inputMessage.trim();
    setInputMessage('');
    
    // Optimistic update
    const tempMessage = {
      _id: Date.now(),
      content,
      sender: { _id: user._id, name: user.name, avatar: user.avatar },
      groupId: id,
      createdAt: new Date().toISOString(),
      temp: true
    };
    setMessages(prev => [...prev, tempMessage]);
    
    // Envoyer via Socket
    socket.emit('sendGroupMessage', {
      groupId: id,
      content,
      senderId: user._id,
      senderName: user.name,
      senderAvatar: user.avatar
    });
    
    // Sauvegarder en BDD
    try {
      await axios.post(`${API}/groups/${id}/messages`, { content });
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
    }
  };

  const handleTyping = (isTyping) => {
    if (!socket || !group?.isMember) return;
    socket.emit('groupTyping', { groupId: id, isTyping, userName: user.name });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return "À l'instant";
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Chargement...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className={styles.error}>
        <span>🔍</span>
        <h2>Groupe non trouvé</h2>
        <button onClick={() => navigate('/groups')}>Retour</button>
      </div>
    );
  }

  if (!group.isMember) {
    return (
      <div className={styles.notMember}>
        <div className={styles.notMemberCard}>
          <div className={styles.avatarLarge}>
            {group.avatar ? (
              <img src={group.avatar} alt={group.name} />
            ) : (
              <div>{group.name?.charAt(0).toUpperCase()}</div>
            )}
          </div>
          <h1>{group.name}</h1>
          <p>{group.description || 'Aucune description'}</p>
          <div className={styles.stats}>
            <span>👥 {group.memberCount} membres</span>
            {group.isPrivate && <span>🔒 Privé</span>}
          </div>
          <button onClick={handleJoin} className={styles.joinBtn} disabled={isJoining}>
            {isJoining ? '...' : 'Rejoindre le groupe'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.groupChatContainer}>
      {/* Header */}
      <div className={styles.chatHeader}>
        <button onClick={() => navigate('/groups')} className={styles.backBtn}>
          ←
        </button>
        <div className={styles.groupInfo}>
          <div className={styles.avatarSmall}>
            {group.avatar ? (
              <img src={group.avatar} alt={group.name} />
            ) : (
              <div>{group.name?.charAt(0).toUpperCase()}</div>
            )}
          </div>
          <div>
            <h2>{group.name}</h2>
            <p>{group.memberCount} membres</p>
          </div>
        </div>
        <button onClick={handleLeave} className={styles.leaveBtn}>
          Quitter
        </button>
      </div>

      {/* Messages */}
      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div className={styles.noMessages}>
            <span>💬</span>
            <p>Aucun message</p>
            <small>Soyez le premier à envoyer un message !</small>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isOwn = msg.sender?._id === user._id || msg.sender === user._id;
            return (
              <div
                key={msg._id || idx}
                className={`${styles.messageRow} ${isOwn ? styles.ownRow : styles.otherRow}`}
              >
                {!isOwn && (
                  <div className={styles.messageAvatar}>
                    {msg.sender?.avatar ? (
                      <img src={msg.sender.avatar} alt="" />
                    ) : (
                      <div>{msg.sender?.name?.charAt(0).toUpperCase()}</div>
                    )}
                  </div>
                )}
                <div className={styles.messageWrapper}>
                  {!isOwn && (
                    <div className={styles.senderName}>{msg.sender?.name}</div>
                  )}
                  <div className={`${styles.messageBubble} ${isOwn ? styles.ownBubble : styles.otherBubble}`}>
                    {msg.content}
                    {msg.temp && <span className={styles.pending}>...</span>}
                  </div>
                  <div className={styles.messageTime}>
                    {formatTime(msg.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {/* Indicateur de frappe */}
        {typingUsers.length > 0 && (
          <div className={styles.typingIndicator}>
            <div className={styles.typingBubble}>
              <span></span><span></span><span></span>
            </div>
            <p>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'est' : 'sont'} en train d'écrire...</p>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className={styles.inputForm}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={() => handleTyping(true)}
          onBlur={() => handleTyping(false)}
          placeholder="Écrivez un message..."
          className={styles.messageInput}
        />
        <button type="submit" disabled={!inputMessage.trim()} className={styles.sendBtn}>
          📤
        </button>
      </form>
    </div>
  );
}