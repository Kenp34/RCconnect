import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './AdminLayout.module.css';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.adminLayout}>
      {/* ===== SIDEBAR ===== */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>⚙️</span>
            {user?.role === 'admin' ? <span className={styles.logoText}>Admin</span> : <span className={styles.logoText}>Admin-Manager</span> }
            
          </div>
          <span className={styles.logoSub}>RCconnect</span>
        </div>

        <nav className={styles.sidebarNav}>
          {/* ✅ Retour à l'application */}
          <Link to="/feed" className={styles.navLink}>
            <span className={styles.navIcon}>🏠</span>
            <span>Retour à l'app</span>
          </Link>
{user?.role === 'admin' ?  
          <Link to="/admin" className={styles.navLinkActive}>
            <span className={styles.navIcon}>👥</span>
            <span>Utilisateurs</span>
          </Link> : <Link to="/manager" className={styles.navLinkActive}>
            <span className={styles.navIcon}>👥</span>
            <span>Utilisateurs</span>
          </Link>}

          <Link to="/admin/analytics" className={styles.navLink}>
            <span className={styles.navIcon}>📊</span>
            <span>Statistiques</span>
          </Link>

          <Link to="/admin/logs" className={styles.navLink}>
            <span className={styles.navIcon}>📋</span>
            <span>Journaux</span>
          </Link>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user?.name}</span>
              <span className={styles.userRole}>
                {user?.role === 'admin' ? '👑 Administrateur' : '📋 Manager'}
              </span>
            </div>
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <span>🚪</span>
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* ===== CONTENU PRINCIPAL ===== */}
      <main className={styles.mainContent}>
        <header className={styles.topBar}>
          <h1>Panneau d'administration</h1>
          <div className={styles.topBarActions}>
            <Link to="/feed" className={styles.appLink}>
              ← Retour à l'application
            </Link>
          </div>
        </header>
        <div className={styles.contentArea}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}