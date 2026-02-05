/**
 * Port Tariff Database Seeder
 * Seeds port tariffs for major ports worldwide
 *
 * @package @ankr/mari8x
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TariffItem {
  code: string;
  name: string;
  description: string;
  unit: string; // 'per_call', 'per_ton', 'per_meter', 'per_hour', 'per_day'
  baseRate: number; // USD
  currency: string;
  category: string; // 'port_dues', 'pilotage', 'tug', 'berth', 'cargo', 'agency', 'misc'
  isVariable: boolean; // true if rate depends on vessel size/cargo
  formula?: string; // e.g., "baseRate * grt / 100" or "baseRate * loa"
}

interface PortTariff {
  portCode: string;
  portName: string;
  country: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  items: TariffItem[];
  notes?: string;
}

/**
 * Major ports tariff data
 * Based on 2026 published tariffs
 */
const portTariffs: PortTariff[] = [
  // SINGAPORE
  {
    portCode: 'SGSIN',
    portName: 'Singapore',
    country: 'Singapore',
    effectiveFrom: new Date('2026-01-01'),
    items: [
      {
        code: 'PD001',
        name: 'Port Dues',
        description: 'Port dues based on GRT',
        unit: 'per_ton',
        baseRate: 0.034,
        currency: 'USD',
        category: 'port_dues',
        isVariable: true,
        formula: 'baseRate * grt',
      },
      {
        code: 'PIL001',
        name: 'Pilotage In',
        description: 'Inbound pilotage',
        unit: 'per_call',
        baseRate: 800,
        currency: 'USD',
        category: 'pilotage',
        isVariable: true,
        formula: 'baseRate + (grt > 10000 ? (grt - 10000) * 0.02 : 0)',
      },
      {
        code: 'PIL002',
        name: 'Pilotage Out',
        description: 'Outbound pilotage',
        unit: 'per_call',
        baseRate: 800,
        currency: 'USD',
        category: 'pilotage',
        isVariable: true,
        formula: 'baseRate + (grt > 10000 ? (grt - 10000) * 0.02 : 0)',
      },
      {
        code: 'TUG001',
        name: 'Tug Assistance',
        description: 'Tug boat assistance (2 tugs)',
        unit: 'per_call',
        baseRate: 2500,
        currency: 'USD',
        category: 'tug',
        isVariable: true,
        formula: 'baseRate * 2', // 2 tugs minimum
      },
      {
        code: 'BERTH001',
        name: 'Berth Dues',
        description: 'Berth occupation charges per day',
        unit: 'per_day',
        baseRate: 0.15,
        currency: 'USD',
        category: 'berth',
        isVariable: true,
        formula: 'baseRate * grt',
      },
      {
        code: 'CARGO001',
        name: 'Cargo Handling',
        description: 'Container handling',
        unit: 'per_ton',
        baseRate: 150,
        currency: 'USD',
        category: 'cargo',
        isVariable: false,
      },
      {
        code: 'AGY001',
        name: 'Port Agency Fee',
        description: 'Standard agency fee',
        unit: 'per_call',
        baseRate: 1500,
        currency: 'USD',
        category: 'agency',
        isVariable: false,
      },
    ],
    notes: 'Singapore tariffs updated Jan 2026. All rates in USD.',
  },

  // MUMBAI (JNPT)
  {
    portCode: 'INJNP',
    portName: 'Jawaharlal Nehru Port (JNPT)',
    country: 'India',
    effectiveFrom: new Date('2026-01-01'),
    items: [
      {
        code: 'PD001',
        name: 'Port Dues',
        description: 'Port dues based on GRT',
        unit: 'per_ton',
        baseRate: 0.025,
        currency: 'USD',
        category: 'port_dues',
        isVariable: true,
        formula: 'baseRate * grt',
      },
      {
        code: 'PIL001',
        name: 'Pilotage',
        description: 'Pilotage service',
        unit: 'per_call',
        baseRate: 600,
        currency: 'USD',
        category: 'pilotage',
        isVariable: true,
        formula: 'baseRate + (grt > 8000 ? (grt - 8000) * 0.015 : 0)',
      },
      {
        code: 'TUG001',
        name: 'Tug Assistance',
        description: 'Tug boat assistance',
        unit: 'per_call',
        baseRate: 1800,
        currency: 'USD',
        category: 'tug',
        isVariable: true,
      },
      {
        code: 'BERTH001',
        name: 'Berth Dues',
        description: 'Berth charges per day',
        unit: 'per_day',
        baseRate: 0.12,
        currency: 'USD',
        category: 'berth',
        isVariable: true,
        formula: 'baseRate * grt',
      },
      {
        code: 'CARGO001',
        name: 'Container Handling',
        description: 'TEU handling',
        unit: 'per_ton',
        baseRate: 120,
        currency: 'USD',
        category: 'cargo',
        isVariable: false,
      },
      {
        code: 'AGY001',
        name: 'Agency Fee',
        description: 'DA agency fee',
        unit: 'per_call',
        baseRate: 1200,
        currency: 'USD',
        category: 'agency',
        isVariable: false,
      },
    ],
    notes: 'JNPT Mumbai tariffs. Rates converted from INR to USD at 83:1.',
  },

  // DUBAI (JEBEL ALI)
  {
    portCode: 'AEJEA',
    portName: 'Jebel Ali',
    country: 'UAE',
    effectiveFrom: new Date('2026-01-01'),
    items: [
      {
        code: 'PD001',
        name: 'Port Dues',
        description: 'Port dues based on GRT',
        unit: 'per_ton',
        baseRate: 0.038,
        currency: 'USD',
        category: 'port_dues',
        isVariable: true,
        formula: 'baseRate * grt',
      },
      {
        code: 'PIL001',
        name: 'Pilotage In/Out',
        description: 'Pilotage service both ways',
        unit: 'per_call',
        baseRate: 1200,
        currency: 'USD',
        category: 'pilotage',
        isVariable: true,
        formula: 'baseRate * 2', // In + Out
      },
      {
        code: 'TUG001',
        name: 'Tug Assistance',
        description: 'Tug boat services',
        unit: 'per_call',
        baseRate: 2800,
        currency: 'USD',
        category: 'tug',
        isVariable: true,
      },
      {
        code: 'BERTH001',
        name: 'Berth Dues',
        description: 'Berth occupation per day',
        unit: 'per_day',
        baseRate: 0.18,
        currency: 'USD',
        category: 'berth',
        isVariable: true,
        formula: 'baseRate * grt',
      },
      {
        code: 'CARGO001',
        name: 'Container Handling',
        description: 'TEU handling charges',
        unit: 'per_ton',
        baseRate: 180,
        currency: 'USD',
        category: 'cargo',
        isVariable: false,
      },
      {
        code: 'AGY001',
        name: 'Agency Fee',
        description: 'Port agency services',
        unit: 'per_call',
        baseRate: 1800,
        currency: 'USD',
        category: 'agency',
        isVariable: false,
      },
    ],
    notes: 'Jebel Ali Dubai tariffs. AED converted to USD at 3.67:1.',
  },

  // ROTTERDAM
  {
    portCode: 'NLRTM',
    portName: 'Rotterdam',
    country: 'Netherlands',
    effectiveFrom: new Date('2026-01-01'),
    items: [
      {
        code: 'PD001',
        name: 'Port Dues',
        description: 'Port dues per GRT',
        unit: 'per_ton',
        baseRate: 0.045,
        currency: 'USD',
        category: 'port_dues',
        isVariable: true,
        formula: 'baseRate * grt',
      },
      {
        code: 'PIL001',
        name: 'Pilotage',
        description: 'Pilotage service',
        unit: 'per_call',
        baseRate: 1500,
        currency: 'USD',
        category: 'pilotage',
        isVariable: true,
        formula: 'baseRate + (grt > 12000 ? (grt - 12000) * 0.025 : 0)',
      },
      {
        code: 'TUG001',
        name: 'Tug Assistance',
        description: 'Tug services (3 tugs typical)',
        unit: 'per_call',
        baseRate: 3500,
        currency: 'USD',
        category: 'tug',
        isVariable: true,
      },
      {
        code: 'BERTH001',
        name: 'Berth Dues',
        description: 'Berth charges daily',
        unit: 'per_day',
        baseRate: 0.20,
        currency: 'USD',
        category: 'berth',
        isVariable: true,
        formula: 'baseRate * grt',
      },
      {
        code: 'CARGO001',
        name: 'Container Handling',
        description: 'TEU handling',
        unit: 'per_ton',
        baseRate: 200,
        currency: 'USD',
        category: 'cargo',
        isVariable: false,
      },
      {
        code: 'AGY001',
        name: 'Agency Fee',
        description: 'Port agency fee',
        unit: 'per_call',
        baseRate: 2200,
        currency: 'USD',
        category: 'agency',
        isVariable: false,
      },
    ],
    notes: 'Rotterdam tariffs. EUR converted to USD at 1.10:1.',
  },

  // SHANGHAI
  {
    portCode: 'CNSHA',
    portName: 'Shanghai',
    country: 'China',
    effectiveFrom: new Date('2026-01-01'),
    items: [
      {
        code: 'PD001',
        name: 'Port Dues',
        description: 'Port construction fee',
        unit: 'per_ton',
        baseRate: 0.028,
        currency: 'USD',
        category: 'port_dues',
        isVariable: true,
        formula: 'baseRate * grt',
      },
      {
        code: 'PIL001',
        name: 'Pilotage',
        description: 'Pilot service',
        unit: 'per_call',
        baseRate: 900,
        currency: 'USD',
        category: 'pilotage',
        isVariable: true,
        formula: 'baseRate + (grt > 10000 ? (grt - 10000) * 0.018 : 0)',
      },
      {
        code: 'TUG001',
        name: 'Tug Assistance',
        description: 'Tug boat services',
        unit: 'per_call',
        baseRate: 2200,
        currency: 'USD',
        category: 'tug',
        isVariable: true,
      },
      {
        code: 'BERTH001',
        name: 'Berth Dues',
        description: 'Berth rental per day',
        unit: 'per_day',
        baseRate: 0.14,
        currency: 'USD',
        category: 'berth',
        isVariable: true,
        formula: 'baseRate * grt',
      },
      {
        code: 'CARGO001',
        name: 'Container Handling',
        description: 'TEU operations',
        unit: 'per_ton',
        baseRate: 140,
        currency: 'USD',
        category: 'cargo',
        isVariable: false,
      },
      {
        code: 'AGY001',
        name: 'Agency Fee',
        description: 'Husbandry services',
        unit: 'per_call',
        baseRate: 1400,
        currency: 'USD',
        category: 'agency',
        isVariable: false,
      },
    ],
    notes: 'Shanghai tariffs. CNY converted to USD at 7.2:1.',
  },

  // LOS ANGELES
  {
    portCode: 'USLAX',
    portName: 'Los Angeles',
    country: 'USA',
    effectiveFrom: new Date('2026-01-01'),
    items: [
      {
        code: 'PD001',
        name: 'Port Dues',
        description: 'Harbor maintenance fee',
        unit: 'per_ton',
        baseRate: 0.042,
        currency: 'USD',
        category: 'port_dues',
        isVariable: true,
        formula: 'baseRate * grt',
      },
      {
        code: 'PIL001',
        name: 'Pilotage',
        description: 'Bar pilot service',
        unit: 'per_call',
        baseRate: 1800,
        currency: 'USD',
        category: 'pilotage',
        isVariable: true,
        formula: 'baseRate + (grt > 15000 ? (grt - 15000) * 0.03 : 0)',
      },
      {
        code: 'TUG001',
        name: 'Tug Assistance',
        description: 'Tug services',
        unit: 'per_call',
        baseRate: 4500,
        currency: 'USD',
        category: 'tug',
        isVariable: true,
      },
      {
        code: 'BERTH001',
        name: 'Berth Dues',
        description: 'Wharfage per day',
        unit: 'per_day',
        baseRate: 0.22,
        currency: 'USD',
        category: 'berth',
        isVariable: true,
        formula: 'baseRate * grt',
      },
      {
        code: 'CARGO001',
        name: 'Container Handling',
        description: 'TEU lift charges',
        unit: 'per_ton',
        baseRate: 250,
        currency: 'USD',
        category: 'cargo',
        isVariable: false,
      },
      {
        code: 'AGY001',
        name: 'Agency Fee',
        description: 'Husbandry agency',
        unit: 'per_call',
        baseRate: 2500,
        currency: 'USD',
        category: 'agency',
        isVariable: false,
      },
    ],
    notes: 'Los Angeles/Long Beach tariffs.',
  },
];

/**
 * Seed port tariffs
 */
async function seedPortTariffs() {
  console.log('🔄 Seeding port tariffs...');

  let totalTariffs = 0;
  let totalItems = 0;

  for (const portTariff of portTariffs) {
    // Create or update port tariff
    const tariff = await prisma.portTariff.upsert({
      where: {
        portCode_effectiveFrom: {
          portCode: portTariff.portCode,
          effectiveFrom: portTariff.effectiveFrom,
        },
      },
      update: {
        portName: portTariff.portName,
        country: portTariff.country,
        effectiveTo: portTariff.effectiveTo,
        notes: portTariff.notes,
      },
      create: {
        portCode: portTariff.portCode,
        portName: portTariff.portName,
        country: portTariff.country,
        effectiveFrom: portTariff.effectiveFrom,
        effectiveTo: portTariff.effectiveTo,
        notes: portTariff.notes,
      },
    });

    totalTariffs++;

    // Create tariff items
    for (const item of portTariff.items) {
      await prisma.tariffItem.upsert({
        where: {
          tariffId_code: {
            tariffId: tariff.id,
            code: item.code,
          },
        },
        update: {
          name: item.name,
          description: item.description,
          unit: item.unit,
          baseRate: item.baseRate,
          currency: item.currency,
          category: item.category,
          isVariable: item.isVariable,
          formula: item.formula,
        },
        create: {
          tariffId: tariff.id,
          code: item.code,
          name: item.name,
          description: item.description,
          unit: item.unit,
          baseRate: item.baseRate,
          currency: item.currency,
          category: item.category,
          isVariable: item.isVariable,
          formula: item.formula,
        },
      });

      totalItems++;
    }

    console.log(`  ✅ ${portTariff.portName} (${portTariff.portCode}): ${portTariff.items.length} items`);
  }

  console.log(`\n✅ Seeded ${totalTariffs} port tariffs with ${totalItems} items`);
}

/**
 * Main seed function
 */
async function main() {
  try {
    await seedPortTariffs();
  } catch (error) {
    console.error('Error seeding port tariffs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
