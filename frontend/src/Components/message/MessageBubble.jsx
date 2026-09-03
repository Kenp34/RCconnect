import { formatMessageTime } from '../../helpers/rooms.js';
import MessageMenu from './MessageMenu';
import styles from './MessageBubble.module.css';
const COLORS = ['linear-gradient(135deg,#4F8EF7,#A78BFA)',
  'linear-gradient(135deg,#34D399,#059669)',
  'linear-gradient(135deg,#F87171,#EC4899)',
  'linear-gradient(135deg,#FBBF24,#F59E0B)'];
export default function MessageBubble({ message, isOwn, onDelete, onEdit, onReply }) {
  const colorIndex = message.sender?.name?.charCodeAt(0) % COLORS.length;
  if (message.deleted) {
    return (
      <div className={`${styles.messageBubble} ${isOwn ? styles.own : styles.other}`}>
        {!isOwn && (<div className={styles.avatar} style={{ background: COLORS[colorIndex] }}>
          {message.sender?.name?.[0]?.toUpperCase()}</div>)}
        <div className={styles.deletedBubble}><span>🗑️</span><em>Message supprimé</em></div>
      </div>
    );
  }
  return (
    <div className={`${styles.messageBubble} ${isOwn ? styles.own : styles.other}`}>
      {!isOwn && (<div className={styles.avatar} style={{ background: COLORS[colorIndex] }}>
        {message.sender?.name?.[0]?.toUpperCase()}</div>)}
      <div className={styles.messageWrapper}>
        {!isOwn && (<div className={styles.senderName}>
          {message.sender?.name}
          {message.sender?.department && (
            <span className={styles.department}> · {message.sender.department}</span>)}
        </div>)}
        {/* Aperçu du message cité, s'il y en a un */}
        {message.replyTo && (
          <div className={styles.replyPreview} onClick={() => onReply?.(message.replyTo)}>
            <span className={styles.replyAuthor}>
              {message.replyTo.deleted ? 'Message supprimé' : message.replyTo.sender?.name}
            </span>
            {!message.replyTo.deleted && (
              <p className={styles.replyContent}>{message.replyTo.content}</p>
            )}
          </div>
        )}
        <div className={styles.bubbleRow}>
          {isOwn ? (<MessageMenu message={message} isOwn={true} onDelete={onDelete} onEdit={onEdit} onReply={onReply} />) : (<MessageMenu message={message} isOwn={false} onReply={onReply} />)}
          <div className={`${styles.bubble} ${isOwn ? styles.bubbleOwn : styles.bubbleOther}`}>
            {message.content}
            {message.edited && (<span className={styles.editedBadge}> ✎ modifié</span>)}
          </div>
        </div>
        <div className={`${styles.messageMeta} ${isOwn ? styles.metaOwn : ''}`}>
          <span className={styles.time}>{formatMessageTime(message.createdAt)}</span>
          {isOwn && (<span className={`${styles.status} ${message.read ? styles.statusRead : ''}`}>
            {message.read ? '✓✓' : '✓'}</span>)}
        </div>
      </div>
    </div>
  );
}

/*
<div className={styles.bubbleRow}>
          {isOwn && (<MessageMenu message={message} onDelete={onDelete} onEdit={onEdit} onReply={onReply} />)}
          <div className={`${styles.bubble} ${isOwn ? styles.bubbleOwn : styles.bubbleOther}`}>
            {message.content}
            {message.edited && (<span className={styles.editedBadge}> ✎ modifié</span>)}
          </div>
        </div>
        <div className={`${styles.messageMeta} ${isOwn ? styles.metaOwn : ''}`}>
          <span className={styles.time}>{formatMessageTime(message.createdAt)}</span>
          {isOwn && (<span className={`${styles.status} ${message.read ? styles.statusRead : ''}`}>
            {message.read ? '✓✓' : '✓'}</span>)}
        </div>
      </div>
    </div>
  );
}
*/