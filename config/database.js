const mongoose = require("mongoose");
const logger = require("../utils/logger");

const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/portfolio";

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info("MongoDB connected successfully");
    return true;
  } catch (error) {
    logger.error("MongoDB connection failed:", error.message);
    throw error;
  }
};

module.exports = connectDB;
