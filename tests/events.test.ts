import { getPrismaClient } from '../src/utils/dbConnection';
import { cleanupDatabase, authenticatedRequest, userToken } from './helpers';

const prisma = getPrismaClient();

describe('Events Endpoints', () => {
  let hostPerson: any;

  beforeEach(async () => {
    await cleanupDatabase();
    hostPerson = await prisma.person.create({
      data: { name: 'Host Person' },
    });
  });

  describe('POST /api/events', () => {
    it('should create a new event', async () => {
      const response = await authenticatedRequest(userToken)
        .post('/api/events')
        .send({
          title: 'Family Wedding',
          description: 'Wedding celebration',
          eventDate: new Date('2024-06-15'),
          location: 'Cairo',
          hostPersonId: hostPerson.id,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Family Wedding');
    });

    it('should require title and hostPersonId', async () => {
      const response = await authenticatedRequest(userToken)
        .post('/api/events')
        .send({
          description: 'No title',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/events', () => {
    beforeEach(async () => {
      await prisma.event.createMany({
        data: [
          {
            title: 'Event 1',
            eventDate: new Date('2024-01-01'),
            hostPersonId: hostPerson.id,
          },
          {
            title: 'Event 2',
            eventDate: new Date('2024-02-01'),
            hostPersonId: hostPerson.id,
          },
        ],
      });
    });

    it('should return paginated events', async () => {
      const response = await authenticatedRequest(userToken)
        .get('/api/events?page=1&limit=10');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/events/:id', () => {
    it('should return event with contributions', async () => {
      const event = await prisma.event.create({
        data: {
          title: 'Test Event',
          eventDate: new Date(),
          hostPersonId: hostPerson.id,
        },
      });

      const response = await authenticatedRequest(userToken)
        .get(`/api/events/${event.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Test Event');
      expect(response.body.data.contributions).toBeDefined();
    });
  });

  describe('DELETE /api/events/:id', () => {
    it('should soft delete an event', async () => {
      const event = await prisma.event.create({
        data: {
          title: 'Delete Me',
          eventDate: new Date(),
          hostPersonId: hostPerson.id,
        },
      });

      const response = await authenticatedRequest(userToken)
        .delete(`/api/events/${event.id}`);

      expect(response.status).toBe(200);

      const deletedEvent = await prisma.event.findUnique({
        where: { id: event.id },
      });
      expect(deletedEvent?.deletedAt).not.toBeNull();
    });
  });
});
