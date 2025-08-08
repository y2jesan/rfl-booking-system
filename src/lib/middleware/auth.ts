import { getUserFromRequest, JWTPayload } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export interface AuthenticatedRequest extends NextRequest {
  user: JWTPayload;
}

export function withAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>, requiredRoles?: ('ADMIN' | 'STAFF' | 'USER')[]) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const user = getUserFromRequest(req);

      if (!user) {
        return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
      }

      if (requiredRoles && !requiredRoles.includes(user.role)) {
        return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } }, { status: 403 });
      }

      // Add user to request
      (req as AuthenticatedRequest).user = user;

      return handler(req as AuthenticatedRequest);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Authentication error' } }, { status: 500 });
    }
  };
}

export function createErrorResponse(code: string, message: string, status: number = 400, details?: unknown) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}
