import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, LogOut, MapPin, Settings, User, Utensils, X } from 'lucide-react';
import UserProfile from './UserProfile';

export default function MobileDrawer({
  isOpen,
  onClose,
  user,
  onLogin,
  onLogout,
  unreadNotificationsCount,
  dashboardPath,
  dashboardTitle,
  isActivePath,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const itemClass = (active) =>
    `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 ${
      active ? 'bg-white/10 text-white' : 'text-white/78'
    }`;

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-950/58 backdrop-blur-sm md:hidden"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed right-0 top-0 z-50 flex h-dvh w-64 flex-col border-l border-white/10 bg-[#0f172a] px-4 pb-6 pt-5 shadow-[0_24px_80px_rgba(2,6,23,0.58)] md:hidden ios-safe-top ios-safe-bottom"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/35">Menyu</p>
                <p className="mt-1 text-base font-semibold text-white">FoodMap</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-white/82"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-5">
              <UserProfile user={user} onLogin={onLogin} />
            </div>

            <div className="space-y-1">
              <Link onClick={onClose} to="/" className={itemClass(isActivePath('/'))}>
                <MapPin size={18} />
                Xarita
              </Link>
              <Link onClick={onClose} to="/" className={itemClass(isActivePath('/restaurants'))}>
                <Utensils size={18} />
                Restoranlar
              </Link>

              {user ? (
                <>
                  <Link onClick={onClose} to="/profile" className={itemClass(isActivePath('/profile'))}>
                    <User size={18} />
                    Profil
                  </Link>
                  <Link onClick={onClose} to="/profile" className={itemClass(isActivePath('/profile'))}>
                    <Bell size={18} />
                    Bildirishnomalar {unreadNotificationsCount > 0 ? `(${unreadNotificationsCount})` : ''}
                  </Link>
                  {dashboardPath ? (
                    <Link onClick={onClose} to={dashboardPath} className={itemClass(isActivePath(dashboardPath))}>
                      <Settings size={18} />
                      {dashboardTitle}
                    </Link>
                  ) : null}
                </>
              ) : null}
            </div>

            {user ? (
              <div className="mt-auto pt-5">
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-400"
                >
                  <LogOut size={18} />
                  Chiqish
                </button>
              </div>
            ) : null}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
