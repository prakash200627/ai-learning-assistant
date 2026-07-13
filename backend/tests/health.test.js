import request from 'supertest';
import { app } from '../src/server.js';

describe('GET /api/health', () => {
  it('should return HTTP 200 with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('ai-learning-assistant-api');
    expect(res.body.version).toBe('1.0.0');
    expect(res.body.timestamp).toBeDefined();
    expect(res.body.details).toBeDefined();
    expect(['ok', 'offline']).toContain(res.body.details.database);
  });
});

describe('404 handler', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nonexistent-route');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Route not found');
  });
});
