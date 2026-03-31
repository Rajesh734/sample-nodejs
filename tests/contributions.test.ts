jest.mock('../src/utils/dbConnection');

import { getPrismaClient } from '../src/utils/dbConnection';
import { authenticatedRequest, userToken } from './helpers';

const db = getPrismaClient() as any;

const FROM_ID = 'd0000000-0000-4000-8000-000000000001';
const TO_ID = 'd0000000-0000-4000-8000-000000000002';
const EVENT_ID = 'e0000000-0000-4000-8000-000000000001';

const mockFromPerson = { id: FROM_ID, name: 'From Person', deletedAt: null };
const mockToPerson = { id: TO_ID, name: 'To Person', deletedAt: null };
const mockEvent = { id: EVENT_ID, title: 'Test Event', deletedAt: null };

const buildContribution = (overrides: Record<string, unknown> = {}) => ({
  id: 'contrib-0000-0000-0000-000000000001',
  eventId: EVENT_ID,
  fromPersonId: FROM_ID,
  toPersonId: TO_ID,
  type: 'GAVE',
  mode: 'CASH',
  amount: '500.00',
  currencyCode: 'EGP',
  itemType: null,
  itemQuantity: null,
  notes: null,
  contributionDate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  event: mockEvent,
  fromPerson: mockFromPerson,
  toPerson: mockToPerson,
  ...overrides,
});

describe('Contributions Endpoints', () => {
  /** Set up common mock DB responses for all tests that need existing FK records */
  const setupFkMocks = () => {
    db.event.findUnique.mockResolvedValue(mockEvent);
    db.person.findUnique
      .mockResolvedValueOnce(mockFromPerson)
      .mockResolvedValueOnce(mockToPerson);
  };

  describe('POST /api/contributions - CASH mode', () => {
    it('should create CASH contribution', async () => {
      setupFkMocks();
      const contribution = buildContribution({ mode: 'CASH' });
      db.contribution.create.mockResolvedValue(contribution);

      const response = await authenticatedRequest(userToken)
        .post('/api/contributions')
        .send({
          eventId: EVENT_ID,
          fromPersonId: FROM_ID,
          toPersonId: TO_ID,
          type: 'GAVE',
          mode: 'CASH',
          amount: 500,
          currencyCode: 'EGP',
          notes: 'Wedding gift',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.mode).toBe('CASH');
      expect(response.body.data.amount).toBeDefined();
    });

    it('should reject CASH without amount', async () => {
      const response = await authenticatedRequest(userToken)
        .post('/api/contributions')
        .send({
          eventId: EVENT_ID,
          fromPersonId: FROM_ID,
          toPersonId: TO_ID,
          type: 'GAVE',
          mode: 'CASH',
          currencyCode: 'EGP',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/contributions - GOLD/SILVER mode', () => {
    it('should create GOLD contribution', async () => {
      setupFkMocks();
      const contribution = buildContribution({ mode: 'GOLD', amount: null, currencyCode: null, itemQuantity: 25 });
      db.contribution.create.mockResolvedValue(contribution);

      const response = await authenticatedRequest(userToken)
        .post('/api/contributions')
        .send({
          eventId: EVENT_ID,
          fromPersonId: FROM_ID,
          toPersonId: TO_ID,
          type: 'GAVE',
          mode: 'GOLD',
          itemQuantity: 25,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.mode).toBe('GOLD');
      expect(response.body.data.itemQuantity).toBe(25);
    });

    it('should reject GOLD with amount', async () => {
      const response = await authenticatedRequest(userToken)
        .post('/api/contributions')
        .send({
          eventId: EVENT_ID,
          fromPersonId: FROM_ID,
          toPersonId: TO_ID,
          type: 'GAVE',
          mode: 'GOLD',
          itemQuantity: 25,
          amount: 500,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/contributions - ITEM mode', () => {
    it('should create ITEM contribution', async () => {
      setupFkMocks();
      const contribution = buildContribution({ mode: 'ITEM', amount: null, currencyCode: null, itemType: 'China Set', itemQuantity: 1 });
      db.contribution.create.mockResolvedValue(contribution);

      const response = await authenticatedRequest(userToken)
        .post('/api/contributions')
        .send({
          eventId: EVENT_ID,
          fromPersonId: FROM_ID,
          toPersonId: TO_ID,
          type: 'GAVE',
          mode: 'ITEM',
          itemType: 'China Set',
          itemQuantity: 1,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.mode).toBe('ITEM');
      expect(response.body.data.itemType).toBe('China Set');
    });

    it('should reject ITEM without itemType', async () => {
      const response = await authenticatedRequest(userToken)
        .post('/api/contributions')
        .send({
          eventId: EVENT_ID,
          fromPersonId: FROM_ID,
          toPersonId: TO_ID,
          type: 'GAVE',
          mode: 'ITEM',
          itemQuantity: 1,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/contributions', () => {
    it('should list contributions', async () => {
      db.contribution.findMany.mockResolvedValue([buildContribution()]);
      db.contribution.count.mockResolvedValue(1);

      const response = await authenticatedRequest(userToken)
        .get('/api/contributions');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/contributions/:id', () => {
    it('should return contribution by id', async () => {
      const contribution = buildContribution();
      db.contribution.findUnique.mockResolvedValue(contribution);

      const response = await authenticatedRequest(userToken)
        .get('/api/contributions/f0000000-0000-4000-8000-000000000001');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent contribution', async () => {
      db.contribution.findUnique.mockResolvedValue(null);

      const response = await authenticatedRequest(userToken)
        .get('/api/contributions/f0000000-0000-4000-8000-000000000001');

      expect(response.status).toBe(404);
    });

    it('should return 404 for soft-deleted contribution', async () => {
      db.contribution.findUnique.mockResolvedValue(buildContribution({ deletedAt: new Date() }));

      const response = await authenticatedRequest(userToken)
        .get('/api/contributions/f0000000-0000-4000-8000-000000000001');

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/contributions/:id', () => {
    it('should update a CASH contribution', async () => {
      const existing = buildContribution({ mode: 'CASH' });
      const updated = buildContribution({ mode: 'CASH', amount: '750.00' });
      db.contribution.findUnique.mockResolvedValue(existing);
      db.contribution.update.mockResolvedValue(updated);

      const response = await authenticatedRequest(userToken)
        .put('/api/contributions/f0000000-0000-4000-8000-000000000001')
        .send({ amount: 750, currencyCode: 'EGP', mode: 'CASH', type: 'GAVE' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 when updating non-existent contribution', async () => {
      db.contribution.findUnique.mockResolvedValue(null);

      const response = await authenticatedRequest(userToken)
        .put('/api/contributions/f0000000-0000-4000-8000-000000000001')
        .send({ notes: 'Updated note' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/contributions/:id', () => {
    it('should soft delete a contribution', async () => {
      const existing = buildContribution();
      const deleted = buildContribution({ deletedAt: new Date() });
      db.contribution.findUnique.mockResolvedValue(existing);
      db.contribution.update.mockResolvedValue(deleted);

      const response = await authenticatedRequest(userToken)
        .delete('/api/contributions/f0000000-0000-4000-8000-000000000001');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 when deleting non-existent contribution', async () => {
      db.contribution.findUnique.mockResolvedValue(null);

      const response = await authenticatedRequest(userToken)
        .delete('/api/contributions/f0000000-0000-4000-8000-000000000001');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/contributions/person/:personId', () => {
    it('should return person contributions', async () => {
      db.person.findUnique.mockResolvedValue(mockFromPerson);
      db.contribution.findMany.mockResolvedValue([buildContribution()]);
      db.contribution.count.mockResolvedValue(1);

      const response = await authenticatedRequest(userToken)
        .get(`/api/contributions/person/${FROM_ID}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/contributions/person/:personId - error case', () => {
    it('should return 404 when person does not exist', async () => {
      db.person.findUnique.mockResolvedValue(null);

      const response = await authenticatedRequest(userToken)
        .get(`/api/contributions/person/${FROM_ID}`);

      expect(response.status).toBe(404);
    });
  });
});
