const Order = require('../models/Order');

// @desc    Yangi buyurtma yaratish
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res, next) => {
  try {
    req.body.user = req.user.id;

    const order = await Order.create(req.body);

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Foydalanuvchi buyurtmalarini olish
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('restaurant', 'name image')
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

// @desc    Bitta buyurtmani olish
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('restaurant', 'name address');

    if (!order) {
      res.status(404);
      throw new Error(`Buyurtma topilmadi: ${req.params.id}`);
    }

    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(401);
      throw new Error('Ruxsat etilmadi');
    }

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
// @access  Private/Admin
const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error(`Buyurtma topilmadi: ${req.params.id}`);
    }

    order.status = req.body.status;
    await order.save();

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
};
