import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/service/auth/auth-service';
import { getAuthContext } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/types/api';
import { ErrorCodes } from '@/types/api';
import { clearAuthCookies, getRefreshTokenFromCookie } from '@/lib/utils/cookies';

export async function POST(request: NextRequest) {
  try {
    const context = await getAuthContext(request);
    
    if (context) {
      await authService.logout(context.userId);
    }

    const response = NextResponse.json(successResponse({ message: 'Logged out successfully' }));
    return clearAuthCookies(response);
  } catch (error: any) {
    // Even if logout fails, clear cookies
    const response = NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, error.message || 'An error occurred'),
      { status: 500 }
    );
    return clearAuthCookies(response);
  }
}

