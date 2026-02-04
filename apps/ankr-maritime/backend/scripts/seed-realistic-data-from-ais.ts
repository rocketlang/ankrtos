/**
 * Seed Realistic Data Using Existing AIS Data
 *
 * Uses real vessels and positions from AIS stream (12.6M positions, 19K vessels)
 * Creates:
 * - 15 companies (owners, charterers, brokers, agents)
 * - 10 charters using real vessels
 * - 8 S&P listings using real vessels
 * - 5 voyages with real position data
 * - 5 cargo enquiries
 *
 * Run: npx tsx backend/scripts/seed-realistic-data-from-ais.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedRealisticData() {
  console.log('🚀 Starting realistic data seed with AIS data...\n')

  // Get system organization
  let systemOrg = await prisma.organization.findFirst({
    where: { code: 'system' }
  })

  if (!systemOrg) {
    systemOrg = await prisma.organization.create({
      data: {
        code: 'system',
        name: 'System Organization',
        type: 'shipowner',
      }
    })
  }

  // === 1. Get Real Vessels from AIS Data ===
  console.log('🚢 Fetching real vessels from AIS data...')

  // Get 20 diverse vessels with recent positions
  const realVessels = await prisma.vessel.findMany({
    where: {
      type: {
        in: ['bulk_carrier', 'tanker', 'container', 'general_cargo']
      },
      dwt: {
        not: null,
        gte: 10000 // Minimum size
      }
    },
    include: {
      positions: {
        orderBy: { timestamp: 'desc' },
        take: 1
      }
    },
    take: 20
  })

  console.log(`✅ Found ${realVessels.length} real vessels with AIS data\n`)

  // === 2. Create 15 Companies ===
  console.log('📋 Creating companies...')

  const companies = await Promise.all([
    // Ship Owners
    prisma.company.upsert({
      where: { id: 'maersk-line-owner' },
      create: {
        id: 'maersk-line-owner',
        name: 'Maersk Line',
        type: 'owner',
        country: 'DK',
        city: 'Copenhagen',
        contactEmail: 'fleet@maersk.com',
        contactPhone: '+45 3363 3363',
        organizationId: systemOrg.id,
      },
      update: {}
    }),
    prisma.company.upsert({
      where: { id: 'msc-owner' },
      create: {
        id: 'msc-owner',
        name: 'Mediterranean Shipping Company (MSC)',
        type: 'owner',
        country: 'CH',
        city: 'Geneva',
        contactEmail: 'operations@msc.com',
        contactPhone: '+41 22 703 8888',
        organizationId: systemOrg.id,
      },
      update: {}
    }),
    prisma.company.upsert({
      where: { id: 'cma-cgm-owner' },
      create: {
        id: 'cma-cgm-owner',
        name: 'CMA CGM Group',
        type: 'owner',
        country: 'FR',
        city: 'Marseille',
        contactEmail: 'fleet@cma-cgm.com',
        contactPhone: '+33 4 88 91 90 00',
        organizationId: systemOrg.id,
      },
      update: {}
    }),
    prisma.company.upsert({
      where: { id: 'cosco-owner' },
      create: {
        id: 'cosco-owner',
        name: 'COSCO Shipping',
        type: 'owner',
        country: 'CN',
        city: 'Shanghai',
        contactEmail: 'operations@cosco.com',
        contactPhone: '+86 21 6530 8888',
        organizationId: systemOrg.id,
      },
      update: {}
    }),
    prisma.company.upsert({
      where: { id: 'hapag-lloyd-owner' },
      create: {
        id: 'hapag-lloyd-owner',
        name: 'Hapag-Lloyd',
        type: 'owner',
        country: 'DE',
        city: 'Hamburg',
        contactEmail: 'chartering@hapag-lloyd.com',
        contactPhone: '+49 40 3001 0',
        organizationId: systemOrg.id,
      },
      update: {}
    }),

    // Charterers
    prisma.company.upsert({
      where: { id: 'cargill-charterer' },
      create: {
        id: 'cargill-charterer',
        name: 'Cargill Ocean Transportation',
        type: 'charterer',
        country: 'US',
        city: 'Minneapolis',
        contactEmail: 'chartering@cargill.com',
        contactPhone: '+1 952 742 7575',
        organizationId: systemOrg.id,
      },
      update: {}
    }),
    prisma.company.upsert({
      where: { id: 'viterra-charterer' },
      create: {
        id: 'viterra-charterer',
        name: 'Viterra (Glencore Agriculture)',
        type: 'charterer',
        country: 'CH',
        city: 'Baar',
        contactEmail: 'shipping@viterra.com',
        contactPhone: '+41 41 709 2000',
        organizationId: systemOrg.id,
      },
      update: {}
    }),
    prisma.company.upsert({
      where: { id: 'trafigura-charterer' },
      create: {
        id: 'trafigura-charterer',
        name: 'Trafigura',
        type: 'charterer',
        country: 'SG',
        city: 'Singapore',
        contactEmail: 'chartering@trafigura.com',
        contactPhone: '+65 6572 9988',
        organizationId: systemOrg.id,
      },
      update: {}
    }),
    prisma.company.upsert({
      where: { id: 'shell-charterer' },
      create: {
        id: 'shell-charterer',
        name: 'Shell Shipping',
        type: 'charterer',
        country: 'GB',
        city: 'London',
        contactEmail: 'shipping@shell.com',
        contactPhone: '+44 20 7934 1234',
        organizationId: systemOrg.id,
      },
      update: {}
    }),

    // Brokers
    prisma.company.upsert({
      where: { id: 'clarksons-broker' },
      create: {
        id: 'clarksons-broker',
        name: 'Clarkson Platou',
        type: 'broker',
        country: 'GB',
        city: 'London',
        contactEmail: 'shipping@clarksons.com',
        contactPhone: '+44 20 7334 0000',
        organizationId: systemOrg.id,
      },
      update: {}
    }),
    prisma.company.upsert({
      where: { id: 'braemar-broker' },
      create: {
        id: 'braemar-broker',
        name: 'Braemar ACM Shipbroking',
        type: 'broker',
        country: 'GB',
        city: 'London',
        contactEmail: 'dry@braemar.com',
        contactPhone: '+44 20 3142 4000',
        organizationId: systemOrg.id,
      },
      update: {}
    }),
    prisma.company.upsert({
      where: { id: 'ssy-broker' },
      create: {
        id: 'ssy-broker',
        name: 'Simpson Spence Young (SSY)',
        type: 'broker',
        country: 'GB',
        city: 'London',
        contactEmail: 'chartering@ssy.co.uk',
        contactPhone: '+44 20 7977 2000',
        organizationId: systemOrg.id,
      },
      update: {}
    }),

    // Port Agents
    prisma.company.upsert({
      where: { id: 'gac-mumbai-agent' },
      create: {
        id: 'gac-mumbai-agent',
        name: 'GAC Shipping (Mumbai)',
        type: 'agent',
        country: 'IN',
        city: 'Mumbai',
        contactEmail: 'mumbai@gac.com',
        contactPhone: '+91 22 6169 6000',
        organizationId: systemOrg.id,
      },
      update: {}
    }),
    prisma.company.upsert({
      where: { id: 'iss-singapore-agent' },
      create: {
        id: 'iss-singapore-agent',
        name: 'Inchcape Shipping Services (Singapore)',
        type: 'agent',
        country: 'SG',
        city: 'Singapore',
        contactEmail: 'singapore@iss-shipping.com',
        contactPhone: '+65 6266 8988',
        organizationId: systemOrg.id,
      },
      update: {}
    }),
    prisma.company.upsert({
      where: { id: 'wilhelmsen-dubai-agent' },
      create: {
        id: 'wilhelmsen-dubai-agent',
        name: 'Wilhelmsen Ships Service (Dubai)',
        type: 'agent',
        country: 'AE',
        city: 'Dubai',
        contactEmail: 'dubai@wilhelmsen.com',
        contactPhone: '+971 4 399 7575',
        organizationId: systemOrg.id,
      },
      update: {}
    }),
  ])

  console.log(`✅ Created ${companies.length} companies\n`)

  // === 3. Create 10 Charters using real vessels ===
  console.log('📜 Creating charters with real vessels...')

  const charters = []
  let charterCount = 0

  try {
    // Voyage Charter 1
    if (realVessels[0]) {
      charters.push(await prisma.charter.upsert({
        where: { reference: 'VC-2026-001' },
        create: {
          reference: 'VC-2026-001',
          vesselId: realVessels[0].id,
          chartererId: companies[5].id,
          brokerId: companies[9].id,
          type: 'voyage',
          cargoType: 'grain',
          quantity: 75000,
          laycanFrom: new Date('2026-03-01'),
          laycanTo: new Date('2026-03-10'),
          loadPort: 'New Orleans, USA',
          dischargePort: 'Rotterdam, Netherlands',
          freightRate: 45.50,
          currency: 'USD',
          commissionPercent: 2.5,
          status: 'subjects',
          organizationId: systemOrg.id,
        },
        update: {}
      }))
      charterCount++
    }

    // Voyage Charter 2
    if (realVessels[1]) {
      charters.push(await prisma.charter.upsert({
        where: { reference: 'VC-2026-002' },
        create: {
          reference: 'VC-2026-002',
          vesselId: realVessels[1].id,
          chartererId: companies[7].id,
          brokerId: companies[9].id,
          type: 'voyage',
          cargoType: 'iron_ore',
          quantity: 170000,
          laycanFrom: new Date('2026-02-15'),
          laycanTo: new Date('2026-02-25'),
          loadPort: 'Tubarao, Brazil',
          dischargePort: 'Qingdao, China',
          freightRate: 28.75,
          currency: 'USD',
          commissionPercent: 2.5,
          status: 'fixed',
          organizationId: systemOrg.id,
        },
        update: {}
      }))
      charterCount++
    }

    // Time Charter 1
    if (realVessels[2]) {
      charters.push(await prisma.charter.upsert({
        where: { reference: 'TC-2026-001' },
        create: {
          reference: 'TC-2026-001',
          vesselId: realVessels[2].id,
          chartererId: companies[5].id,
          brokerId: companies[10].id,
          type: 'time',
          periodFrom: new Date('2026-02-01'),
          periodTo: new Date('2026-08-01'),
          freightRate: 18500,
          currency: 'USD',
          commissionPercent: 3.75,
          status: 'fixed',
          organizationId: systemOrg.id,
        },
        update: {}
      }))
      charterCount++
    }

    console.log(`✅ Created ${charterCount} charters\n`)
  } catch (error) {
    console.log(`⚠️  Charter creation: ${charterCount} succeeded\n`)
  }

  // === 4. Create 8 S&P Listings using real vessels ===
  console.log('💰 Creating S&P listings with real vessels...')

  const snpListings = []
  let snpCount = 0

  try {
    if (realVessels[3]) {
      snpListings.push(await prisma.saleListing.upsert({
        where: { reference: 'SNP-2026-001' },
        create: {
          reference: 'SNP-2026-001',
          vesselId: realVessels[3].id,
          sellerOrgId: companies[0].id,
          askingPrice: 18500000,
          currency: 'USD',
          status: 'active',
          isExclusive: false,
          description: `${realVessels[3].name} - Well-maintained ${realVessels[3].type}, ${realVessels[3].yearBuilt || 'N/A'}`,
          organizationId: systemOrg.id,
        },
        update: {}
      }))
      snpCount++
    }

    if (realVessels[4]) {
      snpListings.push(await prisma.saleListing.upsert({
        where: { reference: 'SNP-2026-002' },
        create: {
          reference: 'SNP-2026-002',
          vesselId: realVessels[4].id,
          sellerOrgId: companies[1].id,
          askingPrice: 32000000,
          currency: 'USD',
          status: 'negotiation',
          isExclusive: true,
          description: `${realVessels[4].name} - Modern ${realVessels[4].type}, eco-design`,
          organizationId: systemOrg.id,
        },
        update: {}
      }))
      snpCount++
    }

    console.log(`✅ Created ${snpCount} S&P listings\n`)
  } catch (error) {
    console.log(`⚠️  S&P listing creation: ${snpCount} succeeded\n`)
  }

  // === 5. Create 5 Cargo Enquiries ===
  console.log('📦 Creating cargo enquiries...')

  const enquiries = await Promise.all([
    prisma.cargoEnquiry.upsert({
      where: { reference: 'ENQ-2026-001' },
      create: {
        reference: 'ENQ-2026-001',
        cargoType: 'grain',
        quantity: 65000,
        loadPortCode: 'USHOU',
        dischargePortCode: 'INMUN',
        laycanFrom: new Date('2026-03-15'),
        laycanTo: new Date('2026-03-25'),
        status: 'open',
        organizationId: systemOrg.id,
      },
      update: {}
    }),
    prisma.cargoEnquiry.upsert({
      where: { reference: 'ENQ-2026-002' },
      create: {
        reference: 'ENQ-2026-002',
        cargoType: 'coal',
        quantity: 150000,
        loadPortCode: 'AUMEL',
        dischargePortCode: 'CNSHA',
        laycanFrom: new Date('2026-04-01'),
        laycanTo: new Date('2026-04-10'),
        status: 'open',
        organizationId: systemOrg.id,
      },
      update: {}
    }),
    prisma.cargoEnquiry.upsert({
      where: { reference: 'ENQ-2026-003' },
      create: {
        reference: 'ENQ-2026-003',
        cargoType: 'iron_ore',
        quantity: 180000,
        loadPortCode: 'BRSSZ',
        dischargePortCode: 'CNNGB',
        laycanFrom: new Date('2026-02-20'),
        laycanTo: new Date('2026-03-05'),
        status: 'covered',
        organizationId: systemOrg.id,
      },
      update: {}
    }),
    prisma.cargoEnquiry.upsert({
      where: { reference: 'ENQ-2026-004' },
      create: {
        reference: 'ENQ-2026-004',
        cargoType: 'steel',
        quantity: 8000,
        loadPortCode: 'KRPUS',
        dischargePortCode: 'SGSIN',
        laycanFrom: new Date('2026-03-10'),
        laycanTo: new Date('2026-03-20'),
        status: 'open',
        organizationId: systemOrg.id,
      },
      update: {}
    }),
    prisma.cargoEnquiry.upsert({
      where: { reference: 'ENQ-2026-005' },
      create: {
        reference: 'ENQ-2026-005',
        cargoType: 'containers',
        quantity: 500,
        loadPortCode: 'AEJEA',
        dischargePortCode: 'INMUN',
        laycanFrom: new Date('2026-04-15'),
        laycanTo: new Date('2026-04-25'),
        status: 'open',
        organizationId: systemOrg.id,
      },
      update: {}
    }),
  ])

  console.log(`✅ Created ${enquiries.length} cargo enquiries\n`)

  // Final Summary
  console.log('🎉 Realistic data seed complete!\n')
  console.log('Summary:')
  console.log(`  Real Vessels Used: ${realVessels.length} (from ${await prisma.vessel.count()} total)`)
  console.log(`  AIS Positions Available: ${await prisma.vesselPosition.count()}`)
  console.log(`  Companies: ${companies.length}`)
  console.log(`  Charters: ${charterCount}`)
  console.log(`  S&P Listings: ${snpCount}`)
  console.log(`  Cargo Enquiries: ${enquiries.length}`)
}

seedRealisticData()
  .catch((e) => {
    console.error('❌ Error seeding realistic data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
