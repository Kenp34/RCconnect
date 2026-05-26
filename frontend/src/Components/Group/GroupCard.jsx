import { useNavigate } from 'react-router-dom';
import styles from './GroupCard.module.css';

export default function GroupCard({ group, onJoin, onLeave }) {
  const navigate = useNavigate();

  return (
    <div className={styles.card} onClick={() => navigate(`/groups/${group._id}`)}>
      <div className={styles.avatar}>
        {group.avatar ? <img src={group.avatar} alt={group.name} /> : <div className={styles.avatarPlaceholder}>{group.name?.charAt(0)}</div>}
      </div>
      <div className={styles.info}>
        <h3>{group.name}</h3>
        <p>{group.description?.substring(0, 80)}</p>
        <div className={styles.meta}><span>👥 {group.memberCount}</span>{group.isPrivate && <span>🔒</span>}</div>
      </div>
      <button className={group.isMember ? styles.memberBtn : styles.joinBtn} onClick={(e) => { e.stopPropagation(); group.isMember ? onLeave(group._id) : onJoin(group._id); }}>
        {group.isMember ? '✓ Membre' : '+ Rejoindre'}
      </button>
    </div>
  );
}