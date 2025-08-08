import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import MeetingRoom from '@/models/MeetingRoom';
import { createErrorResponse } from '@/lib/middleware/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();

    const { id } = await params;
    const room = await MeetingRoom.findById(id);
    if (!room) {
      return createErrorResponse('ROOM_NOT_FOUND', 'Meeting room not found', 404);
    }

    return NextResponse.json({ room });
  } catch (error) {
    console.error('Get meeting room error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to fetch meeting room', 500);
  }
}

