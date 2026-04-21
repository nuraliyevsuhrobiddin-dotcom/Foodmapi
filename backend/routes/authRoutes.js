const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const { registerUser, loginUser, forgotPassword, resetPassword } = require('../controllers/authController');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }
  next();
};

router.post(
  '/register',
  [
    body('username', 'Ism kamida 3 ta belgidan iborat bo\'lishi kerak').isLength({ min: 3 }),
    body('email', 'Iltimos, to\'g\'ri email kiriting').isEmail(),
    body('password', 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak').isLength({ min: 6 }),
  ],
  validate,
  registerUser
);

router.post(
  '/login',
  [
    body('email', 'Iltimos, to\'g\'ri email kiriting').isEmail(),
    body('password', 'Parol kiritilishi shart').exists(),
  ],
  validate,
  loginUser
);

router.post(
  '/forgot-password',
  [body('email', "Iltimos, to'g'ri email kiriting").isEmail()],
  validate,
  forgotPassword
);

router.post(
  '/reset-password',
  [
    body('email', "Iltimos, to'g'ri email kiriting").isEmail(),
    body('code', 'Tiklash kodi kiritilishi shart').isLength({ min: 4 }),
    body('password', "Parol kamida 6 ta belgidan iborat bo'lishi kerak").isLength({ min: 6 }),
  ],
  validate,
  resetPassword
);

module.exports = router;
