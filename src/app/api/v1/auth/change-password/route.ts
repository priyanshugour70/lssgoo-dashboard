import { NextRequest } from 'next/server';
import { authService } from '@/service/auth/auth-service';
import { requireAuth } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/types/api';
import { changePasswordSchema } from '@/types/auth';
import { ErrorCodes } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request);
    const body = await request.json();
    const validated = changePasswordSchema.parse(body);

    await authService.changePassword(context.userId, validated);

    return Response.json(successResponse({ message: 'Password changed successfully' }));
  } catch (error: any) {
    if (error.message === ErrorCodes.UNAUTHORIZED) {
      return Response.json(
        errorResponse(ErrorCodes.UNAUTHORIZED, 'Unauthorized'),
        { status: 401 }
      );
    }

    if (error.name === 'ZodError') {
      return Response.json(
        errorResponse(ErrorCodes.VALIDATION_ERROR, 'Validation failed', error.errors),
        { status: 400 }
      );
    }

    const errorCode = error.message || ErrorCodes.INTERNAL_ERROR;
    return Response.json(
      errorResponse(errorCode, error.message || 'An error occurred'),
      { status: errorCode === ErrorCodes.INVALID_CREDENTIALS ? 401 : 500 }
    );
  }
}

