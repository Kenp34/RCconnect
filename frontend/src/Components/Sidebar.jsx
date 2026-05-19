import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './/Css/Sidebar.module.css';

const menuItems = [
  { icon: '🏠', label: 'Fil d\'actualité', path: '/feed' },
  { icon: '👤', label: 'Mon profil', path: '/profile/me' },
  { icon: '💬', label: 'Messages', path: '/messages', badge: 5 },
  { icon: '🔔', label: 'Notifications', path: '/notifications', badge: 3 },
  { icon: '👥', label: 'Annuaire', path: '/annuaire' },
];

const groups = [
  { label: 'Équipe Dev', color: '#4F8EF7' },
  { label: 'Marketing', color: '#A78BFA' },
  { label: 'RH & Culture', color: '#34D399' },
  { label: 'Direction', color: '#F87171' },
  { label: 'Support Client', color: '#FBBF24' },
];

export default function Sidebar() {
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.menuSection}>
        <h3 className={styles.sectionTitle}>MENU</h3>
        <ul className={styles.menuList}>
          {menuItems.map(item => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`${styles.menuLink} ${location.pathname === item.path ? styles.active : ''}`}
              >
                <span className={styles.menuIcon}>{item.icon}</span>
                <span>{item.label}</span>
                {item.badge && <span className={styles.menuBadge}>{item.badge}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.groupsSection}>
        <h3 className={styles.sectionTitle}>MES GROUPES</h3>
        <ul className={styles.groupsList}>
          {groups.map(group => (
            <li key={group.label}>
              <div className={styles.groupItem}>
                <div className={styles.groupDot} style={{ background: group.color }} />
                <span>{group.label}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.bottomSection}>
        <Link to="/parametres" className={styles.bottomLink}>
          <span>⚙️</span> Paramètres
        </Link>
        <button onClick={logout} className={styles.logoutButton}>
          <span>⎋</span> Déconnexion
        </button>
      </div>
    </aside>
  );
}