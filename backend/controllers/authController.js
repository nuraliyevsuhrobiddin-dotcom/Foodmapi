const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { isEmailConfigured, sendPasswordResetEmail } = require('../utils/email');

// Token yozish
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Foydalanuvchi ro'yxatdan o'tishi
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { username, email, password, phone } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!username || !normalizedEmail || !password) {
      res.status(400);
      throw new Error('Iltimos, barcha maydonlarni to\'ldiring');
    }

    // Email tekshirish
    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      res.status(400);
      throw new Error('Foydalanuvchi allaqachon mavjud');
    }

    // Yangi foydalanuvchini yaratish
    const user = await User.create({
      username,
      email: normalizedEmail,
      phone: phone || '',
      password,
      role: 'customer',
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        restaurantId: user.restaurantId,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error('Yaroqsiz ma\'lumotlar');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Foydalanuvchi tizimga kirishi
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    // Email orqali foydalanuvchini topish, lekin bu safar `+password` orqali parolni ham qaytarish
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        restaurantId: user.restaurantId,
        token: generateToken(user._id),
      });
    } else {
      res.status(401);
      throw new Error('Email yoki parol noto\'g\'ri');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Parol tiklash kodi so'rash
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400);
      throw new Error('Email kiritilishi shart');
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      return res.json({
        success: true,
        message: "Agar bu email ro'yxatdan o'tgan bo'lsa, tiklash kodi yuborildi",
      });
    }

    const resetCode = user.createPasswordResetCode();
    await user.save({ validateBeforeSave: false });

    if (isEmailConfigured()) {
      await sendPasswordResetEmail({
        to: user.email,
        username: user.username,
        code: resetCode,
      });

      return res.json({
        success: true,
        message: "Tiklash kodi emailingizga yuborildi. 10 daqiqa ichida kiriting.",
      });
    }

    const response = {
      success: true,
      message: "Email xizmati sozlanmagan. Sinov kodi vaqtincha javobda qaytarildi.",
    };

    if (process.env.NODE_ENV !== 'production') {
      response.resetCode = resetCode;
    }

    return res.json(response);
  } catch (error) {
    next(error);
  }
};

// @desc    Tiklash kodi orqali parolni yangilash
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { email, code, password } = req.body;

    if (!email || !code || !password) {
      res.status(400);
      throw new Error("Email, kod va yangi parol kiritilishi shart");
    }

    if (String(password).length < 6) {
      res.status(400);
      throw new Error("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
    }

    const hashedCode = crypto.createHash('sha256').update(String(code).trim()).digest('hex');
    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      passwordResetToken: hashedCode,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      res.status(400);
      throw new Error("Tiklash kodi noto'g'ri yoki eskirgan");
    }

    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    res.json({
      success: true,
      message: "Parol muvaffaqiyatli yangilandi",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
};
