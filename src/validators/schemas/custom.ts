import { z } from 'zod';

// Custom validation for contribution mode/amount rules
export const ContributionModeSchema = z.enum(['CASH', 'GOLD', 'SILVER', 'ITEM']);
export const ContributionTypeSchema = z.enum(['GAVE', 'RECEIVED']);

export const CashContributionSchema = z.object({
  mode: z.literal('CASH'),
  amount: z.number().positive('Amount must be positive'),
  currencyCode: z.string().length(3, 'Currency code must be 3 letters (ISO 4217)'),
  itemType: z.never().optional(),
  itemQuantity: z.never().optional(),
});

export const GoldSilverContributionSchema = z.object({
  mode: z.enum(['GOLD', 'SILVER']),
  itemQuantity: z.number().int().positive('Quantity must be positive'),
  amount: z.never().optional(),
  currencyCode: z.never().optional(),
  itemType: z.never().optional(),
});

export const ItemContributionSchema = z.object({
  mode: z.literal('ITEM'),
  itemType: z.string().min(1, 'Item type is required'),
  itemQuantity: z.number().int().positive('Quantity must be positive'),
  amount: z.never().optional(),
  currencyCode: z.never().optional(),
});

export const ContributionDataSchema = z.discriminatedUnion('mode', [
  CashContributionSchema,
  GoldSilverContributionSchema,
  ItemContributionSchema,
]);

export type ContributionData = z.infer<typeof ContributionDataSchema>;
