import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function OrderDetailModal({
  selectedOrder,
  onClose,
  userRole,
  canAssignCouriers,
  couriers,
  selectedCourierId,
  setSelectedCourierId,
  assigningCourierId,
  handleAssignCourier,
  paymentStatuses,
  paymentStatusClasses,
  selectedPaymentStatus,
  setSelectedPaymentStatus,
  refundReason,
  setRefundReason,
  updatingOrderId,
  handlePaymentStatusChange,
  handleRefundOrder,
  statusClasses,
  isUrgentOrder,
  getOrderAgeMinutes,
  formatOrderStatus,
  formatPaymentStatus,
  formatAvailability,
}) {
  const [, setNow] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, []);

  if (!selectedOrder) return null;

  const hasDeliveryCoordinates =
    selectedOrder.deliveryAddress?.lat !== null &&
    selectedOrder.deliveryAddress?.lat !== undefined &&
    selectedOrder.deliveryAddress?.lng !== null &&
    selectedOrder.deliveryAddress?.lng !== undefined;
  const mapUrl = hasDeliveryCoordinates
    ? `https://www.google.com/maps?q=${selectedOrder.deliveryAddress.lat},${selectedOrder.deliveryAddress.lng}`
    : '';
  const normalizedPhone = (selectedOrder.customerPhone || '').replace(/[^\d+]/g, '');
  const phoneHref = normalizedPhone ? `tel:${normalizedPhone}` : '';
  const smsHref = normalizedPhone ? `sms:${normalizedPhone}` : '';
  const whatsappPhone = normalizedPhone.replace(/^\+/, '');
  const whatsappHref = whatsappPhone ? `https://wa.me/${whatsappPhone}` : '';
  const restaurantLng = selectedOrder.restaurant?.location?.coordinates?.[0];
  const restaurantLat = selectedOrder.restaurant?.location?.coordinates?.[1];
  const customerLat = selectedOrder.deliveryAddress?.lat;
  const customerLng = selectedOrder.deliveryAddress?.lng;
  const hasDistanceData =
    restaurantLat !== null &&
    restaurantLat !== undefined &&
    restaurantLng !== null &&
    restaurantLng !== undefined &&
    customerLat !== null &&
    customerLat !== undefined &&
    customerLng !== null &&
    customerLng !== undefined;

  const distanceKm = hasDistanceData
    ? (() => {
        const earthRadiusKm = 6371;
        const toRadians = (value) => (value * Math.PI) / 180;
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
      })()
    : null;
  const etaMinutes = distanceKm !== null ? Math.max(Math.round(distanceKm * 4 + 10), 10) : null;
  const slaLimitMinutes =
    selectedOrder.status === 'pending'
      ? 15
      : selectedOrder.status === 'confirmed'
        ? 25
        : selectedOrder.status === 'cooking'
          ? 40
          : selectedOrder.status === 'delivering'
            ? 50
            : null;
  const orderAgeMinutes = getOrderAgeMinutes(selectedOrder);
  const slaRemainingMinutes =
    slaLimitMinutes !== null ? slaLimitMinutes - orderAgeMinutes : null;

  const copyValue = async (value, label) => {
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

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-slate-950/72 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-[28px] sm:rounded-[32px] border border-white/10 bg-slate-950/88 shadow-[0_24px_80px_rgba(15,23,42,0.5)] backdrop-blur-2xl ios-safe-bottom-lg">
        <div className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-slate-950/92 px-4 py-4 backdrop-blur sm:px-6">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white">Buyurtma tafsiloti</h3>
            <p className="text-sm text-white/50">
              {selectedOrder.restaurant?.name || "Noma'lum restoran"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="touch-target flex items-center justify-center rounded-2xl bg-white/[0.08] text-white/70 transition hover:bg-white/[0.12] hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 sm:space-y-6 p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
              <div className="text-xs font-medium text-slate-500">Mijoz</div>
              <div className="mt-2 font-semibold text-slate-800 dark:text-slate-100">
                {selectedOrder.customer?.username || "Noma'lum"}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                {selectedOrder.customer?.email || "email yo'q"}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                {selectedOrder.customerPhone || "telefon yo'q"}
              </div>
              {selectedOrder.customerPhone && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={phoneHref}
                    className="inline-flex rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-medium text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-slate-900 touch-target"
                  >
                    Qo'ng'iroq qilish
                  </a>
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-medium text-white transition-opacity hover:opacity-90 touch-target"
                  >
                    WhatsApp
                  </a>
                  <a
                    href={smsHref}
                    className="inline-flex rounded-xl bg-sky-600 px-3 py-2.5 text-xs font-medium text-white transition-opacity hover:opacity-90 touch-target"
                  >
                    SMS
                  </a>
                  <button
                    type="button"
                    onClick={() => copyValue(selectedOrder.customerPhone, 'Telefon raqam')}
                    className="inline-flex rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 touch-target"
                  >
                    Telefonni nusxalash
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
              <div className="text-xs font-medium text-slate-500">Holat va vaqt</div>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    statusClasses[selectedOrder.status] || statusClasses.pending
                  }`}
                >
                  {formatOrderStatus(selectedOrder.status)}
                </span>
                <span className="text-sm text-slate-500">{selectedOrder.type}</span>
              </div>
              <div className="mt-2 text-sm text-slate-500">
                {new Date(selectedOrder.createdAt).toLocaleString()}
              </div>
              <div
                className={`mt-2 text-sm ${
                  isUrgentOrder(selectedOrder)
                    ? 'font-semibold text-rose-600 dark:text-rose-300'
                    : 'text-slate-500'
                }`}
              >
                Jarayonda: {orderAgeMinutes} daqiqa
              </div>
              {slaRemainingMinutes !== null && (
                <div
                  className={`mt-2 text-sm font-medium ${
                    slaRemainingMinutes <= 0
                      ? 'text-rose-600 dark:text-rose-300'
                      : slaRemainingMinutes <= 5
                        ? 'text-amber-600 dark:text-amber-300'
                        : 'text-emerald-600 dark:text-emerald-300'
                  }`}
                >
                  SLA: {slaRemainingMinutes > 0 ? `${slaRemainingMinutes} daqiqa qoldi` : `${Math.abs(slaRemainingMinutes)} daqiqa kechikdi`}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
            <div className="text-xs font-medium text-slate-500">Mijoz manzili</div>
            <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">
              {selectedOrder.deliveryAddress?.label
                ? `${selectedOrder.deliveryAddress.label}: `
                : ''}
              {selectedOrder.deliveryAddress?.address || "Yetkazib berish manzili kiritilmagan"}
            </div>
            {distanceKm !== null && etaMinutes !== null && (
              <div className="mt-2 text-xs text-slate-500">
                Taxminiy masofa: {distanceKm.toFixed(1)} km | ETA: {etaMinutes} daqiqa
              </div>
            )}
            {hasDeliveryCoordinates && (
              <div className="mt-2 space-y-2">
                <div className="text-xs text-slate-500">
                  Lat: {selectedOrder.deliveryAddress.lat}, Lng: {selectedOrder.deliveryAddress.lng}
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
                  <iframe
                    title="Mijoz lokatsiyasi"
                    src={`${mapUrl}&output=embed`}
                    className="h-56 w-full bg-slate-100 dark:bg-slate-900"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-medium text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-slate-900 touch-target"
                >
                  Xaritada ochish
                </a>
                <button
                  type="button"
                  onClick={() => copyValue(selectedOrder.deliveryAddress?.address, 'Manzil')}
                  className="inline-flex rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 touch-target"
                >
                  Manzilni nusxalash
                </button>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
            <div className="text-xs font-medium text-slate-500">Restoran manzili</div>
            <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">
              {selectedOrder.restaurant?.address || "Manzil ko'rsatilmagan"}
            </div>
          </div>

          {selectedOrder.courier?.currentLocation?.lat !== null &&
            selectedOrder.courier?.currentLocation?.lat !== undefined &&
            selectedOrder.courier?.currentLocation?.lng !== null &&
            selectedOrder.courier?.currentLocation?.lng !== undefined && (
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
                <div className="text-xs font-medium text-slate-500">Kuryer joylashuvi</div>
                <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                  Lat: {selectedOrder.courier.currentLocation.lat}, Lng: {selectedOrder.courier.currentLocation.lng}
                </div>
                {selectedOrder.courier.currentLocation.updatedAt && (
                  <div className="mt-1 text-xs text-slate-500">
                    Yangilangan: {new Date(selectedOrder.courier.currentLocation.updatedAt).toLocaleString()}
                  </div>
                )}
                <a
                  href={`https://www.google.com/maps?q=${selectedOrder.courier.currentLocation.lat},${selectedOrder.courier.currentLocation.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex rounded-xl bg-violet-600 px-3 py-2.5 text-xs font-medium text-white transition-opacity hover:opacity-90 touch-target"
                >
                  Kuryer joylashuvini ochish
                </a>
              </div>
            )}

          {userRole !== 'courier' && (
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex-1">
                  <div className="text-xs font-medium text-slate-500">To'lov boshqaruvi</div>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        paymentStatusClasses[selectedOrder.paymentStatus] ||
                        paymentStatusClasses.unpaid
                      }`}
                    >
                      {formatPaymentStatus(selectedOrder.paymentStatus || 'unpaid')}
                    </span>
                    <span className="text-sm text-slate-500">
                      {selectedOrder.paymentMethod || 'cash'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row lg:min-w-[380px]">
                  <select
                    value={selectedPaymentStatus}
                    onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                    className="flex-1 rounded-2xl border border-slate-200 bg-white p-3.5 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900"
                  >
                    {paymentStatuses.map((status) => (
                      <option key={status} value={status}>
                        {formatPaymentStatus(status)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={
                      updatingOrderId === selectedOrder._id ||
                      !selectedPaymentStatus ||
                      selectedPaymentStatus === (selectedOrder.paymentStatus || 'unpaid')
                    }
                    onClick={() =>
                      handlePaymentStatusChange(selectedOrder._id, selectedPaymentStatus)
                    }
                    className="rounded-2xl bg-slate-900 px-5 py-3.5 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-slate-900 touch-target"
                  >
                    {updatingOrderId === selectedOrder._id
                      ? 'Saqlanmoqda...'
                      : "To'lovni yangilash"}
                  </button>
                </div>
              </div>
              <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
                <div className="text-xs font-medium text-slate-500">Refund boshqaruvi</div>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Refund sababi"
                    className="flex-1 rounded-2xl border border-slate-200 bg-white p-3.5 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900"
                  />
                  <button
                    type="button"
                    disabled={updatingOrderId === selectedOrder._id || selectedOrder.paymentStatus !== 'paid'}
                    onClick={() => handleRefundOrder(selectedOrder._id, refundReason)}
                    className="rounded-2xl bg-rose-600 px-5 py-3.5 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60 touch-target"
                  >
                    {updatingOrderId === selectedOrder._id ? 'Qayd qilinmoqda...' : 'Refund qilish'}
                  </button>
                </div>
                {selectedOrder.refundReason && (
                  <div className="mt-3 text-sm text-slate-500">
                    Refund sababi: {selectedOrder.refundReason}
                  </div>
                )}
              </div>
            </div>
          )}

          {canAssignCouriers && (
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex-1">
                  <div className="text-xs font-medium text-slate-500">Kuryer biriktirish</div>
                  <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                    Joriy kuryer: {selectedOrder.courier?.username || "Biriktirilmagan"}
                  </div>
                  {selectedOrder.assignedAt && (
                    <div className="mt-1 text-xs text-slate-500">
                      Biriktirilgan: {new Date(selectedOrder.assignedAt).toLocaleString()}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row lg:min-w-[420px]">
                  <select
                    value={selectedCourierId}
                    onChange={(e) => setSelectedCourierId(e.target.value)}
                    className="flex-1 rounded-2xl border border-slate-200 bg-white p-3.5 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900"
                  >
                    <option value="">Kuryerni tanlang</option>
                    {couriers.map((courier) => (
                      <option key={courier._id} value={courier._id}>
                        {courier.username} - {formatAvailability(courier.isAvailable)}{' '}
                        {courier.vehicleType ? `- ${courier.vehicleType}` : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={assigningCourierId === selectedOrder._id || !selectedCourierId}
                    onClick={() => handleAssignCourier(selectedOrder._id, selectedCourierId)}
                    className="rounded-2xl bg-primary px-5 py-3.5 font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-60 touch-target"
                  >
                    {assigningCourierId === selectedOrder._id
                      ? 'Biriktirilmoqda...'
                      : 'Biriktirish'}
                  </button>
                  {selectedOrder.courier && (
                    <button
                      type="button"
                      disabled={assigningCourierId === selectedOrder._id}
                      onClick={() => handleAssignCourier(selectedOrder._id, '')}
                      className="rounded-2xl border border-slate-200 px-5 py-3.5 text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900 touch-target"
                    >
                      Olib tashlash
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {selectedOrder.note && (
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
              <div className="text-xs font-medium text-slate-500">Izoh</div>
              <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                {selectedOrder.note}
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Buyurtma tarkibi
            </div>
            <div className="space-y-3">
              {selectedOrder.items.map((item, index) => (
                <div
                  key={`${selectedOrder._id}-detail-${index}`}
                  className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3 last:border-b-0 last:pb-0 dark:border-slate-700"
                >
                  <div>
                    <div className="font-medium text-slate-800 dark:text-slate-100">
                      {item.name}
                    </div>
                    <div className="text-sm text-slate-500">Soni: {item.quantity}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-500">
                      {item.price?.toLocaleString()} UZS
                    </div>
                    <div className="font-semibold text-slate-800 dark:text-slate-100">
                      {(item.price * item.quantity).toLocaleString()} UZS
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-white">
            <span className="text-sm font-medium text-slate-300">Jami summa</span>
            <span className="text-xl sm:text-2xl font-bold">
              {selectedOrder.totalPrice?.toLocaleString()} UZS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
