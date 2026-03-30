import dotenv from 'dotenv';

// Load test environment
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';

// Suppress logs during tests
jest.spyOn(console, 'log').mockImplementation();
jest.spyOn(console, 'warn').mockImplementation();
jest.spyOn(console, 'error').mockImplementation();

// Global test timeout
jest.setTimeout(30000);
