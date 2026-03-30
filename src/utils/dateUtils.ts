import { Request, Response, NextFunction } from 'express';
import logger from './logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    logger[level](
      `${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`,
      {
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        duration,
      }
    );
  });

  next();
};
