/**
 * Seed Port Document Requirements
 *
 * Populates the database with document requirements for major ports.
 * Different ports have different requirements based on local regulations.
 *
 * Usage: npx tsx scripts/seed-document-requirements.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Port-specific document requirements
 * Based on actual port requirements as of 2026
 */
const PORT_REQUIREMENTS = {
  // Singapore (SGSIN)
  SGSIN: [
    { documentType: 'FAL1', mandatory: true, priority: 'CRITICAL', deadlineHours: 12 },
    { documentType: 'FAL2', mandatory: true, priority: 'CRITICAL', deadlineHours: 12 },
    { documentType: 'FAL5', mandatory: true, priority: 'CRITICAL', deadlineHours: 12 },
    { documentType: 'FAL7', mandatory: false, priority: 'CRITICAL', deadlineHours: 24 },
    { documentType: 'ISPS', mandatory: true, priority: 'CRITICAL', deadlineHours: 12 },
    { documentType: 'HEALTH_DECLARATION', mandatory: true, priority: 'CRITICAL', deadlineHours: 12 },
    { documentType: 'BALLAST_WATER', mandatory: true, priority: 'CRITICAL', deadlineHours: 24 },
    { documentType: 'PRE_ARRIVAL_NOTIFICATION', mandatory: true, priority: 'CRITICAL', deadlineHours: 24 },
    { documentType: 'PILOT_REQUEST', mandatory: true, priority: 'CRITICAL', deadlineHours: 12 }
  ],

  // Rotterdam (NLRTM)
  NLRTM: [
    { documentType: 'FAL1', mandatory: true, priority: 'CRITICAL', deadlineHours: 24 },
    { documentType: 'FAL2', mandatory: true, priority: 'CRITICAL', deadlineHours: 24 },
    { documentType: 'FAL3', mandatory: true, priority: 'IMPORTANT', deadlineHours: 24 },
    { documentType: 'FAL4', mandatory: true, priority: 'IMPORTANT', deadlineHours: 24 },
    { documentType: 'FAL5', mandatory: true, priority: 'CRITICAL', deadlineHours: 24 },
    { documentType: 'FAL7', mandatory: false, priority: 'CRITICAL', deadlineHours: 48 },
    { documentType: 'ISPS', mandatory: true, priority: 'CRITICAL', deadlineHours: 24 },
    { documentType: 'HEALTH_DECLARATION', mandatory: true, priority: 'CRITICAL', deadlineHours: 24 },
    { documentType: 'BALLAST_WATER', mandatory: true, priority: 'CRITICAL', deadlineHours: 48 },
    { documentType: 'WASTE_DECLARATION', mandatory: true, priority: 'IMPORTANT', deadlineHours: 24 },
    { documentType: 'CUSTOMS_DECLARATION', mandatory: true, priority: 'CRITICAL', deadlineHours: 24 },
    { documentType: 'PRE_ARRIVAL_NOTIFICATION', mandatory: true, priority: 'CRITICAL', deadlineHours: 48 }
  ],

  // Houston (USHOU)
  USHOU: [
    { documentType: 'FAL1', mandatory: true, priority: 'CRITICAL', deadlineHours: 96 }, // US requires 96h notice
    { documentType: 'FAL2', mandatory: true, priority: 'CRITICAL', deadlineHours: 96 },
    { documentType: 'FAL5', mandatory: true, priority: 'CRITICAL', deadlineHours: 96 },
    { documentType: 'FAL7', mandatory: false, priority: 'CRITICAL', deadlineHours: 96 },
    { documentType: 'ISPS', mandatory: true, priority: 'CRITICAL', deadlineHours: 96 },
    { documentType: 'HEALTH_DECLARATION', mandatory: true, priority: 'CRITICAL', deadlineHours: 96 },
    { documentType: 'BALLAST_WATER', mandatory: true, priority: 'CRITICAL', deadlineHours: 96 },
    { documentType: 'CUSTOMS_DECLARATION', mandatory: true, priority: 'CRITICAL', deadlineHours: 96 },
    { documentType: 'PRE_ARRIVAL_NOTIFICATION', mandatory: true, priority: 'CRITICAL', deadlineHours: 96 }
  ],

  // Mumbai (INMUN)
  INMUN: [
    { documentType: 'FAL1', mandatory: true, priority: 'CRITICAL', deadlineHours: 24 },
    { documentType: 'FAL2', mandatory: true, priority: 'CRITICAL', deadlineHours: 24 },
    { documentType: 'FAL5', mandatory: true, priority: 'CRITICAL', deadlineHours: 24 },
    { documentType: 'ISPS', mandatory: true, priority: 'CRITICAL', deadlineHours: 24 },
    { documentType: 'HEALTH_DECLARATION', mandatory: true, priority: 'CRITICAL', deadlineHours: 24 },
    { documentType: 'BALLAST_WATER', mandatory: true, priority: 'CRITICAL', deadlineHours: 48 },
    { documentType: 'CUSTOMS_DECLARATION', mandatory: true, priority: 'CRITICAL', deadlineHours: 24 },
    { documentType: 'PRE_ARRIVAL_NOTIFICATION', mandatory: true, priority: 'CRITICAL', deadlineHours: 48 }
  ],

  // Shanghai (CNSHA)
  CNSHA: [
    { documentType: 'FAL1', mandatory: true, priority: 'CRITICAL', deadlineHours: 24 },
    { documentType: 'FAL2', mandatory: true, priority: 'CRITICAL', deadlineHours: 24 },
    { documentType: 'FAL5', mandatory: true, priority: 'CRITICAL', deadlineHours: 24 },
    { documentType: 'ISPS', mandatory: true, priority: 'CRITICAL', deadlineHours: 24 },
    { documentType: 'HEALTH_DECLARATION', mandatory: true, priority: 'CRITICAL', deadlineHours: 24 },
    { documentType: 'BALLAST_WATER', mandatory: true, priority: 'CRITICAL', deadlineHours: 48 },
    { documentType: 'CUSTOMS_DECLARATION', mandatory: true, priority: 'CRITICAL', deadlineHours: 24 },
    { documentType: 'PRE_ARRIVAL_NOTIFICATION', mandatory: true, priority: 'CRITICAL', deadlineHours: 48 }
  ],

  // Hamburg (DEHAM)
  DEHAM: [
    { documentType: 'FAL1', mandatory: true, priority: 'CRITICAL', deadlineHours: 24 },
    { documentType: 'FAL2', mandatory: true, priority: 'CRITICAL', deadlineHours: 24 },
    { documentType: 'FAL5', mandatory: true, priority: 'CRITICAL', deadlineHours: 24 },
    { documentType: 'ISPS', mandatory: true, priority: 'CRITICAL', deadlineHours: 24 },
    { documentType: 'HEALTH_DECLARATION', mandatory: true, priority: 'CRITICAL', deadlineHours: 24 },
    { documentType: 'BALLAST_WATER', mandatory: true, priority: 'CRITICAL', deadlineHours: 48 },
    { documentType: 'WASTE_DECLARATION', mandatory: true, priority: 'IMPORTANT', deadlineHours: 24 },
    { documentType: 'PRE_ARRIVAL_NOTIFICATION', mandatory: true, priority: 'CRITICAL', deadlineHours: 48 }
  ],

  // Dubai (AEJEA)
  AEJEA: [
    { documentType: 'FAL1', mandatory: true, priority: 'CRITICAL', deadlineHours: 24 },
    { documentType: 'FAL2', mandatory: true, priority: 'CRITICAL', deadlineHours: 24 },
    { documentType: 'FAL5', mandatory: true, priority: 'CRITICAL', deadlineHours: 24 },
    { documentType: 'ISPS', mandatory: true, priority: 'CRITICAL', deadlineHours: 24 },
    { documentType: 'HEALTH_DECLARATION', mandatory: true, priority: 'CRITICAL', deadlineHours: 24 },
    { documentType: 'BALLAST_WATER', mandatory: true, priority: 'CRITICAL', deadlineHours: 48 },
    { documentType: 'PRE_ARRIVAL_NOTIFICATION', mandatory: true, priority: 'CRITICAL', deadlineHours: 48 }
  ]
};

async function main() {
  console.log('🌊 Seeding Port Document Requirements...\n');

  let totalRequirements = 0;
  let totalPorts = 0;

  for (const [unlocode, requirements] of Object.entries(PORT_REQUIREMENTS)) {
    // Find port by unlocode
    const port = await prisma.port.findUnique({
      where: { unlocode }
    });

    if (!port) {
      console.warn(`⚠️  Port ${unlocode} not found in database, skipping...`);
      continue;
    }

    console.log(`📋 ${port.name} (${unlocode}):`);

    // Delete existing requirements for this port
    await prisma.portDocumentRequirement.deleteMany({
      where: { portId: port.id }
    });

    // Create new requirements
    for (const req of requirements) {
      await prisma.portDocumentRequirement.create({
        data: {
          portId: port.id,
          documentType: req.documentType,
          required: true,
          mandatory: req.mandatory,
          priority: req.priority,
          deadlineHours: req.deadlineHours
        }
      });

      totalRequirements++;
      console.log(`  ✓ ${req.documentType} (${req.deadlineHours}h before ETA, ${req.priority})`);
    }

    totalPorts++;
    console.log(`  → ${requirements.length} documents configured\n`);
  }

  console.log('✅ Seeding complete!');
  console.log(`📊 Summary:`);
  console.log(`   - Ports configured: ${totalPorts}`);
  console.log(`   - Total requirements: ${totalRequirements}`);
  console.log(`   - Average per port: ${Math.round(totalRequirements / totalPorts)}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding document requirements:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
