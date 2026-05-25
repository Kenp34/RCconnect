import styles from './EmptyChatState.module.css';

export default function EmptyChatState() {
  return (
    <div className={styles.emptyState}>
      <div className={styles.content}>
        <div className={styles.icon}>💬</div>
        <h3>Messagerie</h3>
        <p>Sélectionnez une conversation pour commencer à discuter</p>
      </div>
    </div>
  );
}