const express = require('express');
const {
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
} = require('../controllers/orderController');

const router = express.Router();

const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getScopedOrders)
  .post(protect, createOrder);

router.route('/admin')
  .get(protect, authorize('admin'), getOrders);

router.route('/my')
  .get(protect, getMyOrders);

router.route('/myorders')
  .get(protect, getMyOrders);

router.route('/restaurant')
  .get(protect, authorize('restaurant', 'admin'), getRestaurantOrders);

router.route('/courier')
  .get(protect, authorize('courier', 'admin'), getCourierOrders);

router.route('/:id')
  .get(protect, getOrderById);

router.route('/:id/status')
  .put(protect, authorize('admin', 'restaurant', 'courier'), updateOrderStatus);

router.route('/:id/assign-courier')
  .put(protect, authorize('admin', 'restaurant'), assignCourier);

router.route('/:id/payment-status')
  .put(protect, authorize('admin', 'restaurant'), updatePaymentStatus);

router.route('/:id/refund')
  .put(protect, authorize('admin', 'restaurant'), refundOrder);

module.exports = router;
