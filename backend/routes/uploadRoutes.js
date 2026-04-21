const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { protect, admin } = require('../middleware/authMiddleware');

// Cloudinary konfiguratsiyasi (.env dan oladi)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'shuyerga_yozing',
  api_key: process.env.CLOUDINARY_API_KEY || 'shuyerga_yozing',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'shuyerga_yozing',
});

// Cloudinary storage parametri
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype?.startsWith('video/');

    return {
      folder: 'foodmap_uploads',
      resource_type: isVideo ? 'video' : 'image',
      allowed_formats: isVideo
        ? ['mp4', 'mov', 'webm', 'm4v']
        : ['jpg', 'jpeg', 'png', 'webp'],
    };
  },
});

const upload = multer({ storage: storage });

// @route   POST /api/upload
// @desc    Media yuklash
// @access  Private/Admin
router.post('/', protect, admin, upload.array('media', 5), (req, res) => {
  if (req.files && req.files.length > 0) {
    const files = req.files.map((file) => ({
      url: file.path,
      resourceType: file.resource_type || (file.mimetype?.startsWith('video/') ? 'video' : 'image'),
      format: file.format || '',
    }));
    res.json({
      success: true,
      files,
      urls: files.map((file) => file.url),
      message: 'Media Cloudinary ga muvaffaqiyatli yuklandi'
    });
  } else {
    res.status(400).json({ success: false, message: 'Fayl topilmadi yoki yuklanmadi' });
  }
});

module.exports = router;
