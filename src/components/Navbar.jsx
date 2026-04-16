import { Link } from 'react-router-dom';
import { MapPin, Moon, Sun, User, Utensils, LogOut, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ darkMode, toggleTheme }) {
  const { user, setIsAuthModalOpen, logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 h-[72px] z-50 bg-white/70 dark:bg-[#0f172a]/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-all duration-300">
            <Utensils size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight text-secondary">
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

        <div className="flex items-center gap-4">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme} 
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-text-muted transition-colors"
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
              {user.role === 'admin' && (
                <Link to="/admin" className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors" title="Boshqaruv Paneli">
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
        </div>
      </div>
    </nav>
  );
}
