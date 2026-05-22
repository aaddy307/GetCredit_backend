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

describe('Blog Endpoints', () => {
  const validBlog = {
    title: 'Test Blog Post',
    content: '<p>This is a test blog post content.</p>',
    category: 'Finance',
    excerpt: 'A test blog post',
  };

  describe('GET /api/blogs (Public)', () => {
    it('should return empty list when no blogs', async () => {
      const res = await request(app).get('/api/blogs');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.blogs.length).toBe(0);
    });

    it('should return blogs list', async () => {
      const admin = await createTestAdmin();
      const token = generateToken(admin._id);

      await request(app)
        .post('/api/blogs')
        .set('Cookie', `token=${token}`)
        .send(validBlog);

      const res = await request(app).get('/api/blogs');
      expect(res.status).toBe(200);
      expect(res.body.blogs.length).toBe(1);
    });
  });

  describe('POST /api/blogs (Protected)', () => {
    it('should create blog with auth', async () => {
      const admin = await createTestAdmin();
      const token = generateToken(admin._id);

      const res = await request(app)
        .post('/api/blogs')
        .set('Cookie', `token=${token}`)
        .send(validBlog);
      expect(res.status).toBe(201);
      expect(res.body.blog).toHaveProperty('slug');
    });

    it('should reject without auth', async () => {
      const res = await request(app)
        .post('/api/blogs')
        .send(validBlog);
      expect(res.status).toBe(401);
    });

    it('should reject missing title', async () => {
      const admin = await createTestAdmin();
      const token = generateToken(admin._id);

      const res = await request(app)
        .post('/api/blogs')
        .set('Cookie', `token=${token}`)
        .send({ ...validBlog, title: '' });
      expect(res.status).toBe(400);
    });
  });
});
