import dbConnect from '@/lib/db';
import { AuthenticatedRequest, createErrorResponse, withAuth } from '@/lib/middleware/auth';
import { cancelBookingSchema } from '@/lib/validators/booking';
import Booking from '@/models/Booking';
import { NextResponse } from 'next/server';

async function handlePOST(request: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();

    const body = await request.json();
    const validation = cancelBookingSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid input data', 400, validation.error);
    }

    const { reason } = validation.data;

    // Find booking
    const { id } = await params;
    const query: Record<string, unknown> = { _id: id };
    if (request.user.role === 'USER') {
      query.userId = request.user.userId;
    }

    const booking = await Booking.findOne(query);
    if (!booking) {
      return createErrorResponse('BOOKING_NOT_FOUND', 'Booking not found', 404);
    }

    // Only allow cancelling non-cancelled bookings
    if (booking.status === 'CANCELLED') {
      return createErrorResponse('BOOKING_ALREADY_CANCELLED', 'Booking is already cancelled', 400);
    }

    // Update booking status
    booking.status = 'CANCELLED';
    booking.cancelReason = reason;
    await booking.save();

    const updatedBooking = await Booking.findById(id).populate('roomId', 'name').populate('userId', 'email');

    return NextResponse.json({
      booking: updatedBooking,
      message: 'Booking cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to cancel booking', 500);
  }
}

export const POST = withAuth((request: AuthenticatedRequest) => {
  const params = { id: request.url.split('/').slice(-2)[0] };
  return handlePOST(request, { params: Promise.resolve(params) });
});
