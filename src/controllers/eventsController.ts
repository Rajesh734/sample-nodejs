import { Request, Response } from 'express';
import { eventsService } from '../services/eventsService';
import { CreateEventSchema, UpdateEventSchema } from '../validators/peopleValidator';
import { catchAsync } from '../utils/errorUtils';

export const createEvent = catchAsync(async (req: Request, res: Response) => {
  const data = CreateEventSchema.parse(req.body);
  const event = await eventsService.createEvent(data);
  res.status(201).json({
    success: true,
    message: 'Event created successfully',
    data: event,
  });
});

export const getEvents = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  const result = await eventsService.getEvents(page, limit);
  res.status(200).json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
});

export const getEventById = catchAsync(async (req: Request, res: Response) => {
  const event = await eventsService.getEventById(req.params.id as string);
  res.status(200).json({
    success: true,
    data: event,
  });
});

export const updateEvent = catchAsync(async (req: Request, res: Response) => {
  const data = UpdateEventSchema.parse(req.body);
  const event = await eventsService.updateEvent(req.params.id as string, data);
  res.status(200).json({
    success: true,
    message: 'Event updated successfully',
    data: event,
  });
});

export const deleteEvent = catchAsync(async (req: Request, res: Response) => {
  const event = await eventsService.deleteEvent(req.params.id as string);
  res.status(200).json({
    success: true,
    message: 'Event deleted successfully',
    data: event,
  });
});
