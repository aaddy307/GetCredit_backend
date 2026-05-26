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

describe('Admin Auth', () => {
  const adminData = {
    name: 'Test Admin',
    email: 'admin@test.com',
    password: 'TestAdmin@123',
  };

  describe('POST /api/admin/login', () => {
    it('should login with valid credentials', async () => {
      await createTestAdmin(adminData);
      const res = await request(app)
        .post('/api/admin/login')
        .send({ email: adminData.email, password: adminData.password });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.admin.email).toBe(adminData.email);
      expect(res.body.token).toBeDefined();
    });

    it('should reject invalid password', async () => {
      await createTestAdmin(adminData);
      const res = await request(app)
        .post('/api/admin/login')
        .send({ email: adminData.email, password: 'wrongpass1' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject non-existent email', async () => {
      const res = await request(app)
        .post('/api/admin/login')
        .send({ email: 'noone@test.com', password: 'test123' });
      expect(res.status).toBe(401);
    });

    it('should reject missing fields', async () => {
      const res = await request(app)
        .post('/api/admin/login')
        .send({ email: adminData.email });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/admin/create', () => {
    it('should create first admin without auth', async () => {
      const res = await request(app)
        .post('/api/admin/create')
        .send({
          name: 'First Admin',
          email: 'first@admin.com',
          password: 'StrongPass123!',
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should reject creating second admin without auth', async () => {
      await createTestAdmin({ email: 'existing@admin.com' });
      const res = await request(app)
        .post('/api/admin/create')
        .send({
          name: 'Second Admin',
          email: 'second@admin.com',
          password: 'StrongPass123!',
        });
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/admin/profile', () => {
    it('should return profile with valid token', async () => {
      const admin = await createTestAdmin(adminData);
      const token = generateToken(admin._id);
      const res = await request(app)
        .get('/api/admin/profile')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.admin.email).toBe(adminData.email);
    });

    it('should reject without token', async () => {
      const res = await request(app).get('/api/admin/profile');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/admin/logout', () => {
    it('should logout successfully', async () => {
      const admin = await createTestAdmin(adminData);
      const token = generateToken(admin._id);
      const res = await request(app)
        .post('/api/admin/logout')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
