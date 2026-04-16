const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Ulangan: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Xatolik: ${error.message}`);
    process.exit(1); // Xatolik bilan jarayonni to'xtatish
  }
};

module.exports = connectDB;
