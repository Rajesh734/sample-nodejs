import { Request, Response, NextFunction } from 'express';

// Middleware to enforce soft delete filtering across all database queries
// This is a marker middleware - actual filtering happens in service layer via Prisma

export const softDeleteFilter = (req: Request, _res: Response, next: NextFunction) => {
  // Store a flag in the request to indicate soft delete filtering is enabled
  (req as any).softDeleteEnabled = true;
  next();
};

// Helper function for services to check if soft delete filtering is enabled
export const shouldFilterDeleted = (req?: any): boolean => {
  return req?.softDeleteEnabled ?? true;
};
