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

describe('EMI Enquiry Endpoints', () => {
  const validPayload = {
    fullName: 'EMI User',
    mobile: '9876543210',
    email: 'emi@example.com',
    city: 'Bangalore',
    loanAmount: 3000000,
    interestRate: 8.5,
    tenureYears: 15,
    calculatedEMI: 29500,
    totalInterest: 2310000,
    totalPayable: 5310000,
  };

  const endpoints = [
    { path: 'home-loan', name: 'Home Loan' },
    { path: 'lap', name: 'Loan Against Property' },
    { path: 'education-loan', name: 'Education Loan' },
    { path: 'personal-loan', name: 'Personal Loan' },
    { path: 'business-loan', name: 'Business Loan' },
    { path: 'vehicle-loan', name: 'Vehicle Loan' },
  ];

  endpoints.forEach(({ path, name }) => {
    describe(`POST /api/emi/${path} (${name})`, () => {
      it('should create EMI enquiry with valid data', async () => {
        const payload = path === 'education-loan'
          ? { ...validPayload, qualification: 'Undergraduate' }
          : validPayload;
        const res = await request(app)
          .post(`/api/emi/${path}`)
          .send(payload);
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
      });

      it('should reject missing mobile', async () => {
        const payload = path === 'education-loan'
          ? { ...validPayload, mobile: '', qualification: 'Undergraduate' }
          : { ...validPayload, mobile: '' };
        const res = await request(app)
          .post(`/api/emi/${path}`)
          .send(payload);
        expect(res.status).toBe(400);
      });
    });
  });

  describe('GET /api/emi/admin/emi-enquiries (Protected)', () => {
    it('should list EMI enquiries with auth', async () => {
      const admin = await createTestAdmin();
      const token = generateToken(admin._id);

      await request(app)
        .post('/api/emi/home-loan')
        .send(validPayload);

      const res = await request(app)
        .get('/api/emi/admin/emi-enquiries')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should reject without auth', async () => {
      const res = await request(app).get('/api/emi/admin/emi-enquiries');
      expect(res.status).toBe(401);
    });
  });
});