import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/service/auth/auth-service';
import { successResponse, errorResponse } from '@/types/api';
import { registerSchema } from '@/types/auth';
import { ErrorCodes } from '@/types/api';
import { setAuthCookies } from '@/lib/utils/cookies';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerSchema.parse(body);

    const result = await authService.register(validated);

    const response = NextResponse.json(successResponse(result));
    return setAuthCookies(response, result.tokens.accessToken, result.tokens.refreshToken);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return Response.json(
        errorResponse(ErrorCodes.VALIDATION_ERROR, 'Validation failed', error.errors),
        { status: 400 }
      );
    }

    const errorCode = error.message || ErrorCodes.INTERNAL_ERROR;
    return Response.json(
      errorResponse(errorCode, error.message || 'An error occurred'),
      { status: errorCode === ErrorCodes.ALREADY_EXISTS ? 409 : 500 }
    );
  }
}

