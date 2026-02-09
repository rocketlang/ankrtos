/**
 * Seed Demo Showcase Data
 * Created: February 9, 2026
 * Purpose: Populate database with demo data for showcase pages
 *
 * This script seeds:
 * - CargoEnquiry records (pipeline funnel data)
 * - Charter records (commission tracking)
 * - CustomerProfile records (customer insights)
 * - Company records (charterers/brokers)
 * - Vessel records (for charter references)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🎯 Starting demo showcase data seeding...\n');

  // Get or create organization
  let org = await prisma.organization.findFirst({
    where: { code: 'ANKR-MAR' }
  });

  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'ANKR Maritime Pvt Ltd',
        code: 'ANKR-MAR',
        type: 'shipowner',
        country: 'IN',
      },
    });
    console.log(`✅ Created organization: ${org.name}`);
  } else {
    console.log(`✅ Using existing organization: ${org.name}`);
  }

  // === Companies (Charterers) ===
  console.log('\n📦 Creating companies...');

  const companies = [
    { name: 'Maersk Line', country: 'DK', type: 'charterer' },
    { name: 'CMA CGM', country: 'FR', type: 'charterer' },
    { name: 'MSC Mediterranean Shipping', country: 'CH', type: 'charterer' },
    { name: 'Hapag-Lloyd', country: 'DE', type: 'charterer' },
    { name: 'Ocean Network Express', country: 'SG', type: 'charterer' },
    { name: 'Cosco Shipping', country: 'CN', type: 'charterer' },
  ];

  const createdCompanies = [];
  for (const companyData of companies) {
    // Check if company exists by name
    let company = await prisma.company.findFirst({
      where: {
        name: companyData.name,
        organizationId: org.id
      }
    });

    if (!company) {
      company = await prisma.company.create({
        data: {
          name: companyData.name,
          country: companyData.country,
          type: companyData.type,
          organizationId: org.id,
        },
      });
    }
    createdCompanies.push(company);
  }
  console.log(`✅ Created/updated ${createdCompanies.length} companies`);

  // === Vessels ===
  console.log('\n🚢 Creating vessels...');

  const vessels = [
    {
      name: 'MV OCEAN SPIRIT',
      imo: '9876543',
      type: 'BULK_CARRIER',
      dwt: 82000,
      yearBuilt: 2018,
      flag: 'IN'
    },
    {
      name: 'MV PACIFIC STAR',
      imo: '9876544',
      type: 'BULK_CARRIER',
      dwt: 76000,
      yearBuilt: 2019,
      flag: 'SG'
    },
    {
      name: 'MV INDIAN OCEAN',
      imo: '9876545',
      type: 'BULK_CARRIER',
      dwt: 75000,
      yearBuilt: 2020,
      flag: 'IN'
    },
    {
      name: 'MV ATLANTIC WAVE',
      imo: '9876546',
      type: 'CONTAINER',
      dwt: 50000,
      yearBuilt: 2021,
      flag: 'LR'
    },
  ];

  const createdVessels = [];
  for (const vesselData of vessels) {
    const vessel = await prisma.vessel.upsert({
      where: { imo: vesselData.imo },
      update: {},
      create: {
        name: vesselData.name,
        imo: vesselData.imo,
        type: vesselData.type,
        dwt: vesselData.dwt,
        yearBuilt: vesselData.yearBuilt,
        flag: vesselData.flag,
        organizationId: org.id,
      },
    });
    createdVessels.push(vessel);
  }
  console.log(`✅ Created/updated ${createdVessels.length} vessels`);

  // === Ports ===
  console.log('\n⚓ Creating/verifying ports...');

  const ports = [
    { unlocode: 'BRRIG', name: 'Rio Grande', country: 'BR', latitude: -32.0350, longitude: -52.0986 },
    { unlocode: 'CNQIN', name: 'Qinhuangdao', country: 'CN', latitude: 39.9398, longitude: 119.6000 },
    { unlocode: 'SGSIN', name: 'Singapore', country: 'SG', latitude: 1.2644, longitude: 103.8200 },
    { unlocode: 'AEJEA', name: 'Jebel Ali', country: 'AE', latitude: 25.0074, longitude: 55.0718 },
    { unlocode: 'USHOU', name: 'Houston', country: 'US', latitude: 29.7604, longitude: -95.3698 },
    { unlocode: 'NLRTM', name: 'Rotterdam', country: 'NL', latitude: 51.9225, longitude: 4.4792 },
    { unlocode: 'INMUN', name: 'Mumbai', country: 'IN', latitude: 18.9500, longitude: 72.9500 },
  ];

  const createdPorts: any = {};
  for (const portData of ports) {
    const port = await prisma.port.upsert({
      where: { unlocode: portData.unlocode },
      update: {},
      create: {
        unlocode: portData.unlocode,
        name: portData.name,
        country: portData.country,
        latitude: portData.latitude,
        longitude: portData.longitude,
        timezone: 'UTC',
        type: 'seaport',
      },
    });
    createdPorts[portData.unlocode] = port.id;
  }
  console.log(`✅ Created/updated ${ports.length} ports`);

  // === Cargo Enquiries (Pipeline Funnel Data) ===
  console.log('\n📊 Creating cargo enquiries...');

  const enquiries = [
    {
      reference: 'ENQ-2026-001',
      chartererId: createdCompanies[0].id,
      cargoType: 'Iron Ore',
      quantity: 50000,
      loadPortId: createdPorts['BRRIG'],
      dischargePortId: createdPorts['CNQIN'],
      laycanFrom: new Date('2026-02-01'),
      laycanTo: new Date('2026-02-15'),
      rateIndication: 50,
      rateUnit: 'per_mt',
      status: 'complete',
      receivedVia: 'email',
      organizationId: org.id,
    },
    {
      reference: 'ENQ-2026-002',
      chartererId: createdCompanies[1].id,
      cargoType: 'Coal',
      quantity: 55000,
      loadPortId: createdPorts['SGSIN'],
      dischargePortId: createdPorts['AEJEA'],
      laycanFrom: new Date('2026-01-20'),
      laycanTo: new Date('2026-02-05'),
      rateIndication: 45,
      rateUnit: 'per_mt',
      status: 'complete',
      receivedVia: 'platform',
      organizationId: org.id,
    },
    {
      reference: 'ENQ-2026-003',
      chartererId: createdCompanies[2].id,
      cargoType: 'Grain',
      quantity: 48000,
      loadPortId: createdPorts['USHOU'],
      dischargePortId: createdPorts['NLRTM'],
      laycanFrom: new Date('2026-01-25'),
      laycanTo: new Date('2026-02-10'),
      rateIndication: 55,
      rateUnit: 'per_mt',
      status: 'complete',
      receivedVia: 'phone',
      organizationId: org.id,
    },
    {
      reference: 'ENQ-2026-004',
      chartererId: createdCompanies[3].id,
      cargoType: 'Containers',
      quantity: 15000,
      loadPortId: createdPorts['SGSIN'],
      dischargePortId: createdPorts['INMUN'],
      laycanFrom: new Date('2026-02-10'),
      laycanTo: new Date('2026-02-20'),
      rateIndication: 120,
      rateUnit: 'per_mt',
      status: 'complete',
      receivedVia: 'whatsapp',
      organizationId: org.id,
    },
    {
      reference: 'ENQ-2026-005',
      chartererId: createdCompanies[0].id,
      cargoType: 'Iron Ore',
      quantity: 60000,
      loadPortId: createdPorts['BRRIG'],
      dischargePortId: createdPorts['CNQIN'],
      laycanFrom: new Date('2026-02-15'),
      laycanTo: new Date('2026-03-01'),
      rateIndication: 48,
      rateUnit: 'per_mt',
      status: 'negotiating',
      receivedVia: 'email',
      organizationId: org.id,
    },
    {
      reference: 'ENQ-2026-006',
      chartererId: createdCompanies[1].id,
      cargoType: 'Steel Products',
      quantity: 25000,
      loadPortId: createdPorts['CNQIN'],
      dischargePortId: createdPorts['AEJEA'],
      laycanFrom: new Date('2026-02-20'),
      laycanTo: new Date('2026-03-05'),
      rateIndication: 65,
      rateUnit: 'per_mt',
      status: 'negotiating',
      receivedVia: 'platform',
      organizationId: org.id,
    },
    {
      reference: 'ENQ-2026-007',
      chartererId: createdCompanies[4].id,
      cargoType: 'Coal',
      quantity: 70000,
      loadPortId: createdPorts['SGSIN'],
      dischargePortId: createdPorts['INMUN'],
      laycanFrom: new Date('2026-02-25'),
      laycanTo: new Date('2026-03-10'),
      rateIndication: 42,
      rateUnit: 'per_mt',
      status: 'negotiating',
      receivedVia: 'email',
      organizationId: org.id,
    },
    {
      reference: 'ENQ-2026-008',
      chartererId: createdCompanies[2].id,
      cargoType: 'Grain',
      quantity: 52000,
      loadPortId: createdPorts['USHOU'],
      dischargePortId: createdPorts['NLRTM'],
      laycanFrom: new Date('2026-03-01'),
      laycanTo: new Date('2026-03-15'),
      rateIndication: 58,
      rateUnit: 'per_mt',
      status: 'enquiry',
      receivedVia: 'phone',
      organizationId: org.id,
    },
    {
      reference: 'ENQ-2026-009',
      chartererId: createdCompanies[3].id,
      cargoType: 'Fertilizer',
      quantity: 35000,
      loadPortId: createdPorts['INMUN'],
      dischargePortId: createdPorts['BRRIG'],
      laycanFrom: new Date('2026-03-05'),
      laycanTo: new Date('2026-03-20'),
      rateIndication: 70,
      rateUnit: 'per_mt',
      status: 'enquiry',
      receivedVia: 'whatsapp',
      organizationId: org.id,
    },
    {
      reference: 'ENQ-2026-010',
      chartererId: createdCompanies[5].id,
      cargoType: 'Iron Ore',
      quantity: 65000,
      loadPortId: createdPorts['BRRIG'],
      dischargePortId: createdPorts['CNQIN'],
      laycanFrom: new Date('2026-03-10'),
      laycanTo: new Date('2026-03-25'),
      rateIndication: 52,
      rateUnit: 'per_mt',
      status: 'enquiry',
      receivedVia: 'email',
      organizationId: org.id,
    },
    {
      reference: 'ENQ-2026-011',
      chartererId: createdCompanies[0].id,
      cargoType: 'Containers',
      quantity: 18000,
      loadPortId: createdPorts['SGSIN'],
      dischargePortId: createdPorts['AEJEA'],
      laycanFrom: new Date('2026-03-15'),
      laycanTo: new Date('2026-03-30'),
      rateIndication: 115,
      rateUnit: 'per_mt',
      status: 'enquiry',
      receivedVia: 'platform',
      organizationId: org.id,
    },
    {
      reference: 'ENQ-2026-012',
      chartererId: createdCompanies[1].id,
      cargoType: 'Coal',
      quantity: 58000,
      loadPortId: createdPorts['SGSIN'],
      dischargePortId: createdPorts['INMUN'],
      laycanFrom: new Date('2026-03-20'),
      laycanTo: new Date('2026-04-05'),
      rateIndication: 44,
      rateUnit: 'per_mt',
      status: 'enquiry',
      receivedVia: 'email',
      organizationId: org.id,
    },
  ];

  let createdEnquiries = 0;
  for (const enquiryData of enquiries) {
    await prisma.cargoEnquiry.upsert({
      where: { reference: enquiryData.reference },
      update: {},
      create: enquiryData,
    });
    createdEnquiries++;
  }
  console.log(`✅ Created/updated ${createdEnquiries} cargo enquiries`);

  // === Charters (Commission Tracking) ===
  console.log('\n📝 Creating charters...');

  const charters = [
    {
      reference: 'CH-2026-001',
      type: 'voyage',
      status: 'completed',
      vesselId: createdVessels[0].id,
      chartererId: createdCompanies[0].id,
      organizationId: org.id,
      laycanStart: new Date('2026-01-15'),
      laycanEnd: new Date('2026-01-30'),
      fixtureDate: new Date('2026-01-10'),
      freightRate: 50,
      freightUnit: 'per_mt',
      currency: 'USD',
      notes: 'Iron Ore - Brazil to China, 50,000 MT @ $50/MT, 2.5% commission = $62,500',
    },
    {
      reference: 'CH-2026-002',
      type: 'voyage',
      status: 'completed',
      vesselId: createdVessels[1].id,
      chartererId: createdCompanies[1].id,
      organizationId: org.id,
      laycanStart: new Date('2026-01-20'),
      laycanEnd: new Date('2026-02-05'),
      fixtureDate: new Date('2026-01-15'),
      freightRate: 45,
      freightUnit: 'per_mt',
      currency: 'USD',
      notes: 'Coal - Singapore to Dubai, 55,000 MT @ $45/MT, 3% commission = $74,250',
    },
    {
      reference: 'CH-2026-003',
      type: 'voyage',
      status: 'completed',
      vesselId: createdVessels[2].id,
      chartererId: createdCompanies[2].id,
      organizationId: org.id,
      laycanStart: new Date('2026-01-25'),
      laycanEnd: new Date('2026-02-10'),
      fixtureDate: new Date('2026-01-18'),
      freightRate: 55,
      freightUnit: 'per_mt',
      currency: 'USD',
      notes: 'Grain - US Gulf to Rotterdam, 48,000 MT @ $55/MT, 2% commission = $52,800',
    },
    {
      reference: 'CH-2026-004',
      type: 'voyage',
      status: 'in_progress',
      vesselId: createdVessels[3].id,
      chartererId: createdCompanies[3].id,
      organizationId: org.id,
      laycanStart: new Date('2026-02-10'),
      laycanEnd: new Date('2026-02-20'),
      fixtureDate: new Date('2026-02-05'),
      freightRate: 120,
      freightUnit: 'per_mt',
      currency: 'USD',
      notes: 'Containers - Singapore to Mumbai, 15,000 TEU @ $120/TEU, 0.25% commission = $4,500',
    },
  ];

  let createdCharters = 0;
  for (const charterData of charters) {
    await prisma.charter.upsert({
      where: { reference: charterData.reference },
      update: {},
      create: charterData,
    });
    createdCharters++;
  }
  console.log(`✅ Created/updated ${createdCharters} charters`);

  // === Customer Profiles (Customer Insights) ===
  console.log('\n👥 Creating customer profiles...');

  const customerProfiles = [
    {
      companyId: createdCompanies[0].id,
      companyName: 'Maersk Line',
      organizationId: org.id,
      customerSince: new Date('2020-01-15'),
      totalFixtures: 12,
      totalRevenue: 28500000,
      avgFixtureValue: 2375000,
      preferredRoutes: ['Brazil → China', 'Australia → India'],
      preferredVessels: ['BULK_CARRIER', 'CAPESIZE'],
      preferredCargoes: ['Iron Ore', 'Coal'],
      avgPaymentDays: 30,
      outstandingAmount: 0,
      creditRating: 'A',
      relationshipScore: 95,
      lastFixtureDate: new Date('2026-01-15'),
      lastContactDate: new Date('2026-02-08'),
      riskFlags: [],
      tags: ['premium', 'reliable', 'high-volume'],
      notes: 'Excellent payment track record. Prefers Brazilian iron ore routes.',
    },
    {
      companyId: createdCompanies[1].id,
      companyName: 'CMA CGM',
      organizationId: org.id,
      customerSince: new Date('2019-06-10'),
      totalFixtures: 18,
      totalRevenue: 35200000,
      avgFixtureValue: 1955556,
      preferredRoutes: ['Singapore → Middle East', 'China → Europe'],
      preferredVessels: ['BULK_CARRIER', 'PANAMAX'],
      preferredCargoes: ['Coal', 'Steel Products'],
      avgPaymentDays: 45,
      outstandingAmount: 850000,
      creditRating: 'A',
      relationshipScore: 88,
      lastFixtureDate: new Date('2026-01-20'),
      lastContactDate: new Date('2026-02-05'),
      riskFlags: [],
      tags: ['regular', 'strategic-partner'],
      notes: 'Consistent business. Occasional payment delays but always settles.',
    },
    {
      companyId: createdCompanies[2].id,
      companyName: 'MSC Mediterranean Shipping',
      organizationId: org.id,
      customerSince: new Date('2021-03-20'),
      totalFixtures: 8,
      totalRevenue: 19800000,
      avgFixtureValue: 2475000,
      preferredRoutes: ['US Gulf → Europe', 'South America → Asia'],
      preferredVessels: ['BULK_CARRIER', 'HANDYMAX'],
      preferredCargoes: ['Grain', 'Fertilizer'],
      avgPaymentDays: 35,
      outstandingAmount: 0,
      creditRating: 'B',
      relationshipScore: 82,
      lastFixtureDate: new Date('2026-01-25'),
      lastContactDate: new Date('2026-02-01'),
      riskFlags: [],
      tags: ['growing', 'potential'],
      notes: 'Newer customer with growth potential. Prefers grain trades.',
    },
    {
      companyId: createdCompanies[3].id,
      companyName: 'Hapag-Lloyd',
      organizationId: org.id,
      customerSince: new Date('2018-11-05'),
      totalFixtures: 15,
      totalRevenue: 22500000,
      avgFixtureValue: 1500000,
      preferredRoutes: ['Asia → India', 'Middle East → Asia'],
      preferredVessels: ['CONTAINER', 'BULK_CARRIER'],
      preferredCargoes: ['Containers', 'General Cargo'],
      avgPaymentDays: 60,
      outstandingAmount: 1200000,
      creditRating: 'B',
      relationshipScore: 75,
      lastFixtureDate: new Date('2026-02-10'),
      lastContactDate: new Date('2026-02-09'),
      riskFlags: ['slow-payment'],
      tags: ['established', 'needs-monitoring'],
      notes: 'Solid customer but requires payment follow-up. Container specialist.',
    },
    {
      companyId: createdCompanies[4].id,
      companyName: 'Ocean Network Express',
      organizationId: org.id,
      customerSince: new Date('2022-07-12'),
      totalFixtures: 5,
      totalRevenue: 8900000,
      avgFixtureValue: 1780000,
      preferredRoutes: ['Singapore → India', 'Asia → Middle East'],
      preferredVessels: ['BULK_CARRIER'],
      preferredCargoes: ['Coal', 'Iron Ore'],
      avgPaymentDays: 40,
      outstandingAmount: 0,
      creditRating: 'C',
      relationshipScore: 68,
      lastFixtureDate: new Date('2025-12-15'),
      lastContactDate: new Date('2026-01-20'),
      riskFlags: ['new-customer', 'limited-history'],
      tags: ['developing', 'watch-list'],
      notes: 'New customer with limited track record. Monitor closely.',
    },
    {
      companyId: createdCompanies[5].id,
      companyName: 'Cosco Shipping',
      organizationId: org.id,
      customerSince: new Date('2017-02-28'),
      totalFixtures: 22,
      totalRevenue: 42000000,
      avgFixtureValue: 1909091,
      preferredRoutes: ['Brazil → China', 'Australia → China'],
      preferredVessels: ['BULK_CARRIER', 'CAPESIZE'],
      preferredCargoes: ['Iron Ore', 'Coal', 'Grain'],
      avgPaymentDays: 75,
      outstandingAmount: 2500000,
      creditRating: 'D',
      relationshipScore: 62,
      lastFixtureDate: new Date('2025-11-30'),
      lastContactDate: new Date('2026-01-10'),
      riskFlags: ['slow-payment', 'high-outstanding'],
      tags: ['high-volume', 'payment-issues', 'requires-attention'],
      notes: 'Large customer but chronic payment delays. Consider credit limit review.',
    },
  ];

  let createdProfiles = 0;
  for (const profileData of customerProfiles) {
    await prisma.customerProfile.upsert({
      where: { companyId: profileData.companyId },
      update: {},
      create: profileData,
    });
    createdProfiles++;
  }
  console.log(`✅ Created/updated ${createdProfiles} customer profiles`);

  console.log('\n🎉 Demo showcase data seeding complete!\n');
  console.log('Summary:');
  console.log(`  - ${createdCompanies.length} companies`);
  console.log(`  - ${createdVessels.length} vessels`);
  console.log(`  - ${ports.length} ports`);
  console.log(`  - ${createdEnquiries} cargo enquiries`);
  console.log(`  - ${createdCharters} charters`);
  console.log(`  - ${createdProfiles} customer profiles`);
  console.log('\nDemo data is now available for showcase pages!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding demo data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
