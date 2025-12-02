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

export async function seedRoles(permissions: any[]) {
  console.log('🌱 Seeding roles...');

  // Helper to find permission by slug
  const findPermission = (slug: string) => {
    return permissions.find((p) => p.slug === slug);
  };

  const roles = [
    {
      name: 'Super Admin',
      slug: 'super-admin',
      description: 'Full system access with all permissions',
      level: 100,
      color: '#ff4d4f',
      isSystem: true,
      permissions: [
        'user.create',
        'user.read',
        'user.update',
        'user.delete',
        'user.manage-roles',
        'user.block',
        'role.create',
        'role.read',
        'role.update',
        'role.delete',
        'role.manage-permissions',
        'permission.create',
        'permission.read',
        'permission.update',
        'permission.delete',
        'session.read',
        'session.revoke',
        'session.manage',
        'audit.read',
        'audit.export',
        'dashboard.access',
        'dashboard.analytics',
        'settings.manage',
        'settings.read',
      ],
    },
    {
      name: 'Admin',
      slug: 'admin',
      description: 'Administrator with most permissions except system-critical ones',
      level: 90,
      color: '#1890ff',
      isSystem: true,
      permissions: [
        'user.create',
        'user.read',
        'user.update',
        'user.delete',
        'user.manage-roles',
        'user.block',
        'role.create',
        'role.read',
        'role.update',
        'role.delete',
        'role.manage-permissions',
        'permission.create',
        'permission.read',
        'permission.update',
        'permission.delete',
        'session.read',
        'session.revoke',
        'session.manage',
        'audit.read',
        'audit.export',
        'dashboard.access',
        'dashboard.analytics',
        'settings.read',
      ],
    },
    {
      name: 'Manager',
      slug: 'manager',
      description: 'Manager with user management and viewing permissions',
      level: 50,
      color: '#52c41a',
      isSystem: true,
      permissions: [
        'user.create',
        'user.read',
        'user.update',
        'user.read',
        'session.read',
        'audit.read',
        'dashboard.access',
        'settings.read',
      ],
    },
    {
      name: 'Moderator',
      slug: 'moderator',
      description: 'Moderator with limited user management permissions',
      level: 30,
      color: '#faad14',
      isSystem: true,
      permissions: [
        'user.read',
        'user.update',
        'user.block',
        'session.read',
        'session.revoke',
        'audit.read',
        'dashboard.access',
      ],
    },
    {
      name: 'User',
      slug: 'user',
      description: 'Regular user with basic permissions',
      level: 10,
      color: '#8c8c8c',
      isSystem: true,
      permissions: [
        'user.read', // Can view their own profile
        'settings.read',
      ],
    },
  ];

  const createdRoles = [];

  for (const roleData of roles) {
    const { permissions: permissionSlugs, ...roleInfo } = roleData;

    // Check if role exists
    const existing = await prisma.role.findUnique({
      where: { slug: roleInfo.slug },
      include: { rolePermissions: true },
    });

    let role;
    if (existing) {
      console.log(`  ⏭️  Role "${roleInfo.slug}" already exists, updating...`);
      role = await prisma.role.update({
        where: { id: existing.id },
        data: roleInfo,
      });
    } else {
      role = await prisma.role.create({
        data: roleInfo,
      });
      console.log(`  ✅ Created role: ${roleInfo.slug}`);
    }

    // Assign permissions to role
    if (permissionSlugs && permissionSlugs.length > 0) {
      // Delete existing role permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId: role.id },
      });

      // Create new role permissions
      for (const permissionSlug of permissionSlugs) {
        const permission = findPermission(permissionSlug);
        if (permission) {
          await prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: role.id,
                permissionId: permission.id,
              },
            },
            update: {
              granted: true,
            },
            create: {
              roleId: role.id,
              permissionId: permission.id,
              granted: true,
            },
          });
        }
      }
      console.log(`  ✅ Assigned ${permissionSlugs.length} permissions to role: ${roleInfo.slug}`);
    }

    createdRoles.push(role);
  }

  console.log(`✅ Seeded ${createdRoles.length} roles\n`);
  return createdRoles;
}

