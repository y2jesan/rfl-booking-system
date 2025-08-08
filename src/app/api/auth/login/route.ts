import { comparePassword, signRefreshToken, signToken } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { createErrorResponse } from '@/lib/middleware/auth';
import { loginSchema } from '@/lib/validators/auth';
import User from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid input data', 400, validation.error);
    }

    const { email, password } = validation.data;

    // Find user
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return createErrorResponse('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      return createErrorResponse('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    // Generate tokens
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = signToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Create response
    const response = NextResponse.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      message: 'Login successful',
    });

    // Set HTTP-only cookies
    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
    });

    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Login failed', 500);
  }
}
