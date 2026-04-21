require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Restaurant = require('../models/Restaurant');
const { parseMenuPrice } = require('../utils/menuPricing');

const isWriteMode = process.argv.includes('--write');

const normalizePriceString = (value) => {
  const parsed = parseMenuPrice(value);
  return parsed === null ? null : String(parsed);
};

const main = async () => {
  await connectDB();

  const restaurants = await Restaurant.find({}, 'name menu');
  const invalidEntries = [];

  for (const restaurant of restaurants) {
    let hasChanges = false;
    const nextMenu = (restaurant.menu || []).map((item, index) => {
      const normalizedPrice = normalizePriceString(item.price);

      if (normalizedPrice === null) {
        hasChanges = true;
        invalidEntries.push({
          restaurantId: restaurant._id.toString(),
          restaurantName: restaurant.name,
          itemIndex: index,
          itemName: item.name || `#${index + 1}`,
          originalPrice: item.price,
          normalizedPrice: '0',
          action: 'fallback_zero',
        });

        return {
          ...item.toObject(),
          price: '0',
        };
      }

      if (String(item.price) !== normalizedPrice) {
        hasChanges = true;
        invalidEntries.push({
          restaurantId: restaurant._id.toString(),
          restaurantName: restaurant.name,
          itemIndex: index,
          itemName: item.name || `#${index + 1}`,
          originalPrice: item.price,
          normalizedPrice,
          action: 'normalize',
        });

        return {
          ...item.toObject(),
          price: normalizedPrice,
        };
      }

      return item;
    });

    if (isWriteMode && hasChanges) {
      restaurant.menu = nextMenu;
      await restaurant.save();
    }
  }

  const summary = {
    mode: isWriteMode ? 'write' : 'dry-run',
    totalRestaurants: restaurants.length,
    changedItems: invalidEntries.filter((entry) => entry.action === 'normalize').length,
    fallbackZeroItems: invalidEntries.filter((entry) => entry.action === 'fallback_zero').length,
    entries: invalidEntries,
  };

  console.log(JSON.stringify(summary, null, 2));
  await mongoose.connection.close();
};

main().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});
