const Restaurant = require('../models/Restaurant');

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
    'fast food': 'Tez taomlar',
    fastfood: 'Tez taomlar',
    'fast-food': 'Tez taomlar',
    'tez taomlar': 'Tez taomlar',
    desert: 'Shirinliklar',
    desertlar: 'Shirinliklar',
    dessert: 'Shirinliklar',
    desserts: 'Shirinliklar',
    shirinliklar: 'Shirinliklar',
    ichimlik: 'Ichimliklar',
    ichimliklar: 'Ichimliklar',
    drinks: 'Ichimliklar',
  };

  if (!normalizedValue) return '';
  if (categoryMap[normalizedValue]) return categoryMap[normalizedValue];

  if (normalizedValue.includes('fast')) return 'Tez taomlar';
  if (normalizedValue.includes('milliy') || normalizedValue.includes('national')) return 'Milliy';
  if (
    normalizedValue.includes('kafe') ||
    normalizedValue.includes('cafe') ||
    normalizedValue.includes('coffee') ||
    normalizedValue.includes('cofe')
  ) {
    return 'Kafe';
  }
  if (
    normalizedValue.includes('desert') ||
    normalizedValue.includes('dessert') ||
    normalizedValue.includes('shirin')
  ) {
    return 'Shirinliklar';
  }
  if (normalizedValue.includes('ichimlik') || normalizedValue.includes('drink')) {
    return 'Ichimliklar';
  }

  return String(value || '').trim();
};

// @desc    Barcha kategoriyalarni olish
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res, next) => {
  try {
    const rawCategories = await Restaurant.distinct('category');
    const categories = rawCategories
      .map(normalizeCategoryLabel)
      .filter(Boolean)
      .filter((category, index, array) => array.indexOf(category) === index)
      .sort((firstCategory, secondCategory) => firstCategory.localeCompare(secondCategory));

    res.json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
};
