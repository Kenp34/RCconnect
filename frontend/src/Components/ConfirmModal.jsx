import styles from './Css/ConfirmModal.module.css';

function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmLabel = 'Confirmer', danger = false }) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            Annuler
          </button>
          <button
            className={danger ? styles.dangerBtn : styles.confirmBtn}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}


export default ConfirmModal;


/*!SECTION

import { useState } from 'react'; import { formatMessageTime } from '../../utils/room';
import styles from './ConversationList.module.css';
export default function ConversationList({ conversations, following = [], activeConversation, onSelectConversation, currentUser }) {

}*/