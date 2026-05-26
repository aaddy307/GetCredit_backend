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

describe('Callback Endpoints', () => {
  const validCallback = {
    fullName: 'Jane Doe',
    phone: '9876543210',
    email: 'jane@example.com',
    city: 'Delhi',
  };

  describe('POST /api/callback (Public)', () => {
    it('should create callback request with valid data', async () => {
      const res = await request(app)
        .post('/api/callback')
        .send(validCallback);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('fullName', 'Jane Doe');
    });

    it('should reject missing phone', async () => {
      const res = await request(app)
        .post('/api/callback')
        .send({ ...validCallback, phone: '' });
      expect(res.status).toBe(400);
    });

    it('should reject invalid phone', async () => {
      const res = await request(app)
        .post('/api/callback')
        .send({ ...validCallback, phone: '12345' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/callback (Protected)', () => {
    it('should list callbacks with auth', async () => {
      const admin = await createTestAdmin();
      const token = generateToken(admin._id);

      await request(app)
        .post('/api/callback')
        .send(validCallback);

      const res = await request(app)
        .get('/api/callback')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });

    it('should reject without auth', async () => {
      const res = await request(app).get('/api/callback');
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/callback/:id/status (Protected)', () => {
    it('should update callback status', async () => {
      const admin = await createTestAdmin();
      const token = generateToken(admin._id);

      const createRes = await request(app)
        .post('/api/callback')
        .send(validCallback);
      const callbackId = createRes.body.data._id;

      const res = await request(app)
        .patch(`/api/callback/${callbackId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'Called' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('Called');
    });

    it('should reject invalid status', async () => {
      const admin = await createTestAdmin();
      const token = generateToken(admin._id);

      const createRes = await request(app)
        .post('/api/callback')
        .send(validCallback);
      const callbackId = createRes.body.data._id;

      const res = await request(app)
        .patch(`/api/callback/${callbackId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'Invalid' });
      expect(res.status).toBe(400);
    });
  });
});
