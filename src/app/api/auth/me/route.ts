import { verifyToken } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { createErrorResponse } from '@/lib/middleware/auth';
import User from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const accessToken = request.cookies.get('access_token')?.value;

    if (!accessToken) {
      return createErrorResponse('MISSING_TOKEN', 'Access token not found', 401);
    }

    // Verify access token
    const payload = verifyToken(accessToken);
    if (!payload) {
      return createErrorResponse('INVALID_TOKEN', 'Invalid access token', 401);
    }

    // Get user information
    const user = await User.findById(payload.userId).select('-passwordHash');
    if (!user || !user.isActive) {
      return createErrorResponse('USER_NOT_FOUND', 'User not found or inactive', 401);
    }

    return NextResponse.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to get user information', 500);
  }
}
