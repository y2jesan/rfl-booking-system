import dbConnect from '@/lib/db';
import { AuthenticatedRequest, createErrorResponse, withAuth } from '@/lib/middleware/auth';
import { updateUserSchema } from '@/lib/validators/user';
import User from '@/models/User';
import { NextResponse } from 'next/server';

async function handleGET(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    // Extract user ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const userId = pathParts[pathParts.length - 1]; // /api/admin/users/[id]

    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      return createErrorResponse('USER_NOT_FOUND', 'User not found', 404);
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to fetch user', 500);
  }
}

async function handlePATCH(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    // Extract user ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const userId = pathParts[pathParts.length - 1]; // /api/admin/users/[id]

    const body = await request.json();
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid input data',
        400,
        validation.error.issues
      );
    }

    const updateData = validation.data;

    // Check if email is being updated and if it already exists
    if (updateData.email) {
      const existingUser = await User.findOne({ 
        email: updateData.email, 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        return createErrorResponse('EMAIL_EXISTS', 'Email already in use', 409);
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) {
      return createErrorResponse('USER_NOT_FOUND', 'User not found', 404);
    }

    return NextResponse.json({
      user,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Update user error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to update user', 500);
  }
}

async function handleDELETE(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    // Extract user ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const userId = pathParts[pathParts.length - 1]; // /api/admin/users/[id]

    // First get the current user to check their status
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return createErrorResponse('USER_NOT_FOUND', 'User not found', 404);
    }

    // Toggle the isActive status
    const newStatus = !currentUser.isActive;
    const user = await User.findByIdAndUpdate(userId, { isActive: newStatus }, { new: true });
    
    if (!user) {
      return createErrorResponse('USER_NOT_FOUND', 'User not found', 404);
    }

    return NextResponse.json({
      user,
      message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to toggle user status', 500);
  }
}

export const GET = withAuth(handleGET, ['ADMIN']);
export const PATCH = withAuth(handlePATCH, ['ADMIN']);
export const DELETE = withAuth(handleDELETE, ['ADMIN']);

