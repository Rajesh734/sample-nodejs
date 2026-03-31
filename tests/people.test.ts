jest.mock('../src/utils/dbConnection');

import { getPrismaClient } from '../src/utils/dbConnection';
import { authenticatedRequest, userToken } from './helpers';

const db = getPrismaClient() as any;

const PERSON_ID = 'a0000000-0000-4000-8000-000000000001';

const mockPerson = {
  id: PERSON_ID,
  name: 'Ahmed Hassan',
  displayName: 'Ahmed',
  fatherName: 'Hassan',
  phone: '+123456789',
  homeTown: 'Cairo',
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  hostedEvents: [],
  contributionsFrom: [],
  contributionsTo: [],
};

describe('People Endpoints', () => {
  describe('POST /api/people', () => {
    it('should create a new person', async () => {
      db.person.create.mockResolvedValue(mockPerson);

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
        .send({ displayName: 'Ahmed' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject request without auth', async () => {
      const response = await authenticatedRequest('')
        .post('/api/people')
        .send({ name: 'Ahmed Hassan' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/people', () => {
    it('should return paginated list of people', async () => {
      const people = [
        { ...mockPerson, id: 'p1', name: 'Person 1', displayName: 'P1' },
        { ...mockPerson, id: 'p2', name: 'Person 2', displayName: 'P2' },
      ];
      db.person.findMany.mockResolvedValue(people);
      db.person.count.mockResolvedValue(3);

      const response = await authenticatedRequest(userToken)
        .get('/api/people?page=1&limit=2');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.pagination.total).toBe(3);
    });

    it('should exclude soft-deleted people', async () => {
      const people = [
        { ...mockPerson, id: 'p1', name: 'Person 1' },
        { ...mockPerson, id: 'p2', name: 'Person 2' },
      ];
      db.person.findMany.mockResolvedValue(people);
      db.person.count.mockResolvedValue(2);

      const response = await authenticatedRequest(userToken)
        .get('/api/people');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
    });
  });

  describe('DELETE /api/people/:id', () => {
    it('should soft delete a person', async () => {
      const deletedPerson = { ...mockPerson, deletedAt: new Date() };
      db.person.findUnique.mockResolvedValue(mockPerson);
      db.person.update.mockResolvedValue(deletedPerson);

      const response = await authenticatedRequest(userToken)
        .delete(`/api/people/${PERSON_ID}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent person', async () => {
      db.person.findUnique.mockResolvedValue(null);

      const response = await authenticatedRequest(userToken)
        .delete('/api/people/00000000-0000-0000-0000-000000000000');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/people/:id', () => {
    it('should return person by id', async () => {
      db.person.findUnique.mockResolvedValue(mockPerson);

      const response = await authenticatedRequest(userToken)
        .get(`/api/people/${PERSON_ID}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(PERSON_ID);
    });

    it('should return 404 for non-existent person', async () => {
      db.person.findUnique.mockResolvedValue(null);

      const response = await authenticatedRequest(userToken)
        .get(`/api/people/${PERSON_ID}`);

      expect(response.status).toBe(404);
    });

    it('should return 404 for soft-deleted person', async () => {
      db.person.findUnique.mockResolvedValue({ ...mockPerson, deletedAt: new Date() });

      const response = await authenticatedRequest(userToken)
        .get(`/api/people/${PERSON_ID}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/people/:id', () => {
    it('should update a person', async () => {
      const updatedPerson = { ...mockPerson, displayName: 'Ahmed Updated' };
      db.person.findUnique.mockResolvedValue(mockPerson);
      db.person.update.mockResolvedValue(updatedPerson);

      const response = await authenticatedRequest(userToken)
        .put(`/api/people/${PERSON_ID}`)
        .send({ displayName: 'Ahmed Updated' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 when updating non-existent person', async () => {
      db.person.findUnique.mockResolvedValue(null);

      const response = await authenticatedRequest(userToken)
        .put(`/api/people/${PERSON_ID}`)
        .send({ displayName: 'New Name' });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/people/:id/balance', () => {
    it('should return person balance of zero with no contributions', async () => {
      db.person.findUnique.mockResolvedValue(mockPerson);
      db.contribution.findMany.mockResolvedValue([]);

      const response = await authenticatedRequest(userToken)
        .get(`/api/people/${PERSON_ID}/balance`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.personId).toBe(PERSON_ID);
      expect(response.body.data.balance).toBe(0);
    });

    it('should calculate positive balance from RECEIVED contributions', async () => {
      db.person.findUnique.mockResolvedValue(mockPerson);
      db.contribution.findMany.mockResolvedValue([
        { toPersonId: PERSON_ID, fromPersonId: 'other', type: 'RECEIVED', amount: '500.00', mode: 'CASH' },
        { toPersonId: PERSON_ID, fromPersonId: 'other', type: 'RECEIVED', amount: '300.00', mode: 'CASH' },
      ]);

      const response = await authenticatedRequest(userToken)
        .get(`/api/people/${PERSON_ID}/balance`);

      expect(response.status).toBe(200);
      expect(response.body.data.balance).toBe(800);
    });

    it('should calculate negative balance from GAVE contributions', async () => {
      db.person.findUnique.mockResolvedValue(mockPerson);
      db.contribution.findMany.mockResolvedValue([
        { fromPersonId: PERSON_ID, toPersonId: 'other', type: 'GAVE', amount: '200.00', mode: 'CASH' },
      ]);

      const response = await authenticatedRequest(userToken)
        .get(`/api/people/${PERSON_ID}/balance`);

      expect(response.status).toBe(200);
      expect(response.body.data.balance).toBe(-200);
    });

    it('should return 404 for non-existent person balance', async () => {
      db.person.findUnique.mockResolvedValue(null);

      const response = await authenticatedRequest(userToken)
        .get(`/api/people/${PERSON_ID}/balance`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/balances/all', () => {
    it('should return all person balances', async () => {
      db.person.findMany.mockResolvedValue([
        { id: PERSON_ID, name: 'Ahmed Hassan' },
      ]);
      // getPersonBalance calls person.findUnique then contribution.findMany
      db.person.findUnique.mockResolvedValue(mockPerson);
      db.contribution.findMany.mockResolvedValue([]);

      const response = await authenticatedRequest(userToken)
        .get('/api/balances/all');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
