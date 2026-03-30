import { Request, Response } from 'express';
import { contributionsService } from '../services/contributionsService';
import { CreateContributionSchema, UpdateContributionSchema } from '../validators/peopleValidator';
import { catchAsync } from '../utils/errorUtils';

export const createContribution = catchAsync(async (req: Request, res: Response) => {
  const data = CreateContributionSchema.parse(req.body);
  const contribution = await contributionsService.createContribution(data);
  res.status(201).json({
    success: true,
    message: 'Contribution created successfully',
    data: contribution,
  });
});

export const getContributions = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  const result = await contributionsService.getContributions(page, limit);
  res.status(200).json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
});

export const getContributionById = catchAsync(async (req: Request, res: Response) => {
  const contribution = await contributionsService.getContributionById(req.params.id as string);
  res.status(200).json({
    success: true,
    data: contribution,
  });
});

export const getPersonContributions = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  const result = await contributionsService.getPersonContributions(req.params.personId as string, page, limit);
  res.status(200).json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
});

export const updateContribution = catchAsync(async (req: Request, res: Response) => {
  const data = UpdateContributionSchema.parse(req.body);
  const contribution = await contributionsService.updateContribution(req.params.id as string, data);
  res.status(200).json({
    success: true,
    message: 'Contribution updated successfully',
    data: contribution,
  });
});

export const deleteContribution = catchAsync(async (req: Request, res: Response) => {
  const contribution = await contributionsService.deleteContribution(req.params.id as string);
  res.status(200).json({
    success: true,
    message: 'Contribution deleted successfully',
    data: contribution,
  });
});
