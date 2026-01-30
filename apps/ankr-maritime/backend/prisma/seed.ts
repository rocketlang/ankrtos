import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding ankr_maritime database...');

  // === Organization ===
  const org = await prisma.organization.upsert({
    where: { code: 'ANKR-MAR' },
    update: {},
    create: {
      name: 'ANKR Maritime Pvt Ltd',
      code: 'ANKR-MAR',
      type: 'shipowner',
      country: 'IN',
    },
  });
  console.log(`  Organization: ${org.name} (${org.id})`);

  // === Admin User ===
  const passwordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ankr.in' },
    update: {},
    create: {
      email: 'admin@ankr.in',
      name: 'Captain Admin',
      passwordHash,
      role: 'admin',
      organizationId: org.id,
    },
  });
  console.log(`  Admin user: ${admin.email}`);

  // === Operator User ===
  const operator = await prisma.user.upsert({
    where: { email: 'ops@ankr.in' },
    update: {},
    create: {
      email: 'ops@ankr.in',
      name: 'Voyage Operator',
      passwordHash: await bcrypt.hash('ops123', 10),
      role: 'operator',
      organizationId: org.id,
    },
  });
  console.log(`  Operator user: ${operator.email}`);

  // === Ports (50 major world ports) ===
  const ports = [
    { unlocode: 'SGSIN', name: 'Singapore', country: 'SG', latitude: 1.2644, longitude: 103.8200, timezone: 'Asia/Singapore', type: 'seaport' },
    { unlocode: 'CNSHA', name: 'Shanghai', country: 'CN', latitude: 31.2304, longitude: 121.4737, timezone: 'Asia/Shanghai', type: 'seaport' },
    { unlocode: 'NLRTM', name: 'Rotterdam', country: 'NL', latitude: 51.9225, longitude: 4.4792, timezone: 'Europe/Amsterdam', type: 'seaport' },
    { unlocode: 'CNNGB', name: 'Ningbo-Zhoushan', country: 'CN', latitude: 29.8683, longitude: 121.5440, timezone: 'Asia/Shanghai', type: 'seaport' },
    { unlocode: 'HKHKG', name: 'Hong Kong', country: 'HK', latitude: 22.2855, longitude: 114.1577, timezone: 'Asia/Hong_Kong', type: 'seaport' },
    { unlocode: 'KRPUS', name: 'Busan', country: 'KR', latitude: 35.1028, longitude: 129.0403, timezone: 'Asia/Seoul', type: 'seaport' },
    { unlocode: 'CNQZH', name: 'Guangzhou', country: 'CN', latitude: 23.1291, longitude: 113.2644, timezone: 'Asia/Shanghai', type: 'seaport' },
    { unlocode: 'CNTXG', name: 'Qingdao', country: 'CN', latitude: 36.0671, longitude: 120.3826, timezone: 'Asia/Shanghai', type: 'seaport' },
    { unlocode: 'AEJEA', name: 'Jebel Ali', country: 'AE', latitude: 25.0074, longitude: 55.0718, timezone: 'Asia/Dubai', type: 'seaport' },
    { unlocode: 'CNTSN', name: 'Tianjin', country: 'CN', latitude: 38.9860, longitude: 117.7590, timezone: 'Asia/Shanghai', type: 'seaport' },
    { unlocode: 'MYTPP', name: 'Port Klang', country: 'MY', latitude: 3.0000, longitude: 101.3833, timezone: 'Asia/Kuala_Lumpur', type: 'seaport' },
    { unlocode: 'DEHAM', name: 'Hamburg', country: 'DE', latitude: 53.5511, longitude: 9.9937, timezone: 'Europe/Berlin', type: 'seaport' },
    { unlocode: 'BEANR', name: 'Antwerp', country: 'BE', latitude: 51.2194, longitude: 4.4025, timezone: 'Europe/Brussels', type: 'seaport' },
    { unlocode: 'CNXMN', name: 'Xiamen', country: 'CN', latitude: 24.4798, longitude: 118.0894, timezone: 'Asia/Shanghai', type: 'seaport' },
    { unlocode: 'USNYC', name: 'New York / New Jersey', country: 'US', latitude: 40.6892, longitude: -74.0445, timezone: 'America/New_York', type: 'seaport' },
    { unlocode: 'USLAX', name: 'Los Angeles', country: 'US', latitude: 33.7405, longitude: -118.2728, timezone: 'America/Los_Angeles', type: 'seaport' },
    { unlocode: 'JPTYO', name: 'Tokyo', country: 'JP', latitude: 35.6528, longitude: 139.8396, timezone: 'Asia/Tokyo', type: 'seaport' },
    { unlocode: 'TWKHH', name: 'Kaohsiung', country: 'TW', latitude: 22.6163, longitude: 120.3100, timezone: 'Asia/Taipei', type: 'seaport' },
    { unlocode: 'INMUN', name: 'Mumbai (JNPT)', country: 'IN', latitude: 18.9500, longitude: 72.9500, timezone: 'Asia/Kolkata', type: 'seaport' },
    { unlocode: 'INMAA', name: 'Chennai', country: 'IN', latitude: 13.0827, longitude: 80.2707, timezone: 'Asia/Kolkata', type: 'seaport' },
    { unlocode: 'INIXE', name: 'Mangalore (NMPT)', country: 'IN', latitude: 12.8656, longitude: 74.8426, timezone: 'Asia/Kolkata', type: 'seaport' },
    { unlocode: 'INVTZ', name: 'Visakhapatnam', country: 'IN', latitude: 17.6868, longitude: 83.2185, timezone: 'Asia/Kolkata', type: 'seaport' },
    { unlocode: 'INKAK', name: 'Kandla', country: 'IN', latitude: 23.0333, longitude: 70.2167, timezone: 'Asia/Kolkata', type: 'seaport' },
    { unlocode: 'INCOK', name: 'Cochin', country: 'IN', latitude: 9.9312, longitude: 76.2673, timezone: 'Asia/Kolkata', type: 'seaport' },
    { unlocode: 'INPAR', name: 'Paradip', country: 'IN', latitude: 20.2667, longitude: 86.6167, timezone: 'Asia/Kolkata', type: 'seaport' },
    { unlocode: 'INGOA', name: 'Mormugao (Goa)', country: 'IN', latitude: 15.4127, longitude: 73.8007, timezone: 'Asia/Kolkata', type: 'seaport' },
    { unlocode: 'INTUT', name: 'Tuticorin', country: 'IN', latitude: 8.7642, longitude: 78.1348, timezone: 'Asia/Kolkata', type: 'seaport' },
    { unlocode: 'INHZR', name: 'Haldia', country: 'IN', latitude: 22.0667, longitude: 88.0667, timezone: 'Asia/Kolkata', type: 'seaport' },
    { unlocode: 'INCCL', name: 'Kolkata', country: 'IN', latitude: 22.5726, longitude: 88.3639, timezone: 'Asia/Kolkata', type: 'seaport' },
    { unlocode: 'INPAV', name: 'Pipavav', country: 'IN', latitude: 20.9500, longitude: 71.5167, timezone: 'Asia/Kolkata', type: 'seaport' },
    { unlocode: 'INMND', name: 'Mundra', country: 'IN', latitude: 22.8389, longitude: 69.7250, timezone: 'Asia/Kolkata', type: 'seaport' },
    { unlocode: 'GBFXT', name: 'Felixstowe', country: 'GB', latitude: 51.9536, longitude: 1.3508, timezone: 'Europe/London', type: 'seaport' },
    { unlocode: 'GBLGP', name: 'London Gateway', country: 'GB', latitude: 51.5000, longitude: 0.4500, timezone: 'Europe/London', type: 'seaport' },
    { unlocode: 'ESVLC', name: 'Valencia', country: 'ES', latitude: 39.4502, longitude: -0.3244, timezone: 'Europe/Madrid', type: 'seaport' },
    { unlocode: 'GRPIR', name: 'Piraeus', country: 'GR', latitude: 37.9475, longitude: 23.6372, timezone: 'Europe/Athens', type: 'seaport' },
    { unlocode: 'EGPSD', name: 'Port Said', country: 'EG', latitude: 31.2653, longitude: 32.3019, timezone: 'Africa/Cairo', type: 'seaport' },
    { unlocode: 'ZADUR', name: 'Durban', country: 'ZA', latitude: -29.8587, longitude: 31.0218, timezone: 'Africa/Johannesburg', type: 'seaport' },
    { unlocode: 'BRSSZ', name: 'Santos', country: 'BR', latitude: -23.9608, longitude: -46.3000, timezone: 'America/Sao_Paulo', type: 'seaport' },
    { unlocode: 'AUPKL', name: 'Port Kembla', country: 'AU', latitude: -34.4667, longitude: 150.9000, timezone: 'Australia/Sydney', type: 'seaport' },
    { unlocode: 'AUMEL', name: 'Melbourne', country: 'AU', latitude: -37.8136, longitude: 144.9631, timezone: 'Australia/Melbourne', type: 'seaport' },
    { unlocode: 'JPYOK', name: 'Yokohama', country: 'JP', latitude: 35.4437, longitude: 139.6380, timezone: 'Asia/Tokyo', type: 'seaport' },
    { unlocode: 'JPKOB', name: 'Kobe', country: 'JP', latitude: 34.6901, longitude: 135.1956, timezone: 'Asia/Tokyo', type: 'seaport' },
    { unlocode: 'SAJED', name: 'Jeddah', country: 'SA', latitude: 21.4858, longitude: 39.1925, timezone: 'Asia/Riyadh', type: 'seaport' },
    { unlocode: 'LKCMB', name: 'Colombo', country: 'LK', latitude: 6.9271, longitude: 79.8612, timezone: 'Asia/Colombo', type: 'seaport' },
    { unlocode: 'VNSGN', name: 'Ho Chi Minh City', country: 'VN', latitude: 10.7769, longitude: 106.7009, timezone: 'Asia/Ho_Chi_Minh', type: 'seaport' },
    { unlocode: 'THBKK', name: 'Laem Chabang', country: 'TH', latitude: 13.0700, longitude: 100.8800, timezone: 'Asia/Bangkok', type: 'seaport' },
    { unlocode: 'MAPTM', name: 'Tanger Med', country: 'MA', latitude: 35.8867, longitude: -5.5047, timezone: 'Africa/Casablanca', type: 'seaport' },
    { unlocode: 'PAMIT', name: 'Balboa (Panama)', country: 'PA', latitude: 8.9500, longitude: -79.5667, timezone: 'America/Panama', type: 'seaport' },
    { unlocode: 'USHOU', name: 'Houston', country: 'US', latitude: 29.7266, longitude: -95.2563, timezone: 'America/Chicago', type: 'seaport' },
    { unlocode: 'USSAV', name: 'Savannah', country: 'US', latitude: 32.0835, longitude: -81.0998, timezone: 'America/New_York', type: 'seaport' },
  ];

  let portCount = 0;
  for (const p of ports) {
    await prisma.port.upsert({
      where: { unlocode: p.unlocode },
      update: {},
      create: p,
    });
    portCount++;
  }
  console.log(`  Ports: ${portCount} seeded`);

  // === Vessels ===
  const vessels = [
    { imo: '9321483', name: 'MV ANKR Pioneer', type: 'bulk_carrier', flag: 'IN', dwt: 82000, grt: 43500, nrt: 25200, loa: 229, beam: 32.3, draft: 14.5, yearBuilt: 2006, status: 'active' },
    { imo: '9456781', name: 'MV Ocean Harmony', type: 'tanker', flag: 'PA', dwt: 115000, grt: 60200, nrt: 35100, loa: 250, beam: 44, draft: 16.2, yearBuilt: 2010, status: 'active' },
    { imo: '9587234', name: 'MV Star Navigator', type: 'container', flag: 'SG', dwt: 52000, grt: 54000, nrt: 28500, loa: 294, beam: 32.2, draft: 13.5, yearBuilt: 2014, status: 'active' },
    { imo: '9612890', name: 'MV Gujarat Pride', type: 'bulk_carrier', flag: 'IN', dwt: 75000, grt: 40100, nrt: 23400, loa: 225, beam: 32.3, draft: 14.3, yearBuilt: 2016, status: 'active' },
    { imo: '9734521', name: 'MV Blue Meridian', type: 'general_cargo', flag: 'HK', dwt: 28000, grt: 18500, nrt: 10200, loa: 170, beam: 27.2, draft: 10.8, yearBuilt: 2019, status: 'active' },
    { imo: '9845672', name: 'MV Cape Fortune', type: 'bulk_carrier', flag: 'MH', dwt: 180000, grt: 93500, nrt: 55800, loa: 292, beam: 45, draft: 18.2, yearBuilt: 2021, status: 'active' },
    { imo: '9901234', name: 'MV Sagar Shakti', type: 'tanker', flag: 'IN', dwt: 45000, grt: 25800, nrt: 14200, loa: 183, beam: 32.2, draft: 12.4, yearBuilt: 2022, status: 'active' },
  ];

  for (const v of vessels) {
    await prisma.vessel.upsert({
      where: { imo: v.imo },
      update: {},
      create: { ...v, organizationId: org.id },
    });
  }
  console.log(`  Vessels: ${vessels.length} seeded`);

  // === Companies ===
  const companies = [
    { name: 'Cargill International SA', type: 'charterer', country: 'CH', contactEmail: 'chartering@cargill.com' },
    { name: 'Trafigura Maritime', type: 'charterer', country: 'SG', contactEmail: 'ops@trafigura.com' },
    { name: 'Clarksons Platou', type: 'broker', country: 'GB', contactEmail: 'dry@clarksons.com' },
    { name: 'Simpson Spence Young (SSY)', type: 'broker', country: 'GB', contactEmail: 'info@ssy.co' },
    { name: 'J M Baxi & Co', type: 'agent', country: 'IN', contactEmail: 'agency@jmbaxi.com' },
    { name: 'GAC India', type: 'agent', country: 'IN', contactEmail: 'india@gac.com' },
    { name: 'Wilhelmsen Ships Service', type: 'agent', country: 'NO', contactEmail: 'agency@wilhelmsen.com' },
    { name: 'Inchcape Shipping Services', type: 'agent', country: 'GB', contactEmail: 'ops@iss-shipping.com' },
    { name: 'Blue Water Shipping', type: 'cha', country: 'DK', contactEmail: 'clearance@bws.dk' },
    { name: 'Aegean Bunkering', type: 'bunker_supplier', country: 'GR', contactEmail: 'bunkers@aegean.com' },
  ];

  for (const c of companies) {
    const existing = await prisma.company.findFirst({
      where: { name: c.name, organizationId: org.id },
    });
    if (!existing) {
      await prisma.company.create({
        data: { ...c, organizationId: org.id },
      });
    }
  }
  console.log(`  Companies: ${companies.length} seeded`);

  // === Sample Clauses (core maritime clauses) ===
  const clauses = [
    { code: 'BIMCO-WAR', title: 'War Risks Clause', body: 'If any port of loading or of discharge named in this Contract or to which the vessel may properly be ordered pursuant to the terms of the Bills of Lading be blockaded, or if owing to any war, hostilities, warlike operations...', category: 'war', source: 'BIMCO' },
    { code: 'BIMCO-ICE', title: 'Ice Clause', body: 'In case of ice at port of loading or discharge that prevents the vessel from reaching the port or berth, the Master shall notify Charterers and request revised instructions...', category: 'ice', source: 'BIMCO' },
    { code: 'GENCON-DEM', title: 'Demurrage Clause (GENCON)', body: 'Demurrage at the loading and discharging port is payable by the Charterers at the rate stated in Box 20 per day or pro rata for any part of a day. Demurrage shall fall due day by day and shall be payable upon receipt of the Owners invoice...', category: 'demurrage', source: 'GENCON' },
    { code: 'GENCON-LAY', title: 'Laytime Clause (GENCON)', body: 'Laytime for loading and discharging shall commence at 14:00 hours, if NOR is given before 12:00 hours, and at 08:00 hours next working day if NOR given during office hours after 12:00 hours...', category: 'laytime', source: 'GENCON' },
    { code: 'BIMCO-PIRACY', title: 'Piracy Clause for Voyage Charter Parties', body: 'The vessel shall not be obliged to proceed to or through any port, place, area or zone which in the reasonable judgement of the Master and/or the Owners is dangerous to the vessel, her cargo, crew...', category: 'piracy', source: 'BIMCO' },
    { code: 'BIMCO-ISM', title: 'ISM/ISPS/MLC Clause', body: 'The Owners warrant that at the date of this Charter Party the vessel holds a valid Document of Compliance and a Safety Management Certificate in accordance with the ISM Code...', category: 'insurance', source: 'BIMCO' },
    { code: 'BIMCO-SANC', title: 'Sanctions Clause', body: 'The parties shall not be required to perform any obligation under this Charter Party if the performance of such obligation would result in a violation of any applicable sanctions, prohibitions or restrictions...', category: 'sanctions', source: 'BIMCO' },
    { code: 'GENCON-BILL', title: 'Bills of Lading Clause (GENCON)', body: 'The Master shall sign Bills of Lading as presented, in conformity with Mates or Tally Clerks receipts. The Charterers hereby indemnify the Owners against all consequences...', category: 'documentation', source: 'GENCON' },
  ];

  for (const cl of clauses) {
    await prisma.clause.upsert({
      where: { code: cl.code },
      update: {},
      create: cl,
    });
  }
  console.log(`  Clauses: ${clauses.length} seeded`);

  // === Sample Cargo ===
  const cargoes = [
    { commodity: 'Iron Ore Fines', hsCode: '2601.11', quantity: 75000, packaging: 'bulk', description: 'Indian iron ore fines, Fe 62%' },
    { commodity: 'Thermal Coal', hsCode: '2701.12', quantity: 55000, packaging: 'bulk', description: 'Indonesian thermal coal, NAR 4200 kcal' },
    { commodity: 'Wheat', hsCode: '1001.99', quantity: 42000, packaging: 'bulk', description: 'Australian Standard White wheat' },
    { commodity: 'Crude Oil', hsCode: '2709.00', quantity: 95000, packaging: 'liquid', description: 'Arabian Light crude, API 34' },
    { commodity: 'Steel Coils', hsCode: '7208.10', quantity: 18000, packaging: 'general', description: 'Hot-rolled steel coils' },
  ];

  for (const cargo of cargoes) {
    const existing = await prisma.cargo.findFirst({ where: { commodity: cargo.commodity } });
    if (!existing) {
      await prisma.cargo.create({ data: cargo });
    }
  }
  console.log(`  Cargoes: ${cargoes.length} seeded`);

  console.log('\nSeed complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
