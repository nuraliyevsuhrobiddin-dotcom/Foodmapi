const sendTelegramMessage = async (chatId, message) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken || !chatId || !message) {
    return { success: false, skipped: true };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Telegram xabari yuborilmadi:', errorText);
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error('Telegram xabari yuborishda xatolik:', error);
    return { success: false };
  }
};

const buildOrderTelegramMessage = (order) => {
  const itemsText = (order.items || [])
    .map((item) => `- ${item.name} x ${item.quantity} — ${(item.price * item.quantity).toLocaleString()} UZS`)
    .join('\n');

  const hasCoordinates =
    order.deliveryAddress?.lat !== null &&
    order.deliveryAddress?.lat !== undefined &&
    order.deliveryAddress?.lng !== null &&
    order.deliveryAddress?.lng !== undefined;

  const mapUrl = hasCoordinates
    ? `https://www.google.com/maps?q=${order.deliveryAddress.lat},${order.deliveryAddress.lng}`
    : '';

  const paymentMethodLabels = {
    cash: 'Naqd',
    card: 'Karta',
    online: 'Onlayn',
  };

  const paymentStatusLabels = {
    unpaid: "To'lanmagan",
    paid: "To'langan",
    failed: 'Muvaffaqiyatsiz',
    refunded: 'Refund qilingan',
  };

  return [
    'Yangi buyurtma tushdi',
    '',
    `Restoran: ${order.restaurant?.name || "Noma'lum"}`,
    `Mijoz: ${order.customer?.username || "Noma'lum"}`,
    `Telefon: ${order.customerPhone || "yo'q"}`,
    `Manzil yorlig'i: ${order.deliveryAddress?.label || "ko'rsatilmagan"}`,
    `Manzil: ${order.deliveryAddress?.address || "ko'rsatilmagan"}`,
    ...(hasCoordinates
      ? [
          `Lat/Lng: ${order.deliveryAddress.lat}, ${order.deliveryAddress.lng}`,
          `Xarita: ${mapUrl}`,
        ]
      : []),
    `To'lov: ${paymentMethodLabels[order.paymentMethod] || order.paymentMethod || 'Naqd'} / ${paymentStatusLabels[order.paymentStatus] || order.paymentStatus || "To'lanmagan"}`,
    `Chegirma: ${((order.discountAmount || 0)).toLocaleString()} UZS${order.promoCode ? ` (${order.promoCode})` : ''}`,
    `Yetkazib berish narxi: ${((order.deliveryFee || 0)).toLocaleString()} UZS`,
    `Jami: ${(order.totalPrice || 0).toLocaleString()} UZS`,
    `Izoh: ${order.note || "yo'q"}`,
    '',
    'Tarkib:',
    itemsText || "- Bo'sh",
  ].join('\n');
};

module.exports = {
  sendTelegramMessage,
  buildOrderTelegramMessage,
};
