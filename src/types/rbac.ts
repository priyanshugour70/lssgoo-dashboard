import { z } from 'zod';

// Role Schemas
export const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  slug: z.string().min(1, 'Role slug is required'),
  description: z.string().optional(),
  level: z.number().int().min(0).default(0),
  color: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateRoleSchema = createRoleSchema.partial();

export const assignRoleSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  roleId: z.string().min(1, 'Role ID is required'),
  expiresAt: z.string().datetime().optional(),
});

// Permission Schemas
export const createPermissionSchema = z.object({
  name: z.string().min(1, 'Permission name is required'),
  slug: z.string().min(1, 'Permission slug is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updatePermissionSchema = createPermissionSchema.partial();

export const assignPermissionSchema = z.object({
  roleId: z.string().min(1, 'Role ID is required'),
  permissionId: z.string().min(1, 'Permission ID is required'),
  granted: z.boolean().default(true),
});

// Types
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>;
export type AssignPermissionInput = z.infer<typeof assignPermissionSchema>;

// Response Types
export interface Role {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  level: number;
  isActive: boolean;
  isSystem: boolean;
  color: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  permissions?: Permission[];
  userCount?: number;
}

export interface Permission {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  isActive: boolean;
  isSystem: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  role: Role;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  granted: boolean;
  createdAt: string;
  permission: Permission;
}

