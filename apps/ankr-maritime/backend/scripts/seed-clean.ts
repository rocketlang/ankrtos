/**
 * Clean Seed Data for Mari8X - Phase 1
 * Focus: Companies, Vessels, Charters, S&P Listings
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌊 Seeding Mari8X database...\n');

  // Get existing org
  const org = await prisma.organization.findFirst();
  if (!org) {
    console.error('❌ No organization found. Run basic seed first.');
    return;
  }

  console.log(`✅ Using organization: ${org.name}\n`);

  // ========================================
  // COMPANIES WITH CITY
  // ========================================
  console.log('📍 Creating companies with city field...');

  const companiesData = [
    { name: 'ANKR Shipping Ltd', type: 'owner', country: 'IN', city: 'Mumbai' },
    { name: 'Hellenic Maritime SA', type: 'owner', country: 'GR', city: 'Athens' },
    { name: 'Singapore Marine Pte Ltd', type: 'owner', country: 'SG', city: 'Singapore' },
    { name: 'Nordic Shipping AS', type: 'owner', country: 'NO', city: 'Oslo' },
    { name: 'Hong Kong Bulk Carriers', type: 'owner', country: 'HK', city: 'Hong Kong' },
    { name: 'Trafigura Maritime Logistics', type: 'charterer', country: 'SG', city: 'Singapore' },
    { name: 'Cargill Ocean Transportation', type: 'charterer', country: 'US', city: 'Minneapolis' },
    { name: 'Vitol Chartering SA', type: 'charterer', country: 'CH', city: 'Geneva' },
    { name: 'SAIL India Shipping', type: 'charterer', country: 'IN', city: 'New Delhi' },
    { name: 'Noble Resources', type: 'charterer', country: 'HK', city: 'Hong Kong' },
    { name: 'Clarksons Platou', type: 'broker', country: 'GB', city: 'London' },
    { name: 'Braemar ACM Shipbroking', type: 'broker', country: 'GB', city: 'London' },
    { name: 'Simpson Spence Young', type: 'broker', country: 'GB', city: 'London' },
    { name: 'GAC Singapore', type: 'agent', country: 'SG', city: 'Singapore' },
    { name: 'Inchcape Shipping Mumbai', type: 'agent', country: 'IN', city: 'Mumbai' },
  ];

  const companies: any[] = [];
  for (const c of companiesData) {
    const existing = await prisma.company.findFirst({
      where: { name: c.name, organizationId: org.id },
    });

    if (existing) {
      companies.push(existing);
      console.log(`   ⏭️  ${c.name} (exists)`);
    } else {
      const created = await prisma.company.create({
        data: { ...c, organizationId: org.id },
      });
      companies.push(created);
      console.log(`   ✅ ${c.name}`);
    }
  }

  // Company lookup map
  const C = (name: string) => companies.find(c => c.name === name)?.id;

  console.log(`\n✅ ${companies.length} companies ready\n`);

  // ========================================
  // VESSELS
  // ========================================
  console.log('🚢 Creating vessels...');

  const vesselsData = [
    { name: 'CAPE GLORY', imo: '9876543', type: 'bulk_carrier', dwt: 180000, yearBuilt: 2018, flag: 'LR', owner: 'ANKR Shipping Ltd' },
    { name: 'PANAMAX STAR', imo: '9876544', type: 'bulk_carrier', dwt: 75000, yearBuilt: 2015, flag: 'SG', owner: 'Singapore Marine Pte Ltd' },
    { name: 'HANDYMAX PRIDE', imo: '9876545', type: 'bulk_carrier', dwt: 55000, yearBuilt: 2017, flag: 'MH', owner: 'Hellenic Maritime SA' },
    { name: 'ULTRAMAX FORTUNE', imo: '9876546', type: 'bulk_carrier', dwt: 64000, yearBuilt: 2020, flag: 'GR', owner: 'Hellenic Maritime SA' },
    { name: 'KAMSARMAX SPIRIT', imo: '9876547', type: 'bulk_carrier', dwt: 82000, yearBuilt: 2019, flag: 'JP', owner: 'Hong Kong Bulk Carriers' },
    { name: 'VLCC TITAN', imo: '9876551', type: 'tanker', dwt: 320000, yearBuilt: 2019, flag: 'LR', owner: 'Hellenic Maritime SA' },
    { name: 'AFRAMAX PIONEER', imo: '9876553', type: 'tanker', dwt: 115000, yearBuilt: 2017, flag: 'SG', owner: 'Singapore Marine Pte Ltd' },
    { name: 'MR PRODUCT CARRIER', imo: '9876554', type: 'tanker', dwt: 50000, yearBuilt: 2020, flag: 'NO', owner: 'Nordic Shipping AS' },
    { name: 'HANDYSIZE CHAMPION', imo: '9876549', type: 'bulk_carrier', dwt: 35000, yearBuilt: 2014, flag: 'NO', owner: 'Nordic Shipping AS' },
    { name: 'FEEDER EXPRESS', imo: '9876558', type: 'container', dwt: 15000, yearBuilt: 2014, flag: 'SG', owner: 'Singapore Marine Pte Ltd' },
  ];

  const vessels: any[] = [];
  for (const v of vesselsData) {
    const existing = await prisma.vessel.findUnique({ where: { imo: v.imo } });

    if (existing) {
      vessels.push(existing);
      console.log(`   ⏭️  ${v.name} (exists)`);
    } else {
      const created = await prisma.vessel.create({
        data: {
          name: v.name,
          imo: v.imo,
          type: v.type,
          dwt: v.dwt,
          yearBuilt: v.yearBuilt,
          flag: v.flag,
          registeredOwner: v.owner,
          organizationId: org.id,
        },
      });
      vessels.push(created);
      console.log(`   ✅ ${v.name}`);
    }
  }

  // Vessel lookup
  const V = (name: string) => vessels.find(v => v.name === name)?.id;

  console.log(`\n✅ ${vessels.length} vessels ready\n`);

  // ========================================
  // CHARTERS
  // ========================================
  console.log('📜 Creating charters...');

  const chartersData = [
    {
      ref: 'VCH-2026-001',
      type: 'voyage',
      status: 'fixed',
      vessel: 'CAPE GLORY',
      charterer: 'Trafigura Maritime Logistics',
      broker: 'Clarksons Platou',
      rate: 12.50,
      unit: 'per_mt',
      laycanStart: '2026-02-15',
      laycanEnd: '2026-02-20',
      notes: 'Iron Ore 170,000 MT from AUMEL to CNQZH',
    },
    {
      ref: 'VCH-2026-002',
      type: 'voyage',
      status: 'on_subs',
      vessel: 'PANAMAX STAR',
      charterer: 'Cargill Ocean Transportation',
      broker: 'Braemar ACM Shipbroking',
      rate: 32.00,
      unit: 'per_mt',
      laycanStart: '2026-03-01',
      laycanEnd: '2026-03-05',
      notes: 'Soya Beans 72,000 MT from BRSSZ to INMUN',
    },
    {
      ref: 'TCH-2026-001',
      type: 'time_charter',
      status: 'fixed',
      vessel: 'ULTRAMAX FORTUNE',
      charterer: 'Trafigura Maritime Logistics',
      broker: 'Clarksons Platou',
      rate: 14500,
      unit: 'per_day',
      notes: '12 months TC, delivery SGSIN',
    },
  ];

  for (const ch of chartersData) {
    const existing = await prisma.charter.findUnique({ where: { reference: ch.ref } });

    if (existing) {
      console.log(`   ⏭️  ${ch.ref} (exists)`);
    } else {
      await prisma.charter.create({
        data: {
          reference: ch.ref,
          type: ch.type,
          status: ch.status,
          vesselId: V(ch.vessel),
          chartererId: C(ch.charterer),
          brokerId: C(ch.broker),
          freightRate: ch.rate,
          freightUnit: ch.unit,
          currency: 'USD',
          laycanStart: ch.laycanStart ? new Date(ch.laycanStart) : undefined,
          laycanEnd: ch.laycanEnd ? new Date(ch.laycanEnd) : undefined,
          notes: ch.notes,
          organizationId: org.id,
        },
      });
      console.log(`   ✅ ${ch.ref}`);
    }
  }

  console.log('\n✅ Charters created\n');

  // ========================================
  // S&P LISTINGS
  // ========================================
  console.log('💰 Creating S&P listings...');

  const listingsData = [
    { vessel: 'HANDYSIZE CHAMPION', seller: 'Nordic Shipping AS', price: 12500000, status: 'active', delivery: '2026-04-01' },
    { vessel: 'MR PRODUCT CARRIER', seller: 'Nordic Shipping AS', price: 28000000, status: 'under_negotiation', delivery: '2026-05-15' },
    { vessel: 'FEEDER EXPRESS', seller: 'Singapore Marine Pte Ltd', price: 8200000, status: 'sold', delivery: '2026-03-01', soldPrice: 8200000 },
  ];

  for (const listing of listingsData) {
    const vesselId = V(listing.vessel);
    const existing = await prisma.saleListing.findFirst({ where: { vesselId } });

    if (existing) {
      console.log(`   ⏭️  ${listing.vessel} (exists)`);
    } else {
      await prisma.saleListing.create({
        data: {
          vesselId,
          sellerOrgId: org.id,
          status: listing.status,
          askingPrice: listing.price,
          soldPrice: listing.soldPrice,
          currency: 'USD',
          condition: 'as_is',
          publishedAt: new Date('2026-01-15'),
        },
      });
      console.log(`   ✅ ${listing.vessel}`);
    }
  }

  console.log('\n✅ S&P listings created\n');

  // ========================================
  // SUMMARY
  // ========================================
  console.log('🎉 Seed complete!\n');
  console.log('📊 Summary:');
  console.log(`   • ${companies.length} companies (with city field ✨)`);
  console.log(`   • ${vessels.length} vessels`);
  console.log(`   • 3 charters (voyage + time charter)`);
  console.log(`   • 3 S&P listings\n`);
  console.log('🚀 Test frontends:');
  console.log('   • CharteringDesk: http://localhost:3008/chartering-desk');
  console.log('   • SNPDesk: http://localhost:3008/snp-desk\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
