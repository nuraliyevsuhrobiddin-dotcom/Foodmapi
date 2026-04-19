const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      required: [true, 'Iltimos, reytingni qo\'ying (1-5)'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, 'Iltimos, fikringizni yozing'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Restoran uchun o'rtacha reytingni hisoblash
reviewSchema.statics.getAverageRating = async function (restaurantId) {
  const obj = await this.aggregate([
    {
      $match: { restaurant: restaurantId },
    },
    {
      $group: {
        _id: '$restaurant',
        averageRating: { $avg: '$rating' },
      },
    },
  ]);

  try {
    if (obj[0]) {
      await mongoose.model('Restaurant').findByIdAndUpdate(restaurantId, {
        rating: Math.round(obj[0].averageRating * 10) / 10,
      });
    } else {
      await mongoose.model('Restaurant').findByIdAndUpdate(restaurantId, {
        rating: 1,
      });
    }
  } catch (err) {
    console.error(err);
  }
};

// Saqlashdan keyin o'rtacha reytingni chaqirish
reviewSchema.post('save', function () {
  this.constructor.getAverageRating(this.restaurant);
});

// O'chirishdan keyin o'rtacha reytingni qayta hisoblash
reviewSchema.post('deleteOne', { document: true, query: false }, function () {
  this.constructor.getAverageRating(this.restaurant);
});

module.exports = mongoose.model('Review', reviewSchema);
