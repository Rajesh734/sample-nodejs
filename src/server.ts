import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
import app from './app';
import logger from './utils/logger';
import { disconnectPrisma, getPrismaClient } from './utils/dbConnection';

dotenv.config();

const execAsync = promisify(exec);
const PORT = process.env.PORT || 3000;
const environment = process.env.NODE_ENV || 'development';
logger.debug(`Starting server in ${environment} environment...`);

async function waitForDatabase(attempts: number = 10, delayMs: number = 3000): Promise<void> {
  logger.info(`Waiting for database connection (max ${attempts} attempts, ${delayMs}ms delay)...`);

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const prisma = getPrismaClient();
      await prisma.$queryRaw`SELECT 1`;
      logger.info(`✓ Database connection successful on attempt ${attempt}`);
      return;
    } catch (error) {
      logger.warn(`✗ Attempt ${attempt}/${attempts} failed. Retrying in ${delayMs}ms...`);
      if (attempt === attempts) {
        logger.error('✗ Failed to connect to database after maximum attempts');
        process.exit(1);
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

async function runMigrations(): Promise<void> {
  try {
    logger.info('Running Prisma migrations...');
    await execAsync('npx prisma migrate deploy');
    logger.info('✓ Migrations completed successfully');
  } catch (error: any) {
    logger.warn(`Migrations warning: ${error.message}`);
    // Continue even if migrations fail (they may have already been run)
  }
}

async function seedDatabase(): Promise<void> {
  try {
    logger.info('Checking if database needs seeding...');
    const prisma = getPrismaClient();
    const peopleCount = await prisma.person.count();
    
    if (peopleCount === 0) {
      logger.info('Seeding database with sample data...');
      await execAsync('npx ts-node prisma/seed.ts');
      logger.info('✓ Database seeded successfully');
    } else {
      logger.info('Database already contains data, skipping seed');
    }
  } catch (error: any) {
    logger.warn(`Seed warning: ${error.message}`);
  }
}

async function startServer() {
  try {
    // Step 1: Wait for database
    await waitForDatabase();

    // Step 2: Run migrations
    await runMigrations();

    if(environment.toLowerCase() !== 'production') {
      logger.debug('Non-production environment detected, running seed script...');
      // Step 3: Seed database if needed
      await seedDatabase();

    }
    // Step 4: Start Express server
    const server = app.listen(PORT, () => {
      logger.info(`✓ Server running on http://localhost:${PORT}`);
      logger.info(`Health check: GET http://localhost:${PORT}/api/health`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, gracefully shutting down...`);
      server.close(async () => {
        await disconnectPrisma();
        logger.info('✓ Server closed');
        process.exit(0);
      });

      // Force shutdown after 30s
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error(`Failed to start server: ${error}`);
    process.exit(1);
  }
}

startServer();
