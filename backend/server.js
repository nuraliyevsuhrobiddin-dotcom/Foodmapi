const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

// Routes
const authRoutes = require('./routes/authRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const userRoutes = require('./routes/userRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const orderRoutes = require('./routes/orderRoutes');

dotenv.config();

// Connect to DB (Serverless muhitda ulanishni kutish shart emas, lekin ulanish xatosi processni o'ldirmasligi kerak)
connectDB();

const app = express();

app.use(express.json());
app.use(cors());

// Statik fayllar (Vercel uchun)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes - Muhim: hammasi /api prefiksi bilan
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/orders', orderRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'FoodMap API is running...' });
});

// Error Handler
app.use(errorHandler);

// LISTEN ni faqat lokalda ishlatish uchun:
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}

// Vercel uchun appni eksport qilamiz
module.exports = app;
