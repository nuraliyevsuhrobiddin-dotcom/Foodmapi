const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { createAuditLog } = require('../utils/auditLog');

// @desc    Foydalanuvchi ma'lumotlarini olish (va saqlangan restoranlarini)
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('favorites');

    if (user) {
      res.json({
        _id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        restaurantId: user.restaurantId,
        isAvailable: user.isAvailable,
        vehicleType: user.vehicleType,
        currentLocation: user.currentLocation,
        favorites: user.favorites,
      });
    } else {
      res.status(404);
      throw new Error('Foydalanuvchi topilmadi');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Foydalanuvchi profilini yangilash
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error('Foydalanuvchi topilmadi');
    }

    const { username, email, phone, vehicleType } = req.body;

    if (username !== undefined) user.username = username.trim();
    if (email !== undefined) user.email = email.trim().toLowerCase();
    if (phone !== undefined) user.phone = phone.trim();
    if (vehicleType !== undefined) user.vehicleType = vehicleType.trim();

    await user.save();

    res.json({
      success: true,
      data: {
        _id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        restaurantId: user.restaurantId,
        isAvailable: user.isAvailable,
        vehicleType: user.vehicleType,
        currentLocation: user.currentLocation,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Kuryer availability holatini yangilash
// @route   PUT /api/users/availability
// @access  Private/Courier
const updateCourierAvailability = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error('Foydalanuvchi topilmadi');
    }

    user.isAvailable = Boolean(req.body.isAvailable);
    await user.save();

    const payload = {
      courierId: user._id,
      isAvailable: user.isAvailable,
    };

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${user._id}`).emit('courier_availability_updated', payload);
      io.to('role:admin').emit('courier_availability_updated', payload);
      io.to('role:restaurant').emit('courier_availability_updated', payload);
      io.to('role:courier').emit('courier_availability_updated', payload);
    }

    res.json({
      success: true,
      data: payload,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Foydalanuvchi parolini yangilash
// @route   PUT /api/users/password
// @access  Private
const updateUserPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400);
      throw new Error('Joriy va yangi parol kerak');
    }

    if (newPassword.length < 6) {
      res.status(400);
      throw new Error('Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak');
    }

    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      res.status(404);
      throw new Error('Foydalanuvchi topilmadi');
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      res.status(400);
      throw new Error('Joriy parol noto\'g\'ri');
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Parol muvaffaqiyatli yangilandi',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Restoranni saqlanganlarga (favorites) qo'shish yoki olib tashlash
// @route   POST /api/users/favorites/:restaurantId
// @access  Private
const toggleFavorite = async (req, res, next) => {
  try {
    const restaurantId = req.params.restaurantId;
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error('Foydalanuvchi topilmadi');
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      res.status(404);
      throw new Error('Restoran topilmadi');
    }

    const isFavorited = user.favorites.includes(restaurantId);

    if (isFavorited) {
      // Olib tashlash
      user.favorites = user.favorites.filter((id) => id.toString() !== restaurantId.toString());
    } else {
      // Qo'shish
      user.favorites.push(restaurantId);
    }

    await user.save();
    
    // Qayta ro'yxatni olish
    const updatedUser = await User.findById(req.user._id).populate('favorites');

    res.json({
      success: true,
      data: updatedUser.favorites,
      message: isFavorited ? "Saqlanganlardan olib tashlandi" : "Saqlanganlarga qo'shildi",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Foydalanuvchi notificationlarini olish
// @route   GET /api/users/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .populate('relatedOrder', 'status totalPrice createdAt')
      .sort('-createdAt')
      .limit(50);

    res.json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Notificationni o'qilgan deb belgilash
// @route   PUT /api/users/notifications/:id/read
// @access  Private
const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!notification) {
      res.status(404);
      throw new Error('Notification topilmadi');
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Barcha notificationlarni o'qilgan deb belgilash
// @route   PUT /api/users/notifications/read-all
// @access  Private
const markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Kuryerlar ro'yxatini olish
// @route   GET /api/users/couriers
// @access  Private/Admin/Restaurant
const getCouriers = async (req, res, next) => {
  try {
    const couriers = await User.find({ role: 'courier' })
      .select('username email phone isAvailable vehicleType currentLocation createdAt')
      .sort('username');

    res.json({
      success: true,
      count: couriers.length,
      data: couriers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Kuryerning joriy joylashuvini yangilash
// @route   PUT /api/users/location
// @access  Private/Courier
const updateCourierLocation = async (req, res, next) => {
  try {
    const { lat, lng } = req.body;

    if (lat === null || lat === undefined || lng === null || lng === undefined) {
      res.status(400);
      throw new Error('Lokatsiya koordinatalari kerak');
    }

    const courier = await User.findById(req.user._id);

    if (!courier) {
      res.status(404);
      throw new Error('Kuryer topilmadi');
    }

    courier.currentLocation = {
      lat: Number(lat),
      lng: Number(lng),
      updatedAt: new Date(),
    };

    await courier.save();

    const payload = {
      courierId: courier._id,
      currentLocation: courier.currentLocation,
    };

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${courier._id}`).emit('courier_location_updated', payload);
      io.to('role:admin').emit('courier_location_updated', payload);
      io.to('role:restaurant').emit('courier_location_updated', payload);
      io.to('role:courier').emit('courier_location_updated', payload);
    }

    res.json({
      success: true,
      data: payload,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Barcha foydalanuvchilarni olish
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({})
      .select('username email phone role isActive restaurantId isAvailable vehicleType currentLocation createdAt')
      .sort('-createdAt');

    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Foydalanuvchi rolini va asosiy holatini yangilash
// @route   PUT /api/users/:id/admin
// @access  Private/Admin
const adminUpdateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('Foydalanuvchi topilmadi');
    }

    const { role, isAvailable, vehicleType, restaurantId, isActive } = req.body;
    const previousRestaurantId = user.restaurantId ? user.restaurantId.toString() : null;

    if (role !== undefined) user.role = role;
    if (isAvailable !== undefined) user.isAvailable = Boolean(isAvailable);
    if (vehicleType !== undefined) user.vehicleType = vehicleType.trim();
    if (restaurantId !== undefined) user.restaurantId = restaurantId || null;
    if (isActive !== undefined) user.isActive = Boolean(isActive);

    await user.save();

    if (restaurantId !== undefined) {
      if (previousRestaurantId && previousRestaurantId !== restaurantId) {
        await Restaurant.findByIdAndUpdate(previousRestaurantId, { owner: null });
      }

      if (restaurantId) {
        await Restaurant.findByIdAndUpdate(restaurantId, { owner: user._id });
      }
    }

    if (role !== undefined && role !== 'restaurant' && previousRestaurantId && restaurantId === undefined) {
      await Restaurant.findByIdAndUpdate(previousRestaurantId, { owner: null });
      user.restaurantId = null;
      await user.save();
    }

    await createAuditLog({
      actor: req.user?._id,
      actorRole: req.user?.role,
      action: 'admin_update_user',
      entityType: 'User',
      entityId: user._id,
      message: `${req.user?.username || 'Admin'} foydalanuvchini yangiladi`,
      metadata: {
        role: user.role,
        isActive: user.isActive,
        isAvailable: user.isAvailable,
        restaurantId: user.restaurantId,
      },
    });

    res.json({
      success: true,
      data: {
        _id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        restaurantId: user.restaurantId,
        isAvailable: user.isAvailable,
        vehicleType: user.vehicleType,
        currentLocation: user.currentLocation,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Foydalanuvchini o'chirish
// @route   DELETE /api/users/:id/admin
// @access  Private/Admin
const adminDeleteUser = async (req, res, next) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      res.status(400);
      throw new Error("O'zingizni o'chira olmaysiz");
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('Foydalanuvchi topilmadi');
    }

    await user.deleteOne();

    await createAuditLog({
      actor: req.user?._id,
      actorRole: req.user?.role,
      action: 'admin_delete_user',
      entityType: 'User',
      entityId: req.params.id,
      message: `${req.user?.username || 'Admin'} foydalanuvchini o'chirdi`,
      metadata: {
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });

    res.json({
      success: true,
      message: "Foydalanuvchi o'chirildi",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Audit loglarni olish
// @route   GET /api/users/audit-logs
// @access  Private/Admin
const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find({})
      .populate('actor', 'username email role')
      .sort('-createdAt')
      .limit(100);

    res.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  updateCourierAvailability,
  updateUserPassword,
  toggleFavorite,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getCouriers,
  updateCourierLocation,
  getUsers,
  adminUpdateUser,
  adminDeleteUser,
  getAuditLogs,
};
