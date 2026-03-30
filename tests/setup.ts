// Set test environment variables directly (no real DB required)
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DATABASE_URL = 'postgresql://mock:mock@localhost:5432/mock'; // Prisma client init needs a URL even when mocked

// Suppress logs during tests
jest.spyOn(console, 'log').mockImplementation();
jest.spyOn(console, 'warn').mockImplementation();
jest.spyOn(console, 'error').mockImplementation();

// Global test timeout
jest.setTimeout(30000);
