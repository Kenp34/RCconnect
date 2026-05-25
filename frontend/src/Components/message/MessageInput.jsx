import { useState, useRef, useEffect } from 'react';
import EditMessageModal from './EditMessageModal';
import styles from './MessageMenu.module.css';

export default function MessageMenu({ message, onDelete, onEdit }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEdit = () => {
    setIsOpen(false);
    setShowEditModal(true);
  };

  const handleDelete = () => {
    setIsOpen(false);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDelete(message._id);
    setShowDeleteConfirm(false);
  };

  const handleEditSubmit = (newContent) => {
    onEdit(message._id, newContent);
    setShowEditModal(false);
  };

  return (
    <>
      <div className={styles.messageMenu} ref={menuRef}>
        <button
          className={styles.menuButton}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Options"
        >
          ⋮
        </button>

        {isOpen && (
          <div className={styles.menuDropdown}>
            <button onClick={handleEdit} className={styles.menuItem}>
              ✏️ Modifier
            </button>
            <button onClick={handleDelete} className={`${styles.menuItem} ${styles.deleteItem}`}>
              🗑️ Supprimer
            </button>
          </div>
        )}
      </div>

      <EditMessageModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditSubmit}
        initialContent={message.content}
      />

      {showDeleteConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteConfirm(false)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmIcon}>⚠️</div>
            <h3>Supprimer le message ?</h3>
            <p>Cette action est irréversible.</p>
            <div className={styles.confirmButtons}>
              <button onClick={() => setShowDeleteConfirm(false)} className={styles.cancelBtn}>
                Annuler
              </button>
              <button onClick={confirmDelete} className={styles.deleteBtn}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
