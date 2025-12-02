import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Create a new PrismaClient instance for seeding with adapter
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ['error', 'warn'],
});

export async function seedPermissions() {
  console.log('🌱 Seeding permissions...');

  const permissions = [
    // User Management Permissions
    {
      name: 'Create User',
      slug: 'user.create',
      description: 'Permission to create new users',
      category: 'user',
      isSystem: true,
    },
    {
      name: 'Read User',
      slug: 'user.read',
      description: 'Permission to view user details',
      category: 'user',
      isSystem: true,
    },
    {
      name: 'Update User',
      slug: 'user.update',
      description: 'Permission to update user information',
      category: 'user',
      isSystem: true,
    },
    {
      name: 'Delete User',
      slug: 'user.delete',
      description: 'Permission to delete users',
      category: 'user',
      isSystem: true,
    },
    {
      name: 'Manage User Roles',
      slug: 'user.manage-roles',
      description: 'Permission to assign/remove roles from users',
      category: 'user',
      isSystem: true,
    },
    {
      name: 'Block User',
      slug: 'user.block',
      description: 'Permission to block/unblock users',
      category: 'user',
      isSystem: true,
    },

    // Role Management Permissions
    {
      name: 'Create Role',
      slug: 'role.create',
      description: 'Permission to create new roles',
      category: 'role',
      isSystem: true,
    },
    {
      name: 'Read Role',
      slug: 'role.read',
      description: 'Permission to view role details',
      category: 'role',
      isSystem: true,
    },
    {
      name: 'Update Role',
      slug: 'role.update',
      description: 'Permission to update role information',
      category: 'role',
      isSystem: true,
    },
    {
      name: 'Delete Role',
      slug: 'role.delete',
      description: 'Permission to delete roles',
      category: 'role',
      isSystem: true,
    },
    {
      name: 'Manage Role Permissions',
      slug: 'role.manage-permissions',
      description: 'Permission to assign/remove permissions from roles',
      category: 'role',
      isSystem: true,
    },

    // Permission Management Permissions
    {
      name: 'Create Permission',
      slug: 'permission.create',
      description: 'Permission to create new permissions',
      category: 'permission',
      isSystem: true,
    },
    {
      name: 'Read Permission',
      slug: 'permission.read',
      description: 'Permission to view permission details',
      category: 'permission',
      isSystem: true,
    },
    {
      name: 'Update Permission',
      slug: 'permission.update',
      description: 'Permission to update permission information',
      category: 'permission',
      isSystem: true,
    },
    {
      name: 'Delete Permission',
      slug: 'permission.delete',
      description: 'Permission to delete permissions',
      category: 'permission',
      isSystem: true,
    },

    // Session Management Permissions
    {
      name: 'View Sessions',
      slug: 'session.read',
      description: 'Permission to view user sessions',
      category: 'session',
      isSystem: true,
    },
    {
      name: 'Revoke Session',
      slug: 'session.revoke',
      description: 'Permission to revoke user sessions',
      category: 'session',
      isSystem: true,
    },
    {
      name: 'Manage All Sessions',
      slug: 'session.manage',
      description: 'Permission to manage all user sessions',
      category: 'session',
      isSystem: true,
    },

    // Audit Log Permissions
    {
      name: 'View Audit Logs',
      slug: 'audit.read',
      description: 'Permission to view audit logs',
      category: 'audit',
      isSystem: true,
    },
    {
      name: 'Export Audit Logs',
      slug: 'audit.export',
      description: 'Permission to export audit logs',
      category: 'audit',
      isSystem: true,
    },

    // Dashboard Permissions
    {
      name: 'Access Dashboard',
      slug: 'dashboard.access',
      description: 'Permission to access admin dashboard',
      category: 'dashboard',
      isSystem: true,
    },
    {
      name: 'View Analytics',
      slug: 'dashboard.analytics',
      description: 'Permission to view dashboard analytics',
      category: 'dashboard',
      isSystem: true,
    },

    // Settings Permissions
    {
      name: 'Manage Settings',
      slug: 'settings.manage',
      description: 'Permission to manage system settings',
      category: 'settings',
      isSystem: true,
    },
    {
      name: 'View Settings',
      slug: 'settings.read',
      description: 'Permission to view system settings',
      category: 'settings',
      isSystem: true,
    },
  ];

  const createdPermissions = [];

  for (const permission of permissions) {
    const existing = await prisma.permission.findUnique({
      where: { slug: permission.slug },
    });

    if (existing) {
      console.log(`  ⏭️  Permission "${permission.slug}" already exists, skipping...`);
      createdPermissions.push(existing);
    } else {
      const created = await prisma.permission.create({
        data: permission,
      });
      console.log(`  ✅ Created permission: ${permission.slug}`);
      createdPermissions.push(created);
    }
  }

  console.log(`✅ Seeded ${createdPermissions.length} permissions\n`);
  return createdPermissions;
}

