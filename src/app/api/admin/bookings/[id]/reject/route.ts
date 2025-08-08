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
    const bookingId = pathParts[pathParts.length - 2]; // /api/admin/bookings/[id]/reject

    const body = await request.json();
    const validation = confirmRejectBookingSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid input data', 400, validation.error.issues);
    }

    const { reason } = validation.data;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return createErrorResponse('BOOKING_NOT_FOUND', 'Booking not found', 404);
    }

    // Only allow rejecting pending bookings
    if (booking.status !== 'PENDING') {
      return createErrorResponse('BOOKING_NOT_REJECTABLE', 'Only pending bookings can be rejected', 400);
    }

    // Update booking status
    booking.status = 'REJECTED';
    if (reason) {
      booking.rejectReason = reason;
    }
    await booking.save();

    const updatedBooking = await Booking.findById(bookingId).populate('roomId', 'name').populate('userId', 'email');

    return NextResponse.json({
      booking: updatedBooking,
      message: 'Booking rejected successfully',
    });
  } catch (error) {
    console.error('Reject booking error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to reject booking', 500);
  }
}

export const POST = withAuth(handlePOST, ['ADMIN', 'STAFF']);
