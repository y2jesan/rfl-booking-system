import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { verifyRefreshToken, signToken, signRefreshToken } from '@/lib/auth';
import { createErrorResponse } from '@/lib/middleware/auth';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const refreshToken = request.cookies.get('refresh_token')?.value;

    if (!refreshToken) {
      return createErrorResponse('MISSING_TOKEN', 'Refresh token not found', 401);
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return createErrorResponse('INVALID_TOKEN', 'Invalid refresh token', 401);
    }

    // Verify user still exists and is active
    const user = await User.findById(payload.userId);
    if (!user || !user.isActive) {
      return createErrorResponse('USER_NOT_FOUND', 'User not found or inactive', 401);
    }

    // Generate new tokens
    const newPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const newAccessToken = signToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload);

    // Create response
    const response = NextResponse.json({
      message: 'Token refreshed successfully',
    });

    // Set new HTTP-only cookies
    response.cookies.set('access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
    });

    response.cookies.set('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Token refresh error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Token refresh failed', 500);
  }
}

