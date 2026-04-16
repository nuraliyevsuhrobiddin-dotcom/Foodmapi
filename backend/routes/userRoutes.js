const express = require('express');
const router = express.Router();
const { getUserProfile, toggleFavorite } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.route('/profile').get(protect, getUserProfile);
router.route('/favorites/:restaurantId').post(protect, toggleFavorite);

module.exports = router;
