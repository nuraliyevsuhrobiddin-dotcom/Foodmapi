const mongoose = require('mongoose');
const { parseMenuPrice } = require('../utils/menuPricing');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, trim: true, default: '' },
  price: {
    type: String,
    required: true,
    validate: {
      validator: (value) => parseMenuPrice(value) !== null,
      message: 'Menu narxi raqam bo\'lishi kerak'
    }
  },
  image: { type: String },
  description: { type: String }
});

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Restoran nomini kiriting'],
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'], // 'location.type' qat'iy 'Point' bo'lishi kerak
        required: true
      },
      coordinates: {
        type: [Number], // [longitude, latitude] orqali saqlanadi
        required: true
      }
    },
    address: {
      type: String,
      required: [true, 'Manzilni kiriting']
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    telegramChatId: {
      type: String,
      trim: true,
      default: ''
    },
    image: {
      type: String,
      default: 'no-image.jpg'
    },
    rating: {
      type: Number,
      min: [1, 'Reyting eng kamida 1 bo\'lishi kerak'],
      max: [5, 'Reyting ko\'pi bilan 5 bo\'lishi kerak'],
      default: 1
    },
    category: {
      type: [String],
      default: []
    },
    workingHours: {
      type: String,
      default: '09:00 - 23:00'
    },
    gallery: {
      type: [String],
      default: []
    },
    menu: [menuItemSchema]
  },
  {
    timestamps: true,
  }
);

// 2dsphere index yaratish (Geolokatsiya qidiruvlari uchun juda muhim!)
restaurantSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Restaurant', restaurantSchema);
