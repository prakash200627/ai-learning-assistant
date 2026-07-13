import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const connectDB = async () => {
  try {
    // Disable mongoose query buffering so disconnected queries fail fast
    mongoose.set('bufferCommands', false);

    logger.info('Connecting to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    logger.info('MongoDB connected', { host: conn.connection.host });
  } catch (error) {
    logger.error('MongoDB connection failed — entering offline fallback mode', {
      error: error.message,
    });
  }
};

export default connectDB;