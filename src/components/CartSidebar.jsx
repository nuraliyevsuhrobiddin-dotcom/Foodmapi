import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import toast from 'react-hot-toast';
import CartModal from './CartModal';
import useOverlay from '../hooks/useOverlay';
import { OVERLAYS } from '../constants/overlay';

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
  const { user, token } = useAuth();
  const cartOverlay = useOverlay(OVERLAYS.CART);
  const authOverlay = useOverlay(OVERLAYS.AUTH);
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
      authOverlay.open();
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
    <CartModal
      isOpen={cartOverlay.isOpen || isCartOpen}
      onClose={cartOverlay.close}
      cartItems={cartItems}
      removeFromCart={removeFromCart}
      updateQuantity={updateQuantity}
      cartTotal={cartTotal}
      promoCode={promoCode}
      setPromoCode={setPromoCode}
      isApplyingPromo={isApplyingPromo}
      handleApplyPromo={handleApplyPromo}
      appliedPromo={appliedPromo}
      customerPhone={customerPhone}
      setCustomerPhone={(value) =>
        setCustomerPhone(typeof value === 'string' ? normalizePhoneInput(value) : value)
      }
      deliveryLabel={deliveryLabel}
      setDeliveryLabel={setDeliveryLabel}
      deliveryAddress={deliveryAddress}
      setDeliveryAddress={setDeliveryAddress}
      deliveryLat={deliveryLat}
      setDeliveryLat={setDeliveryLat}
      deliveryLng={deliveryLng}
      setDeliveryLng={setDeliveryLng}
      isLocating={isLocating}
      handleDetectLocation={handleDetectLocation}
      handleCheckout={handleCheckout}
      isSubmitting={isSubmitting}
    />
  );
}
