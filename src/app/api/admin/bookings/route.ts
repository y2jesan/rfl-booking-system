import dbConnect from '@/lib/db';
import { AuthenticatedRequest, createErrorResponse, withAuth } from '@/lib/middleware/auth';
import { createBooking } from '@/lib/services/bookingService';
import { createBookingSchema, getAdminBookingsQuerySchema } from '@/lib/validators/booking';
import Booking from '@/models/Booking';
import { NextResponse } from 'next/server';

async function handleGET(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validation = getAdminBookingsQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid query parameters', 400, validation.error);
    }

    const { status, roomId, userId, dateFrom, dateTo, page, limit } = validation.data;
    const skip = (page - 1) * limit;

    // Build query
    const query: Record<string, unknown> = {};

    if (status) {
      query.status = status;
    }
    if (roomId) {
      query.roomId = roomId;
    }
    if (userId) {
      query.userId = userId;
    }
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) (query.date as Record<string, Date>).$gte = new Date(dateFrom);
      if (dateTo) (query.date as Record<string, Date>).$lte = new Date(dateTo);
    }

    // Get bookings with pagination
    const [bookings, total] = await Promise.all([Booking.find(query).populate('roomId', 'name').populate('userId', 'email').populate('reschedule.requestedBy', 'email').populate('reschedule.roomId', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit), Booking.countDocuments(query)]);

    return NextResponse.json({
      bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get admin bookings error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to fetch bookings', 500);
  }
}

async function handlePOST(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const validation = createBookingSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid input data', 400, validation.error);
    }

    const { roomId, date, startTime, endTime, purpose } = validation.data;

    // Admin can create bookings for any user, or for themselves
    const userId = body.userId || request.user.userId;

    const result = await createBooking({
      roomId,
      userId,
      date,
      startTime,
      endTime,
      purpose,
      createdByRole: request.user.role,
    });

    if (!result.success) {
      return createErrorResponse('BOOKING_ERROR', result.error!, 400);
    }

    const booking = await Booking.findById(result.booking!._id).populate('roomId', 'name').populate('userId', 'email');

    return NextResponse.json(
      {
        booking,
        message: 'Booking created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create admin booking error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to create booking', 500);
  }
}

export const GET = withAuth(handleGET, ['ADMIN', 'STAFF']);
export const POST = withAuth(handlePOST, ['ADMIN', 'STAFF']);
