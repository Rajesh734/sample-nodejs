/**
 * Manual Jest mock for src/utils/dbConnection.ts
 *
 * Activated in test files by calling: jest.mock('../src/utils/dbConnection')
 * Access the mock client via: const db = getPrismaClient() as any;
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export const mockPrismaClient = {
  person: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    createMany: jest.fn(),
  },
  event: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    createMany: jest.fn(),
  },
  contribution: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  user: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
  $queryRaw: jest.fn(),
  $disconnect: jest.fn(),
};

export const getPrismaClient = jest.fn().mockReturnValue(mockPrismaClient);
export const disconnectPrisma = jest.fn();
