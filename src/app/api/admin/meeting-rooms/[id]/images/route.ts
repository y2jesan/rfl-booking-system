import dbConnect from '@/lib/db';
import { createErrorResponse, withAuth } from '@/lib/middleware/auth';
import { ensureDirectoryExists, generateUniqueFileName, getRoomImagesDir, getRoomImageUrl, MAX_IMAGES_PER_ROOM, validateImageFile } from '@/lib/utils/file';
import MeetingRoom from '@/models/MeetingRoom';
import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

async function handlePOST(request: NextRequest) {
  try {
    await dbConnect();

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const roomId = pathParts[pathParts.length - 2];

    // Find room
    const room = await MeetingRoom.findById(roomId);
    if (!room) {
      return createErrorResponse('ROOM_NOT_FOUND', 'Meeting room not found', 404);
    }

    // Check current image count
    if (room.images.length >= MAX_IMAGES_PER_ROOM) {
      return createErrorResponse('MAX_IMAGES_EXCEEDED', `Maximum ${MAX_IMAGES_PER_ROOM} images allowed per room`, 400);
    }

    const formData = await request.formData();
    const files = formData.getAll('images') as File[];

    if (!files || files.length === 0) {
      return createErrorResponse('NO_FILES', 'No image files provided', 400);
    }

    // Check if adding these files would exceed the limit
    if (room.images.length + files.length > MAX_IMAGES_PER_ROOM) {
      return createErrorResponse('MAX_IMAGES_EXCEEDED', `Adding ${files.length} images would exceed the maximum of ${MAX_IMAGES_PER_ROOM} images per room`, 400);
    }

    // Validate all files first
    for (const file of files) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        return createErrorResponse('INVALID_FILE', validation.error!, 400);
      }
    }

    // Ensure room images directory exists
    const imagesDir = getRoomImagesDir(roomId);
    ensureDirectoryExists(imagesDir);

    const uploadedImages = [];

    // Process each file
    for (const file of files) {
      const fileName = generateUniqueFileName(file.name);
      const filePath = path.join(imagesDir, fileName);

      // Save file
      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(filePath, buffer);

      const imageData = {
        fileName,
        fileSize: file.size,
        url: getRoomImageUrl(roomId, fileName),
      };

      room.images.push(imageData);
      uploadedImages.push(imageData);
    }

    await room.save();

    return NextResponse.json(
      {
        uploadedImages,
        totalImages: room.images.length,
        message: `${files.length} image(s) uploaded successfully`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload images error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to upload images', 500);
  }
}

export const POST = withAuth(handlePOST, ['ADMIN']);
