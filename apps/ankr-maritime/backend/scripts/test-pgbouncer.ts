#!/usr/bin/env tsx
/**
 * Test PgBouncer Connection
 */

import { prisma } from '../src/lib/prisma.js';

async function main() {
  console.log('🔧 Testing PgBouncer Connection...\n');

  try {
    const portCount = await prisma.port.count();
    const tariffCount = await prisma.portTariff.count();
    const realTariffs = await prisma.portTariff.count({
      where: { dataSource: 'REAL_SCRAPED' }
    });

    console.log('✅ PgBouncer connection successful!');
    console.log('📊 Database Stats:');
    console.log(`   Ports: ${portCount}`);
    console.log(`   Total Tariffs: ${tariffCount}`);
    console.log(`   Real Tariffs: ${realTariffs}`);

    // Test a more complex query
    const realByPort = await prisma.portTariff.groupBy({
      by: ['portId'],
      where: { dataSource: 'REAL_SCRAPED' },
      _count: true
    });

    console.log(`\n📈 Real tariffs across ${realByPort.length} ports`);

    await prisma.$disconnect();
    console.log('\n✅ All tests passed! PgBouncer is working correctly.');

  } catch (error) {
    console.error('❌ PgBouncer test failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
