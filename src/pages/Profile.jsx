import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, ShoppingBag, Heart, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function Profile() {
  const { user, token, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${API_URL}/api/orders/myorders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setOrders(data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchOrders();
    }
  }, [token]);

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-slate-500">Iltimos, avval tizimga kiring.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-900 overflow-y-auto p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <User size={48} />
          </div>
          <div className="flex-1 text-center md:text-left space-y-1">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{user.username}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1"><Mail size={14}/> {user.email}</span>
              <span className="flex items-center gap-1 font-medium text-primary"><Shield size={14}/> {user.role === 'admin' ? 'Admin' : 'Foydalanuvchi'}</span>
            </div>
          </div>
          <button 
            onClick={logout}
            className="px-6 py-2 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-colors"
          >
            Chiqish
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Orders Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShoppingBag size={20} className="text-primary" />
              Buyurtmalarim
            </h2>
            <div className="space-y-3">
              {loading ? (
                <div className="flex justify-center p-4"><Loader2 className="animate-spin text-primary" /></div>
              ) : orders.length === 0 ? (
                <p className="text-sm text-slate-500 italic">Hozircha buyurtmalar yo'q.</p>
              ) : (
                orders.map(order => (
                  <div key={order._id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-800 dark:text-white">{order.restaurant?.name}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-600' : 
                        order.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 space-y-1">
                      <p>{order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{order.totalPrice.toLocaleString()} so'm</p>
                      <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Favorites Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Heart size={20} className="text-red-500" />
              Saqlanganlar
            </h2>
            <div className="space-y-3">
              {user.favorites?.length === 0 ? (
                <p className="text-sm text-slate-500 italic">Hozircha saqlangan restoranlar yo'q.</p>
              ) : (
                user.favorites?.map(fav => (
                  <a key={fav._id} href={`/restaurant/${fav._id}`} className="block bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-primary transition-colors">
                    <h3 className="font-bold text-slate-800 dark:text-white">{fav.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{fav.address}</p>
                  </a>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
