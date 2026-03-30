import { Request, Response } from 'express';
import { peopleService } from '../services/peopleService';
import { balanceService } from '../services/balanceService';
import { CreatePersonSchema, UpdatePersonSchema } from '../validators/peopleValidator';
import { catchAsync } from '../utils/errorUtils';

export const createPerson = catchAsync(async (req: Request, res: Response) => {
  const data = CreatePersonSchema.parse(req.body);
  const person = await peopleService.createPerson(data);
  res.status(201).json({
    success: true,
    message: 'Person created successfully',
    data: person,
  });
});

export const getPeople = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  const result = await peopleService.getPeople(page, limit);
  res.status(200).json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
});

export const getPersonById = catchAsync(async (req: Request, res: Response) => {
  const person = await peopleService.getPersonById(req.params.id as string);
  res.status(200).json({
    success: true,
    data: person,
  });
});

export const updatePerson = catchAsync(async (req: Request, res: Response) => {
  const data = UpdatePersonSchema.parse(req.body);
  const person = await peopleService.updatePerson(req.params.id as string, data);
  res.status(200).json({
    success: true,
    message: 'Person updated successfully',
    data: person,
  });
});

export const deletePerson = catchAsync(async (req: Request, res: Response) => {
  const person = await peopleService.deletePerson(req.params.id as string);
  res.status(200).json({
    success: true,
    message: 'Person deleted successfully',
    data: person,
  });
});

export const getPersonBalance = catchAsync(async (req: Request, res: Response) => {
  const balance = await balanceService.getPersonBalance(req.params.id as string);
  res.status(200).json({
    success: true,
    data: balance,
  });
});

export const getAllBalances = catchAsync(async (_req: Request, res: Response) => {
  const balances = await balanceService.getAllPersonBalances();
  res.status(200).json({
    success: true,
    data: balances,
  });
});
