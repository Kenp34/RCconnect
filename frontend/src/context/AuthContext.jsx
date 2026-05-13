import { createContext, useContext, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext();
const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  const login = async (email, password) => {
    const { data } = await axios.post(`${API}/auth/login`, { email, password });
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token', data.token);
  };

  const logout = () => {
    setUser(null); setToken(null);
    localStorage.clear();
  };

  axios.defaults.headers.common['Authorization'] = token ? `Bearer ${token}` : '';

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);