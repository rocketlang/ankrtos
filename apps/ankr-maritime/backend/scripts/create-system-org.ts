#!/usr/bin/env tsx
import { prisma } from '../src/lib/prisma.js';

async function createSystemOrg() {
  try {
    const org = await prisma.organization.upsert({
      where: { id: 'system' },
      create: {
        id: 'system',
        code: 'SYS',
        name: 'System Organization',
        type: 'shipping_company',
      },
      update: {},
    });

    console.log('✅ System organization ready:', org.name);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }

  await prisma.$disconnect();
}

createSystemOrg();
