const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ['percent', 'fixed'],
      default: 'percent',
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    usageLimit: {
      type: Number,
      default: null,
      min: 1,
    },
    oneTimePerUser: {
      type: Boolean,
      default: false,
    },
    firstOrderOnly: {
      type: Boolean,
      default: false,
    },
    usedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PromoCode', promoCodeSchema);
