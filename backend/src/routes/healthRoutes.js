import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

/**
 * GET /api/health
 * Returns service health status. Always returns HTTP 200.
 * Database status is reported but does not affect the HTTP status code.
 */
router.get('/', (req, res) => {
  const dbState = mongoose.connection.readyState;
  // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  const dbStatus = dbState === 1 ? 'ok' : 'offline';

  res.status(200).json({
    status: 'ok',
    service: 'ai-learning-assistant-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    details: {
      database: dbStatus,
      node_env: process.env.NODE_ENV || 'development',
    },
  });
});

export default router;
