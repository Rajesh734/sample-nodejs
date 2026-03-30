import request from 'supertest';
import app from '../src/app';
import { getPrismaClient } from '../src/utils/dbConnection';
import jwt from 'jsonwebtoken';

const prisma = getPrismaClient();

describe('Docker Integration Tests', () => {
  let testPersonId: string;
  let jwtToken: string;
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

  beforeAll(async () => {
    // Wait for database to be ready
    let retries = 0;
    const maxRetries = 10;

    while (retries < maxRetries) {
      try {
        await prisma.$queryRaw`SELECT 1`;
        break;
      } catch (error) {
        retries++;
        if (retries === maxRetries) {
          throw new Error('Database did not become ready in time');
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Create test user and JWT
    const user = await prisma.user.create({
      data: {
        email: `e2e-test-${Date.now()}@example.com`,
        provider: 'GOOGLE',
        providerId: `test-google-${Date.now()}`,
        verified: true,
      },
    });

    jwtToken = jwt.sign(
      { id: user.id, email: user.email, role: 'USER' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
  });

  afterAll(async () => {
    // Cleanup
    try {
      if (testPersonId) {
        await prisma.person.deleteMany({
          where: { id: testPersonId },
        });
      }
    } catch (e) {
      // Already deleted or not found
    }
  });

  describe('System Health', () => {
    it('should have healthy database connection', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.database.status).toBe('connected');
      expect(response.body.database.latency).toBeGreaterThan(0);
    });

    it('should report readiness', async () => {
      const response = await request(app).get('/api/health/ready');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ready');
    });

    it('should report liveness', async () => {
      const response = await request(app).get('/api/health/live');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('alive');
    });
  });

  describe('End-to-End Flow', () => {
    it('should verify JWT token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should create person with authentication', async () => {
      const response = await request(app)
        .post('/api/people')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          name: 'Docker Test Person',
          displayName: 'DTP',
          fatherName: 'Father Name',
          phone: '1234567890',
          homeTown: 'Test City',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();

      testPersonId = response.body.data.id;
    });

    it('should get person with authentication', async () => {
      const response = await request(app)
        .get(`/api/people/${testPersonId}`)
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Docker Test Person');
    });

    it('should create event with authentication', async () => {
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          title: 'Docker Test Event',
          description: 'Testing event creation in Docker',
          eventDate: new Date().toISOString(),
          location: 'Docker City',
          hostPersonId: testPersonId,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/people');

      expect(response.status).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/people')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(response.status).toBe(401);
    });
  });

  describe('Soft Delete Functionality', () => {
    let testDeletePersonId: string;

    it('should soft delete person', async () => {
      const person = await prisma.person.create({
        data: {
          name: 'Soft Delete Test',
          displayName: 'SDT',
        },
      });
      testDeletePersonId = person.id;

      const response = await request(app)
        .delete(`/api/people/${testDeletePersonId}`)
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should not return soft deleted person in list', async () => {
      const response = await request(app)
        .get('/api/people')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);
      const deletedPerson = response.body.data.find(
        (p: any) => p.id === testDeletePersonId
      );
      expect(deletedPerson).toBeUndefined();
    });

    it('should not return soft deleted person by ID', async () => {
      const response = await request(app)
        .get(`/api/people/${testDeletePersonId}`)
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Database Migrations', () => {
    it('should have all required tables', async () => {
      const tables = (await prisma.$queryRaw`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name NOT LIKE 'pg_%'
        ORDER BY table_name;
      `) as Array<{ table_name: string }>;

      const tableNames = tables.map((t) => t.table_name);

      expect(tableNames).toContain('User');
      expect(tableNames).toContain('Person');
      expect(tableNames).toContain('Event');
      expect(tableNames).toContain('Contribution');
    });

    it('should have soft delete columns on all models', async () => {
      const columns = (await prisma.$queryRaw`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'Person' AND column_name = 'deleted_at';
      `) as Array<{ column_name: string }>;

      expect(columns).toHaveLength(1);
      expect(columns[0].column_name).toBe('deleted_at');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/people')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          // Missing required 'name' field
          displayName: 'Incomplete Data',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle 404 not found', async () => {
      const response = await request(app)
        .get('/api/people/nonexistent-id-12345')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
