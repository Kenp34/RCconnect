import { useState } from 'react';
import { formatMessageTime } from '../../helpers/rooms.js';
import styles from './ConversationList.module.css';

export default function ConversationList({
  conversations,
  activeConversation,
  onSelectConversation,
  currentUser
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = conversations.filter(conv => {
    const other = conv.sender?._id === currentUser._id ? conv.recipient : conv.sender;
    return other?.name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className={styles.conversationList}>
      <div className={styles.header}>
        <h2>Messages</h2>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className={styles.searchIcon}>🔍</span>
        </div>
      </div>
     
      <div className={styles.conversations}>
        {filteredConversations.length === 0 ? (
          <div className={styles.emptyConversations}>
            <span>💬</span>
            <p>Aucune conversation</p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const other = conv.sender?._id === currentUser._id ? conv.recipient : conv.sender;
            if (!other) return null;
           
            const isActive = activeConversation?._id === other._id;
           
            return (
              <div
                key={conv._id}
                className={`${styles.conversationItem} ${isActive ? styles.active : ''}`}
                onClick={() => onSelectConversation(other)}
              >
                <div className={styles.avatar}>
                  {other.avatar ? (
                    <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}${other.avatar}`} alt={other.name} />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {other.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {conv.unread && <span className={styles.unreadBadge}></span>}
                </div>
               
                <div className={styles.conversationInfo}>
                  <div className={styles.conversationHeader}>
                    <h3>{other.name}</h3>
                    <span className={styles.time}>{formatMessageTime(conv.createdAt)}</span>
                  </div>
                  <p className={styles.lastMessage}>
                    {conv.sender?._id === currentUser._id && '👤 Vous: '}
                    {conv.content?.substring(0, 40)}{conv.content?.length > 40 ? '...' : ''}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}