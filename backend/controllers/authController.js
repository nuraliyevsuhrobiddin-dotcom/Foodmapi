const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      res.status(400);
      throw new Error('Iltimos, barcha maydonlarni to\'ldiring');
    }

    // Email tekshirish
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error('Foydalanuvchi allaqachon mavjud');
    }

    // Yangi foydalanuvchini yaratish
    const user = await User.create({
      username,
      email,
      password,
      role: 'user', // Qat'iy user
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
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

    // Email orqali foydalanuvchini topish, lekin bu safar `+password` orqali parolni ham qaytarish
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
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

module.exports = {
  registerUser,
  loginUser,
};
