const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  updateCourierAvailability,
  updateUserPassword,
  toggleFavorite,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getCouriers,
  updateCourierLocation,
  getUsers,
  adminUpdateUser,
  adminDeleteUser,
  getAuditLogs,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);
router.route('/').get(protect, authorize('admin'), getUsers);
router.route('/audit-logs').get(protect, authorize('admin'), getAuditLogs);
router.route('/:id/admin').put(protect, authorize('admin'), adminUpdateUser).delete(protect, authorize('admin'), adminDeleteUser);
router.route('/password').put(protect, updateUserPassword);
router.route('/availability').put(protect, authorize('courier'), updateCourierAvailability);
router.route('/location').put(protect, authorize('courier'), updateCourierLocation);
router.route('/couriers').get(protect, authorize('admin', 'restaurant'), getCouriers);
router.route('/favorites/:restaurantId').post(protect, toggleFavorite);
router.route('/notifications').get(protect, getNotifications);
router.route('/notifications/read-all').put(protect, markAllNotificationsRead);
router.route('/notifications/:id/read').put(protect, markNotificationRead);

module.exports = router;
