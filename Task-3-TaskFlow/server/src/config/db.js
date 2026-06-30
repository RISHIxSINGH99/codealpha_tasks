import mongoose from "mongoose";

/**
 * Connects to MongoDB using the connection string in MONGO_URI.
 * Exits the process if connection fails, since the app cannot
 * function without a database connection.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
