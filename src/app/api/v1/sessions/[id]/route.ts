import { NextRequest } from 'next/server';
import { sessionService } from '@/service/session/session-service';
import { requireAuth } from '@/lib/middleware/auth';
import { successResponse, errorResponse } from '@/types/api';
import { revokeSessionSchema } from '@/types/session';
import { ErrorCodes } from '@/types/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request);

    const result = await sessionService.getSession(params.id, context.userId);

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
        errorResponse(ErrorCodes.NOT_FOUND, 'Session not found'),
        { status: 404 }
      );
    }

    return Response.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, error.message || 'An error occurred'),
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request);
    const body = await request.json().catch(() => ({}));
    const validated = revokeSessionSchema.parse({ sessionId: params.id, ...body });

    await sessionService.revokeSession(validated, context.userId);

    return Response.json(successResponse({ message: 'Session revoked successfully' }));
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

    return Response.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, error.message || 'An error occurred'),
      { status: 500 }
    );
  }
}

