import { NextRequest } from 'next/server';
import { rbacService } from '@/service/rbac/rbac-service';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import { successResponse, errorResponse } from '@/types/api';
import { updatePermissionSchema } from '@/types/rbac';
import { ErrorCodes } from '@/types/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request);
    await requirePermission(context, 'permission.read');

    const result = await rbacService.getPermission(params.id);

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
        errorResponse(ErrorCodes.NOT_FOUND, 'Permission not found'),
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
    await requirePermission(context, 'permission.update');

    const body = await request.json();
    const validated = updatePermissionSchema.parse(body);

    const result = await rbacService.updatePermission(params.id, validated, context.userId);

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
    await requirePermission(context, 'permission.delete');

    await rbacService.deletePermission(params.id, context.userId);

    return Response.json(successResponse({ message: 'Permission deleted successfully' }));
  } catch (error: any) {
    if (error.message === ErrorCodes.UNAUTHORIZED || error.message === ErrorCodes.FORBIDDEN) {
      return Response.json(
        errorResponse(error.message, 'Unauthorized'),
        { status: error.message === ErrorCodes.UNAUTHORIZED ? 401 : 403 }
      );
    }

    if (error.message === ErrorCodes.NOT_FOUND) {
      return Response.json(
        errorResponse(ErrorCodes.NOT_FOUND, 'Permission not found'),
        { status: 404 }
      );
    }

    return Response.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, error.message || 'An error occurred'),
      { status: 500 }
    );
  }
}

