#!/usr/bin/env tsx
/**
 * Compute Port Congestion from Live AIS Data
 *
 * Analyzes vessel positions near major ports to calculate:
 * - Vessels waiting (anchored near port)
 * - Average wait time
 * - Congestion level
 *
 * Run: npx tsx src/scripts/compute-port-congestion.ts
 * Cron: Every 1 hour (recommended)
 */

import { prisma } from '../lib/prisma.js';

const PORT_RADIUS_KM = 20; // 20km radius around port

interface PortCongestionData {
  portId: string;
  portName: string;
  vesselsWaiting: number;
  avgWaitTimeHours: number;
  congestionLevel: 'low' | 'medium' | 'high' | 'critical';
}

async function computePortCongestion() {
  console.log('🚢 Computing port congestion from live AIS data...\n');

  try {
    // Get major ports with coordinates
    const ports = await prisma.port.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
        importance: { in: ['major', 'medium'] }, // Focus on major ports
      },
      select: {
        id: true,
        name: true,
        unlocode: true,
        latitude: true,
        longitude: true,
        country: true,
      },
      take: 100, // Process top 100 ports
    });

    console.log(`📍 Analyzing ${ports.length} major ports...\n`);

    const congestionData: PortCongestionData[] = [];
    let processedCount = 0;

    for (const port of ports) {
      if (!port.latitude || !port.longitude) continue;

      // Find vessels within 20km of port
      const vesselsNearPort = await prisma.$queryRaw<Array<{
        vessel_id: string;
        speed: number | null;
        navigation_status: number | null;
        timestamp: Date;
        hours_in_area: number;
      }>>`
        WITH latest_positions AS (
          SELECT DISTINCT ON ("vesselId")
            "vesselId" as vessel_id,
            speed,
            "navigationStatus" as navigation_status,
            timestamp,
            EXTRACT(EPOCH FROM (NOW() - timestamp)) / 3600 as hours_in_area
          FROM vessel_positions
          WHERE ST_DWithin(
            ST_MakePoint(${port.longitude}, ${port.latitude})::geography,
            ST_MakePoint(longitude, latitude)::geography,
            ${PORT_RADIUS_KM * 1000}
          )
          AND timestamp > NOW() - INTERVAL '24 hours'
          ORDER BY "vesselId", timestamp DESC
        )
        SELECT * FROM latest_positions
        WHERE hours_in_area < 72
      `;

      // Count vessels that are waiting (anchored or very slow)
      const vesselsWaiting = vesselsNearPort.filter(
        v => (v.speed !== null && v.speed < 0.5) || v.navigation_status === 1 || v.navigation_status === 5
      ).length;

      // Calculate average wait time (for vessels that are waiting)
      const waitingVessels = vesselsNearPort.filter(
        v => (v.speed !== null && v.speed < 0.5) || v.navigation_status === 1
      );
      const avgWaitTimeHours = waitingVessels.length > 0
        ? waitingVessels.reduce((sum, v) => sum + v.hours_in_area, 0) / waitingVessels.length
        : 0;

      // Determine congestion level
      let congestionLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (vesselsWaiting >= 20) congestionLevel = 'critical';
      else if (vesselsWaiting >= 10) congestionLevel = 'high';
      else if (vesselsWaiting >= 5) congestionLevel = 'medium';

      // Store in database
      if (vesselsWaiting > 0) {
        await prisma.portCongestion.create({
          data: {
            portId: port.id,
            portName: port.name,
            vesselsWaiting,
            avgWaitTimeHours: Math.round(avgWaitTimeHours * 10) / 10,
            timestamp: new Date(),
          },
        });

        congestionData.push({
          portId: port.id,
          portName: port.name,
          vesselsWaiting,
          avgWaitTimeHours: Math.round(avgWaitTimeHours * 10) / 10,
          congestionLevel,
        });
      }

      processedCount++;
      if (processedCount % 10 === 0) {
        console.log(`   ✓ Processed ${processedCount}/${ports.length} ports...`);
      }
    }

    console.log(`\n✅ Port congestion computed for ${congestionData.length} ports with activity\n`);

    // Show top 10 congested ports
    const topCongested = congestionData
      .sort((a, b) => b.vesselsWaiting - a.vesselsWaiting)
      .slice(0, 10);

    console.log('🔴 Top 10 Congested Ports:');
    console.log('═'.repeat(80));
    topCongested.forEach((port, idx) => {
      const level = port.congestionLevel.toUpperCase().padEnd(8);
      const waiting = `${port.vesselsWaiting} vessels`.padEnd(15);
      const waitTime = `${port.avgWaitTimeHours.toFixed(1)}h avg wait`.padEnd(15);
      console.log(`${(idx + 1).toString().padStart(2)}. ${port.portName.padEnd(30)} ${level} ${waiting} ${waitTime}`);
    });

    console.log('\n💾 Data saved to database (PortCongestion table)');
    console.log('📊 Query: portCongestionData(limit: 10)');

  } catch (error) {
    console.error('❌ Error computing port congestion:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run
computePortCongestion();
