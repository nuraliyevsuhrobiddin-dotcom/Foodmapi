import { Link } from 'react-router-dom';
import { LogOut, Shield, User } from 'lucide-react';

export default function AdminHeader({ user, onLogout }) {
  return (
    <div className="sticky top-[56px] z-30 -mx-3 mb-4 border-b border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.92),rgba(15,23,42,0.84))] px-4 py-3 backdrop-blur-2xl sm:top-[64px] sm:-mx-8 sm:mb-6 sm:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <Shield size={18} />
          </div>
          <div>
            <p className="text-lg font-semibold text-white">Admin</p>
            <p className="text-xs text-white/45">{user?.username || 'Boshqaruv'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/profile"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/80 backdrop-blur-md transition-all duration-200 hover:bg-white/10"
          >
            <User size={18} />
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-red-400/20 bg-red-500/10 text-red-300 backdrop-blur-md transition-all duration-200 hover:bg-red-500/15"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
