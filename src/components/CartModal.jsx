import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import FormField from './FormField';

export default function CartModal({
  isOpen,
  onClose,
  cartItems,
  removeFromCart,
  updateQuantity,
  cartTotal,
  promoCode,
  setPromoCode,
  isApplyingPromo,
  handleApplyPromo,
  appliedPromo,
  customerPhone,
  setCustomerPhone,
  deliveryLabel,
  setDeliveryLabel,
  deliveryAddress,
  setDeliveryAddress,
  deliveryLat,
  setDeliveryLat,
  deliveryLng,
  setDeliveryLng,
  isLocating,
  handleDetectLocation,
  handleCheckout,
  isSubmitting,
}) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-6">
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/68 backdrop-blur-md"
          />

          <motion.div
            initial={{ y: '100%', opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.9 }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            className="relative flex h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-[30px] border border-white/10 bg-[#111827] shadow-[0_-24px_80px_rgba(15,23,42,0.6)] sm:h-auto sm:max-h-[90vh] sm:rounded-[32px]"
          >
            <div className="flex justify-center pt-3">
              <span className="h-1.5 w-14 rounded-full bg-white/20" />
            </div>

            <div className="flex items-center justify-between px-4 pb-4 pt-3 sm:px-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/35">
                  Savatcha
                </p>
                <h2 className="mt-1 flex items-center gap-2 text-xl font-semibold text-white">
                  <ShoppingBag size={20} className="text-[#ffcc33]" />
                  Buyurtma tafsilotlari
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.07] text-white/72 transition hover:bg-white/[0.12]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-5 sm:px-5">
              {cartItems.length === 0 ? (
                <div className="flex h-full min-h-60 flex-col items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] px-6 text-center text-white/62">
                  <ShoppingBag size={52} className="mb-4 text-white/20" />
                  <p className="text-base font-medium text-white/84">Savatcha hozircha bo'sh</p>
                  <p className="mt-2 text-sm">Taom tanlang, keyin buyurtmani shu yerda rasmiylashtirasiz.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div
                        key={item._id}
                        className="flex gap-3 rounded-[26px] border border-white/8 bg-white/[0.045] p-3.5"
                      >
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[22px] bg-slate-800">
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col justify-between">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="line-clamp-2 text-sm font-semibold text-white">{item.name}</h4>
                              <p className="mt-1 text-xs text-white/42">
                                {(item.price || 0).toLocaleString()} UZS
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item._id)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.05] text-white/54 transition hover:bg-red-500/18 hover:text-red-300"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-1 rounded-full bg-black/30 px-2 py-1">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item._id, -1)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/72 transition hover:bg-white/[0.08]"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="min-w-8 text-center text-sm font-semibold text-white">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item._id, 1)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/72 transition hover:bg-white/[0.08]"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            <span className="text-sm font-semibold text-[#ffcc33]">
                              {(item.price * item.quantity).toLocaleString()} UZS
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4 rounded-[28px] border border-white/8 bg-white/[0.04] p-4">
                    <FormField label="Promokod">
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <input
                          type="text"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          placeholder="PROMO10"
                          className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-white outline-none transition focus:border-[#ffcc33]/60 focus:bg-white/[0.09] focus:shadow-[0_0_0_4px_rgba(255,204,51,0.12)]"
                        />
                        <button
                          type="button"
                          onClick={handleApplyPromo}
                          disabled={isApplyingPromo}
                          className="h-12 rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm font-semibold text-white/88 transition hover:bg-white/[0.12] disabled:opacity-60"
                        >
                          {isApplyingPromo ? "Tekshirilmoqda..." : "Qo'llash"}
                        </button>
                      </div>
                      {appliedPromo ? (
                        <p className="text-sm text-emerald-300">
                          Aktiv: {appliedPromo.code} (-{Math.round(appliedPromo.discountAmount).toLocaleString()} UZS)
                        </p>
                      ) : null}
                    </FormField>

                    <FormField label="Telefon raqam">
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+998 90 123 45 67"
                        inputMode="tel"
                        className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-white outline-none transition focus:border-[#ffcc33]/60 focus:bg-white/[0.09] focus:shadow-[0_0_0_4px_rgba(255,204,51,0.12)]"
                      />
                    </FormField>

                    <FormField label="Manzil nomi" hint="Uy, ofis yoki boshqa belgi">
                      <input
                        type="text"
                        value={deliveryLabel}
                        onChange={(e) => setDeliveryLabel(e.target.value)}
                        placeholder="Masalan: Uy"
                        className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-white outline-none transition focus:border-[#ffcc33]/60 focus:bg-white/[0.09] focus:shadow-[0_0_0_4px_rgba(255,204,51,0.12)]"
                      />
                    </FormField>

                    <FormField label="Yetkazib berish manzili">
                      <textarea
                        rows={3}
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Ko'cha, uy raqami, mo'ljal"
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none transition focus:border-[#ffcc33]/60 focus:bg-white/[0.09] focus:shadow-[0_0_0_4px_rgba(255,204,51,0.12)]"
                      />
                    </FormField>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <FormField label="Latitude">
                        <input
                          type="number"
                          value={deliveryLat}
                          onChange={(e) => setDeliveryLat(e.target.value)}
                          inputMode="decimal"
                          placeholder="41.3111"
                          className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-white outline-none transition focus:border-[#ffcc33]/60 focus:bg-white/[0.09] focus:shadow-[0_0_0_4px_rgba(255,204,51,0.12)]"
                        />
                      </FormField>
                      <FormField label="Longitude">
                        <input
                          type="number"
                          value={deliveryLng}
                          onChange={(e) => setDeliveryLng(e.target.value)}
                          inputMode="decimal"
                          placeholder="69.2797"
                          className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-white outline-none transition focus:border-[#ffcc33]/60 focus:bg-white/[0.09] focus:shadow-[0_0_0_4px_rgba(255,204,51,0.12)]"
                        />
                      </FormField>
                    </div>

                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={isLocating}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm font-semibold text-white transition hover:bg-white/[0.12] disabled:opacity-60"
                    >
                      {isLocating ? "Aniqlanmoqda..." : "Mening joylashuvimni aniqlash"}
                    </button>
                  </div>
                </>
              )}
            </div>

            {cartItems.length > 0 ? (
              <div className="space-y-3 border-t border-white/8 bg-black/20 px-4 pb-5 pt-4 sm:px-5">
                <div className="flex items-center justify-between text-sm text-white/62">
                  <span>Jami summa</span>
                  <span className="font-semibold text-white">{cartTotal.toLocaleString()} UZS</span>
                </div>
                {appliedPromo ? (
                  <div className="flex items-center justify-between text-sm text-emerald-300">
                    <span>Chegirma</span>
                    <span>-{Math.round(appliedPromo.discountAmount).toLocaleString()} UZS</span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between text-base font-semibold text-white">
                  <span>To'lanadi</span>
                  <span>
                    {Math.max(cartTotal - Math.round(appliedPromo?.discountAmount || 0), 0).toLocaleString()} UZS
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                  className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#ffcc33] px-4 text-base font-semibold text-slate-950 shadow-[0_18px_40px_rgba(255,204,51,0.2)] transition hover:brightness-105 disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : null}
                  Buyurtma qilish
                </button>
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
