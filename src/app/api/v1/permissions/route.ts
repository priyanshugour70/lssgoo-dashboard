import { NextRequest } from 'next/server';
import { rbacService } from '@/service/rbac/rbac-service';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import { successResponse, errorResponse, paginatedResponse } from '@/types/api';
import { createPermissionSchema } from '@/types/rbac';
import { ErrorCodes } from '@/types/api';

export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request);
    await requirePermission(context, 'permission.read');

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const category = searchParams.get('category') || undefined;

    const result = await rbacService.getPermissions(page, pageSize, category);

    return Response.json(paginatedResponse(result.data, page, pageSize, result.total));
  } catch (error: any) {
    if (error.message === ErrorCodes.UNAUTHORIZED || error.message === ErrorCodes.FORBIDDEN) {
      return Response.json(
        errorResponse(error.message, 'Unauthorized'),
        { status: error.message === ErrorCodes.UNAUTHORIZED ? 401 : 403 }
      );
    }

    return Response.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, error.message || 'An error occurred'),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request);
    await requirePermission(context, 'permission.create');

    const body = await request.json();
    const validated = createPermissionSchema.parse(body);

    const result = await rbacService.createPermission(validated, context.userId);

    return Response.json(successResponse(result), { status: 201 });
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
      { status: errorCode === ErrorCodes.ALREADY_EXISTS ? 409 : 500 }
    );
  }
}

