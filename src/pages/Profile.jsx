import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { User, Mail, Shield, ShoppingBag, Heart, Loader2, Bell, MapPin, X, ChevronRight, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import FormField from '../components/FormField';

const API_URL = import.meta.env.VITE_API_URL || '';

const roleLabels = {
  admin: 'Admin',
  restaurant: 'Restoran egasi',
  courier: 'Kuryer',
  customer: 'Foydalanuvchi',
};

const orderStatusClasses = {
  delivered: 'bg-green-100 text-green-600',
  cancelled: 'bg-red-100 text-red-600',
  cooking: 'bg-orange-100 text-orange-600',
  delivering: 'bg-purple-100 text-purple-600',
  confirmed: 'bg-sky-100 text-sky-600',
  pending: 'bg-blue-100 text-blue-600',
};

const trackingSteps = ['pending', 'confirmed', 'cooking', 'delivering', 'delivered'];

const orderStatusLabels = {
  pending: 'Qabul qilindi',
  confirmed: 'Tasdiqlandi',
  cooking: 'Tayyorlanmoqda',
  delivering: 'Yo\'lda',
  delivered: 'Yetkazildi',
  cancelled: 'Bekor qilindi',
};

const orderPriority = {
  delivering: 0,
  cooking: 1,
  confirmed: 2,
  pending: 3,
  delivered: 4,
  cancelled: 5,
};

const getMapUrl = (lat, lng) => `https://www.google.com/maps?q=${lat},${lng}`;

const getDistanceKm = (order) => {
  const restaurantLng = order?.restaurant?.location?.coordinates?.[0];
  const restaurantLat = order?.restaurant?.location?.coordinates?.[1];
  const customerLat = order?.deliveryAddress?.lat;
  const customerLng = order?.deliveryAddress?.lng;

  if (
    restaurantLat === null || restaurantLat === undefined ||
    restaurantLng === null || restaurantLng === undefined ||
    customerLat === null || customerLat === undefined ||
    customerLng === null || customerLng === undefined
  ) {
    return null;
  }

  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(customerLat - restaurantLat);
  const deltaLng = toRadians(customerLng - restaurantLng);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(restaurantLat)) *
      Math.cos(toRadians(customerLat)) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const getEtaMinutes = (distanceKm) => {
  if (distanceKm === null || distanceKm === undefined) return null;
  return Math.max(Math.round(distanceKm * 4 + 10), 10);
};

export default function Profile() {
  const {
    user,
    token,
    logout,
    updateProfile,
    updateCourierAvailability,
    updatePassword,
    toggleFavorite,
    notifications,
    refreshNotifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    phone: '',
    vehicleType: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [orderTab, setOrderTab] = useState('active');
  const [, setNow] = useState(Date.now());

  const refreshOrders = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/orders/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    setProfileForm({
      username: user?.username || '',
      email: user?.email || '',
      phone: user?.phone || '',
      vehicleType: user?.vehicleType || '',
    });
  }, [user]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (token) {
      refreshOrders();
      refreshNotifications().finally(() => setNotificationsLoading(false));
    } else {
      setOrders([]);
      setLoading(false);
      setNotificationsLoading(false);
    }
  }, [token, refreshNotifications, refreshOrders]);

  useEffect(() => {
    const refreshProfileData = async () => {
      if (!token) return;
      await refreshOrders();
      await refreshNotifications();
    };

    window.addEventListener('marketplace:order-created', refreshProfileData);
    window.addEventListener('marketplace:order-updated', refreshProfileData);
    window.addEventListener('marketplace:notification-created', refreshProfileData);
    window.addEventListener('marketplace:courier-location-updated', refreshProfileData);

    return () => {
      window.removeEventListener('marketplace:order-created', refreshProfileData);
      window.removeEventListener('marketplace:order-updated', refreshProfileData);
      window.removeEventListener('marketplace:notification-created', refreshProfileData);
      window.removeEventListener('marketplace:courier-location-updated', refreshProfileData);
    };
  }, [token, refreshNotifications, refreshOrders]);

  const orderGroups = useMemo(() => {
    const sortedOrders = [...orders].sort((firstOrder, secondOrder) => {
      const statusPriorityDiff =
        (orderPriority[firstOrder.status] ?? 99) - (orderPriority[secondOrder.status] ?? 99);

      if (statusPriorityDiff !== 0) {
        return statusPriorityDiff;
      }

      return new Date(secondOrder.createdAt) - new Date(firstOrder.createdAt);
    });

    return {
      active: sortedOrders.filter((order) => !['delivered', 'cancelled'].includes(order.status)),
      delivered: sortedOrders.filter((order) => order.status === 'delivered'),
      cancelled: sortedOrders.filter((order) => order.status === 'cancelled'),
    };
  }, [orders]);

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-slate-500">Iltimos, avval tizimga kiring.</p>
      </div>
    );
  }

  const activeOrders = orderGroups[orderTab];

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);

    const result = await updateProfile(profileForm);

    if (result.success) {
      toast.success("Profil yangilandi");
    } else {
      toast.error(result.message || "Profilni yangilab bo'lmadi");
    }

    setSavingProfile(false);
  };

  const handleAvailabilityToggle = async () => {
    setUpdatingAvailability(true);
    const result = await updateCourierAvailability(!user.isAvailable);

    if (result.success) {
      toast.success(result.data.isAvailable ? "Siz available holatidasiz" : "Siz busy holatiga o'tdingiz");
    } else {
      toast.error(result.message || "Availability yangilanmadi");
    }

    setUpdatingAvailability(false);
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error("Parol maydonlarini to'ldiring");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Yangi parollar mos emas");
      return;
    }

    setUpdatingPassword(true);
    const result = await updatePassword(passwordForm.currentPassword, passwordForm.newPassword);

    if (result.success) {
      toast.success(result.message || "Parol yangilandi");
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } else {
      toast.error(result.message || "Parol yangilanmadi");
    }

    setUpdatingPassword(false);
  };

  const handleRemoveFavorite = async (event, restaurantId) => {
    event.preventDefault();
    event.stopPropagation();

    const result = await toggleFavorite(restaurantId);

    if (result.success) {
      toast.success("Saqlanganlardan olib tashlandi");
    } else {
      toast.error(result.message || "Restoranni olib tashlab bo'lmadi");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(255,204,51,0.09),_transparent_18%),linear-gradient(180deg,#020617_0%,#0f172a_24%,#0f172a_100%)] px-3 py-4 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl space-y-6 sm:space-y-8 ios-safe-bottom">
        {/* Profile Card */}
        <div className="rounded-[32px] border border-white/10 bg-white/[0.06] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.28)] backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <div className="h-20 w-20 shrink-0 rounded-full bg-[#ffcc33]/12 flex items-center justify-center text-[#ffcc33] ring-1 ring-[#ffcc33]/20 sm:h-24 sm:w-24">
            <User size={48} />
          </div>
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="inline-flex rounded-full bg-white/[0.08] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/40">
              FoodMap account
            </div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">{user.username}</h1>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-white/55 md:justify-start">
              <span className="flex items-center gap-1"><Mail size={14}/> {user.email}</span>
              <span className="flex items-center gap-1 font-medium text-[#ffcc33]"><Shield size={14}/> {roleLabels[user.role] || 'Foydalanuvchi'}</span>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full md:w-auto rounded-2xl border border-red-400/20 bg-red-500/12 px-6 py-3 font-medium text-red-200 transition-colors hover:bg-red-500/18 touch-target"
          >
            Chiqish
          </button>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-white/[0.06] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.24)] backdrop-blur-xl sm:p-6">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl font-bold text-white">Profil ma'lumotlari</h2>
              <p className="text-sm text-white/52">Telefon va aloqa ma'lumotlarini shu yerdan yangilang</p>
            </div>
          </div>

          <form onSubmit={handleProfileSave} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FormField label="Ism">
              <input
                type="text"
                value={profileForm.username}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, username: e.target.value }))}
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 text-white outline-none transition focus:border-[#ffcc33]/50 focus:bg-white/[0.08] focus:shadow-[0_0_0_4px_rgba(255,204,51,0.12)]"
              />
            </FormField>
            <FormField label="Email">
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 text-white outline-none transition focus:border-[#ffcc33]/50 focus:bg-white/[0.08] focus:shadow-[0_0_0_4px_rgba(255,204,51,0.12)]"
              />
            </FormField>
            <FormField label="Telefon">
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+998 90 123 45 67"
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 text-white outline-none transition focus:border-[#ffcc33]/50 focus:bg-white/[0.08] focus:shadow-[0_0_0_4px_rgba(255,204,51,0.12)]"
              />
            </FormField>
            {user.role === 'courier' && (
              <FormField label="Transport turi">
                <input
                  type="text"
                  value={profileForm.vehicleType}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, vehicleType: e.target.value }))}
                  placeholder="Masalan: scooter, bike, car"
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 text-white outline-none transition focus:border-[#ffcc33]/50 focus:bg-white/[0.08] focus:shadow-[0_0_0_4px_rgba(255,204,51,0.12)]"
                />
              </FormField>
            )}
            <div className={`${user.role === 'courier' ? 'md:col-span-4' : 'md:col-span-3'} flex justify-stretch md:justify-end`}>
              <button
                type="submit"
                disabled={savingProfile}
                className="w-full md:w-auto rounded-2xl bg-[#ffcc33] px-5 py-3.5 font-semibold text-slate-950 shadow-[0_18px_40px_rgba(255,204,51,0.2)] transition hover:brightness-105 disabled:opacity-60 touch-target"
              >
                {savingProfile ? "Saqlanmoqda..." : "Profilni saqlash"}
              </button>
            </div>
          </form>
        </div>

        {user.role === 'courier' && (
          <div className="rounded-[32px] border border-white/10 bg-white/[0.06] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.24)] backdrop-blur-xl sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Courier availability</h2>
                <p className="text-sm text-white/52">
                  Buyurtma olish holatingizni shu yerdan boshqaring
                </p>
              </div>
              <button
                type="button"
                onClick={handleAvailabilityToggle}
                disabled={updatingAvailability}
                className={`w-full md:w-auto rounded-2xl px-5 py-3.5 font-semibold transition-colors touch-target ${
                  user.isAvailable
                    ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                    : 'bg-white/[0.08] text-white hover:bg-white/[0.12]'
                } disabled:opacity-60`}
              >
                {updatingAvailability
                  ? "Yangilanmoqda..."
                  : user.isAvailable
                    ? 'Available'
                    : 'Busy'}
              </button>
            </div>
          </div>
        )}

        <div className="rounded-[32px] border border-white/10 bg-white/[0.06] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.24)] backdrop-blur-xl sm:p-6">
          <div className="mb-5">
            <h2 className="flex items-center gap-2 text-xl font-bold text-white"><ShieldCheck size={18} className="text-[#ffcc33]" />Parolni almashtirish</h2>
            <p className="text-sm text-white/52">Hisobingiz xavfsizligi uchun yangi parol o'rnating</p>
          </div>

          <form onSubmit={handlePasswordSave} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Joriy parol">
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 text-white outline-none transition focus:border-[#ffcc33]/50 focus:bg-white/[0.08] focus:shadow-[0_0_0_4px_rgba(255,204,51,0.12)]"
              />
            </FormField>
            <FormField label="Yangi parol">
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 text-white outline-none transition focus:border-[#ffcc33]/50 focus:bg-white/[0.08] focus:shadow-[0_0_0_4px_rgba(255,204,51,0.12)]"
              />
            </FormField>
            <FormField label="Yangi parolni tasdiqlang">
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 text-white outline-none transition focus:border-[#ffcc33]/50 focus:bg-white/[0.08] focus:shadow-[0_0_0_4px_rgba(255,204,51,0.12)]"
              />
            </FormField>
            <div className="md:col-span-3 flex justify-stretch md:justify-end">
              <button
                type="submit"
                disabled={updatingPassword}
                className="w-full md:w-auto rounded-2xl bg-white px-5 py-3.5 font-semibold text-slate-950 transition hover:brightness-95 disabled:opacity-60 touch-target"
              >
                {updatingPassword ? "Yangilanmoqda..." : "Parolni yangilash"}
              </button>
            </div>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Orders Section */}
          <div className="space-y-4">
            <div className="flex flex-col gap-3">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingBag size={20} className="text-primary" />
                Buyurtmalarim
              </h2>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'active', label: 'Aktiv', count: orderGroups.active.length },
                  { key: 'delivered', label: 'Yetkazilgan', count: orderGroups.delivered.length },
                  { key: 'cancelled', label: 'Bekor qilingan', count: orderGroups.cancelled.length },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setOrderTab(tab.key)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors touch-target ${
                      orderTab === tab.key
                        ? 'bg-[#ffcc33] text-slate-950 shadow-[0_12px_30px_rgba(255,204,51,0.22)]'
                        : 'border border-white/10 bg-white/[0.06] text-white/68 hover:bg-white/[0.1]'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="flex justify-center p-4"><Loader2 className="animate-spin text-primary" /></div>
              ) : activeOrders.length === 0 ? (
                <p className="text-sm text-slate-500 italic">Hozircha buyurtmalar yo'q.</p>
              ) : (
                activeOrders.map((order, index) => {
                  const distanceKm = getDistanceKm(order);
                  const etaMinutes = getEtaMinutes(distanceKm);
                  const courierPhone = (order.courier?.phone || '').replace(/[^\d+]/g, '');
                  const courierCallHref = courierPhone ? `tel:${courierPhone}` : '';
                  const courierSmsHref = courierPhone ? `sms:${courierPhone}` : '';
                  const currentStepIndex = trackingSteps.indexOf(order.status);
                  const isPrimaryActiveOrder = orderTab === 'active' && index === 0;

                  return (
                  <div
                    key={order._id}
                    className={`p-4 sm:p-5 rounded-[28px] border shadow-sm backdrop-blur-md ${
                      isPrimaryActiveOrder
                        ? 'bg-[#ffcc33]/10 border-[#ffcc33]/30 ring-1 ring-[#ffcc33]/15'
                        : 'bg-white/[0.06] border-white/10'
                    }`}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start mb-2">
                      <div className="space-y-2">
                        {isPrimaryActiveOrder && (
                          <span className="inline-flex self-start rounded-full bg-[#ffcc33] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-950">
                            Hozirgi buyurtma
                          </span>
                        )}
                        <h3 className="font-bold text-white">{order.restaurant?.name}</h3>
                      </div>
                      <span className={`self-start text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${orderStatusClasses[order.status] || orderStatusClasses.pending}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="text-xs text-white/56 space-y-1">
                      <p>{order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</p>
                      <p className="font-bold text-white">{order.totalPrice.toLocaleString()} so'm</p>
                      <p>To'lov: {order.paymentStatus || 'unpaid'}</p>
                      <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                      <p>Delivery: {order.deliveryAddress?.address || "manzil kiritilmagan"}</p>
                      {order.courier?.username && (
                        <p>Kuryer: {order.courier.username}{order.courier.vehicleType ? ` · ${order.courier.vehicleType}` : ''}</p>
                      )}
                      {etaMinutes !== null && (
                        <p className="font-medium text-violet-600 dark:text-violet-300">
                          ETA: {etaMinutes} daqiqa | Masofa: {distanceKm.toFixed(1)} km
                        </p>
                      )}
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-white/38">
                          Buyurtma kuzatuvi
                        </p>
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${orderStatusClasses[order.status] || orderStatusClasses.pending}`}>
                          {orderStatusLabels[order.status] || order.status}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-5 gap-2">
                        {trackingSteps.map((step, index) => {
                          const isDone = currentStepIndex >= index && order.status !== 'cancelled';
                          const isCurrent = order.status === step;
                          return (
                            <div key={step} className="flex flex-col items-center gap-2 text-center">
                              <div
                                className={`h-2.5 w-full rounded-full ${
                                  isDone ? 'bg-[#ffcc33]' : 'bg-white/10'
                                } ${isCurrent ? 'shadow-[0_0_0_3px_rgba(249,115,22,0.18)]' : ''}`}
                              />
                              <span className={`text-[10px] font-medium ${
                                isDone ? 'text-white/84' : 'text-white/35'
                              }`}>
                                {orderStatusLabels[step]}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {order.status === 'cancelled' && (
                        <p className="mt-3 text-xs font-medium text-rose-500">
                          Bu buyurtma bekor qilingan.
                        </p>
                      )}
                    </div>

                    {order.deliveryAddress?.lat !== null &&
                      order.deliveryAddress?.lat !== undefined &&
                      order.deliveryAddress?.lng !== null &&
                      order.deliveryAddress?.lng !== undefined && (
                        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/38">
                            <MapPin size={12} />
                            Yetkazish joyi
                          </div>
                          <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                            <iframe
                              title={`delivery-location-${order._id}`}
                              src={`${getMapUrl(order.deliveryAddress.lat, order.deliveryAddress.lng)}&output=embed`}
                            className="h-44 w-full bg-slate-100 dark:bg-slate-900"
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                            />
                          </div>
                          <a
                            href={getMapUrl(order.deliveryAddress.lat, order.deliveryAddress.lng)}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex rounded-xl bg-white px-3 py-2.5 text-xs font-medium text-slate-950 transition-opacity hover:opacity-90 touch-target"
                          >
                            Mening manzilimni ochish
                          </a>
                        </div>
                      )}

                    {order.courier?.currentLocation?.lat !== null &&
                      order.courier?.currentLocation?.lat !== undefined &&
                      order.courier?.currentLocation?.lng !== null &&
                      order.courier?.currentLocation?.lng !== undefined && (
                        <div className="mt-4 rounded-2xl border border-violet-400/20 bg-violet-500/10 p-3">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
                            <MapPin size={12} />
                            Kuryer live tracking
                          </div>
                          <p className="mt-2 text-xs text-white/64">
                            {order.courier?.username || 'Kuryer'} yo'lda. Oxirgi update:{' '}
                            {order.courier?.currentLocation?.updatedAt
                              ? new Date(order.courier.currentLocation.updatedAt).toLocaleString()
                              : " hozirgina"}
                          </p>
                          <div className="mt-2 overflow-hidden rounded-xl border border-violet-200 dark:border-violet-900/40">
                            <iframe
                              title={`courier-location-${order._id}`}
                              src={`${getMapUrl(order.courier.currentLocation.lat, order.courier.currentLocation.lng)}&output=embed`}
                              className="h-44 w-full bg-slate-100 dark:bg-slate-900"
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                            />
                          </div>
                          <a
                            href={getMapUrl(order.courier.currentLocation.lat, order.courier.currentLocation.lng)}
                            target="_blank"
                            rel="noreferrer"
                              className="mt-2 inline-flex rounded-xl bg-violet-500 px-3 py-2.5 text-xs font-medium text-white transition-opacity hover:opacity-90 touch-target"
                          >
                            Kuryerni xaritada ko'rish
                          </a>
                          {courierPhone && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              <a
                                href={courierCallHref}
                                className="inline-flex rounded-xl bg-white px-3 py-2.5 text-xs font-medium text-slate-950 transition-opacity hover:opacity-90 touch-target"
                              >
                                Kuryerga qo'ng'iroq
                              </a>
                              <a
                                href={courierSmsHref}
                                className="inline-flex rounded-xl bg-sky-500 px-3 py-2.5 text-xs font-medium text-white transition-opacity hover:opacity-90 touch-target"
                              >
                                SMS
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                )})
              )}
            </div>
          </div>

          {/* Notifications Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Bell size={20} className="text-primary" />
                Bildirishnomalar
              </h2>
              {notifications.some((notification) => !notification.isRead) && (
                <button
                  type="button"
                  onClick={markAllNotificationsRead}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Hammasini o'qilgan qilish
                </button>
              )}
            </div>
            <div className="space-y-3">
              {notificationsLoading ? (
                <div className="flex justify-center p-4"><Loader2 className="animate-spin text-primary" /></div>
              ) : notifications.length === 0 ? (
                <p className="text-sm text-white/50 italic">Hozircha bildirishnomalar yo'q.</p>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification._id}
                    type="button"
                    onClick={() => markNotificationRead(notification._id)}
                    className={`w-full text-left block p-4 rounded-[24px] border shadow-sm transition-colors ${
                      notification.isRead
                        ? 'bg-white/[0.06] border-white/10'
                        : 'bg-[#ffcc33]/10 border-[#ffcc33]/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-white">{notification.title}</h3>
                        <p className="text-xs text-white/58 mt-1">{notification.message}</p>
                        <p className="text-[11px] text-white/36 mt-2">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <span className="mt-1 w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
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
              <p className="text-sm text-white/50 italic">Hozircha saqlangan restoranlar yo'q.</p>
            ) : (
              user.favorites?.map(fav => (
                <Link key={fav._id} to={`/restaurant/${fav._id}`} className="block rounded-[24px] border border-white/10 bg-white/[0.06] p-4 shadow-sm transition-colors hover:border-[#ffcc33]/40">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-white">{fav.name}</h3>
                      <p className="text-xs text-white/52 mt-1 line-clamp-1">{fav.address}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(event) => handleRemoveFavorite(event, fav._id)}
                      className="touch-target inline-flex shrink-0 items-center justify-center rounded-2xl bg-red-500/12 text-red-200 transition-colors hover:bg-red-500/18"
                      title="Saqlanganlardan olib tashlash"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
