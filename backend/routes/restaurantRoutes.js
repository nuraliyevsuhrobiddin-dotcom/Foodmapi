const express = require('express');
const router = express.Router();
const {
  getRestaurants,
  getNearRestaurants,
  getRestaurant,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant
} = require('../controllers/restaurantController');
const { protect, admin } = require('../middleware/authMiddleware');

// Sharhlar marshruti (Nested route)
const reviewRouter = require('./reviewRoutes');
router.use('/:restaurantId/reviews', reviewRouter);

// /api/restaurants/near
router.route('/near').get(getNearRestaurants);

// /api/restaurants
router.route('/')
  .get(getRestaurants)
  .post(protect, admin, createRestaurant);

// /api/restaurants/:id
router.route('/:id')
  .get(getRestaurant)
  .put(protect, admin, updateRestaurant)
  .delete(protect, admin, deleteRestaurant);

module.exports = router;
