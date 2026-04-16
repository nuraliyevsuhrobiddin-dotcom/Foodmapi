const Restaurant = require('../models/Restaurant');

// @desc    Barcha restoranlarni olish
// @route   GET /api/restaurants
// @access  Public
const getRestaurants = async (req, res, next) => {
  try {
    // Pagination params
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Filter criteria
    let query = {};
    console.log("Req Query:", req.query);
    if (req.query.category) {
      const categoriesArray = req.query.category.split(',');
      query.category = { $in: categoriesArray };
    }
    
    // Matndan qidirish (regex) - Nomi, Manzili yoki Menyu taomlari bo'yicha
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      query.$or = [
        { name: searchRegex },
        { address: searchRegex },
        { 'menu.name': searchRegex }
      ];
    }

    const total = await Restaurant.countDocuments(query);
    
    let sortOpt = '-createdAt';
    if (req.query.sort === 'popular') {
      sortOpt = '-rating';
    }

    const restaurants = await Restaurant.find(query).sort(sortOpt).skip(startIndex).limit(limit);

    res.json({
      success: true,
      count: restaurants.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: restaurants
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bitta restoranni olish
// @route   GET /api/restaurants/:id
// @access  Public
const getRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      res.status(404);
      throw new Error(`Restoran topilmadi: ${req.params.id}`);
    }

    res.json({ success: true, data: restaurant });
  } catch (error) {
    next(error);
  }
};

// @desc    Yaqin restoranlarni topish (Geo JSON orqali)
// @route   GET /api/restaurants/near?lat=38.8615&lng=65.7854&radius=10
// @access  Public
const getNearRestaurants = async (req, res, next) => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng) {
      res.status(400);
      throw new Error('Iltimos lat va lng koordinatalarini taqdim eting');
    }

    // Radius standart qilib 10km ga sozlangan (metrda o'lchanadi)
    const distanceInMeters = radius ? parseInt(radius) * 1000 : 10000;

    const restaurants = await Restaurant.find({
      location: {
        $near: {
          $maxDistance: distanceInMeters,
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          }
        }
      }
    });

    res.json({
      success: true,
      count: restaurants.length,
      data: restaurants
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Yangi restoran qo'shish
// @route   POST /api/restaurants
// @access  Private/Admin
const createRestaurant = async (req, res, next) => {
  try {
    // Check if coordinates provided and fix format to GeoJSON 'Point' if frontend sends separately
    if (req.body.lng && req.body.lat) {
      req.body.location = {
        type: 'Point',
        coordinates: [req.body.lng, req.body.lat]
      };
    }

    const restaurant = await Restaurant.create(req.body);

    res.status(201).json({
      success: true,
      data: restaurant
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Restoranni yangilash
// @route   PUT /api/restaurants/:id
// @access  Private/Admin
const updateRestaurant = async (req, res, next) => {
  try {
    let restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      res.status(404);
      throw new Error(`Restoran topilmadi: ${req.params.id}`);
    }

    if (req.body.lng && req.body.lat) {
       req.body.location = {
         type: 'Point',
         coordinates: [req.body.lng, req.body.lat]
       };
    }

    restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({ success: true, data: restaurant });
  } catch (error) {
    next(error);
  }
};

// @desc    Restoranni o'chirish
// @route   DELETE /api/restaurants/:id
// @access  Private/Admin
const deleteRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      res.status(404);
      throw new Error(`Restoran topilmadi: ${req.params.id}`);
    }

    await restaurant.deleteOne();

    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRestaurants,
  getRestaurant,
  getNearRestaurants,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant
};
