import { Request, Response } from 'express';
import { getPrismaClient } from '../utils/dbConnection';
import { catchAsync } from '../utils/errorUtils';
import logger from '../utils/logger';

const prisma = getPrismaClient();

interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  database: {
    status: 'connected' | 'disconnected';
    latency?: number;
  };
  environment: string;
  version: string;
}

export const healthCheck = catchAsync(async (_req: Request, res: Response) => {
  const startTime = Date.now();
  const statusCode = 200;
  const healthStatus: HealthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      status: 'disconnected',
    },
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
  };

  try {
    // Test database connection
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;

    healthStatus.database.status = 'connected';
    healthStatus.database.latency = dbLatency;
  } catch (error) {
    logger.warn('Database health check failed', { error });
    healthStatus.status = 'degraded';
    healthStatus.database.status = 'disconnected';
  }

  const responseTime = Date.now() - startTime;

  res.status(statusCode).json({
    ...healthStatus,
    responseTime: `${responseTime}ms`,
  });
});

export const readiness = catchAsync(async (_req: Request, res: Response) => {
  try {
    // Check if system is ready to handle requests
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'ready',
      message: 'System is ready to accept requests',
    });
  } catch (error) {
    logger.error('Readiness check failed', { error });
    res.status(503).json({
      status: 'not_ready',
      message: 'System is not ready',
    });
  }
});

export const liveness = catchAsync(async (_req: Request, res: Response) => {
  // Simple liveness check - if this endpoint responds, the app is alive
  res.status(200).json({
    status: 'alive',
    message: 'Application is running',
    timestamp: new Date().toISOString(),
  });
});
