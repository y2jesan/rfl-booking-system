import { generateRandomPassword, hashPassword } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { createErrorResponse, withAuth } from '@/lib/middleware/auth';
import { createUserSchema, getUsersQuerySchema } from '@/lib/validators/user';
import User from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';

async function handleGET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validation = getUsersQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid query parameters', 400, validation.error);
    }

    const { page, limit, search, role } = validation.data;
    const skip = (page - 1) * limit;

    // Build query
    const query: Record<string, unknown> = {};

    if (search) {
      query.email = { $regex: search, $options: 'i' };
    }
    if (role) {
      query.role = role;
    }

    // Get users with pagination
    const [users, total] = await Promise.all([User.find(query).select('-passwordHash').sort({ createdAt: -1 }).skip(skip).limit(limit), User.countDocuments(query)]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to fetch users', 500);
  }
}

async function handlePOST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const validation = createUserSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid input data', 400, validation.error);
    }

    const { email, role } = validation.data;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return createErrorResponse('USER_EXISTS', 'User with this email already exists', 409);
    }

    // Generate random password
    const password = generateRandomPassword();
    const passwordHash = await hashPassword(password);

    // Create user
    const user = new User({
      email,
      passwordHash,
      role,
    });

    await user.save();

    return NextResponse.json(
      {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
        generatedPassword: password, // Return password only once
        message: 'User created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create user error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to create user', 500);
  }
}

export const GET = withAuth(handleGET, ['ADMIN']);
// export const POST = withAuth(handlePOST, ['ADMIN']);
export const POST = handlePOST;
