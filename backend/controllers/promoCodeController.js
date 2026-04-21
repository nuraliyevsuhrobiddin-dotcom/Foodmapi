const PromoCode = require('../models/PromoCode');

const calculateDiscount = (promoCode, subtotal) => {
  if (!promoCode) return 0;

  if (promoCode.discountType === 'fixed') {
    return Math.min(promoCode.discountValue, subtotal);
  }

  return Math.min((subtotal * promoCode.discountValue) / 100, subtotal);
};

const validatePromoCodeDoc = (promoCode, subtotal, userId = null) => {
  if (!promoCode) {
    return { valid: false, message: 'Promokod topilmadi' };
  }

  if (!promoCode.isActive) {
    return { valid: false, message: 'Promokod faol emas' };
  }

  if (promoCode.expiresAt && new Date(promoCode.expiresAt) < new Date()) {
    return { valid: false, message: 'Promokod muddati tugagan' };
  }

  if (subtotal < (promoCode.minOrderAmount || 0)) {
    return {
      valid: false,
      message: `Minimal buyurtma summasi ${promoCode.minOrderAmount} bo'lishi kerak`,
    };
  }

  if (
    promoCode.usageLimit !== null &&
    promoCode.usageLimit !== undefined &&
    promoCode.usageCount >= promoCode.usageLimit
  ) {
    return { valid: false, message: 'Promokod limiti tugagan' };
  }

  if (
    promoCode.oneTimePerUser &&
    userId &&
    Array.isArray(promoCode.usedBy) &&
    promoCode.usedBy.some((usedUserId) => String(usedUserId) === String(userId))
  ) {
    return { valid: false, message: 'Bu promokod siz uchun allaqachon ishlatilgan' };
  }

  return { valid: true };
};

const createPromoCode = async (req, res, next) => {
  try {
    const promoCode = await PromoCode.create({
      code: req.body.code,
      discountType: req.body.discountType,
      discountValue: req.body.discountValue,
      minOrderAmount: req.body.minOrderAmount || 0,
      usageLimit: req.body.usageLimit || null,
      oneTimePerUser: Boolean(req.body.oneTimePerUser),
      firstOrderOnly: Boolean(req.body.firstOrderOnly),
      isActive: req.body.isActive ?? true,
      expiresAt: req.body.expiresAt || null,
    });

    res.status(201).json({
      success: true,
      data: promoCode,
    });
  } catch (error) {
    next(error);
  }
};

const getPromoCodes = async (req, res, next) => {
  try {
    const promoCodes = await PromoCode.find({}).sort('-createdAt');

    res.json({
      success: true,
      count: promoCodes.length,
      data: promoCodes,
    });
  } catch (error) {
    next(error);
  }
};

const updatePromoCode = async (req, res, next) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id);

    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: 'Promokod topilmadi',
      });
    }

    const { isActive, expiresAt, minOrderAmount, discountValue, discountType, usageLimit, oneTimePerUser, firstOrderOnly } = req.body;

    if (isActive !== undefined) promoCode.isActive = Boolean(isActive);
    if (expiresAt !== undefined) promoCode.expiresAt = expiresAt || null;
    if (minOrderAmount !== undefined) promoCode.minOrderAmount = Number(minOrderAmount || 0);
    if (discountValue !== undefined) promoCode.discountValue = Number(discountValue || 0);
    if (discountType !== undefined) promoCode.discountType = discountType;
    if (usageLimit !== undefined) promoCode.usageLimit = usageLimit ? Number(usageLimit) : null;
    if (oneTimePerUser !== undefined) promoCode.oneTimePerUser = Boolean(oneTimePerUser);
    if (firstOrderOnly !== undefined) promoCode.firstOrderOnly = Boolean(firstOrderOnly);

    await promoCode.save();

    res.json({
      success: true,
      data: promoCode,
    });
  } catch (error) {
    next(error);
  }
};

const validatePromoCode = async (req, res, next) => {
  try {
    const code = String(req.body.code || '').trim().toUpperCase();
    const subtotal = Number(req.body.subtotal || 0);

    const promoCode = await PromoCode.findOne({ code });
    const validation = validatePromoCodeDoc(promoCode, subtotal, req.user?.id || null);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const discountAmount = calculateDiscount(promoCode, subtotal);

    res.json({
      success: true,
      data: {
        _id: promoCode._id,
        code: promoCode.code,
        discountType: promoCode.discountType,
        discountValue: promoCode.discountValue,
        discountAmount,
        oneTimePerUser: promoCode.oneTimePerUser,
        firstOrderOnly: promoCode.firstOrderOnly,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPromoCode,
  getPromoCodes,
  updatePromoCode,
  validatePromoCode,
  validatePromoCodeDoc,
  calculateDiscount,
};
