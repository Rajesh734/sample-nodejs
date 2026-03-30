import { Request, Response, NextFunction } from 'express';
import { verifyToken, DecodedToken } from '../utils/authUtils';
import { AppError } from '../utils/errorUtils';

declare global {
  namespace Express {
    interface Request {
      user?: DecodedToken;
    }
  }
}

export const authMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    next(new AppError(401, 'Invalid authentication token'));
  }
};

export const adminMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError(401, 'Authentication required'));
  }

  if (req.user.role !== 'ADMIN') {
    return next(new AppError(403, 'Admin access required'));
  }

  next();
};

export const optionalAuthMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      req.user = decoded;
    }
  } catch (error) {
    // Silently ignore invalid tokens for optional auth
  }

  next();
};
