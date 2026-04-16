import { createContext, useContext, useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const fetchProfile = async (currentToken) => {
    try {
      const res = await fetch(`${API_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
      } else {
        setToken(null);
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
      setToken(null);
    }
  };

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchProfile(token);
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  // Moved up

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        return { success: true };
      }
      return { success: false, message: data.message || 'Xatolik yuz berdi' };
    } catch (err) {
      console.error(err);
      return { success: false, message: 'Serverga ulanib bo\'lmadi' };
    }
  };

  const register = async (username, email, password) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        return { success: true };
      }
      return { success: false, message: data.message || 'Xatolik yuz berdi' };
    } catch (err) {
      console.error(err);
      return { success: false, message: 'Serverga ulanib bo\'lmadi' };
    }
  };

  const logout = () => {
    setToken(null);
  };

  const toggleFavorite = async (restaurantId) => {
    if (!token) return { success: false, message: 'Iltimos tizimga kiring' };
    try {
      const res = await fetch(`${API_URL}/api/users/favorites/${restaurantId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        // Update local user state
        setUser({ ...user, favorites: data.data });
        return { success: true, isFavorited: data.data.some(f => f._id === restaurantId || f === restaurantId) };
      }
      return { success: false };
    } catch (err) {
      return { success: false };
    }
  };

  return (
    <AuthContext.Provider value={{
      user, token, login, register, logout, toggleFavorite,
      isAuthModalOpen, setIsAuthModalOpen
    }}>
      {children}
    </AuthContext.Provider>
  );
};
