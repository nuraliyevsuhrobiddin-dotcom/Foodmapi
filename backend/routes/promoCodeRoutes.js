const express = require('express');
const {
  createPromoCode,
  getPromoCodes,
  updatePromoCode,
  validatePromoCode,
} = require('../controllers/promoCodeController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .get(protect, authorize('admin'), getPromoCodes)
  .post(protect, authorize('admin'), createPromoCode);

router.route('/:id')
  .put(protect, authorize('admin'), updatePromoCode);

router.route('/validate')
  .post(validatePromoCode);

module.exports = router;
