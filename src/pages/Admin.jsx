import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, MapPin, Loader2, Star, Clock } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { toast } from 'react-hot-toast';
import OrderDetailModal from '../components/OrderDetailModal';
import { normalizeCategoryLabel } from '../utils/categoryUtils';

const API_URL = import.meta.env.VITE_API_URL || '';

const customMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const defaultFormData = {
  name: '',
  address: '',
  lat: '',
  lng: '',
  image: '',
  rating: 1,
  type: '',
  telegramChatId: '',
  workingHours: '09:00 - 23:00',
  menu: []
};

const defaultGalleryMode = 'replace';

const orderStatuses = ['pending', 'confirmed', 'cooking', 'delivering', 'delivered', 'cancelled'];
const paymentStatuses = ['unpaid', 'paid', 'failed', 'refunded'];
const roleOptions = ['customer', 'restaurant', 'courier', 'admin'];

const orderStatusLabels = {
  pending: 'Kutilmoqda',
  confirmed: 'Tasdiqlangan',
  cooking: 'Tayyorlanmoqda',
  delivering: 'Yetkazilmoqda',
  delivered: 'Yetkazildi',
  cancelled: 'Bekor qilingan',
};

const paymentStatusLabels = {
  unpaid: "To'lanmagan",
  paid: "To'langan",
  failed: "Muvaffaqiyatsiz",
  refunded: 'Refund qilingan',
};

const roleLabels = {
  customer: 'Mijoz',
  restaurant: 'Restoran',
  courier: 'Kuryer',
  admin: 'Admin',
};

const availabilityLabels = {
  available: "Bo'sh",
  busy: 'Band',
};

const activityLabels = {
  active: 'Faol',
  inactive: 'Nofaol',
};

const formatOrderStatus = (status) => orderStatusLabels[status] || status;
const formatPaymentStatus = (status) => paymentStatusLabels[status] || status;
const formatRole = (role) => roleLabels[role] || role;
const formatAvailability = (isAvailable) => (isAvailable ? availabilityLabels.available : availabilityLabels.busy);
const formatActivity = (isActive) => (isActive ? activityLabels.active : activityLabels.inactive);

const statusClasses = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  cooking: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
  delivering: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
};

const paymentStatusClasses = {
  unpaid: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  failed: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  refunded: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
};

const roleDashboardConfig = {
  admin: {
    title: 'Boshqaruv Paneli',
    subtitle: "Marketplace, restoranlar va barcha buyurtmalarni bitta joydan boshqaring",
    orderTitle: 'Barcha buyurtmalar',
    orderDescription: "Tizim bo'ylab tushgan buyurtmalarni kuzating va operatsiyani boshqaring",
    heroAccent: 'from-slate-900 via-slate-800 to-primary',
    badge: 'ADMIN',
  },
  restaurant: {
    title: 'Restoran Paneli',
    subtitle: "Oshxonaga tushgan buyurtmalarni tez ko'ring, tasdiqlang va tayyorlash oqimini boshqaring",
    orderTitle: 'Restoran buyurtmalari',
    orderDescription: "Sizga tegishli buyurtmalarni statuslar bo'yicha nazorat qiling",
    heroAccent: 'from-orange-600 via-orange-500 to-amber-400',
    badge: 'RESTAURANT',
  },
  courier: {
    title: 'Kuryer Paneli',
    subtitle: "Biriktirilgan yetkazmalarni tartib bilan olib chiqing va statuslarni real-time yangilang",
    orderTitle: 'Biriktirilgan yetkazmalar',
    orderDescription: "Yetkazib berishdagi buyurtmalarni boshqarish uchun ishchi panel",
    heroAccent: 'from-violet-700 via-indigo-600 to-sky-500',
    badge: 'COURIER',
  },
};

const getAllowedStatusOptions = (role, currentStatus) => {
  if (role === 'courier') {
    return orderStatuses.filter((status) =>
      ['delivering', 'delivered'].includes(status) || status === currentStatus
    );
  }

  if (role === 'restaurant') {
    return orderStatuses.filter((status) =>
      ['pending', 'confirmed', 'cooking', 'cancelled'].includes(status) || status === currentStatus
    );
  }

  return orderStatuses;
};

const formatCompactMoney = (value) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}k`;
  }
  return `${value}`;
};

const getOrderAgeMinutes = (order) => {
  const createdAt = new Date(order.createdAt).getTime();
  const now = Date.now();
  return Math.max(Math.round((now - createdAt) / 60000), 0);
};

const isUrgentOrder = (order) => {
  const ageMinutes = getOrderAgeMinutes(order);
  if (order.status === 'pending') return ageMinutes >= 15;
  if (order.status === 'confirmed') return ageMinutes >= 25;
  if (order.status === 'cooking') return ageMinutes >= 40;
  if (order.status === 'delivering') return ageMinutes >= 50;
  return false;
};

const getOrderSlaLimitMinutes = (status) => {
  if (status === 'pending') return 15;
  if (status === 'confirmed') return 25;
  if (status === 'cooking') return 40;
  if (status === 'delivering') return 50;
  return null;
};

const getOrderSlaRemainingMinutes = (order) => {
  const limit = getOrderSlaLimitMinutes(order?.status);
  if (limit === null) return null;
  return limit - getOrderAgeMinutes(order);
};

const getOrderMapUrl = (order) => {
  const lat = order?.deliveryAddress?.lat;
  const lng = order?.deliveryAddress?.lng;

  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return '';
  }

  return `https://www.google.com/maps?q=${lat},${lng}`;
};

const toRadians = (value) => (value * Math.PI) / 180;

const getOrderDistanceKm = (order) => {
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

const getOrderEtaMinutes = (distanceKm) => {
  if (distanceKm === null || distanceKm === undefined) {
    return null;
  }

  return Math.max(Math.round(distanceKm * 4 + 10), 10);
};

const copyToClipboard = async (value, label) => {
  if (!value) {
    toast.error(`${label} topilmadi`);
    return;
  }

  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} nusxalandi`);
  } catch {
    toast.error(`${label}ni nusxalab bo'lmadi`);
  }
};

const escapeCsvValue = (value) => {
  const stringValue = String(value ?? '');
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const sanitizeMenuPriceInput = (value) => value.replace(/[^\d\s.,-]/g, '');

const normalizeMenuPriceValue = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : '';
  }

  if (typeof value === 'string') {
    const normalized = value.replace(/[^\d.,-]/g, '').replace(/,/g, '');
    if (!normalized) {
      return '';
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? String(parsed) : '';
  }

  return '';
};

const normalizeTextField = (value) => value.trim().replace(/\s+/g, ' ');

const normalizeCoordinateValue = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const parsed = Number(trimmed.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const isLatitudeValid = (value) => value >= -90 && value <= 90;
const isLongitudeValid = (value) => value >= -180 && value <= 180;
const workingHoursPattern = /^\d{2}:\d{2}\s*-\s*\d{2}:\d{2}$/;

const previewFallbackImage = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4';

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng.lat, e.latlng.lng);
    },
  });

  return position.lat !== '' && position.lng !== '' && position.lat != null && position.lng != null ? (
    <Marker position={[position.lat, position.lng]} icon={customMarkerIcon}></Marker>
  ) : null;
}

export default function Admin() {
  const { user, token, authLoading, refreshProfile } = useAuth();
  const canManageRestaurants = user?.role === 'admin';
  const canSeeOrders = ['admin', 'restaurant', 'courier'].includes(user?.role);
  const canAssignCouriers = ['admin', 'restaurant'].includes(user?.role);
  const dashboardConfig = roleDashboardConfig[user?.role] || roleDashboardConfig.admin;
  const [, setNow] = useState(Date.now());
  const [restaurants, setRestaurants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [promoCodes, setPromoCodes] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [editingPromoId, setEditingPromoId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [auditLogsLoading, setAuditLogsLoading] = useState(true);
  const [promoCodesLoading, setPromoCodesLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [assigningCourierId, setAssigningCourierId] = useState(null);
  const [sharingCourierLocation, setSharingCourierLocation] = useState(false);
  const [autoSharingCourierLocation, setAutoSharingCourierLocation] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [updatingPromoId, setUpdatingPromoId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [orderSort, setOrderSort] = useState('newest');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedCourierId, setSelectedCourierId] = useState('');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [recentOrderIds, setRecentOrderIds] = useState([]);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingRestaurantId, setEditingRestaurantId] = useState(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [galleryMode, setGalleryMode] = useState(defaultGalleryMode);
  const [formData, setFormData] = useState(defaultFormData);
  const [promoForm, setPromoForm] = useState({
    code: '',
    discountType: 'percent',
    discountValue: '',
    minOrderAmount: '',
    usageLimit: '',
    oneTimePerUser: false,
    firstOrderOnly: false,
    expiresAt: '',
  });
  const [promoEditForm, setPromoEditForm] = useState({
    discountType: 'percent',
    discountValue: '',
    minOrderAmount: '',
    usageLimit: '',
    oneTimePerUser: false,
    firstOrderOnly: false,
    expiresAt: '',
  });

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, []);

  const resetForm = () => {
    setFormData(defaultFormData);
    setSelectedFiles([]);
    setGalleryMode(defaultGalleryMode);
    setEditingRestaurantId(null);
    setShowForm(false);
  };

  const handleToggleForm = () => {
    if (showForm) {
      resetForm();
      return;
    }
    setShowForm(true);
  };

  const handleEdit = (restaurant) => {
    setEditingRestaurantId(restaurant._id);
    setSelectedFiles([]);
    setGalleryMode(defaultGalleryMode);
    setFormData({
      name: restaurant.name || '',
      address: restaurant.address || '',
      lat: restaurant.location?.coordinates?.[1] ?? '',
      lng: restaurant.location?.coordinates?.[0] ?? '',
      image: restaurant.image || '',
      rating: restaurant.rating || 1,
      type: restaurant.category?.[0] || '',
      telegramChatId: restaurant.telegramChatId || '',
      workingHours: restaurant.workingHours || '09:00 - 23:00',
      menu: Array.isArray(restaurant.menu) ? restaurant.menu.map((item) => ({
        name: item.name || '',
        price: item.price || '',
        image: item.image || ''
      })) : []
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Taom qo'shish funksiyalari
  const addMenuItem = () => {
    setFormData({ ...formData, menu: [...formData.menu, { name: '', price: '', image: '' }] });
  };
  
  const updateMenuItem = (index, field, value) => {
    const updatedMenu = [...formData.menu];
    updatedMenu[index][field] = field === 'price' ? sanitizeMenuPriceInput(value) : value;
    setFormData({ ...formData, menu: updatedMenu });
  };

  const removeMenuItem = (index) => {
    const updatedMenu = formData.menu.filter((_, i) => i !== index);
    setFormData({ ...formData, menu: updatedMenu });
  };

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/restaurants?page=1&limit=1000`);
      const data = await res.json();
      if (res.ok && data.success) {
        setRestaurants(
          (data.data || []).map((restaurant) => ({
            ...restaurant,
            category: (restaurant.category || []).map(normalizeCategoryLabel).filter(Boolean),
          }))
        );
      } else {
        toast.error(data.message || "Restoranlarni yuklab bo'lmadi");
      }
    } catch (err) {
      console.error(err);
      toast.error("Restoranlarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(data.data);
      } else {
        toast.error(data.message || "Buyurtmalarni yuklab bo'lmadi");
      }
    } catch (err) {
      console.error(err);
      toast.error("Buyurtmalarni yuklashda xatolik yuz berdi");
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchCouriers = async () => {
    if (!token || !canAssignCouriers) return;

    try {
      const res = await fetch(`${API_URL}/api/users/couriers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCouriers(data.data);
      } else {
        toast.error(data.message || "Kuryerlarni yuklab bo'lmadi");
      }
    } catch (err) {
      console.error(err);
      toast.error("Kuryerlarni yuklashda xatolik yuz berdi");
    }
  };

  const fetchUsers = async () => {
    if (!token || !canManageRestaurants) return;

    setUsersLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.data);
      } else {
        toast.error(data.message || "Foydalanuvchilarni yuklab bo'lmadi");
      }
    } catch (err) {
      console.error(err);
      toast.error("Foydalanuvchilarni yuklashda xatolik yuz berdi");
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    if (!token || !canManageRestaurants) return;

    setAuditLogsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/users/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAuditLogs(data.data);
      } else {
        toast.error(data.message || "Audit loglarni yuklab bo'lmadi");
      }
    } catch (err) {
      console.error(err);
      toast.error("Audit loglarni yuklashda xatolik yuz berdi");
    } finally {
      setAuditLogsLoading(false);
    }
  };

  const fetchPromoCodes = async () => {
    if (!token || !canManageRestaurants) return;

    setPromoCodesLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/promocodes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPromoCodes(data.data);
      } else {
        toast.error(data.message || "Promokodlarni yuklab bo'lmadi");
      }
    } catch (err) {
      console.error(err);
      toast.error("Promokodlarni yuklashda xatolik yuz berdi");
    } finally {
      setPromoCodesLoading(false);
    }
  };

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/categories`);
      const data = await res.json();

      if (res.ok && data.success) {
        setCategoryOptions((data.data || []).map(normalizeCategoryLabel).filter(Boolean));
      } else {
        toast.error(data.message || "Toifalarni yuklab bo'lmadi");
      }
    } catch (err) {
      console.error(err);
      toast.error("Toifalarni yuklashda xatolik yuz berdi");
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    if (token && canSeeOrders) {
      fetchOrders();
    }
    if (token && canManageRestaurants) {
      fetchRestaurants();
      fetchUsers();
      fetchAuditLogs();
      fetchPromoCodes();
    }
    if (token && canAssignCouriers) {
      fetchCouriers();
    }
  }, [token, canSeeOrders, canManageRestaurants, canAssignCouriers]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const playAlertTone = () => {
      try {
        const audioContext = new window.AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.12, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.35);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.35);
      } catch (error) {
        console.error('Alert tone failed', error);
      }
    };

    const handleOrderCreated = (event) => {
      if (token && canSeeOrders) {
        fetchOrders();
      }

      const orderId = event?.detail?._id;
      if (orderId) {
        setRecentOrderIds((prev) => [...new Set([orderId, ...prev])].slice(0, 8));
        window.setTimeout(() => {
          setRecentOrderIds((prev) => prev.filter((id) => id !== orderId));
        }, 12000);
      }

      if (user?.role === 'admin' || user?.role === 'restaurant') {
        playAlertTone();
      }
    };

    const refreshOrders = () => {
      if (token && canSeeOrders) {
        fetchOrders();
      }
    };

    const handleCourierLocationUpdated = (event) => {
      const courierId = event?.detail?.courierId;
      const currentLocation = event?.detail?.currentLocation;

      if (!courierId || !currentLocation) return;

      setCouriers((prevCouriers) =>
        prevCouriers.map((courier) =>
          courier._id === courierId ? { ...courier, currentLocation } : courier
        )
      );

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.courier?._id === courierId || order.courier === courierId
            ? {
                ...order,
                courier:
                  order.courier && typeof order.courier === 'object'
                    ? { ...order.courier, currentLocation }
                    : { _id: courierId, currentLocation }
              }
            : order
        )
      );

      setSelectedOrder((prevOrder) => {
        if (!prevOrder) return prevOrder;
        return prevOrder.courier?._id === courierId || prevOrder.courier === courierId
          ? {
              ...prevOrder,
              courier:
                prevOrder.courier && typeof prevOrder.courier === 'object'
                  ? { ...prevOrder.courier, currentLocation }
                  : { _id: courierId, currentLocation }
            }
          : prevOrder;
      });
    };

    window.addEventListener('marketplace:order-created', handleOrderCreated);
    window.addEventListener('marketplace:order-updated', refreshOrders);
    window.addEventListener('marketplace:courier-location-updated', handleCourierLocationUpdated);

    return () => {
      window.removeEventListener('marketplace:order-created', handleOrderCreated);
      window.removeEventListener('marketplace:order-updated', refreshOrders);
      window.removeEventListener('marketplace:courier-location-updated', handleCourierLocationUpdated);
    };
  }, [token, canSeeOrders, user?.role]);

  useEffect(() => {
    if (selectedOrder) {
      setSelectedCourierId(selectedOrder.courier?._id || '');
      setSelectedPaymentStatus(selectedOrder.paymentStatus || 'unpaid');
      setRefundReason(selectedOrder.refundReason || '');
    } else {
      setSelectedCourierId('');
      setSelectedPaymentStatus('');
      setRefundReason('');
    }
  }, [selectedOrder]);

  const filteredRestaurants = restaurants.filter((restaurant) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return true;

    const fields = [
      restaurant.name,
      restaurant.address,
      ...(restaurant.category || []),
      restaurant.workingHours
    ];

    return fields.some((field) => field?.toLowerCase().includes(normalizedSearch));
  });

  const filteredOrders = orders
    .filter((order) => orderStatusFilter === 'all' || order.status === orderStatusFilter)
    .filter((order) => paymentStatusFilter === 'all' || order.paymentStatus === paymentStatusFilter)
    .sort((a, b) => {
      if (orderSort === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (orderSort === 'amount_high') {
        return (b.totalPrice || 0) - (a.totalPrice || 0);
      }
      if (orderSort === 'amount_low') {
        return (a.totalPrice || 0) - (b.totalPrice || 0);
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const orderSummary = {
    total: orders.length,
    revenue: orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0),
    pending: orders.filter((order) => order.status === 'pending').length,
    delivered: orders.filter((order) => order.status === 'delivered').length,
    inProgress: orders.filter((order) => ['confirmed', 'cooking', 'delivering'].includes(order.status)).length,
    cancelled: orders.filter((order) => order.status === 'cancelled').length,
    urgent: orders.filter((order) => isUrgentOrder(order)).length,
    paid: orders.filter((order) => order.paymentStatus === 'paid').length,
  };

  const financialSummary = {
    grossRevenue: orders
      .filter((order) => order.paymentStatus === 'paid')
      .reduce((sum, order) => sum + (order.totalPrice || 0), 0),
    refundedAmount: orders
      .filter((order) => order.paymentStatus === 'refunded')
      .reduce((sum, order) => sum + (order.totalPrice || 0), 0),
    refundedOrders: orders.filter((order) => order.paymentStatus === 'refunded').length,
  };
  financialSummary.netRevenue = financialSummary.grossRevenue - financialSummary.refundedAmount;

  const statusBreakdown = orderStatuses.map((status) => {
    const count = orders.filter((order) => order.status === status).length;
    const percentage = orderSummary.total ? Math.round((count / orderSummary.total) * 100) : 0;
    return { status, count, percentage };
  });

  const weeklyTrend = Array.from({ length: 7 }, (_, index) => {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    currentDate.setDate(currentDate.getDate() - (6 - index));

    const dayOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate.toDateString() === currentDate.toDateString();
    });

    const revenue = dayOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    return {
      label: currentDate.toLocaleDateString('en-GB', { weekday: 'short' }),
      total: dayOrders.length,
      revenue,
    };
  });

  const weeklyMaxOrders = Math.max(...weeklyTrend.map((day) => day.total), 1);

  const restaurantPerformance = Object.values(
    orders.reduce((acc, order) => {
      const key = order.restaurant?._id || order.restaurant?.name || 'unknown';
      if (!acc[key]) {
        acc[key] = {
          name: order.restaurant?.name || "Noma'lum restoran",
          totalOrders: 0,
          revenue: 0,
        };
      }

      acc[key].totalOrders += 1;
      acc[key].revenue += order.totalPrice || 0;
      return acc;
    }, {})
  )
    .sort((a, b) => b.totalOrders - a.totalOrders)
    .slice(0, 5);

  const urgentOrders = filteredOrders.filter((order) => isUrgentOrder(order));

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const userSummary = {
    total: users.length,
    today: users.filter((listUser) => new Date(listUser.createdAt) >= startOfToday).length,
    active: users.filter((listUser) => listUser.isActive !== false).length,
    inactive: users.filter((listUser) => listUser.isActive === false).length,
    customers: users.filter((listUser) => listUser.role === 'customer').length,
    restaurants: users.filter((listUser) => listUser.role === 'restaurant').length,
    couriers: users.filter((listUser) => listUser.role === 'courier').length,
    admins: users.filter((listUser) => listUser.role === 'admin').length,
  };

  const userWeeklyTrend = Array.from({ length: 7 }, (_, index) => {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    currentDate.setDate(currentDate.getDate() - (6 - index));

    const dayUsers = users.filter((listUser) => {
      const createdAt = new Date(listUser.createdAt);
      return createdAt.toDateString() === currentDate.toDateString();
    });

    return {
      label: currentDate.toLocaleDateString('en-GB', { weekday: 'short' }),
      total: dayUsers.length,
    };
  });

  const userWeeklyMax = Math.max(...userWeeklyTrend.map((day) => day.total), 1);

  const filteredUsers = users.filter((listUser) => {
    const matchesRole = userRoleFilter === 'all' || listUser.role === userRoleFilter;

    if (!matchesRole) return false;

    const normalizedSearch = userSearchTerm.trim().toLowerCase();
    if (!normalizedSearch) return true;

    return [
      listUser.username,
      listUser.email,
      listUser.phone,
      formatRole(listUser.role),
      restaurants.find((restaurant) => restaurant._id === listUser.restaurantId)?.name,
    ]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(normalizedSearch));
  });

  const restaurantOwners = users.filter((listUser) => listUser.role === 'restaurant');
  const assignedRestaurantOwnerCount = restaurantOwners.filter((listUser) => Boolean(listUser.restaurantId)).length;
  const unassignedRestaurantOwners = restaurantOwners.filter((listUser) => !listUser.restaurantId);
  const assignedRestaurantIds = new Set(
    restaurantOwners
      .map((listUser) => listUser.restaurantId)
      .filter(Boolean)
  );
  const unassignedRestaurants = restaurants.filter((restaurant) => !assignedRestaurantIds.has(restaurant._id));

  const downloadCsv = (filename, rows) => {
    const csvContent = rows.map((row) => row.map(escapeCsvValue).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportRestaurants = () => {
    const rows = [
      ['Nomi', 'Manzil', 'Toifa', 'Reyting', 'Ish vaqti', 'Lat', 'Lng'],
      ...filteredRestaurants.map((restaurant) => [
        restaurant.name,
        restaurant.address,
        restaurant.category?.join(', ') || '',
        restaurant.rating,
        restaurant.workingHours,
        restaurant.location?.coordinates?.[1] ?? '',
        restaurant.location?.coordinates?.[0] ?? ''
      ])
    ];

    downloadCsv('restaurants-export.csv', rows);
    toast.success('Restoranlar CSV ga eksport qilindi');
  };

  const exportOrders = () => {
    const rows = [
      ['Restoran', 'Mijoz', 'Email', 'Telefon', 'Delivery manzil', 'Lat', 'Lng', 'Status', 'Turi', 'Jami summa', 'Sana', 'Tarkib'],
      ...filteredOrders.map((order) => [
        order.restaurant?.name || '',
        order.customer?.username || '',
        order.customer?.email || '',
        order.customerPhone || '',
        order.deliveryAddress?.address || '',
        order.deliveryAddress?.lat ?? '',
        order.deliveryAddress?.lng ?? '',
        formatOrderStatus(order.status),
        order.type,
        order.totalPrice || 0,
        new Date(order.createdAt).toLocaleString(),
        order.items.map((item) => `${item.name} x ${item.quantity}`).join(' | ')
      ])
    ];

    downloadCsv('orders-export.csv', rows);
    toast.success('Buyurtmalar CSV ga eksport qilindi');
  };

  const exportFinancialReport = () => {
    const rows = [
      ['Restoran', 'Mijoz', 'Payment status', 'Refund reason', 'Total', 'Created at'],
      ...orders.map((order) => [
        order.restaurant?.name || '',
        order.customer?.username || '',
        formatPaymentStatus(order.paymentStatus || 'unpaid'),
        order.refundReason || '',
        order.totalPrice || 0,
        new Date(order.createdAt).toLocaleString(),
      ]),
      [],
      ['Gross revenue', financialSummary.grossRevenue],
      ['Refunded amount', financialSummary.refundedAmount],
      ['Net revenue', financialSummary.netRevenue],
      ['Refunded orders', financialSummary.refundedOrders],
    ];

    downloadCsv('financial-report.csv', rows);
    toast.success('Financial report CSV ga eksport qilindi');
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Rostdan ham o'chirasizmi?")) return;
    try {
      const res = await fetch(`${API_URL}/api/restaurants/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Restoranni o'chirib bo'lmadi");
      }
      toast.success("Restoran o'chirildi");
      fetchRestaurants();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "O'chirishda xatolik yuz berdi");
    }
  };

  const handleOrderStatusChange = async (orderId, status) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Buyurtma holatini yangilab bo'lmadi");
      }
      setOrders((prevOrders) =>
        prevOrders.map((order) => (order._id === orderId ? { ...order, status } : order))
      );
      toast.success("Buyurtma holati yangilandi");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Buyurtma holatini yangilashda xatolik yuz berdi");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleAssignCourier = async (orderId, courierId) => {
    setAssigningCourierId(orderId);
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/assign-courier`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ courierId: courierId || null })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Kuryer biriktirib bo'lmadi");
      }

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId
            ? { ...order, courier: data.data.courier, assignedAt: data.data.assignedAt }
            : order
        )
      );

      if (selectedOrder?._id === orderId) {
        setSelectedOrder((prevOrder) => ({
          ...prevOrder,
          courier: data.data.courier,
          assignedAt: data.data.assignedAt,
        }));
      }

      setSelectedCourierId(data.data.courier?._id || '');
      toast.success(courierId ? "Kuryer biriktirildi" : "Kuryer olib tashlandi");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Kuryer biriktirishda xatolik yuz berdi");
    } finally {
      setAssigningCourierId(null);
    }
  };

  const shareCourierLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Brauzeringiz geolokatsiyani qo'llab-quvvatlamaydi.");
      return;
    }

    setSharingCourierLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch(`${API_URL}/api/users/location`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            })
          });

          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.message || "Joylashuvni yuborib bo'lmadi");
          }

          await refreshProfile();
          toast.success("Joriy joylashuv yuborildi");
        } catch (err) {
          console.error(err);
          toast.error(err.message || "Joylashuvni yuborishda xatolik yuz berdi");
        } finally {
          setSharingCourierLocation(false);
        }
      },
      () => {
        toast.error("Joylashuvni aniqlab bo'lmadi. Ruxsatlarni tekshirib qayta urinib ko'ring.");
        setSharingCourierLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleShareCourierLocation = () => {
    shareCourierLocation();
  };

  useEffect(() => {
    if (user?.role !== 'courier' || !autoSharingCourierLocation) return;

    shareCourierLocation();

    const intervalId = window.setInterval(() => {
      shareCourierLocation();
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, [autoSharingCourierLocation, user?.role]);

  const handlePaymentStatusChange = async (orderId, paymentStatus) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/payment-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ paymentStatus })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "To'lov holatini yangilab bo'lmadi");
      }

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, paymentStatus: data.data.paymentStatus } : order
        )
      );

      if (selectedOrder?._id === orderId) {
        setSelectedOrder((prevOrder) => ({ ...prevOrder, paymentStatus: data.data.paymentStatus }));
      }

      setSelectedPaymentStatus(data.data.paymentStatus);
      toast.success("To'lov holati yangilandi");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "To'lov holatini yangilashda xatolik yuz berdi");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleRefundOrder = async (orderId, reason) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/refund`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Refund qilib bo'lmadi");
      }

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId
            ? {
                ...order,
                paymentStatus: data.data.paymentStatus,
                refundReason: data.data.refundReason,
              }
            : order
        )
      );

      if (selectedOrder?._id === orderId) {
        setSelectedOrder((prevOrder) => ({
          ...prevOrder,
          paymentStatus: data.data.paymentStatus,
          refundReason: data.data.refundReason,
        }));
      }

      setSelectedPaymentStatus(data.data.paymentStatus);
      setRefundReason(data.data.refundReason || '');
      toast.success("Refund qayd qilindi");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Refundda xatolik yuz berdi");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleAdminUserUpdate = async (userId, updates) => {
    setUpdatingUserId(userId);
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}/admin`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Foydalanuvchini yangilab bo'lmadi");
      }

      setUsers((prevUsers) =>
        prevUsers.map((listUser) =>
          listUser._id === userId ? { ...listUser, ...data.data } : listUser
        )
      );

      toast.success("Foydalanuvchi yangilandi");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Foydalanuvchini yangilashda xatolik yuz berdi");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleAdminDeleteUser = async (userId) => {
    if (!window.confirm("Rostdan ham bu foydalanuvchini o'chirasizmi?")) return;

    setUpdatingUserId(userId);
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}/admin`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Foydalanuvchini o'chirib bo'lmadi");
      }

      setUsers((prevUsers) => prevUsers.filter((listUser) => listUser._id !== userId));
      toast.success("Foydalanuvchi o'chirildi");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Foydalanuvchini o'chirishda xatolik yuz berdi");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleCreatePromoCode = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/promocodes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          code: promoForm.code.trim().toUpperCase(),
          discountType: promoForm.discountType,
          discountValue: Number(promoForm.discountValue || 0),
          minOrderAmount: Number(promoForm.minOrderAmount || 0),
          usageLimit: promoForm.usageLimit ? Number(promoForm.usageLimit) : null,
          oneTimePerUser: promoForm.oneTimePerUser,
          firstOrderOnly: promoForm.firstOrderOnly,
          expiresAt: promoForm.expiresAt || null,
          isActive: true,
        })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Promokod yaratib bo'lmadi");
      }

      setPromoCodes((prev) => [data.data, ...prev]);
      setPromoForm({
        code: '',
        discountType: 'percent',
        discountValue: '',
        minOrderAmount: '',
        usageLimit: '',
        oneTimePerUser: false,
        firstOrderOnly: false,
        expiresAt: '',
      });
      toast.success("Promokod yaratildi");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Promokod yaratishda xatolik yuz berdi");
    }
  };

  const handleTogglePromoCode = async (promoId, isActive) => {
    setUpdatingPromoId(promoId);
    try {
      const res = await fetch(`${API_URL}/api/promocodes/${promoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !isActive })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Promokodni yangilab bo'lmadi");
      }

      setPromoCodes((prev) =>
        prev.map((promo) => (promo._id === promoId ? data.data : promo))
      );
      toast.success("Promokod holati yangilandi");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Promokod holatini yangilashda xatolik yuz berdi");
    } finally {
      setUpdatingPromoId(null);
    }
  };

  const handleStartPromoEdit = (promo) => {
    setEditingPromoId(promo._id);
    setPromoEditForm({
      discountType: promo.discountType || 'percent',
      discountValue: String(promo.discountValue ?? ''),
      minOrderAmount: String(promo.minOrderAmount ?? ''),
      usageLimit: String(promo.usageLimit ?? ''),
      oneTimePerUser: Boolean(promo.oneTimePerUser),
      firstOrderOnly: Boolean(promo.firstOrderOnly),
      expiresAt: promo.expiresAt ? new Date(promo.expiresAt).toISOString().slice(0, 16) : '',
    });
  };

  const handleCancelPromoEdit = () => {
    setEditingPromoId(null);
    setPromoEditForm({
      discountType: 'percent',
      discountValue: '',
      minOrderAmount: '',
      usageLimit: '',
      oneTimePerUser: false,
      firstOrderOnly: false,
      expiresAt: '',
    });
  };

  const handleSavePromoEdit = async (promoId) => {
    setUpdatingPromoId(promoId);
    try {
      const res = await fetch(`${API_URL}/api/promocodes/${promoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          discountType: promoEditForm.discountType,
          discountValue: Number(promoEditForm.discountValue || 0),
          minOrderAmount: Number(promoEditForm.minOrderAmount || 0),
          usageLimit: promoEditForm.usageLimit ? Number(promoEditForm.usageLimit) : null,
          oneTimePerUser: promoEditForm.oneTimePerUser,
          firstOrderOnly: promoEditForm.firstOrderOnly,
          expiresAt: promoEditForm.expiresAt || null,
        })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Promokodni saqlab bo'lmadi");
      }

      setPromoCodes((prev) =>
        prev.map((promo) => (promo._id === promoId ? data.data : promo))
      );
      handleCancelPromoEdit();
      toast.success("Promokod yangilandi");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Promokodni yangilashda xatolik yuz berdi");
    } finally {
      setUpdatingPromoId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const normalizedName = normalizeTextField(formData.name);
    const normalizedAddress = normalizeTextField(formData.address);
    const normalizedType = normalizeCategoryLabel(normalizeTextField(formData.type));
    const normalizedWorkingHours = normalizeTextField(formData.workingHours);
    const normalizedLat = normalizeCoordinateValue(formData.lat);
    const normalizedLng = normalizeCoordinateValue(formData.lng);

    if (!normalizedName || normalizedName.length < 2) {
      toast.error("Restoran nomini to'g'ri kiriting");
      return;
    }

    if (!normalizedAddress || normalizedAddress.length < 5) {
      toast.error("Manzilni to'liqroq kiriting");
      return;
    }

    if (!normalizedType || normalizedType.length < 2) {
      toast.error("Toifani tanlang");
      return;
    }

    const normalizedRating = Number(formData.rating);
    if (!Number.isFinite(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
      toast.error("Reyting 1 va 5 orasida bo'lishi kerak");
      return;
    }

    if (!workingHoursPattern.test(normalizedWorkingHours)) {
      toast.error("Ish vaqtini 08:00 - 22:00 formatida kiriting");
      return;
    }

    if (normalizedLat === null || !isLatitudeValid(normalizedLat)) {
      toast.error("Latitude -90 va 90 orasida bo'lishi kerak");
      return;
    }

    if (normalizedLng === null || !isLongitudeValid(normalizedLng)) {
      toast.error("Longitude -180 va 180 orasida bo'lishi kerak");
      return;
    }

    const invalidMenuItem = formData.menu.find(
      (item) => !normalizeTextField(item.name) || !normalizeMenuPriceValue(item.price)
    );
    if (invalidMenuItem) {
      toast.error(`"${invalidMenuItem.name || "Noma'lum taom"}" uchun nom va to'g'ri narx kiriting`);
      return;
    }

    setUploadingFiles(true);
    let galleryUrls = editingRestaurantId
      ? restaurants.find((restaurant) => restaurant._id === editingRestaurantId)?.gallery || []
      : [];
    let mainImageUrl = formData.image;

    // Fayllarni yuklash
    if (selectedFiles.length > 0) {
      const data = new FormData();
      for (let i = 0; i < selectedFiles.length; i++) {
        data.append('image', selectedFiles[i]);
      }
      try {
        const uploadRes = await fetch(`${API_URL}/api/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: data,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.success) {
          throw new Error(uploadData.message || "Rasmlarni yuklab bo'lmadi");
        }
        if (uploadData.urls.length > 0) {
          galleryUrls =
            editingRestaurantId && galleryMode === 'append'
              ? [...galleryUrls, ...uploadData.urls]
              : uploadData.urls;
          if (!mainImageUrl) mainImageUrl = galleryUrls[0];
        }
      } catch (err) {
        console.error("Rasm yuklashda xatolik:", err);
        toast.error(err.message || "Rasm yuklashda xatolik yuz berdi");
        setUploadingFiles(false);
        return;
      }
    }

    const payload = {
      ...formData,
      name: normalizedName,
      address: normalizedAddress,
      type: normalizedType,
      telegramChatId: normalizeTextField(formData.telegramChatId),
      rating: normalizedRating,
      workingHours: normalizedWorkingHours,
      lat: normalizedLat,
      lng: normalizedLng,
      menu: formData.menu.map((item) => ({
        name: normalizeTextField(item.name),
        image: item.image,
        price: normalizeMenuPriceValue(item.price),
      })),
      image: mainImageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
      category: [normalizedType],
      gallery: galleryUrls
    };

    try {
      const isEditing = Boolean(editingRestaurantId);
      const endpoint = isEditing
        ? `${API_URL}/api/restaurants/${editingRestaurantId}`
        : `${API_URL}/api/restaurants`;
      const res = await fetch(endpoint, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        resetForm();
        toast.success(isEditing ? "Restoran yangilandi" : "Yangi restoran qo'shildi");
        await fetchRestaurants();
      } else {
        const data = await res.json();
        throw new Error(data.message || "Restoranni saqlab bo'lmadi");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Saqlashda xatolik yuz berdi");
    } finally {
      setUploadingFiles(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex-1 bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!user || !canSeeOrders) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-900 overflow-y-auto p-3 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6 ios-safe-bottom">
        <div className={`relative overflow-hidden rounded-[28px] bg-gradient-to-br ${dashboardConfig.heroAccent} p-5 sm:p-8 text-white shadow-xl`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.24),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.18),transparent_30%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-[0.22em]">
                {dashboardConfig.badge}
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                {dashboardConfig.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-white/80 sm:text-base">
                {dashboardConfig.subtitle}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 w-full lg:w-auto">
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                <div className="text-[11px] font-medium uppercase tracking-wide text-white/70">Jami buyurtma</div>
                <div className="mt-2 text-2xl font-bold">{orderSummary.total}</div>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                <div className="text-[11px] font-medium uppercase tracking-wide text-white/70">Jarayonda</div>
                <div className="mt-2 text-2xl font-bold">{orderSummary.inProgress}</div>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                <div className="text-[11px] font-medium uppercase tracking-wide text-white/70">Yetkazilgan</div>
                <div className="mt-2 text-2xl font-bold">{orderSummary.delivered}</div>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                <div className="text-[11px] font-medium uppercase tracking-wide text-white/70">Bekor qilingan</div>
                <div className="mt-2 text-2xl font-bold">{orderSummary.cancelled}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              {canManageRestaurants ? 'Marketplace boshqaruvi' : dashboardConfig.orderTitle}
            </h2>
            <p className="text-slate-500">{dashboardConfig.orderDescription}</p>
          </div>
          {canManageRestaurants && (
            <button 
              onClick={handleToggleForm}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white font-medium rounded-2xl hover:bg-orange-600 transition-colors shadow-sm touch-target"
            >
              {showForm ? "Yopish" : <><Plus size={18} /> Yangi Qo'shish</>}
            </button>
          )}
        </div>

        {canManageRestaurants && (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px_220px] gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
              <label className="text-xs font-medium text-slate-500 block mb-2">Qidiruv</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nomi, manzili yoki toifa bo'yicha qidiring"
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-primary"
              />
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="text-xs font-medium text-slate-500">Jami restoranlar</div>
              <div className="mt-2 text-3xl font-bold text-slate-800 dark:text-white">{restaurants.length}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="text-xs font-medium text-slate-500">Qidiruv natijasi</div>
              <div className="mt-2 text-3xl font-bold text-slate-800 dark:text-white">{filteredRestaurants.length}</div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {canManageRestaurants && (
            <button
              type="button"
              onClick={exportRestaurants}
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-medium hover:opacity-90 transition-opacity touch-target"
            >
              Restoranlarni CSV ga yuklash
            </button>
          )}
          <button
            type="button"
            onClick={exportOrders}
            className="w-full sm:w-auto px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors touch-target"
          >
            Buyurtmalarni CSV ga yuklash
          </button>
          {canManageRestaurants && (
            <button
              type="button"
              onClick={exportFinancialReport}
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors touch-target"
            >
              Financial report CSV
            </button>
          )}
        </div>

        {canManageRestaurants && showForm && (
          <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-[28px] shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold mb-4">
              {editingRestaurantId ? "Restoranni tahrirlash" : "Yangi restoran qo'shish"}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Nomi</label>
                <input required minLength={2} type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-primary" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Manzil</label>
                <input required minLength={5} type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-primary" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Lat (Kenglik)</label>
                <input required type="number" inputMode="decimal" min="-90" max="90" step="any" value={formData.lat} onChange={e => setFormData({...formData, lat: e.target.value})} className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-primary transition-colors" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Lng (Uzunlik)</label>
                <input required type="number" inputMode="decimal" min="-180" max="180" step="any" value={formData.lng} onChange={e => setFormData({...formData, lng: e.target.value})} className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-primary transition-colors" />
              </div>

              {/* Xarita joyi */}
              <div className="md:col-span-2 mb-2">
                <label className="text-xs font-medium text-slate-500 mb-1 block">Xaritadan aniq joyni tanlang (Marker qo'ying)</label>
                <div className="h-[300px] w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative z-10">
                  <MapContainer 
                    center={formData.lat !== '' && formData.lng !== '' ? [Number(formData.lat), Number(formData.lng)] : [38.8615, 65.7854]} 
                    zoom={13} 
                    className="w-full h-full"
                  >
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                    <LocationMarker 
                      position={{ lat: formData.lat, lng: formData.lng }} 
                      setPosition={(lat, lng) => setFormData({...formData, lat, lng})} 
                    />
                  </MapContainer>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Siz xaritaga bosgan nuqtangiz avtomatik tarzda "Lat" va "Lng" xonalarini to'ldiradi.</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Rasm URL (Yoki fayl tanlang)</label>
                <input type="url" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-primary" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Toifa</label>
                <select
                  required
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-primary"
                >
                  <option value="">{categoriesLoading ? 'Toifalar yuklanmoqda...' : 'Toifani tanlang'}</option>
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Reyting</label>
                <input
                  required
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  inputMode="decimal"
                  value={formData.rating}
                  onChange={e => setFormData({...formData, rating: e.target.value})}
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Telegram chat ID</label>
                <input
                  type="text"
                  value={formData.telegramChatId}
                  onChange={e => setFormData({...formData, telegramChatId: e.target.value})}
                  placeholder="Masalan: -1001234567890"
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-primary"
                />
                <p className="text-[11px] text-slate-400">
                  Yangi buyurtma tushganda shu chatga Telegram xabar yuboriladi.
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Ish vaqti (Masalan: 08:00 - 22:00)</label>
                <input required type="text" pattern="\d{2}:\d{2}\s*-\s*\d{2}:\d{2}" placeholder="08:00 - 22:00" value={formData.workingHours} onChange={e => setFormData({...formData, workingHours: e.target.value})} className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-primary" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium text-slate-500">
                  {editingRestaurantId ? "Galereya rasmlari" : "Rasmlar Galereyasi (bir nechta tanlash mumkin)"}
                </label>
                <input type="file" multiple accept="image/*" onChange={(e) => setSelectedFiles(e.target.files)} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-primary" />
                {editingRestaurantId && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setGalleryMode('replace')}
                      className={`rounded-2xl px-4 py-2.5 text-sm font-medium border transition-colors ${
                        galleryMode === 'replace'
                          ? 'bg-primary text-white border-primary'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      Eskisini almashtirish
                    </button>
                    <button
                      type="button"
                      onClick={() => setGalleryMode('append')}
                      className={`rounded-2xl px-4 py-2.5 text-sm font-medium border transition-colors ${
                        galleryMode === 'append'
                          ? 'bg-primary text-white border-primary'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      Yangisini qo'shish
                    </button>
                  </div>
                )}
                {editingRestaurantId && (
                  <p className="mt-2 text-[11px] text-slate-400">
                    Hozirgi rejim: {galleryMode === 'append' ? "yangi rasmlar mavjud galereyaga qo'shiladi" : "tanlangan rasmlar eski galereyani almashtiradi"}
                  </p>
                )}
              </div>

              {/* Menyu Section */}
              <div className="md:col-span-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Menyu (Taomlar ro'yxati)</h3>
                  <button type="button" onClick={addMenuItem} className="text-xs font-semibold px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl outline-none hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors touch-target">
                    + Taom qo'shish
                  </button>
                </div>
                
                {formData.menu.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Hozircha menyu kiritilmagan. Yuqoridagi tugmani bosib taom qo'shing.</p>
                ) : (
                  <div className="space-y-3">
                    {formData.menu.map((item, index) => (
                      <div key={index} className="flex flex-col sm:flex-row gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl relative">
                        <input required type="text" placeholder="Taom nomi (Masalan: Osh)" value={item.name} onChange={e => updateMenuItem(index, 'name', e.target.value)} className="flex-1 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm outline-none focus:border-primary" />
                        <input required type="text" inputMode="numeric" pattern="[0-9\\s,.-]+" placeholder="Narxi (Masalan: 25 000)" value={item.price} onChange={e => updateMenuItem(index, 'price', e.target.value)} className="w-full sm:w-32 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm outline-none focus:border-primary" />
                        <input type="url" placeholder="Taom rasmi (URL)" value={item.image} onChange={e => updateMenuItem(index, 'image', e.target.value)} className="flex-1 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm outline-none focus:border-primary" />
                        
                        <button type="button" onClick={() => removeMenuItem(index)} className="w-full sm:w-auto mt-2 sm:mt-0 p-3 text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-2xl transition-colors flex items-center justify-center touch-target">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="md:col-span-2 mt-4 flex flex-col sm:flex-row gap-3">
                <button disabled={uploadingFiles} className="flex-1 bg-primary text-white py-3.5 rounded-2xl font-medium hover:bg-orange-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed touch-target">
                  {uploadingFiles ? 'Yuklanmoqda...' : editingRestaurantId ? 'Yangilash' : 'Saqlash'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="sm:w-auto px-6 py-3.5 rounded-2xl font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors touch-target"
                >
                  Bekor qilish
                </button>
              </div>

              <div className="md:col-span-2 mt-6 rounded-[28px] border border-dashed border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Preview</h3>
                    <p className="text-xs text-slate-500">Saqlashdan oldin restoran kartasi taxminan qanday ko'rinishini tekshiring</p>
                  </div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    live preview
                  </div>
                </div>

                <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
                  <div className="relative h-52 overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={formData.image || previewFallbackImage}
                      alt={formData.name || "Restaurant preview"}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/25 to-transparent" />
                    <div className="absolute top-4 right-4 rounded-full bg-white/90 px-3 py-1.5 text-sm font-semibold text-slate-900 shadow-sm dark:bg-slate-900/90 dark:text-slate-100">
                      <span className="inline-flex items-center gap-1">
                        <Star size={14} className="fill-yellow-500 text-yellow-500" />
                        {Number(formData.rating || 1).toFixed(1)}
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-4 rounded-full bg-primary/95 px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
                      {formData.type || 'Toifa tanlanmagan'}
                    </div>
                  </div>

                  <div className="space-y-4 p-5">
                    <div>
                      <h4 className="text-xl font-black text-slate-900 dark:text-slate-100">
                        {formData.name || "Restoran nomi preview"}
                      </h4>
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                        {formData.address || "Manzil kiritilgach shu yerda ko'rinadi"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-300">
                      <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 dark:bg-slate-800">
                        <Clock size={14} />
                        {formData.workingHours || '09:00 - 23:00'}
                      </div>
                      <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 dark:bg-slate-800">
                        <MapPin size={14} />
                        {formData.lat && formData.lng ? `${formData.lat}, ${formData.lng}` : 'Koordinata kutilmoqda'}
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Menu preview</div>
                      {formData.menu.length === 0 ? (
                        <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-400 dark:bg-slate-900/70">
                          Taomlar qo'shilgach shu yerda ko'rinadi
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {formData.menu.slice(0, 4).map((item, index) => (
                            <div key={`${item.name}-${index}`} className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
                              <div className="font-semibold text-slate-900 dark:text-slate-100">
                                {item.name || `Taom ${index + 1}`}
                              </div>
                              <div className="mt-1 text-sm text-primary">
                                {item.price ? `${item.price} UZS` : "Narx kiritilmagan"}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}

        {canManageRestaurants && loading ? (
           <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : canManageRestaurants ? (
          <div className="bg-white dark:bg-slate-800 rounded-[28px] shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Nomi</th>
                    <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Toifasi</th>
                    <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Reyting</th>
                    <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300 text-right">Harakat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRestaurants.map(r => (
                    <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={r.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'}
                            alt={r.name}
                            className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                          <div>
                            <div className="font-medium text-slate-800 dark:text-slate-200">{r.name}</div>
                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <MapPin size={12}/> {r.location?.coordinates?.[1]}, {r.location?.coordinates?.[0]}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{r.category?.join(', ') || r.type}</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{r.rating} ★</td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleEdit(r)}
                          title="Restoranni tahrirlash"
                          className="p-2 text-slate-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 mr-1"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(r._id)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredRestaurants.length === 0 && (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-slate-500">
                        {restaurants.length === 0 ? "Hech qanday ma'lumot yo'q" : "Qidiruv bo'yicha restoran topilmadi"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {canManageRestaurants && (
          <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">Foydalanuvchi tahlili</h2>
                  <p className="text-sm text-slate-500">Ro'yxatdan o'tgan foydalanuvchilar bo'yicha tezkor ko'rsatkichlar</p>
                </div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">live</div>
              </div>
              <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 p-4">
                  <div className="text-xs text-slate-500">Jami userlar</div>
                  <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{userSummary.total}</div>
                </div>
                <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 p-4">
                  <div className="text-xs text-emerald-700 dark:text-emerald-300">Bugungi registratsiya</div>
                  <div className="mt-2 text-2xl font-bold text-emerald-900 dark:text-emerald-100">{userSummary.today}</div>
                </div>
                <div className="rounded-2xl bg-blue-50 dark:bg-blue-950/20 p-4">
                <div className="text-xs text-blue-700 dark:text-blue-300">Faol</div>
                  <div className="mt-2 text-2xl font-bold text-blue-900 dark:text-blue-100">{userSummary.active}</div>
                </div>
                <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/20 p-4">
                  <div className="text-xs text-rose-700 dark:text-rose-300">Nofaol</div>
                  <div className="mt-2 text-2xl font-bold text-rose-900 dark:text-rose-100">{userSummary.inactive}</div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Rollar taqsimoti</h3>
                <p className="text-sm text-slate-500">Marketplace rollari bo'yicha taqsimot</p>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  { label: 'Mijoz', value: userSummary.customers, tone: 'bg-slate-900 dark:bg-white' },
                  { label: 'Restoran', value: userSummary.restaurants, tone: 'bg-orange-500' },
                  { label: 'Kuryer', value: userSummary.couriers, tone: 'bg-violet-500' },
                  { label: 'Admin', value: userSummary.admins, tone: 'bg-emerald-500' },
                ].map((item) => {
                  const percentage = userSummary.total ? Math.round((item.value / userSummary.total) * 100) : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-sm">
                        <div className="font-medium text-slate-700 dark:text-slate-200">{item.label}</div>
                        <div className="text-slate-500">{item.value} ta</div>
                      </div>
                      <div className="mt-2 h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                        <div className={`h-full rounded-full ${item.tone}`} style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {canManageRestaurants && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Foydalanuvchi o'sishi</h3>
                <p className="text-sm text-slate-500">So'nggi 7 kundagi ro'yxatdan o'tishlar</p>
              </div>
              <div className="text-sm font-medium text-slate-500">
                7 kunlik jami: <span className="text-slate-800 dark:text-slate-100">{userWeeklyTrend.reduce((sum, day) => sum + day.total, 0)}</span>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-7 gap-3 items-end">
              {userWeeklyTrend.map((day) => (
                <div key={day.label} className="flex flex-col items-center gap-2">
                  <div className="text-[11px] text-center text-slate-500">{day.total}</div>
                  <div className="h-32 w-full flex items-end">
                    <div
                      className="w-full rounded-t-2xl bg-gradient-to-t from-primary via-orange-400 to-amber-300"
                      style={{ height: `${Math.max((day.total / userWeeklyMax) * 100, day.total > 0 ? 16 : 6)}%` }}
                    />
                  </div>
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">{day.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {canManageRestaurants && (
          <div className="bg-white dark:bg-slate-800 rounded-[28px] shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">User management</h2>
                <p className="text-sm text-slate-500">Rol, restoran biriktirish va kuryer holatlarini shu yerdan boshqaring</p>
              </div>
              <div className="text-sm font-medium text-slate-500">
                Jami: <span className="text-slate-800 dark:text-slate-100">{users.length}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 border-b border-slate-200 p-5 dark:border-slate-700 md:grid-cols-3">
              <div className="rounded-2xl bg-orange-50 p-4 dark:bg-orange-950/20">
                <div className="text-xs font-medium text-orange-700 dark:text-orange-300">Restoran ownerlar</div>
                <div className="mt-2 text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {assignedRestaurantOwnerCount}/{restaurantOwners.length}
                </div>
                <div className="mt-1 text-xs text-orange-700/80 dark:text-orange-300/80">
                  Biriktirilgan / jami
                </div>
              </div>
              <div className="rounded-2xl bg-amber-50 p-4 dark:bg-amber-950/20">
                <div className="text-xs font-medium text-amber-700 dark:text-amber-300">Biriktirilmagan ownerlar</div>
                <div className="mt-2 text-2xl font-bold text-amber-900 dark:text-amber-100">
                  {unassignedRestaurantOwners.length}
                </div>
                <div className="mt-1 text-xs text-amber-700/80 dark:text-amber-300/80">
                  Restoran tanlanmagan foydalanuvchilar
                </div>
              </div>
              <div className="rounded-2xl bg-sky-50 p-4 dark:bg-sky-950/20">
                <div className="text-xs font-medium text-sky-700 dark:text-sky-300">Bo'sh restoranlar</div>
                <div className="mt-2 text-2xl font-bold text-sky-900 dark:text-sky-100">
                  {unassignedRestaurants.length}
                </div>
                <div className="mt-1 text-xs text-sky-700/80 dark:text-sky-300/80">
                  Owner biriktirilmagan restoranlar
                </div>
              </div>
            </div>

            {(unassignedRestaurantOwners.length > 0 || unassignedRestaurants.length > 0) && (
              <div className="grid grid-cols-1 gap-4 border-b border-slate-200 p-5 dark:border-slate-700 lg:grid-cols-2">
                <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
                  <div className="text-sm font-semibold text-amber-900 dark:text-amber-100">Biriktirilmagan ownerlar</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {unassignedRestaurantOwners.length > 0 ? (
                      unassignedRestaurantOwners.map((listUser) => (
                        <span
                          key={listUser._id}
                          className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-amber-800 shadow-sm dark:bg-slate-900 dark:text-amber-200"
                        >
                          {listUser.username}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">Hamma ownerlarga restoran biriktirilgan</span>
                    )}
                  </div>
                </div>
                <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 dark:border-sky-900/40 dark:bg-sky-950/20">
                  <div className="text-sm font-semibold text-sky-900 dark:text-sky-100">Bo'sh restoranlar</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {unassignedRestaurants.length > 0 ? (
                      unassignedRestaurants.map((restaurant) => (
                        <span
                          key={restaurant._id}
                          className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-sky-800 shadow-sm dark:bg-slate-900 dark:text-sky-200"
                        >
                          {restaurant.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">Barcha restoranlarga owner biriktirilgan</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 border-b border-slate-200 p-5 dark:border-slate-700 md:grid-cols-[minmax(0,1fr)_220px]">
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-500">Foydalanuvchi qidirish</label>
                <input
                  type="text"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  placeholder="Ism, email, telefon yoki restoran nomi"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-500">Rol bo'yicha filter</label>
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="all">Barcha rollar</option>
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {formatRole(role)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {usersLoading ? (
              <div className="flex justify-center p-10">
                <Loader2 className="animate-spin text-primary" size={28} />
              </div>
            ) : (
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                      <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Foydalanuvchi</th>
                      <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Telefon</th>
                      <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Rol</th>
                      <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Biriktirilgan restoran</th>
                      <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Holat</th>
                      <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Courier</th>
                      <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredUsers.map((listUser) => (
                      <tr key={listUser._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-4">
                          <div className="font-medium text-slate-800 dark:text-slate-200">{listUser.username}</div>
                          <div className="text-sm text-slate-500 mt-1">{listUser.email}</div>
                        </td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{listUser.phone || "yo'q"}</td>
                        <td className="p-4">
                          <select
                            value={listUser.role}
                            disabled={updatingUserId === listUser._id}
                            onChange={(e) => handleAdminUserUpdate(listUser._id, { role: e.target.value })}
                            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 outline-none focus:border-primary"
                          >
                            {roleOptions.map((role) => (
                              <option key={role} value={role}>
                                {formatRole(role)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-4">
                          {listUser.role === 'restaurant' ? (
                            <div className="space-y-2">
                              <div className="text-xs font-medium text-slate-500">
                                {listUser.restaurantId
                                  ? `Joriy: ${restaurants.find((restaurant) => restaurant._id === listUser.restaurantId)?.name || 'Biriktirilgan'}`
                                  : 'Joriy: biriktirilmagan'}
                              </div>
                              <select
                                value={listUser.restaurantId || ''}
                                disabled={updatingUserId === listUser._id}
                                onChange={(e) => handleAdminUserUpdate(listUser._id, { restaurantId: e.target.value || null })}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 outline-none focus:border-primary"
                              >
                                <option value="">Restoran tanlang</option>
                                {restaurants.map((restaurant) => (
                                  <option key={restaurant._id} value={restaurant._id}>
                                    {restaurant.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-4">
                          <button
                            type="button"
                            disabled={updatingUserId === listUser._id}
                            onClick={() => handleAdminUserUpdate(listUser._id, { isActive: !listUser.isActive })}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                              listUser.isActive
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                            }`}
                          >
                            {formatActivity(listUser.isActive)}
                          </button>
                        </td>
                        <td className="p-4">
                          {listUser.role === 'courier' ? (
                            <div className="space-y-2">
                              <div className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                listUser.isAvailable
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                  : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                              }`}>
                                {formatAvailability(listUser.isAvailable)}
                              </div>
                              <div className="text-xs text-slate-500">{listUser.vehicleType || "transport yo'q"}</div>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            {listUser.role === 'courier' ? (
                              <button
                                type="button"
                                disabled={updatingUserId === listUser._id}
                                onClick={() => handleAdminUserUpdate(listUser._id, { isAvailable: !listUser.isAvailable })}
                                className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors disabled:opacity-60"
                              >
                                {listUser.isAvailable ? "Band qilish" : "Bo'sh qilish"}
                              </button>
                            ) : null}
                            <button
                              type="button"
                              disabled={updatingUserId === listUser._id || listUser._id === user._id}
                              onClick={() => handleAdminDeleteUser(listUser._id)}
                              className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-60"
                            >
                              O'chirish
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-slate-500">
                          Qidiruv bo'yicha foydalanuvchi topilmadi
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {canManageRestaurants && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Audit log</h2>
                <p className="text-sm text-slate-500">Admin va marketplace amallarining oxirgi tarixi</p>
              </div>
              <div className="text-sm font-medium text-slate-500">
                Yozuvlar: <span className="text-slate-800 dark:text-slate-100">{auditLogs.length}</span>
              </div>
            </div>

            {auditLogsLoading ? (
              <div className="flex justify-center p-10">
                <Loader2 className="animate-spin text-primary" size={28} />
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-500">Hozircha audit log yo'q</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.slice(0, 12).map((log) => (
                  <div key={log._id} className="p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div className="font-medium text-slate-800 dark:text-slate-100">
                        {log.message || log.action}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      Actor: {log.actor?.username || 'System'} | Entity: {log.entityType} {log.entityId ? `#${String(log.entityId).slice(-6)}` : ''}
                    </div>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="mt-2 text-xs text-slate-400">
                        {Object.entries(log.metadata)
                          .slice(0, 4)
                          .map(([key, value]) => `${key}: ${value ?? '-'}`)
                          .join(' | ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {canManageRestaurants && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Promo management</h2>
                <p className="text-sm text-slate-500">Checkout uchun chegirma kodlarini shu yerdan yarating va boshqaring</p>
              </div>
              <div className="text-sm font-medium text-slate-500">
                Kodlar: <span className="text-slate-800 dark:text-slate-100">{promoCodes.length}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.15fr,1.85fr] gap-0">
              <div className="p-5 border-b xl:border-b-0 xl:border-r border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Yangi promokod</h3>
                <form onSubmit={handleCreatePromoCode} className="mt-4 space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">Kod</label>
                    <input
                      required
                      type="text"
                      value={promoForm.code}
                      onChange={(e) => setPromoForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      placeholder="MASALAN: FOOD10"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 outline-none focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500">Chegirma turi</label>
                      <select
                        value={promoForm.discountType}
                        onChange={(e) => setPromoForm((prev) => ({ ...prev, discountType: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 outline-none focus:border-primary"
                      >
                        <option value="percent">Foiz</option>
                        <option value="fixed">Summaviy</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500">
                        {promoForm.discountType === 'percent' ? 'Foiz miqdori' : 'Chegirma summasi'}
                      </label>
                      <input
                        required
                        min="0"
                        step="any"
                        type="number"
                        value={promoForm.discountValue}
                        onChange={(e) => setPromoForm((prev) => ({ ...prev, discountValue: e.target.value }))}
                        placeholder={promoForm.discountType === 'percent' ? '10' : '15000'}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500">Minimal buyurtma summasi</label>
                      <input
                        min="0"
                        step="any"
                        type="number"
                        value={promoForm.minOrderAmount}
                        onChange={(e) => setPromoForm((prev) => ({ ...prev, minOrderAmount: e.target.value }))}
                        placeholder="0"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500">Foydalanish limiti</label>
                      <input
                        min="1"
                        step="1"
                        type="number"
                        value={promoForm.usageLimit}
                        onChange={(e) => setPromoForm((prev) => ({ ...prev, usageLimit: e.target.value }))}
                        placeholder="Cheklanmagan"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500">Tugash sanasi</label>
                      <input
                        type="datetime-local"
                        value={promoForm.expiresAt}
                        onChange={(e) => setPromoForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 outline-none focus:border-primary"
                      />
                    </div>
                    <label className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={promoForm.oneTimePerUser}
                        onChange={(e) => setPromoForm((prev) => ({ ...prev, oneTimePerUser: e.target.checked }))}
                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      Bir foydalanuvchiga bir marta
                    </label>
                    <label className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={promoForm.firstOrderOnly}
                        onChange={(e) => setPromoForm((prev) => ({ ...prev, firstOrderOnly: e.target.checked }))}
                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      Faqat birinchi buyurtma uchun
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white transition-colors hover:bg-orange-600"
                  >
                    Promokod yaratish
                  </button>
                </form>
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Faol promokodlar</h3>
                  <div className="text-xs text-slate-500">
                    Faol: {promoCodes.filter((promo) => promo.isActive).length} / {promoCodes.length}
                  </div>
                </div>

                {promoCodesLoading ? (
                  <div className="flex justify-center p-10">
                    <Loader2 className="animate-spin text-primary" size={28} />
                  </div>
                ) : promoCodes.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500">
                    Hozircha promokod yo'q
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {promoCodes.map((promo) => {
                      const isExpired = promo.expiresAt ? new Date(promo.expiresAt) < new Date() : false;
                      const isEditingPromo = editingPromoId === promo._id;

                      return (
                        <div
                          key={promo._id}
                          className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/60 p-4"
                        >
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold tracking-[0.18em] text-white dark:bg-white dark:text-slate-900">
                                  {promo.code}
                                </div>
                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                    promo.isActive
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                      : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                                  }`}
                                >
                                  {formatActivity(promo.isActive)}
                                </span>
                                {isExpired && (
                                  <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                                    Muddati tugagan
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-300">
                                Chegirma:{' '}
                                <span className="font-semibold text-slate-800 dark:text-slate-100">
                                  {promo.discountType === 'percent'
                                    ? `${promo.discountValue}%`
                                    : `${Number(promo.discountValue || 0).toLocaleString()} UZS`}
                                </span>
                              </div>
                              <div className="text-sm text-slate-500">
                                Minimal summa: {Number(promo.minOrderAmount || 0).toLocaleString()} UZS
                              </div>
                              <div className="text-sm text-slate-500">
                                Ishlatilgan: {promo.usageCount || 0}
                                {promo.usageLimit ? ` / ${promo.usageLimit}` : ' / cheklanmagan'}
                              </div>
                              <div className="text-sm text-slate-500">
                                Rejim: {promo.oneTimePerUser ? 'one-time per user' : 'qayta ishlatish mumkin'}
                              </div>
                              <div className="text-sm text-slate-500">
                                Buyurtma qoidasi: {promo.firstOrderOnly ? 'first-order only' : 'har qanday buyurtma'}
                              </div>
                              <div className="text-sm text-slate-500">
                                Muddati:{' '}
                                {promo.expiresAt ? new Date(promo.expiresAt).toLocaleString() : 'Cheklanmagan'}
                              </div>
                            </div>

                            <div className="flex min-w-[144px] flex-col gap-2">
                              <button
                                type="button"
                                disabled={updatingPromoId === promo._id}
                                onClick={() => handleTogglePromoCode(promo._id, promo.isActive)}
                                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
                                  promo.isActive
                                    ? 'border border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/30'
                                    : 'bg-slate-900 text-white hover:opacity-90 dark:bg-white dark:text-slate-900'
                                }`}
                              >
                                {updatingPromoId === promo._id
                                  ? 'Yangilanmoqda...'
                                  : promo.isActive
                                    ? 'Deaktiv qilish'
                                    : 'Aktiv qilish'}
                              </button>
                              <button
                                type="button"
                                disabled={updatingPromoId === promo._id}
                                onClick={() => (isEditingPromo ? handleCancelPromoEdit() : handleStartPromoEdit(promo))}
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                              >
                                {isEditingPromo ? 'Bekor qilish' : 'Edit'}
                              </button>
                            </div>
                          </div>

                          {isEditingPromo && (
                            <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-200 pt-4 dark:border-slate-700 md:grid-cols-2 xl:grid-cols-4">
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Chegirma turi</label>
                                <select
                                  value={promoEditForm.discountType}
                                  onChange={(e) => setPromoEditForm((prev) => ({ ...prev, discountType: e.target.value }))}
                                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 outline-none focus:border-primary"
                                >
                                  <option value="percent">Foiz</option>
                                  <option value="fixed">Fixed</option>
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Qiymat</label>
                                <input
                                  min="0"
                                  step="any"
                                  type="number"
                                  value={promoEditForm.discountValue}
                                  onChange={(e) => setPromoEditForm((prev) => ({ ...prev, discountValue: e.target.value }))}
                                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 outline-none focus:border-primary"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Minimal summa</label>
                                <input
                                  min="0"
                                  step="any"
                                  type="number"
                                  value={promoEditForm.minOrderAmount}
                                  onChange={(e) => setPromoEditForm((prev) => ({ ...prev, minOrderAmount: e.target.value }))}
                                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 outline-none focus:border-primary"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Usage limit</label>
                                <input
                                  min="1"
                                  step="1"
                                  type="number"
                                  value={promoEditForm.usageLimit}
                                  onChange={(e) => setPromoEditForm((prev) => ({ ...prev, usageLimit: e.target.value }))}
                                  placeholder="Cheklanmagan"
                                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 outline-none focus:border-primary"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Tugash sanasi</label>
                                <input
                                  type="datetime-local"
                                  value={promoEditForm.expiresAt}
                                  onChange={(e) => setPromoEditForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
                                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 outline-none focus:border-primary"
                                />
                              </div>
                              <label className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                                <input
                                  type="checkbox"
                                  checked={promoEditForm.oneTimePerUser}
                                  onChange={(e) => setPromoEditForm((prev) => ({ ...prev, oneTimePerUser: e.target.checked }))}
                                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                                />
                                Bir foydalanuvchiga bir marta
                              </label>
                              <label className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                                <input
                                  type="checkbox"
                                  checked={promoEditForm.firstOrderOnly}
                                  onChange={(e) => setPromoEditForm((prev) => ({ ...prev, firstOrderOnly: e.target.checked }))}
                                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                                />
                                Faqat birinchi buyurtma uchun
                              </label>
                              <div className="md:col-span-2 xl:col-span-4 flex justify-end">
                                <button
                                  type="button"
                                  disabled={updatingPromoId === promo._id}
                                  onClick={() => handleSavePromoEdit(promo._id)}
                                  className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
                                >
                                  {updatingPromoId === promo._id ? 'Saqlanmoqda...' : 'O\'zgarishlarni saqlash'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-xs font-medium text-slate-500">Jami buyurtmalar</div>
            <div className="mt-2 text-3xl font-bold text-slate-800 dark:text-white">{orderSummary.total}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-xs font-medium text-slate-500">
              {user.role === 'courier' ? 'Yetkazilayotganlar' : 'Kutilayotganlar'}
            </div>
            <div className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-300">
              {user.role === 'courier'
                ? orders.filter((order) => order.status === 'delivering').length
                : orderSummary.pending}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-xs font-medium text-slate-500">
              {user.role === 'restaurant' ? 'Pishirilayotganlar' : 'Yetkazilganlar'}
            </div>
            <div className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-300">
              {user.role === 'restaurant'
                ? orders.filter((order) => order.status === 'cooking').length
                : orderSummary.delivered}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-xs font-medium text-slate-500">
              {user.role === 'courier' ? 'Bugungi topshiriq' : 'Shoshilinchlar'}
            </div>
            <div className="mt-2 text-3xl font-bold text-slate-800 dark:text-white">
              {user.role === 'courier'
                ? `${orders.filter((order) => ['delivering', 'confirmed', 'cooking'].includes(order.status)).length} ta`
                : `${orderSummary.urgent} ta`}
            </div>
          </div>
        </div>

        {user.role !== 'courier' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="text-xs font-medium text-slate-500">To'langan buyurtmalar</div>
              <div className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-300">{orderSummary.paid}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="text-xs font-medium text-slate-500">To'lovga tushgan summa</div>
              <div className="mt-2 text-3xl font-bold text-slate-800 dark:text-white">
                {financialSummary.grossRevenue.toLocaleString()} UZS
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="text-xs font-medium text-slate-500">Refund qilingan summa</div>
              <div className="mt-2 text-3xl font-bold text-rose-600 dark:text-rose-300">
                {financialSummary.refundedAmount.toLocaleString()} UZS
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="text-xs font-medium text-slate-500">Net revenue</div>
              <div className="mt-2 text-3xl font-bold text-slate-800 dark:text-white">
                {financialSummary.netRevenue.toLocaleString()} UZS
              </div>
            </div>
          </div>
        )}

        {user.role === 'courier' && (
          <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-900/40 dark:bg-violet-950/20">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-300">
                  Jonli lokatsiya
                </div>
                <h3 className="mt-1 text-lg font-bold text-slate-800 dark:text-white">
                  Joriy joylashuvingizni admin va restoranlarga yuboring
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Oxirgi update: {user.currentLocation?.updatedAt ? new Date(user.currentLocation.updatedAt).toLocaleString() : "hali yuborilmagan"}
                </p>
              </div>
              <div className="flex flex-col items-start gap-2 sm:items-end">
                {user.currentLocation?.lat !== null && user.currentLocation?.lat !== undefined && user.currentLocation?.lng !== null && user.currentLocation?.lng !== undefined && (
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    Lat: {user.currentLocation.lat}, Lng: {user.currentLocation.lng}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setAutoSharingCourierLocation((prev) => !prev)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                    autoSharingCourierLocation
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {autoSharingCourierLocation ? 'Avto ulashish yoqilgan' : 'Avto ulashishni yoqish'}
                </button>
                <button
                  type="button"
                  onClick={handleShareCourierLocation}
                  disabled={sharingCourierLocation}
                  className="rounded-xl bg-primary px-5 py-3 font-semibold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-orange-600 disabled:opacity-60"
                >
                  {sharingCourierLocation ? "Yuborilmoqda..." : "Mening joylashuvimni yuborish"}
                </button>
              </div>
            </div>
          </div>
        )}

        {urgentOrders.length > 0 && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-100">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-600 dark:text-rose-300">
                  Shoshilinch navbat
                </div>
                <h3 className="mt-1 text-lg font-bold">
                  {urgentOrders.length} ta buyurtma SLA chegarasiga yaqin yoki kechikkan
                </h3>
                <p className="mt-1 text-sm text-rose-700 dark:text-rose-200">
                  Avval uzoq kutilgan, tasdiqlangan, tayyorlanayotgan va yetkazilayotgan buyurtmalarni ko'rib chiqing.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {urgentOrders.slice(0, 4).map((order) => (
                  <button
                    key={order._id}
                    type="button"
                    onClick={() => setSelectedOrder(order)}
                    className={`rounded-full border px-3 py-2 text-xs font-semibold hover:bg-rose-100 dark:bg-slate-900 dark:hover:bg-rose-950/40 ${
                      recentOrderIds.includes(order._id)
                        ? 'border-primary bg-primary/10 text-primary dark:border-primary/50 dark:text-primary'
                        : 'border-rose-200 bg-white text-rose-700 dark:border-rose-800 dark:text-rose-200'
                    }`}
                  >
                    {order.restaurant?.name || 'Buyurtma'} · {getOrderAgeMinutes(order)} min {recentOrderIds.includes(order._id) ? '• yangi' : ''}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Haftalik trend</h3>
                <p className="text-sm text-slate-500">So'nggi 7 kundagi buyurtma oqimi va tushum</p>
              </div>
              <div className="text-right">
                <div className="text-xs font-medium text-slate-500">7 kunlik tushum</div>
                <div className="mt-1 text-xl font-bold text-slate-800 dark:text-white">
                  {weeklyTrend.reduce((sum, day) => sum + day.revenue, 0).toLocaleString()} UZS
                </div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-7 gap-3 items-end h-64">
              {weeklyTrend.map((day) => (
                <div key={day.label} className="flex h-full flex-col justify-end">
                  <div className="text-[11px] text-center text-slate-500 mb-2">{day.total}</div>
                  <div
                    className="rounded-t-2xl bg-gradient-to-t from-primary to-orange-300 dark:to-orange-400 transition-all"
                    style={{ height: `${Math.max((day.total / weeklyMaxOrders) * 100, day.total > 0 ? 16 : 8)}%` }}
                  />
                  <div className="mt-3 text-center">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">{day.label}</div>
                    <div className="text-[11px] text-slate-500">{formatCompactMoney(day.revenue)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Statuslar taqsimoti</h3>
            <p className="text-sm text-slate-500">Joriy scope ichidagi buyurtmalar taqsimoti</p>
            <div className="mt-5 space-y-4">
              {statusBreakdown.map((item) => (
                <div key={item.status}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusClasses[item.status] || statusClasses.pending}`}>
                        {formatOrderStatus(item.status)}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-700 dark:text-slate-200">
                      {item.count} ta
                    </div>
                  </div>
                  <div className="mt-2 h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-orange-300"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {(canManageRestaurants || user.role === 'restaurant') && restaurantPerformance.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  {canManageRestaurants ? 'Top restoranlar' : 'Performance snapshot'}
                </h3>
                <p className="text-sm text-slate-500">
                  {canManageRestaurants
                    ? "Buyurtma soni bo'yicha eng faol restoranlar"
                    : "Sizning buyurtma oqimingiz va tushum ko'rsatkichi"}
                </p>
              </div>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wide text-slate-500">
                    <th className="pb-3 font-medium">Restoran</th>
                    <th className="pb-3 font-medium">Buyurtma</th>
                    <th className="pb-3 font-medium text-right">Tushum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {restaurantPerformance.map((item) => (
                    <tr key={item.name}>
                      <td className="py-3 pr-4">
                        <div className="font-medium text-slate-800 dark:text-slate-100">{item.name}</div>
                      </td>
                      <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{item.totalOrders} ta</td>
                      <td className="py-3 text-right font-semibold text-slate-800 dark:text-slate-100">
                        {item.revenue.toLocaleString()} UZS
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!canManageRestaurants && (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Ish oqimi</div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {user.role === 'restaurant' && (
                  <>
                    <div className="rounded-2xl bg-amber-50 dark:bg-amber-500/10 p-4">
                      <div className="text-xs text-amber-700 dark:text-amber-300">Tasdiqlash kerak</div>
                      <div className="mt-2 text-2xl font-bold text-amber-900 dark:text-amber-100">
                        {orders.filter((order) => order.status === 'pending').length}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-blue-50 dark:bg-blue-500/10 p-4">
                      <div className="text-xs text-blue-700 dark:text-blue-300">Tasdiqlangan</div>
                      <div className="mt-2 text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {orders.filter((order) => order.status === 'confirmed').length}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-orange-50 dark:bg-orange-500/10 p-4">
                      <div className="text-xs text-orange-700 dark:text-orange-300">Pishirilmoqda</div>
                      <div className="mt-2 text-2xl font-bold text-orange-900 dark:text-orange-100">
                        {orders.filter((order) => order.status === 'cooking').length}
                      </div>
                    </div>
                  </>
                )}
                {user.role === 'courier' && (
                  <>
                    <div className="rounded-2xl bg-violet-50 dark:bg-violet-500/10 p-4">
                      <div className="text-xs text-violet-700 dark:text-violet-300">Yo'lda</div>
                      <div className="mt-2 text-2xl font-bold text-violet-900 dark:text-violet-100">
                        {orders.filter((order) => order.status === 'delivering').length}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 p-4">
                      <div className="text-xs text-emerald-700 dark:text-emerald-300">Topshirildi</div>
                      <div className="mt-2 text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                        {orders.filter((order) => order.status === 'delivered').length}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-100 dark:bg-slate-700/40 p-4">
                      <div className="text-xs text-slate-600 dark:text-slate-300">Jami biriktirilgan</div>
                      <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {orders.length}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Tezkor eslatma</div>
              <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                {user.role === 'restaurant' && (
                  <>
                    <li>Kutilayotgan buyurtmalarni imkon qadar tez tasdiqlangan holatiga o'tkazing.</li>
                    <li>Tayyor bo'lgach buyurtmani kuryer oqimiga vaqtida topshiring.</li>
                    <li>Bekor qilingan buyurtmalar uchun qisqa izoh qoldirish foydali bo'ladi.</li>
                  </>
                )}
                {user.role === 'courier' && (
                  <>
                    <li>Bu yerda faqat sizga biriktirilgan buyurtmalar ko'rsatiladi.</li>
                    <li>Yetkazilmoqda holatidan yetkazildi holatiga o'tganda mijozga bildirishnoma boradi.</li>
                    <li>Panel real-time yangilanadi, qo'lda refresh talab qilinmaydi.</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">{dashboardConfig.orderTitle}</h2>
              <p className="text-sm text-slate-500">{dashboardConfig.orderDescription}</p>
            </div>
            <div className="text-sm font-medium text-slate-500">
              Ko'rsatilmoqda: <span className="text-slate-800 dark:text-slate-100">{filteredOrders.length}</span>
            </div>
          </div>

          <div className="p-5 border-b border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-2">Status filtri</label>
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-primary"
              >
                <option value="all">Barchasi</option>
                {orderStatuses.map((status) => (
                  <option key={status} value={status}>
                    {formatOrderStatus(status)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-2">To'lov filtri</label>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-primary"
              >
                <option value="all">Barchasi</option>
                {paymentStatuses.map((status) => (
                  <option key={status} value={status}>
                    {formatPaymentStatus(status)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-2">Tartiblash</label>
              <select
                value={orderSort}
                onChange={(e) => setOrderSort(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-primary"
              >
                <option value="newest">Eng yangi</option>
                <option value="oldest">Eng eski</option>
                <option value="amount_high">Summa: yuqoridan pastga</option>
                <option value="amount_low">Summa: pastdan yuqoriga</option>
              </select>
            </div>
          </div>

          {ordersLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-500">Hozircha buyurtmalar yo'q</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredOrders.map((order) => {
                const urgent = isUrgentOrder(order);
                const orderAgeMinutes = getOrderAgeMinutes(order);
                const isRecent = recentOrderIds.includes(order._id);
                const hasDeliveryCoordinates =
                  order.deliveryAddress?.lat !== null &&
                  order.deliveryAddress?.lat !== undefined &&
                  order.deliveryAddress?.lng !== null &&
                  order.deliveryAddress?.lng !== undefined;
                const orderMapUrl = getOrderMapUrl(order);
                const distanceKm = getOrderDistanceKm(order);
                const etaMinutes = getOrderEtaMinutes(distanceKm);
                const slaRemainingMinutes = getOrderSlaRemainingMinutes(order);
                const normalizedPhone = (order.customerPhone || '').replace(/[^\d+]/g, '');
                const phoneHref = normalizedPhone ? `tel:${normalizedPhone}` : '';
                const smsHref = normalizedPhone ? `sms:${normalizedPhone}` : '';
                const whatsappPhone = normalizedPhone.replace(/^\+/, '');
                const whatsappHref = whatsappPhone ? `https://wa.me/${whatsappPhone}` : '';

                return (
                  <div
                    key={order._id}
                    className={`p-5 flex flex-col gap-4 transition-colors ${
                      isRecent
                        ? 'bg-primary/10 ring-1 ring-primary/30 dark:bg-primary/10'
                        : urgent
                          ? 'bg-rose-50/80 dark:bg-rose-950/10'
                          : ''
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                            {order.restaurant?.name || "Noma'lum restoran"}
                          </h3>
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusClasses[order.status] || statusClasses.pending}`}>
                            {formatOrderStatus(order.status)}
                          </span>
                          {urgent && (
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 animate-pulse">
                              shoshilinch
                            </span>
                          )}
                          {isRecent && (
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-primary/15 text-primary animate-pulse">
                              yangi
                            </span>
                          )}
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${paymentStatusClasses[order.paymentStatus] || paymentStatusClasses.unpaid}`}>
                            {formatPaymentStatus(order.paymentStatus || 'unpaid')}
                          </span>
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                            {normalizeCategoryLabel(order.type)}
                        </span>
                        </div>
                        <p className="text-sm text-slate-500">
                          Mijoz: {order.customer?.username || "Noma'lum"} ({order.customer?.email || "email yo'q"})
                        </p>
                        <p className="text-sm text-slate-500">
                          Telefon: {order.customerPhone || "telefon yo'q"}
                        </p>
                        {order.customerPhone && (
                          <div className="flex flex-wrap items-center gap-2">
                            <a
                              href={phoneHref}
                              className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-slate-900"
                            >
                              Qo'ng'iroq
                            </a>
                            <a
                              href={whatsappHref}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                            >
                              WhatsApp
                            </a>
                            <a
                              href={smsHref}
                              className="inline-flex rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                            >
                              SMS
                            </a>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(order.customerPhone, 'Telefon raqam')}
                              className="inline-flex rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
                            >
                              Copy phone
                            </button>
                          </div>
                        )}
                        <p className="text-sm text-slate-500">
                          Delivery: {order.deliveryAddress?.address || "Manzil ko'rsatilmagan"}
                        </p>
                        {(distanceKm !== null || etaMinutes !== null) && (
                          <p className="text-sm text-slate-500">
                            Masofa: {distanceKm !== null ? `${distanceKm.toFixed(1)} km` : "noma'lum"} | ETA: {etaMinutes !== null ? `${etaMinutes} daqiqa` : "noma'lum"}
                          </p>
                        )}
                        {order.deliveryAddress?.address && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(order.deliveryAddress.address, 'Manzil')}
                            className="inline-flex rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
                          >
                            Copy address
                          </button>
                        )}
                        {order.courier && (
                          <div className="space-y-1">
                            <p className="text-sm text-slate-500">
                              Kuryer: {order.courier?.username} {order.courier?.vehicleType ? `(${order.courier.vehicleType})` : ''}
                            </p>
                            {order.courier?.currentLocation?.lat !== null &&
                              order.courier?.currentLocation?.lat !== undefined &&
                              order.courier?.currentLocation?.lng !== null &&
                              order.courier?.currentLocation?.lng !== undefined && (
                                <p className="text-sm text-slate-500">
                                  Kuryer lokatsiyasi: {order.courier.currentLocation.lat}, {order.courier.currentLocation.lng}
                                </p>
                              )}
                          </div>
                        )}
                        <p className="text-sm text-slate-500">
                          Sana: {new Date(order.createdAt).toLocaleString()}
                        </p>
                        <p className={`text-sm font-medium ${urgent ? 'text-rose-600 dark:text-rose-300' : 'text-slate-500'}`}>
                          Navbat yoshi: {orderAgeMinutes} daqiqa
                        </p>
                        {slaRemainingMinutes !== null && (
                          <p className={`text-sm font-medium ${
                            slaRemainingMinutes <= 0
                              ? 'text-rose-600 dark:text-rose-300'
                              : slaRemainingMinutes <= 5
                                ? 'text-amber-600 dark:text-amber-300'
                                : 'text-emerald-600 dark:text-emerald-300'
                          }`}>
                            SLA: {slaRemainingMinutes > 0 ? `${slaRemainingMinutes} daqiqa qoldi` : `${Math.abs(slaRemainingMinutes)} daqiqa kechikdi`}
                          </p>
                        )}
                        {order.note && (
                          <p className="text-sm text-slate-500">Izoh: {order.note}</p>
                        )}
                        {hasDeliveryCoordinates && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                              <MapPin size={12} />
                              {user.role === 'courier' ? 'Marshrut tayyor' : 'Lokatsiya tayyor'}
                            </span>
                            <a
                              href={orderMapUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold transition-opacity hover:opacity-90 ${
                                user.role === 'courier'
                                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                  : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                              }`}
                            >
                              {user.role === 'courier' ? 'Marshrutni ochish' : 'Xarita'}
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                        <div className="text-right">
                          <div className="text-xs font-medium text-slate-500">Jami summa</div>
                          <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
                            {order.totalPrice?.toLocaleString()} UZS
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                        >
                          Batafsil
                        </button>
                        <select
                          value={order.status}
                          disabled={updatingOrderId === order._id}
                          onChange={(e) => handleOrderStatusChange(order._id, e.target.value)}
                          className="min-w-[170px] p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-primary disabled:opacity-60"
                        >
                          {getAllowedStatusOptions(user.role, order.status).map((status) => (
                            <option key={status} value={status}>
                              {formatOrderStatus(status)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Tarkib</div>
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={`${order._id}-${index}`} className="flex items-center justify-between gap-3 text-sm">
                            <div className="text-slate-700 dark:text-slate-200">
                              {item.name} x {item.quantity}
                            </div>
                            <div className="font-semibold text-slate-800 dark:text-slate-100">
                              {(item.price * item.quantity).toLocaleString()} UZS
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <OrderDetailModal
          selectedOrder={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          userRole={user.role}
          canAssignCouriers={canAssignCouriers}
          couriers={couriers}
          selectedCourierId={selectedCourierId}
          setSelectedCourierId={setSelectedCourierId}
          assigningCourierId={assigningCourierId}
          handleAssignCourier={handleAssignCourier}
          paymentStatuses={paymentStatuses}
          paymentStatusClasses={paymentStatusClasses}
          selectedPaymentStatus={selectedPaymentStatus}
          setSelectedPaymentStatus={setSelectedPaymentStatus}
          refundReason={refundReason}
          setRefundReason={setRefundReason}
          updatingOrderId={updatingOrderId}
          handlePaymentStatusChange={handlePaymentStatusChange}
          handleRefundOrder={handleRefundOrder}
          statusClasses={statusClasses}
          isUrgentOrder={isUrgentOrder}
          getOrderAgeMinutes={getOrderAgeMinutes}
          formatOrderStatus={formatOrderStatus}
          formatPaymentStatus={formatPaymentStatus}
          formatAvailability={formatAvailability}
        />
      </div>
    </div>
  );
}




