import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Css/Navbar.module.css';
import NotificationBell from './NotificationBell';


export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className={styles.navbar}>
      <Link to="/feed" className={styles.logo}>
        <div className={styles.logoIcon}>EC</div>
        <span className={styles.logoText}>EnterpriseConnect</span>
      </Link>

      <div className={styles.searchContainer}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher collègues, groupes, publications"
          className={styles.searchInput}
        />
      </div>

      <div className={styles.rightSection}>
       
      

        <NotificationBell />
  


        <Link to="/messages" className={styles.iconBtn}>
          💬
          {/* <span className={styles.badge}>5</span> */}
        </Link>

        <Link to={`/profile/${user?._id}`} className={styles.profileBtn}>
          <div className={styles.avatar}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <span className={styles.userName}>
            {user?.name?.split(' ')[0]}
          </span>
        </Link>
     
        <button onClick={handleLogout} className={styles.logoutBtn}>
          ⎋ Logout
        </button>
      </div>
    </nav>
  );
}