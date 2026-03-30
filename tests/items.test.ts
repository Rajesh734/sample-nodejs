jest.mock('../src/utils/dbConnection');

import { getPrismaClient } from '../src/utils/dbConnection';
import { generateToken } from '../src/utils/authUtils';
import { authenticatedRequest } from './helpers';

const db = getPrismaClient() as any;

describe('Authentication & Authorization', () => {
  describe('Bearer token validation', () => {
    it('should reject request without token', async () => {
      const response = await authenticatedRequest('')
        .get('/api/people');

      expect(response.status).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const response = await authenticatedRequest('invalid-token')
        .get('/api/people');

      expect(response.status).toBe(401);
    });

    it('should accept request with valid token', async () => {
      db.person.findMany.mockResolvedValue([]);
      db.person.count.mockResolvedValue(0);

      const token = generateToken('test-user', 'test@example.com', 'USER');
      const response = await authenticatedRequest(token)
        .get('/api/people');

      expect(response.status).toBe(200);
    });
  });

  describe('Health check endpoint', () => {
    it('should allow health check without authentication', async () => {
      const response = await authenticatedRequest('')
        .get('/api/health');

      // Health endpoint must be reachable without auth (status check covered in oauth.test.ts)
      expect(response.status).toBe(200);
    });
  });
});
