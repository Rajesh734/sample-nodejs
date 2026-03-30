import { z } from 'zod';

export const UUIDSchema = z.string().uuid('Invalid UUID format');
export const EmailSchema = z.string().email('Invalid email format');
export const DateSchema = z.string().datetime().or(z.date());

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type Pagination = z.infer<typeof PaginationSchema>;
