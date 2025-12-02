import { NextRequest } from 'next/server';
import { userService } from '@/service/user/user-service';
import { requireAuth } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/types/api';
import { updateProfileSchema } from '@/types/user';
import { ErrorCodes } from '@/types/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request);
    
    if (params.id !== context.userId) {
      return Response.json(
        errorResponse(ErrorCodes.FORBIDDEN, 'You can only view your own profile'),
        { status: 403 }
      );
    }

    const user = await userService.getUser(params.id);
    
    return Response.json(successResponse(user.profile || null));
  } catch (error: any) {
    if (error.message === ErrorCodes.UNAUTHORIZED) {
      return Response.json(
        errorResponse(ErrorCodes.UNAUTHORIZED, 'Unauthorized'),
        { status: 401 }
      );
    }

    return Response.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, error.message || 'An error occurred'),
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request);
    
    if (params.id !== context.userId) {
      return Response.json(
        errorResponse(ErrorCodes.FORBIDDEN, 'You can only update your own profile'),
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = updateProfileSchema.parse(body);

    const result = await userService.updateProfile(params.id, validated);

    return Response.json(successResponse(result));
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

    return Response.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, error.message || 'An error occurred'),
      { status: 500 }
    );
  }
}

