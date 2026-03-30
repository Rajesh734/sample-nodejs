import { Router } from 'express';
import * as peopleController from '../controllers/peopleController';
import * as eventsController from '../controllers/eventsController';
import * as contributionsController from '../controllers/contributionsController';
import * as itemsController from '../controllers/itemsController';
import * as healthController from '../controllers/healthController';
import { authMiddleware } from '../middlewares/authMiddleware';
import authRoutes from './auth';

const router = Router();

// Health checks (no auth required)
router.get('/health', healthController.healthCheck);
router.get('/health/ready', healthController.readiness);
router.get('/health/live', healthController.liveness);

// Auth routes (no auth required)
router.use('/auth', authRoutes);

// All other routes require authentication
router.use(authMiddleware);

// People routes
router.post('/people', peopleController.createPerson);
router.get('/people', peopleController.getPeople);
router.get('/people/:id', peopleController.getPersonById);
router.put('/people/:id', peopleController.updatePerson);
router.delete('/people/:id', peopleController.deletePerson);
router.get('/people/:id/balance', peopleController.getPersonBalance);
router.get('/balances/all', peopleController.getAllBalances);

// Events routes
router.post('/events', eventsController.createEvent);
router.get('/events', eventsController.getEvents);
router.get('/events/:id', eventsController.getEventById);
router.put('/events/:id', eventsController.updateEvent);
router.delete('/events/:id', eventsController.deleteEvent);

// Contributions routes
router.post('/contributions', contributionsController.createContribution);
router.get('/contributions', contributionsController.getContributions);
router.get('/contributions/:id', contributionsController.getContributionById);
router.get('/contributions/person/:personId', contributionsController.getPersonContributions);
router.put('/contributions/:id', contributionsController.updateContribution);
router.delete('/contributions/:id', contributionsController.deleteContribution);

// Items autocomplete
router.get('/items/suggestions', itemsController.getItemSuggestions);

export default router;
