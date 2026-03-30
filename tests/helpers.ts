jest.mock('../src/utils/dbConnection');

import request from 'supertest';
import app from '../src/app';
import { disconnectPrisma } from '../src/utils/dbConnection';
import { generateToken } from '../src/utils/authUtils';

// Test user tokens
export const adminToken = generateToken('admin-user-id', 'admin@test.com', 'ADMIN');
export const userToken = generateToken('user-user-id', 'user@test.com', 'USER');

export const api = request(app);

// Helper to make authenticated requests
export const authenticatedRequest = (token: string) => {
  const agent = request.agent(app);
  if (token) {
    agent.set('Authorization', `Bearer ${token}`);
  }
  return agent;
};

// Disconnect after all tests (no-op when DB is mocked)
afterAll(async () => {
  await disconnectPrisma();
});
