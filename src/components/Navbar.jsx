import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, MapPin, Menu, Moon, Settings, Sun, User, Utensils } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useOverlay from '../hooks/useOverlay';
import { OVERLAYS } from '../constants/overlay';
import MobileDrawer from './navbar/MobileDrawer';

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
  const { user, logout } = useAuth();
  const drawerOverlay = useOverlay(OVERLAYS.DRAWER);
  const authOverlay = useOverlay(OVERLAYS.AUTH);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const dashboardPath = roleDashboardPaths[user?.role] || '/admin';
  const isMobileMenuOpen = drawerOverlay.isOpen;
  const closeMobileMenu = drawerOverlay.close;

  const iconButtonClass =
    'inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/80 backdrop-blur-md transition-all duration-200 hover:bg-white/20 hover:text-white active:scale-95';

  const navLinkClass = (active) =>
    `flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-all duration-300 ${
      active ? 'bg-white/10 text-white' : 'text-white/72 hover:text-white'
    }`;

  const pillButtonClass =
    'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-white/85 backdrop-blur-md transition-all duration-200 hover:bg-white/10';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isUserMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isUserMenuOpen]);

  const isActivePath = useMemo(
    () => (path) => (path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)),
    [location.pathname]
  );

  const openRestaurantsPanel = () => {
    if (location.pathname !== '/') {
      navigate('/#restaurants');
      return;
    }

    window.location.hash = 'restaurants';
    window.dispatchEvent(new CustomEvent('marketplace:open-restaurants-panel'));
  };

  return (
    <nav
      className={`fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl transition-all duration-300 ios-safe-top ${
        isScrolled ? 'shadow-md shadow-black/25 backdrop-blur-2xl' : ''
      }`}
    >
      <div className="mx-auto flex h-13 max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-[#ffcc33] text-slate-950 shadow-[0_10px_24px_rgba(255,204,51,0.22)] sm:h-10 sm:w-10">
            <Utensils size={16} />
          </div>
          <span className="text-sm font-semibold tracking-tight text-white sm:text-lg">
            Food<span className="text-[#ffcc33]">Map</span>
          </span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          <Link to="/" className={navLinkClass(isActivePath('/'))}>
            <MapPin size={16} />
            Xarita
          </Link>
          <button
            type="button"
            onClick={openRestaurantsPanel}
            className={navLinkClass(location.pathname === '/' && location.hash === '#restaurants')}
          >
            Restoranlar
          </button>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className={`${iconButtonClass} hidden md:inline-flex`}
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </motion.button>

          {!user ? (
            <button
              type="button"
              onClick={authOverlay.open}
              className={`${iconButtonClass} hidden md:inline-flex`}
              aria-label="Kirish"
            >
              <User className="h-5 w-5" />
            </button>
          ) : (
            <>
              <Link
                to="/profile"
                className={`${iconButtonClass} relative hidden md:inline-flex`}
                title="Profil"
                aria-label="Profil"
              >
                <User className="h-5 w-5" />
              </Link>
              {['admin', 'restaurant', 'courier'].includes(user.role) && (
                <Link to={dashboardPath} className={`${iconButtonClass} hidden md:inline-flex`} title={roleTitles[user.role] || 'Panel'}>
                  <Settings className="h-5 w-5" />
                </Link>
              )}
            </>
          )}

          <button
            onClick={drawerOverlay.open}
            className={`md:hidden !h-9 !w-9 ${iconButtonClass}`}
            aria-label="Menyu"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>

          {user ? (
            <div className="hidden items-center gap-2 md:flex">
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium backdrop-blur-md transition-all duration-200 ${
                    isUserMenuOpen || isActivePath('/profile')
                      ? 'border-white/20 bg-white/10 text-white'
                      : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {user.username}
                </button>

                {isUserMenuOpen ? (
                  <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-52 rounded-3xl border border-white/10 bg-slate-950/92 p-2 shadow-2xl backdrop-blur-xl">
                    <div className="mb-2 border-b border-white/8 px-3 pb-2 pt-1">
                      <p className="text-sm font-semibold text-white">{user.username}</p>
                      <p className="truncate text-xs text-white/45">{user.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-2xl px-3 py-2 text-sm text-white/82 transition-all duration-200 hover:bg-white/10 hover:text-white"
                    >
                      <User size={16} />
                      Profil
                    </Link>

                    {['admin', 'restaurant', 'courier'].includes(user.role) ? (
                      <Link
                        to={dashboardPath}
                        onClick={() => setIsUserMenuOpen(false)}
                        className="mt-1 flex items-center gap-2 rounded-2xl px-3 py-2 text-sm text-white/82 transition-all duration-200 hover:bg-white/10 hover:text-white"
                      >
                        <Settings size={16} />
                        {roleTitles[user.role] || 'Panel'}
                      </Link>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="mt-1 flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-sm text-red-400 transition-all duration-200 hover:bg-red-400/10"
                    >
                      <LogOut size={16} />
                      Chiqish
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <button
              onClick={authOverlay.open}
              className={`hidden md:inline-flex ${pillButtonClass} border-white/20 text-white/90`}
            >
              Kirish
            </button>
          )}
        </div>
      </div>

      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
        user={user}
        onLogin={authOverlay.open}
        darkMode={darkMode}
        onToggleTheme={toggleTheme}
        onLogout={logout}
        dashboardPath={['admin', 'restaurant', 'courier'].includes(user?.role) ? dashboardPath : ''}
        dashboardTitle={roleTitles[user?.role] || 'Panel'}
        isActivePath={isActivePath}
      />
    </nav>
  );
}
