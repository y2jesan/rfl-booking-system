import dbConnect from '@/lib/db';
import { AuthenticatedRequest, createErrorResponse, withAuth } from '@/lib/middleware/auth';
import { createBooking } from '@/lib/services/bookingService';
import { getCurrentDate } from '@/lib/utils/time';
import { createBookingSchema, getBookingsQuerySchema } from '@/lib/validators/booking';
import Booking from '@/models/Booking';
import { NextResponse } from 'next/server';

async function handleGET(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validation = getBookingsQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid query parameters', 400, validation.error.issues);
    }

    const { scope, status, from, to, page, limit } = validation.data;
    const skip = (page - 1) * limit;

    // Build query
    const query: Record<string, unknown> = { userId: request.user.userId };

    const currentDate = getCurrentDate();

    // Initialize date query
    const dateQuery: Record<string, unknown> = {};

    // Handle scope-based date filtering
    if (scope === 'upcoming') {
      dateQuery.$gte = currentDate;
      query.status = { $in: ['PENDING', 'CONFIRMED', 'RESCHEDULE_REQUESTED'] };
    } else {
      dateQuery.$lt = currentDate;
    }

    // Handle specific date range filters
    if (from) {
      dateQuery.$gte = from;
    }
    if (to) {
      dateQuery.$lte = to;
    }

    // Only add date query if we have date conditions
    if (Object.keys(dateQuery).length > 0) {
      query.date = dateQuery;
    }

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    // Get bookings with pagination
    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('roomId', 'name')
        .sort({ date: scope === 'upcoming' ? 1 : -1, startMinutes: 1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(query),
    ]);

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
    console.error('Get bookings error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to fetch bookings', 500);
  }
}

async function handlePOST(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const validation = createBookingSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid input data', 400, validation.error.issues);
    }

    const { roomId, date, startTime, endTime, purpose } = validation.data;

    const result = await createBooking({
      roomId,
      userId: request.user.userId,
      date,
      startTime,
      endTime,
      purpose,
      createdByRole: request.user.role,
    });

    if (!result.success) {
      return createErrorResponse('BOOKING_ERROR', result.error!, 400);
    }

    const booking = await Booking.findById(result.booking!._id).populate('roomId', 'name');

    return NextResponse.json(
      {
        booking,
        message: 'Booking created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create booking error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to create booking', 500);
  }
}

export const GET = withAuth(handleGET);
export const POST = withAuth(handlePOST);
