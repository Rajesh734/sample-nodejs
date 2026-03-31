jest.mock('../src/utils/dbConnection');

import { getPrismaClient } from '../src/utils/dbConnection';
import { authenticatedRequest, userToken } from './helpers';

const db = getPrismaClient() as any;

const PERSON_ID = 'b0000000-0000-4000-8000-000000000001';
const EVENT_ID = 'c0000000-0000-4000-8000-000000000001';

const mockPerson = {
  id: PERSON_ID,
  name: 'Host Person',
  displayName: null,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockEvent = {
  id: EVENT_ID,
  title: 'Family Wedding',
  description: 'Wedding celebration',
  eventDate: new Date('2024-06-15'),
  location: 'Cairo',
  hostPersonId: PERSON_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  hostPerson: mockPerson,
  contributions: [],
};

describe('Events Endpoints', () => {
  describe('POST /api/events', () => {
    it('should create a new event', async () => {
      db.person.findUnique.mockResolvedValue(mockPerson);
      db.event.create.mockResolvedValue(mockEvent);

      const response = await authenticatedRequest(userToken)
        .post('/api/events')
        .send({
          title: 'Family Wedding',
          description: 'Wedding celebration',
          eventDate: new Date('2024-06-15').toISOString(),
          location: 'Cairo',
          hostPersonId: PERSON_ID,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Family Wedding');
    });

    it('should require title and hostPersonId', async () => {
      const response = await authenticatedRequest(userToken)
        .post('/api/events')
        .send({ description: 'No title' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/events', () => {
    it('should return paginated events', async () => {
      const events = [
        { ...mockEvent, id: 'e1', title: 'Event 1' },
        { ...mockEvent, id: 'e2', title: 'Event 2' },
      ];
      db.event.findMany.mockResolvedValue(events);
      db.event.count.mockResolvedValue(2);

      const response = await authenticatedRequest(userToken)
        .get('/api/events?page=1&limit=10');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/events/:id', () => {
    it('should return event with contributions', async () => {
      db.event.findUnique.mockResolvedValue(mockEvent);

      const response = await authenticatedRequest(userToken)
        .get(`/api/events/${EVENT_ID}`);

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Family Wedding');
      expect(response.body.data.contributions).toBeDefined();
    });

    it('should return 404 for non-existent event', async () => {
      db.event.findUnique.mockResolvedValue(null);

      const response = await authenticatedRequest(userToken)
        .get(`/api/events/${EVENT_ID}`);

      expect(response.status).toBe(404);
    });

    it('should return 404 for soft-deleted event', async () => {
      db.event.findUnique.mockResolvedValue({ ...mockEvent, deletedAt: new Date() });

      const response = await authenticatedRequest(userToken)
        .get(`/api/events/${EVENT_ID}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/events - validation', () => {
    it('should return 404 when host person does not exist', async () => {
      db.person.findUnique.mockResolvedValue(null);

      const response = await authenticatedRequest(userToken)
        .post('/api/events')
        .send({
          title: 'New Event',
          eventDate: new Date('2024-06-15').toISOString(),
          hostPersonId: PERSON_ID,
        });

      expect(response.status).toBe(404);
    });

    it('should return 404 when host person is soft-deleted', async () => {
      db.person.findUnique.mockResolvedValue({ ...mockPerson, deletedAt: new Date() });

      const response = await authenticatedRequest(userToken)
        .post('/api/events')
        .send({
          title: 'New Event',
          eventDate: new Date('2024-06-15').toISOString(),
          hostPersonId: PERSON_ID,
        });

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/events/:id', () => {
    it('should update an event', async () => {
      const updatedEvent = { ...mockEvent, title: 'Updated Wedding' };
      db.event.findUnique.mockResolvedValue(mockEvent);
      db.event.update.mockResolvedValue(updatedEvent);

      const response = await authenticatedRequest(userToken)
        .put(`/api/events/${EVENT_ID}`)
        .send({ title: 'Updated Wedding' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 when updating non-existent event', async () => {
      db.event.findUnique.mockResolvedValue(null);

      const response = await authenticatedRequest(userToken)
        .put(`/api/events/${EVENT_ID}`)
        .send({ title: 'Updated Wedding' });

      expect(response.status).toBe(404);
    });

    it('should update event with new host person', async () => {
      const newHostId = 'b0000000-0000-4000-8000-000000000002';
      const newHost = { ...mockPerson, id: newHostId };
      const updatedEvent = { ...mockEvent, hostPersonId: newHostId };

      db.event.findUnique.mockResolvedValue(mockEvent);
      db.person.findUnique.mockResolvedValue(newHost);
      db.event.update.mockResolvedValue(updatedEvent);

      const response = await authenticatedRequest(userToken)
        .put(`/api/events/${EVENT_ID}`)
        .send({ hostPersonId: newHostId });

      expect(response.status).toBe(200);
    });

    it('should return 404 when new host person does not exist', async () => {
      const newHostId = 'b0000000-0000-4000-8000-000000000002';
      db.event.findUnique.mockResolvedValue(mockEvent);
      db.person.findUnique.mockResolvedValue(null);

      const response = await authenticatedRequest(userToken)
        .put(`/api/events/${EVENT_ID}`)
        .send({ hostPersonId: newHostId });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/events/:id', () => {
    it('should soft delete an event', async () => {
      const deletedEvent = { ...mockEvent, deletedAt: new Date() };
      db.event.findUnique.mockResolvedValue(mockEvent);
      db.event.update.mockResolvedValue(deletedEvent);

      const response = await authenticatedRequest(userToken)
        .delete(`/api/events/${EVENT_ID}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

});
