import request from 'supertest';
import { connectDB, disconnectDB, clearDB } from './db-uri-helper.js';
import { createTestAdmin, generateToken } from './helpers.js';

let app;

beforeAll(async () => {
  await connectDB();
  const server = await import('../server.js');
  app = server.app;
});

afterAll(async () => {
  await disconnectDB();
});

afterEach(async () => {
  await clearDB();
});

describe('Admin Protected Endpoints', () => {
  let admin, token;

  beforeEach(async () => {
    admin = await createTestAdmin();
    token = generateToken(admin._id);
  });

  describe('GET /api/admin/stats/today', () => {
    it('should return today stats with auth', async () => {
      const res = await request(app)
        .get('/api/admin/stats/today')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.stats).toHaveProperty('todayLeads');
      expect(res.body.stats).toHaveProperty('totalLeads');
    });

    it('should reject without auth', async () => {
      const res = await request(app).get('/api/admin/stats/today');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/admin/analytics/summary', () => {
    it('should return analytics summary with auth', async () => {
      const res = await request(app)
        .get('/api/admin/analytics/summary')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/admin/all-leads', () => {
    it('should return all leads with auth', async () => {
      const res = await request(app)
        .get('/api/admin/all-leads')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it('should return paginated results', async () => {
      const res = await request(app)
        .get('/api/admin/all-leads?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('page');
      expect(res.body).toHaveProperty('pages');
      expect(res.body).toHaveProperty('total');
    });
  });

  describe('GET /api/admin/search', () => {
    it('should search with auth and query', async () => {
      const res = await request(app)
        .get('/api/admin/search?q=test')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it('should return empty for short query', async () => {
      const res = await request(app)
        .get('/api/admin/search?q=a')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.results.length).toBe(0);
    });
  });

  describe('Admin Users CRUD', () => {
    it('GET /api/admin/users should list users with auth', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.admins.length).toBe(1);
    });

    it('POST /api/admin/users should create user with auth', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'New User',
          email: 'newuser@test.com',
          password: 'NewUser@12345',
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('POST /api/admin/users should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Duplicate',
          email: 'admin@test.com',
          password: 'Duplicate@123',
        });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/admin/leads/export', () => {
    it('should export with auth', async () => {
      const res = await request(app)
        .get('/api/admin/leads/export?format=csv')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });
});