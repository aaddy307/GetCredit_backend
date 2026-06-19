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

    it('should reject invalid phone', async () => {
      const res = await request(app)
        .post('/api/enquiry')
        .send({ ...validEnquiry, phone: '12345' });
      expect(res.status).toBe(400);
    });

    it('should reject Non-Salaried Loan exceeding 10 Lakhs', async () => {
      const res = await request(app)
        .post('/api/enquiry')
        .send({ ...validEnquiry, loanType: 'Non-Salaried Loan', loanAmount: 1100000 });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Loan amount cannot exceed ₹10 lakhs');
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
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.enquiries.length).toBe(1);
    });

    it('should reject without auth', async () => {
      const res = await request(app).get('/api/enquiry');
      expect(res.status).toBe(401);
    });

    it('should return 404 for non-existent enquiry', async () => {
      const admin = await createTestAdmin();
      const token = generateToken(admin._id);
      const res = await request(app)
        .get('/api/enquiry/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/enquiry/stats (Protected)', () => {
    it('should return stats with auth', async () => {
      const admin = await createTestAdmin();
      const token = generateToken(admin._id);
      const res = await request(app)
        .get('/api/enquiry/stats')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});