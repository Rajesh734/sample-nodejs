import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Public routes (no auth required)
router.post('/google', authController.googleLogin);
router.post('/apple', authController.appleLogin);
router.post('/logout', authController.logout);

// Protected routes (auth required)
router.get('/verify', authMiddleware, authController.verifyToken);

export default router;
