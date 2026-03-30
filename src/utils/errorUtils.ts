import { Request, Response, NextFunction } from 'express';
import logger from './logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (err instanceof AppError) {
    logger.error(`[${err.statusCode}] ${err.message}`, { path: req.path, method: req.method });
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(isDevelopment && { stack: err.stack }),
    });
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    logger.error(`Database error: ${err.message}`, { path: req.path });
    return res.status(400).json({
      success: false,
      message: 'Database error occurred',
      ...(isDevelopment && { error: err.message }),
    });
  }

  // Handle validation errors
  if (err.name === 'ZodError') {
    logger.error(`Validation error: ${err.message}`, { path: req.path });
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      ...(isDevelopment && { error: err.message }),
    });
  }

  // Unknown error
  logger.error(`Unhandled error: ${err.message}`, { path: req.path, stack: err.stack });
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(isDevelopment && { error: err.message, stack: err.stack }),
  });
};

export const catchAsync = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};
