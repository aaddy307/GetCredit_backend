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

describe('Enquiry Endpoints', () => {
  const validEnquiry = {
    fullName: 'John Doe',
    phone: '9876543210',
    email: 'john@example.com',
    city: 'Mumbai',
    loanType: 'Personal Loan',
    loanAmount: 500000,
  };

  describe('POST /api/enquiry (Public)', () => {
    it('should create enquiry with valid data', async () => {
      const res = await request(app)
        .post('/api/enquiry')
        .send(validEnquiry);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should reject missing fullName', async () => {
      const res = await request(app)
        .post('/api/enquiry')
        .send({ ...validEnquiry, fullName: '' });
      expect(res.status).toBe(400);
    });

    it('should reject invalid email', async () => {
      const res = await request(app)
        .post('/api/enquiry')
        .send({ ...validEnquiry, email: 'notanemail' });
      expect(res.status).toBe(400);
    });

    it('should reject invalid loanType', async () => {
      const res = await request(app)
        .post('/api/enquiry')
        .send({ ...validEnquiry, loanType: 'Invalid Loan' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/enquiry (Protected)', () => {
    it('should list enquiries with auth', async () => {
      const admin = await createTestAdmin();
      const token = generateToken(admin._id);

      await request(app)
        .post('/api/enquiry')
        .send(validEnquiry);

      const res = await request(app)
        .get('/api/enquiry')
        .set('Cookie', `token=${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.enquiries.length).toBe(1);
    });

    it('should reject without auth', async () => {
      const res = await request(app).get('/api/enquiry');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/enquiry/stats (Protected)', () => {
    it('should return stats with auth', async () => {
      const admin = await createTestAdmin();
      const token = generateToken(admin._id);
      const res = await request(app)
        .get('/api/enquiry/stats')
        .set('Cookie', `token=${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
