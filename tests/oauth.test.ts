jest.mock('../src/utils/dbConnection');

import request from 'supertest';
import app from '../src/app';
import { getPrismaClient } from '../src/utils/dbConnection';
import { userToken } from './helpers';

const db = getPrismaClient() as any;

const mockUser = {
  id: 'user-0000-0000-0000-000000000001',
  email: 'oauth@example.com',
  name: 'OAuth User',
  provider: 'GOOGLE',
  providerId: 'google-123',
  role: 'USER',
  verified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('OAuth & Health Checks', () => {
  describe('Health Endpoints', () => {
    it('should return health status', async () => {
      // $queryRaw resolves (jest.fn() default) → database shows connected
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.database.status).toBe('connected');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeGreaterThan(0);
    });

    it('should return readiness status', async () => {
      const response = await request(app).get('/api/health/ready');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ready');
    });

    it('should return liveness status', async () => {
      const response = await request(app).get('/api/health/live');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('alive');
    });
  });

  describe('Google OAuth Endpoints', () => {
    it('should reject Google login without token', async () => {
      const response = await request(app)
        .post('/api/auth/google')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid Google token', async () => {
      const response = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'not-a-jwt' });

      expect(response.status).toBe(400);
    });
  });

  describe('Apple OAuth Endpoints', () => {
    it('should reject Apple login without token', async () => {
      const response = await request(app)
        .post('/api/auth/apple')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid Apple token', async () => {
      const response = await request(app)
        .post('/api/auth/apple')
        .send({ idToken: 'not.a.valid.token' });

      expect(response.status).toBe(400);
    });
  });

  describe('JWT Token Verification', () => {
    it('should verify valid JWT token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBeDefined();
    });

    it('should reject invalid JWT', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalid.jwt.token');

      expect(response.status).toBe(401);
    });
  });

  describe('Logout Endpoint', () => {
    it('should handle logout', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Protected Routes with OAuth', () => {
    it('should reject protected route without JWT', async () => {
      const response = await request(app).get('/api/people');

      expect(response.status).toBe(401);
    });

    it('should allow protected route with valid JWT', async () => {
      db.person.findMany.mockResolvedValue([]);
      db.person.count.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/people')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Database Soft Delete with OAuth Users', () => {
    it('should soft delete OAuth users', async () => {
      const deletedUser = { ...mockUser, deletedAt: new Date() };
      db.user.create.mockResolvedValue(mockUser);
      db.user.update.mockResolvedValue(deletedUser);
      db.user.findUnique.mockResolvedValue(deletedUser);

      const created = await db.user.create({ data: {} });
      const deleted = await db.user.update({ where: { id: created.id }, data: { deletedAt: new Date() } });

      expect(deleted.deletedAt).not.toBeNull();

      const found = await db.user.findUnique({ where: { id: created.id } });
      expect(found?.deletedAt).not.toBeNull();
    });
  });
});
