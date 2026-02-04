#!/usr/bin/env tsx
import { prisma } from '../src/lib/prisma.js';

async function test() {
  console.log('Testing vessel creation with all required fields...\n');

  try {
    const vessel = await prisma.vessel.create({
      data: {
        mmsi: 'TEST123456789',
        name: 'TEST VESSEL',
        imo: '9999999',
        type: 'general_cargo',
        flag: 'US',
        vesselType: 'Cargo',
        organizationId: 'system',
      }
    });

    console.log('✅ SUCCESS! Vessel created:');
    console.log(vessel);

    // Clean up
    await prisma.vessel.delete({ where: { id: vessel.id } });
    console.log('\n✅ Test vessel deleted');
  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
  }

  await prisma.$disconnect();
}

test();
