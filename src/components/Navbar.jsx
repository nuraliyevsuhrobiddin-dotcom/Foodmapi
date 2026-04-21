import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Moon, Sun, User, Utensils, LogOut, Settings, Menu, X, ShoppingBag, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const roleTitles = {
  admin: 'Boshqaruv Paneli',
  restaurant: 'Restoran Paneli',
  courier: 'Kuryer Paneli',
};

const roleDashboardPaths = {
  admin: '/admin',
  restaurant: '/restaurant-dashboard',
  courier: '/courier-dashboard',
};

export default function Navbar({ darkMode, toggleTheme }) {
  const { user, setIsAuthModalOpen, logout, unreadNotificationsCount } = useAuth();
  const { cartItems, setIsCartOpen } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dashboardPath = roleDashboardPaths[user?.role] || '/admin';

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl transition-colors duration-300 dark:border-slate-800/80 dark:bg-[#0f172a]/80 ios-safe-top">
      <div className="max-w-7xl mx-auto h-[72px] px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-all duration-300">
            <Utensils size={22} />
          </div>
          <span className="text-lg sm:text-xl font-bold tracking-tight text-secondary">
            Food<span className="text-primary">Map</span>
          </span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-sm font-medium text-text-muted hover:text-primary transition-colors flex items-center gap-1">
             <MapPin size={18} />
             Xarita
          </Link>
          <Link to="/" className="text-sm font-medium text-text-muted hover:text-primary transition-colors">
            Restoranlar
          </Link>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme} 
            className="touch-target inline-flex items-center justify-center rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-text-muted transition-colors"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </motion.button>
          
          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/profile" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <User size={18} />
                </div>
                <span className="hidden sm:block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {user.username}
                </span>
              </Link>
              <Link
                to="/profile"
                className="relative touch-target inline-flex items-center justify-center rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
                title="Bildirishnomalar"
              >
                <Bell size={18} />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-[#0f172a]">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </Link>
              {['admin', 'restaurant', 'courier'].includes(user.role) && (
                <Link to={dashboardPath} className="touch-target inline-flex items-center justify-center rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors" title={roleTitles[user.role] || 'Panel'}>
                  <Settings size={18} />
                </Link>
              )}
              <button 
                onClick={logout}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 dark:border-red-900/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-colors"
              >
                <LogOut size={16} />
                Chiqish
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-orange-600 text-white font-medium shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300"
            >
              <User size={18} />
              Kirish
            </button>
          )}

          {/* Cart Icon */}
          <button 
            onClick={() => setIsCartOpen(true)}
            className="touch-target relative inline-flex items-center justify-center rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <ShoppingBag size={22} />
            {cartItems.length > 0 && (
              <span className="absolute 1 top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-[#0f172a]">
                {cartItems.length}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden touch-target -mr-1 inline-flex items-center justify-center rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white/98 dark:bg-[#0f172a]/98 shadow-xl overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 ios-safe-bottom space-y-3 flex flex-col items-center text-center">
              <Link onClick={closeMobileMenu} to="/" className="w-full py-3 px-4 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-100 dark:border-slate-800 flex justify-center items-center gap-2">
                 <MapPin size={18} />
                 Xarita
              </Link>
              <Link onClick={closeMobileMenu} to="/" className="w-full py-3 px-4 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-100 dark:border-slate-800 flex justify-center items-center gap-2">
                 <Utensils size={18} />
                 Restoranlar
              </Link>

              {user ? (
                <>
                  <Link onClick={closeMobileMenu} to="/profile" className="w-full py-3 px-4 rounded-xl font-medium bg-primary/10 text-primary border border-primary/20 flex justify-center items-center gap-2">
                    <User size={18} />
                    Mening Profilim ({user.username})
                  </Link>
                  <Link onClick={closeMobileMenu} to="/profile" className="w-full py-3 px-4 rounded-xl font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex justify-center items-center gap-2">
                    <Bell size={18} />
                    Bildirishnomalar {unreadNotificationsCount > 0 ? `(${unreadNotificationsCount})` : ''}
                  </Link>
                  {['admin', 'restaurant', 'courier'].includes(user.role) && (
                    <Link onClick={closeMobileMenu} to={dashboardPath} className="w-full py-3 px-4 rounded-xl font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex justify-center items-center gap-2">
                      <Settings size={18} />
                      {roleTitles[user.role] || 'Panel'}
                    </Link>
                  )}
                  <button 
                    onClick={() => { logout(); closeMobileMenu(); }}
                    className="w-full py-3 px-4 rounded-xl border border-red-200 dark:border-red-900/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-colors flex justify-center items-center gap-2"
                  >
                    <LogOut size={18} />
                    Chiqish
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => { setIsAuthModalOpen(true); closeMobileMenu(); }}
                  className="w-full py-3.5 mt-2 rounded-xl bg-primary text-white font-medium shadow-lg shadow-primary/25 flex justify-center items-center gap-2"
                >
                  <User size={18} />
                  Maxsus panelga kirish
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
