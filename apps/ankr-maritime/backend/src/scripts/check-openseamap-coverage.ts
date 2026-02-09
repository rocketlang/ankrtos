#!/usr/bin/env tsx
/**
 * Check OpenSeaMap Coverage for All Ports
 * Queries Overpass API to determine which ports have OSM/OpenSeaMap data
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { getPrisma } from '../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

const OVERPASS_API = 'https://overpass-api.de/api/interpreter';

interface OSMCoverage {
  portId: string;
  portName: string;
  unlocode: string;
  hasBerths: boolean;
  hasAnchorages: boolean;
  hasHarbor: boolean;
  hasTerminals: boolean;
  hasNavAids: boolean;
  totalFeatures: number;
}

async function checkPortCoverage(
  port: { id: string; name: string; unlocode: string; latitude: number; longitude: number },
  radiusKm: number = 10
): Promise<OSMCoverage> {
  const radiusMeters = radiusKm * 1000;

  // Overpass query to check for maritime features around the port
  const query = `
    [out:json][timeout:25];
    (
      node["seamark:type"~"harbour|berth|anchorage|terminal|light|buoy|beacon"](around:${radiusMeters},${port.latitude},${port.longitude});
      way["seamark:type"~"harbour|berth|anchorage|terminal|fairway"](around:${radiusMeters},${port.latitude},${port.longitude});
      relation["seamark:type"~"harbour|anchorage"](around:${radiusMeters},${port.latitude},${port.longitude});
    );
    out body;
  `;

  try {
    const response = await axios.post(OVERPASS_API, query, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 30000,
    });

    const elements = response.data.elements || [];

    const coverage: OSMCoverage = {
      portId: port.id,
      portName: port.name,
      unlocode: port.unlocode,
      hasBerths: false,
      hasAnchorages: false,
      hasHarbor: false,
      hasTerminals: false,
      hasNavAids: false,
      totalFeatures: elements.length,
    };

    elements.forEach((el: any) => {
      const type = el.tags?.['seamark:type'];
      if (type === 'berth') coverage.hasBerths = true;
      if (type === 'anchorage') coverage.hasAnchorages = true;
      if (type === 'harbour') coverage.hasHarbor = true;
      if (type === 'terminal') coverage.hasTerminals = true;
      if (['light', 'buoy', 'beacon'].includes(type)) coverage.hasNavAids = true;
    });

    // Save to database
    await prisma.port.update({
      where: { id: port.id },
      data: {
        hasOpenSeaMap: coverage.totalFeatures > 0,
        openSeaMapFeatureCount: coverage.totalFeatures,
        openSeaMapCoverage: {
          hasBerths: coverage.hasBerths,
          hasAnchorages: coverage.hasAnchorages,
          hasHarbor: coverage.hasHarbor,
          hasTerminals: coverage.hasTerminals,
          hasNavAids: coverage.hasNavAids,
        },
        openSeaMapCheckedAt: new Date(),
      },
    });

    return coverage;
  } catch (error: any) {
    console.error(`  ❌ Error checking ${port.name}: ${error.message}`);
    // Still update DB to mark as checked (with 0 features)
    try {
      await prisma.port.update({
        where: { id: port.id },
        data: {
          hasOpenSeaMap: false,
          openSeaMapFeatureCount: 0,
          openSeaMapCoverage: {
            hasBerths: false,
            hasAnchorages: false,
            hasHarbor: false,
            hasTerminals: false,
            hasNavAids: false,
          },
          openSeaMapCheckedAt: new Date(),
        },
      });
    } catch (dbError) {
      // Ignore DB errors
    }
    return {
      portId: port.id,
      portName: port.name,
      unlocode: port.unlocode,
      hasBerths: false,
      hasAnchorages: false,
      hasHarbor: false,
      hasTerminals: false,
      hasNavAids: false,
      totalFeatures: 0,
    };
  }
}

async function main() {
  console.log('='.repeat(80));
  console.log('OPENSEAMAP COVERAGE CHECK');
  console.log('='.repeat(80));
  console.log(`Started at: ${new Date().toISOString()}\n`);

  // Get all ports
  const ports = await prisma.port.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
    },
    orderBy: { country: 'asc' },
  });

  console.log(`📊 Total ports to check: ${ports.length}`);
  console.log(`⏱️  Estimated time: ${Math.ceil(ports.length / 4)} minutes (rate limited to 4 ports/min)\n`);
  console.log('⚠️  Note: Checking first 1000 ports as sample...\n');

  const samplePorts = ports.slice(0, 1000); // Check first 1000 ports
  const results: OSMCoverage[] = [];

  let processed = 0;
  for (const port of samplePorts) {
    processed++;
    process.stdout.write(`\r🔍 Checking ${processed}/${samplePorts.length}: ${port.name.padEnd(30)} `);

    const coverage = await checkPortCoverage(port);
    results.push(coverage);

    // Rate limiting: 4 requests per minute (Overpass API limit)
    if (processed % 4 === 0 && processed < samplePorts.length) {
      process.stdout.write('⏸️  Rate limiting (15s pause)...');
      await new Promise(resolve => setTimeout(resolve, 15000));
    }
  }

  console.log('\n\n' + '='.repeat(80));
  console.log('COVERAGE ANALYSIS');
  console.log('='.repeat(80));

  const portsWithData = results.filter(r => r.totalFeatures > 0);
  const portsWithBerths = results.filter(r => r.hasBerths);
  const portsWithAnchorages = results.filter(r => r.hasAnchorages);
  const portsWithHarbor = results.filter(r => r.hasHarbor);

  console.log(`\n📈 Coverage Statistics (Sample of ${samplePorts.length} ports):`);
  console.log(`   • Ports with ANY OSM data: ${portsWithData.length} (${Math.round(portsWithData.length / samplePorts.length * 100)}%)`);
  console.log(`   • Ports with berth data: ${portsWithBerths.length} (${Math.round(portsWithBerths.length / samplePorts.length * 100)}%)`);
  console.log(`   • Ports with anchorages: ${portsWithAnchorages.length} (${Math.round(portsWithAnchorages.length / samplePorts.length * 100)}%)`);
  console.log(`   • Ports with harbor areas: ${portsWithHarbor.length} (${Math.round(portsWithHarbor.length / samplePorts.length * 100)}%)`);

  console.log(`\n✅ Top 10 Ports by OSM Data Richness:`);
  const topPorts = results
    .sort((a, b) => b.totalFeatures - a.totalFeatures)
    .slice(0, 10);

  topPorts.forEach((port, idx) => {
    const features: string[] = [];
    if (port.hasBerths) features.push('berths');
    if (port.hasAnchorages) features.push('anchorages');
    if (port.hasHarbor) features.push('harbor');
    if (port.hasTerminals) features.push('terminals');
    if (port.hasNavAids) features.push('nav-aids');

    console.log(`   ${(idx + 1).toString().padStart(2)}. ${port.portName.padEnd(30)} - ${port.totalFeatures} features (${features.join(', ')})`);
  });

  console.log(`\n❌ Ports with NO OpenSeaMap data:`);
  const portsWithoutData = results.filter(r => r.totalFeatures === 0);
  console.log(`   Count: ${portsWithoutData.length}`);

  if (portsWithoutData.length > 0 && portsWithoutData.length <= 10) {
    portsWithoutData.forEach(port => {
      console.log(`   • ${port.portName} (${port.unlocode})`);
    });
  } else if (portsWithoutData.length > 10) {
    console.log(`   (Too many to list - ${portsWithoutData.length} ports have no data)`);
  }

  // Save results to file
  const fs = require('fs');
  const reportPath = '/root/apps/ankr-maritime/backend/OPENSEAMAP-COVERAGE-REPORT.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    checkedAt: new Date().toISOString(),
    totalChecked: samplePorts.length,
    results,
    summary: {
      portsWithData: portsWithData.length,
      portsWithBerths: portsWithBerths.length,
      portsWithAnchorages: portsWithAnchorages.length,
      portsWithHarbor: portsWithHarbor.length,
      coveragePercentage: Math.round(portsWithData.length / samplePorts.length * 100),
    }
  }, null, 2));

  console.log(`\n💾 Full report saved to: ${reportPath}`);
  console.log(`\n✅ Check completed at: ${new Date().toISOString()}`);

  await prisma.$disconnect();
}

main().catch(console.error);
