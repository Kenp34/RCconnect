
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Css/Navbar.module.css';
import NotificationBell from './NotificationBell';
import {useLocation} from 'react-router-dom'
import { useSearch } from '../context/SearchContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
   const location=useLocation()
   const{searchQuery,handleSearch}=useSearch()
   const isOnFeedPage =location.pathname==='/feed'
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className={styles.navbar}>
      {/* Logo */}
      <Link to="/feed" className={styles.logo}>
        <div className={styles.logoIcon}>RC</div>
        <span className={styles.logoText}>RCconnect</span>
      </Link>

       
      {user?.role === 'admin' && (
        
        <Link to="/admin" className={styles.navLink}>
         <span className={styles.actionIcon}>⚙️</span>
          <span className={styles.actionLabel}> Administration</span>
       
        </Link>

   
      )}

      {user?.role === 'manager' && (
        <Link to="/manager" className={styles.navLink}>
        
        
         <span className={styles.actionIcon}>⚙️</span>
          <span className={styles.actionLabel}>Administration - Manager</span>
        
        </Link>
      )}

      {/* Barre de recherche */}
      <div className={styles.searchContainer}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          disabled={!isOnFeedPage}
          title={!isOnFeedPage? "Disponible uniquement sur le fil d'actualité" : ""}
          placeholder={isOnFeedPage? "Rechercher  publications..." : "Pas Fonctionnelle"}
          className={styles.searchInput}
        />
      </div>

      {/* Actions à droite */}
      <div className={styles.rightSection}>
        
        {/* 🔔 Notifications */}
        <div className={styles.notificationWrapper}>
          <NotificationBell />
        </div>

        {/* 💬 Messages */}
        <Link to="/messages" className={styles.actionBtn}>
          <span className={styles.actionIcon}>💬</span>
          <span className={styles.actionLabel}>Messages</span>
        </Link>

        {/* 👤 Profil utilisateur */}
        <Link to={`/profile/${user?._id}`} className={styles.profileBtn}>
          <div className={styles.avatar}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className={styles.profileInfo}>
            <span className={styles.userName}>
              {user?.name?.split(' ')[0]}
            </span>
            <span className={styles.userRole}>
              {user?.role === 'admin' ? 'Admin' : user?.role === 'manager' ? 'Manager' : 'Employé'}
            </span>
          </div>
        </Link>

        {/* 🚪 Déconnexion */}
        <button onClick={handleLogout} className={styles.logoutBtn}>
          <span className={styles.logoutIcon}>⎋</span>
          <span className={styles.logoutText}>Déconnexion</span>
        </button>
      </div>
    </nav>
  );
}