import { z } from 'zod';
import { UUIDSchema, DateSchema, EmailSchema } from './schemas/common';

export const CreatePersonSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  displayName: z.string().max(255).optional().nullable(),
  fatherName: z.string().max(255).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  homeTown: z.string().max(255).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const UpdatePersonSchema = CreatePersonSchema.partial();

export const CreateEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional().nullable(),
  eventDate: DateSchema,
  location: z.string().max(255).optional().nullable(),
  hostPersonId: UUIDSchema,
});

export const UpdateEventSchema = CreateEventSchema.partial();

export const CreateContributionSchema = z.object({
  eventId: UUIDSchema,
  fromPersonId: UUIDSchema,
  toPersonId: UUIDSchema,
  type: z.enum(['GAVE', 'RECEIVED']),
  mode: z.enum(['CASH', 'GOLD', 'SILVER', 'ITEM']),
  amount: z.number().positive().optional().nullable(),
  currencyCode: z.string().length(3).optional().nullable(),
  itemType: z.string().optional().nullable(),
  itemQuantity: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
  contributionDate: DateSchema.optional(),
}).refine(
  (data) => {
    if (data.mode === 'CASH') {
      return data.amount !== null && data.amount !== undefined && data.currencyCode !== null && data.currencyCode !== undefined;
    }
    if (data.mode === 'GOLD' || data.mode === 'SILVER') {
      return data.itemQuantity !== null && data.itemQuantity !== undefined && data.amount === null && data.amount === undefined;
    }
    if (data.mode === 'ITEM') {
      return data.itemType && data.itemQuantity !== null && data.itemQuantity !== undefined && data.amount === null && data.amount === undefined;
    }
    return true;
  },
  {
    message: 'Invalid contribution data for the selected mode',
    path: [],
  }
);

export const UpdateContributionSchema = z.object({
  eventId: z.string().uuid().optional(),
  fromPersonId: z.string().uuid().optional(),
  toPersonId: z.string().uuid().optional(),
  type: z.enum(['GAVE', 'RECEIVED']).optional(),
  mode: z.enum(['CASH', 'GOLD', 'SILVER', 'ITEM']).optional(),
  amount: z.number().positive().optional(),
  currencyCode: z.string().length(3).optional(),
  itemType: z.string().optional(),
  itemQuantity: z.number().int().positive().optional(),
  notes: z.string().optional(),
  contributionDate: z.string().datetime().optional(),
}).refine(
  (data) => {
    if (!data.mode) return true;
    if (data.mode === 'CASH') {
      return data.amount !== null && data.amount !== undefined && data.currencyCode !== null && data.currencyCode !== undefined;
    }
    if (data.mode === 'GOLD' || data.mode === 'SILVER') {
      return data.itemQuantity !== null && data.itemQuantity !== undefined && data.amount === null && data.amount === undefined;
    }
    if (data.mode === 'ITEM') {
      return data.itemType && data.itemQuantity !== null && data.itemQuantity !== undefined && data.amount === null && data.amount === undefined;
    }
    return true;
  },
  {
    message: 'Invalid contribution data for the selected mode',
    path: [],
  }
);

export const CreateUserSchema = z.object({
  email: EmailSchema,
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'USER']).default('USER'),
});

export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string(),
});

export type CreatePerson = z.infer<typeof CreatePersonSchema>;
export type UpdatePerson = z.infer<typeof UpdatePersonSchema>;
export type CreateEvent = z.infer<typeof CreateEventSchema>;
export type UpdateEvent = z.infer<typeof UpdateEventSchema>;
export type CreateContribution = z.infer<typeof CreateContributionSchema>;
export type UpdateContribution = z.infer<typeof UpdateContributionSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type LoginCredentials = z.infer<typeof LoginSchema>;
