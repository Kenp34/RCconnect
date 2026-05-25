import { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import EmptyChatState from './EmptyChatState';
import styles from './ChatArea.module.css';

export default function ChatArea({
  messages,
  activeConversation,
  currentUser,
  loading,
  onSendMessage,
  onTyping,
  typingUser,
  onDeleteMessage,
  onEditMessage
}) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!activeConversation) {
    return <EmptyChatState />;
  }

  return (
    <div className={styles.chatArea}>
      <div className={styles.chatHeader}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {activeConversation.avatar ? (
              <img src={activeConversation.avatar} alt={activeConversation.name} />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {activeConversation.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className={styles.userDetails}>
            <h3>{activeConversation.name}</h3>
            <p>{activeConversation.department || 'Employé'}</p>
          </div>
        </div>
      </div>

      <div className={styles.messagesContainer}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Chargement...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.noMessages}>
            <span>💬</span>
            <p>Pas encore de messages</p>
            <small>Soyez le premier à envoyer un message !</small>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <MessageBubble
                key={message._id || index}
                message={message}
                isOwn={message.sender?._id === currentUser._id || message.sender === currentUser._id}
                currentUser={currentUser}
                onDelete={onDeleteMessage}
                onEdit={onEditMessage}
              />
            ))}
            {typingUser && (
              <div className={styles.typingIndicator}>
                <div className={styles.typingBubble}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <p>{typingUser.name} est en train d'écrire...</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <MessageInput onSendMessage={onSendMessage} onTyping={onTyping} />
    </div>
  );
}