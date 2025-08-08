import { generateRandomPassword, hashPassword } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { AuthenticatedRequest, createErrorResponse, withAuth } from '@/lib/middleware/auth';
import User from '@/models/User';
import { NextResponse } from 'next/server';

async function handlePOST(request: AuthenticatedRequest) {
  try {
    // Extract user ID from the URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const userId = pathParts[pathParts.length - 2]; // The ID is before 'reset-password'

    console.log('Reset password request for user ID:', userId);

    await dbConnect();
    console.log('Database connected successfully');

    const user = await User.findById(userId);
    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      console.log('User not found with ID:', userId);
      return createErrorResponse('USER_NOT_FOUND', 'User not found', 404);
    }

    // Generate new random password
    const newPassword = generateRandomPassword();
    console.log('Generated new password');

    const passwordHash = await hashPassword(newPassword);
    console.log('Password hashed successfully');

    // Update user password
    user.passwordHash = passwordHash;
    await user.save();
    console.log('User password updated successfully');

    return NextResponse.json({
      message: 'Password reset successfully',
      newPassword, // Return new password only once
    });
  } catch (error) {
    console.error('Reset password error details:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return createErrorResponse('INTERNAL_ERROR', 'Failed to reset password', 500);
  }
}

export const POST = withAuth(handlePOST, ['ADMIN']);
