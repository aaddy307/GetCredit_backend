const request = require('supertest');
const { connectDB, disconnectDB, clearDB } = require('./db-uri-helper');

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

describe('Calculator Endpoints (Public)', () => {
  const validPayload = {
    loanAmount: 5000000,
    interestRate: 8.5,
    tenure: 20,
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
    describe(`POST /api/calculator/${path} (${name})`, () => {
      it('should calculate EMI with valid data', async () => {
        const res = await request(app)
          .post(`/api/calculator/${path}`)
          .send(validPayload);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body).toHaveProperty('monthlyEMI');
        expect(res.body).toHaveProperty('totalInterest');
        expect(res.body).toHaveProperty('totalAmount');
      });

      it('should reject missing loanAmount', async () => {
        const res = await request(app)
          .post(`/api/calculator/${path}`)
          .send({ interestRate: 8.5, tenure: 20 });
        expect(res.status).toBe(400);
      });

      it('should reject negative interest rate', async () => {
        const res = await request(app)
          .post(`/api/calculator/${path}`)
          .send({ ...validPayload, interestRate: -1 });
        expect(res.status).toBe(400);
      });

      it('should reject zero loan amount', async () => {
        const res = await request(app)
          .post(`/api/calculator/${path}`)
          .send({ ...validPayload, loanAmount: 0 });
        expect(res.status).toBe(400);
      });

      it('should reject zero tenure', async () => {
        const res = await request(app)
          .post(`/api/calculator/${path}`)
          .send({ ...validPayload, tenure: 0 });
        expect(res.status).toBe(400);
      });
    });
  });
});
