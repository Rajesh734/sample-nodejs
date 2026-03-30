import request from 'supertest';
import app from '../src/app';
import { getPrismaClient, disconnectPrisma } from '../src/utils/dbConnection';
import { generateToken } from '../src/utils/authUtils';

const prisma = getPrismaClient();

// Test user tokens
export const adminToken = generateToken('admin-user-id', 'admin@test.com', 'ADMIN');
export const userToken = generateToken('user-user-id', 'user@test.com', 'USER');

export const api = request(app);

// Helper to make authenticated requests
export const authenticatedRequest = (token: string) => {
  return request(app).set('Authorization', `Bearer ${token}`);
};

// Cleanup function
export const cleanupDatabase = async () => {
  try {
    // Delete in order of dependencies
    await prisma.contribution.deleteMany();
    await prisma.event.deleteMany();
    await prisma.person.deleteMany();
    await prisma.user.deleteMany();
  } catch (error) {
    console.error('Cleanup error:', error);
  }
};

// Disconnect after all tests
afterAll(async () => {
  await disconnectPrisma();
});
