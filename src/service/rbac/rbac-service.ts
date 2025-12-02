import { prisma } from '@/lib/prisma';
import { createAuditLog, getChanges } from '@/lib/utils/audit';
import type {
  CreateRoleInput,
  UpdateRoleInput,
  AssignRoleInput,
  CreatePermissionInput,
  UpdatePermissionInput,
  AssignPermissionInput,
  Role,
  Permission,
} from '@/types/rbac';
import { ErrorCodes } from '@/types/api';

export class RBACService {
  // Role Management
  async createRole(input: CreateRoleInput, userId: string): Promise<Role> {
    // Check if role with same name or slug exists
    const existing = await prisma.role.findFirst({
      where: {
        OR: [
          { name: input.name },
          { slug: input.slug },
        ],
      },
    });

    if (existing) {
      throw new Error(ErrorCodes.ALREADY_EXISTS);
    }

    const role = await prisma.role.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description || null,
        level: input.level || 0,
        color: input.color || null,
        metadata: input.metadata || null,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    await createAuditLog({
      action: 'role.created',
      entity: 'Role',
      entityId: role.id,
      userId,
      newValues: {
        name: role.name,
        slug: role.slug,
        level: role.level,
      },
    });

    return this.formatRole(role);
  }

  async updateRole(id: string, input: UpdateRoleInput, userId: string): Promise<Role> {
    const existing = await prisma.role.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error(ErrorCodes.NOT_FOUND);
    }

    if (existing.isSystem) {
      throw new Error(ErrorCodes.FORBIDDEN);
    }

    // Check for conflicts
    if (input.name || input.slug) {
      const conflict = await prisma.role.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                input.name ? { name: input.name } : {},
                input.slug ? { slug: input.slug } : {},
              ],
            },
          ],
        },
      });

      if (conflict) {
        throw new Error(ErrorCodes.ALREADY_EXISTS);
      }
    }

    const oldValues = {
      name: existing.name,
      slug: existing.slug,
      description: existing.description,
      level: existing.level,
      color: existing.color,
    };

    const role = await prisma.role.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.slug && { slug: input.slug }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.level !== undefined && { level: input.level }),
        ...(input.color !== undefined && { color: input.color }),
        ...(input.metadata !== undefined && { metadata: input.metadata }),
        updatedBy: userId,
      },
    });

    const changes = getChanges(oldValues, {
      name: role.name,
      slug: role.slug,
      description: role.description,
      level: role.level,
      color: role.color,
    });

    await createAuditLog({
      action: 'role.updated',
      entity: 'Role',
      entityId: role.id,
      userId,
      oldValues: changes.oldValues,
      newValues: changes.newValues,
    });

    return this.formatRole(role);
  }

  async deleteRole(id: string, userId: string): Promise<void> {
    const role = await prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new Error(ErrorCodes.NOT_FOUND);
    }

    if (role.isSystem) {
      throw new Error(ErrorCodes.FORBIDDEN);
    }

    await prisma.role.delete({
      where: { id },
    });

    await createAuditLog({
      action: 'role.deleted',
      entity: 'Role',
      entityId: id,
      userId,
      oldValues: {
        name: role.name,
        slug: role.slug,
      },
    });
  }

  async getRole(id: string): Promise<Role> {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
    });

    if (!role) {
      throw new Error(ErrorCodes.NOT_FOUND);
    }

    return {
      ...this.formatRole(role),
      permissions: role.rolePermissions
        .filter(rp => rp.granted && rp.permission.isActive)
        .map(rp => this.formatPermission(rp.permission)),
      userCount: role._count.userRoles,
    };
  }

  async getRoles(page: number = 1, pageSize: number = 20): Promise<{
    data: Role[];
    total: number;
  }> {
    const skip = (page - 1) * pageSize;

    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        skip,
        take: pageSize,
        orderBy: { level: 'desc' },
        include: {
          _count: {
            select: {
              userRoles: true,
            },
          },
        },
      }),
      prisma.role.count(),
    ]);

    return {
      data: roles.map(role => ({
        ...this.formatRole(role),
        userCount: role._count.userRoles,
      })),
      total,
    };
  }

  // Permission Management
  async createPermission(input: CreatePermissionInput, userId: string): Promise<Permission> {
    const existing = await prisma.permission.findFirst({
      where: {
        OR: [
          { name: input.name },
          { slug: input.slug },
        ],
      },
    });

    if (existing) {
      throw new Error(ErrorCodes.ALREADY_EXISTS);
    }

    const permission = await prisma.permission.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description || null,
        category: input.category || null,
        metadata: input.metadata || null,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    await createAuditLog({
      action: 'permission.created',
      entity: 'Permission',
      entityId: permission.id,
      userId,
      newValues: {
        name: permission.name,
        slug: permission.slug,
        category: permission.category,
      },
    });

    return this.formatPermission(permission);
  }

  async updatePermission(id: string, input: UpdatePermissionInput, userId: string): Promise<Permission> {
    const existing = await prisma.permission.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error(ErrorCodes.NOT_FOUND);
    }

    if (existing.isSystem) {
      throw new Error(ErrorCodes.FORBIDDEN);
    }

    if (input.name || input.slug) {
      const conflict = await prisma.permission.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                input.name ? { name: input.name } : {},
                input.slug ? { slug: input.slug } : {},
              ],
            },
          ],
        },
      });

      if (conflict) {
        throw new Error(ErrorCodes.ALREADY_EXISTS);
      }
    }

    const oldValues = {
      name: existing.name,
      slug: existing.slug,
      description: existing.description,
      category: existing.category,
    };

    const permission = await prisma.permission.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.slug && { slug: input.slug }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.metadata !== undefined && { metadata: input.metadata }),
        updatedBy: userId,
      },
    });

    const changes = getChanges(oldValues, {
      name: permission.name,
      slug: permission.slug,
      description: permission.description,
      category: permission.category,
    });

    await createAuditLog({
      action: 'permission.updated',
      entity: 'Permission',
      entityId: permission.id,
      userId,
      oldValues: changes.oldValues,
      newValues: changes.newValues,
    });

    return this.formatPermission(permission);
  }

  async deletePermission(id: string, userId: string): Promise<void> {
    const permission = await prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new Error(ErrorCodes.NOT_FOUND);
    }

    if (permission.isSystem) {
      throw new Error(ErrorCodes.FORBIDDEN);
    }

    await prisma.permission.delete({
      where: { id },
    });

    await createAuditLog({
      action: 'permission.deleted',
      entity: 'Permission',
      entityId: id,
      userId,
      oldValues: {
        name: permission.name,
        slug: permission.slug,
      },
    });
  }

  async getPermission(id: string): Promise<Permission> {
    const permission = await prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new Error(ErrorCodes.NOT_FOUND);
    }

    return this.formatPermission(permission);
  }

  async getPermissions(page: number = 1, pageSize: number = 20, category?: string): Promise<{
    data: Permission[];
    total: number;
  }> {
    const skip = (page - 1) * pageSize;

    const where = category ? { category } : {};

    const [permissions, total] = await Promise.all([
      prisma.permission.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { name: 'asc' },
      }),
      prisma.permission.count({ where }),
    ]);

    return {
      data: permissions.map(p => this.formatPermission(p)),
      total,
    };
  }

  // Role Assignment
  async assignRole(input: AssignRoleInput, assignedBy: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
    });

    if (!user) {
      throw new Error(ErrorCodes.NOT_FOUND);
    }

    const role = await prisma.role.findUnique({
      where: { id: input.roleId },
    });

    if (!role || !role.isActive) {
      throw new Error(ErrorCodes.NOT_FOUND);
    }

    const existing = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: input.userId,
          roleId: input.roleId,
        },
      },
    });

    if (existing) {
      // Update existing assignment
      await prisma.userRole.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
          assignedBy,
        },
      });
    } else {
      // Create new assignment
      await prisma.userRole.create({
        data: {
          userId: input.userId,
          roleId: input.roleId,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
          assignedBy,
        },
      });
    }

    await createAuditLog({
      action: 'role.assigned',
      entity: 'UserRole',
      entityId: input.userId,
      userId: assignedBy,
      newValues: {
        userId: input.userId,
        roleId: input.roleId,
        roleName: role.name,
      },
    });
  }

  async revokeRole(userId: string, roleId: string, revokedBy: string): Promise<void> {
    const userRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
      include: {
        role: true,
      },
    });

    if (!userRole) {
      throw new Error(ErrorCodes.NOT_FOUND);
    }

    await prisma.userRole.update({
      where: { id: userRole.id },
      data: {
        isActive: false,
      },
    });

    await createAuditLog({
      action: 'role.revoked',
      entity: 'UserRole',
      entityId: userId,
      userId: revokedBy,
      oldValues: {
        userId,
        roleId,
        roleName: userRole.role.name,
      },
    });
  }

  // Permission Assignment
  async assignPermission(input: AssignPermissionInput, assignedBy: string): Promise<void> {
    const role = await prisma.role.findUnique({
      where: { id: input.roleId },
    });

    if (!role) {
      throw new Error(ErrorCodes.NOT_FOUND);
    }

    const permission = await prisma.permission.findUnique({
      where: { id: input.permissionId },
    });

    if (!permission || !permission.isActive) {
      throw new Error(ErrorCodes.NOT_FOUND);
    }

    const existing = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId: input.roleId,
          permissionId: input.permissionId,
        },
      },
    });

    if (existing) {
      await prisma.rolePermission.update({
        where: { id: existing.id },
        data: {
          granted: input.granted,
          assignedBy,
        },
      });
    } else {
      await prisma.rolePermission.create({
        data: {
          roleId: input.roleId,
          permissionId: input.permissionId,
          granted: input.granted,
          assignedBy,
        },
      });
    }

    await createAuditLog({
      action: 'permission.assigned',
      entity: 'RolePermission',
      entityId: input.roleId,
      userId: assignedBy,
      newValues: {
        roleId: input.roleId,
        permissionId: input.permissionId,
        granted: input.granted,
        permissionName: permission.name,
      },
    });
  }

  async revokePermission(roleId: string, permissionId: string, revokedBy: string): Promise<void> {
    const rolePermission = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
      include: {
        permission: true,
      },
    });

    if (!rolePermission) {
      throw new Error(ErrorCodes.NOT_FOUND);
    }

    await prisma.rolePermission.delete({
      where: { id: rolePermission.id },
    });

    await createAuditLog({
      action: 'permission.revoked',
      entity: 'RolePermission',
      entityId: roleId,
      userId: revokedBy,
      oldValues: {
        roleId,
        permissionId,
        permissionName: rolePermission.permission.name,
      },
    });
  }

  // Helper methods
  private formatRole(role: any): Role {
    return {
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      level: role.level,
      isActive: role.isActive,
      isSystem: role.isSystem,
      color: role.color,
      metadata: role.metadata,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    };
  }

  private formatPermission(permission: any): Permission {
    return {
      id: permission.id,
      name: permission.name,
      slug: permission.slug,
      description: permission.description,
      category: permission.category,
      isActive: permission.isActive,
      isSystem: permission.isSystem,
      metadata: permission.metadata,
      createdAt: permission.createdAt.toISOString(),
      updatedAt: permission.updatedAt.toISOString(),
    };
  }
}

export const rbacService = new RBACService();

