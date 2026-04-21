const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const Notification = require('../models/Notification');
const PromoCode = require('../models/PromoCode');
const { validatePromoCodeDoc, calculateDiscount } = require('./promoCodeController');
const { sendTelegramMessage, buildOrderTelegramMessage } = require('../utils/telegramNotifier');

const ALLOWED_STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['cooking', 'cancelled'],
  cooking: ['delivering', 'cancelled'],
  delivering: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

const ORDER_POPULATE = [
  { path: 'restaurant', select: 'name image address owner location workingHours category' },
  { path: 'customer', select: 'username email role' },
  { path: 'courier', select: 'username email phone vehicleType isAvailable currentLocation' },
  { path: 'restaurantOwner', select: 'username email' },
];

const buildOrderQueryByRole = (user) => {
  if (user.role === 'admin') return {};
  if (user.role === 'restaurant') return { restaurantOwner: user._id };
  if (user.role === 'courier') return { courier: user._id };
  return { customer: user._id };
};

const createNotificationForUser = async (req, userId, title, message, type, relatedOrder) => {
  if (!userId) return;
  const notification = await Notification.create({
    user: userId,
    title,
    message,
    type,
    relatedOrder,
  });

  const io = req.app.get('io');
  if (io) {
    io.to(`user:${userId}`).emit('notification_created', notification);
  }

  return notification;
};

const emitOrderEvent = (req, eventName, order) => {
  const io = req.app.get('io');
  if (!io || !order) return;

  io.to(`user:${order.customer?._id || order.customer}`).emit(eventName, order);

  if (order.restaurantOwner?._id || order.restaurantOwner) {
    io.to(`user:${order.restaurantOwner?._id || order.restaurantOwner}`).emit(eventName, order);
  }

  if (order.courier?._id || order.courier) {
    io.to(`user:${order.courier?._id || order.courier}`).emit(eventName, order);
  }

  if (order.restaurant?._id || order.restaurant) {
    io.to(`restaurant:${order.restaurant?._id || order.restaurant}`).emit(eventName, order);
  }

  io.to('role:admin').emit(eventName, order);
};

const findOrderWithAccessCheck = async (req, orderId) => {
  const order = await Order.findById(orderId).populate(ORDER_POPULATE);

  if (!order) {
    req.res.status(404);
    throw new Error(`Buyurtma topilmadi: ${orderId}`);
  }

  const userId = req.user.id;
  const hasAccess =
    req.user.role === 'admin' ||
    order.customer?._id?.toString() === userId ||
    order.restaurantOwner?._id?.toString() === userId ||
    order.courier?._id?.toString() === userId;

  if (!hasAccess) {
    req.res.status(403);
    throw new Error('Ruxsat etilmadi');
  }

  return order;
};

// @desc    Yangi buyurtma yaratish
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.body.restaurant).select('owner telegramChatId name');

    if (!restaurant) {
      res.status(404);
      throw new Error('Restoran topilmadi');
    }

    const subtotal = Number(req.body.subtotal ?? req.body.totalPrice ?? 0);
    const deliveryFee = Number(req.body.deliveryFee ?? 0);
    let discountAmount = Number(req.body.discountAmount ?? 0);
    let promoCodeValue = String(req.body.promoCode || '').trim().toUpperCase();
    let promoCodeDoc = null;

    if (promoCodeValue) {
      promoCodeDoc = await PromoCode.findOne({ code: promoCodeValue });
      const validation = validatePromoCodeDoc(promoCodeDoc, subtotal, req.user.id);

      if (!validation.valid) {
        res.status(400);
        throw new Error(validation.message);
      }

      if (promoCodeDoc.firstOrderOnly) {
        const existingOrderCount = await Order.countDocuments({ customer: req.user.id });
        if (existingOrderCount > 0) {
          res.status(400);
          throw new Error('Bu promokod faqat birinchi buyurtma uchun ishlaydi');
        }
      }

      discountAmount = calculateDiscount(promoCodeDoc, subtotal);
    } else {
      promoCodeValue = '';
      discountAmount = 0;
    }

    const totalPrice = Number(
      req.body.totalPrice ?? Math.max(subtotal + deliveryFee - discountAmount, 0)
    );

    const order = await Order.create({
      ...req.body,
      customer: req.user.id,
      user: req.user.id,
      restaurantOwner: restaurant.owner || null,
      subtotal,
      deliveryFee,
      totalPrice,
      promoCode: promoCodeValue,
      discountAmount,
      statusHistory: [
        {
          status: 'pending',
          changedBy: req.user.id,
          note: 'Buyurtma yaratildi',
        },
      ],
    });

    if (promoCodeDoc) {
      await PromoCode.findByIdAndUpdate(promoCodeDoc._id, {
        $inc: { usageCount: 1 },
        ...(promoCodeDoc.oneTimePerUser ? { $addToSet: { usedBy: req.user.id } } : {}),
      });
    }

    const populatedOrder = await Order.findById(order._id).populate(ORDER_POPULATE);

    if (restaurant.owner) {
      await createNotificationForUser(
        req,
        restaurant.owner,
        'Yangi buyurtma',
        'Sizning restoraningiz uchun yangi buyurtma tushdi',
        'order_status',
        order._id
      );
    }

    if (restaurant.telegramChatId) {
      await sendTelegramMessage(
        restaurant.telegramChatId,
        buildOrderTelegramMessage(populatedOrder)
      );
    }

    res.status(201).json({
      success: true,
      data: populatedOrder,
    });

    emitOrderEvent(req, 'order_created', populatedOrder);
  } catch (error) {
    next(error);
  }
};

const getOrdersForQuery = async (query, res, next) => {
  try {
    const orders = await Order.find(query)
      .populate(ORDER_POPULATE)
      .sort('-createdAt');

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Foydalanuvchi buyurtmalarini olish
// @route   GET /api/orders/my
// @access  Private
const getMyOrders = async (req, res, next) => {
  return getOrdersForQuery({ customer: req.user.id }, res, next);
};

// @desc    Restoran egasining buyurtmalarini olish
// @route   GET /api/orders/restaurant
// @access  Private/Restaurant
const getRestaurantOrders = async (req, res, next) => {
  return getOrdersForQuery({ restaurantOwner: req.user.id }, res, next);
};

// @desc    Kuryerga biriktirilgan buyurtmalarni olish
// @route   GET /api/orders/courier
// @access  Private/Courier
const getCourierOrders = async (req, res, next) => {
  return getOrdersForQuery({ courier: req.user.id }, res, next);
};

// @desc    Barcha buyurtmalarni olish
// @route   GET /api/orders/admin
// @access  Private/Admin
const getOrders = async (req, res, next) => {
  return getOrdersForQuery({}, res, next);
};

// @desc    Bitta buyurtmani olish
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res, next) => {
  try {
    const order = await findOrderWithAccessCheck(req, req.params.id);

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Buyurtma holatini yangilash
// @route   PUT /api/orders/:id/status
// @access  Private
const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error(`Buyurtma topilmadi: ${req.params.id}`);
    }

    const nextStatus = req.body.status;
    const allowedNextStatuses = ALLOWED_STATUS_TRANSITIONS[order.status] || [];

    if (!allowedNextStatuses.includes(nextStatus)) {
      res.status(400);
      throw new Error(`Holatni ${order.status} dan ${nextStatus} ga o'tkazib bo'lmaydi`);
    }

    const canManageOrder =
      req.user.role === 'admin' ||
      (req.user.role === 'restaurant' && order.restaurantOwner?.toString() === req.user.id) ||
      (req.user.role === 'courier' &&
        order.courier?.toString() === req.user.id &&
        ['delivering', 'delivered'].includes(nextStatus));

    if (!canManageOrder) {
      res.status(403);
      throw new Error('Bu buyurtma holatini yangilashga ruxsat yo\'q');
    }

    order.status = nextStatus;
    if (nextStatus === 'delivering' && !order.assignedAt) {
      order.assignedAt = new Date();
    }
    if (nextStatus === 'delivered') {
      order.deliveredAt = new Date();
      if (order.paymentMethod === 'cash' && order.paymentStatus === 'unpaid') {
        order.paymentStatus = 'paid';
      }
    }
    order.statusHistory.push({
      status: nextStatus,
      changedBy: req.user.id,
      note: req.body.note || '',
    });

    await order.save();

    await createNotificationForUser(
      req,
      order.customer,
      'Buyurtma holati yangilandi',
      `Buyurtmangiz holati: ${nextStatus}`,
      'order_status',
      order._id
    );

    const updatedOrder = await Order.findById(order._id).populate(ORDER_POPULATE);

    res.json({
      success: true,
      data: updatedOrder,
    });

    emitOrderEvent(req, 'order_updated', updatedOrder);
  } catch (error) {
    next(error);
  }
};

// @desc    Buyurtmaga kuryer biriktirish
// @route   PUT /api/orders/:id/assign-courier
// @access  Private/Admin/Restaurant
const assignCourier = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error(`Buyurtma topilmadi: ${req.params.id}`);
    }

    const canAssign =
      req.user.role === 'admin' ||
      (req.user.role === 'restaurant' && order.restaurantOwner?.toString() === req.user.id);

    if (!canAssign) {
      res.status(403);
      throw new Error('Bu buyurtmaga kuryer biriktirishga ruxsat yo\'q');
    }

    order.courier = req.body.courierId || null;
    order.assignedAt = req.body.courierId ? new Date() : null;
    await order.save();

    if (req.body.courierId) {
      await createNotificationForUser(
        req,
        req.body.courierId,
        'Yangi yetkazib berish',
        'Sizga yangi buyurtma biriktirildi',
        'order_status',
        order._id
      );
    }

    const updatedOrder = await Order.findById(order._id).populate(ORDER_POPULATE);

    res.json({
      success: true,
      data: updatedOrder,
    });

    emitOrderEvent(req, 'order_updated', updatedOrder);
  } catch (error) {
    next(error);
  }
};

// @desc    Buyurtma to'lov holatini yangilash
// @route   PUT /api/orders/:id/payment-status
// @access  Private/Admin/Restaurant
const updatePaymentStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error(`Buyurtma topilmadi: ${req.params.id}`);
    }

    const nextPaymentStatus = req.body.paymentStatus;
    const allowedPaymentStatuses = ['unpaid', 'paid', 'failed', 'refunded'];

    if (!allowedPaymentStatuses.includes(nextPaymentStatus)) {
      res.status(400);
      throw new Error('Noto‘g‘ri payment status');
    }

    const canManagePayment =
      req.user.role === 'admin' ||
      (req.user.role === 'restaurant' && order.restaurantOwner?.toString() === req.user.id);

    if (!canManagePayment) {
      res.status(403);
      throw new Error("Bu buyurtma to'lov holatini yangilashga ruxsat yo'q");
    }

    order.paymentStatus = nextPaymentStatus;
    await order.save();

    await createNotificationForUser(
      req,
      order.customer,
      "To'lov holati yangilandi",
      `Buyurtmangiz to'lov holati: ${nextPaymentStatus}`,
      'order_status',
      order._id
    );

    const updatedOrder = await Order.findById(order._id).populate(ORDER_POPULATE);

    res.json({
      success: true,
      data: updatedOrder,
    });

    emitOrderEvent(req, 'order_updated', updatedOrder);
  } catch (error) {
    next(error);
  }
};

// @desc    Buyurtmaga refund qilish
// @route   PUT /api/orders/:id/refund
// @access  Private/Admin/Restaurant
const refundOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error(`Buyurtma topilmadi: ${req.params.id}`);
    }

    const canRefund =
      req.user.role === 'admin' ||
      (req.user.role === 'restaurant' && order.restaurantOwner?.toString() === req.user.id);

    if (!canRefund) {
      res.status(403);
      throw new Error("Bu buyurtmaga refund qilishga ruxsat yo'q");
    }

    if (order.paymentStatus !== 'paid') {
      res.status(400);
      throw new Error("Faqat to'langan buyurtmaga refund qilish mumkin");
    }

    order.paymentStatus = 'refunded';
    order.refundReason = (req.body.reason || '').trim();
    await order.save();

    await createNotificationForUser(
      req,
      order.customer,
      "Refund amalga oshirildi",
      `Buyurtmangiz uchun refund qayd qilindi${order.refundReason ? `: ${order.refundReason}` : ''}`,
      'order_status',
      order._id
    );

    const updatedOrder = await Order.findById(order._id).populate(ORDER_POPULATE);

    res.json({
      success: true,
      data: updatedOrder,
    });

    emitOrderEvent(req, 'order_updated', updatedOrder);
  } catch (error) {
    next(error);
  }
};

// @desc    Buyurtmalarni rol bo'yicha olish
// @route   GET /api/orders
// @access  Private
const getScopedOrders = async (req, res, next) => {
  return getOrdersForQuery(buildOrderQueryByRole(req.user), res, next);
};

module.exports = {
  createOrder,
  getOrders,
  getScopedOrders,
  getMyOrders,
  getRestaurantOrders,
  getCourierOrders,
  getOrderById,
  updateOrderStatus,
  assignCourier,
  updatePaymentStatus,
  refundOrder,
};
