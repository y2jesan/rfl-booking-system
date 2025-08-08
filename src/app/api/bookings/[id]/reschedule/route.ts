import dbConnect from '@/lib/db';
import { AuthenticatedRequest, createErrorResponse, withAuth } from '@/lib/middleware/auth';
import { hasBookingOverlap } from '@/lib/services/bookingService';
import { timeToMinutes } from '@/lib/utils/time';
import { rescheduleBookingSchema } from '@/lib/validators/booking';
import Booking from '@/models/Booking';
import MeetingRoom from '@/models/MeetingRoom';
import { NextResponse } from 'next/server';

async function handlePOST(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    // Extract booking ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const bookingId = pathParts[pathParts.length - 2]; // Get the ID from the URL path

    const body = await request.json();
    console.log('Reschedule request body:', body);
    
    const validation = rescheduleBookingSchema.safeParse(body);

    if (!validation.success) {
      console.log('Validation error:', validation.error);
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid input data',
        400,
        validation.error.issues
      );
    }

    const rescheduleData = validation.data;
    console.log('Validated reschedule data:', rescheduleData);

    // Find booking
    const query: Record<string, unknown> = { _id: bookingId };
    if (request.user.role === 'USER') {
      query.userId = request.user.userId;
    }

    const booking = await Booking.findOne(query);
    if (!booking) {
      return createErrorResponse('BOOKING_NOT_FOUND', 'Booking not found', 404);
    }

    console.log('Found booking:', booking._id);

    // Only allow rescheduling confirmed or pending bookings
    if (!['CONFIRMED', 'PENDING'].includes(booking.status)) {
      return createErrorResponse('BOOKING_NOT_RESCHEDULABLE', 'Only confirmed or pending bookings can be rescheduled', 400);
    }

    // Prepare reschedule data
    const reschedule: Record<string, unknown> = {
      requestedBy: request.user.userId,
      requestedAt: new Date(),
    };

    // Use existing values if not provided
    const targetRoomId = rescheduleData.roomId || booking.roomId.toString();
    const targetDate = rescheduleData.date || booking.date;
    const targetStartMinutes = rescheduleData.startTime ? timeToMinutes(rescheduleData.startTime) : booking.startMinutes;
    const targetEndMinutes = rescheduleData.endTime ? timeToMinutes(rescheduleData.endTime) : booking.endMinutes;

    console.log('Target values:', {
      targetRoomId,
      targetDate,
      targetStartMinutes,
      targetEndMinutes
    });

    // Validate time range
    if (targetStartMinutes >= targetEndMinutes) {
      return createErrorResponse('INVALID_TIME_RANGE', 'Start time must be before end time', 400);
    }

    // Check for overlaps with the new time slot
    console.log('Checking for overlaps...');
    const hasOverlap = await hasBookingOverlap({
      roomId: targetRoomId,
      date: targetDate,
      startMinutes: targetStartMinutes,
      endMinutes: targetEndMinutes,
      excludeBookingId: bookingId,
    });

    console.log('Overlap check result:', hasOverlap);

    if (hasOverlap) {
      return createErrorResponse('BOOKING_OVERLAP', 'The requested time slot overlaps with an existing booking', 400);
    }

    // Validate room is active
    const room = await MeetingRoom.findById(targetRoomId);
    if (!room || !room.isActive) {
      return createErrorResponse('ROOM_NOT_ACTIVE', 'The requested room is not active or does not exist', 400);
    }

    // Set reschedule details
    if (rescheduleData.roomId) reschedule.roomId = rescheduleData.roomId;
    if (rescheduleData.date) reschedule.date = rescheduleData.date;
    if (rescheduleData.startTime) reschedule.startMinutes = targetStartMinutes;
    if (rescheduleData.endTime) reschedule.endMinutes = targetEndMinutes;

    console.log('Reschedule data to save:', reschedule);

    // Update booking
    booking.status = 'RESCHEDULE_REQUESTED';
    booking.reschedule = reschedule;
    await booking.save();

    console.log('Booking updated successfully');

    const updatedBooking = await Booking.findById(bookingId)
      .populate('roomId', 'name')
      .populate('userId', 'email')
      .populate('reschedule.roomId', 'name');

    return NextResponse.json({
      booking: updatedBooking,
      message: 'Reschedule request submitted successfully',
    });
  } catch (error) {
    console.error('Reschedule booking error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to reschedule booking', 500);
  }
}

export const POST = withAuth(handlePOST);

