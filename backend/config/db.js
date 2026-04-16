const mongoose = require('mongoose');

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Ulangan: ${conn.connection.host}`);
  } catch (error) {
    console.error(`DB Ulanish xatosi: ${error.message}`);
    // Serverlessda process.exit(1) ishlatilmaydi
  }
};

module.exports = connectDB;
