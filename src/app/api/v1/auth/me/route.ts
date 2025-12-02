import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/middleware/auth';
import { getUserPermissions, getUserRoles } from '@/lib/middleware/rbac';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/types/api';
import { ErrorCodes } from '@/types/api';

export async function GET(request: NextRequest) {
  try {
    const context = await getAuthContext(request);
    
    if (!context) {
      // Return a clear message that user is not logged in
      return Response.json(
        errorResponse(ErrorCodes.UNAUTHORIZED, 'Not logged in. Please log in to continue.'),
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: context.userId },
      include: {
        profile: true,
      },
    });

    if (!user) {
      return Response.json(
        errorResponse(ErrorCodes.NOT_FOUND, 'User not found'),
        { status: 404 }
      );
    }

    const roles = await getUserRoles(context.userId);
    const permissions = await getUserPermissions(context.userId);

    const authUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      isActive: user.isActive,
      isBlocked: user.isBlocked,
      roles,
      permissions,
      profile: user.profile ? {
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        displayName: user.profile.displayName,
        avatar: user.profile.avatar,
      } : undefined,
    };

    return Response.json(successResponse(authUser));
  } catch (error: any) {
    if (error.message === ErrorCodes.UNAUTHORIZED) {
      return Response.json(
        errorResponse(ErrorCodes.UNAUTHORIZED, 'Not logged in. Please log in to continue.'),
        { status: 401 }
      );
    }

    return Response.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, error.message || 'An error occurred'),
      { status: 500 }
    );
  }
}

