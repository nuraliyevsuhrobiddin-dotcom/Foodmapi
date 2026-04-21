import { User } from 'lucide-react';

export default function UserProfile({ user, onLogin }) {
  if (!user) {
    return (
      <button
        type="button"
        onClick={onLogin}
        className="flex w-full items-center justify-center rounded-2xl bg-[#ffcc33] px-4 py-3 text-sm font-semibold text-slate-950"
      >
        Kirish / Ro&apos;yxatdan o&apos;tish
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ffcc33] text-slate-950">
        <User size={18} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white">{user.username}</p>
        <p className="truncate text-xs text-white/45">{user.email || 'FoodMap foydalanuvchisi'}</p>
      </div>
    </div>
  );
}
