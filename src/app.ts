import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import { errorHandler } from './utils/errorUtils';
import { requestLogger } from './utils/dateUtils';
import { softDeleteFilter } from './middlewares/softDeleteFilter';

dotenv.config();

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Soft delete filter marker
app.use(softDeleteFilter);

// Routes
app.use('/api', routes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
