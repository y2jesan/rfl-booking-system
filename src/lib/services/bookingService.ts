import { timeToMinutes } from '@/lib/utils/time';
import Booking, { IBooking } from '@/models/Booking';
import MeetingRoom from '@/models/MeetingRoom';

export interface BookingOverlapCheck {
  roomId: string;
  date: string;
  startMinutes: number;
  endMinutes: number;
  excludeBookingId?: string;
}

export interface BookedSlot {
  start: string;
  end: string;
  bookingId: string;
  status: string;
}

/**
 * Check if a new booking overlaps with existing bookings
 * @param params Booking parameters to check
 * @returns True if there's an overlap
 */
export async function hasBookingOverlap(params: BookingOverlapCheck): Promise<boolean> {
  try {
    const { roomId, date, startMinutes, endMinutes, excludeBookingId } = params;

    console.log('hasBookingOverlap params:', params);

    const query: unknown = {
      roomId,
      date,
      status: { $in: ['PENDING', 'CONFIRMED', 'RESCHEDULE_REQUESTED'] },
      $or: [
        // Check main booking times
        {
          $and: [{ startMinutes: { $lt: endMinutes } }, { endMinutes: { $gt: startMinutes } }],
        },
        // Check reschedule times if status is RESCHEDULE_REQUESTED
        {
          status: 'RESCHEDULE_REQUESTED',
          'reschedule.date': date,
          'reschedule.roomId': roomId,
          $and: [{ 'reschedule.startMinutes': { $lt: endMinutes } }, { 'reschedule.endMinutes': { $gt: startMinutes } }],
        },
      ],
    };

    if (excludeBookingId) {
      (query as Record<string, unknown>)._id = { $ne: excludeBookingId };
    }

    // console.log('hasBookingOverlap query:', JSON.stringify(query, null, 2));

    const overlappingBookings = await Booking.find(query as Record<string, unknown>);
    console.log('Overlapping bookings found:', overlappingBookings.length);

    return overlappingBookings.length > 0;
  } catch (error: unknown) {
    console.error('Error in hasBookingOverlap:', error);
    throw error;
  }
}

/**
 * Get booked slots for a room on a specific date
 * @param roomId Room ID
 * @param date Date in YYYY-MM-DD format
 * @returns Array of booked slots
 */
export async function getBookedSlots(roomId: string, date: string): Promise<BookedSlot[]> {
  const bookings = await Booking.find({
    roomId,
    date,
    status: { $in: ['PENDING', 'CONFIRMED', 'RESCHEDULE_REQUESTED'] },
  }).sort({ startMinutes: 1 });

  const slots: BookedSlot[] = [];

  for (const booking of bookings) {
    // Add main booking slot
    if (booking.status !== 'RESCHEDULE_REQUESTED') {
      slots.push({
        start: minutesToTime(booking.startMinutes),
        end: minutesToTime(booking.endMinutes),
        bookingId: booking._id.toString(),
        status: booking.status,
      });
    }

    // Add reschedule slot if exists and targets the same room/date
    if (booking.status === 'RESCHEDULE_REQUESTED' && booking.reschedule) {
      const reschedule = booking.reschedule;
      if (reschedule.roomId?.toString() === roomId && reschedule.date === date) {
        slots.push({
          start: minutesToTime(reschedule.startMinutes!),
          end: minutesToTime(reschedule.endMinutes!),
          bookingId: booking._id.toString(),
          status: 'RESCHEDULE_REQUESTED',
        });
      }
    }
  }

  return slots.sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
}

/**
 * Validate booking time constraints
 * @param startTime Start time in HH:mm format
 * @param endTime End time in HH:mm format
 * @returns Validation result
 */
export function validateBookingTime(startTime: string, endTime: string): { valid: boolean; error?: string } {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  if (startMinutes >= endMinutes) {
    return { valid: false, error: 'Start time must be before end time' };
  }

  if (endMinutes - startMinutes < 30) {
    return { valid: false, error: 'Booking must be at least 30 minutes long' };
  }

  return { valid: true };
}

/**
 * Create a new booking with overlap validation
 * @param bookingData Booking data
 * @returns Created booking or error
 */
export async function createBooking(bookingData: { roomId: string; userId: string; date: string; startTime: string; endTime: string; purpose?: string; createdByRole: 'ADMIN' | 'STAFF' | 'USER' }): Promise<{ success: boolean; booking?: IBooking; error?: string }> {
  const { roomId, userId, date, startTime, endTime, purpose, createdByRole } = bookingData;

  // Check if room exists and is active
  const room = await MeetingRoom.findById(roomId);
  if (!room) {
    return { success: false, error: 'Meeting room not found' };
  }

  if (!room.isActive) {
    return { success: false, error: 'This meeting room is currently inactive and cannot be booked' };
  }

  // Validate time format and range
  const timeValidation = validateBookingTime(startTime, endTime);
  if (!timeValidation.valid) {
    return { success: false, error: timeValidation.error };
  }

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  // Check for overlaps
  const hasOverlap = await hasBookingOverlap({
    roomId,
    date,
    startMinutes,
    endMinutes,
  });

  if (hasOverlap) {
    return { success: false, error: 'The selected time slot overlaps with an existing booking' };
  }

  // Create booking
  const booking = new Booking({
    roomId,
    userId,
    date,
    startMinutes,
    endMinutes,
    purpose,
    createdByRole,
    status: 'PENDING',
  });

  await booking.save();
  return { success: true, booking };
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}
