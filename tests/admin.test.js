const request = require('supertest');
const { connectDB, disconnectDB, clearDB } = require('./db-uri-helper');
const { createTestAdmin, generateToken } = require('./helpers');

let app;

beforeAll(async () => {
  await connectDB();
  app = require('../server').app;
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
        .set('Cookie', `token=${token}`);
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
        .set('Cookie', `token=${token}`);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/admin/all-leads', () => {
    it('should return all leads with auth', async () => {
      const res = await request(app)
        .get('/api/admin/all-leads')
        .set('Cookie', `token=${token}`);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/admin/search', () => {
    it('should search with auth and query', async () => {
      const res = await request(app)
        .get('/api/admin/search?q=test')
        .set('Cookie', `token=${token}`);
      expect(res.status).toBe(200);
    });
  });

  describe('Admin Users CRUD', () => {
    it('GET /api/admin/users should list users with auth', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Cookie', `token=${token}`);
      expect(res.status).toBe(200);
      expect(res.body.admins.length).toBe(1);
    });

    it('POST /api/admin/users should create user with auth', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .set('Cookie', `token=${token}`)
        .send({
          name: 'New User',
          email: 'newuser@test.com',
          password: 'NewUser@12345',
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/admin/leads/export', () => {
    it('should export with auth', async () => {
      const res = await request(app)
        .get('/api/admin/leads/export?format=csv')
        .set('Cookie', `token=${token}`);
      expect(res.status).toBe(200);
    });
  });
});
