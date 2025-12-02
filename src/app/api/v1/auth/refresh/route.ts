import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/service/auth/auth-service';
import { successResponse, errorResponse } from '@/types/api';
import { ErrorCodes } from '@/types/api';
import { setAuthCookies, getRefreshTokenFromCookie, clearAuthCookies } from '@/lib/utils/cookies';

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie
    const refreshToken = getRefreshTokenFromCookie(request);
    
    if (!refreshToken) {
      const response = NextResponse.json(
        errorResponse(ErrorCodes.INVALID_TOKEN, 'Refresh token not found'),
        { status: 401 }
      );
      return clearAuthCookies(response);
    }

    const result = await authService.refreshToken({ refreshToken }, request);

    const response = NextResponse.json(successResponse(result));
    return setAuthCookies(response, result.accessToken, result.refreshToken);
  } catch (error: any) {
    const errorCode = error.message || ErrorCodes.INVALID_TOKEN;
    const response = NextResponse.json(
      errorResponse(errorCode, error.message || 'Invalid refresh token'),
      { status: 401 }
    );
    return clearAuthCookies(response);
  }
}

