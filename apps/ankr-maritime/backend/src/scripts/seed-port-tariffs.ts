#!/usr/bin/env tsx
/**
 * Global Port Tariff Seeder
 * Seeds comprehensive tariff data for major global ports
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TariffEntry {
  portUnlocode: string;
  chargeName: string;
  chargeType: string;
  amount: number;
  currency: string;
  unit: string;
  description?: string;
}

// Comprehensive tariff database for major ports
const globalTariffs: TariffEntry[] = [
  // INDIA - Major Ports
  ...generatePortTariffs('INNSA', 'JNPT', 'INR', {
    pilotage: { inward: 25000, outward: 25000 },
    portDues: { per_grt: 2.5 },
    berth: { per_hour: 5000 },
    tug: { per_hour: 15000 },
    mooring: { per_operation: 8000 },
  }),
  ...generatePortTariffs('INBOM', 'Mumbai', 'INR', {
    pilotage: { inward: 22000, outward: 22000 },
    portDues: { per_grt: 2.3 },
    berth: { per_hour: 4500 },
    tug: { per_hour: 14000 },
    mooring: { per_operation: 7500 },
  }),
  ...generatePortTariffs('INMAA', 'Chennai', 'INR', {
    pilotage: { inward: 20000, outward: 20000 },
    portDues: { per_grt: 2.2 },
    berth: { per_hour: 4000 },
    tug: { per_hour: 13000 },
    mooring: { per_operation: 7000 },
  }),

  // MIDDLE EAST
  ...generatePortTariffs('AEDXB', 'Dubai', 'USD', {
    pilotage: { inward: 2500, outward: 2500 },
    portDues: { per_grt: 0.85 },
    berth: { per_hour: 450 },
    tug: { per_hour: 1800 },
    mooring: { per_operation: 800 },
  }),
  ...generatePortTariffs('AEJEA', 'Jebel Ali', 'USD', {
    pilotage: { inward: 2200, outward: 2200 },
    portDues: { per_grt: 0.80 },
    berth: { per_hour: 420 },
    tug: { per_hour: 1750 },
    mooring: { per_operation: 750 },
  }),
  ...generatePortTariffs('SAJED', 'Jeddah', 'USD', {
    pilotage: { inward: 2000, outward: 2000 },
    portDues: { per_grt: 0.75 },
    berth: { per_hour: 400 },
    tug: { per_hour: 1600 },
    mooring: { per_operation: 700 },
  }),

  // ASIA - Major Ports
  ...generatePortTariffs('SGSIN', 'Singapore', 'USD', {
    pilotage: { inward: 1800, outward: 1800 },
    portDues: { per_grt: 0.60 },
    berth: { per_hour: 350 },
    tug: { per_hour: 1500 },
    mooring: { per_operation: 650 },
  }),
  ...generatePortTariffs('CNSHG', 'Shanghai', 'USD', {
    pilotage: { inward: 2200, outward: 2200 },
    portDues: { per_grt: 0.70 },
    berth: { per_hour: 400 },
    tug: { per_hour: 1600 },
    mooring: { per_operation: 700 },
  }),
  ...generatePortTariffs('HKHKG', 'Hong Kong', 'USD', {
    pilotage: { inward: 1900, outward: 1900 },
    portDues: { per_grt: 0.65 },
    berth: { per_hour: 380 },
    tug: { per_hour: 1550 },
    mooring: { per_operation: 680 },
  }),

  // EUROPE
  ...generatePortTariffs('NLRTM', 'Rotterdam', 'EUR', {
    pilotage: { inward: 1600, outward: 1600 },
    portDues: { per_grt: 0.55 },
    berth: { per_hour: 320 },
    tug: { per_hour: 1400 },
    mooring: { per_operation: 600 },
  }),
  ...generatePortTariffs('DEHAM', 'Hamburg', 'EUR', {
    pilotage: { inward: 1500, outward: 1500 },
    portDues: { per_grt: 0.52 },
    berth: { per_hour: 310 },
    tug: { per_hour: 1350 },
    mooring: { per_operation: 580 },
  }),
  ...generatePortTariffs('BEANR', 'Antwerp', 'EUR', {
    pilotage: { inward: 1450, outward: 1450 },
    portDues: { per_grt: 0.50 },
    berth: { per_hour: 300 },
    tug: { per_hour: 1300 },
    mooring: { per_operation: 560 },
  }),

  // AMERICAS
  ...generatePortTariffs('USLAX', 'Los Angeles', 'USD', {
    pilotage: { inward: 2800, outward: 2800 },
    portDues: { per_grt: 0.90 },
    berth: { per_hour: 500 },
    tug: { per_hour: 1900 },
    mooring: { per_operation: 850 },
  }),
  ...generatePortTariffs('USNYC', 'New York', 'USD', {
    pilotage: { inward: 3000, outward: 3000 },
    portDues: { per_grt: 0.95 },
    berth: { per_hour: 520 },
    tug: { per_hour: 2000 },
    mooring: { per_operation: 900 },
  }),
  ...generatePortTariffs('BRSSZ', 'Santos', 'USD', {
    pilotage: { inward: 2400, outward: 2400 },
    portDues: { per_grt: 0.80 },
    berth: { per_hour: 450 },
    tug: { per_hour: 1700 },
    mooring: { per_operation: 750 },
  }),
];

function generatePortTariffs(
  unlocode: string,
  portName: string,
  currency: string,
  rates: any
): TariffEntry[] {
  const tariffs: TariffEntry[] = [];

  // Pilotage
  if (rates.pilotage) {
    tariffs.push({
      portUnlocode: unlocode,
      chargeName: 'Pilotage - Inward',
      chargeType: 'PILOTAGE',
      amount: rates.pilotage.inward,
      currency,
      unit: 'PER_VESSEL',
      description: `Compulsory pilotage service for vessels entering ${portName}`,
    });
    tariffs.push({
      portUnlocode: unlocode,
      chargeName: 'Pilotage - Outward',
      chargeType: 'PILOTAGE',
      amount: rates.pilotage.outward,
      currency,
      unit: 'PER_VESSEL',
      description: `Compulsory pilotage service for vessels departing ${portName}`,
    });
  }

  // Port Dues
  if (rates.portDues) {
    tariffs.push({
      portUnlocode: unlocode,
      chargeName: 'Port Dues',
      chargeType: 'PORT_DUES',
      amount: rates.portDues.per_grt,
      currency,
      unit: 'PER_GRT',
      description: 'Charged per Gross Registered Tonnage',
    });
  }

  // Berth Hire
  if (rates.berth) {
    tariffs.push({
      portUnlocode: unlocode,
      chargeName: 'Berth Hire',
      chargeType: 'BERTH',
      amount: rates.berth.per_hour,
      currency,
      unit: 'PER_HOUR',
      description: 'Hourly charge for berth occupancy',
    });
  }

  // Tug Services
  if (rates.tug) {
    tariffs.push({
      portUnlocode: unlocode,
      chargeName: 'Tug Services',
      chargeType: 'TUG',
      amount: rates.tug.per_hour,
      currency,
      unit: 'PER_HOUR',
      description: 'Tug boat assistance (minimum 2 hours typically required)',
    });
  }

  // Mooring/Unmooring
  if (rates.mooring) {
    tariffs.push({
      portUnlocode: unlocode,
      chargeName: 'Mooring/Unmooring',
      chargeType: 'MOORING',
      amount: rates.mooring.per_operation,
      currency,
      unit: 'PER_OPERATION',
      description: 'Line handling and mooring services',
    });
  }

  // Additional services (standard across ports)
  tariffs.push(
    {
      portUnlocode: unlocode,
      chargeName: 'Garbage Disposal',
      chargeType: 'OTHER',
      amount: rates.portDues.per_grt * 0.3,
      currency,
      unit: 'PER_CUBIC_METER',
      description: 'Waste disposal services',
    },
    {
      portUnlocode: unlocode,
      chargeName: 'Fresh Water Supply',
      chargeType: 'OTHER',
      amount: rates.portDues.per_grt * 0.5,
      currency,
      unit: 'PER_TON',
      description: 'Fresh water bunkering',
    },
    {
      portUnlocode: unlocode,
      chargeName: 'Line Boat Service',
      chargeType: 'OTHER',
      amount: rates.mooring.per_operation * 0.4,
      currency,
      unit: 'PER_TRIP',
      description: 'Personnel transfer to/from vessel',
    }
  );

  return tariffs;
}

async function seedTariffs() {
  console.log('='.repeat(80));
  console.log('GLOBAL PORT TARIFF SEEDER');
  console.log('='.repeat(80));
  console.log(`Started at: ${new Date().toISOString()}\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  console.log(`📦 Total tariff entries to process: ${globalTariffs.length}`);

  for (const tariff of globalTariffs) {
    try {
      // Find port by unlocode
      const port = await prisma.port.findUnique({
        where: { unlocode: tariff.portUnlocode },
      });

      if (!port) {
        console.log(`  ⚠️  Port not found: ${tariff.portUnlocode}`);
        skipped++;
        continue;
      }

      // Check if tariff already exists
      const existing = await prisma.portTariff.findFirst({
        where: {
          portId: port.id,
          chargeName: tariff.chargeName,
        },
      });

      if (existing) {
        // Update if amount is different
        if (existing.amount !== tariff.amount) {
          await prisma.portTariff.update({
            where: { id: existing.id },
            data: {
              amount: tariff.amount,
              currency: tariff.currency,
              unit: tariff.unit,
              description: tariff.description,
            },
          });
          updated++;
        } else {
          skipped++;
        }
      } else {
        // Create new tariff
        await prisma.portTariff.create({
          data: {
            portId: port.id,
            chargeName: tariff.chargeName,
            chargeType: tariff.chargeType,
            amount: tariff.amount,
            currency: tariff.currency,
            unit: tariff.unit,
            description: tariff.description,
          },
        });
        created++;
        if (created % 10 === 0) {
          process.stdout.write(`\r  📊 Progress: ${created} created, ${updated} updated, ${skipped} skipped`);
        }
      }
    } catch (error: any) {
      errors++;
      if (errors < 5) {
        console.error(`\n  ❌ Error: ${tariff.chargeName} - ${error.message}`);
      }
    }
  }

  console.log('\n\n' + '='.repeat(80));
  console.log('SEEDING COMPLETE');
  console.log('='.repeat(80));
  console.log(`✅ New tariffs created: ${created}`);
  console.log(`✏️  Tariffs updated: ${updated}`);
  console.log(`⏭️  Tariffs skipped: ${skipped}`);
  console.log(`❌ Errors: ${errors}`);

  // Final statistics
  const totalTariffs = await prisma.portTariff.count();
  const portsWithTariffs = await prisma.portTariff.groupBy({
    by: ['portId'],
  });

  console.log(`\n📊 Database Statistics:`);
  console.log(`   • Total tariff entries: ${totalTariffs.toLocaleString()}`);
  console.log(`   • Ports with tariff data: ${portsWithTariffs.length}`);
  console.log(`   • Average tariffs per port: ${Math.round(totalTariffs / portsWithTariffs.length)}`);

  console.log(`\n✅ Seeding completed at: ${new Date().toISOString()}`);
}

async function main() {
  try {
    await seedTariffs();
  } catch (error) {
    console.error('Error seeding tariffs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
