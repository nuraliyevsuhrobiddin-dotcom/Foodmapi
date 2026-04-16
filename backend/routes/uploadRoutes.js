const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');

// Cloudinary konfiguratsiyasi (.env dan oladi)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'shuyerga_yozing',
  api_key: process.env.CLOUDINARY_API_KEY || 'shuyerga_yozing',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'shuyerga_yozing',
});

// Cloudinary storage parametri
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'foodmap_uploads', // Cloudinary dagi papka nomi
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
});

const upload = multer({ storage: storage });

// @route   POST /api/upload
// @desc    Rasm yuklash
// @access  Private/Admin
router.post('/', upload.array('image', 5), (req, res) => {
  if (req.files && req.files.length > 0) {
    // Disk o'rniga cloudinary o'zi URL qaytaradi req.files[].path ichida
    const urls = req.files.map(file => file.path);
    res.json({
      success: true,
      urls,
      message: 'Rasmlar Cloudinary ga muvaffaqiyatli yuklandi'
    });
  } else {
    res.status(400).json({ success: false, message: 'Fayl topilmadi yoki yuklanmadi' });
  }
});

module.exports = router;
