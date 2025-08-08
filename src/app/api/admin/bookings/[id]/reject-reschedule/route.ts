import dbConnect from '@/lib/db';
import { AuthenticatedRequest, createErrorResponse, withAuth } from '@/lib/middleware/auth';
import { confirmRejectBookingSchema } from '@/lib/validators/booking';
import Booking from '@/models/Booking';
import { NextResponse } from 'next/server';

async function handlePOST(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    // Extract booking ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const bookingId = pathParts[pathParts.length - 2]; // Get the ID from the URL path

    const body = await request.json();
    const validation = confirmRejectBookingSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid input data',
        400,
        validation.error.issues
      );
    }

    const { reason } = validation.data;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return createErrorResponse('BOOKING_NOT_FOUND', 'Booking not found', 404);
    }

    // Only allow rejecting reschedule requests
    if (booking.status !== 'RESCHEDULE_REQUESTED' || !booking.reschedule) {
      return createErrorResponse('NO_RESCHEDULE_REQUEST', 'No reschedule request found for this booking', 400);
    }

    // Clear reschedule data and set status back to original (confirmed or pending)
    booking.reschedule = undefined;
    booking.status = 'CONFIRMED'; // Assume it was confirmed before reschedule request
    if (reason) {
      booking.rejectReason = reason;
    }
    await booking.save();

    const updatedBooking = await Booking.findById(bookingId)
      .populate('roomId', 'name')
      .populate('userId', 'email');

    return NextResponse.json({
      booking: updatedBooking,
      message: 'Reschedule request rejected successfully',
    });
  } catch (error) {
    console.error('Reject reschedule error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to reject reschedule', 500);
  }
}

export const POST = withAuth(handlePOST, ['ADMIN', 'STAFF']);

