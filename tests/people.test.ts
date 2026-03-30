import { getPrismaClient } from '../src/utils/dbConnection';
import { cleanupDatabase, authenticatedRequest, userToken } from './helpers';

const prisma = getPrismaClient();

describe('People Endpoints', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  describe('POST /api/people', () => {
    it('should create a new person', async () => {
      const response = await authenticatedRequest(userToken)
        .post('/api/people')
        .send({
          name: 'Ahmed Hassan',
          displayName: 'Ahmed',
          fatherName: 'Hassan',
          phone: '+123456789',
          homeTown: 'Cairo',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Ahmed Hassan');
    });

    it('should require name field', async () => {
      const response = await authenticatedRequest(userToken)
        .post('/api/people')
        .send({
          displayName: 'Ahmed',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject request without auth', async () => {
      const response = await authenticatedRequest('')
        .post('/api/people')
        .send({
          name: 'Ahmed Hassan',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/people', () => {
    beforeEach(async () => {
      await prisma.person.createMany({
        data: [
          { name: 'Person 1', displayName: 'P1' },
          { name: 'Person 2', displayName: 'P2' },
          { name: 'Person 3', displayName: 'P3' },
        ],
      });
    });

    it('should return paginated list of people', async () => {
      const response = await authenticatedRequest(userToken)
        .get('/api/people?page=1&limit=2');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.pagination.total).toBe(3);
    });

    it('should exclude soft-deleted people', async () => {
      const person = await prisma.person.findFirst();
      if (person) {
        await prisma.person.update({
          where: { id: person.id },
          data: { deletedAt: new Date() },
        });
      }

      const response = await authenticatedRequest(userToken)
        .get('/api/people');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
    });
  });

  describe('DELETE /api/people/:id', () => {
    it('should soft delete a person', async () => {
      const person = await prisma.person.create({
        data: { name: 'Test Person' },
      });

      const response = await authenticatedRequest(userToken)
        .delete(`/api/people/${person.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const deletedPerson = await prisma.person.findUnique({
        where: { id: person.id },
      });
      expect(deletedPerson?.deletedAt).not.toBeNull();
    });

    it('should return 404 for non-existent person', async () => {
      const response = await authenticatedRequest(userToken)
        .delete('/api/people/00000000-0000-0000-0000-000000000000');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/people/:id/balance', () => {
    it('should return person balance', async () => {
      const person = await prisma.person.create({
        data: { name: 'Balance Test' },
      });

      const response = await authenticatedRequest(userToken)
        .get(`/api/people/${person.id}/balance`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.personId).toBe(person.id);
      expect(response.body.data.balance).toBe(0);
    });
  });
});
