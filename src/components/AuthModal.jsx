import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import useOverlay from '../hooks/useOverlay';
import { OVERLAYS } from '../constants/overlay';
import { X, Mail, Lock, User as UserIcon, Eye, EyeOff, KeyRound } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function AuthModal() {
  const { login, register } = useAuth();
  const authOverlay = useOverlay(OVERLAYS.AUTH);
  const [mode, setMode] = useState('login');
  const [formData, setFormData] = useState({ username: '', email: '', phone: '', password: '' });
  const [resetData, setResetData] = useState({ email: '', code: '', password: '' });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  const isLogin = mode === 'login';
  const isRegister = mode === 'register';
  const isForgot = mode === 'forgot';

  const headerText = useMemo(() => {
    if (isRegister) {
      return {
        title: "Ro'yxatdan o'tish",
        subtitle: 'Yangi hisob yarating',
      };
    }

    if (isForgot) {
      return {
        title: 'Parolni tiklash',
        subtitle: "Email va tiklash kodi orqali yangi parol o'rnating",
      };
    }

    return {
      title: 'Hush kelibsiz!',
      subtitle: "Ma'lumotlaringizni kiriting",
    };
  }, [isForgot, isRegister]);

  const resetUiState = () => {
    setError('');
    setSuccessMessage('');
    setLoading(false);
    setShowPassword(false);
    setShowResetPassword(false);
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    resetUiState();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    if (isForgot) {
      setLoading(false);
      return;
    }

    const res = isLogin
      ? await login(formData.email, formData.password)
      : await register(formData.username, formData.email, formData.password, formData.phone);

    setLoading(false);
    if (res.success) {
      authOverlay.close();
    } else {
      setError(res.message);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetData.email }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Tiklash kodini yuborib bo'lmadi");
      }

      if (data.resetCode) {
        setSuccessMessage(`Sinov kodi: ${data.resetCode}. Uni pastdagi maydonga kiriting.`);
      } else {
        setSuccessMessage(data.message || 'Tiklash kodi emailingizga yuborildi.');
      }
    } catch (err) {
      setError(err.message || "Serverga ulanib bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resetData),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Parolni yangilab bo'lmadi");
      }

      setSuccessMessage('Parol yangilandi. Endi yangi parol bilan kirishingiz mumkin.');
      setResetData((prev) => ({ ...prev, code: '', password: '' }));
      setMode('login');
      setFormData((prev) => ({ ...prev, email: resetData.email, password: '' }));
    } catch (err) {
      setError(err.message || "Serverga ulanib bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  if (!authOverlay.isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center px-3 py-3 sm:items-center sm:px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={authOverlay.close}
          className="absolute inset-0 z-40 bg-black/50 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-50 w-full max-w-md overflow-hidden rounded-[28px] bg-white p-5 shadow-2xl ios-safe-bottom dark:bg-slate-900 sm:rounded-3xl sm:p-8"
        >
          <button
            onClick={authOverlay.close}
            className="absolute right-4 top-4 touch-target flex items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition-colors hover:text-slate-800 dark:bg-slate-800 dark:hover:text-white"
          >
            <X size={18} />
          </button>

          <div className="mb-8 text-center">
            <h2 className="mb-2 text-2xl font-bold text-slate-800 dark:text-white">{headerText.title}</h2>
            <p className="text-sm text-slate-500">{headerText.subtitle}</p>
          </div>

          {!isForgot ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error ? (
                <div className="rounded-xl bg-red-50 p-3 text-center text-sm font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  {error}
                </div>
              ) : null}

              {!isLogin ? (
                <>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      required
                      type="text"
                      placeholder="Ismingiz"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="Telefon raqam"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </>
              ) : null}

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  required
                  type="email"
                  placeholder="Email pochta"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Parol"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 inline-flex touch-target -translate-y-1/2 items-center justify-center text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {isLogin ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleModeChange('forgot')}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Parolni unutdingizmi?
                  </button>
                </div>
              ) : null}

              <button
                disabled={loading}
                className="w-full rounded-xl bg-primary py-3.5 font-semibold text-white shadow-lg shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-70 hover:bg-orange-600"
              >
                {loading ? 'Kuting...' : isLogin ? 'Kirish' : "Ro'yxatdan O'tish"}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              {error ? (
                <div className="rounded-xl bg-red-50 p-3 text-center text-sm font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  {error}
                </div>
              ) : null}

              {successMessage ? (
                <div className="rounded-xl bg-emerald-50 p-3 text-center text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  {successMessage}
                </div>
              ) : null}

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  required
                  type="email"
                  placeholder="Email pochta"
                  value={resetData.email}
                  onChange={(e) => setResetData({ ...resetData, email: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading || !resetData.email}
                className="w-full rounded-xl border border-white/10 bg-white/10 py-3 font-semibold text-slate-800 transition-all active:scale-[0.98] disabled:opacity-70 dark:text-white"
              >
                {loading ? 'Kuting...' : 'Tiklash kodini olish'}
              </button>

              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="6 xonali tiklash kodi"
                  value={resetData.code}
                  onChange={(e) => setResetData({ ...resetData, code: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type={showResetPassword ? 'text' : 'password'}
                  placeholder="Yangi parol"
                  value={resetData.password}
                  onChange={(e) => setResetData({ ...resetData, password: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowResetPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 inline-flex touch-target -translate-y-1/2 items-center justify-center text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showResetPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button
                type="button"
                onClick={handleResetPassword}
                disabled={loading || !resetData.email || !resetData.code || !resetData.password}
                className="w-full rounded-xl bg-primary py-3.5 font-semibold text-white shadow-lg shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-70 hover:bg-orange-600"
              >
                {loading ? 'Kuting...' : 'Parolni yangilash'}
              </button>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-slate-500">
            {isForgot ? (
              <>
                Esladingizmi?{' '}
                <button
                  onClick={() => handleModeChange('login')}
                  className="font-semibold text-primary hover:underline"
                >
                  Kirishga qaytish
                </button>
              </>
            ) : (
              <>
                {isLogin ? "Hisobingiz yo'qmi?" : 'Allaqachon hisobingiz bormi?'}{' '}
                <button
                  onClick={() => handleModeChange(isLogin ? 'register' : 'login')}
                  className="font-semibold text-primary hover:underline"
                >
                  {isLogin ? "Ro'yxatdan o'tish" : 'Kirish'}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
