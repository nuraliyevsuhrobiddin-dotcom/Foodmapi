import { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import { AuthProvider } from './context/AuthContext';
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
const Profile = lazy(() => import('./pages/Profile'));

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
            <Toaster position="top-right" reverseOrder={false} />
            <Navbar darkMode={darkMode} toggleTheme={toggleTheme} />
            <AuthModal />
            <CartSidebar />
            <main className="flex-1 flex flex-col pt-[72px]">
            <Suspense fallback={<div className="flex-1 bg-background" />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/restaurant/:id" element={<RestaurantDetail />} />
                <Route path="/admin" element={<Admin />} />
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
