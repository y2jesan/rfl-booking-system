import dbConnect from '@/lib/db';
import { AuthenticatedRequest, createErrorResponse, withAuth } from '@/lib/middleware/auth';
import { hasBookingOverlap } from '@/lib/services/bookingService';
import Booking from '@/models/Booking';
import { NextResponse } from 'next/server';

async function handlePOST(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    // Extract booking ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const bookingId = pathParts[pathParts.length - 2]; // Get the ID from the URL path

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return createErrorResponse('BOOKING_NOT_FOUND', 'Booking not found', 404);
    }

    // Only allow approving reschedule requests
    if (booking.status !== 'RESCHEDULE_REQUESTED' || !booking.reschedule) {
      return createErrorResponse('NO_RESCHEDULE_REQUEST', 'No reschedule request found for this booking', 400);
    }

    const reschedule = booking.reschedule;

    // Use reschedule data or fall back to original booking data
    const targetRoomId = reschedule.roomId?.toString() || booking.roomId.toString();
    const targetDate = reschedule.date || booking.date;
    const targetStartMinutes = reschedule.startMinutes ?? booking.startMinutes;
    const targetEndMinutes = reschedule.endMinutes ?? booking.endMinutes;

    // Double-check for overlaps (in case something changed since the reschedule request)
    const hasOverlap = await hasBookingOverlap({
      roomId: targetRoomId,
      date: targetDate,
      startMinutes: targetStartMinutes,
      endMinutes: targetEndMinutes,
      excludeBookingId: bookingId,
    });

    if (hasOverlap) {
      return createErrorResponse('BOOKING_OVERLAP', 'The requested time slot now overlaps with an existing booking', 400);
    }

    // Apply reschedule changes to the booking
    if (reschedule.roomId) booking.roomId = reschedule.roomId;
    if (reschedule.date) booking.date = reschedule.date;
    if (reschedule.startMinutes !== undefined) booking.startMinutes = reschedule.startMinutes;
    if (reschedule.endMinutes !== undefined) booking.endMinutes = reschedule.endMinutes;

    // Clear reschedule data and set status back to confirmed
    booking.reschedule = undefined;
    booking.status = 'CONFIRMED';
    await booking.save();

    const updatedBooking = await Booking.findById(bookingId)
      .populate('roomId', 'name')
      .populate('userId', 'email');

    return NextResponse.json({
      booking: updatedBooking,
      message: 'Reschedule request approved successfully',
    });
  } catch (error) {
    console.error('Approve reschedule error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to approve reschedule', 500);
  }
}

export const POST = withAuth(handlePOST, ['ADMIN', 'STAFF']);

