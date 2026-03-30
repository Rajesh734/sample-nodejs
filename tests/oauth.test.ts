import request from 'supertest';
import app from '../src/app';
import { getPrismaClient } from '../src/utils/dbConnection';
import { userToken, cleanupDatabase } from './helpers';

const prisma = getPrismaClient();

describe('OAuth & Health Checks', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  describe('Health Endpoints', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.database.status).toBe('connected');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeGreaterThan(0);
    });

    it('should return readiness status', async () => {
      const response = await request(app)
        .get('/api/health/ready');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ready');
    });

    it('should return liveness status', async () => {
      const response = await request(app)
        .get('/api/health/live');

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
        .send({
          idToken: 'invalid.token.here',
        });

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
        .send({
          idToken: 'not.a.valid.token',
        });

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
      const response = await request(app)
        .get('/api/people');

      expect(response.status).toBe(401);
    });

    it('should allow protected route with valid JWT', async () => {
      const response = await request(app)
        .get('/api/people')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Database Soft Delete with OAuth Users', () => {
    it('should soft delete OAuth users', async () => {
      // Create a user via OAuth
      const user = await prisma.user.create({
        data: {
          email: 'oauth@example.com',
          provider: 'GOOGLE',
          providerId: 'google-123',
          verified: true,
        },
      });

      // Soft delete
      const deleted = await prisma.user.update({
        where: { id: user.id },
        data: { deletedAt: new Date() },
      });

      expect(deleted.deletedAt).not.toBeNull();

      // Verify not returned in normal queries
      const found = await prisma.user.findUnique({
        where: { id: user.id },
      });

      // Soft deleted user still exists in DB but should be filtered in app
      expect(found?.deletedAt).not.toBeNull();
    });
  });
});
