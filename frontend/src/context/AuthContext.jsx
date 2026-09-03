import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
const AuthContext = createContext();
const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    if (!stored || stored === 'undefined') return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || null;
  });

  const [loading, setLoading] = useState(true); // ✅ Ajouté

  // ✅ Synchronisation du token avec axios
  useEffect(() => {

    console.log('🔄 Synchronisation token:', token ? 'Présent' : 'Absent');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }


  }, [token]);

  // ✅ Deuxième useEffect : gérer le chargement SÉPARÉMENT
  useEffect(() => {
    // ✅ Petit délai pour éviter l'erreur "calling setState synchronously"
    const timer = setTimeout(() => {
      setLoading(false);
      console.log('✅ Chargement terminé');
    }, 0);

    return () => clearTimeout(timer);
  }, []); // ✅ Tableau vide : exécuté une seule fois

// ✅ LOGIN - Fonction corrigée
    const login = async (email, password) => {
        try {
            console.log('📡 Tentative de login:', email);
            
            const response = await axios.post(`${API}/auth/login`, { 
                email, 
                password 
            });

            console.log('✅ Login réussi');
            const { user: userData, token: tokenData } = response.data;

            // Sauvegarde
            setUser(userData);
            setToken(tokenData);
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('token', tokenData);

            // ✅ Mettre à jour axios
            axios.defaults.headers.common['Authorization'] = `Bearer ${tokenData}`;

            return { success: true };
        } catch (error) {
            console.error('❌ Erreur login:', error);
            console.error('❌ Réponse:', error.response?.data);
            return { 
                success: false, 
                error: error.response?.data?.message || 'Erreur de connexion' 
            };
        }
    };

    // ✅ LOGOUT
    const logout = () => {
        console.log('🔓 Déconnexion');
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
    };

  
  // ✅ Nouvelle fonction : met à jour user en mémoire + localStorage
  const updateUser = (updates) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };
  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);