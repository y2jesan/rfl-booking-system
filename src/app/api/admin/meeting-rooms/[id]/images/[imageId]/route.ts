import dbConnect from '@/lib/db';
import { createErrorResponse, withAuth } from '@/lib/middleware/auth';
import { deleteFileIfExists, getRoomImagesDir } from '@/lib/utils/file';
import MeetingRoom from '@/models/MeetingRoom';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

async function handleDELETE(request: NextRequest) {
  try {
    await dbConnect();

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const roomId = pathParts[pathParts.length - 3];
    const imageId = pathParts[pathParts.length - 1];

    // Find room
    const room = await MeetingRoom.findById(roomId);
    if (!room) {
      return createErrorResponse('ROOM_NOT_FOUND', 'Meeting room not found', 404);
    }

    // Find image
    const imageIndex = room.images.findIndex((img: { _id: { toString: () => string } }) => img._id.toString() === imageId);
    if (imageIndex === -1) {
      return createErrorResponse('IMAGE_NOT_FOUND', 'Image not found', 404);
    }

    const image = room.images[imageIndex];

    // Delete file from filesystem
    const imagesDir = getRoomImagesDir(roomId);
    const filePath = path.join(imagesDir, image.fileName);
    deleteFileIfExists(filePath);

    // Remove image from room
    room.images.splice(imageIndex, 1);
    await room.save();

    return NextResponse.json({
      message: 'Image deleted successfully',
      remainingImages: room.images.length,
    });
  } catch (error) {
    console.error('Delete image error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to delete image', 500);
  }
}

export const DELETE = withAuth(handleDELETE, ['ADMIN']);
