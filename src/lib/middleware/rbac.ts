import { prisma } from '@/lib/prisma';
import { AuthContext } from './auth';
import { ErrorCodes } from '@/types/api';

export async function hasPermission(
  userId: string,
  permission: string
): Promise<boolean> {
  // @ts-expect-error - userRole is a valid Prisma model, TypeScript cache issue
  const userRoles = await prisma.userRole.findMany({
    where: {
      userId,
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    include: {
      role: {
        include: {
          rolePermissions: {
            where: {
              granted: true,
            },
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  for (const userRole of userRoles) {
    if (!userRole.role.isActive) continue;

    for (const rolePermission of userRole.role.rolePermissions) {
      if (rolePermission.permission.slug === permission && rolePermission.permission.isActive) {
        return true;
      }
    }
  }

  return false;
}

export async function hasRole(userId: string, roleSlug: string): Promise<boolean> {
  // @ts-expect-error - userRole is a valid Prisma model, TypeScript cache issue
  const userRole = await prisma.userRole.findFirst({
    where: {
      userId,
      role: {
        slug: roleSlug,
        isActive: true,
      },
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
  });

  return !!userRole;
}

export async function hasAnyRole(userId: string, roleSlugs: string[]): Promise<boolean> {
  for (const roleSlug of roleSlugs) {
    if (await hasRole(userId, roleSlug)) {
      return true;
    }
  }
  return false;
}

export async function requirePermission(
  context: AuthContext,
  permission: string
): Promise<void> {
  const hasPerm = await hasPermission(context.userId, permission);
  if (!hasPerm) {
    throw new Error(ErrorCodes.FORBIDDEN);
  }
}

export async function requireRole(
  context: AuthContext,
  roleSlug: string
): Promise<void> {
  const hasRolePerm = await hasRole(context.userId, roleSlug);
  if (!hasRolePerm) {
    throw new Error(ErrorCodes.FORBIDDEN);
  }
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  // @ts-expect-error - userRole is a valid Prisma model, TypeScript cache issue
  const userRoles = await prisma.userRole.findMany({
    where: {
      userId,
      isActive: true,
      role: {
        isActive: true,
      },
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    include: {
      role: {
        include: {
          rolePermissions: {
            where: {
              granted: true,
            },
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  const permissions = new Set<string>();
  for (const userRole of userRoles) {
    if (!userRole.role || !userRole.role.isActive) continue;
    for (const rolePermission of userRole.role.rolePermissions) {
      if (rolePermission.permission && rolePermission.permission.isActive) {
        permissions.add(rolePermission.permission.slug);
      }
    }
  }

  return Array.from(permissions);
}

export async function getUserRoles(userId: string): Promise<string[]> {
  // @ts-expect-error - userRole is a valid Prisma model, TypeScript cache issue
  const userRoles = await prisma.userRole.findMany({
    where: {
      userId,
      isActive: true,
      role: {
        isActive: true,
      },
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    include: {
      role: true,
    },
  });

  return userRoles
    .filter((ur: any) => ur.role && ur.role.isActive)
    .map((ur: any) => ur.role.slug)
    .filter(Boolean);
}

