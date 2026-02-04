import { prisma } from './src/lib/prisma.js';

async function main() {
  console.log('\n=== SEEDED DATA COUNTS ===\n');

  // Port Tariffs
  const tariffCount = await prisma.portTariff.count();
  const uniquePortsWithTariffs = await prisma.portTariff.groupBy({
    by: ['portId']
  });

  console.log('📊 PORT TARIFFS:');
  console.log(`   Total tariff records: ${tariffCount}`);
  console.log(`   Unique ports with tariffs: ${uniquePortsWithTariffs.length}`);

  // Vessels
  const totalVessels = await prisma.vessel.count();
  const aisVessels = await prisma.vessel.count({
    where: { imo: { startsWith: 'AIS-' } }
  });

  console.log('\n🚢 VESSELS:');
  console.log(`   Total vessels: ${totalVessels}`);
  console.log(`   AIS vessels: ${aisVessels}`);
  console.log(`   Real IMO vessels: ${totalVessels - aisVessels}`);

  // Positions
  const positionCount = await prisma.vesselPosition.count();
  const vesselsWithPositions = await prisma.vesselPosition.groupBy({
    by: ['vesselId']
  });

  console.log('\n📡 VESSEL POSITIONS:');
  console.log(`   Total position records: ${positionCount}`);
  console.log(`   Unique vessels tracked: ${vesselsWithPositions.length}`);

  // Ownership
  const ownershipCache = await prisma.vesselOwnershipCache.count();
  const vesselsWithOwner = await prisma.vessel.count({
    where: { registeredOwner: { not: null } }
  });

  console.log('\n🏢 IMO GISIS OWNERSHIP:');
  console.log(`   Ownership cache records: ${ownershipCache}`);
  console.log(`   Vessels with owner data: ${vesselsWithOwner}`);

  // Ports
  const totalPorts = await prisma.port.count();
  console.log('\n🌍 PORTS:');
  console.log(`   Total ports: ${totalPorts}`);

  console.log('\n===================\n');

  await prisma.$disconnect();
}

main().catch(console.error);
