import dbConnect from '@/lib/db';
import { AuthenticatedRequest, createErrorResponse, withAuth } from '@/lib/middleware/auth';
import { hasBookingOverlap } from '@/lib/services/bookingService';
import { timeToMinutes } from '@/lib/utils/time';
import { updateBookingSchema } from '@/lib/validators/booking';
import Booking from '@/models/Booking';
import { NextResponse } from 'next/server';

async function handleGET(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    // Extract booking ID from the URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const bookingId = pathParts[pathParts.length - 1]; // The ID is the last part

    const query: Record<string, unknown> = { _id: bookingId };

    // Non-admin users can only see their own bookings
    if (request.user.role === 'USER') {
      query.userId = request.user.userId;
    }

    const booking = await Booking.findOne(query).populate('roomId', 'name').populate('userId', 'email').populate('reschedule.requestedBy', 'email').populate('reschedule.roomId', 'name');

    if (!booking) {
      return createErrorResponse('BOOKING_NOT_FOUND', 'Booking not found', 404);
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error('Get booking error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to fetch booking', 500);
  }
}

async function handlePATCH(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    // Extract booking ID from the URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const bookingId = pathParts[pathParts.length - 1]; // The ID is the last part

    const body = await request.json();
    const validation = updateBookingSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid input data', 400, validation.error.issues);
    }

    const updateData = validation.data;

    // Find booking
    const query: Record<string, unknown> = { _id: bookingId };
    if (request.user.role === 'USER') {
      query.userId = request.user.userId;
    }

    const booking = await Booking.findOne(query);
    if (!booking) {
      return createErrorResponse('BOOKING_NOT_FOUND', 'Booking not found', 404);
    }

    // Only allow editing PENDING bookings
    if (booking.status !== 'PENDING') {
      return createErrorResponse('BOOKING_NOT_EDITABLE', 'Only pending bookings can be edited', 400);
    }

    // Check for overlaps if time is being changed
    if (updateData.startTime || updateData.endTime) {
      const startMinutes = updateData.startTime ? timeToMinutes(updateData.startTime) : booking.startMinutes;
      const endMinutes = updateData.endTime ? timeToMinutes(updateData.endTime) : booking.endMinutes;
      const date = updateData.date || booking.date;

      const hasOverlap = await hasBookingOverlap({
        roomId: booking.roomId.toString(),
        date,
        startMinutes,
        endMinutes,
        excludeBookingId: bookingId,
      });

      if (hasOverlap) {
        return createErrorResponse('BOOKING_OVERLAP', 'The selected time slot overlaps with an existing booking', 400);
      }

      if (updateData.startTime) booking.startMinutes = startMinutes;
      if (updateData.endTime) booking.endMinutes = endMinutes;
    }

    // Update other fields
    if (updateData.date) booking.date = updateData.date;
    if (updateData.purpose !== undefined) booking.purpose = updateData.purpose;

    await booking.save();

    const updatedBooking = await Booking.findById(bookingId).populate('roomId', 'name').populate('userId', 'email').populate('reschedule.requestedBy', 'email').populate('reschedule.roomId', 'name');

    return NextResponse.json({
      booking: updatedBooking,
      message: 'Booking updated successfully',
    });
  } catch (error) {
    console.error('Update booking error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to update booking', 500);
  }
}

export const GET = withAuth(handleGET);
export const PATCH = withAuth(handlePATCH);
