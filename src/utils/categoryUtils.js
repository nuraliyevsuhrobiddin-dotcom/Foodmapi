const categoryAliasMap = {
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

export const normalizeCategoryLabel = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return '';
  if (categoryAliasMap[normalized]) return categoryAliasMap[normalized];

  if (normalized.includes('fast')) return 'Fast Food';
  if (normalized.includes('milliy') || normalized.includes('national')) return 'Milliy';
  if (
    normalized.includes('kafe') ||
    normalized.includes('cafe') ||
    normalized.includes('coffee') ||
    normalized.includes('cofe')
  ) {
    return 'Kafe';
  }

  return String(value || '').trim();
};

export const normalizeCategoryList = (categories = []) =>
  categories
    .map(normalizeCategoryLabel)
    .filter(Boolean)
    .filter((category, index, array) => array.indexOf(category) === index);

export const getCategoryTheme = (category) => {
  const normalizedCategory = normalizeCategoryLabel(category);

  return {
    Milliy: {
      icon: 'Soup',
      activeClass: 'bg-emerald-500 text-white border-emerald-500 shadow-emerald-500/25',
      idleClass: 'border-emerald-200/80 text-emerald-700 bg-emerald-50/80 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300',
      gradientClass: 'from-emerald-500 to-green-400',
      surfaceClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
      markerTone: 'marker-national',
    },
    'Fast Food': {
      icon: 'Flame',
      activeClass: 'bg-rose-500 text-white border-rose-500 shadow-rose-500/25',
      idleClass: 'border-rose-200/80 text-rose-700 bg-rose-50/80 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300',
      gradientClass: 'from-rose-500 to-orange-400',
      surfaceClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300',
      markerTone: 'marker-fast-food',
    },
    Kafe: {
      icon: 'Store',
      activeClass: 'bg-amber-500 text-white border-amber-500 shadow-amber-500/25',
      idleClass: 'border-amber-200/80 text-amber-700 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300',
      gradientClass: 'from-amber-500 to-yellow-400',
      surfaceClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
      markerTone: 'marker-cafe',
    },
  }[normalizedCategory] || {
    icon: 'UtensilsCrossed',
    activeClass: 'bg-primary text-white border-primary shadow-primary/25',
    idleClass: 'border-slate-200/80 text-slate-700 bg-white/80 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300',
    gradientClass: 'from-slate-900/45 to-transparent',
    surfaceClass: 'bg-slate-900/85 text-white dark:bg-white dark:text-slate-900',
    markerTone: 'marker-default',
  };
};

export const normalizeRestaurantCategories = (restaurant) => {
  const normalizedCategories = normalizeCategoryList(
    Array.isArray(restaurant?.category) && restaurant.category.length > 0
      ? restaurant.category
      : [restaurant?.type]
  );

  return {
    ...restaurant,
    category: normalizedCategories,
    type: normalizedCategories[0] || restaurant?.type || '',
  };
};
