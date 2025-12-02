import { NextRequest } from 'next/server';
import { auditService } from '@/service/audit/audit-service';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import { successResponse, errorResponse, paginatedResponse } from '@/types/api';
import { auditLogQuerySchema } from '@/types/audit';
import { ErrorCodes } from '@/types/api';

export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request);
    await requirePermission(context, 'audit.read');

    const searchParams = request.nextUrl.searchParams;
    const query = {
      page: searchParams.get('page') || '1',
      pageSize: searchParams.get('pageSize') || '20',
      action: searchParams.get('action') || undefined,
      entity: searchParams.get('entity') || undefined,
      entityId: searchParams.get('entityId') || undefined,
      userId: searchParams.get('userId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
    };

    const validated = auditLogQuerySchema.parse(query);
    const result = await auditService.getAuditLogs(validated);

    return Response.json(paginatedResponse(result.data, validated.page, validated.pageSize, result.total));
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

