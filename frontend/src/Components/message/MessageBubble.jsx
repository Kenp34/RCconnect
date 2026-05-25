import { useState } from 'react';
import MessageMenu from './MessageMenu';
import { formatMessageTime } from '../../helpers/rooms.js';
import styles from './MessageBubble.module.css';

export default function MessageBubble({ message, isOwn, onDelete, onEdit }) {
  const [isHovered, setIsHovered] = useState(false);

  const getSenderName = () => {
    if (isOwn) return 'Vous';
    if (message.sender?.name) return message.sender.name;
    return 'Collègue';
  };

  // Message supprimé
  if (message.deleted) {
    return (
      <div className={`${styles.messageBubble} ${styles.deletedMessage}`}>
        <div className={styles.deletedContent}>
          <span>🗑️</span>
          <em>Message supprimé</em>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.messageBubble} ${isOwn ? styles.own : styles.other}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!isOwn && (
        <div className={styles.avatar}>
          {message.sender?.avatar ? (
            <img src={message.sender.avatar} alt={message.sender.name} />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {getSenderName().charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}
     
      <div className={styles.messageWrapper}>
        {!isOwn && (
          <div className={styles.senderName}>
            {getSenderName()}
            {message.sender?.department && (
              <span className={styles.department}> · {message.sender.department}</span>
            )}
          </div>
        )}
       
        <div className={styles.messageContent}>
          <div className={styles.messageText}>
            {message.content}
            {message.edited && (
              <span className={styles.editedBadge}> (modifié)</span>
            )}
          </div>
          <div className={styles.messageMeta}>
            <span className={styles.time}>{formatMessageTime(message.createdAt)}</span>
            {message.editedAt && (
              <span className={styles.editedTime}>
                · modifié {formatMessageTime(message.editedAt)}
              </span>
            )}
            {isOwn && (
              <span className={styles.status}>
                {message.read ? '✓✓' : '✓'}
              </span>
            )}
          </div>
        </div>
       
        {isOwn && isHovered && (
          <MessageMenu
            message={message}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        )}
      </div>
    </div>
  );
}