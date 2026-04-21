const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Token'ni olish: "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // Token'ni tekshirish
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // User'ni bazadan topish (paroldan tashqari)
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Avtorizatsiyadan o\'tilmadi, token xato' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Avtorizatsiyadan o\'tilmadi, token yo\'q' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Avtorizatsiyadan o\'tilmadi' });
  }

  if (roles.includes(req.user.role)) {
    return next();
  }

  return res.status(403).json({ message: 'Ruxsat etilmagan amal' });
};

// Legacy alias to avoid touching every existing admin-only route at once.
const admin = authorize('admin');

module.exports = { protect, admin, authorize };
