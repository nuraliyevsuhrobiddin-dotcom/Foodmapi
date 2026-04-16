const mongoose = require('mongoose');

const connectDB = async () => {
  // Agar allaqachon ulangan bo'lsa, qayta ulanma
  if (mongoose.connection.readyState >= 1) return;

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Ulangan: ${conn.connection.host}`);
  } catch (error) {
    console.error(`DB Ulanish xatosi: ${error.message}`);
    // Serverless muhitda process.exit(1) qilish mumkin emas
  }
};

module.exports = connectDB;
