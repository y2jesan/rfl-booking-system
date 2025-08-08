import dbConnect from '@/lib/db';
import { createErrorResponse } from '@/lib/middleware/auth';
import { getBookedSlots } from '@/lib/services/bookingService';
import { getRoomBookedSlotsSchema } from '@/lib/validators/meetingRoom';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validation = getRoomBookedSlotsSchema.safeParse(queryParams);
    if (!validation.success) {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid query parameters', 400, validation.error);
    }

    const { date } = validation.data;
    const { id } = await params;
    const bookedSlots = await getBookedSlots(id, date);

    return NextResponse.json({ bookedSlots });
  } catch (error) {
    console.error('Get booked slots error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to fetch booked slots', 500);
  }
}
