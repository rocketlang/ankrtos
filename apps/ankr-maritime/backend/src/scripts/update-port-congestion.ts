#!/usr/bin/env tsx
/**
 * Port Congestion Update Script
 * Generates congestion snapshots for monitored ports using AIS data
 */

import { PortCongestionAnalyzerService } from '../services/arrival-intelligence/port-congestion-analyzer.service.js';
import { getPrisma } from '../lib/db.js';

const MONITORED_PORTS = [
  'SGSIN', // Singapore
  'NLRTM', // Rotterdam
  'USHOU', // Houston
  'INMUN', // Mumbai (Nhava Sheva)
  'CNSHA', // Shanghai
  'DEHAM', // Hamburg
  'AEJEA', // Jebel Ali (Dubai)
  'USNYC', // New York
  'USLAX', // Los Angeles
  'HKHKG', // Hong Kong
];

async function main() {
  console.log('🚀 Port Congestion Update - Mari8x');
  console.log('═'.repeat(80));
  console.log();

  const prisma = await getPrisma();
  const congestionAnalyzer = new PortCongestionAnalyzerService(prisma);

  const startTime = Date.now();
  let successCount = 0;
  let errorCount = 0;

  console.log(`📊 Monitoring ${MONITORED_PORTS.length} major ports\n`);

  for (const unlocode of MONITORED_PORTS) {
    try {
      // Find port by unlocode
      const port = await prisma.port.findUnique({
        where: { unlocode }
      });

      if (!port) {
        console.log(`⚠️  ${unlocode.padEnd(6)} - Port not found in database`);
        continue;
      }

      console.log(`🚢 ${unlocode.padEnd(6)} - ${port.name} (${port.country})`);

      // Create congestion snapshot
      await congestionAnalyzer.createCongestionSnapshot(port.id);

      // Get latest snapshot to display
      const snapshot = await prisma.portCongestionSnapshot.findFirst({
        where: { portId: port.id },
        orderBy: { timestamp: 'desc' }
      });

      if (snapshot) {
        console.log(`   ✅ Vessels: ${snapshot.vesselCount} total (${snapshot.mooredCount} moored, ${snapshot.anchoredCount} anchored)`);
        console.log(`   📈 Wait time: ${snapshot.avgWaitTimeHours?.toFixed(1) || '0'} hours`);
        console.log(`   🎯 Status: ${snapshot.congestionLevel.toUpperCase()}`);
      }

      successCount++;
      console.log();

    } catch (error) {
      console.error(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      errorCount++;
      console.log();
    }
  }

  const duration = Date.now() - startTime;

  console.log('═'.repeat(80));
  console.log('\n✅ Port Congestion Update Complete');
  console.log(`   Snapshots Created: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log(`   Duration: ${(duration / 1000).toFixed(2)}s\n`);

  // Show summary by congestion level
  console.log('📊 Congestion Summary:');
  const summary = await prisma.$queryRaw<Array<{ congestion_level: string; count: bigint }>>`
    SELECT "congestionLevel" as congestion_level, COUNT(*) as count
    FROM (
      SELECT DISTINCT ON ("portId") "portId", "congestionLevel"
      FROM port_congestion_snapshots
      ORDER BY "portId", "timestamp" DESC
    ) latest
    GROUP BY "congestionLevel"
    ORDER BY "congestionLevel" DESC;
  `;

  summary.forEach(row => {
    const emoji = row.congestion_level === 'LOW' ? '🟢' : row.congestion_level === 'HIGH' ? '🟡' : '🔴';
    console.log(`   ${emoji} ${row.congestion_level.padEnd(10).toUpperCase()} - ${row.count} ports`);
  });

  console.log('\n' + '═'.repeat(80));
}

main()
  .catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    const prisma = await getPrisma();
    await prisma.$disconnect();
  });
