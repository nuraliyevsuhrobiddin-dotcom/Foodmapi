import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { X, Trash2, Plus, Minus, ShoppingBag, Loader2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function CartSidebar() {
  const { isCartOpen, setIsCartOpen, cartItems, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart();
  const { user, token, setIsAuthModalOpen } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    
    if (!user) {
      setIsCartOpen(false);
      setIsAuthModalOpen(true);
      return toast.error("Buyurtma berish uchun tizimga kirish talab etiladi.");
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
        fetch(`${import.meta.env.VITE_API_URL || ''}/api/orders`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({
             restaurant: rid,
             items: grouped[rid].items,
             totalPrice: grouped[rid].total
          })
        }).then(res => {
          if(!res.ok) throw new Error("Tarmoq xatosi");
          return res.json();
        })
      );
      
      await Promise.all(qs);
      toast.success("Muvaffaqiyatli buyurtma berildi! 'Profil' dan kuzatishingiz mumkin.", { duration: 5000 });
      clearCart();
      setIsCartOpen(false);
    } catch (err) {
      toast.error("Buyurtma yuborishda xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
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
            className="relative w-full max-w-md h-full bg-white dark:bg-[#1e293b] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingBag size={24} className="text-primary" />
                Sizning Savatchangiz
              </h2>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <ShoppingBag size={64} className="mb-4 text-slate-300" />
                  <p>Savatchangiz bo'sh!</p>
                  <p className="text-sm mt-2">Dastur menyusini ko'ring va mazali taomlardan bahramand bo'ling.</p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item._id} className="flex gap-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                      <img src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 line-clamp-2">{item.name}</h4>
                        <button onClick={() => removeFromCart(item._id)} className="text-slate-400 hover:text-red-500">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1">
                          <button onClick={() => updateQuantity(item._id, -1)} className="text-slate-500 hover:text-primary"><Minus size={14}/></button>
                          <span className="font-semibold text-sm w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item._id, 1)} className="text-slate-500 hover:text-primary"><Plus size={14}/></button>
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
              <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-500 font-medium">Jami Summa:</span>
                  <span className="text-2xl font-bold">{cartTotal.toLocaleString()} UZS</span>
                </div>
                <button 
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-primary text-white flex items-center justify-center gap-2 rounded-xl font-bold shadow-lg shadow-primary/30 hover:bg-orange-600 transition-colors disabled:opacity-70"
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
