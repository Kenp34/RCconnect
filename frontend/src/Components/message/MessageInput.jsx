import { useState, useRef } from 'react';
import styles from './MessageInput.module.css';
export default function MessageInput({ onSendMessage, onTyping, replyingTo, onCancelReply }) {
  const [content, setContent] = useState('');
  const typingTimeout = useRef(null);
  const handleChange = (e) => {
    setContent(e.target.value);
    onTyping(true);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => onTyping(false), 1500);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSendMessage(content.trim(), replyingTo?._id || null);
    setContent('');
    onTyping(false);
    onCancelReply?.();
  };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
  };
  return (
    <form onSubmit={handleSubmit} className={styles.inputContainer}>
      {replyingTo && (
        <div className={styles.replyBanner}>
          <div className={styles.replyBannerContent}>
            <span className={styles.replyBannerAuthor}>{replyingTo.sender?.name}</span>
            <p className={styles.replyBannerText}>{replyingTo.content}</p>
          </div>
          <button type="button" onClick={onCancelReply} className={styles.replyCancelBtn}>✕</button>
        </div>
      )}
      <div className={styles.inputRow}>
        <textarea
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Votre message... (Entrée pour envoyer, Maj+Entrée pour nouvelle ligne)"
          className={styles.textarea}
          rows={1}
        />
        <button type="submit" disabled={!content.trim()} className={styles.sendButton}>→</button>
      </div>
    </form>
  );
}