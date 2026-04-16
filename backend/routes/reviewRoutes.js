const express = require('express');
const {
  getReviews,
  addReview,
  deleteReview,
} = require('../controllers/reviewController');

const router = express.Router({ mergeParams: true });

const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(getReviews)
  .post(protect, addReview);

router.route('/:id')
  .delete(protect, deleteReview);

module.exports = router;
