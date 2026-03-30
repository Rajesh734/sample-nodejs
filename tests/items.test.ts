import { generateToken } from '../src/utils/authUtils';
import { authenticatedRequest } from './helpers';

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

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });
});
