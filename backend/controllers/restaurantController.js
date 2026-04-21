const Restaurant = require('../models/Restaurant');
const { createAuditLog } = require('../utils/auditLog');
const {
  findInvalidMenuItems,
  normalizeMenuItems,
  sanitizeRestaurantMenu,
} = require('../utils/menuPricing');

const normalizeCategoryLabel = (value) => {
  const normalizedValue = String(value || '').trim().toLowerCase();
  const categoryMap = {
    milliy: 'Milliy',
    'milliy taomlar': 'Milliy',
    national: 'Milliy',
    kafe: 'Kafe',
    cafe: 'Kafe',
    coffee: 'Kafe',
    'coffee shop': 'Kafe',
    coffeeshop: 'Kafe',
    'fast food': 'Fast Food',
    fastfood: 'Fast Food',
    'fast-food': 'Fast Food',
  };

  if (!normalizedValue) return '';
  if (categoryMap[normalizedValue]) return categoryMap[normalizedValue];

  if (normalizedValue.includes('fast')) return 'Fast Food';
  if (normalizedValue.includes('milliy') || normalizedValue.includes('national')) return 'Milliy';
  if (
    normalizedValue.includes('kafe') ||
    normalizedValue.includes('cafe') ||
    normalizedValue.includes('coffee') ||
    normalizedValue.includes('cofe')
  ) {
    return 'Kafe';
  }

  return String(value || '').trim();
};

const normalizeRestaurantCategoryPayload = (restaurant) => {
  const sanitizedRestaurant = sanitizeRestaurantMenu(restaurant);
  const normalizedCategories = (sanitizedRestaurant.category || [])
    .map(normalizeCategoryLabel)
    .filter(Boolean)
    .filter((category, index, array) => array.indexOf(category) === index);

  return {
    ...sanitizedRestaurant,
    category: normalizedCategories,
  };
};

const buildCategoryQuery = (categoryQuery) => {
  if (!categoryQuery) {
    return null;
  }

  const normalizedCategories = categoryQuery
    .split(',')
    .map(normalizeCategoryLabel)
    .filter(Boolean);

  if (normalizedCategories.length === 0) {
    return null;
  }

  return {
    $in: normalizedCategories.map((category) => new RegExp(`^${category}$`, 'i')),
  };
};

const formatRestaurantDistance = (restaurant, lat, lng) => {
  if (!restaurant?.location?.coordinates?.length) {
    return normalizeRestaurantCategoryPayload(restaurant);
  }

  const [restaurantLng, restaurantLat] = restaurant.location.coordinates;
  const distanceKm = Math.hypot(restaurantLat - lat, restaurantLng - lng) * 111;

  return {
    ...normalizeRestaurantCategoryPayload(restaurant),
    distance: Number(distanceKm.toFixed(1)),
  };
};

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
    const categoryQuery = buildCategoryQuery(req.query.category);
    if (categoryQuery) {
      query.category = categoryQuery;
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
      data: restaurants.map(normalizeRestaurantCategoryPayload)
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

    res.json({ success: true, data: normalizeRestaurantCategoryPayload(restaurant) });
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

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    let query = {
      location: {
        $near: {
          $maxDistance: distanceInMeters,
          $geometry: {
            type: 'Point',
            coordinates: [parsedLng, parsedLat]
          }
        }
      }
    };

    const categoryQuery = buildCategoryQuery(req.query.category);
    if (categoryQuery) {
      query.category = categoryQuery;
    }

    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      query.$or = [
        { name: searchRegex },
        { address: searchRegex },
        { 'menu.name': searchRegex }
      ];
    }

    const restaurants = await Restaurant.find(query);

    res.json({
      success: true,
      count: restaurants.length,
      data: restaurants.map((restaurant) => formatRestaurantDistance(restaurant, parsedLat, parsedLng))
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
    if (req.body.lng !== undefined && req.body.lat !== undefined) {
      req.body.location = {
        type: 'Point',
        coordinates: [req.body.lng, req.body.lat]
      };
    }

    if (!req.body.owner && req.user?.role === 'restaurant') {
      req.body.owner = req.user._id;
    }

    if (req.body.category !== undefined) {
      req.body.category = []
        .concat(req.body.category)
        .map(normalizeCategoryLabel)
        .filter(Boolean);
    }

    if (req.body.menu !== undefined) {
      const invalidMenuItems = findInvalidMenuItems(req.body.menu);
      if (invalidMenuItems.length > 0) {
        res.status(400);
        throw new Error(
          `Menu narxi noto'g'ri: ${invalidMenuItems.map((item) => item.name).join(', ')}`
        );
      }

      req.body.menu = normalizeMenuItems(req.body.menu);
    }

    const restaurant = await Restaurant.create(req.body);

    await createAuditLog({
      actor: req.user?._id,
      actorRole: req.user?.role,
      action: 'create_restaurant',
      entityType: 'Restaurant',
      entityId: restaurant._id,
      message: `${req.user?.username || 'User'} yangi restoran qo'shdi`,
      metadata: { name: restaurant.name },
    });

    res.status(201).json({
      success: true,
      data: normalizeRestaurantCategoryPayload(restaurant)
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

    if (req.body.lng !== undefined && req.body.lat !== undefined) {
       req.body.location = {
         type: 'Point',
         coordinates: [req.body.lng, req.body.lat]
       };
    }

    if (req.body.category !== undefined) {
      req.body.category = []
        .concat(req.body.category)
        .map(normalizeCategoryLabel)
        .filter(Boolean);
    }

    if (req.body.menu !== undefined) {
      const invalidMenuItems = findInvalidMenuItems(req.body.menu);
      if (invalidMenuItems.length > 0) {
        res.status(400);
        throw new Error(
          `Menu narxi noto'g'ri: ${invalidMenuItems.map((item) => item.name).join(', ')}`
        );
      }

      req.body.menu = normalizeMenuItems(req.body.menu);
    }

    restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    await createAuditLog({
      actor: req.user?._id,
      actorRole: req.user?.role,
      action: 'update_restaurant',
      entityType: 'Restaurant',
      entityId: restaurant._id,
      message: `${req.user?.username || 'User'} restoran ma'lumotini yangiladi`,
      metadata: { name: restaurant.name },
    });

    res.json({ success: true, data: normalizeRestaurantCategoryPayload(restaurant) });
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

    await createAuditLog({
      actor: req.user?._id,
      actorRole: req.user?.role,
      action: 'delete_restaurant',
      entityType: 'Restaurant',
      entityId: req.params.id,
      message: `${req.user?.username || 'User'} restoran o'chirdi`,
      metadata: { name: restaurant.name },
    });

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
