import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.enum(['ADMIN', 'STAFF', 'USER']).default('USER'),
});

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  role: z.enum(['ADMIN', 'STAFF', 'USER']).optional(),
  isActive: z.boolean().optional(),
});

export const getUsersQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default(1),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default(10),
  search: z.string().optional(),
  role: z.enum(['ADMIN', 'STAFF', 'USER']).optional(),
});

export type CreateUserRequest = z.infer<typeof createUserSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserSchema>;
export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>;
