const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const userRoutes = require('./routes/userRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const orderRoutes = require('./routes/orderRoutes');

// Load env vars
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to database
connectDB();

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('Yangi foydalanuvchi ulandi:', socket.id);
  socket.on('disconnect', () => {
    console.log('Foydalanuvchi uzildi:', socket.id);
  });
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  message: 'Juda ko\'p so\'rov yuborildi, iltimos 10 daqiqadan so\'ng qayta urinib ko\'ring',
});

// Middleware
app.use(express.json());
app.use(cors());
app.use(limiter);

// Statik papka
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API routers
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/orders', orderRoutes);

// API Health Check
app.get('/api', (req, res) => {
  res.json({ message: 'FoodMap API is running...' });
});

// Custom error handling
app.use(errorHandler);

// Lokal va render deploy uchun (Vercel serverlessdan tashqari)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// VERSEL UCHUN EKSPORT
module.exports = server;
