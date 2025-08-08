import dbConnect from '@/lib/db';
import { AuthenticatedRequest, createErrorResponse, withAuth } from '@/lib/middleware/auth';
import Booking from '@/models/Booking';
import { NextResponse } from 'next/server';

async function handlePOST(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    // Extract booking ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const bookingId = pathParts[pathParts.length - 2]; // /api/admin/bookings/[id]/confirm

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return createErrorResponse('BOOKING_NOT_FOUND', 'Booking not found', 404);
    }

    // Only allow confirming pending bookings
    if (booking.status !== 'PENDING') {
      return createErrorResponse('BOOKING_NOT_CONFIRMABLE', 'Only pending bookings can be confirmed', 400);
    }

    // Update booking status
    booking.status = 'CONFIRMED';
    await booking.save();

    const updatedBooking = await Booking.findById(bookingId)
      .populate('roomId', 'name')
      .populate('userId', 'email');

    return NextResponse.json({
      booking: updatedBooking,
      message: 'Booking confirmed successfully',
    });
  } catch (error) {
    console.error('Confirm booking error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to confirm booking', 500);
  }
}

export const POST = withAuth(handlePOST, ['ADMIN', 'STAFF']);

