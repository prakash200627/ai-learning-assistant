import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';
import logger from './utils/logger.js';

import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import documentsRoutes from './routes/documentRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import flashcardRoutes from './routes/flashcardRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

import { uploadDir } from './config/multer.js';
import client from 'prom-client';
import mongoose from 'mongoose';

// Collect default metrics (CPU, Memory, GC, etc.)
client.collectDefaultMetrics();

// Define custom metrics
const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
});

const databaseStatusGauge = new client.Gauge({
  name: 'database_status',
  help: 'Database connection status (1 = connected, 0 = disconnected)'
});

// Update database connection status gauge periodically
setInterval(() => {
  databaseStatusGauge.set(mongoose.connection.readyState === 1 ? 1 : 0);
}, 5000);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Request duration tracking middleware for Prometheus
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    httpRequestDurationSeconds.labels(req.method, route || req.path, res.statusCode.toString()).observe(duration);
  });
  next();
});

// Connect to MongoDB
connectDB();

// Enable CORS
const corsOrigins = (process.env.CORS_ORIGINS || '*').split(',').map(o => o.trim());
app.use(
  cors({
    origin: corsOrigins.length === 1 && corsOrigins[0] === '*' ? true : corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use('/uploads', express.static(uploadDir));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info('HTTP request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: Date.now() - start,
    });
  });
  next();
});

// Register all endpoints
app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Prometheus metrics endpoint
app.get('/metrics', async (req, res, next) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    next(err);
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    statusCode: 404,
  });
});

// Global error handler
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '8000', 10);

app.listen(PORT, () => {
  logger.info(`Server started`, {
    port: PORT,
    node_env: process.env.NODE_ENV || 'development',
  });
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection', { error: err.message, stack: err.stack });
  process.exit(1);
});

export { app };