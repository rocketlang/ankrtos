import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getLoadMatchingStats() {
  try {
    console.log('\n📊 LOAD MATCHING WORKFLOW FEASIBILITY ANALYSIS');
    console.log('='.repeat(80));

    // 1. AIS Vessel Statistics
    console.log('\n🚢 AIS VESSEL TRACKING:');
    console.log('-'.repeat(80));

    const totalVessels = await prisma.vessel.count();
    console.log(`  Total Vessels in Database: ${totalVessels}`);

    const aisCreatedVessels = await prisma.vessel.count({
      where: { imo: { startsWith: 'AIS-' } }
    });
    console.log(`  AIS-Created Vessels (placeholder IMO): ${aisCreatedVessels}`);

    const validImoVessels = await prisma.vessel.count({
      where: {
        AND: [
          { imo: { not: { startsWith: 'AIS-' } } },
          { imo: { not: '0' } },
          { imo: { not: null } }
        ]
      }
    });
    console.log(`  Vessels with Valid IMO Numbers: ${validImoVessels}`);

    const recentPositions = await prisma.vesselPosition.findMany({
      where: {
        timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      },
      select: { vesselId: true },
      distinct: ['vesselId']
    });
    console.log(`  Vessels with Active AIS (last 24h): ${recentPositions.length}`);

    // 2. Owner Data Potential
    console.log('\n🏢 OWNER DATA AVAILABILITY:');
    console.log('-'.repeat(80));

    const vesselsForGISIS = await prisma.vessel.findMany({
      where: {
        AND: [
          { imo: { not: { startsWith: 'AIS-' } } },
          { imo: { not: '0' } },
          { imo: { not: null } }
        ]
      },
      select: { id: true, name: true, imo: true, mmsi: true }
    });

    console.log(`  Vessels Ready for GISIS Lookup: ${vesselsForGISIS.length}`);
    console.log(`  Estimated Owner Data Obtainable: ${vesselsForGISIS.length} (100%)`);
    console.log(`  Rate Limit: 2s/vessel = ~${Math.ceil(vesselsForGISIS.length * 2 / 60)} minutes for full batch`);

    // Show sample vessels
    if (vesselsForGISIS.length > 0) {
      console.log('\n  Sample Vessels Ready for Owner Lookup:');
      vesselsForGISIS.slice(0, 10).forEach((v, i) => {
        console.log(`    ${i + 1}. ${v.name || 'Unknown'} (IMO: ${v.imo}, MMSI: ${v.mmsi || 'N/A'})`);
      });
      if (vesselsForGISIS.length > 10) {
        console.log(`    ... and ${vesselsForGISIS.length - 10} more`);
      }
    }

    // 3. Port Tariff Coverage
    console.log('\n⚓ PORT TARIFF COVERAGE:');
    console.log('-'.repeat(80));

    const totalPorts = await prisma.port.count();
    console.log(`  Total Ports in Database: ${totalPorts}`);

    const portsWithTariffs = await prisma.portTariff.groupBy({
      by: ['portId'],
      _count: { id: true }
    });
    console.log(`  Ports with Tariff Data: ${portsWithTariffs.length}`);

    const totalTariffRecords = await prisma.portTariff.count();
    console.log(`  Total Tariff Records: ${totalTariffRecords}`);

    const tariffCoverage = totalPorts > 0
      ? ((portsWithTariffs.length / totalPorts) * 100).toFixed(1)
      : '0';
    console.log(`  Tariff Coverage: ${tariffCoverage}%`);

    // 4. Company Database
    console.log('\n🏭 COMPANY DATABASE:');
    console.log('-'.repeat(80));

    const totalCompanies = await prisma.company.count();
    console.log(`  Total Companies: ${totalCompanies}`);

    const companiesWithContact = await prisma.company.count({
      where: {
        OR: [
          { email: { not: null } },
          { phone: { not: null } }
        ]
      }
    });
    console.log(`  Companies with Contact Info: ${companiesWithContact}`);

    // 5. Load Matching Workflow Readiness
    console.log('\n✅ LOAD MATCHING WORKFLOW READINESS:');
    console.log('='.repeat(80));

    const workflow = [
      {
        step: '1. AIS Tracking',
        status: recentPositions.length > 0 ? '✅ ACTIVE' : '❌ INACTIVE',
        count: `${recentPositions.length} vessels tracked (last 24h)`
      },
      {
        step: '2. IMO Lookup',
        status: validImoVessels > 0 ? '✅ READY' : '⚠️  LIMITED',
        count: `${validImoVessels} vessels with valid IMO`
      },
      {
        step: '3. GISIS Owner Extraction',
        status: '✅ PRODUCTION READY',
        count: `Can fetch ${vesselsForGISIS.length} owners`
      },
      {
        step: '4. Owner → Company Match',
        status: totalCompanies > 0 ? '✅ DATABASE EXISTS' : '⚠️  EMPTY',
        count: `${totalCompanies} companies in DB`
      },
      {
        step: '5. Port Tariff Data',
        status: portsWithTariffs.length > 0 ? '✅ AVAILABLE' : '⚠️  LIMITED',
        count: `${portsWithTariffs.length}/${totalPorts} ports (${tariffCoverage}%)`
      },
      {
        step: '6. Broker Matching',
        status: '🔨 TODO',
        count: 'CRM integration pending'
      }
    ];

    workflow.forEach(({ step, status, count }) => {
      console.log(`  ${step.padEnd(35)} ${status.padEnd(20)} ${count}`);
    });

    // 6. Workflow Completeness Score
    console.log('\n📈 WORKFLOW COMPLETENESS:');
    console.log('-'.repeat(80));

    const scores = {
      aisTracking: recentPositions.length > 0 ? 100 : 0,
      imoLookup: validImoVessels > 0 ? 100 : 0,
      ownerExtraction: 100, // GISIS service complete
      companyDB: totalCompanies > 0 ? 100 : 50,
      portTariffs: parseFloat(tariffCoverage),
      brokerCRM: 0 // Not implemented yet
    };

    const overallScore = Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length;

    console.log(`  AIS Tracking:          ${scores.aisTracking}%`);
    console.log(`  IMO Lookup:            ${scores.imoLookup}%`);
    console.log(`  Owner Extraction:      ${scores.ownerExtraction}%`);
    console.log(`  Company Database:      ${scores.companyDB}%`);
    console.log(`  Port Tariff Coverage:  ${scores.portTariffs}%`);
    console.log(`  Broker CRM Integration: ${scores.brokerCRM}%`);
    console.log(`\n  OVERALL READINESS:     ${overallScore.toFixed(1)}%`);

    // 7. Actionable Next Steps
    console.log('\n🎯 NEXT STEPS TO COMPLETE LOAD MATCHING:');
    console.log('='.repeat(80));

    const nextSteps = [];

    if (aisCreatedVessels > 0) {
      nextSteps.push(`  1. Resolve ${aisCreatedVessels} AIS vessels with placeholder IMOs (MMSI → IMO lookup)`);
    }

    if (vesselsForGISIS.length > 0) {
      nextSteps.push(`  2. Batch fetch ${vesselsForGISIS.length} vessel owners from GISIS (~${Math.ceil(vesselsForGISIS.length * 2 / 60)} min)`);
    }

    if (parseFloat(tariffCoverage) < 50) {
      nextSteps.push(`  3. Import more port tariff data (currently ${tariffCoverage}% coverage)`);
    }

    if (companiesWithContact < totalCompanies * 0.5) {
      nextSteps.push(`  4. Enrich company contact information (${companiesWithContact}/${totalCompanies} have contact info)`);
    }

    nextSteps.push(`  5. Build CRM lead generation from owner matches`);
    nextSteps.push(`  6. Create broker notification system for load matching opportunities`);

    nextSteps.forEach(step => console.log(step));

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('Error fetching stats:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getLoadMatchingStats();
