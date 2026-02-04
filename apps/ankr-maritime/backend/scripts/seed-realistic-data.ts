/**
 * Seed Realistic Maritime Data
 * Created: February 4, 2026
 * Purpose: Populate database with production-like test data
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting realistic data seeding...\n');

  // Clear existing data (be careful in production!)
  console.log('🗑️  Clearing existing data...');
  await prisma.voyage.deleteMany();
  await prisma.charter.deleteMany();
  await prisma.saleListing.deleteMany();
  await prisma.vessel.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
  console.log('✅ Existing data cleared\n');

  // 1. Create Organizations (Multi-tenant)
  console.log('📦 Creating organizations...');
  const org1 = await prisma.organization.create({
    data: {
      name: 'ANKR Shipping Ltd',
      code: 'ANKR',
      country: 'IN',
      tier: 'ENTERPRISE',
      isActive: true,
    },
  });

  const org2 = await prisma.organization.create({
    data: {
      name: 'Hellenic Maritime SA',
      code: 'HEL',
      country: 'GR',
      tier: 'AGENCY',
      isActive: true,
    },
  });

  const org3 = await prisma.organization.create({
    data: {
      name: 'Singapore Marine Pte Ltd',
      code: 'SGM',
      country: 'SG',
      tier: 'PRO',
      isActive: true,
    },
  });
  console.log('✅ Created 3 organizations\n');

  // 2. Create Users
  console.log('👥 Creating users...');
  const hashedPassword = await bcrypt.hash('Test@1234', 10);

  const user1 = await prisma.user.create({
    data: {
      email: 'admin@ankrshipping.com',
      passwordHash: hashedPassword,
      firstName: 'Rajesh',
      lastName: 'Kumar',
      role: 'admin',
      organizationId: org1.id,
      isActive: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'chartering@hellenic.gr',
      passwordHash: hashedPassword,
      firstName: 'Dimitris',
      lastName: 'Papadopoulos',
      role: 'user',
      organizationId: org2.id,
      isActive: true,
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'ops@sgmarine.com.sg',
      passwordHash: hashedPassword,
      firstName: 'Wei',
      lastName: 'Chen',
      role: 'user',
      organizationId: org3.id,
      isActive: true,
    },
  });
  console.log('✅ Created 3 users (password: Test@1234)\n');

  console.log('🎉 Basic seed data complete! Run full seed for vessels & charters\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
