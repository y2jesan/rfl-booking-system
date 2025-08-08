import dbConnect from '@/lib/db';
import { createErrorResponse, withAuth } from '@/lib/middleware/auth';
import { createMeetingRoomSchema } from '@/lib/validators/meetingRoom';
import MeetingRoom from '@/models/MeetingRoom';
import { NextRequest, NextResponse } from 'next/server';

async function handleGET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [{ name: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }, { location: { $regex: search, $options: 'i' } }];
    }

    if (status) {
      query.isActive = status === 'active' ? true : false;
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [rooms, total] = await Promise.all([MeetingRoom.find(query).sort(sort).skip(skip).limit(limit).lean(), MeetingRoom.countDocuments(query)]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      rooms,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Get meeting rooms error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to fetch meeting rooms', 500);
  }
}

async function handlePOST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const validation = createMeetingRoomSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid input data', 400, validation.error.issues);
    }

    const roomData = validation.data;

    // Check if room name already exists
    const existingRoom = await MeetingRoom.findOne({ name: roomData.name });
    if (existingRoom) {
      return createErrorResponse('ROOM_EXISTS', 'Meeting room with this name already exists', 409);
    }

    // Create meeting room
    const room = new MeetingRoom(roomData);
    await room.save();

    return NextResponse.json(
      {
        room,
        message: 'Meeting room created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create meeting room error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to create meeting room', 500);
  }
}

export const GET = withAuth(handleGET, ['ADMIN', 'STAFF']);
export const POST = withAuth(handlePOST, ['ADMIN']);
