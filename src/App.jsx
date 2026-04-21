import { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import AuthModal from './components/AuthModal';
import CartSidebar from './components/CartSidebar';
import { Toaster, toast } from 'react-hot-toast';
import io from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || '';
const socket = io(API_URL);

const Home = lazy(() => import('./pages/Home'));
const RestaurantDetail = lazy(() => import('./pages/RestaurantDetail'));
const Admin = lazy(() => import('./pages/Admin'));
const RestaurantDashboard = lazy(() => import('./pages/RestaurantDashboard'));
const CourierDashboard = lazy(() => import('./pages/CourierDashboard'));
const Profile = lazy(() => import('./pages/Profile'));

function SocketEventsBridge() {
  const { user, refreshNotifications, refreshProfile } = useAuth();

  useEffect(() => {
    if (!user) return;

    socket.emit('register_session', {
      userId: user._id,
      role: user.role,
      restaurantId: user.restaurantId,
    });
  }, [user]);

  useEffect(() => {
    const handleOrderCreated = (order) => {
      window.dispatchEvent(new CustomEvent('marketplace:order-created', { detail: order }));
      if (user?.role === 'admin' || user?.role === 'restaurant') {
        toast.success(`Yangi buyurtma: ${order.restaurant?.name || 'Restoran'}`);
      }
    };

    const handleOrderUpdated = (order) => {
      window.dispatchEvent(new CustomEvent('marketplace:order-updated', { detail: order }));
      const isCustomer = order.customer?._id === user?._id || order.customer === user?._id;
      const isCourier = order.courier?._id === user?._id || order.courier === user?._id;
      const isRestaurantOwner = order.restaurantOwner?._id === user?._id || order.restaurantOwner === user?._id;

      if (isCustomer || isCourier || isRestaurantOwner || user?.role === 'admin') {
        toast(`Buyurtma yangilandi: ${order.status}`, {
          icon: '🔔',
          style: {
            borderRadius: '16px',
            background: 'rgba(15, 23, 42, 0.92)',
            color: '#fff',
          },
        });
      }
    };

    const handleNotificationCreated = (notification) => {
      window.dispatchEvent(new CustomEvent('marketplace:notification-created', { detail: notification }));
      refreshNotifications();
      toast(notification.title || 'Yangi bildirishnoma', {
        icon: '🔔',
        style: {
          borderRadius: '16px',
          background: 'rgba(15, 23, 42, 0.92)',
          color: '#fff',
        },
      });
    };

    const handleCourierLocationUpdated = (payload) => {
      window.dispatchEvent(new CustomEvent('marketplace:courier-location-updated', { detail: payload }));

      const isCourier = payload?.courierId === user?._id;
      if (isCourier) {
        refreshProfile();
      }
    };

    socket.on('order_created', handleOrderCreated);
    socket.on('order_updated', handleOrderUpdated);
    socket.on('notification_created', handleNotificationCreated);
    socket.on('courier_location_updated', handleCourierLocationUpdated);

    return () => {
      socket.off('order_created', handleOrderCreated);
      socket.off('order_updated', handleOrderUpdated);
      socket.off('notification_created', handleNotificationCreated);
      socket.off('courier_location_updated', handleCourierLocationUpdated);
    };
  }, [user, refreshNotifications, refreshProfile]);

  return null;
}

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Live Socket.io Notifications listening
  useEffect(() => {
    socket.on('new_review', (data) => {
      toast(`${data.username} "${data.restaurantName}" restoraniga ${data.rating} yulduz berdi!`, {
        icon: '🔔',
        style: {
          borderRadius: '16px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(10px)',
          color: '#fff',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      });
    });
    return () => socket.off('new_review');
  }, []);

  const toggleTheme = () => setDarkMode(!darkMode);

  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-background text-text transition-colors duration-300">
            <Toaster
              position="top-right"
              reverseOrder={false}
              toastOptions={{
                duration: 3500,
                style: {
                  borderRadius: '18px',
                  padding: '14px 16px',
                  background: 'rgba(15, 23, 42, 0.94)',
                  color: '#fff',
                },
              }}
              containerStyle={{
                top: 14,
                left: 12,
                right: 12,
              }}
            />
            <SocketEventsBridge />
            <Navbar darkMode={darkMode} toggleTheme={toggleTheme} />
            <AuthModal />
            <CartSidebar />
            <main className="flex-1 flex flex-col pt-[56px] sm:pt-[64px]">
            <Suspense fallback={<div className="flex-1 bg-background" />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/restaurant/:id" element={<RestaurantDetail />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/restaurant-dashboard" element={<RestaurantDashboard />} />
                <Route path="/courier-dashboard" element={<CourierDashboard />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
