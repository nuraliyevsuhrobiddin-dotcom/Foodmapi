const Review = require('../models/Review');
const Restaurant = require('../models/Restaurant');

// @desc    Restoran sharhlarini olish
// @route   GET /api/restaurants/:restaurantId/reviews
// @access  Public
const getReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ restaurant: req.params.restaurantId })
      .populate('user', 'username')
      .sort('-createdAt');

    res.json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Sharh qo'shish
// @route   POST /api/restaurants/:restaurantId/reviews
// @access  Private
const addReview = async (req, res, next) => {
  try {
    req.body.restaurant = req.params.restaurantId;
    req.body.user = req.user.id;

    const restaurant = await Restaurant.findById(req.params.restaurantId);

    if (!restaurant) {
      res.status(404);
      throw new Error(`Restoran topilmadi: ${req.params.restaurantId}`);
    }

    // Har bir foydalanuvchi bitta restoranga faqat bir marta sharh bera oladi
    const alreadyReviewed = await Review.findOne({
      user: req.user.id,
      restaurant: req.params.restaurantId,
    });

    if (alreadyReviewed) {
      res.status(400);
      throw new Error('Siz allaqachon sharh qoldirgansiz');
    }

    const review = await Review.create(req.body);

    res.status(201).json({
      success: true,
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Sharhni o'chirish
// @route   DELETE /api/reviews/:id
// @access  Private/Admin
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      res.status(404);
      throw new Error(`Sharh topilmadi: ${req.params.id}`);
    }

    // Faqat sharh egasi yoki admin o'chira oladi
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(401);
      throw new Error('Ruxsat etilmadi');
    }

    await review.deleteOne();

    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReviews,
  addReview,
  deleteReview,
};
