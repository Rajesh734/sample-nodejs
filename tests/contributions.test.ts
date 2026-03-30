import { Decimal } from '@prisma/client/runtime/library';
import { getPrismaClient } from '../src/utils/dbConnection';
import { cleanupDatabase, authenticatedRequest, userToken } from './helpers';

const prisma = getPrismaClient();

describe('Contributions Endpoints', () => {
  let fromPerson: any;
  let toPerson: any;
  let event: any;

  beforeEach(async () => {
    await cleanupDatabase();
    
    fromPerson = await prisma.person.create({
      data: { name: 'From Person' },
    });
    
    toPerson = await prisma.person.create({
      data: { name: 'To Person' },
    });

    const hostPerson = await prisma.person.create({
      data: { name: 'Host Person' },
    });

    event = await prisma.event.create({
      data: {
        title: 'Test Event',
        eventDate: new Date(),
        hostPersonId: hostPerson.id,
      },
    });
  });

  describe('POST /api/contributions - CASH mode', () => {
    it('should create CASH contribution', async () => {
      const response = await authenticatedRequest(userToken)
        .post('/api/contributions')
        .send({
          eventId: event.id,
          fromPersonId: fromPerson.id,
          toPersonId: toPerson.id,
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
          eventId: event.id,
          fromPersonId: fromPerson.id,
          toPersonId: toPerson.id,
          type: 'GAVE',
          mode: 'CASH',
          currencyCode: 'EGP',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/contributions - GOLD/SILVER mode', () => {
    it('should create GOLD contribution', async () => {
      const response = await authenticatedRequest(userToken)
        .post('/api/contributions')
        .send({
          eventId: event.id,
          fromPersonId: fromPerson.id,
          toPersonId: toPerson.id,
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
          eventId: event.id,
          fromPersonId: fromPerson.id,
          toPersonId: toPerson.id,
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
      const response = await authenticatedRequest(userToken)
        .post('/api/contributions')
        .send({
          eventId: event.id,
          fromPersonId: fromPerson.id,
          toPersonId: toPerson.id,
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
          eventId: event.id,
          fromPersonId: fromPerson.id,
          toPersonId: toPerson.id,
          type: 'GAVE',
          mode: 'ITEM',
          itemQuantity: 1,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/contributions', () => {
    beforeEach(async () => {
      await prisma.contribution.create({
        data: {
          eventId: event.id,
          fromPersonId: fromPerson.id,
          toPersonId: toPerson.id,
          type: 'GAVE',
          mode: 'CASH',
          amount: new Decimal('500'),
          currencyCode: 'EGP',
        },
      });
    });

    it('should list contributions', async () => {
      const response = await authenticatedRequest(userToken)
        .get('/api/contributions');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/contributions/person/:personId', () => {
    it('should return person contributions', async () => {
      await prisma.contribution.create({
        data: {
          eventId: event.id,
          fromPersonId: fromPerson.id,
          toPersonId: toPerson.id,
          type: 'GAVE',
          mode: 'CASH',
          amount: new Decimal('500'),
          currencyCode: 'EGP',
        },
      });

      const response = await authenticatedRequest(userToken)
        .get(`/api/contributions/person/${fromPerson.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });
});
