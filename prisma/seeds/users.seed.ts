import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
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

export async function seedUsers(roles: any[]) {
  console.log('🌱 Seeding users...');

  // Helper to find role by slug
  const findRole = (slug: string) => {
    return roles.find((r) => r.slug === slug);
  };

  const users = [
    {
      email: 'admin@example.com',
      password: 'Admin@123', // Will be hashed
      name: 'Super Admin',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      isActive: true,
      isBlocked: false,
      roles: ['super-admin'],
    },
    {
      email: 'manager@example.com',
      password: 'Manager@123',
      name: 'Manager User',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      isActive: true,
      isBlocked: false,
      roles: ['manager'],
    },
    {
      email: 'user@example.com',
      password: 'User@123',
      name: 'Regular User',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      isActive: true,
      isBlocked: false,
      roles: ['user'],
    },
  ];

  const createdUsers = [];

  for (const userData of users) {
    const { roles: roleSlugs, password, ...userInfo } = userData;

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email: userInfo.email },
      include: { userRoles: true },
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    let user;
    if (existing) {
      console.log(`  ⏭️  User "${userInfo.email}" already exists, updating...`);
      user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          ...userInfo,
          password: hashedPassword,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          ...userInfo,
          password: hashedPassword,
        },
      });
      console.log(`  ✅ Created user: ${userInfo.email}`);
    }

    // Assign roles to user
    if (roleSlugs && roleSlugs.length > 0) {
      // Delete existing user roles
      await prisma.userRole.deleteMany({
        where: { userId: user.id },
      });

      // Create new user roles
      for (const roleSlug of roleSlugs) {
        const role = findRole(roleSlug);
        if (role) {
          await prisma.userRole.create({
            data: {
              userId: user.id,
              roleId: role.id,
              isActive: true,
            },
          });
        }
      }
      console.log(`  ✅ Assigned ${roleSlugs.length} roles to user: ${userInfo.email}`);
    }

    createdUsers.push(user);
  }

  console.log(`✅ Seeded ${createdUsers.length} users\n`);
  return createdUsers;
}

