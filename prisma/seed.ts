import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { seedPermissions } from './seeds/permissions.seed';
import { seedRoles } from './seeds/roles.seed';
import { seedUsers } from './seeds/users.seed';

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

async function main() {
  console.log('🚀 Starting database seeding...\n');

  try {
    // Seed permissions first (roles depend on them)
    const permissions = await seedPermissions();

    // Seed roles (depends on permissions)
    const roles = await seedRoles(permissions);

    // Seed users (depends on roles)
    const users = await seedUsers(roles);

    console.log('✅ Database seeding completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - ${permissions.length} permissions`);
    console.log(`   - ${roles.length} roles`);
    console.log(`   - ${users.length} users`);
    console.log(`\n🔑 Default Login Credentials:`);
    console.log(`   Super Admin: admin@example.com / Admin@123`);
    console.log(`   Manager: manager@example.com / Manager@123`);
    console.log(`   User: user@example.com / User@123`);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

