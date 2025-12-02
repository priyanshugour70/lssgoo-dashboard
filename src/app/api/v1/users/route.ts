import { NextRequest } from 'next/server';
import { userService } from '@/service/user/user-service';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import { successResponse, errorResponse, paginatedResponse } from '@/types/api';
import { createUserSchema } from '@/types/user';
import { ErrorCodes } from '@/types/api';

export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request);
    await requirePermission(context, 'user.read');

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const search = searchParams.get('search') || undefined;

    const result = await userService.getUsers(page, pageSize, search);

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
    await requirePermission(context, 'user.create');

    const body = await request.json();
    const validated = createUserSchema.parse(body);

    const result = await userService.createUser(validated, context.userId);

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

