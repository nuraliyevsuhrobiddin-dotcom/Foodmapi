const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Iltimos, ismingizni kiriting'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Iltimos, elektron pochtangizni kiriting'],
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    password: {
      type: String,
      required: [true, 'Iltimos, parolni kiriting'],
      minlength: [6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'],
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ['customer', 'restaurant', 'courier', 'admin'],
      default: 'customer',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      default: null,
    },
    isAvailable: {
      type: Boolean,
      default: false,
    },
    vehicleType: {
      type: String,
      trim: true,
      default: '',
    },
    currentLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      updatedAt: { type: Date, default: null },
    },
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant'
      }
    ]
  },
  {
    timestamps: true,
  }
);

// Baza bilan ishlashdan oldin parolni hashlash
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Parollarni solishtirish uchun metod
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
