import dbConnect from '@/lib/db';
import { createErrorResponse } from '@/lib/middleware/auth';
import { getMeetingRoomsQuerySchema } from '@/lib/validators/meetingRoom';
import MeetingRoom from '@/models/MeetingRoom';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validation = getMeetingRoomsQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid query parameters', 400, validation.error);
    }

    const { page, limit, capacity, wifi, ethernet, projector, soundSystem, podium } = validation.data;
    const skip = (page - 1) * limit;

    // Build query
    const query: Record<string, unknown> = { isActive: true }; // Only show active rooms to users
    if (capacity) {
      query.capacity = { $gte: capacity };
    }
    if (wifi !== undefined) {
      query.wifi = wifi;
    }
    if (ethernet !== undefined) {
      query.ethernet = ethernet;
    }
    if (projector !== undefined) {
      query.projector = projector;
    }
    if (soundSystem !== undefined) {
      query.soundSystem = soundSystem;
    }
    if (podium !== undefined) {
      query.podium = podium;
    }

    // Get meeting rooms with pagination
    const [rooms, total] = await Promise.all([MeetingRoom.find(query).sort({ name: 1 }).skip(skip).limit(limit), MeetingRoom.countDocuments(query)]);

    return NextResponse.json({
      rooms,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get meeting rooms error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to fetch meeting rooms', 500);
  }
}
