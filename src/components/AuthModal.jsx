import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import useOverlay from '../hooks/useOverlay';
import { OVERLAYS } from '../constants/overlay';
import { X, Mail, Lock, User as UserIcon, Eye, EyeOff } from 'lucide-react';

export default function AuthModal() {
  const { login, register } = useAuth();
  const authOverlay = useOverlay(OVERLAYS.AUTH);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let res;
    if (isLogin) {
      res = await login(formData.email, formData.password);
    } else {
      res = await register(formData.username, formData.email, formData.password, formData.phone);
    }

    setLoading(false);
    if (res.success) {
      authOverlay.close();
    } else {
      setError(res.message);
    }
  };

  if (!authOverlay.isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center px-3 py-3 sm:items-center sm:px-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={authOverlay.close}
          className="absolute inset-0 z-40 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-50 w-full max-w-md bg-white dark:bg-slate-900 rounded-[28px] sm:rounded-3xl shadow-2xl p-5 sm:p-8 overflow-hidden ios-safe-bottom"
        >
          <button 
            onClick={authOverlay.close}
            className="absolute top-4 right-4 touch-target flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <X size={18} />
          </button>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
              {isLogin ? "Hush kelibsiz!" : "Ro'yxatdan o'tish"}
            </h2>
            <p className="text-slate-500 text-sm">
              {isLogin ? "Ma'lumotlaringizni kiriting" : "Yangi hisob yarating"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-xl text-center font-medium">
                {error}
              </div>
            )}

            {!isLogin && (
              <>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    required
                    type="text" 
                    placeholder="Ismingiz" 
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-primary transition-colors dark:text-white"
                  />
                </div>
                <div className="relative">
                  <input 
                    type="tel" 
                    placeholder="Telefon raqam" 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-primary transition-colors dark:text-white"
                  />
                </div>
              </>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                required
                type="email" 
                placeholder="Email pochta" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-primary transition-colors dark:text-white"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                required
                type={showPassword ? "text" : "password"} 
                placeholder="Parol" 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full pl-11 pr-12 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-primary transition-colors dark:text-white"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 touch-target -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors inline-flex items-center justify-center"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <button type="button" onClick={() => alert("Hozircha tizimda parolni tiklash pochta orqali amalga oshmaydi. Iltimos adminga murojaat qiling.")} className="text-sm text-primary font-medium hover:underline">
                  Parolni unutdingizmi?
                </button>
              </div>
            )}

            <button 
              disabled={loading}
              className="w-full bg-primary hover:bg-orange-600 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-70"
            >
              {loading ? "Kuting..." : (isLogin ? "Kirish" : "Ro'yxatdan O'tish")}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {isLogin ? "Hisobingiz yo'qmi?" : "Allaqachon hisobingiz bormi?"}{" "}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-semibold hover:underline"
            >
              {isLogin ? "Ro'yxatdan o'tish" : "Kirish"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
