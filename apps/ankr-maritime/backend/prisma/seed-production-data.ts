/**
 * Production Data Seeder
 * Seeds realistic maritime data for demo/testing
 *
 * @package @ankr/mari8x
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedProductionData() {
  console.log('🌱 Seeding production data...\n');

  // 1. Create organization (if not exists)
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-shipping' },
    update: {},
    create: {
      name: 'Demo Shipping Ltd',
      slug: 'demo-shipping',
      email: 'info@demoshipping.com',
      plan: 'enterprise',
    },
  });

  console.log(`✅ Organization: ${org.name}`);

  // 2. Create admin user (if not exists)
  const user = await prisma.user.upsert({
    where: { email: 'admin@demoshipping.com' },
    update: {},
    create: {
      email: 'admin@demoshipping.com',
      name: 'Admin User',
      role: 'admin',
      organizationId: org.id,
    },
  });

  console.log(`✅ User: ${user.name}\n`);

  // 3. Create companies
  console.log('📦 Creating companies...');

  const companies = [
    { name: 'Ocean Carriers Inc', type: 'owner', country: 'Greece' },
    { name: 'Maritime Holdings LLC', type: 'owner', country: 'Singapore' },
    { name: 'Global Charterers Ltd', type: 'charterer', country: 'UK' },
    { name: 'Cargo Masters SA', type: 'charterer', country: 'Switzerland' },
    { name: 'Pacific Brokers', type: 'broker', country: 'Japan' },
    { name: 'Atlantic Shipping Agents', type: 'agent', country: 'UAE' },
    { name: 'Port Services Group', type: 'agent', country: 'India' },
    { name: 'Marine Surveyors International', type: 'surveyor', country: 'USA' },
  ];

  const createdCompanies = [];
  for (const comp of companies) {
    const company = await prisma.company.upsert({
      where: { name_organizationId: { name: comp.name, organizationId: org.id } },
      update: {},
      create: {
        ...comp,
        email: `info@${comp.name.toLowerCase().replace(/ /g, '')}.com`,
        organizationId: org.id,
      },
    });
    createdCompanies.push(company);
    console.log(`  ✅ ${company.name} (${company.type})`);
  }

  console.log('');

  // 4. Create vessels
  console.log('🚢 Creating vessels...');

  const vessels = [
    {
      name: 'MV PACIFIC STAR',
      imo: '9811001',
      type: 'bulk_carrier',
      dwt: 82000,
      grt: 45000,
      nrt: 28000,
      loa: 225,
      beam: 32,
      draft: 14.5,
      builtYear: 2019,
      flag: 'PANAMA',
      ownerId: createdCompanies[0].id, // Ocean Carriers Inc
    },
    {
      name: 'MV ATLANTIC GRACE',
      imo: '9811002',
      type: 'bulk_carrier',
      dwt: 75000,
      grt: 42000,
      nrt: 26000,
      loa: 220,
      beam: 32,
      draft: 14,
      builtYear: 2020,
      flag: 'LIBERIA',
      ownerId: createdCompanies[0].id,
    },
    {
      name: 'MV OCEAN PIONEER',
      imo: '9811003',
      type: 'container',
      dwt: 50000,
      grt: 35000,
      nrt: 22000,
      loa: 260,
      beam: 32,
      draft: 12,
      builtYear: 2018,
      flag: 'SINGAPORE',
      ownerId: createdCompanies[1].id, // Maritime Holdings
      teuCapacity: 4250,
    },
    {
      name: 'MV GLOBAL TRADER',
      imo: '9811004',
      type: 'container',
      dwt: 65000,
      grt: 48000,
      nrt: 30000,
      loa: 300,
      beam: 40,
      draft: 13,
      builtYear: 2021,
      flag: 'HONG KONG',
      ownerId: createdCompanies[1].id,
      teuCapacity: 5500,
    },
    {
      name: 'MT ENERGY STAR',
      imo: '9811005',
      type: 'tanker',
      dwt: 115000,
      grt: 65000,
      nrt: 40000,
      loa: 250,
      beam: 44,
      draft: 16,
      builtYear: 2017,
      flag: 'MARSHALL ISLANDS',
      ownerId: createdCompanies[0].id,
    },
  ];

  const createdVessels = [];
  for (const v of vessels) {
    const vessel = await prisma.vessel.upsert({
      where: { imo: v.imo },
      update: {},
      create: {
        ...v,
        organizationId: org.id,
        status: 'active',
      },
    });
    createdVessels.push(vessel);
    console.log(`  ✅ ${vessel.name} (${vessel.type}, ${vessel.dwt} DWT)`);
  }

  console.log('');

  // 5. Create cargo enquiries
  console.log('📋 Creating cargo enquiries...');

  const enquiries = [
    {
      cargoType: 'bulk',
      commodity: 'coal',
      quantity: 75000,
      quantityUnit: 'MT',
      loadPort: 'AURIC', // Richards Bay
      dischargePort: 'INJNP', // JNPT Mumbai
      laycanStart: new Date('2026-03-15'),
      laycanEnd: new Date('2026-03-25'),
      companyId: createdCompanies[2].id, // Global Charterers
      status: 'active',
      priority: 'high',
    },
    {
      cargoType: 'bulk',
      commodity: 'iron_ore',
      quantity: 80000,
      quantityUnit: 'MT',
      loadPort: 'BRPDM', // Ponta da Madeira
      dischargePort: 'CNSHA', // Shanghai
      laycanStart: new Date('2026-04-01'),
      laycanEnd: new Date('2026-04-10'),
      companyId: createdCompanies[3].id, // Cargo Masters
      status: 'active',
      priority: 'medium',
    },
    {
      cargoType: 'containers',
      quantity: 4000,
      quantityUnit: 'TEU',
      loadPort: 'SGSIN', // Singapore
      dischargePort: 'USLAX', // Los Angeles
      laycanStart: new Date('2026-03-20'),
      laycanEnd: new Date('2026-03-30'),
      companyId: createdCompanies[2].id,
      status: 'active',
      priority: 'high',
    },
  ];

  for (const enq of enquiries) {
    const enquiry = await prisma.cargoEnquiry.create({
      data: {
        ...enq,
        userId: user.id,
        organizationId: org.id,
        enquiryDate: new Date(),
        receivedAt: new Date(),
      },
    });
    console.log(`  ✅ Enquiry: ${enquiry.commodity || enquiry.cargoType} ${enquiry.quantity} ${enquiry.quantityUnit}`);
  }

  console.log('');

  // 6. Create charter fixtures
  console.log('📜 Creating charter fixtures...');

  const fixtures = [
    {
      vesselId: createdVessels[0].id, // PACIFIC STAR
      chartererId: createdCompanies[2].id, // Global Charterers
      type: 'voyage',
      cargoType: 'bulk',
      commodity: 'grain',
      quantity: 75000,
      quantityUnit: 'MT',
      loadPort: 'USHOU', // Houston
      dischargePort: 'AEJEA', // Jebel Ali
      laycanStart: new Date('2026-02-20'),
      laycanEnd: new Date('2026-02-28'),
      freightRate: 32.50,
      freightCurrency: 'USD',
      freightUnit: 'per_mt',
      status: 'fixed',
      commissionRate: 1.25,
    },
    {
      vesselId: createdVessels[2].id, // OCEAN PIONEER
      chartererId: createdCompanies[3].id, // Cargo Masters
      type: 'time_charter',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      hireRate: 18000,
      hireCurrency: 'USD',
      hireUnit: 'per_day',
      status: 'active',
      commissionRate: 1.25,
    },
  ];

  for (const fix of fixtures) {
    const fixture = await prisma.charterFixture.create({
      data: {
        ...fix,
        userId: user.id,
        organizationId: org.id,
        fixtureDate: new Date(),
      },
    });
    console.log(`  ✅ ${fix.type === 'voyage' ? 'Voyage' : 'Time'} charter: ${fixture.quantity || ''} ${fixture.commodity || ''}`);
  }

  console.log('');

  // 7. Create S&P listings
  console.log('💰 Creating S&P listings...');

  const listings = [
    {
      vesselId: createdVessels[1].id, // ATLANTIC GRACE
      listingType: 'sale',
      askingPrice: 28500000,
      currency: 'USD',
      status: 'active',
      description: 'Well-maintained Kamsarmax bulk carrier, immediate delivery',
    },
    {
      vesselId: createdVessels[4].id, // ENERGY STAR
      listingType: 'sale',
      askingPrice: 42000000,
      currency: 'USD',
      status: 'active',
      description: 'Aframax tanker, double hull, IMO2/3 compliant',
    },
  ];

  for (const listing of listings) {
    const spListing = await prisma.sPListing.create({
      data: {
        ...listing,
        userId: user.id,
        organizationId: org.id,
        listedAt: new Date(),
      },
    });
    console.log(`  ✅ S&P: ${listing.listingType} - $${(listing.askingPrice / 1000000).toFixed(1)}M`);
  }

  console.log('');

  // 8. Create voyage orders
  console.log('🌊 Creating voyage orders...');

  const voyages = [
    {
      vesselId: createdVessels[0].id,
      voyageNumber: 'V001-2026',
      loadPort: 'USHOU',
      dischargePort: 'AEJEA',
      cargoType: 'bulk',
      commodity: 'grain',
      quantity: 75000,
      etaLoad: new Date('2026-02-22'),
      etaDischarge: new Date('2026-03-15'),
      status: 'active',
    },
    {
      vesselId: createdVessels[2].id,
      voyageNumber: 'V002-2026',
      loadPort: 'CNSHA',
      dischargePort: 'USLAX',
      cargoType: 'containers',
      quantity: 4200,
      quantityUnit: 'TEU',
      etaLoad: new Date('2026-02-15'),
      etaDischarge: new Date('2026-03-05'),
      status: 'active',
    },
  ];

  for (const voy of voyages) {
    const voyage = await prisma.voyageOrder.create({
      data: {
        ...voy,
        userId: user.id,
        organizationId: org.id,
        createdAt: new Date(),
      },
    });
    console.log(`  ✅ Voyage: ${voyage.voyageNumber} (${voyage.loadPort} → ${voyage.dischargePort})`);
  }

  console.log('');

  // 9. Create port calls
  console.log('⚓ Creating port calls...');

  const portCalls = [
    {
      vesselId: createdVessels[0].id,
      portId: (await prisma.port.findFirst({ where: { unlocode: 'USHOU' } }))?.id,
      purpose: 'loading',
      eta: new Date('2026-02-22'),
      etd: new Date('2026-02-25'),
      status: 'scheduled',
    },
    {
      vesselId: createdVessels[2].id,
      portId: (await prisma.port.findFirst({ where: { unlocode: 'CNSHA' } }))?.id,
      purpose: 'loading',
      eta: new Date('2026-02-15'),
      etd: new Date('2026-02-18'),
      status: 'scheduled',
    },
  ];

  for (const pc of portCalls) {
    if (pc.portId) {
      const portCall = await prisma.portCall.create({
        data: {
          ...pc,
          userId: user.id,
          organizationId: org.id,
        },
      });
      console.log(`  ✅ Port call: ${portCall.purpose} (ETA: ${portCall.eta.toISOString().split('T')[0]})`);
    }
  }

  console.log('');

  // 10. Create DA cases
  console.log('📊 Creating DA cases...');

  const daCases = [
    {
      vesselId: createdVessels[0].id,
      portId: (await prisma.port.findFirst({ where: { unlocode: 'USHOU' } }))?.id,
      agentId: createdCompanies[5].id, // Atlantic Shipping Agents
      estimatedCost: 25000,
      actualCost: 26500,
      currency: 'USD',
      status: 'invoiced',
    },
    {
      vesselId: createdVessels[2].id,
      portId: (await prisma.port.findFirst({ where: { unlocode: 'SGSIN' } }))?.id,
      agentId: createdCompanies[6].id, // Port Services Group
      estimatedCost: 18000,
      currency: 'USD',
      status: 'pending',
    },
  ];

  for (const da of daCases) {
    if (da.portId) {
      const daCase = await prisma.dACase.create({
        data: {
          ...da,
          userId: user.id,
          organizationId: org.id,
          caseDate: new Date(),
        },
      });
      console.log(`  ✅ DA: $${daCase.estimatedCost.toLocaleString()} (${daCase.status})`);
    }
  }

  console.log('\n✅ Production data seeding complete!');
  console.log(`
📊 Summary:
   - 1 Organization
   - 1 User
   - ${companies.length} Companies
   - ${vessels.length} Vessels
   - ${enquiries.length} Cargo Enquiries
   - ${fixtures.length} Charter Fixtures
   - ${listings.length} S&P Listings
   - ${voyages.length} Voyage Orders
   - ${portCalls.length} Port Calls
   - ${daCases.length} DA Cases
  `);
}

async function main() {
  try {
    await seedProductionData();
  } catch (error) {
    console.error('Error seeding production data:', error);
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
