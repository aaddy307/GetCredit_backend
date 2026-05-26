import request from 'supertest';
import { connectDB, disconnectDB, clearDB } from './db-uri-helper.js';
import { createTestAdmin } from './helpers.js';

let app, resetRateLimiter;

beforeAll(async () => {
  await connectDB();
  const server = await import('../server.js');
  app = server.app;
  resetRateLimiter = server.resetRateLimiter;
});

afterAll(async () => {
  await disconnectDB();
});

afterEach(async () => {
  await clearDB();
  if (resetRateLimiter) resetRateLimiter();
});

describe('Rate Limiter - POST /api/admin/login', () => {
  const adminData = {
    name: 'Rate Limit Admin',
    email: 'ratelimit@test.com',
    password: 'RateLimit@123',
  };

  beforeEach(async () => {
    await createTestAdmin(adminData);
  });

  it('should allow 6 failed attempts', async () => {
    for (let i = 0; i < 6; i++) {
      const res = await request(app)
        .post('/api/admin/login')
        .send({ email: adminData.email, password: 'wrongpass' });
      expect(res.status).toBe(401);
    }
  });

  it('should return 429 on 7th failed attempt', async () => {
    for (let i = 0; i < 6; i++) {
      await request(app)
        .post('/api/admin/login')
        .send({ email: adminData.email, password: 'wrongpass' });
    }
    const res = await request(app)
      .post('/api/admin/login')
      .send({ email: adminData.email, password: 'wrongpass' });
    expect(res.status).toBe(429);
    expect(res.body.message).toContain('Too many failed login attempts');
  });

  it('should reject with valid credentials after lockout', async () => {
    for (let i = 0; i < 6; i++) {
      await request(app)
        .post('/api/admin/login')
        .send({ email: adminData.email, password: 'wrongpass' });
    }
    const res = await request(app)
      .post('/api/admin/login')
      .send({ email: adminData.email, password: adminData.password });
    expect(res.status).toBe(429);
  });

  it('should return success after rate limiter reset', async () => {
    for (let i = 0; i < 6; i++) {
      await request(app)
        .post('/api/admin/login')
        .send({ email: adminData.email, password: 'wrongpass' });
    }

    let res = await request(app)
      .post('/api/admin/login')
      .send({ email: adminData.email, password: 'wrongpass' });
    expect(res.status).toBe(429);

    resetRateLimiter();

    res = await request(app)
      .post('/api/admin/login')
      .send({ email: adminData.email, password: adminData.password });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});