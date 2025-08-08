import { z } from 'zod';

export const createMeetingRoomSchema = z.object({
  name: z.string().min(1, 'Room name is required').trim(),
  description: z.string().optional(),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  tables: z.number().min(0).default(1),
  ac: z.number().min(0).default(1),
  washroom: z.number().min(0).default(1),
  podium: z.boolean().default(false),
  soundSystem: z.boolean().default(false),
  projector: z.boolean().default(false),
  monitors: z.number().min(0).default(0),
  tvs: z.number().min(0).default(0),
  ethernet: z.boolean().default(true),
  wifi: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

export const updateMeetingRoomSchema = z.object({
  name: z.string().min(1, 'Room name is required').trim().optional(),
  description: z.string().optional(),
  capacity: z.number().min(1, 'Capacity must be at least 1').optional(),
  tables: z.number().min(0).optional(),
  ac: z.number().min(0).optional(),
  washroom: z.number().min(0).optional(),
  podium: z.boolean().optional(),
  soundSystem: z.boolean().optional(),
  projector: z.boolean().optional(),
  monitors: z.number().min(0).optional(),
  tvs: z.number().min(0).optional(),
  ethernet: z.boolean().optional(),
  wifi: z.boolean().optional(),
});

export const getMeetingRoomsQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default(1),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default(10),
  search: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.string().optional(),
  capacity: z.string().transform(Number).pipe(z.number().min(1)).optional(),
  wifi: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  ethernet: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  projector: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  soundSystem: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  podium: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
});

export const getRoomBookedSlotsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

export type CreateMeetingRoomRequest = z.infer<typeof createMeetingRoomSchema>;
export type UpdateMeetingRoomRequest = z.infer<typeof updateMeetingRoomSchema>;
export type GetMeetingRoomsQuery = z.infer<typeof getMeetingRoomsQuerySchema>;
export type GetRoomBookedSlotsQuery = z.infer<typeof getRoomBookedSlotsSchema>;
