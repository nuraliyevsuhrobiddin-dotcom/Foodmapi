import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useModal } from './ModalContext';
import { OVERLAYS } from '../constants/overlay';

const API_URL = import.meta.env.VITE_API_URL || '';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const persistToken = (nextToken) => {
  if (nextToken) {
    localStorage.setItem('token', nextToken);
  } else {
    localStorage.removeItem('token');
  }
};

export const AuthProvider = ({ children }) => {
  const { activeOverlay, openOverlay, closeOverlay } = useModal();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [authLoading, setAuthLoading] = useState(() => !!localStorage.getItem('token'));
  const [notifications, setNotifications] = useState([]);
  const isAuthModalOpen = activeOverlay === OVERLAYS.AUTH;

  const refreshNotifications = useCallback(async (currentToken = token) => {
    if (!currentToken) {
      setNotifications([]);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/users/notifications`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifications(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  }, [token]);

  const fetchProfile = async (currentToken) => {
    try {
      const res = await fetch(`${API_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
      } else {
        persistToken(null);
        setToken(null);
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
      persistToken(null);
      setToken(null);
    } finally {
      setAuthLoading(false);
    }
  };

  const refreshProfile = async (currentToken = token) => {
    if (!currentToken) return;
    await fetchProfile(currentToken);
  };

  const updateProfile = async (payload) => {
    if (!token) {
      return { success: false, message: 'Iltimos tizimga kiring' };
    }

    try {
      const res = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setUser((prevUser) => ({ ...prevUser, ...data.data }));
        return { success: true, data: data.data };
      }

      return { success: false, message: data.message || 'Profilni yangilab bo\'lmadi' };
    } catch (err) {
      console.error('Failed to update profile', err);
      return { success: false, message: 'Serverga ulanib bo\'lmadi' };
    }
  };

  const updateCourierAvailability = async (isAvailable) => {
    if (!token) {
      return { success: false, message: 'Iltimos tizimga kiring' };
    }

    try {
      const res = await fetch(`${API_URL}/api/users/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isAvailable })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setUser((prevUser) => ({ ...prevUser, isAvailable: data.data.isAvailable }));
        return { success: true, data: data.data };
      }

      return { success: false, message: data.message || 'Availability yangilanmadi' };
    } catch (err) {
      console.error('Failed to update availability', err);
      return { success: false, message: 'Serverga ulanib bo\'lmadi' };
    }
  };

  const updatePassword = async (currentPassword, newPassword) => {
    if (!token) {
      return { success: false, message: 'Iltimos tizimga kiring' };
    }

    try {
      const res = await fetch(`${API_URL}/api/users/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        return { success: true, message: data.message };
      }

      return { success: false, message: data.message || 'Parol yangilanmadi' };
    } catch (err) {
      console.error('Failed to update password', err);
      return { success: false, message: 'Serverga ulanib bo\'lmadi' };
    }
  };

  useEffect(() => {
    if (token) {
      setAuthLoading(true);
      persistToken(token);
      fetchProfile(token);
      refreshNotifications(token);
    } else {
      persistToken(null);
      setUser(null);
      setNotifications([]);
      setAuthLoading(false);
    }
  }, [token, refreshNotifications]);

  // Moved up

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        persistToken(data.token);
        setToken(data.token);
        setUser({
          _id: data._id,
          username: data.username,
          email: data.email,
          phone: data.phone,
          role: data.role,
          restaurantId: data.restaurantId,
        });
        return { success: true };
      }
      return { success: false, message: data.message || 'Xatolik yuz berdi' };
    } catch (err) {
      console.error(err);
      return { success: false, message: 'Serverga ulanib bo\'lmadi' };
    }
  };

  const register = async (username, email, password, phone) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, phone })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        persistToken(data.token);
        setToken(data.token);
        setUser({
          _id: data._id,
          username: data.username,
          email: data.email,
          phone: data.phone,
          role: data.role,
          restaurantId: data.restaurantId,
        });
        return { success: true };
      }
      return { success: false, message: data.message || 'Xatolik yuz berdi' };
    } catch (err) {
      console.error(err);
      return { success: false, message: 'Serverga ulanib bo\'lmadi' };
    }
  };

  const logout = () => {
    persistToken(null);
    setToken(null);
  };

  const markNotificationRead = async (notificationId) => {
    if (!token) return { success: false };

    try {
      const res = await fetch(`${API_URL}/api/users/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification._id === notificationId ? { ...notification, isRead: true } : notification
          )
        );
        return { success: true };
      }
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }

    return { success: false };
  };

  const markAllNotificationsRead = async () => {
    if (!token) return { success: false };

    try {
      const res = await fetch(`${API_URL}/api/users/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
        return { success: true };
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
    }

    return { success: false };
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
    } catch {
      return { success: false };
    }
  };

  const unreadNotificationsCount = notifications.filter((notification) => !notification.isRead).length;

  return (
    <AuthContext.Provider value={{
      user, token, authLoading, login, register, logout, toggleFavorite,
      refreshProfile, updateProfile, updateCourierAvailability, updatePassword,
      notifications, unreadNotificationsCount, refreshNotifications,
      markNotificationRead, markAllNotificationsRead,
      isAuthModalOpen,
      setIsAuthModalOpen: (open) => (open ? openOverlay(OVERLAYS.AUTH) : closeOverlay()),
    }}>
      {children}
    </AuthContext.Provider>
  );
};
