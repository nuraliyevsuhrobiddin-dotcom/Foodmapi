import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { X, Trash2, Plus, Minus, ShoppingBag, Loader2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const normalizePhoneInput = (value) => {
  const trimmed = value.replace(/[^\d+\s()-]/g, '');
  if (trimmed.startsWith('+')) {
    return `+${trimmed.slice(1).replace(/[+]/g, '')}`;
  }
  return trimmed.replace(/[+]/g, '');
};

const normalizePhoneValue = (value) => value.replace(/[^\d]/g, '');

const normalizeCoordinateValue = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const normalizeTextField = (value) => value.trim().replace(/\s+/g, ' ');

export default function CartSidebar() {
  const { isCartOpen, setIsCartOpen, cartItems, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart();
  const { user, token, setIsAuthModalOpen } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [deliveryLabel, setDeliveryLabel] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryLat, setDeliveryLat] = useState('');
  const [deliveryLng, setDeliveryLng] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Brauzeringiz geolokatsiyani qo'llab-quvvatlamaydi.");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDeliveryLat(String(position.coords.latitude));
        setDeliveryLng(String(position.coords.longitude));
        toast.success("Lokatsiya aniqlandi.");
        setIsLocating(false);
      },
      () => {
        toast.error("Lokatsiyani aniqlab bo'lmadi. Ruxsatlarni tekshirib qayta urinib ko'ring.");
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      toast.error("Promokodni kiriting.");
      return;
    }

    setIsApplyingPromo(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/promocodes/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: promoCode.trim(),
          subtotal: cartTotal,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Promokodni qo'llab bo'lmadi");
      }

      setAppliedPromo(data.data);
      toast.success(`Promokod qo'llandi: -${Math.round(data.data.discountAmount).toLocaleString()} UZS`);
    } catch (err) {
      setAppliedPromo(null);
      toast.error(err.message || "Promokod xato");
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    
    if (!user) {
      setIsCartOpen(false);
      setIsAuthModalOpen(true);
      return toast.error("Buyurtma berish uchun tizimga kirish talab etiladi.");
    }

    const normalizedPhone = normalizePhoneValue(customerPhone);
    const normalizedDeliveryLabel = normalizeTextField(deliveryLabel);
    const normalizedDeliveryAddress = normalizeTextField(deliveryAddress);
    const normalizedLat = normalizeCoordinateValue(deliveryLat);
    const normalizedLng = normalizeCoordinateValue(deliveryLng);

    if (!normalizedPhone) {
      return toast.error("Telefon raqamingizni kiriting.");
    }

    if (normalizedPhone.length < 9 || normalizedPhone.length > 15) {
      return toast.error("Telefon raqamini to'g'ri formatda kiriting.");
    }

    if (normalizedDeliveryLabel && normalizedDeliveryLabel.length < 2) {
      return toast.error("Manzil nomi juda qisqa.");
    }

    if (!normalizedDeliveryAddress) {
      return toast.error("Yetkazib berish manzilini kiriting.");
    }

    if (normalizedDeliveryAddress.length < 6) {
      return toast.error("Manzilni to'liqroq kiriting.");
    }

    if (normalizedLat === null || normalizedLng === null) {
      return toast.error("Lokatsiya koordinatalarini ham kiriting.");
    }

    if (normalizedLat < -90 || normalizedLat > 90) {
      return toast.error("Latitude noto'g'ri.");
    }

    if (normalizedLng < -180 || normalizedLng > 180) {
      return toast.error("Longitude noto'g'ri.");
    }
    
    setIsSubmitting(true);
    
    // Group by restaurantId
    const grouped = cartItems.reduce((acc, item) => {
      const rid = item.restaurantId;
      if (!rid) return acc; // safety fallback
      if (!acc[rid]) acc[rid] = { items: [], total: 0 };
      acc[rid].items.push({ name: item.name, quantity: item.quantity, price: item.price });
      acc[rid].total += item.price * item.quantity;
      return acc;
    }, {});
    
    try {
      const qs = Object.keys(grouped).map(rid => 
        (() => {
          const subtotal = grouped[rid].total;
          const discountAmount = appliedPromo
            ? (appliedPromo.discountType === 'fixed'
                ? Math.min(appliedPromo.discountValue, subtotal)
                : Math.min((subtotal * appliedPromo.discountValue) / 100, subtotal))
            : 0;
          const totalPrice = Math.max(subtotal - discountAmount, 0);

          return fetch(`${import.meta.env.VITE_API_URL || ''}/api/orders`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({
             restaurant: rid,
             items: grouped[rid].items,
             subtotal,
             totalPrice,
             paymentMethod: 'cash',
             paymentStatus: 'unpaid',
             deliveryFee: 0,
             promoCode: appliedPromo?.code || '',
             discountAmount,
             customerPhone: normalizedPhone,
             deliveryAddress: {
               label: normalizedDeliveryLabel,
               address: normalizedDeliveryAddress,
               lat: normalizedLat,
               lng: normalizedLng,
             },
          })
        }).then(res => {
          if(!res.ok) throw new Error("Tarmoq xatosi");
          return res.json();
        });
        })()
      );
      
      await Promise.all(qs);
      toast.success("Muvaffaqiyatli buyurtma berildi! 'Profil' dan kuzatishingiz mumkin.", { duration: 5000 });
      clearCart();
      setCustomerPhone(user?.phone || '');
      setDeliveryLabel('');
      setDeliveryAddress('');
      setDeliveryLat('');
      setDeliveryLng('');
      setPromoCode('');
      setAppliedPromo(null);
      setIsCartOpen(false);
    } catch {
      toast.error("Buyurtma yuborishda xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-end sm:items-stretch">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Sidebar */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="relative w-full max-w-md h-[92vh] sm:h-full bg-white dark:bg-[#1e293b] shadow-2xl flex flex-col rounded-t-[28px] sm:rounded-none overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 sm:p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingBag size={24} className="text-primary" />
                Sizning Savatchangiz
              </h2>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="touch-target flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:p-6 space-y-5">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <ShoppingBag size={64} className="mb-4 text-slate-300" />
                  <p>Savatchangiz bo'sh!</p>
                  <p className="text-sm mt-2">Dastur menyusini ko'ring va mazali taomlardan bahramand bo'ling.</p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item._id} className="flex gap-3 sm:gap-4">
                    <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0">
                      <img src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 line-clamp-2">{item.name}</h4>
                        <button onClick={() => removeFromCart(item._id)} className="touch-target -mr-2 inline-flex items-center justify-center text-slate-400 hover:text-red-500">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-2xl px-2 py-1.5">
                          <button onClick={() => updateQuantity(item._id, -1)} className="touch-target inline-flex items-center justify-center text-slate-500 hover:text-primary"><Minus size={14}/></button>
                          <span className="font-semibold text-sm w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item._id, 1)} className="touch-target inline-flex items-center justify-center text-slate-500 hover:text-primary"><Plus size={14}/></button>
                        </div>
                        <span className="font-bold text-primary">{item.price * item.quantity} UZS</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="px-4 pt-4 pb-5 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 ios-safe-bottom-lg">
                <div className="mb-5 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                      Promokod
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="PROMO10"
                        className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3.5 outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        disabled={isApplyingPromo}
                        className="rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-60"
                      >
                        {isApplyingPromo ? "Tekshirilmoqda..." : "Qo'llash"}
                      </button>
                    </div>
                    {appliedPromo && (
                      <div className="mt-2 text-sm text-emerald-600 dark:text-emerald-300">
                        Aktiv: {appliedPromo.code} (-{Math.round(appliedPromo.discountAmount).toLocaleString()} UZS)
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                      Telefon raqam
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(normalizePhoneInput(e.target.value))}
                      placeholder="+998 90 123 45 67"
                      inputMode="tel"
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3.5 outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                      Manzil nomi
                    </label>
                    <input
                      type="text"
                      value={deliveryLabel}
                      onChange={(e) => setDeliveryLabel(e.target.value)}
                      placeholder="Masalan: Uy, Ofis"
                      minLength={2}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3.5 outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                      Yetkazib berish manzili
                    </label>
                    <textarea
                      rows={3}
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Ko'cha, uy raqami, mo'ljal"
                      minLength={6}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3.5 outline-none focus:border-primary resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                        Latitude
                      </label>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="-90"
                        max="90"
                        step="any"
                        value={deliveryLat}
                        onChange={(e) => setDeliveryLat(e.target.value)}
                        placeholder="41.3111"
                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3.5 outline-none focus:border-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                        Longitude
                      </label>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="-180"
                        max="180"
                        step="any"
                        value={deliveryLng}
                        onChange={(e) => setDeliveryLng(e.target.value)}
                        placeholder="69.2797"
                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3.5 outline-none focus:border-primary"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isLocating}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-60"
                  >
                    {isLocating ? "Aniqlanmoqda..." : "Mening joylashuvimni aniqlash"}
                  </button>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-500 font-medium">Jami Summa:</span>
                  <span className="text-2xl font-bold">{cartTotal.toLocaleString()} UZS</span>
                </div>
                {appliedPromo && (
                  <div className="flex justify-between items-center mb-4 text-emerald-600 dark:text-emerald-300">
                    <span className="font-medium">Chegirma:</span>
                    <span className="font-bold">-{Math.round(appliedPromo.discountAmount).toLocaleString()} UZS</span>
                  </div>
                )}
                <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-500 font-medium">To'lanadi:</span>
                  <span className="text-2xl font-bold">
                    {Math.max(cartTotal - Math.round(appliedPromo?.discountAmount || 0), 0).toLocaleString()} UZS
                  </span>
                </div>
                <button 
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-primary text-white flex items-center justify-center gap-2 rounded-2xl font-bold shadow-lg shadow-primary/30 hover:bg-orange-600 transition-colors disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : "Buyurtma qilish"}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
