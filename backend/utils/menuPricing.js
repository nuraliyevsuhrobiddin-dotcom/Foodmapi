const parseMenuPrice = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const normalized = value.replace(/[^\d.,-]/g, '').replace(/,/g, '');
    if (!normalized) {
      return null;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const normalizeMenuItem = (item = {}) => {
  const parsedPrice = parseMenuPrice(item.price);

  return {
    ...item,
    price: parsedPrice !== null ? String(parsedPrice) : item.price,
  };
};

const normalizeMenuItems = (menu) => {
  if (!Array.isArray(menu)) {
    return [];
  }

  return menu.map(normalizeMenuItem);
};

const findInvalidMenuItems = (menu) => {
  if (!Array.isArray(menu)) {
    return [];
  }

  return menu
    .map((item, index) => ({
      index,
      name: item?.name || `#${index + 1}`,
      parsedPrice: parseMenuPrice(item?.price),
    }))
    .filter((item) => item.parsedPrice === null);
};

const sanitizeRestaurantMenu = (restaurant) => {
  if (!restaurant) {
    return restaurant;
  }

  const objectRestaurant =
    typeof restaurant.toObject === 'function' ? restaurant.toObject() : { ...restaurant };

  return {
    ...objectRestaurant,
    menu: normalizeMenuItems(objectRestaurant.menu),
  };
};

module.exports = {
  findInvalidMenuItems,
  normalizeMenuItems,
  parseMenuPrice,
  sanitizeRestaurantMenu,
};
