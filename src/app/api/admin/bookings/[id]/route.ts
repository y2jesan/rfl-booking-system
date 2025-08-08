import dbConnect from '@/lib/db';
import { AuthenticatedRequest, createErrorResponse, withAuth } from '@/lib/middleware/auth';
import Booking from '@/models/Booking';
import { NextResponse } from 'next/server';

async function handlePATCH(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    // Extract booking ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const bookingId = pathParts[pathParts.length - 1];

    const body = await request.json();
    const { status, reschedule, rejectReason } = body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return createErrorResponse('BOOKING_NOT_FOUND', 'Booking not found', 404);
    }

    // Update booking fields
    if (status) booking.status = status;
    if (reschedule !== undefined) booking.reschedule = reschedule;
    if (rejectReason) booking.rejectReason = rejectReason;

    await booking.save();

    const updatedBooking = await Booking.findById(bookingId)
      .populate('roomId', 'name')
      .populate('userId', 'email')
      .populate('reschedule.requestedBy', 'email')
      .populate('reschedule.roomId', 'name');

    return NextResponse.json({
      booking: updatedBooking,
      message: 'Booking updated successfully',
    });
  } catch (error) {
    console.error('Update booking error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to update booking', 500);
  }
}

export const PATCH = withAuth(handlePATCH, ['ADMIN', 'STAFF']);
