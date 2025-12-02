import { NextRequest } from 'next/server';
import { sessionService } from '@/service/session/session-service';
import { requireAuth } from '@/lib/middleware/auth';
import { successResponse, errorResponse, paginatedResponse } from '@/types/api';
import { ErrorCodes } from '@/types/api';

export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request);

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const result = await sessionService.getSessions(context.userId, page, pageSize);

    return Response.json(paginatedResponse(result.data, page, pageSize, result.total));
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

