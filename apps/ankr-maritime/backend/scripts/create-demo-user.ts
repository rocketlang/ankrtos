import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating demo user...');

  // Get the organization
  const org = await prisma.organization.findUnique({
    where: { code: 'ANKR-MAR' },
  });

  if (!org) {
    console.error('Organization not found. Run prisma db seed first.');
    process.exit(1);
  }

  // Create demo user
  const passwordHash = await bcrypt.hash('demo123', 10);
  const demo = await prisma.user.upsert({
    where: { email: 'demo@mari8x.com' },
    update: {
      passwordHash,
      role: 'viewer',
      name: 'Demo User',
    },
    create: {
      email: 'demo@mari8x.com',
      name: 'Demo User',
      passwordHash,
      role: 'viewer',
      organizationId: org.id,
    },
  });

  console.log('✅ Demo user created successfully:');
  console.log('   Email: demo@mari8x.com');
  console.log('   Password: demo123');
  console.log('   Role: viewer (limited access)');
  console.log('');
  console.log('Admin user (full access):');
  console.log('   Email: admin@ankr.in');
  console.log('   Password: admin123');
  console.log('   Role: admin');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
