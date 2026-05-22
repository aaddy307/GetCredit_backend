const request = require('supertest');
const { connectDB, disconnectDB } = require('./db-uri-helper');

let app;

beforeAll(async () => {
  await connectDB();
  app = require('../server').app;
});

afterAll(async () => {
  await disconnectDB();
});

describe('Health & 404', () => {
  it('GET /api/health returns OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
  });

  it('GET /api/nonexistent returns 404 JSON', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
  });
});
