import { NextRequest } from 'next/server';
import { userService } from '@/service/user/user-service';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import { successResponse, errorResponse } from '@/types/api';
import { updateUserSchema } from '@/types/user';
import { ErrorCodes } from '@/types/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request);
    
    // Users can view their own profile, admins can view any
    if (params.id !== context.userId) {
      await requirePermission(context, 'user.read');
    }

    const result = await userService.getUser(params.id);

    return Response.json(successResponse(result));
  } catch (error: any) {
    if (error.message === ErrorCodes.UNAUTHORIZED || error.message === ErrorCodes.FORBIDDEN) {
      return Response.json(
        errorResponse(error.message, 'Unauthorized'),
        { status: error.message === ErrorCodes.UNAUTHORIZED ? 401 : 403 }
      );
    }

    if (error.message === ErrorCodes.NOT_FOUND) {
      return Response.json(
        errorResponse(ErrorCodes.NOT_FOUND, 'User not found'),
        { status: 404 }
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
    
    // Users can update their own profile, admins can update any
    if (params.id !== context.userId) {
      await requirePermission(context, 'user.update');
    }

    const body = await request.json();
    const validated = updateUserSchema.parse(body);

    const result = await userService.updateUser(params.id, validated, context.userId);

    return Response.json(successResponse(result));
  } catch (error: any) {
    if (error.message === ErrorCodes.UNAUTHORIZED || error.message === ErrorCodes.FORBIDDEN) {
      return Response.json(
        errorResponse(error.message, 'Unauthorized'),
        { status: error.message === ErrorCodes.UNAUTHORIZED ? 401 : 403 }
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
      { status: errorCode === ErrorCodes.NOT_FOUND ? 404 : errorCode === ErrorCodes.ALREADY_EXISTS ? 409 : 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request);
    await requirePermission(context, 'user.delete');

    await userService.deleteUser(params.id, context.userId);

    return Response.json(successResponse({ message: 'User deleted successfully' }));
  } catch (error: any) {
    if (error.message === ErrorCodes.UNAUTHORIZED || error.message === ErrorCodes.FORBIDDEN) {
      return Response.json(
        errorResponse(error.message, 'Unauthorized'),
        { status: error.message === ErrorCodes.UNAUTHORIZED ? 401 : 403 }
      );
    }

    if (error.message === ErrorCodes.NOT_FOUND) {
      return Response.json(
        errorResponse(ErrorCodes.NOT_FOUND, 'User not found'),
        { status: 404 }
      );
    }

    return Response.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, error.message || 'An error occurred'),
      { status: 500 }
    );
  }
}

