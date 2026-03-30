import { Request, Response } from 'express';
import { itemsService } from '../services/itemsService';
import { catchAsync } from '../utils/errorUtils';

export const getItemSuggestions = catchAsync(async (_req: Request, res: Response) => {
  const items = await itemsService.getItemSuggestions();
  res.status(200).json({
    success: true,
    data: items,
  });
});
