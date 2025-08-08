import { isTodayOrFuture, isValidDateFormat, isValidTimeFormat } from '@/lib/utils/time';
import { z } from 'zod';

export const createBookingSchema = z
  .object({
    roomId: z.string().min(1, 'Room ID is required'),
    date: z.string().refine(isValidDateFormat, 'Date must be in YYYY-MM-DD format').refine(isTodayOrFuture, 'Date must be today or in the future'),
    startTime: z.string().refine(isValidTimeFormat, 'Start time must be in HH:mm format'),
    endTime: z.string().refine(isValidTimeFormat, 'End time must be in HH:mm format'),
    purpose: z.string().optional(),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: 'Start time must be before end time',
    path: ['endTime'],
  });

export const updateBookingSchema = z
  .object({
    date: z.string().refine(isValidDateFormat, 'Date must be in YYYY-MM-DD format').refine(isTodayOrFuture, 'Date must be today or in the future').optional(),
    startTime: z.string().refine(isValidTimeFormat, 'Start time must be in HH:mm format').optional(),
    endTime: z.string().refine(isValidTimeFormat, 'End time must be in HH:mm format').optional(),
    purpose: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.startTime < data.endTime;
      }
      return true;
    },
    {
      message: 'Start time must be before end time',
      path: ['endTime'],
    }
  );

export const rescheduleBookingSchema = z
  .object({
    roomId: z.string().min(1, 'Room ID is required').optional(),
    date: z.string().refine(isValidDateFormat, 'Date must be in YYYY-MM-DD format').refine(isTodayOrFuture, 'Date must be today or in the future').optional(),
    startTime: z.string().refine(isValidTimeFormat, 'Start time must be in HH:mm format').optional(),
    endTime: z.string().refine(isValidTimeFormat, 'End time must be in HH:mm format').optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.startTime < data.endTime;
      }
      return true;
    },
    {
      message: 'Start time must be before end time',
      path: ['endTime'],
    }
  );

export const cancelBookingSchema = z.object({
  reason: z.string().min(1, 'Cancellation reason is required'),
});

export const confirmRejectBookingSchema = z.object({
  reason: z.string().optional(),
});

export const getBookingsQuerySchema = z.object({
  scope: z.enum(['upcoming', 'history']).default('upcoming'),
  status: z.enum(['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'RESCHEDULE_REQUESTED']).optional(),
  from: z.string().refine(isValidDateFormat, 'From date must be in YYYY-MM-DD format').optional(),
  to: z.string().refine(isValidDateFormat, 'To date must be in YYYY-MM-DD format').optional(),
  page: z.string().transform(Number).pipe(z.number().min(1)).default(1),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default(10),
});

export const getAdminBookingsQuerySchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'RESCHEDULE_REQUESTED']).optional(),
  roomId: z.string().optional(),
  userId: z.string().optional(),
  dateFrom: z.string().refine(isValidDateFormat, 'From date must be in YYYY-MM-DD format').optional(),
  dateTo: z.string().refine(isValidDateFormat, 'To date must be in YYYY-MM-DD format').optional(),
  page: z.string().transform(Number).pipe(z.number().min(1)).default(1),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default(10),
});

export type CreateBookingRequest = z.infer<typeof createBookingSchema>;
export type UpdateBookingRequest = z.infer<typeof updateBookingSchema>;
export type RescheduleBookingRequest = z.infer<typeof rescheduleBookingSchema>;
export type CancelBookingRequest = z.infer<typeof cancelBookingSchema>;
export type ConfirmRejectBookingRequest = z.infer<typeof confirmRejectBookingSchema>;
export type GetBookingsQuery = z.infer<typeof getBookingsQuerySchema>;
export type GetAdminBookingsQuery = z.infer<typeof getAdminBookingsQuerySchema>;
