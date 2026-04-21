const mongoose = require('mongoose');

const orderStatusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cooking', 'delivering', 'delivered', 'cancelled'],
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    restaurantOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    courier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    items: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true, default: 1 },
        price: { type: Number, required: true },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cooking', 'delivering', 'delivered', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'failed', 'refunded'],
      default: 'unpaid',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'online'],
      default: 'cash',
    },
    promoCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    customerPhone: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: ['delivery', 'reservation'],
      default: 'delivery',
    },
    deliveryAddress: {
      label: { type: String, trim: true, default: '' },
      address: { type: String, trim: true, default: '' },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    reservationTime: {
      type: Date,
    },
    note: {
      type: String,
    },
    refundReason: {
      type: String,
      trim: true,
      default: '',
    },
    assignedAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    statusHistory: {
      type: [orderStatusHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.pre('validate', function syncLegacyUser() {
  if (!this.customer && this.user) {
    this.customer = this.user;
  }
  if (!this.user && this.customer) {
    this.user = this.customer;
  }
});

module.exports = mongoose.model('Order', orderSchema);
