import dbConnect from '@/lib/db';
import { AuthenticatedRequest, createErrorResponse, withAuth } from '@/lib/middleware/auth';
import { updateMeetingRoomSchema } from '@/lib/validators/meetingRoom';
import MeetingRoom from '@/models/MeetingRoom';
import { NextResponse } from 'next/server';

async function handlePATCH(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    // Extract room ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const roomId = pathParts[pathParts.length - 1];

    const body = await request.json();
    const validation = updateMeetingRoomSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid input data',
        400,
        validation.error.issues
      );
    }

    const updateData = validation.data;

    // Check if name is being updated and if it already exists
    if (updateData.name) {
      const existingRoom = await MeetingRoom.findOne({ 
        name: updateData.name, 
        _id: { $ne: roomId } 
      });
      if (existingRoom) {
        return createErrorResponse('NAME_EXISTS', 'Meeting room name already in use', 409);
      }
    }

    const room = await MeetingRoom.findByIdAndUpdate(
      roomId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!room) {
      return createErrorResponse('ROOM_NOT_FOUND', 'Meeting room not found', 404);
    }

    return NextResponse.json({
      room,
      message: 'Meeting room updated successfully',
    });
  } catch (error) {
    console.error('Update meeting room error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to update meeting room', 500);
  }
}

async function handleDELETE(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    // Extract room ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const roomId = pathParts[pathParts.length - 1];

    // // Check if room has any active bookings
    // const activeBookingCount = await Booking.countDocuments({ 
    //   roomId: roomId,
    //   status: { $in: ['PENDING', 'CONFIRMED', 'RESCHEDULE_REQUESTED'] }
    // });
    
    // if (activeBookingCount > 0) {
    //   return createErrorResponse(
    //     'ROOM_HAS_ACTIVE_BOOKINGS', 
    //     'Cannot deactivate meeting room with active bookings', 
    //     400
    //   );
    // }

    // Get current room status
    const currentRoom = await MeetingRoom.findById(roomId);
    console.log(currentRoom);
    if (!currentRoom) {
      return createErrorResponse('ROOM_NOT_FOUND', 'Meeting room not found', 404);
    }

    // Toggle the isActive status
    const newStatus = !currentRoom.isActive;
    const room = await MeetingRoom.findByIdAndUpdate(
      roomId,
      { isActive: newStatus },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      room,
      message: `Meeting room ${newStatus ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    console.error('Toggle meeting room status error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to toggle meeting room status', 500);
  }
}

export const PATCH = withAuth(handlePATCH, ['ADMIN']);
export const DELETE = withAuth(handleDELETE, ['ADMIN']);

