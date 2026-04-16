const User = require('../models/User');
const Restaurant = require('../models/Restaurant');

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
        role: user.role,
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

module.exports = {
  getUserProfile,
  toggleFavorite,
};
