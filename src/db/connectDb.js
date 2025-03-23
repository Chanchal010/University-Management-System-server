const mongoose = require('mongoose');
require('colors');

// Connect to MongoDB
const connectDB = async () => {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI);
      console.log(`MongoDB connected successfully: ${conn.connection.host}`.cyan.underline.bold);
    } catch (error) {
      console.error('MongoDB connection error:', error.message);
      process.exit(1);
    }
  };

module.exports = connectDB;