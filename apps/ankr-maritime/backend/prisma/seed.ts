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

  // === Demo User (Limited Access) ===
  const demo = await prisma.user.upsert({
    where: { email: 'demo@mari8x.com' },
    update: {},
    create: {
      email: 'demo@mari8x.com',
      name: 'Demo User',
      passwordHash: await bcrypt.hash('demo123', 10),
      role: 'viewer', // Limited role
      organizationId: org.id,
    },
  });
  console.log(`  Demo user: ${demo.email}`);

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

  // Fetch IDs for references
  const allVessels = await prisma.vessel.findMany();
  const allPorts = await prisma.port.findMany();
  const allCompanies = await prisma.company.findMany();
  const allCargoes = await prisma.cargo.findMany();

  const vesselByName = (n: string) => allVessels.find((v) => v.name.includes(n))!;
  const portByCode = (c: string) => allPorts.find((p) => p.unlocode === c)!;
  const companyByName = (n: string) => allCompanies.find((c) => c.name.includes(n))!;
  const cargoByComm = (c: string) => allCargoes.find((x) => x.commodity.includes(c))!;

  // === Charters ===
  const charterData = [
    {
      reference: 'FIX-2026-001',
      type: 'voyage',
      status: 'executed',
      vesselId: vesselByName('Pioneer').id,
      chartererId: companyByName('Cargill').id,
      brokerId: companyByName('Clarksons').id,
      organizationId: org.id,
      laycanStart: new Date('2025-12-20'),
      laycanEnd: new Date('2025-12-28'),
      fixtureDate: new Date('2025-12-10'),
      freightRate: 14.5,
      freightUnit: 'per_mt',
      currency: 'USD',
      notes: 'Iron ore fines ex-Paradip to Qingdao, GENCON 94',
    },
    {
      reference: 'FIX-2026-002',
      type: 'voyage',
      status: 'executed',
      vesselId: vesselByName('Gujarat').id,
      chartererId: companyByName('Trafigura').id,
      brokerId: companyByName('SSY').id,
      organizationId: org.id,
      laycanStart: new Date('2026-01-05'),
      laycanEnd: new Date('2026-01-12'),
      fixtureDate: new Date('2025-12-22'),
      freightRate: 11.8,
      freightUnit: 'per_mt',
      currency: 'USD',
      notes: 'Thermal coal ex-Mundra to Singapore',
    },
    {
      reference: 'FIX-2026-003',
      type: 'voyage',
      status: 'fixed',
      vesselId: vesselByName('Cape Fortune').id,
      chartererId: companyByName('Cargill').id,
      brokerId: companyByName('Clarksons').id,
      organizationId: org.id,
      laycanStart: new Date('2026-02-10'),
      laycanEnd: new Date('2026-02-18'),
      fixtureDate: new Date('2026-01-20'),
      freightRate: 18.2,
      freightUnit: 'per_mt',
      currency: 'USD',
      notes: 'Wheat ex-Melbourne to Mumbai, GENCON 94',
    },
    {
      reference: 'FIX-2026-004',
      type: 'voyage',
      status: 'completed',
      vesselId: vesselByName('Sagar Shakti').id,
      chartererId: companyByName('Trafigura').id,
      brokerId: companyByName('SSY').id,
      organizationId: org.id,
      laycanStart: new Date('2025-11-15'),
      laycanEnd: new Date('2025-11-22'),
      fixtureDate: new Date('2025-11-05'),
      freightRate: 350000,
      freightUnit: 'lumpsum',
      currency: 'USD',
      notes: 'Clean petroleum products Mumbai to Jeddah, lumpsum',
    },
    {
      reference: 'FIX-2026-005',
      type: 'voyage',
      status: 'executed',
      vesselId: vesselByName('Star Navigator').id,
      chartererId: companyByName('Cargill').id,
      brokerId: companyByName('SSY').id,
      organizationId: org.id,
      laycanStart: new Date('2026-01-10'),
      laycanEnd: new Date('2026-01-18'),
      fixtureDate: new Date('2025-12-28'),
      freightRate: 22.5,
      freightUnit: 'per_mt',
      currency: 'USD',
      notes: 'Steel coils ex-Shanghai to Rotterdam',
    },
  ];

  const charterRecords = [];
  for (const ch of charterData) {
    const existing = await prisma.charter.findUnique({ where: { reference: ch.reference } });
    if (!existing) {
      charterRecords.push(await prisma.charter.create({ data: ch }));
    } else {
      charterRecords.push(existing);
    }
  }
  console.log(`  Charters: ${charterRecords.length} seeded`);

  // === Voyages ===
  const voyageData = [
    {
      voyageNumber: 'V-2026-001',
      vesselId: vesselByName('Pioneer').id,
      charterId: charterRecords[0].id,
      cargoId: cargoByComm('Iron Ore').id,
      departurePortId: portByCode('INPAR').id,
      arrivalPortId: portByCode('CNTXG').id,
      status: 'completed',
      etd: new Date('2025-12-22T08:00:00Z'),
      eta: new Date('2026-01-08T06:00:00Z'),
      atd: new Date('2025-12-23T14:30:00Z'),
      ata: new Date('2026-01-09T11:00:00Z'),
    },
    {
      voyageNumber: 'V-2026-002',
      vesselId: vesselByName('Gujarat').id,
      charterId: charterRecords[1].id,
      cargoId: cargoByComm('Coal').id,
      departurePortId: portByCode('INMND').id,
      arrivalPortId: portByCode('SGSIN').id,
      status: 'in_progress',
      etd: new Date('2026-01-08T06:00:00Z'),
      eta: new Date('2026-01-20T18:00:00Z'),
      atd: new Date('2026-01-09T10:00:00Z'),
    },
    {
      voyageNumber: 'V-2026-003',
      vesselId: vesselByName('Cape Fortune').id,
      charterId: charterRecords[2].id,
      cargoId: cargoByComm('Wheat').id,
      departurePortId: portByCode('AUMEL').id,
      arrivalPortId: portByCode('INMUN').id,
      status: 'planned',
      etd: new Date('2026-02-12T04:00:00Z'),
      eta: new Date('2026-03-02T10:00:00Z'),
    },
    {
      voyageNumber: 'V-2026-004',
      vesselId: vesselByName('Sagar Shakti').id,
      charterId: charterRecords[3].id,
      cargoId: cargoByComm('Crude Oil').id,
      departurePortId: portByCode('INMUN').id,
      arrivalPortId: portByCode('SAJED').id,
      status: 'completed',
      etd: new Date('2025-11-18T06:00:00Z'),
      eta: new Date('2025-11-26T14:00:00Z'),
      atd: new Date('2025-11-19T08:30:00Z'),
      ata: new Date('2025-11-27T10:00:00Z'),
    },
    {
      voyageNumber: 'V-2026-005',
      vesselId: vesselByName('Star Navigator').id,
      charterId: charterRecords[4].id,
      cargoId: cargoByComm('Steel').id,
      departurePortId: portByCode('CNSHA').id,
      arrivalPortId: portByCode('NLRTM').id,
      status: 'in_progress',
      etd: new Date('2026-01-12T04:00:00Z'),
      eta: new Date('2026-02-14T08:00:00Z'),
      atd: new Date('2026-01-13T06:00:00Z'),
    },
  ];

  const voyageRecords = [];
  for (const voy of voyageData) {
    const existing = await prisma.voyage.findUnique({ where: { voyageNumber: voy.voyageNumber } });
    if (!existing) {
      voyageRecords.push(await prisma.voyage.create({ data: voy }));
    } else {
      voyageRecords.push(existing);
    }
  }
  console.log(`  Voyages: ${voyageRecords.length} seeded`);

  // === Voyage Milestones ===
  const milestoneData = [
    // V-2026-001 (completed)
    { voyageId: voyageRecords[0].id, portId: portByCode('INPAR').id, type: 'nor_tendered', actual: new Date('2025-12-22T06:00:00Z') },
    { voyageId: voyageRecords[0].id, portId: portByCode('INPAR').id, type: 'berthed', actual: new Date('2025-12-22T18:00:00Z') },
    { voyageId: voyageRecords[0].id, portId: portByCode('INPAR').id, type: 'loading_commenced', actual: new Date('2025-12-23T02:00:00Z') },
    { voyageId: voyageRecords[0].id, portId: portByCode('INPAR').id, type: 'loading_completed', actual: new Date('2025-12-23T12:00:00Z') },
    { voyageId: voyageRecords[0].id, portId: portByCode('INPAR').id, type: 'departure', actual: new Date('2025-12-23T14:30:00Z') },
    { voyageId: voyageRecords[0].id, portId: portByCode('CNTXG').id, type: 'arrival', actual: new Date('2026-01-09T11:00:00Z') },
    { voyageId: voyageRecords[0].id, portId: portByCode('CNTXG').id, type: 'nor_tendered', actual: new Date('2026-01-09T12:00:00Z') },
    { voyageId: voyageRecords[0].id, portId: portByCode('CNTXG').id, type: 'berthed', actual: new Date('2026-01-10T04:00:00Z') },
    { voyageId: voyageRecords[0].id, portId: portByCode('CNTXG').id, type: 'discharge_commenced', actual: new Date('2026-01-10T06:00:00Z') },
    { voyageId: voyageRecords[0].id, portId: portByCode('CNTXG').id, type: 'discharge_completed', actual: new Date('2026-01-12T20:00:00Z') },
    // V-2026-002 (in_progress)
    { voyageId: voyageRecords[1].id, portId: portByCode('INMND').id, type: 'nor_tendered', actual: new Date('2026-01-07T14:00:00Z') },
    { voyageId: voyageRecords[1].id, portId: portByCode('INMND').id, type: 'berthed', actual: new Date('2026-01-08T02:00:00Z') },
    { voyageId: voyageRecords[1].id, portId: portByCode('INMND').id, type: 'loading_commenced', actual: new Date('2026-01-08T06:00:00Z') },
    { voyageId: voyageRecords[1].id, portId: portByCode('INMND').id, type: 'loading_completed', actual: new Date('2026-01-09T08:00:00Z') },
    { voyageId: voyageRecords[1].id, portId: portByCode('INMND').id, type: 'departure', actual: new Date('2026-01-09T10:00:00Z') },
    // V-2026-004 (completed - lumpsum)
    { voyageId: voyageRecords[3].id, portId: portByCode('INMUN').id, type: 'departure', actual: new Date('2025-11-19T08:30:00Z') },
    { voyageId: voyageRecords[3].id, portId: portByCode('SAJED').id, type: 'arrival', actual: new Date('2025-11-27T10:00:00Z') },
    { voyageId: voyageRecords[3].id, portId: portByCode('SAJED').id, type: 'nor_tendered', actual: new Date('2025-11-27T11:00:00Z') },
    { voyageId: voyageRecords[3].id, portId: portByCode('SAJED').id, type: 'discharge_commenced', actual: new Date('2025-11-28T02:00:00Z') },
    { voyageId: voyageRecords[3].id, portId: portByCode('SAJED').id, type: 'discharge_completed', actual: new Date('2025-11-30T14:00:00Z') },
    // V-2026-005 (in_progress)
    { voyageId: voyageRecords[4].id, portId: portByCode('CNSHA').id, type: 'nor_tendered', actual: new Date('2026-01-11T10:00:00Z') },
    { voyageId: voyageRecords[4].id, portId: portByCode('CNSHA').id, type: 'berthed', actual: new Date('2026-01-12T02:00:00Z') },
    { voyageId: voyageRecords[4].id, portId: portByCode('CNSHA').id, type: 'loading_commenced', actual: new Date('2026-01-12T06:00:00Z') },
    { voyageId: voyageRecords[4].id, portId: portByCode('CNSHA').id, type: 'loading_completed', actual: new Date('2026-01-13T04:00:00Z') },
    { voyageId: voyageRecords[4].id, portId: portByCode('CNSHA').id, type: 'departure', actual: new Date('2026-01-13T06:00:00Z') },
  ];

  const existingMilestones = await prisma.voyageMilestone.count();
  if (existingMilestones === 0) {
    await prisma.voyageMilestone.createMany({ data: milestoneData });
    console.log(`  Milestones: ${milestoneData.length} seeded`);
  } else {
    console.log(`  Milestones: already seeded (${existingMilestones})`);
  }

  // === Disbursement Accounts with Line Items ===
  const existingDAs = await prisma.disbursementAccount.count();
  if (existingDAs === 0) {
    // DA for V-2026-001 at Paradip (loading)
    const da1 = await prisma.disbursementAccount.create({
      data: {
        voyageId: voyageRecords[0].id, portId: portByCode('INPAR').id,
        type: 'fda', status: 'settled', currency: 'USD', totalAmount: 48500, notes: 'Final DA Paradip',
      },
    });
    await prisma.daLineItem.createMany({ data: [
      { disbursementAccountId: da1.id, category: 'port_dues', description: 'Port dues (GRT based)', amount: 12000, currency: 'USD' },
      { disbursementAccountId: da1.id, category: 'pilotage', description: 'Pilotage inward + outward', amount: 5200, currency: 'USD' },
      { disbursementAccountId: da1.id, category: 'towage', description: 'Towage 2 tugs x 2 ops', amount: 6800, currency: 'USD' },
      { disbursementAccountId: da1.id, category: 'berth_hire', description: 'Berth hire 2 days', amount: 4500, currency: 'USD' },
      { disbursementAccountId: da1.id, category: 'agency_fee', description: 'Agency fee - J M Baxi', amount: 3500, currency: 'USD' },
      { disbursementAccountId: da1.id, category: 'cargo_handling', description: 'Stevedoring supervision', amount: 8000, currency: 'USD' },
      { disbursementAccountId: da1.id, category: 'documentation', description: 'B/L, manifest, customs clearance', amount: 2500, currency: 'USD' },
      { disbursementAccountId: da1.id, category: 'sundries', description: 'Launch hire, fresh water, provisions', amount: 6000, currency: 'USD' },
    ]});

    // DA for V-2026-001 at Qingdao (discharge)
    const da2 = await prisma.disbursementAccount.create({
      data: {
        voyageId: voyageRecords[0].id, portId: portByCode('CNTXG').id,
        type: 'fda', status: 'settled', currency: 'USD', totalAmount: 62000, notes: 'Final DA Qingdao',
      },
    });
    await prisma.daLineItem.createMany({ data: [
      { disbursementAccountId: da2.id, category: 'port_dues', description: 'Port dues (GRT/NRT)', amount: 18000, currency: 'USD' },
      { disbursementAccountId: da2.id, category: 'pilotage', description: 'Pilotage in + out', amount: 7500, currency: 'USD' },
      { disbursementAccountId: da2.id, category: 'towage', description: 'Towage 3 tugs x 2 ops', amount: 9200, currency: 'USD' },
      { disbursementAccountId: da2.id, category: 'berth_hire', description: 'Berth hire 3 days', amount: 8500, currency: 'USD' },
      { disbursementAccountId: da2.id, category: 'agency_fee', description: 'Agency fee - Wilhelmsen', amount: 4800, currency: 'USD' },
      { disbursementAccountId: da2.id, category: 'cargo_handling', description: 'Grab discharge supervision', amount: 7000, currency: 'USD' },
      { disbursementAccountId: da2.id, category: 'sundries', description: 'Garbage removal, security', amount: 7000, currency: 'USD' },
    ]});

    // DA for V-2026-002 at Mundra
    const da3 = await prisma.disbursementAccount.create({
      data: {
        voyageId: voyageRecords[1].id, portId: portByCode('INMND').id,
        type: 'pda', status: 'submitted', currency: 'USD', totalAmount: 42000, notes: 'PDA Mundra',
      },
    });
    await prisma.daLineItem.createMany({ data: [
      { disbursementAccountId: da3.id, category: 'port_dues', description: 'Port dues', amount: 10500, currency: 'USD' },
      { disbursementAccountId: da3.id, category: 'pilotage', description: 'Pilotage', amount: 4800, currency: 'USD' },
      { disbursementAccountId: da3.id, category: 'towage', description: 'Towage', amount: 6200, currency: 'USD' },
      { disbursementAccountId: da3.id, category: 'berth_hire', description: 'Berth hire', amount: 4000, currency: 'USD' },
      { disbursementAccountId: da3.id, category: 'agency_fee', description: 'Agency - GAC India', amount: 3200, currency: 'USD' },
      { disbursementAccountId: da3.id, category: 'cargo_handling', description: 'Cargo handling', amount: 7500, currency: 'USD' },
      { disbursementAccountId: da3.id, category: 'sundries', description: 'Sundries', amount: 5800, currency: 'USD' },
    ]});

    // DA for V-2026-004 at Jeddah
    const da4 = await prisma.disbursementAccount.create({
      data: {
        voyageId: voyageRecords[3].id, portId: portByCode('SAJED').id,
        type: 'fda', status: 'settled', currency: 'USD', totalAmount: 55000, notes: 'Final DA Jeddah',
      },
    });
    await prisma.daLineItem.createMany({ data: [
      { disbursementAccountId: da4.id, category: 'port_dues', description: 'Port dues', amount: 15000, currency: 'USD' },
      { disbursementAccountId: da4.id, category: 'pilotage', description: 'Pilotage', amount: 8200, currency: 'USD' },
      { disbursementAccountId: da4.id, category: 'towage', description: 'Towage', amount: 7800, currency: 'USD' },
      { disbursementAccountId: da4.id, category: 'berth_hire', description: 'Berth hire 3 days', amount: 9000, currency: 'USD' },
      { disbursementAccountId: da4.id, category: 'agency_fee', description: 'Agency - Inchcape', amount: 5500, currency: 'USD' },
      { disbursementAccountId: da4.id, category: 'sundries', description: 'Sundries + launch', amount: 9500, currency: 'USD' },
    ]});

    // DA for V-2026-004 at Mumbai (load port)
    const da5 = await prisma.disbursementAccount.create({
      data: {
        voyageId: voyageRecords[3].id, portId: portByCode('INMUN').id,
        type: 'fda', status: 'settled', currency: 'USD', totalAmount: 38000, notes: 'Final DA Mumbai',
      },
    });
    await prisma.daLineItem.createMany({ data: [
      { disbursementAccountId: da5.id, category: 'port_dues', description: 'Port dues JNPT', amount: 10000, currency: 'USD' },
      { disbursementAccountId: da5.id, category: 'pilotage', description: 'Pilotage in/out', amount: 5500, currency: 'USD' },
      { disbursementAccountId: da5.id, category: 'towage', description: 'Towage', amount: 5800, currency: 'USD' },
      { disbursementAccountId: da5.id, category: 'berth_hire', description: 'Berth hire', amount: 4200, currency: 'USD' },
      { disbursementAccountId: da5.id, category: 'agency_fee', description: 'Agency - J M Baxi', amount: 3500, currency: 'USD' },
      { disbursementAccountId: da5.id, category: 'cargo_handling', description: 'Loading supervision', amount: 5000, currency: 'USD' },
      { disbursementAccountId: da5.id, category: 'sundries', description: 'Sundries', amount: 4000, currency: 'USD' },
    ]});

    console.log('  DAs: 5 with line items seeded');
  } else {
    console.log(`  DAs: already seeded (${existingDAs})`);
  }

  // === Laytime Calculations ===
  const existingLaytime = await prisma.laytimeCalculation.count();
  if (existingLaytime === 0) {
    // V-2026-001 loading at Paradip — on demurrage
    const lt1 = await prisma.laytimeCalculation.create({
      data: {
        voyageId: voyageRecords[0].id, type: 'loading', allowedHours: 48, usedHours: 54,
        demurrageRate: 28000, despatchRate: 14000, currency: 'USD',
        result: 'on_demurrage', amountDue: 7000,
        norTendered: new Date('2025-12-22T06:00:00Z'), norAccepted: new Date('2025-12-22T08:00:00Z'),
        commencedAt: new Date('2025-12-23T02:00:00Z'), completedAt: new Date('2025-12-23T12:00:00Z'),
        notes: '6 hours excess laytime due to conveyor breakdown',
      },
    });
    await prisma.statementOfFactEntry.createMany({ data: [
      { laytimeCalculationId: lt1.id, eventType: 'nor_tendered', eventTime: new Date('2025-12-22T06:00:00Z'), timeUsed: 0 },
      { laytimeCalculationId: lt1.id, eventType: 'nor_accepted', eventTime: new Date('2025-12-22T08:00:00Z'), timeUsed: 0 },
      { laytimeCalculationId: lt1.id, eventType: 'commenced_loading', eventTime: new Date('2025-12-23T02:00:00Z'), timeUsed: 0 },
      { laytimeCalculationId: lt1.id, eventType: 'equipment_breakdown', eventTime: new Date('2025-12-23T05:00:00Z'), timeUsed: 3, excluded: false, remarks: 'Conveyor belt fault' },
      { laytimeCalculationId: lt1.id, eventType: 'completed_loading', eventTime: new Date('2025-12-23T12:00:00Z'), timeUsed: 10 },
    ]});

    // V-2026-001 discharge at Qingdao — on despatch
    const lt2 = await prisma.laytimeCalculation.create({
      data: {
        voyageId: voyageRecords[0].id, type: 'discharging', allowedHours: 72, usedHours: 62,
        demurrageRate: 28000, despatchRate: 14000, currency: 'USD',
        result: 'on_despatch', amountDue: -5833.33,
        norTendered: new Date('2026-01-09T12:00:00Z'), norAccepted: new Date('2026-01-09T14:00:00Z'),
        commencedAt: new Date('2026-01-10T06:00:00Z'), completedAt: new Date('2026-01-12T20:00:00Z'),
        notes: '10 hours saved, efficient discharge with 2 cranes',
      },
    });
    await prisma.statementOfFactEntry.createMany({ data: [
      { laytimeCalculationId: lt2.id, eventType: 'nor_tendered', eventTime: new Date('2026-01-09T12:00:00Z'), timeUsed: 0 },
      { laytimeCalculationId: lt2.id, eventType: 'commenced_discharge', eventTime: new Date('2026-01-10T06:00:00Z'), timeUsed: 0 },
      { laytimeCalculationId: lt2.id, eventType: 'rain_start', eventTime: new Date('2026-01-11T08:00:00Z'), timeUsed: 0, excluded: true, excludeReason: 'rain' },
      { laytimeCalculationId: lt2.id, eventType: 'rain_stop', eventTime: new Date('2026-01-11T11:00:00Z'), timeUsed: 0, excluded: true, excludeReason: 'rain' },
      { laytimeCalculationId: lt2.id, eventType: 'completed_discharge', eventTime: new Date('2026-01-12T20:00:00Z'), timeUsed: 62 },
    ]});

    // V-2026-004 discharge at Jeddah — within laytime
    await prisma.laytimeCalculation.create({
      data: {
        voyageId: voyageRecords[3].id, type: 'discharging', allowedHours: 60, usedHours: 58,
        demurrageRate: 22000, despatchRate: 11000, currency: 'USD',
        result: 'within_laytime', amountDue: 0,
        norTendered: new Date('2025-11-27T11:00:00Z'), norAccepted: new Date('2025-11-27T13:00:00Z'),
        commencedAt: new Date('2025-11-28T02:00:00Z'), completedAt: new Date('2025-11-30T14:00:00Z'),
        notes: 'Completed within allowed laytime',
      },
    });

    console.log('  Laytime: 3 calculations with SOF entries seeded');
  } else {
    console.log(`  Laytime: already seeded (${existingLaytime})`);
  }

  // === Bills of Lading ===
  const existingBOLs = await prisma.billOfLading.count();
  if (existingBOLs === 0) {
    await prisma.billOfLading.createMany({ data: [
      {
        bolNumber: 'MBL-PAR-001-26', type: 'master', voyageId: voyageRecords[0].id,
        portOfLoading: 'INPAR', portOfDischarge: 'CNTXG',
        status: 'accomplished', freightTerms: 'prepaid', numberOfOriginals: 3,
        description: 'Iron Ore Fines, Fe 62%, 75,000 MT in bulk',
        grossWeight: 75000, issuedAt: new Date('2025-12-23T10:00:00Z'), issuedBy: 'Captain Admin',
      },
      {
        bolNumber: 'MBL-MND-002-26', type: 'master', voyageId: voyageRecords[1].id,
        portOfLoading: 'INMND', portOfDischarge: 'SGSIN',
        status: 'shipped', freightTerms: 'prepaid', numberOfOriginals: 3,
        description: 'Thermal Coal, NAR 4200 kcal, 55,000 MT in bulk',
        grossWeight: 55000, issuedAt: new Date('2026-01-09T08:00:00Z'), issuedBy: 'Captain Admin',
      },
      {
        bolNumber: 'EBL-MUN-004-26', type: 'electronic', voyageId: voyageRecords[3].id,
        portOfLoading: 'INMUN', portOfDischarge: 'SAJED',
        status: 'accomplished', freightTerms: 'collect', numberOfOriginals: 1,
        description: 'Clean petroleum products, 95,000 MT',
        grossWeight: 95000, issuedAt: new Date('2025-11-19T06:00:00Z'), issuedBy: 'Captain Admin',
      },
      {
        bolNumber: 'MBL-SHA-005-26', type: 'master', voyageId: voyageRecords[4].id,
        portOfLoading: 'CNSHA', portOfDischarge: 'NLRTM',
        status: 'issued', freightTerms: 'prepaid', numberOfOriginals: 3,
        description: 'Hot-rolled steel coils, 18,000 MT',
        grossWeight: 18000, issuedAt: new Date('2026-01-13T04:00:00Z'), issuedBy: 'Captain Admin',
      },
      {
        bolNumber: 'HBL-SHA-005A-26', type: 'house', voyageId: voyageRecords[4].id,
        portOfLoading: 'CNSHA', portOfDischarge: 'NLRTM',
        status: 'issued', freightTerms: 'prepaid', numberOfOriginals: 3,
        description: 'Steel coils lot A, 10,000 MT',
        grossWeight: 10000, issuedAt: new Date('2026-01-13T04:30:00Z'), issuedBy: 'Captain Admin',
      },
      {
        bolNumber: 'HBL-SHA-005B-26', type: 'house', voyageId: voyageRecords[4].id,
        portOfLoading: 'CNSHA', portOfDischarge: 'NLRTM',
        status: 'issued', freightTerms: 'prepaid', numberOfOriginals: 3,
        description: 'Steel coils lot B, 8,000 MT',
        grossWeight: 8000, issuedAt: new Date('2026-01-13T04:30:00Z'), issuedBy: 'Captain Admin',
      },
    ]});
    console.log('  BOLs: 6 seeded (3 MBL, 2 HBL, 1 eBL)');
  } else {
    console.log(`  BOLs: already seeded (${existingBOLs})`);
  }

  // === Vendor Ratings ===
  const existingRatings = await prisma.vendorRating.count();
  if (existingRatings === 0) {
    const ratingData = [
      { companyId: companyByName('J M Baxi').id, userId: admin.id, rating: 5, category: 'reliability', comment: 'Excellent port agency service at Paradip' },
      { companyId: companyByName('J M Baxi').id, userId: admin.id, rating: 4, category: 'communication', comment: 'Good updates, slight delay on final DA' },
      { companyId: companyByName('J M Baxi').id, userId: operator.id, rating: 4, category: 'cost', comment: 'Competitive rates for Indian ports' },
      { companyId: companyByName('GAC').id, userId: admin.id, rating: 4, category: 'reliability', comment: 'Reliable service at Mundra' },
      { companyId: companyByName('GAC').id, userId: admin.id, rating: 5, category: 'speed', comment: 'Fast clearance turnaround' },
      { companyId: companyByName('Wilhelmsen').id, userId: admin.id, rating: 5, category: 'reliability', comment: 'Global network, consistent quality' },
      { companyId: companyByName('Wilhelmsen').id, userId: admin.id, rating: 3, category: 'cost', comment: 'Premium pricing' },
      { companyId: companyByName('Inchcape').id, userId: admin.id, rating: 4, category: 'reliability', comment: 'Good Middle East coverage' },
      { companyId: companyByName('Inchcape').id, userId: operator.id, rating: 4, category: 'communication', comment: 'Proactive updates on vessel ETA' },
      { companyId: companyByName('Aegean').id, userId: admin.id, rating: 4, category: 'reliability', comment: 'Timely bunker delivery' },
      { companyId: companyByName('Aegean').id, userId: admin.id, rating: 3, category: 'cost', comment: 'Market rates, no discount for volume' },
      { companyId: companyByName('Clarksons').id, userId: admin.id, rating: 5, category: 'communication', comment: 'Top-tier market intelligence' },
      { companyId: companyByName('Clarksons').id, userId: admin.id, rating: 5, category: 'reliability', comment: 'Fixtures done professionally' },
      { companyId: companyByName('SSY').id, userId: admin.id, rating: 4, category: 'reliability', comment: 'Strong dry bulk presence' },
      { companyId: companyByName('SSY').id, userId: operator.id, rating: 5, category: 'speed', comment: 'Quick fixture confirmations' },
    ];
    await prisma.vendorRating.createMany({ data: ratingData });
    console.log(`  Vendor Ratings: ${ratingData.length} seeded`);
  } else {
    console.log(`  Vendor Ratings: already seeded (${existingRatings})`);
  }

  // === Activity Logs ===
  const existingLogs = await prisma.activityLog.count();
  if (existingLogs === 0) {
    const now = new Date();
    const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);
    const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000);

    await prisma.activityLog.createMany({ data: [
      { userId: admin.id, userName: 'Captain Admin', action: 'created', entityType: 'charter', entityId: charterRecords[0].id, details: JSON.stringify({ reference: 'FIX-2026-001', type: 'voyage' }), createdAt: daysAgo(40) },
      { userId: admin.id, userName: 'Captain Admin', action: 'transitioned', entityType: 'charter', entityId: charterRecords[0].id, details: JSON.stringify({ from: 'draft', to: 'on_subs' }), createdAt: daysAgo(38) },
      { userId: admin.id, userName: 'Captain Admin', action: 'transitioned', entityType: 'charter', entityId: charterRecords[0].id, details: JSON.stringify({ from: 'on_subs', to: 'fixed' }), createdAt: daysAgo(37) },
      { userId: admin.id, userName: 'Captain Admin', action: 'transitioned', entityType: 'charter', entityId: charterRecords[0].id, details: JSON.stringify({ from: 'fixed', to: 'executed' }), createdAt: daysAgo(35) },
      { userId: admin.id, userName: 'Captain Admin', action: 'created', entityType: 'voyage', entityId: voyageRecords[0].id, details: JSON.stringify({ voyageNumber: 'V-2026-001', vessel: 'MV ANKR Pioneer' }), createdAt: daysAgo(35) },
      { userId: operator.id, userName: 'Voyage Operator', action: 'transitioned', entityType: 'voyage', entityId: voyageRecords[0].id, details: JSON.stringify({ from: 'planned', to: 'in_progress' }), createdAt: daysAgo(34) },
      { userId: operator.id, userName: 'Voyage Operator', action: 'created', entityType: 'bol', entityId: 'MBL-PAR-001-26', details: JSON.stringify({ type: 'master', port: 'Paradip' }), createdAt: daysAgo(33) },
      { userId: operator.id, userName: 'Voyage Operator', action: 'submitted', entityType: 'da', entityId: 'DA-PAR-001', details: JSON.stringify({ port: 'Paradip', amount: 48500 }), createdAt: daysAgo(30) },
      { userId: admin.id, userName: 'Captain Admin', action: 'approved', entityType: 'da', entityId: 'DA-PAR-001', details: JSON.stringify({ port: 'Paradip', status: 'settled' }), createdAt: daysAgo(28) },
      { userId: operator.id, userName: 'Voyage Operator', action: 'transitioned', entityType: 'voyage', entityId: voyageRecords[0].id, details: JSON.stringify({ from: 'in_progress', to: 'completed' }), createdAt: daysAgo(20) },
      { userId: admin.id, userName: 'Captain Admin', action: 'created', entityType: 'charter', entityId: charterRecords[1].id, details: JSON.stringify({ reference: 'FIX-2026-002', type: 'voyage' }), createdAt: daysAgo(25) },
      { userId: admin.id, userName: 'Captain Admin', action: 'transitioned', entityType: 'charter', entityId: charterRecords[1].id, details: JSON.stringify({ from: 'draft', to: 'executed' }), createdAt: daysAgo(22) },
      { userId: admin.id, userName: 'Captain Admin', action: 'created', entityType: 'voyage', entityId: voyageRecords[1].id, details: JSON.stringify({ voyageNumber: 'V-2026-002', vessel: 'MV Gujarat Pride' }), createdAt: daysAgo(20) },
      { userId: operator.id, userName: 'Voyage Operator', action: 'transitioned', entityType: 'voyage', entityId: voyageRecords[1].id, details: JSON.stringify({ from: 'planned', to: 'in_progress' }), createdAt: daysAgo(18) },
      { userId: operator.id, userName: 'Voyage Operator', action: 'created', entityType: 'bol', entityId: 'MBL-MND-002-26', details: JSON.stringify({ type: 'master', port: 'Mundra' }), createdAt: daysAgo(17) },
      { userId: admin.id, userName: 'Captain Admin', action: 'created', entityType: 'charter', entityId: charterRecords[4].id, details: JSON.stringify({ reference: 'FIX-2026-005', type: 'voyage' }), createdAt: daysAgo(10) },
      { userId: operator.id, userName: 'Voyage Operator', action: 'created', entityType: 'voyage', entityId: voyageRecords[4].id, details: JSON.stringify({ voyageNumber: 'V-2026-005', vessel: 'MV Star Navigator' }), createdAt: daysAgo(8) },
      { userId: operator.id, userName: 'Voyage Operator', action: 'created', entityType: 'bol', entityId: 'MBL-SHA-005-26', details: JSON.stringify({ type: 'master', port: 'Shanghai' }), createdAt: daysAgo(5) },
      { userId: operator.id, userName: 'Voyage Operator', action: 'created', entityType: 'bol', entityId: 'HBL-SHA-005A-26', details: JSON.stringify({ type: 'house', port: 'Shanghai' }), createdAt: daysAgo(5) },
      { userId: admin.id, userName: 'Captain Admin', action: 'created', entityType: 'charter', entityId: charterRecords[2].id, details: JSON.stringify({ reference: 'FIX-2026-003', type: 'voyage', note: 'Wheat Melbourne to Mumbai' }), createdAt: daysAgo(3) },
      { userId: admin.id, userName: 'Captain Admin', action: 'updated', entityType: 'vessel', entityId: vesselByName('Pioneer').id, details: JSON.stringify({ field: 'status', value: 'active', note: 'Post-voyage survey passed' }), createdAt: daysAgo(2) },
      { userId: operator.id, userName: 'Voyage Operator', action: 'submitted', entityType: 'da', entityId: 'DA-MND-002', details: JSON.stringify({ port: 'Mundra', amount: 42000, type: 'pda' }), createdAt: hoursAgo(12) },
      { userId: admin.id, userName: 'Captain Admin', action: 'updated', entityType: 'laytime', entityId: 'LT-001', details: JSON.stringify({ result: 'on_demurrage', amount: 7000, voyage: 'V-2026-001' }), createdAt: hoursAgo(6) },
    ]});
    console.log('  Activity Logs: 23 seeded');
  } else {
    console.log(`  Activity Logs: already seeded (${existingLogs})`);
  }

  // === Notifications ===
  const existingNotifs = await prisma.notification.count();
  if (existingNotifs === 0) {
    const hoursAgo = (h: number) => new Date(Date.now() - h * 3600000);
    await prisma.notification.createMany({ data: [
      { userId: admin.id, type: 'charter_status', title: 'Charter FIX-2026-003 Fixed', message: 'Wheat cargo Melbourne to Mumbai on MV Cape Fortune has been fixed with Cargill', entityType: 'charter', entityId: charterRecords[2].id, createdAt: hoursAgo(72) },
      { userId: admin.id, type: 'voyage_departure', title: 'V-2026-005 Departed Shanghai', message: 'MV Star Navigator departed Shanghai at 06:00 UTC bound for Rotterdam', entityType: 'voyage', entityId: voyageRecords[4].id, createdAt: hoursAgo(48) },
      { userId: admin.id, type: 'da_submitted', title: 'PDA Submitted — Mundra', message: 'Proforma DA for V-2026-002 at Mundra submitted: USD 42,000', entityType: 'da', entityId: 'DA-MND-002', createdAt: hoursAgo(12) },
      { userId: admin.id, type: 'laytime_alert', title: 'Demurrage Alert V-2026-001', message: 'Loading at Paradip exceeded allowed laytime by 6 hours. Demurrage: USD 7,000', entityType: 'laytime', entityId: 'LT-001', createdAt: hoursAgo(6) },
      { userId: admin.id, type: 'voyage_arrival', title: 'V-2026-002 ETA Singapore', message: 'MV Gujarat Pride ETA Singapore: Jan 20, 2026 18:00 UTC', entityType: 'voyage', entityId: voyageRecords[1].id, createdAt: hoursAgo(3) },
      { userId: admin.id, type: 'system', title: 'Phase 3 Features Live', message: 'Financial Reports, Bill of Lading management, and Activity Feed are now available', createdAt: hoursAgo(1) },
      { type: 'system', title: 'Mari8x Platform Update', message: 'Dashboard charts and voyage estimates coming in Phase 4', createdAt: hoursAgo(0.5) },
    ]});
    console.log('  Notifications: 7 seeded');
  } else {
    console.log(`  Notifications: already seeded (${existingNotifs})`);
  }

  // === Claims ===
  const existingClaims = await prisma.claim.count();
  if (existingClaims === 0) {
    const daysAgo = (d: number) => new Date(Date.now() - d * 86400000);
    await prisma.claim.createMany({ data: [
      {
        claimNumber: 'CLM-2026-001', voyageId: voyageRecords[0].id, type: 'cargo_shortage',
        status: 'settled', amount: 18500, settledAmount: 15200, currency: 'USD',
        description: 'Shortage of 42 MT Iron Ore Fines at discharge port Qingdao. Bill of lading states 95,000 MT, outturn weight 94,958 MT.',
        priority: 'medium', filedDate: daysAgo(25), settledDate: daysAgo(5),
      },
      {
        claimNumber: 'CLM-2026-002', voyageId: voyageRecords[0].id, type: 'demurrage',
        status: 'negotiation', amount: 7000, currency: 'USD',
        description: 'Demurrage claim for loading port Paradip. Exceeded allowed laytime by 6 hours at $28,000/day.',
        priority: 'high', filedDate: daysAgo(20),
      },
      {
        claimNumber: 'CLM-2026-003', voyageId: voyageRecords[1].id, type: 'cargo_damage',
        status: 'under_investigation', amount: 45000, currency: 'USD',
        description: 'Wet damage to 120 MT bagged rice due to hatch cover leakage during monsoon crossing. Survey report pending.',
        priority: 'critical', filedDate: daysAgo(10),
      },
      {
        claimNumber: 'CLM-2026-004', voyageId: voyageRecords[2].id, type: 'dead_freight',
        status: 'open', amount: 32000, currency: 'USD',
        description: 'Charterer provided 72,000 MT coal instead of 75,000 MT as per CP. Dead freight for 3,000 MT @ $10.67/MT.',
        priority: 'medium', filedDate: daysAgo(5), dueDate: daysAgo(-25),
      },
      {
        claimNumber: 'CLM-2026-005', voyageId: voyageRecords[4].id, type: 'deviation',
        status: 'open', amount: 85000, currency: 'USD',
        description: 'Vessel deviated to Colombo for emergency bunker stem, adding 2 days to voyage. Owner claims force majeure.',
        priority: 'high', filedDate: daysAgo(2), dueDate: daysAgo(-28),
      },
    ]});

    // Add claim documents
    const claimRecords = await prisma.claim.findMany({ orderBy: { claimNumber: 'asc' } });
    await prisma.claimDocument.createMany({ data: [
      { claimId: claimRecords[0].id, name: 'Outturn Weight Certificate', type: 'survey_report' },
      { claimId: claimRecords[0].id, name: 'Settlement Agreement', type: 'settlement_agreement' },
      { claimId: claimRecords[1].id, name: 'Laytime Sheet', type: 'notice_of_claim' },
      { claimId: claimRecords[2].id, name: 'Survey Report — Hatch 3', type: 'survey_report' },
      { claimId: claimRecords[2].id, name: 'Damage Photos', type: 'photo' },
      { claimId: claimRecords[3].id, name: 'Notice of Claim', type: 'notice_of_claim' },
      { claimId: claimRecords[4].id, name: 'Master\'s Deviation Report', type: 'correspondence' },
    ]});
    console.log('  Claims: 5 seeded with 7 documents');
  } else {
    console.log(`  Claims: already seeded (${existingClaims})`);
  }

  // === Bunker Stems ===
  const existingStems = await prisma.bunkerStem.count();
  if (existingStems === 0) {
    const allVoyages = await prisma.voyage.findMany({ select: { id: true, voyageNumber: true } });
    if (allVoyages.length >= 3) {
      const daysAgoB = (d: number) => new Date(Date.now() - d * 86400000);
      await prisma.bunkerStem.createMany({ data: [
        { voyageId: allVoyages[0].id, fuelType: 'vlsfo', quantity: 850, pricePerMt: 620, supplier: 'Peninsula Petroleum', status: 'delivered', delivered: 845, stemDate: daysAgoB(25), deliveryDate: daysAgoB(22) },
        { voyageId: allVoyages[0].id, fuelType: 'mgo', quantity: 120, pricePerMt: 980, supplier: 'Aegean Marine', status: 'invoiced', delivered: 120, stemDate: daysAgoB(25), deliveryDate: daysAgoB(22) },
        { voyageId: allVoyages[1].id, fuelType: 'vlsfo', quantity: 950, pricePerMt: 615, supplier: 'Vitol Bunkers', status: 'delivered', delivered: 948, stemDate: daysAgoB(18), deliveryDate: daysAgoB(15) },
        { voyageId: allVoyages[1].id, fuelType: 'ifo380', quantity: 500, pricePerMt: 480, supplier: 'TFG Marine', status: 'confirmed', stemDate: daysAgoB(12) },
        { voyageId: allVoyages[2].id, fuelType: 'vlsfo', quantity: 780, pricePerMt: 635, supplier: 'Peninsula Petroleum', status: 'ordered', stemDate: daysAgoB(5) },
        { voyageId: allVoyages[2].id, fuelType: 'lsmgo', quantity: 100, pricePerMt: 1020, supplier: 'Monjasa', status: 'ordered', stemDate: daysAgoB(5) },
      ]});
      console.log('  Bunker stems: 6 seeded');
    }
  } else {
    console.log(`  Bunker stems: already seeded (${existingStems})`);
  }

  // === Crew Members ===
  const existingCrew = await prisma.crewMember.count();
  if (existingCrew === 0) {
    const allVessels = await prisma.vessel.findMany({ select: { id: true } });
    const crewData = [
      { firstName: 'Rajesh', lastName: 'Sharma', rank: 'master', nationality: 'IN', status: 'on_board', phone: '+919876543210', organizationId: org.id },
      { firstName: 'Anil', lastName: 'Kumar', rank: 'chief_officer', nationality: 'IN', status: 'on_board', organizationId: org.id },
      { firstName: 'Suresh', lastName: 'Patel', rank: 'chief_engineer', nationality: 'IN', status: 'on_board', organizationId: org.id },
      { firstName: 'Marco', lastName: 'Santos', rank: 'second_officer', nationality: 'PH', status: 'on_board', organizationId: org.id },
      { firstName: 'James', lastName: 'Wilson', rank: 'bosun', nationality: 'GB', status: 'available', organizationId: org.id },
      { firstName: 'Chen', lastName: 'Wei', rank: 'ab_seaman', nationality: 'CN', status: 'available', organizationId: org.id },
      { firstName: 'Nikolai', lastName: 'Petrov', rank: 'second_engineer', nationality: 'RU', status: 'on_leave', organizationId: org.id },
      { firstName: 'Ahmed', lastName: 'Hassan', rank: 'oiler', nationality: 'EG', status: 'available', organizationId: org.id },
      { firstName: 'Miguel', lastName: 'Cruz', rank: 'cook', nationality: 'PH', status: 'on_board', organizationId: org.id },
      { firstName: 'Deepak', lastName: 'Singh', rank: 'third_officer', nationality: 'IN', status: 'available', organizationId: org.id },
    ];
    const crewRecords = [];
    for (const c of crewData) {
      crewRecords.push(await prisma.crewMember.create({ data: c }));
    }
    // Assign on_board crew to first vessel
    if (allVessels.length > 0) {
      const daysAgoC = (d: number) => new Date(Date.now() - d * 86400000);
      const onBoardCrew = crewRecords.filter((_, i) => [0,1,2,3,8].includes(i));
      for (const c of onBoardCrew) {
        await prisma.crewAssignment.create({ data: {
          crewMemberId: c.id, vesselId: allVessels[0].id, rank: c.rank, signOnDate: daysAgoC(45), status: 'active',
        }});
      }
    }
    // Add certificates
    const daysAgoC2 = (d: number) => new Date(Date.now() - d * 86400000);
    const daysFromNow = (d: number) => new Date(Date.now() + d * 86400000);
    const certData = [
      { crewMemberId: crewRecords[0].id, name: 'STCW', issuingAuth: 'DG Shipping India', certNumber: 'STCW-2024-001', issueDate: daysAgoC2(365), expiryDate: daysFromNow(365), status: 'valid' },
      { crewMemberId: crewRecords[0].id, name: 'GMDSS', issuingAuth: 'DG Shipping India', certNumber: 'GM-2023-102', issueDate: daysAgoC2(500), expiryDate: daysFromNow(15), status: 'valid' },
      { crewMemberId: crewRecords[1].id, name: 'STCW', issuingAuth: 'DG Shipping India', certNumber: 'STCW-2024-002', issueDate: daysAgoC2(200), expiryDate: daysFromNow(530), status: 'valid' },
      { crewMemberId: crewRecords[2].id, name: 'CoC Engine', issuingAuth: 'DG Shipping India', certNumber: 'COC-E-2024-001', issueDate: daysAgoC2(180), expiryDate: daysFromNow(545), status: 'valid' },
      { crewMemberId: crewRecords[3].id, name: 'STCW', issuingAuth: 'MARINA Philippines', certNumber: 'STCW-PH-2024-003', issueDate: daysAgoC2(150), expiryDate: daysFromNow(580), status: 'valid' },
      { crewMemberId: crewRecords[4].id, name: 'Medical Certificate', issuingAuth: 'MCA UK', certNumber: 'MED-UK-2024-010', issueDate: daysAgoC2(100), expiryDate: daysFromNow(265), status: 'valid' },
      { crewMemberId: crewRecords[6].id, name: 'CoC Engine', issuingAuth: 'RMRS Russia', certNumber: 'COC-RU-2023-005', issueDate: daysAgoC2(700), expiryDate: daysAgoC2(10), status: 'expired' },
    ];
    await prisma.crewCertificate.createMany({ data: certData });
    console.log('  Crew: 10 members, 5 assignments, 7 certificates seeded');
  } else {
    console.log(`  Crew: already seeded (${existingCrew})`);
  }

  // === Documents ===
  const existingDocs = await prisma.document.count();
  if (existingDocs === 0) {
    await prisma.document.createMany({ data: [
      { title: 'Charter Party — V-2026-001', category: 'charter_party', fileName: 'cp-v2026-001.pdf', fileSize: 2456000, organizationId: org.id, tags: ['Q1-2026', 'ANKR Pioneer'], notes: 'Gencon form — voyage charter Mumbai-Singapore' },
      { title: 'Bill of Lading — BL-INMUN-001', category: 'bol', fileName: 'bl-inmun-001.pdf', fileSize: 890000, organizationId: org.id, tags: ['Mumbai', 'export'] },
      { title: 'Survey Report — Hatch 3 Damage', category: 'survey', fileName: 'survey-hatch3-jan2026.pdf', fileSize: 4200000, organizationId: org.id, tags: ['claim', 'cargo damage'] },
      { title: 'P&I Insurance Certificate 2026', category: 'insurance', fileName: 'pi-cert-2026.pdf', fileSize: 1100000, organizationId: org.id, tags: ['annual', 'P&I'] },
      { title: 'ISPS Certificate — MV ANKR Pioneer', category: 'certificate', fileName: 'isps-pioneer-2026.pdf', fileSize: 650000, organizationId: org.id, tags: ['ISPS', 'vessel cert'] },
      { title: 'DA Invoice — Singapore Port', category: 'invoice', fileName: 'da-singapore-jan2026.pdf', fileSize: 340000, organizationId: org.id, tags: ['DA', 'Singapore'] },
      { title: 'Voyage Report — V-2026-002', category: 'report', fileName: 'voyage-report-002.pdf', fileSize: 1800000, organizationId: org.id, tags: ['completed', 'VLSFO'] },
      { title: 'Agent Appointment Letter — Mundra', category: 'correspondence', fileName: 'agent-appointment-mundra.pdf', fileSize: 280000, organizationId: org.id, tags: ['Mundra', 'agent'] },
    ]});
    console.log('  Documents: 8 seeded');
  } else {
    console.log(`  Documents: already seeded (${existingDocs})`);
  }

  // === Compliance Items ===
  const existingCompliance = await prisma.complianceItem.count();
  if (existingCompliance === 0) {
    const allVessels2 = await prisma.vessel.findMany({ select: { id: true } });
    if (allVessels2.length >= 2) {
      const daysFromNowC = (d: number) => new Date(Date.now() + d * 86400000);
      const daysAgoCC = (d: number) => new Date(Date.now() - d * 86400000);
      await prisma.complianceItem.createMany({ data: [
        { vesselId: allVessels2[0].id, category: 'ism', title: 'ISM Document of Compliance', status: 'compliant', priority: 'critical', dueDate: daysFromNowC(180), completedDate: daysAgoCC(30), organizationId: org.id },
        { vesselId: allVessels2[0].id, category: 'isps', title: 'ISPS Security Certificate', status: 'compliant', priority: 'critical', dueDate: daysFromNowC(150), completedDate: daysAgoCC(45), organizationId: org.id },
        { vesselId: allVessels2[0].id, category: 'marpol', title: 'MARPOL Annex VI — Air Pollution', status: 'pending_review', priority: 'high', dueDate: daysFromNowC(15), organizationId: org.id },
        { vesselId: allVessels2[0].id, category: 'solas', title: 'SOLAS Safety Equipment Survey', status: 'compliant', priority: 'high', dueDate: daysFromNowC(90), completedDate: daysAgoCC(60), organizationId: org.id },
        { vesselId: allVessels2[1].id, category: 'class', title: 'Classification Society Annual Survey', status: 'non_compliant', priority: 'critical', dueDate: daysAgoCC(5), findings: 'Hull thickness measurement required', organizationId: org.id },
        { vesselId: allVessels2[1].id, category: 'port_state', title: 'Port State Control — Last Inspection', status: 'compliant', priority: 'medium', completedDate: daysAgoCC(20), inspector: 'AMSA Inspector', organizationId: org.id },
        { vesselId: allVessels2[1].id, category: 'stcw', title: 'STCW Crew Qualification Review', status: 'pending_review', priority: 'medium', dueDate: daysFromNowC(45), organizationId: org.id },
        { vesselId: allVessels2[0].id, category: 'flag_state', title: 'Flag State Annual Inspection', status: 'expired', priority: 'high', dueDate: daysAgoCC(10), organizationId: org.id },
      ]});
      console.log('  Compliance: 8 items seeded');
    }
  } else {
    console.log(`  Compliance: already seeded (${existingCompliance})`);
  }

  // === Vessel Documents ===
  const existingVesselDocs = await prisma.vesselDocument.count();
  if (existingVesselDocs === 0) {
    const allVessels3 = await prisma.vessel.findMany({ select: { id: true, name: true } });
    if (allVessels3.length >= 3) {
      const daysFromNowV = (d: number) => new Date(Date.now() + d * 86400000);
      const daysAgoV = (d: number) => new Date(Date.now() - d * 86400000);
      await prisma.vesselDocument.createMany({ data: [
        { vesselId: allVessels3[0].id, type: 'class_certificate', title: 'Classification Certificate', issuedBy: 'Indian Register of Shipping', issueDate: daysAgoV(200), expiryDate: daysFromNowV(165), documentNumber: 'IRS-2025-4321', status: 'valid', organizationId: org.id },
        { vesselId: allVessels3[0].id, type: 'safety_management', title: 'Safety Management Certificate (SMC)', issuedBy: 'DG Shipping India', issueDate: daysAgoV(180), expiryDate: daysFromNowV(185), documentNumber: 'SMC-IN-2025-001', status: 'valid', organizationId: org.id },
        { vesselId: allVessels3[0].id, type: 'isps', title: 'International Ship Security Certificate', issuedBy: 'DG Shipping India', issueDate: daysAgoV(150), expiryDate: daysFromNowV(215), documentNumber: 'ISSC-2025-0087', status: 'valid', organizationId: org.id },
        { vesselId: allVessels3[0].id, type: 'insurance', title: 'P&I Certificate of Entry', issuedBy: 'Gard P&I Club', issueDate: daysAgoV(45), expiryDate: daysFromNowV(320), documentNumber: 'GARD-2026-10234', status: 'valid', organizationId: org.id },
        { vesselId: allVessels3[0].id, type: 'marpol', title: 'IOPP Certificate (MARPOL Annex I)', issuedBy: 'Indian Register of Shipping', issueDate: daysAgoV(300), expiryDate: daysFromNowV(65), documentNumber: 'IOPP-2025-0456', status: 'valid', organizationId: org.id },
        { vesselId: allVessels3[1].id, type: 'class_certificate', title: 'Classification Certificate', issuedBy: 'Lloyd\'s Register', issueDate: daysAgoV(400), expiryDate: daysFromNowV(30), documentNumber: 'LR-2024-8765', status: 'valid', organizationId: org.id },
        { vesselId: allVessels3[1].id, type: 'loadline', title: 'International Load Line Certificate', issuedBy: 'Lloyd\'s Register', issueDate: daysAgoV(350), expiryDate: daysFromNowV(15), documentNumber: 'ILL-2024-3210', status: 'valid', organizationId: org.id },
        { vesselId: allVessels3[1].id, type: 'tonnage', title: 'International Tonnage Certificate', issuedBy: 'Lloyd\'s Register', issueDate: daysAgoV(500), expiryDate: daysFromNowV(230), documentNumber: 'ITC-2024-0098', status: 'valid', organizationId: org.id },
        { vesselId: allVessels3[2].id, type: 'class_certificate', title: 'Classification Certificate', issuedBy: 'Bureau Veritas', issueDate: daysAgoV(100), expiryDate: daysFromNowV(265), documentNumber: 'BV-2025-5678', status: 'valid', organizationId: org.id },
        { vesselId: allVessels3[2].id, type: 'smc', title: 'Safety Management Certificate', issuedBy: 'MPA Singapore', issueDate: daysAgoV(90), expiryDate: daysFromNowV(275), documentNumber: 'SMC-SG-2025-0312', status: 'valid', organizationId: org.id },
      ]});
      console.log('  Vessel Documents: 10 seeded');
    }
  } else {
    console.log(`  Vessel Documents: already seeded (${existingVesselDocs})`);
  }

  // === Terminals & Berths ===
  const existingTerminals = await prisma.terminal.count();
  if (existingTerminals === 0) {
    const sgPort = portByCode('SGSIN');
    const rtmPort = portByCode('NLRTM');
    const munPort = portByCode('INMUN');

    const t1 = await prisma.terminal.create({ data: {
      portId: sgPort.id, name: 'Jurong Island Terminal', operator: 'Jurong Port Pte Ltd',
      berthCount: 6, cargoTypes: ['bulk', 'break_bulk'], maxDraft: 16.0, maxLOA: 300, maxBeam: 50,
      workingHours: '24/7',
    }});
    const t2 = await prisma.terminal.create({ data: {
      portId: rtmPort.id, name: 'Europoort Terminal', operator: 'EMO BV',
      berthCount: 4, cargoTypes: ['dry_bulk', 'coal', 'iron_ore'], maxDraft: 23.0, maxLOA: 360, maxBeam: 65,
      workingHours: '24/7', notes: 'Largest dry bulk terminal in Europe',
    }});
    const t3 = await prisma.terminal.create({ data: {
      portId: munPort.id, name: 'JNPT Container Terminal', operator: 'JNPT',
      berthCount: 5, cargoTypes: ['container', 'general_cargo'], maxDraft: 14.5, maxLOA: 350, maxBeam: 48,
      workingHours: '0600-2200', notes: 'Main container terminal at JNPT Mumbai',
    }});

    await prisma.berth.createMany({ data: [
      { terminalId: t1.id, name: 'JIT Berth 1', length: 280, depth: 15.5, cargoTypes: ['bulk'], status: 'available' },
      { terminalId: t1.id, name: 'JIT Berth 2', length: 300, depth: 16.0, cargoTypes: ['bulk', 'break_bulk'], status: 'occupied', craneSpecs: '2x 40T gantry' },
      { terminalId: t2.id, name: 'EMO Berth A', length: 350, depth: 23.0, cargoTypes: ['iron_ore'], status: 'available', craneSpecs: '4x portal grab cranes' },
      { terminalId: t2.id, name: 'EMO Berth B', length: 320, depth: 21.0, cargoTypes: ['coal'], status: 'maintenance' },
      { terminalId: t3.id, name: 'NSICT Berth 1', length: 330, depth: 14.5, cargoTypes: ['container'], status: 'occupied', craneSpecs: '6x STS gantry cranes' },
    ]});
    console.log('  Terminals: 3 with 5 berths seeded');
  } else {
    console.log(`  Terminals: already seeded (${existingTerminals})`);
  }

  // === Port Tariffs ===
  const existingTariffs = await prisma.portTariff.count();
  if (existingTariffs === 0) {
    const sgPort = portByCode('SGSIN');
    const rtmPort = portByCode('NLRTM');
    const munPort = portByCode('INMUN');
    const now = new Date();
    await prisma.portTariff.createMany({ data: [
      { portId: sgPort.id, chargeType: 'port_dues', amount: 0.236, currency: 'SGD', unit: 'per_grt', effectiveFrom: now, notes: 'Per GRT per call' },
      { portId: sgPort.id, chargeType: 'pilotage', amount: 2800, currency: 'SGD', unit: 'per_movement', effectiveFrom: now },
      { portId: sgPort.id, chargeType: 'towage', amount: 1800, currency: 'SGD', unit: 'per_tug_per_hour', effectiveFrom: now },
      { portId: rtmPort.id, chargeType: 'port_dues', amount: 0.45, currency: 'EUR', unit: 'per_grt', effectiveFrom: now },
      { portId: rtmPort.id, chargeType: 'pilotage', amount: 4200, currency: 'EUR', unit: 'per_movement', effectiveFrom: now, vesselType: 'bulk_carrier' },
      { portId: rtmPort.id, chargeType: 'berth_hire', amount: 3500, currency: 'EUR', unit: 'per_day', effectiveFrom: now },
      { portId: munPort.id, chargeType: 'port_dues', amount: 16.5, currency: 'INR', unit: 'per_grt', effectiveFrom: now },
      { portId: munPort.id, chargeType: 'pilotage', amount: 380000, currency: 'INR', unit: 'per_movement', effectiveFrom: now },
      { portId: munPort.id, chargeType: 'berth_hire', amount: 45000, currency: 'INR', unit: 'per_day', effectiveFrom: now },
    ]});
    console.log('  Port Tariffs: 9 seeded');
  } else {
    console.log(`  Port Tariffs: already seeded (${existingTariffs})`);
  }

  // === Port Holidays ===
  const existingHolidays = await prisma.portHoliday.count();
  if (existingHolidays === 0) {
    const inPorts = allPorts.filter(p => p.country === 'IN').slice(0, 3);
    const sgPort = portByCode('SGSIN');
    const holidays = [
      ...inPorts.map(p => ({ portId: p.id, date: new Date('2026-01-26'), name: 'Republic Day', affectsLaytime: true, country: 'IN', recurring: true })),
      ...inPorts.map(p => ({ portId: p.id, date: new Date('2026-08-15'), name: 'Independence Day', affectsLaytime: true, country: 'IN', recurring: true })),
      ...inPorts.map(p => ({ portId: p.id, date: new Date('2026-03-30'), name: 'Holi', affectsLaytime: false, country: 'IN', recurring: false })),
      { portId: sgPort.id, date: new Date('2026-02-17'), name: 'Chinese New Year', affectsLaytime: true, country: 'SG', recurring: true },
      { portId: sgPort.id, date: new Date('2026-08-09'), name: 'National Day', affectsLaytime: true, country: 'SG', recurring: true },
    ];
    await prisma.portHoliday.createMany({ data: holidays });
    console.log(`  Port Holidays: ${holidays.length} seeded`);
  } else {
    console.log(`  Port Holidays: already seeded (${existingHolidays})`);
  }

  // === Canal Transits ===
  const existingCanals = await prisma.canalTransit.count();
  if (existingCanals === 0) {
    await prisma.canalTransit.createMany({ data: [
      { canal: 'Suez', baseCost: 250000, currency: 'USD', calculationRule: 'Suez Canal Net Tonnage (SCNT)', notes: 'Laden northbound Capesize estimate' },
      { canal: 'Suez', vesselType: 'tanker', sizeRangeMin: 100000, sizeRangeMax: 300000, baseCost: 320000, currency: 'USD', calculationRule: 'SCNT + tanker surcharge' },
      { canal: 'Panama', baseCost: 180000, currency: 'USD', calculationRule: 'Panama Canal Universal Measurement System (PC/UMS)', notes: 'Neo-Panamax lock transit' },
      { canal: 'Panama', vesselType: 'container', sizeRangeMin: 5000, sizeRangeMax: 14000, baseCost: 400000, currency: 'USD', calculationRule: 'Per TEU + base tolls', notes: 'Large container vessel estimate' },
      { canal: 'Kiel', baseCost: 15000, currency: 'EUR', calculationRule: 'Based on BRZ (gross tonnage)', notes: 'Kiel Canal transit for Baltic routes' },
      { canal: 'Turkish Straits', baseCost: 0, currency: 'USD', calculationRule: 'Montreux Convention — free transit', notes: 'No toll for commercial vessels, but pilotage mandatory' },
    ]});
    console.log('  Canal Transits: 6 seeded');
  } else {
    console.log(`  Canal Transits: already seeded (${existingCanals})`);
  }

  // === Contacts ===
  const existingContacts = await prisma.contact.count();
  if (existingContacts === 0) {
    const contactsData = [
      { companyId: companyByName('Cargill').id, firstName: 'Richard', lastName: 'Chen', email: 'r.chen@cargill.com', phone: '+41227399100', role: 'operations', designation: 'Chartering Manager', isPrimary: true },
      { companyId: companyByName('Cargill').id, firstName: 'Sarah', lastName: 'Thompson', email: 's.thompson@cargill.com', role: 'operations', designation: 'Voyage Operator', isPrimary: false },
      { companyId: companyByName('Trafigura').id, firstName: 'James', lastName: 'Lim', email: 'j.lim@trafigura.com', phone: '+6562383200', role: 'chartering', designation: 'Senior Charterer', isPrimary: true },
      { companyId: companyByName('Clarksons').id, firstName: 'David', lastName: 'Harris', email: 'd.harris@clarksons.com', phone: '+442073343000', role: 'broking', designation: 'Senior Dry Bulk Broker', isPrimary: true },
      { companyId: companyByName('SSY').id, firstName: 'Mark', lastName: 'Evans', email: 'm.evans@ssy.co', phone: '+442079771000', role: 'broking', designation: 'Dry Cargo Broker', isPrimary: true },
      { companyId: companyByName('J M Baxi').id, firstName: 'Vikram', lastName: 'Desai', email: 'v.desai@jmbaxi.com', phone: '+912222826644', mobile: '+919820012345', role: 'agency', designation: 'Port Captain', isPrimary: true },
      { companyId: companyByName('GAC').id, firstName: 'Pradeep', lastName: 'Nair', email: 'p.nair@gac.com', phone: '+912226541000', role: 'agency', designation: 'Agency Manager', isPrimary: true },
      { companyId: companyByName('Aegean').id, firstName: 'Nikos', lastName: 'Papadopoulos', email: 'n.papadopoulos@aegean.com', phone: '+302104584000', role: 'bunkers', designation: 'Bunker Trader', isPrimary: true },
    ];
    await prisma.contact.createMany({ data: contactsData });
    console.log(`  Contacts: ${contactsData.length} seeded`);
  } else {
    console.log(`  Contacts: already seeded (${existingContacts})`);
  }

  // === Company Relationships ===
  const existingRelationships = await prisma.companyRelationship.count();
  if (existingRelationships === 0) {
    await prisma.companyRelationship.createMany({ data: [
      { companyAId: companyByName('Cargill').id, companyBId: companyByName('Clarksons').id, type: 'preferred_broker', notes: 'Clarksons brokers most Cargill dry bulk fixtures' },
      { companyAId: companyByName('Trafigura').id, companyBId: companyByName('SSY').id, type: 'preferred_broker', notes: 'SSY handles Trafigura dry cargo enquiries' },
      { companyAId: companyByName('J M Baxi').id, companyBId: companyByName('GAC').id, type: 'sub_agent', notes: 'GAC sub-agents for J M Baxi at minor ports' },
    ]});
    console.log('  Company Relationships: 3 seeded');
  } else {
    console.log(`  Company Relationships: already seeded (${existingRelationships})`);
  }

  // === Cargo Enquiries ===
  const existingEnquiries = await prisma.cargoEnquiry.count();
  if (existingEnquiries === 0) {
    const daysAgoE = (d: number) => new Date(Date.now() - d * 86400000);
    const daysFromNowE = (d: number) => new Date(Date.now() + d * 86400000);
    await prisma.cargoEnquiry.createMany({ data: [
      { reference: 'ENQ-00001', cargoType: 'Iron Ore Fines', hsCode: '2601.11', quantity: 80000, tolerance: 5, packaging: 'bulk', loadPortId: portByCode('INPAR').id, dischargePortId: portByCode('CNTXG').id, laycanFrom: daysFromNowE(15), laycanTo: daysFromNowE(22), rateIndication: 15.0, rateUnit: 'per_mt', currency: 'USD', chartererId: companyByName('Cargill').id, brokerId: companyByName('Clarksons').id, status: 'under_negotiation', receivedVia: 'email', receivedAt: daysAgoE(3), organizationId: org.id },
      { reference: 'ENQ-00002', cargoType: 'Thermal Coal', hsCode: '2701.12', quantity: 55000, packaging: 'bulk', loadPortId: portByCode('INMND').id, dischargePortId: portByCode('SGSIN').id, laycanFrom: daysFromNowE(20), laycanTo: daysFromNowE(28), rateIndication: 12.5, rateUnit: 'per_mt', currency: 'USD', status: 'new', receivedVia: 'platform', receivedAt: daysAgoE(1), organizationId: org.id },
      { reference: 'ENQ-00003', cargoType: 'Bauxite', hsCode: '2606.00', quantity: 65000, tolerance: 10, packaging: 'bulk', loadPortId: portByCode('INVTZ').id, dischargePortId: portByCode('CNSHA').id, laycanFrom: daysFromNowE(30), laycanTo: daysFromNowE(38), rateIndication: 13.0, rateUnit: 'per_mt', currency: 'USD', chartererId: companyByName('Trafigura').id, brokerId: companyByName('SSY').id, status: 'new', receivedVia: 'email', receivedAt: daysAgoE(0), organizationId: org.id },
      { reference: 'ENQ-00004', cargoType: 'Steel Slabs', hsCode: '7207.11', quantity: 25000, packaging: 'general', loadPortId: portByCode('INMAA').id, dischargePortId: portByCode('AEJEA').id, laycanFrom: daysFromNowE(10), laycanTo: daysFromNowE(16), rateIndication: 28.0, rateUnit: 'per_mt', currency: 'USD', status: 'declined', receivedVia: 'broker', receivedAt: daysAgoE(7), notes: 'Declined — no suitable vessel available in laycan window', organizationId: org.id },
    ]});
    console.log('  Cargo Enquiries: 4 seeded');
  } else {
    console.log(`  Cargo Enquiries: already seeded (${existingEnquiries})`);
  }

  // === Invoices & Payments ===
  const existingInvoices = await prisma.invoice.count();
  if (existingInvoices === 0) {
    const daysAgoI = (d: number) => new Date(Date.now() - d * 86400000);
    const daysFromNowI = (d: number) => new Date(Date.now() + d * 86400000);

    const inv1 = await prisma.invoice.create({ data: {
      invoiceNumber: 'FRT-000001', type: 'freight', voyageId: voyageRecords[0].id, charterId: charterRecords[0].id, companyId: companyByName('Cargill').id,
      amount: 1087500, currency: 'USD', taxAmount: 0, totalAmount: 1087500, status: 'paid', paidAmount: 1087500,
      issueDate: daysAgoI(20), dueDate: daysAgoI(5), paidDate: daysAgoI(8),
      description: 'Freight invoice V-2026-001: 75,000 MT x $14.50/MT', organizationId: org.id,
    }});
    await prisma.payment.create({ data: {
      invoiceId: inv1.id, amount: 1087500, currency: 'USD', method: 'wire_transfer', reference: 'CITI-TT-20260122', bankName: 'Citibank Singapore', settledDate: daysAgoI(8), status: 'confirmed',
    }});

    const inv2 = await prisma.invoice.create({ data: {
      invoiceNumber: 'DEM-000001', type: 'demurrage', voyageId: voyageRecords[0].id, charterId: charterRecords[0].id, companyId: companyByName('Cargill').id,
      amount: 7000, currency: 'USD', taxAmount: 0, totalAmount: 7000, status: 'issued', paidAmount: 0,
      issueDate: daysAgoI(15), dueDate: daysFromNowI(15),
      description: 'Demurrage at Paradip: 6 hours excess @ $28,000/day', organizationId: org.id,
    }});

    const inv3 = await prisma.invoice.create({ data: {
      invoiceNumber: 'FRT-000002', type: 'freight', voyageId: voyageRecords[1].id, charterId: charterRecords[1].id, companyId: companyByName('Trafigura').id,
      amount: 649000, currency: 'USD', taxAmount: 0, totalAmount: 649000, status: 'partially_paid', paidAmount: 324500,
      issueDate: daysAgoI(10), dueDate: daysFromNowI(5),
      description: 'Freight invoice V-2026-002: 55,000 MT x $11.80/MT', organizationId: org.id,
    }});
    await prisma.payment.create({ data: {
      invoiceId: inv3.id, amount: 324500, currency: 'USD', method: 'wire_transfer', reference: 'HSBC-TT-20260125', bankName: 'HSBC Singapore', settledDate: daysAgoI(5), status: 'confirmed', notes: 'First 50% installment',
    }});

    await prisma.invoice.create({ data: {
      invoiceNumber: 'HIR-000001', type: 'hire', charterId: charterRecords[3].id, companyId: companyByName('Trafigura').id,
      amount: 350000, currency: 'USD', taxAmount: 0, totalAmount: 350000, status: 'paid', paidAmount: 350000,
      issueDate: daysAgoI(60), dueDate: daysAgoI(45), paidDate: daysAgoI(48),
      description: 'Lumpsum hire V-2026-004: Mumbai to Jeddah', organizationId: org.id,
    }});

    console.log('  Invoices: 4 with 2 payments seeded');
  } else {
    console.log(`  Invoices: already seeded (${existingInvoices})`);
  }

  // === Commissions ===
  const existingCommissions = await prisma.commission.count();
  if (existingCommissions === 0) {
    await prisma.commission.createMany({ data: [
      { charterId: charterRecords[0].id, partyId: companyByName('Clarksons').id, type: 'brokerage', percentage: 1.25, baseAmount: 1087500, amount: 13593.75, currency: 'USD', status: 'paid', organizationId: org.id },
      { charterId: charterRecords[0].id, partyId: companyByName('Cargill').id, type: 'address_commission', percentage: 3.75, baseAmount: 1087500, amount: 40781.25, currency: 'USD', status: 'paid', organizationId: org.id },
      { charterId: charterRecords[1].id, partyId: companyByName('SSY').id, type: 'brokerage', percentage: 1.25, baseAmount: 649000, amount: 8112.50, currency: 'USD', status: 'pending', organizationId: org.id },
      { charterId: charterRecords[1].id, partyId: companyByName('Trafigura').id, type: 'address_commission', percentage: 3.75, baseAmount: 649000, amount: 24337.50, currency: 'USD', status: 'pending', organizationId: org.id },
      { charterId: charterRecords[2].id, partyId: companyByName('Clarksons').id, type: 'brokerage', percentage: 1.25, baseAmount: 1365000, amount: 17062.50, currency: 'USD', status: 'pending', organizationId: org.id, notes: 'Wheat Melbourne-Mumbai fixture' },
    ]});
    console.log('  Commissions: 5 seeded');
  } else {
    console.log(`  Commissions: already seeded (${existingCommissions})`);
  }

  // === Currency Rates ===
  const existingRates = await prisma.currencyRate.count();
  if (existingRates === 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.currencyRate.createMany({ data: [
      { fromCcy: 'USD', toCcy: 'INR', rate: 83.25, date: today },
      { fromCcy: 'USD', toCcy: 'EUR', rate: 0.92, date: today },
      { fromCcy: 'USD', toCcy: 'GBP', rate: 0.79, date: today },
      { fromCcy: 'USD', toCcy: 'SGD', rate: 1.34, date: today },
      { fromCcy: 'EUR', toCcy: 'USD', rate: 1.087, date: today },
      { fromCcy: 'GBP', toCcy: 'USD', rate: 1.266, date: today },
      { fromCcy: 'INR', toCcy: 'USD', rate: 0.012, date: today },
    ]});
    console.log('  Currency Rates: 7 seeded');
  } else {
    console.log(`  Currency Rates: already seeded (${existingRates})`);
  }

  // === Noon Reports ===
  const existingNoonReports = await prisma.noonReport.count();
  if (existingNoonReports === 0) {
    const nrBaseDate = new Date('2026-01-10T12:00:00Z');
    const nrDay = (d: number) => new Date(nrBaseDate.getTime() + d * 86400000);
    await prisma.noonReport.createMany({ data: [
      // 3 reports for vessel 0 (MV ANKR Pioneer) on voyage 1
      {
        vesselId: allVessels[0].id, voyageId: voyageRecords[0].id, reportDate: nrDay(0), reportType: 'noon',
        latitude: 8.5, longitude: 76.8, course: 245,
        speedOrdered: 13.5, speedActual: 13.2, distanceSailed: 316.8, distanceToGo: 2840,
        foConsumed: 34.5, doConsumed: 1.2, lsfoConsumed: 0, mgoConsumed: 0.8,
        foROB: 820, doROB: 95, lsfoROB: 180, mgoROB: 42, fwROB: 120,
        windForce: 4, windDirection: 'SW', seaState: 3, swellHeight: 1.5,
        meRPM: 95, mePower: 8200, slipPercentage: 3.2,
        remarks: 'Fair weather, vessel proceeding as per voyage orders',
      },
      {
        vesselId: allVessels[0].id, voyageId: voyageRecords[0].id, reportDate: nrDay(1), reportType: 'noon',
        latitude: 6.2, longitude: 74.1, course: 240,
        speedOrdered: 13.5, speedActual: 12.8, distanceSailed: 307.2, distanceToGo: 2533,
        foConsumed: 36.2, doConsumed: 1.3, lsfoConsumed: 0, mgoConsumed: 0.9,
        foROB: 783.8, doROB: 93.7, lsfoROB: 180, mgoROB: 41.1, fwROB: 115,
        windForce: 5, windDirection: 'SW', seaState: 4, swellHeight: 2.2,
        meRPM: 96, mePower: 8400, slipPercentage: 4.1,
        remarks: 'Moderate SW monsoon swell. Slight speed reduction to maintain safe motion.',
      },
      {
        vesselId: allVessels[0].id, voyageId: voyageRecords[0].id, reportDate: nrDay(2), reportType: 'noon',
        latitude: 4.1, longitude: 71.5, course: 235,
        speedOrdered: 13.5, speedActual: 13.4, distanceSailed: 321.6, distanceToGo: 2211,
        foConsumed: 33.8, doConsumed: 1.1, lsfoConsumed: 0, mgoConsumed: 0.7,
        foROB: 750, doROB: 92.6, lsfoROB: 180, mgoROB: 40.4, fwROB: 110,
        windForce: 4, windDirection: 'W', seaState: 3, swellHeight: 1.8,
        meRPM: 94, mePower: 8100, slipPercentage: 2.9,
        remarks: 'Weather improving. On course and on schedule.',
      },
      // 3 reports for vessel 1 (MV Ocean Harmony)
      {
        vesselId: allVessels[1].id, voyageId: voyageRecords[0].id, reportDate: nrDay(0), reportType: 'noon',
        latitude: 12.4, longitude: 80.6, course: 195,
        speedOrdered: 14.0, speedActual: 13.6, distanceSailed: 326.4, distanceToGo: 1950,
        foConsumed: 38.5, doConsumed: 1.5, lsfoConsumed: 0, mgoConsumed: 1.0,
        foROB: 1050, doROB: 110, lsfoROB: 220, mgoROB: 55, fwROB: 140,
        windForce: 5, windDirection: 'NE', seaState: 4, swellHeight: 2.5,
        meRPM: 88, mePower: 10200, slipPercentage: 3.8,
        remarks: 'NE monsoon conditions. Slight head seas.',
      },
      {
        vesselId: allVessels[1].id, voyageId: voyageRecords[0].id, reportDate: nrDay(1), reportType: 'noon',
        latitude: 9.8, longitude: 79.3, course: 200,
        speedOrdered: 14.0, speedActual: 14.1, distanceSailed: 338.4, distanceToGo: 1612,
        foConsumed: 40.2, doConsumed: 1.6, lsfoConsumed: 0, mgoConsumed: 1.1,
        foROB: 1009.8, doROB: 108.4, lsfoROB: 220, mgoROB: 53.9, fwROB: 135,
        windForce: 6, windDirection: 'NE', seaState: 5, swellHeight: 3.0,
        meRPM: 90, mePower: 10500, slipPercentage: 4.5,
        remarks: 'Heavy NE monsoon swell. Master increased RPM to maintain schedule.',
      },
      {
        vesselId: allVessels[1].id, voyageId: voyageRecords[0].id, reportDate: nrDay(2), reportType: 'noon',
        latitude: 7.1, longitude: 78.0, course: 210,
        speedOrdered: 14.0, speedActual: 13.8, distanceSailed: 331.2, distanceToGo: 1281,
        foConsumed: 39.0, doConsumed: 1.4, lsfoConsumed: 0, mgoConsumed: 0.9,
        foROB: 970.8, doROB: 107, lsfoROB: 220, mgoROB: 53, fwROB: 130,
        windForce: 4, windDirection: 'NE', seaState: 3, swellHeight: 1.6,
        meRPM: 87, mePower: 10000, slipPercentage: 3.0,
        remarks: 'Weather easing. Passing south of Sri Lanka.',
      },
    ]});
    console.log('  Noon Reports: 6 seeded');
  } else {
    console.log(`  Noon Reports: already seeded (${existingNoonReports})`);
  }

  // === Vessel History Entries ===
  const existingVesselHistory = await prisma.vesselHistoryEntry.count();
  if (existingVesselHistory === 0) {
    await prisma.vesselHistoryEntry.createMany({ data: [
      {
        vesselId: allVessels[0].id, changeType: 'flag_change',
        changeDate: new Date('2018-03-15'),
        fromValue: 'Panama', toValue: 'India',
        remarks: 'Re-flagged to Indian registry under tonnage tax scheme',
        source: 'registry',
      },
      {
        vesselId: allVessels[0].id, changeType: 'class_change',
        changeDate: new Date('2020-06-01'),
        fromValue: 'Nippon Kaiji Kyokai (NK)', toValue: 'Indian Register of Shipping (IRS)',
        remarks: 'Class transferred following flag change',
        source: 'manual',
      },
      {
        vesselId: allVessels[1].id, changeType: 'ownership_change',
        changeDate: new Date('2019-11-20'),
        fromValue: 'Pacific Marine Holdings Ltd', toValue: 'ANKR Maritime Pvt Ltd',
        remarks: 'Acquired as part of fleet expansion program',
        source: 'manual',
      },
      {
        vesselId: allVessels[1].id, changeType: 'name_change',
        changeDate: new Date('2019-12-10'),
        fromValue: 'Pacific Harmony', toValue: 'MV Ocean Harmony',
        remarks: 'Renamed after acquisition by ANKR Maritime',
        source: 'registry',
      },
    ]});
    console.log('  Vessel History: 4 entries seeded');
  } else {
    console.log(`  Vessel History: already seeded (${existingVesselHistory})`);
  }

  // === KYC Records ===
  const existingKYC = await prisma.kYCRecord.count();
  if (existingKYC === 0) {
    const daysAgoK = (d: number) => new Date(Date.now() - d * 86400000);
    const daysFromNowK = (d: number) => new Date(Date.now() + d * 86400000);
    await prisma.kYCRecord.createMany({ data: [
      {
        companyId: companyByName('Cargill').id, organizationId: org.id,
        status: 'approved', riskScore: 12,
        uboName: 'Cargill Family Trust', uboNationality: 'US', uboPepCheck: false,
        sanctionsCheck: true, sanctionsResult: 'clear', sanctionsDate: daysAgoK(30),
        taxId: 'CHE-101.035.862', maritimeLicense: 'CH-MAR-2024-0456',
        reviewer: 'Captain Admin', reviewNotes: 'Blue-chip commodity house. Low risk. Annual review due Q3-2026.',
        lastChecked: daysAgoK(30), nextReview: daysFromNowK(180),
      },
      {
        companyId: companyByName('Trafigura').id, organizationId: org.id,
        status: 'in_review', riskScore: 45,
        uboName: 'Trafigura Group Pte Ltd — multi-shareholder', uboNationality: 'SG', uboPepCheck: true,
        sanctionsCheck: true, sanctionsResult: 'clear', sanctionsDate: daysAgoK(15),
        taxId: 'SG-UEN-200715211K', maritimeLicense: 'SG-MAR-2025-0891',
        reviewer: 'Captain Admin', reviewNotes: 'PEP flag raised on one UBO. Additional due diligence in progress.',
        lastChecked: daysAgoK(15), nextReview: daysFromNowK(90),
      },
      {
        companyId: companyByName('Blue Water').id, organizationId: org.id,
        status: 'pending', riskScore: null,
        uboName: null, uboNationality: null, uboPepCheck: false,
        sanctionsCheck: false, sanctionsResult: null, sanctionsDate: null,
        taxId: 'DK-CVR-26482216', maritimeLicense: null,
        reviewer: null, reviewNotes: null,
        lastChecked: null, nextReview: null,
      },
    ]});
    console.log('  KYC Records: 3 seeded');
  } else {
    console.log(`  KYC Records: already seeded (${existingKYC})`);
  }

  // === Cargo Compatibility ===
  const existingCompat = await prisma.cargoCompatibility.count();
  if (existingCompat === 0) {
    await prisma.cargoCompatibility.createMany({ data: [
      { cargoA: 'Iron Ore', cargoB: 'Coal', compatible: true, notes: 'Both dry bulk. Standard hold cleaning between cargoes.', source: 'imsbc' },
      { cargoA: 'Crude Oil', cargoB: 'Grain', compatible: false, notes: 'Contamination risk. Petroleum residues render grain unfit for consumption.', source: 'imo' },
      { cargoA: 'Sugar', cargoB: 'Rice', compatible: true, notes: 'Both food-grade dry bulk. Normal hold cleaning sufficient.', source: 'imsbc' },
      { cargoA: 'Chemicals', cargoB: 'Food Products', compatible: false, notes: 'Toxic contamination hazard. Must not share same hold or adjacent tanks.', source: 'imo' },
      { cargoA: 'Steel Coils', cargoB: 'Timber', compatible: true, notes: 'Both general cargo. Ensure proper dunnage and separation.', source: 'manual' },
      { cargoA: 'Gasoline', cargoB: 'Diesel', compatible: true, notes: 'Both clean petroleum products. Tank wash required between grades.', source: 'imo' },
      { cargoA: 'Sulfur', cargoB: 'Grain', compatible: false, notes: 'Sulfur dust contamination. Toxic residue incompatible with food cargoes.', source: 'imsbc' },
      { cargoA: 'Bauxite', cargoB: 'Iron Ore', compatible: true, notes: 'Both dry bulk minerals. Standard hold cleaning between cargoes.', source: 'imsbc' },
    ]});
    console.log('  Cargo Compatibility: 8 records seeded');
  } else {
    console.log(`  Cargo Compatibility: already seeded (${existingCompat})`);
  }

  // === Time Charters + Hire Payments + Off-Hires ===
  const existingTC = await prisma.timeCharter.count();
  if (existingTC === 0) {
    const tc1 = await prisma.timeCharter.create({ data: {
      reference: 'TCI-0001', direction: 'tc_in',
      vesselId: allVessels[0].id, charterId: charterRecords[0].id, chartererId: companyByName('Cargill').id,
      organizationId: org.id,
      hireRate: 18500, currency: 'USD',
      deliveryDate: new Date('2025-12-01'), deliveryPort: 'Singapore',
      redeliveryDate: new Date('2026-06-01'), redeliveryPort: 'Singapore / Japan range',
      minDuration: 5, maxDuration: 7, redeliveryNotice: 30,
      balSpeed: 13.5, ladenSpeed: 12.5, balConsumption: 32, ladenConsumption: 36,
      bunkerDeliveryFO: 850, bunkerDeliveryDO: 120, bunkerPriceAtDel: 620,
      status: 'active',
      notes: 'TC-In from Cargill. Vessel employed in Indian Ocean / Far East trades.',
    }});

    const tc2 = await prisma.timeCharter.create({ data: {
      reference: 'TCO-0001', direction: 'tc_out',
      vesselId: allVessels[1].id, chartererId: companyByName('Trafigura').id,
      organizationId: org.id,
      hireRate: 22000, currency: 'USD',
      deliveryDate: new Date('2026-01-15'), deliveryPort: 'Jebel Ali',
      redeliveryDate: new Date('2026-07-15'), redeliveryPort: 'AG / India range',
      minDuration: 4, maxDuration: 6, redeliveryNotice: 20,
      balSpeed: 14.0, ladenSpeed: 13.0, balConsumption: 38, ladenConsumption: 42,
      bunkerDeliveryFO: 1100, bunkerDeliveryDO: 140, bunkerPriceAtDel: 615,
      status: 'active',
      notes: 'TC-Out to Trafigura for AG-India crude oil trade.',
    }});

    // Hire Payments
    await prisma.hirePayment.createMany({ data: [
      {
        timeCharterId: tc1.id,
        periodFrom: new Date('2025-12-01'), periodTo: new Date('2025-12-15'),
        hireRate: 18500, totalDays: 15, grossAmount: 277500, deductions: 0, netAmount: 277500,
        currency: 'USD', status: 'paid', dueDate: new Date('2025-12-01'), paidDate: new Date('2025-12-02'),
        reference: 'HP-TCI0001-001', notes: 'First 15 days hire — advance payment received',
      },
      {
        timeCharterId: tc1.id,
        periodFrom: new Date('2025-12-16'), periodTo: new Date('2025-12-31'),
        hireRate: 18500, totalDays: 16, grossAmount: 296000, deductions: 8547.92, netAmount: 287452.08,
        currency: 'USD', status: 'paid', dueDate: new Date('2025-12-16'), paidDate: new Date('2025-12-17'),
        reference: 'HP-TCI0001-002', notes: 'Second hire period. Deductions: 11.08 hrs off-hire for ME repair.',
      },
    ]});

    // Off-Hire
    await prisma.offHire.create({ data: {
      timeCharterId: tc1.id,
      offHireFrom: new Date('2025-12-22T08:00:00Z'), offHireTo: new Date('2025-12-22T19:05:00Z'),
      reason: 'breakdown', clause: 'Clause 15 — Off-Hire',
      totalHours: 11.08, hireRate: 18500, deductionAmount: 8547.92, currency: 'USD',
      status: 'agreed',
      notes: 'Main engine turbocharger repair. Parts sourced from Singapore. Off-hire agreed between owners and charterers.',
    }});

    console.log('  Time Charters: 2 seeded, Hire Payments: 2 seeded, Off-Hire: 1 seeded');
  } else {
    console.log(`  Time Charters: already seeded (${existingTC})`);
  }

  // === Vessel Positions ===
  const existingPositions = await prisma.vesselPosition.count();
  if (existingPositions === 0) {
    const posBase = new Date('2026-01-20T00:00:00Z');
    const posHours = (h: number) => new Date(posBase.getTime() + h * 3600000);
    await prisma.vesselPosition.createMany({ data: [
      // 4 positions for allVessels[0] — Indian Ocean crossing eastbound
      { vesselId: allVessels[0].id, latitude: 12.50, longitude: 74.80, speed: 13.2, heading: 110, course: 112, status: 'underway', destination: 'SGSIN', eta: new Date('2026-01-25T18:00:00Z'), source: 'manual', timestamp: posHours(0) },
      { vesselId: allVessels[0].id, latitude: 10.85, longitude: 77.60, speed: 13.5, heading: 115, course: 114, status: 'underway', destination: 'SGSIN', eta: new Date('2026-01-25T16:00:00Z'), source: 'manual', timestamp: posHours(6) },
      { vesselId: allVessels[0].id, latitude: 9.10, longitude: 80.30, speed: 13.8, heading: 112, course: 110, status: 'underway', destination: 'SGSIN', eta: new Date('2026-01-25T14:00:00Z'), source: 'manual', timestamp: posHours(12) },
      { vesselId: allVessels[0].id, latitude: 7.50, longitude: 83.10, speed: 12.5, heading: 105, course: 108, status: 'at_anchor', destination: 'SGSIN', eta: new Date('2026-01-25T18:00:00Z'), source: 'manual', timestamp: posHours(18) },
      // 4 positions for allVessels[1] — Indian Ocean heading SW towards AG
      { vesselId: allVessels[1].id, latitude: 15.20, longitude: 69.50, speed: 13.0, heading: 250, course: 248, status: 'underway', destination: 'AEJEA', eta: new Date('2026-01-24T06:00:00Z'), source: 'manual', timestamp: posHours(0) },
      { vesselId: allVessels[1].id, latitude: 15.90, longitude: 66.80, speed: 12.8, heading: 265, course: 262, status: 'underway', destination: 'AEJEA', eta: new Date('2026-01-24T04:00:00Z'), source: 'manual', timestamp: posHours(6) },
      { vesselId: allVessels[1].id, latitude: 16.80, longitude: 64.20, speed: 14.0, heading: 275, course: 272, status: 'underway', destination: 'AEJEA', eta: new Date('2026-01-23T22:00:00Z'), source: 'manual', timestamp: posHours(12) },
      { vesselId: allVessels[1].id, latitude: 18.10, longitude: 61.50, speed: 12.2, heading: 290, course: 288, status: 'at_anchor', destination: 'AEJEA', eta: new Date('2026-01-24T06:00:00Z'), source: 'manual', timestamp: posHours(18) },
    ]});
    console.log('  Vessel Positions: 8 seeded');
  } else {
    console.log(`  Vessel Positions: already seeded (${existingPositions})`);
  }

  // === Port Congestion ===
  const existingCongestion = await prisma.portCongestion.count();
  if (existingCongestion === 0) {
    const congBase = new Date('2026-01-18T06:00:00Z');
    const congDays = (d: number) => new Date(congBase.getTime() + d * 86400000);
    await prisma.portCongestion.createMany({ data: [
      // Mumbai — high congestion
      { portId: portByCode('INMUN').id, vesselsWaiting: 12, vesselsAtBerth: 8, avgWaitHours: 72, berthUtilization: 92, cargoType: 'dry_bulk', source: 'manual', notes: 'Monsoon season backlog — delays expected', timestamp: congDays(0) },
      { portId: portByCode('INMUN').id, vesselsWaiting: 8, vesselsAtBerth: 7, avgWaitHours: 56, berthUtilization: 85, cargoType: 'dry_bulk', source: 'manual', notes: 'Congestion easing slightly', timestamp: congDays(3) },
      // Singapore — moderate congestion
      { portId: portByCode('SGSIN').id, vesselsWaiting: 5, vesselsAtBerth: 14, avgWaitHours: 18, berthUtilization: 78, cargoType: 'container', source: 'manual', notes: 'Normal operations, minor bunker barge delays', timestamp: congDays(0) },
      { portId: portByCode('SGSIN').id, vesselsWaiting: 3, vesselsAtBerth: 12, avgWaitHours: 12, berthUtilization: 72, cargoType: 'container', source: 'manual', notes: 'Improving — additional berths freed up', timestamp: congDays(4) },
      // Qingdao — low congestion
      { portId: portByCode('CNTXG').id, vesselsWaiting: 2, vesselsAtBerth: 6, avgWaitHours: 8, berthUtilization: 55, cargoType: 'dry_bulk', source: 'manual', notes: 'Low season, berths available', timestamp: congDays(0) },
      { portId: portByCode('CNTXG').id, vesselsWaiting: 1, vesselsAtBerth: 5, avgWaitHours: 4, berthUtilization: 48, cargoType: 'dry_bulk', source: 'manual', notes: 'Chinese New Year approaching, reduced throughput', timestamp: congDays(5) },
    ]});
    console.log('  Port Congestion: 6 seeded');
  } else {
    console.log(`  Port Congestion: already seeded (${existingCongestion})`);
  }

  // === Anchorages ===
  const existingAnchorages = await prisma.anchorage.count();
  if (existingAnchorages === 0) {
    await prisma.anchorage.createMany({ data: [
      // Mumbai — 2 anchorages
      { portId: portByCode('INMUN').id, name: 'Mumbai Outer Anchorage', latitude: 18.8800, longitude: 72.8200, depth: 18.0, holdingGround: 'good', maxVessels: 40, shelter: 'moderate', cargoOps: false, notes: 'Primary waiting anchorage for JNPT-bound vessels. Exposed to SW monsoon swell Jun–Sep.' },
      { portId: portByCode('INMUN').id, name: 'Mumbai Inner Anchorage', latitude: 18.9200, longitude: 72.8600, depth: 12.5, holdingGround: 'good', maxVessels: 15, shelter: 'good', cargoOps: true, notes: 'STS ops permitted with port authority approval. Good holding in mud bottom.' },
      // Singapore — 1 anchorage
      { portId: portByCode('SGSIN').id, name: 'Singapore Eastern Anchorage (ESSPA)', latitude: 1.2200, longitude: 104.0200, depth: 22.0, holdingGround: 'moderate', maxVessels: 80, shelter: 'good', cargoOps: true, notes: 'Major STS and bunkering anchorage. Designated lightering zone.' },
      // Qingdao — 1 anchorage
      { portId: portByCode('CNTXG').id, name: 'Qingdao Outer Roads', latitude: 36.0100, longitude: 120.4500, depth: 20.0, holdingGround: 'good', maxVessels: 50, shelter: 'moderate', cargoOps: false, notes: 'Waiting area for dry bulk vessels. Sandy bottom, good holding.' },
    ]});
    console.log('  Anchorages: 4 seeded');
  } else {
    console.log(`  Anchorages: already seeded (${existingAnchorages})`);
  }

  // === Port Working Hours ===
  const existingWorkingHours = await prisma.portWorkingHours.count();
  if (existingWorkingHours === 0) {
    const mumbaiPort = portByCode('INMUN');
    await prisma.portWorkingHours.createMany({ data: [
      // Mumbai Mon-Sat day shift
      { portId: mumbaiPort.id, dayOfWeek: 1, shiftName: 'day_shift', startTime: '06:00', endTime: '18:00', cargoTypes: ['dry_bulk', 'general_cargo', 'container'], notes: 'Monday day shift — full cargo operations' },
      { portId: mumbaiPort.id, dayOfWeek: 2, shiftName: 'day_shift', startTime: '06:00', endTime: '18:00', cargoTypes: ['dry_bulk', 'general_cargo', 'container'], notes: 'Tuesday day shift' },
      { portId: mumbaiPort.id, dayOfWeek: 3, shiftName: 'day_shift', startTime: '06:00', endTime: '18:00', cargoTypes: ['dry_bulk', 'general_cargo', 'container'], notes: 'Wednesday day shift' },
      { portId: mumbaiPort.id, dayOfWeek: 4, shiftName: 'day_shift', startTime: '06:00', endTime: '18:00', cargoTypes: ['dry_bulk', 'general_cargo', 'container'], notes: 'Thursday day shift' },
      { portId: mumbaiPort.id, dayOfWeek: 5, shiftName: 'day_shift', startTime: '06:00', endTime: '18:00', cargoTypes: ['dry_bulk', 'general_cargo', 'container'], notes: 'Friday day shift' },
      { portId: mumbaiPort.id, dayOfWeek: 6, shiftName: 'day_shift', startTime: '06:00', endTime: '18:00', cargoTypes: ['dry_bulk', 'general_cargo', 'container'], notes: 'Saturday day shift — half day for some cargo types' },
      // Mumbai Mon-Sat night shift
      { portId: mumbaiPort.id, dayOfWeek: 1, shiftName: 'night_shift', startTime: '18:00', endTime: '06:00', cargoTypes: ['dry_bulk', 'container'], notes: 'Monday night shift — limited general cargo ops' },
      { portId: mumbaiPort.id, dayOfWeek: 2, shiftName: 'night_shift', startTime: '18:00', endTime: '06:00', cargoTypes: ['dry_bulk', 'container'], notes: 'Tuesday night shift' },
      { portId: mumbaiPort.id, dayOfWeek: 3, shiftName: 'night_shift', startTime: '18:00', endTime: '06:00', cargoTypes: ['dry_bulk', 'container'], notes: 'Wednesday night shift' },
      { portId: mumbaiPort.id, dayOfWeek: 4, shiftName: 'night_shift', startTime: '18:00', endTime: '06:00', cargoTypes: ['dry_bulk', 'container'], notes: 'Thursday night shift' },
      { portId: mumbaiPort.id, dayOfWeek: 5, shiftName: 'night_shift', startTime: '18:00', endTime: '06:00', cargoTypes: ['dry_bulk', 'container'], notes: 'Friday night shift' },
      { portId: mumbaiPort.id, dayOfWeek: 6, shiftName: 'night_shift', startTime: '18:00', endTime: '06:00', cargoTypes: ['dry_bulk', 'container'], notes: 'Saturday night shift' },
    ]});
    console.log('  Port Working Hours: 12 seeded (Mon-Sat day+night, Sunday off)');
  } else {
    console.log(`  Port Working Hours: already seeded (${existingWorkingHours})`);
  }

  // === Port Document Requirements ===
  const existingDocReqs = await prisma.portDocumentRequirement.count();
  if (existingDocReqs === 0) {
    await prisma.portDocumentRequirement.createMany({ data: [
      // India (Mumbai) — 4 docs
      { portId: portByCode('INMUN').id, country: 'IN', documentName: 'Crew List', category: 'immigration', required: true, leadTimeDays: 2, notes: 'To be submitted to DGLL 48 hours before arrival' },
      { portId: portByCode('INMUN').id, country: 'IN', documentName: 'Ship Sanitation Certificate', category: 'health', required: true, leadTimeDays: 3, notes: 'Valid SSCC or SSCEC required for all vessels. Port Health Officer inspection if expired.' },
      { portId: portByCode('INMUN').id, country: 'IN', documentName: 'ISPS Pre-arrival Notification', category: 'arrival', required: true, leadTimeDays: 3, notes: 'ISPS pre-arrival security information to CISF 72 hours before arrival' },
      { portId: portByCode('INMUN').id, country: 'IN', documentName: 'Cargo Manifest', category: 'customs', required: true, leadTimeDays: 1, notes: 'Import General Manifest (IGM) to be filed with Indian Customs 24 hours before arrival' },
      // Singapore — 4 docs
      { portId: portByCode('SGSIN').id, country: 'SG', documentName: 'Crew List', category: 'immigration', required: true, leadTimeDays: 1, notes: 'Submit via MPA MARINET system 24 hours before arrival' },
      { portId: portByCode('SGSIN').id, country: 'SG', documentName: 'Ship Sanitation Certificate', category: 'health', required: true, leadTimeDays: 1, notes: 'Valid SSCC/SSCEC. NEA conducts inspections if certificate is due.' },
      { portId: portByCode('SGSIN').id, country: 'SG', documentName: 'ISPS Pre-arrival Notification', category: 'arrival', required: true, leadTimeDays: 1, notes: 'Via MARINET — 24 hours before arrival at Singapore port limits' },
      { portId: portByCode('SGSIN').id, country: 'SG', documentName: 'Cargo Manifest', category: 'customs', required: true, leadTimeDays: 1, notes: 'Cargo declaration via TradeNet/MARINET 24 hours before arrival' },
    ]});
    console.log('  Port Document Requirements: 8 seeded');
  } else {
    console.log(`  Port Document Requirements: already seeded (${existingDocReqs})`);
  }

  // === Contracts of Affreightment (COA) ===
  const existingCOA = await prisma.contractOfAffreightment.count();
  if (existingCOA === 0) {
    // Create two COA-type charters first
    const coaCharter1 = await prisma.charter.create({ data: {
      reference: 'FXT-COA-001', type: 'coa', status: 'executed',
      chartererId: companyByName('Cargill').id, brokerId: companyByName('Clarksons').id, organizationId: org.id,
      fixtureDate: new Date('2025-10-15'), freightRate: 14.0, freightUnit: 'per_mt', currency: 'USD',
      notes: 'COA for Iron Ore Fines — East India to China, 5 shipments over 12 months',
    }});
    const coaCharter2 = await prisma.charter.create({ data: {
      reference: 'FXT-COA-002', type: 'coa', status: 'executed',
      chartererId: companyByName('Trafigura').id, brokerId: companyByName('SSY').id, organizationId: org.id,
      fixtureDate: new Date('2025-11-01'), freightRate: 11.5, freightUnit: 'per_mt', currency: 'USD',
      notes: 'COA for Coal — West India to SE Asia, 4 shipments over 12 months',
    }});

    const coa1 = await prisma.contractOfAffreightment.create({ data: {
      reference: 'COA-0001', charterId: coaCharter1.id, cargoType: 'Iron Ore Fines',
      totalQuantity: 500000, tolerance: 5, nominatedQty: 150000, shippedQty: 75000,
      shipmentCount: 5, maxShipments: 5,
      loadPortRange: 'Paradip / Visakhapatnam', dischargePortRange: 'Qingdao / Tianjin range',
      startDate: new Date('2025-11-01'), endDate: new Date('2026-10-31'),
      freightRate: 14.0, freightUnit: 'per_mt', currency: 'USD', status: 'active',
      organizationId: org.id, notes: 'Annual COA with Cargill for iron ore. Gencon 94 basis.',
    }});

    const coa2 = await prisma.contractOfAffreightment.create({ data: {
      reference: 'COA-0002', charterId: coaCharter2.id, cargoType: 'Thermal Coal',
      totalQuantity: 300000, tolerance: 10, nominatedQty: 55000, shippedQty: 55000,
      shipmentCount: 4, maxShipments: 4,
      loadPortRange: 'Mundra / Kandla', dischargePortRange: 'Singapore / Port Klang range',
      startDate: new Date('2025-12-01'), endDate: new Date('2026-11-30'),
      freightRate: 11.5, freightUnit: 'per_mt', currency: 'USD', status: 'active',
      organizationId: org.id, notes: 'COA with Trafigura for thermal coal. GENCON 94 basis.',
    }});

    console.log('  COA: 2 contracts seeded (with 2 COA charters)');

    // === COA Nominations ===
    await prisma.cOANomination.createMany({ data: [
      // COA-0001 nominations
      { coaId: coa1.id, voyageId: voyageRecords[0].id, shipmentNo: 1, quantity: 75000, loadPort: 'Paradip', dischargePort: 'Qingdao', laycanStart: new Date('2025-12-20'), laycanEnd: new Date('2025-12-28'), vesselName: 'MV ANKR Pioneer', status: 'shipped', notes: 'First shipment under COA — completed' },
      { coaId: coa1.id, shipmentNo: 2, quantity: 75000, loadPort: 'Visakhapatnam', dischargePort: 'Tianjin', laycanStart: new Date('2026-02-15'), laycanEnd: new Date('2026-02-22'), vesselName: 'TBN', status: 'accepted', notes: 'Second shipment — vessel to be nominated' },
      // COA-0002 nominations
      { coaId: coa2.id, voyageId: voyageRecords[1].id, shipmentNo: 1, quantity: 55000, loadPort: 'Mundra', dischargePort: 'Singapore', laycanStart: new Date('2026-01-05'), laycanEnd: new Date('2026-01-12'), vesselName: 'MV Gujarat Pride', status: 'shipped', notes: 'First coal shipment — in transit' },
      { coaId: coa2.id, shipmentNo: 2, quantity: 75000, tolerance: 10, loadPort: 'Kandla', dischargePort: 'Port Klang', laycanStart: new Date('2026-03-10'), laycanEnd: new Date('2026-03-18'), status: 'pending', notes: 'Awaiting charterer nomination' },
    ]});
    console.log('  COA Nominations: 4 seeded');
  } else {
    console.log(`  COA: already seeded (${existingCOA})`);
  }

  // === Fixture Subjects ===
  const existingSubjects = await prisma.fixtureSubject.count();
  if (existingSubjects === 0) {
    const daysFromNowFS = (d: number) => new Date(Date.now() + d * 86400000);
    const daysAgoFS = (d: number) => new Date(Date.now() - d * 86400000);
    await prisma.fixtureSubject.createMany({ data: [
      { charterId: charterRecords[0].id, type: 'sub_stem', description: 'Subject bunker stem confirmation at Paradip', deadline: daysAgoFS(30), liftedAt: daysAgoFS(32), liftedBy: 'Captain Admin', status: 'lifted', notes: 'Bunker stem confirmed with Peninsula Petroleum' },
      { charterId: charterRecords[0].id, type: 'sub_board', description: 'Subject board approval from owner\'s management', deadline: daysAgoFS(28), liftedAt: daysAgoFS(29), liftedBy: 'Captain Admin', status: 'lifted', notes: 'Board approved via email circulation' },
      { charterId: charterRecords[1].id, type: 'sub_charterers', description: 'Subject charterer\'s confirmation of laycan window', deadline: daysFromNowFS(3), status: 'open', notes: 'Trafigura to confirm laycan by COB Friday' },
      { charterId: charterRecords[1].id, type: 'sub_details', description: 'Subject satisfactory review of vessel particulars and vetting approval', deadline: daysFromNowFS(5), status: 'open', notes: 'Awaiting Trafigura vetting department review' },
    ]});
    console.log('  Fixture Subjects: 4 seeded');
  } else {
    console.log(`  Fixture Subjects: already seeded (${existingSubjects})`);
  }

  // === Charter Party Addenda ===
  const existingAddenda = await prisma.charterPartyAddendum.count();
  if (existingAddenda === 0) {
    // Create CharterParty records first (none exist yet)
    const cp1 = await prisma.charterParty.create({ data: {
      charterId: charterRecords[0].id, formType: 'GENCON 94',
      content: 'Gencon 94 charter party for iron ore voyage Paradip to Qingdao.',
      cargoId: cargoByComm('Iron Ore').id, loadPort: 'INPAR', dischargePort: 'CNTXG',
    }});
    const cp2 = await prisma.charterParty.create({ data: {
      charterId: charterRecords[1].id, formType: 'GENCON 94',
      content: 'Gencon 94 charter party for coal voyage Mundra to Singapore.',
      cargoId: cargoByComm('Coal').id, loadPort: 'INMND', dischargePort: 'SGSIN',
    }});

    await prisma.charterPartyAddendum.createMany({ data: [
      {
        charterPartyId: cp1.id, version: 1,
        title: 'Addendum No. 1 — Freight Rate Adjustment',
        description: 'Freight rate adjusted from $14.50 to $14.00/MT due to market softening. Agreed between owners and charterers.',
        content: 'It is hereby agreed that Clause 4 of the Charter Party dated 10 Dec 2025 is amended as follows:\n\nFreight Rate: USD 14.00 per metric ton (previously USD 14.50/MT).\n\nAll other terms and conditions remain unchanged.',
        effectiveDate: new Date('2025-12-15'), signedDate: new Date('2025-12-16'), status: 'signed',
      },
      {
        charterPartyId: cp2.id, version: 1,
        title: 'Addendum No. 1 — Discharge Port Option',
        description: 'Adding Port Klang as alternative discharge port at charterer\'s option.',
        content: 'It is hereby agreed that an additional discharge port option is added:\n\nDischarge Port: Singapore OR Port Klang at Charterer\'s option, to be declared latest 5 days before vessel\'s ETA discharge range.\n\nAll other terms and conditions remain unchanged.',
        effectiveDate: new Date('2026-01-05'), status: 'draft',
      },
    ]});
    console.log('  Charter Party Addenda: 2 seeded (with 2 Charter Parties)');
  } else {
    console.log(`  Charter Party Addenda: already seeded (${existingAddenda})`);
  }

  // === Cargo Quantity Logs ===
  const existingCargoQtyLogs = await prisma.cargoQuantityLog.count();
  if (existingCargoQtyLogs === 0) {
    await prisma.cargoQuantityLog.createMany({ data: [
      // Loading at Paradip (V-2026-001) — BL, ship, shore figures
      { voyageId: voyageRecords[0].id, portId: portByCode('INPAR').id, type: 'bl_figure', quantity: 58250.000, unit: 'MT', source: 'B/L MBL-PAR-001-26', remarks: 'Bill of lading figure — iron ore fines', loggedAt: new Date('2025-12-23T10:00:00Z'), loggedBy: 'Captain Admin' },
      { voyageId: voyageRecords[0].id, portId: portByCode('INPAR').id, type: 'ship_figure', quantity: 58312.500, unit: 'MT', source: 'Draft survey — loading port', remarks: 'Ship figure by draft survey at Paradip. Variance +62.5 MT vs B/L.', loggedAt: new Date('2025-12-23T12:30:00Z'), loggedBy: 'Chief Officer' },
      { voyageId: voyageRecords[0].id, portId: portByCode('INPAR').id, type: 'shore_figure', quantity: 58185.750, unit: 'MT', source: 'Shore scale weighbridge — Paradip Port Trust', remarks: 'Shore weighbridge total. Variance -64.25 MT vs B/L.', loggedAt: new Date('2025-12-23T13:00:00Z'), loggedBy: 'Port Surveyor' },
      // Discharge at Qingdao (V-2026-001) — BL, ship, shore figures
      { voyageId: voyageRecords[0].id, portId: portByCode('CNTXG').id, type: 'bl_figure', quantity: 58250.000, unit: 'MT', source: 'B/L MBL-PAR-001-26', remarks: 'B/L figure — as per loading port', loggedAt: new Date('2026-01-10T06:00:00Z'), loggedBy: 'Voyage Operator' },
      { voyageId: voyageRecords[0].id, portId: portByCode('CNTXG').id, type: 'ship_figure', quantity: 58208.000, unit: 'MT', source: 'Draft survey — discharge port', remarks: 'Ship figure at Qingdao. Loss of 104.5 MT vs ship figure at load. Moisture loss.', loggedAt: new Date('2026-01-12T20:30:00Z'), loggedBy: 'Chief Officer' },
      { voyageId: voyageRecords[0].id, portId: portByCode('CNTXG').id, type: 'shore_figure', quantity: 58142.300, unit: 'MT', source: 'Shore scale — Qingdao Port Authority', remarks: 'Shore outturn weight. Shortage of 107.7 MT vs B/L — within acceptable 0.5% tolerance.', loggedAt: new Date('2026-01-12T21:00:00Z'), loggedBy: 'Discharge Surveyor' },
    ]});
    console.log('  Cargo Quantity Logs: 6 seeded');
  } else {
    console.log(`  Cargo Quantity Logs: already seeded (${existingCargoQtyLogs})`);
  }

  // === Voyage Port Calls ===
  const existingPortCalls = await prisma.voyagePortCall.count();
  if (existingPortCalls === 0) {
    for (const [vi, rotation] of [
      [0, [
        { portCode: 'INPAR', seq: 1, purpose: 'loading', eta: '2025-12-22T06:00:00Z', etd: '2025-12-23T14:30:00Z', ata: '2025-12-22T06:00:00Z', atd: '2025-12-23T14:30:00Z', cargoQty: 55000, status: 'departed' },
        { portCode: 'CNTXG', seq: 2, purpose: 'discharging', eta: '2026-01-09T11:00:00Z', etd: '2026-01-13T08:00:00Z', ata: '2026-01-09T11:00:00Z', cargoQty: 55000, status: 'alongside' },
      ]],
      [1, [
        { portCode: 'INMND', seq: 1, purpose: 'loading', eta: '2026-01-07T14:00:00Z', etd: '2026-01-09T10:00:00Z', cargoQty: 32000, status: 'planned' },
        { portCode: 'SGSIN', seq: 2, purpose: 'bunkering', eta: '2026-01-14T08:00:00Z', etd: '2026-01-14T20:00:00Z', status: 'planned' },
        { portCode: 'JPYOK', seq: 3, purpose: 'discharging', eta: '2026-01-20T06:00:00Z', cargoQty: 32000, status: 'planned' },
      ]],
    ] as [number, { portCode: string; seq: number; purpose: string; eta?: string; etd?: string; ata?: string; atd?: string; cargoQty?: number; status: string }[]][]) {
      for (const pc of rotation) {
        await prisma.voyagePortCall.create({
          data: {
            voyageId: voyageRecords[vi].id,
            portId: portByCode(pc.portCode).id,
            sequence: pc.seq,
            purpose: pc.purpose,
            eta: pc.eta ? new Date(pc.eta) : undefined,
            etd: pc.etd ? new Date(pc.etd) : undefined,
            ata: pc.ata ? new Date(pc.ata) : undefined,
            atd: pc.atd ? new Date(pc.atd) : undefined,
            cargoQty: pc.cargoQty,
            status: pc.status,
          },
        });
      }
    }
    console.log('  Voyage Port Calls: 5 seeded');
  } else {
    console.log(`  Voyage Port Calls: already seeded (${existingPortCalls})`);
  }

  // === Nominations ===
  const existingNominations = await prisma.nomination.count();
  if (existingNominations === 0) {
    await prisma.nomination.createMany({
      data: [
        { voyageId: voyageRecords[0].id, type: 'vessel', entityName: 'MV Ankr Pioneer', status: 'confirmed', confirmedAt: new Date('2025-12-18T10:00:00Z'), nominatedBy: 'admin@ankr.in' },
        { voyageId: voyageRecords[0].id, type: 'agent', entityName: 'Paradip Port Services Ltd', status: 'confirmed', confirmedAt: new Date('2025-12-19T14:00:00Z'), nominatedBy: 'admin@ankr.in' },
        { voyageId: voyageRecords[0].id, type: 'surveyor', entityName: 'SGS Marine Services', status: 'confirmed', confirmedAt: new Date('2025-12-20T09:00:00Z') },
        { voyageId: voyageRecords[0].id, type: 'stevedore', entityName: 'Paradip Stevedoring Corp', status: 'pending', nominatedBy: 'admin@ankr.in' },
        { voyageId: voyageRecords[1].id, type: 'vessel', entityName: 'MV Trade Wind', status: 'confirmed', confirmedAt: new Date('2026-01-03T08:00:00Z') },
        { voyageId: voyageRecords[1].id, type: 'agent', entityName: 'Mundra Marine Agency', status: 'pending' },
        { voyageId: voyageRecords[1].id, type: 'berth', entityName: 'Berth 12A - Mundra Port', status: 'pending', notes: 'Awaiting berth allocation confirmation' },
        { voyageId: voyageRecords[1].id, type: 'surveyor', entityName: 'Bureau Veritas Marine', status: 'rejected', notes: 'Charterer prefers SGS' },
      ],
    });
    console.log('  Nominations: 8 seeded');
  } else {
    console.log(`  Nominations: already seeded (${existingNominations})`);
  }

  // === Voyage Estimate History ===
  const existingVEH = await prisma.voyageEstimateHistory.count();
  if (existingVEH === 0) {
    await prisma.voyageEstimateHistory.createMany({
      data: [
        {
          voyageId: voyageRecords[0]?.id,
          label: 'Initial Estimate - JNPT to Fujairah',
          vesselName: 'MV Ankr Vanguard',
          vesselDwt: 55000,
          cargoQuantity: 48000,
          freightRate: 18.5,
          freightUnit: 'per_mt',
          seaDistanceNm: 1250,
          speedKnots: 13.5,
          loadDays: 3,
          dischargeDays: 4,
          bunkerPriceIfo: 480,
          bunkerPriceMgo: 870,
          loadPortDa: 42000,
          dischargePortDa: 55000,
          grossRevenue: 888000,
          netRevenue: 844560,
          totalCosts: 320000,
          netResult: 524560,
          tce: 18020,
          totalDays: 29.1,
          createdBy: 'Captain Ops',
        },
        {
          voyageId: voyageRecords[0]?.id,
          label: 'Revised - Higher bunker cost',
          vesselName: 'MV Ankr Vanguard',
          vesselDwt: 55000,
          cargoQuantity: 48000,
          freightRate: 18.5,
          freightUnit: 'per_mt',
          seaDistanceNm: 1250,
          speedKnots: 13.0,
          loadDays: 3,
          dischargeDays: 4,
          bunkerPriceIfo: 520,
          bunkerPriceMgo: 920,
          loadPortDa: 42000,
          dischargePortDa: 55000,
          grossRevenue: 888000,
          netRevenue: 844560,
          totalCosts: 345000,
          netResult: 499560,
          tce: 16420,
          totalDays: 30.4,
          createdBy: 'Captain Ops',
        },
        {
          charterId: null,
          label: 'Spec - Mundra to Singapore coal',
          vesselName: 'MV Ankr Horizon',
          vesselDwt: 76000,
          cargoQuantity: 65000,
          freightRate: 12.8,
          freightUnit: 'per_mt',
          seaDistanceNm: 2980,
          speedKnots: 12.5,
          loadDays: 4,
          dischargeDays: 5,
          bunkerPriceIfo: 450,
          bunkerPriceMgo: 850,
          loadPortDa: 38000,
          dischargePortDa: 62000,
          grossRevenue: 832000,
          netRevenue: 790400,
          totalCosts: 410000,
          netResult: 380400,
          tce: 12680,
          totalDays: 30,
          createdBy: 'Chartering Mgr',
        },
        {
          label: 'TC-in evaluation - 6 month period',
          vesselName: 'MV Pacific Star',
          vesselDwt: 82000,
          cargoQuantity: 70000,
          freightRate: 15.0,
          freightUnit: 'per_mt',
          seaDistanceNm: 3500,
          speedKnots: 14.0,
          loadDays: 3,
          dischargeDays: 4,
          bunkerPriceIfo: 460,
          bunkerPriceMgo: 860,
          loadPortDa: 50000,
          dischargePortDa: 65000,
          grossRevenue: 1050000,
          netRevenue: 997500,
          totalCosts: 520000,
          netResult: 477500,
          tce: 15250,
          totalDays: 31.3,
          createdBy: 'VP Operations',
        },
      ],
    });
    console.log('  VoyageEstimateHistory: 4 seeded');
  } else {
    console.log(`  VoyageEstimateHistory: already seeded (${existingVEH})`);
  }

  // === Delay Alerts ===
  const existingDelayAlerts = await prisma.delayAlert.count();
  if (existingDelayAlerts === 0 && voyageRecords.length > 0) {
    await prisma.delayAlert.createMany({
      data: [
        {
          voyageId: voyageRecords[0].id,
          type: 'weather',
          severity: 'warning',
          description: 'Cyclone warning in Arabian Sea - potential 12hr diversion',
          delayHours: 12,
          rootCause: 'Cyclonic depression forming near Lakshadweep',
        },
        {
          voyageId: voyageRecords[0].id,
          type: 'port_congestion',
          severity: 'critical',
          description: 'Fujairah anchorage full - 48hr waiting expected',
          delayHours: 48,
          rootCause: 'High vessel traffic due to bunker demand surge',
        },
        {
          voyageId: voyageRecords[0].id,
          type: 'customs',
          severity: 'info',
          description: 'Additional customs documentation requested for cargo manifest',
          delayHours: 4,
          rootCause: 'New UAE customs regulation effective Jan 2026',
          resolvedAt: new Date('2026-01-28T14:00:00Z'),
          resolvedBy: 'Port Agent - Fujairah',
        },
        {
          voyageId: voyageRecords[1]?.id ?? voyageRecords[0].id,
          type: 'mechanical',
          severity: 'warning',
          description: 'Crane #2 hydraulic issue - reduced loading rate',
          delayHours: 8,
          rootCause: 'Hydraulic seal failure on deck crane',
        },
        {
          voyageId: voyageRecords[1]?.id ?? voyageRecords[0].id,
          type: 'cargo_ops',
          severity: 'info',
          description: 'Rain stoppage during loading - cargo hold covers closed',
          delayHours: 6,
          rootCause: 'Monsoon rain',
          resolvedAt: new Date('2026-01-27T08:00:00Z'),
          resolvedBy: 'Chief Officer',
        },
        {
          voyageId: voyageRecords[0].id,
          type: 'strike',
          severity: 'critical',
          description: 'Stevedore strike at discharge port - operations halted',
          delayHours: 72,
          rootCause: 'Labor dispute over wage revision',
        },
      ],
    });
    console.log('  DelayAlerts: 6 seeded');
  } else {
    console.log(`  DelayAlerts: already seeded (${existingDelayAlerts})`);
  }

  // === Credit/Debit Notes ===
  const existingCDN = await prisma.creditDebitNote.count();
  if (existingCDN === 0) {
    const allDAs = await prisma.disbursementAccount.findMany({ take: 5, orderBy: { createdAt: 'asc' } });
    if (allDAs.length >= 4) {
      await prisma.creditDebitNote.createMany({
        data: [
          {
            disbursementAccountId: allDAs[0].id,
            type: 'credit',
            amount: 2500,
            reason: 'overcharge',
            description: 'Port dues overcharged - corrected GRT calculation',
            status: 'issued',
            issuedTo: 'J M Baxi & Co',
            referenceNumber: 'CDN-2026-001',
            issuedAt: new Date('2026-01-20T10:00:00Z'),
          },
          {
            disbursementAccountId: allDAs[1].id,
            type: 'debit',
            amount: 3200,
            reason: 'additional_service',
            description: 'Additional towage for shifting berth during discharge',
            status: 'draft',
            issuedTo: 'Wilhelmsen Ships Service',
            referenceNumber: 'CDN-2026-002',
          },
          {
            disbursementAccountId: allDAs[0].id,
            type: 'credit',
            amount: 1800,
            reason: 'service_not_rendered',
            description: 'Launch hire not utilized - vessel anchored at berth',
            status: 'settled',
            issuedTo: 'J M Baxi & Co',
            referenceNumber: 'CDN-2026-003',
            issuedAt: new Date('2026-01-15T09:00:00Z'),
            settledAt: new Date('2026-01-22T16:00:00Z'),
          },
          {
            disbursementAccountId: allDAs[2].id,
            type: 'debit',
            amount: 4500,
            reason: 'rate_adjustment',
            description: 'Pilotage rate increase effective Jan 2026 not reflected in PDA',
            status: 'disputed',
            issuedTo: 'GAC India',
            referenceNumber: 'CDN-2026-004',
            notes: 'Owner disputes rate applicability for vessels under 60K DWT',
          },
          {
            disbursementAccountId: allDAs[3].id,
            type: 'credit',
            amount: 5000,
            reason: 'penalty',
            description: 'Demurrage claim on port authority for berthing delay',
            status: 'issued',
            issuedTo: 'Inchcape Shipping',
            referenceNumber: 'CDN-2026-005',
            issuedAt: new Date('2026-01-25T11:00:00Z'),
          },
        ],
      });
      console.log('  CreditDebitNotes: 5 seeded');
    } else {
      console.log('  CreditDebitNotes: skipped (need DAs first)');
    }
  } else {
    console.log(`  CreditDebitNotes: already seeded (${existingCDN})`);
  }

  // === Role Permissions ===
  const existingPerms = await prisma.rolePermission.count();
  if (existingPerms === 0) {
    const roles = [
      { role: 'admin', canCreate: true, canRead: true, canUpdate: true, canDelete: true, canApprove: true, canExport: true },
      { role: 'manager', canCreate: true, canRead: true, canUpdate: true, canDelete: false, canApprove: true, canExport: true },
      { role: 'operator', canCreate: true, canRead: true, canUpdate: true, canDelete: false, canApprove: false, canExport: true },
      { role: 'viewer', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canApprove: false, canExport: false },
      { role: 'chartering_manager', canCreate: true, canRead: true, canUpdate: true, canDelete: false, canApprove: true, canExport: true },
      { role: 'broker', canCreate: true, canRead: true, canUpdate: true, canDelete: false, canApprove: false, canExport: true },
      { role: 'port_agent', canCreate: true, canRead: true, canUpdate: true, canDelete: false, canApprove: false, canExport: false },
      { role: 'da_clerk', canCreate: true, canRead: true, canUpdate: true, canDelete: false, canApprove: false, canExport: true },
    ];
    const modules = ['vessels', 'voyages', 'chartering', 'da_desk', 'laytime', 'claims', 'bunkers', 'crew', 'compliance', 'contacts', 'invoices', 'reports', 'analytics', 'settings'];
    const permData = roles.flatMap(r => modules.map(m => ({
      role: r.role, module: m,
      canCreate: r.canCreate, canRead: r.canRead, canUpdate: r.canUpdate,
      canDelete: r.canDelete, canApprove: r.canApprove, canExport: r.canExport,
    })));
    await prisma.rolePermission.createMany({ data: permData });
    console.log(`  RolePermissions: ${permData.length} seeded (${roles.length} roles × ${modules.length} modules)`);
  } else {
    console.log(`  RolePermissions: already seeded (${existingPerms})`);
  }

  // === Port Tariffs (additional) ===
  const existingTariffs2 = await prisma.portTariff.count();
  if (existingTariffs2 === 0) {
    const parPort = allPorts.find(p => p.unlocode === 'INPAR');
    const mndPort = allPorts.find(p => p.unlocode === 'INMND');
    const sgPort = allPorts.find(p => p.unlocode === 'SGSIN');
    if (parPort && mndPort && sgPort) {
      await prisma.portTariff.createMany({
        data: [
          { portId: parPort.id, chargeType: 'port_dues', amount: 0.85, unit: 'per_grt', currency: 'USD', notes: 'Standard GRT-based port dues' },
          { portId: parPort.id, chargeType: 'pilotage', amount: 1.20, unit: 'per_grt', currency: 'USD', vesselType: 'bulk_carrier' },
          { portId: parPort.id, chargeType: 'towage', amount: 3500, unit: 'lumpsum', currency: 'USD', notes: 'Per tug per operation' },
          { portId: parPort.id, chargeType: 'berth_hire', amount: 2200, unit: 'per_day', currency: 'USD' },
          { portId: mndPort.id, chargeType: 'port_dues', amount: 0.92, unit: 'per_grt', currency: 'USD' },
          { portId: mndPort.id, chargeType: 'pilotage', amount: 1.35, unit: 'per_grt', currency: 'USD' },
          { portId: mndPort.id, chargeType: 'towage', amount: 4200, unit: 'lumpsum', currency: 'USD' },
          { portId: mndPort.id, chargeType: 'berth_hire', amount: 2800, unit: 'per_day', currency: 'USD' },
          { portId: mndPort.id, chargeType: 'anchorage', amount: 800, unit: 'per_day', currency: 'USD' },
          { portId: sgPort.id, chargeType: 'port_dues', amount: 1.10, unit: 'per_grt', currency: 'USD', notes: 'MPA tariff schedule' },
          { portId: sgPort.id, chargeType: 'pilotage', amount: 1.50, unit: 'per_grt', currency: 'USD' },
          { portId: sgPort.id, chargeType: 'towage', amount: 5500, unit: 'lumpsum', currency: 'USD' },
        ],
      });
      console.log('  PortTariffs: 12 seeded');
    }
  } else {
    console.log(`  PortTariffs: already seeded (${existingTariffs2})`);
  }

  // === Preferred Vendors ===
  const existingPV = await prisma.preferredVendor.count();
  if (existingPV === 0 && allCompanies.length >= 3) {
    const agents = allCompanies.filter(c => c.type === 'agent');
    const stevedores = allCompanies.filter(c => c.type === 'stevedore');
    const pvData = [
      ...agents.slice(0, 2).map((a, i) => ({
        companyId: a.id, organizationId: org.id, serviceType: 'port_agent', priority: i + 1,
        notes: i === 0 ? 'Primary port agent - India West Coast' : 'Secondary agent - East Coast',
      })),
      ...stevedores.slice(0, 1).map(s => ({
        companyId: s.id, organizationId: org.id, serviceType: 'stevedore', priority: 1,
        notes: 'Preferred for bulk cargo operations',
      })),
    ];
    if (pvData.length > 0) {
      await prisma.preferredVendor.createMany({ data: pvData });
      console.log(`  PreferredVendors: ${pvData.length} seeded`);
    } else {
      console.log('  PreferredVendors: skipped (no matching company types)');
    }
  } else {
    console.log(`  PreferredVendors: already seeded (${existingPV})`);
  }

  // === Vendor Blacklist ===
  const existingBL = await prisma.vendorBlacklist.count();
  if (existingBL === 0 && allCompanies.length >= 5) {
    await prisma.vendorBlacklist.createMany({
      data: [
        {
          companyId: allCompanies[allCompanies.length - 1].id,
          organizationId: org.id,
          reason: 'overcharging',
          description: 'Consistently inflated port dues by 15-20% across multiple calls',
          severity: 'blocked',
          blacklistedBy: 'Operations Manager',
        },
        {
          companyId: allCompanies[allCompanies.length - 2].id,
          organizationId: org.id,
          reason: 'poor_performance',
          description: 'Delayed documentation causing vessel departure delays',
          severity: 'restricted',
          blacklistedBy: 'DA Desk Manager',
          reviewDate: new Date('2026-06-01'),
        },
      ],
    });
    console.log('  VendorBlacklist: 2 seeded');
  } else {
    console.log(`  VendorBlacklist: already seeded (${existingBL})`);
  }

  // === Claim Evidence ===
  const existingEvidence = await prisma.claimEvidence.count();
  if (existingEvidence === 0) {
    const claims = await prisma.claim.findMany({ take: 3, orderBy: { claimNumber: 'asc' } });
    if (claims.length >= 2) {
      await prisma.claimEvidence.createMany({
        data: [
          { claimId: claims[0].id, documentType: 'sof', description: 'Statement of Facts - Paradip loading', uploadedBy: 'Port Agent', verified: true, verifiedBy: 'Operations Manager', verifiedAt: new Date('2026-01-20') },
          { claimId: claims[0].id, documentType: 'nor', description: 'Notice of Readiness - tendered 0600 LT', uploadedBy: 'Master', verified: true, verifiedBy: 'Operations Manager', verifiedAt: new Date('2026-01-20') },
          { claimId: claims[0].id, documentType: 'weather_report', description: 'Weather log showing rain stoppage periods', uploadedBy: 'Chief Officer' },
          { claimId: claims[1].id, documentType: 'survey_report', description: 'Independent surveyor report on cargo weight discrepancy', uploadedBy: 'Surveyor', verified: true, verifiedBy: 'Claims Manager', verifiedAt: new Date('2026-01-22') },
          { claimId: claims[1].id, documentType: 'b_l', description: 'Bill of Lading showing shipped quantity', uploadedBy: 'Documentation Clerk' },
          { claimId: claims.length > 2 ? claims[2].id : claims[1].id, documentType: 'photo', description: 'Cargo damage photos from Hatch 3', uploadedBy: 'Chief Officer', notes: '12 photos taken during discharge' },
        ],
      });
      console.log('  ClaimEvidence: 6 seeded');
    }
  } else {
    console.log(`  ClaimEvidence: already seeded (${existingEvidence})`);
  }

  // === Port Restrictions ===
  const existingRestrictions = await prisma.portRestriction.count();
  if (existingRestrictions === 0) {
    const parPort = allPorts.find(p => p.unlocode === 'INPAR');
    const mndPort = allPorts.find(p => p.unlocode === 'INMND');
    const sgPort = allPorts.find(p => p.unlocode === 'SGSIN');
    if (parPort && mndPort && sgPort) {
      await prisma.portRestriction.createMany({
        data: [
          { portId: parPort.id, maxDraft: 14.5, maxLOA: 270, maxBeam: 45, maxDWT: 100000, channelDepth: 16.0, tidalRange: 3.2, cargoHandling: 'grab,conveyor', maxCargoRate: 25000, terminalType: 'bulk', nightNavigation: true, pilotMandatory: true },
          { portId: mndPort.id, maxDraft: 17.0, maxLOA: 300, maxBeam: 50, maxDWT: 180000, channelDepth: 18.5, tidalRange: 2.8, cargoHandling: 'grab,conveyor,STS', maxCargoRate: 40000, terminalType: 'bulk', nightNavigation: true, pilotMandatory: true },
          { portId: sgPort.id, maxDraft: 20.0, maxLOA: 400, maxBeam: 60, maxDWT: 300000, channelDepth: 22.0, tidalRange: 2.5, cargoHandling: 'all', maxCargoRate: 80000, terminalType: 'multipurpose', nightNavigation: true, pilotMandatory: true },
        ],
      });
      console.log('  PortRestrictions: 3 seeded');
    }
  } else {
    console.log(`  PortRestrictions: already seeded (${existingRestrictions})`);
  }

  // === Document Templates ===
  const existingTemplates = await prisma.documentTemplate.count();
  if (existingTemplates === 0) {
    await prisma.documentTemplate.createMany({
      data: [
        { name: 'Voyage Charter Party (GENCON)', category: 'charter_party', subCategory: 'gencon', description: 'Standard GENCON 94 form for voyage charters', content: 'GENCON CHARTER PARTY\n\nDate: {{date}}\nOwners: {{ownerName}}\nCharterers: {{chartererName}}\nVessel: {{vesselName}} (IMO: {{vesselImo}})\nCargo: {{cargoDescription}}, {{cargoQuantity}} MT\nLoad Port: {{loadPort}}\nDischarge Port: {{dischargePort}}\nLaycan: {{laycanStart}} to {{laycanEnd}}\nFreight: USD {{freightRate}} per MT\nDemurrage: USD {{demurrageRate}} per day\n\nClauses as per GENCON 94 with following amendments...', placeholders: '["date","ownerName","chartererName","vesselName","vesselImo","cargoDescription","cargoQuantity","loadPort","dischargePort","laycanStart","laycanEnd","freightRate","demurrageRate"]', isDefault: true },
        { name: 'Notice of Readiness (NOR)', category: 'nor', description: 'Standard NOR template for port arrival', content: 'NOTICE OF READINESS\n\nDate: {{date}}\nTime: {{time}}\nTo: {{agentName}}\nVessel: {{vesselName}}\nPort: {{portName}}\nBerth/Anchorage: {{berthLocation}}\n\nThis is to notify you that the above vessel has arrived at {{portName}} and is in all respects ready to {{purpose}} cargo in accordance with the terms of the Charter Party.\n\nMaster: {{masterName}}\nSignature: _____________', placeholders: '["date","time","agentName","vesselName","portName","berthLocation","purpose","masterName"]' },
        { name: 'Statement of Facts (SOF)', category: 'sof', description: 'Standard SOF template', content: 'STATEMENT OF FACTS\n\nVessel: {{vesselName}}\nPort: {{portName}}\nCargo: {{cargoDescription}}\n\nArrival at Anchorage: {{arrivalAnchorage}}\nNOR Tendered: {{norTendered}}\nBerthing: {{berthingTime}}\nCommenced Loading/Discharging: {{commenced}}\nCompleted: {{completed}}\nSailed: {{sailed}}\n\nTotal Laytime Used: {{laytimeUsed}} hours\nDemurrage/Despatch: {{demurrageDespatch}}', placeholders: '["vesselName","portName","cargoDescription","arrivalAnchorage","norTendered","berthingTime","commenced","completed","sailed","laytimeUsed","demurrageDespatch"]' },
        { name: 'Proforma Disbursement Account (PDA)', category: 'pda', description: 'Standard PDA template', content: 'PROFORMA DISBURSEMENT ACCOUNT\n\nVessel: {{vesselName}}\nPort: {{portName}}\nETA: {{eta}}\nPurpose: {{purpose}}\n\nPort Dues: {{portDues}}\nPilotage: {{pilotage}}\nTowage: {{towage}}\nBerth Hire: {{berthHire}}\nAgency Fee: {{agencyFee}}\nCargo Handling: {{cargoHandling}}\nSundries: {{sundries}}\n\nTOTAL: {{total}} {{currency}}', placeholders: '["vesselName","portName","eta","purpose","portDues","pilotage","towage","berthHire","agencyFee","cargoHandling","sundries","total","currency"]' },
        { name: 'Fixture Recap', category: 'fixture_recap', description: 'Standard fixture recap template', content: 'FIXTURE RECAP\n\nDate: {{fixtureDate}}\n\nVessel: {{vesselName}} ({{vesselDwt}} DWT)\nOwners: {{ownerName}}\nCharterers: {{chartererName}}\nBroker: {{brokerName}}\n\nCargo: {{cargoDescription}}, {{cargoQuantity}} MT\nLoad Port: {{loadPort}}\nDischarge Port: {{dischargePort}}\nLaycan: {{laycanStart}} / {{laycanEnd}}\nFreight: {{freightRate}} {{freightUnit}}\nDemurrage: {{demurrageRate}} PDPR\nCommission: {{commission}}%\n\nSubject: Clean fixed.', placeholders: '["fixtureDate","vesselName","vesselDwt","ownerName","chartererName","brokerName","cargoDescription","cargoQuantity","loadPort","dischargePort","laycanStart","laycanEnd","freightRate","freightUnit","demurrageRate","commission"]' },
        { name: 'Claim Letter - Demurrage', category: 'claim_letter', description: 'Standard demurrage claim letter', content: 'DEMURRAGE CLAIM\n\nDate: {{date}}\nTo: {{chartererName}}\nRef: Voyage {{voyageNumber}}, {{vesselName}}\n\nDear Sirs,\n\nWe hereby submit our demurrage claim in respect of the above voyage.\n\nAllowed Laytime: {{allowedLaytime}} hours\nLaytime Used: {{laytimeUsed}} hours\nExcess: {{excessHours}} hours\n\nDemurrage Rate: USD {{demurrageRate}} per day\nDemurrage Amount: USD {{demurrageAmount}}\n\nSupporting documents attached.\n\nYours faithfully,\n{{ownerName}}', placeholders: '["date","chartererName","voyageNumber","vesselName","allowedLaytime","laytimeUsed","excessHours","demurrageRate","demurrageAmount","ownerName"]' },
      ],
    });
    console.log('  DocumentTemplates: 6 seeded');
  } else {
    console.log(`  DocumentTemplates: already seeded (${existingTemplates})`);
  }

  // === Bunker RFQs & Quotes ===
  const existingRfqs = await prisma.bunkerRFQ.count();
  if (existingRfqs === 0 && allVessels.length >= 2 && allPorts.length >= 2) {
    const rfq1 = await prisma.bunkerRFQ.create({
      data: { vesselId: allVessels[0].id, portId: allPorts[0].id, fuelType: 'vlsfo', quantity: 850, status: 'quotes_received', notes: 'Urgent - vessel arriving in 3 days' },
    });
    await prisma.bunkerQuote.createMany({
      data: [
        { rfqId: rfq1.id, supplierName: 'Cockett Marine', pricePerMt: 565, deliveryMethod: 'barge', status: 'pending' },
        { rfqId: rfq1.id, supplierName: 'Peninsula Petroleum', pricePerMt: 572, deliveryMethod: 'barge', status: 'pending' },
        { rfqId: rfq1.id, supplierName: 'Minerva Bunkering', pricePerMt: 558, deliveryMethod: 'barge', status: 'pending' },
      ],
    });
    const rfq2 = await prisma.bunkerRFQ.create({
      data: { vesselId: allVessels[1].id, portId: allPorts[1].id, fuelType: 'mgo', quantity: 120, status: 'awarded' },
    });
    await prisma.bunkerQuote.createMany({
      data: [
        { rfqId: rfq2.id, supplierName: 'Gulf Agency Company', pricePerMt: 890, deliveryMethod: 'truck', status: 'accepted' },
        { rfqId: rfq2.id, supplierName: 'Chemoil Energy', pricePerMt: 920, deliveryMethod: 'barge', status: 'rejected' },
      ],
    });
    console.log('  BunkerRFQs: 2 seeded, BunkerQuotes: 5 seeded');
  } else {
    console.log(`  BunkerRFQs: already seeded (${existingRfqs})`);
  }

  // === Fuel Quality Records ===
  const existingFQ = await prisma.fuelQualityRecord.count();
  if (existingFQ === 0) {
    await prisma.fuelQualityRecord.createMany({
      data: [
        { fuelType: 'vlsfo', quantity: 850, supplierName: 'Minerva Bunkering', density: 985, viscosity: 48.5, sulphur: 0.42, water: 0.08, flashPoint: 68, isoCompliant: true },
        { fuelType: 'mgo', quantity: 120, supplierName: 'Gulf Agency Company', density: 855, viscosity: 3.2, sulphur: 0.08, water: 0.02, flashPoint: 72, isoCompliant: true },
        { fuelType: 'vlsfo', quantity: 1200, supplierName: 'Cockett Marine', density: 992, viscosity: 52.0, sulphur: 0.48, water: 0.12, flashPoint: 64, isoCompliant: true, issueFound: true, issueDescription: 'High cat fines (Al+Si > 60 mg/kg)', sampleSent: true, labReportRef: 'LAB-2026-0142' },
        { fuelType: 'ifo380', quantity: 650, supplierName: 'Peninsula Petroleum', density: 980, viscosity: 320, sulphur: 2.8, water: 0.15, flashPoint: 66, isoCompliant: true },
      ],
    });
    console.log('  FuelQualityRecords: 4 seeded');
  } else {
    console.log(`  FuelQualityRecords: already seeded (${existingFQ})`);
  }

  // === Vessel Emissions ===
  const existingEmissions = await prisma.vesselEmission.count();
  if (existingEmissions === 0 && allVessels.length >= 3) {
    await prisma.vesselEmission.createMany({
      data: [
        { vesselId: allVessels[0].id, year: 2025, distanceNm: 42000, fuelConsumedMt: 4800, co2EmissionsMt: 14947, attainedCII: 5.12, requiredCII: 5.43, ciiRating: 'C', euEtsApplicable: true, euEtsCo2Mt: 2200, euEtsAllowancesNeeded: 2200, euEtsCostEur: 176000, fuelEuGhgIntensity: 85.2, fuelEuTarget: 89.34, fuelEuCompliant: true },
        { vesselId: allVessels[1].id, year: 2025, distanceNm: 38000, fuelConsumedMt: 5200, co2EmissionsMt: 16189, attainedCII: 5.61, requiredCII: 4.98, ciiRating: 'D', euEtsApplicable: true, euEtsCo2Mt: 3100, euEtsAllowancesNeeded: 3100, euEtsCostEur: 248000, fuelEuGhgIntensity: 92.1, fuelEuTarget: 89.34, fuelEuCompliant: false, fuelEuPenalty: 12500, notes: 'Corrective action plan required' },
        { vesselId: allVessels[2].id, year: 2025, distanceNm: 48000, fuelConsumedMt: 4200, co2EmissionsMt: 13079, attainedCII: 3.94, requiredCII: 5.43, ciiRating: 'A', euEtsApplicable: false, fuelEuGhgIntensity: 78.5, fuelEuTarget: 89.34, fuelEuCompliant: true },
        { vesselId: allVessels[0].id, year: 2026, distanceNm: 8500, fuelConsumedMt: 980, co2EmissionsMt: 3052, attainedCII: 5.24, requiredCII: 5.28, ciiRating: 'C', euEtsApplicable: true, euEtsCo2Mt: 800, euEtsAllowancesNeeded: 800, euEtsCostEur: 64000, fuelEuGhgIntensity: 84.8, fuelEuTarget: 89.34, fuelEuCompliant: true, notes: 'Q1 2026 - on track' },
      ],
    });
    console.log('  VesselEmissions: 4 seeded');
  } else {
    console.log(`  VesselEmissions: already seeded (${existingEmissions})`);
  }

  // ── Batch 7: Geofences ──────────────────────────────
  const existingGeofences = await prisma.geofence.count();
  if (existingGeofences === 0) {
    const allPorts = await prisma.port.findMany({ take: 5, orderBy: { createdAt: 'asc' } });
    await prisma.geofence.createMany({
      data: [
        { organizationId: org.id, name: 'Singapore Strait Entry', centerLat: 1.2667, centerLon: 103.8, radiusNm: 10, fenceType: 'circle', vesselIds: allVessels.map(v => v.id), alertOnEntry: true, alertOnExit: true },
        { organizationId: org.id, name: 'Mundra Anchorage', centerLat: 22.7396, centerLon: 69.6793, radiusNm: 5, fenceType: 'port_area', vesselIds: [allVessels[0].id], alertOnEntry: true, alertOnExit: false, alertOnDwell: true, dwellThresholdHrs: 48 },
        { organizationId: org.id, name: 'Suez Canal Zone', centerLat: 30.4574, centerLon: 32.3499, radiusNm: 15, fenceType: 'circle', vesselIds: allVessels.map(v => v.id), alertOnEntry: true, alertOnExit: true },
      ],
    });
    console.log('  Geofences: 3 seeded');

    const fences = await prisma.geofence.findMany({ take: 3, orderBy: { createdAt: 'asc' } });
    await prisma.geofenceAlert.createMany({
      data: [
        { geofenceId: fences[0].id, vesselId: allVessels[0].id, eventType: 'entry', latitude: 1.27, longitude: 103.81, speed: 12.5, heading: 45, acknowledged: false },
        { geofenceId: fences[1].id, vesselId: allVessels[0].id, eventType: 'entry', latitude: 22.74, longitude: 69.68, speed: 0.5, heading: 180, acknowledged: true, acknowledgedBy: 'Capt. Sharma', acknowledgedAt: new Date() },
        { geofenceId: fences[0].id, vesselId: allVessels[1].id, eventType: 'exit', latitude: 1.25, longitude: 103.78, speed: 14.2, heading: 270, acknowledged: false },
        { geofenceId: fences[2].id, vesselId: allVessels[0].id, eventType: 'entry', latitude: 30.46, longitude: 32.35, speed: 8.0, heading: 0, acknowledged: false },
      ],
    });
    console.log('  GeofenceAlerts: 4 seeded');
  } else {
    console.log(`  Geofences: already seeded (${existingGeofences})`);
  }

  // ── Batch 7: Approval Routes ──────────────────────────
  const existingApprovalRoutes = await prisma.approvalRoute.count();
  if (existingApprovalRoutes === 0) {
    const route1 = await prisma.approvalRoute.create({
      data: {
        organizationId: org.id,
        name: 'Charter Approval',
        entityType: 'charter',
        autoApprove: false,
        active: true,
        steps: {
          create: [
            { stepOrder: 1, approverRole: 'chartering_head', action: 'pending' },
            { stepOrder: 2, approverRole: 'commercial_head', action: 'pending' },
            { stepOrder: 3, approverRole: 'cfo', action: 'pending' },
          ],
        },
      },
    });

    const route2 = await prisma.approvalRoute.create({
      data: {
        organizationId: org.id,
        name: 'DA Payment Approval',
        entityType: 'da',
        autoApprove: true,
        autoApproveBelow: 5000,
        active: true,
        steps: {
          create: [
            { stepOrder: 1, approverRole: 'operations_manager', action: 'pending' },
            { stepOrder: 2, approverRole: 'finance_manager', action: 'pending' },
          ],
        },
      },
    });

    const route3 = await prisma.approvalRoute.create({
      data: {
        organizationId: org.id,
        name: 'Claim Settlement',
        entityType: 'claim',
        autoApprove: false,
        active: true,
        steps: {
          create: [
            { stepOrder: 1, approverRole: 'legal_head', action: 'pending' },
            { stepOrder: 2, approverRole: 'ceo', action: 'pending' },
          ],
        },
      },
    });

    await prisma.approvalRoute.create({
      data: {
        organizationId: org.id,
        name: 'Bunker RFQ Award',
        entityType: 'bunker_rfq',
        autoApprove: true,
        autoApproveBelow: 25000,
        active: true,
        steps: {
          create: [
            { stepOrder: 1, approverRole: 'operations_manager', action: 'pending' },
          ],
        },
      },
    });

    console.log('  ApprovalRoutes: 4 seeded (with steps)');
  } else {
    console.log(`  ApprovalRoutes: already seeded (${existingApprovalRoutes})`);
  }

  // ── Batch 7: Expiry Alerts ─────────────────────────────
  const existingExpiryAlerts = await prisma.expiryAlert.count();
  if (existingExpiryAlerts === 0) {
    const now = new Date();
    const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400000);
    await prisma.expiryAlert.createMany({
      data: [
        { organizationId: org.id, entityType: 'vessel_certificate', entityId: allVessels[0].id, entityName: 'Safety Construction Certificate - MV Ankr Pioneer', vesselId: allVessels[0].id, expiryDate: daysFromNow(15), alertDaysBefore: [90, 60, 30, 14, 7], status: 'active' },
        { organizationId: org.id, entityType: 'vessel_certificate', entityId: allVessels[1].id, entityName: 'ISM DOC - MV Ankr Voyager', vesselId: allVessels[1].id, expiryDate: daysFromNow(75), alertDaysBefore: [90, 60, 30, 14, 7], status: 'active' },
        { organizationId: org.id, entityType: 'class_survey', entityId: allVessels[0].id, entityName: 'Annual Survey - MV Ankr Pioneer', vesselId: allVessels[0].id, expiryDate: daysFromNow(120), alertDaysBefore: [90, 60, 30, 14, 7], status: 'active' },
        { organizationId: org.id, entityType: 'insurance', entityId: allVessels[2].id, entityName: 'P&I Cover - MV Ankr Titan', vesselId: allVessels[2].id, expiryDate: daysFromNow(-5), alertDaysBefore: [90, 60, 30, 14, 7], status: 'active', notes: 'Renewal in progress' },
        { organizationId: org.id, entityType: 'crew_certificate', entityId: 'crew-001', entityName: 'STCW Certificate - Chief Officer', expiryDate: daysFromNow(45), alertDaysBefore: [90, 60, 30, 14, 7], status: 'active' },
        { organizationId: org.id, entityType: 'p_and_i', entityId: allVessels[0].id, entityName: 'P&I Club Entry - MV Ankr Pioneer', vesselId: allVessels[0].id, expiryDate: daysFromNow(200), alertDaysBefore: [90, 60, 30, 14, 7], status: 'active' },
        { organizationId: org.id, entityType: 'vessel_certificate', entityId: allVessels[1].id, entityName: 'IOPP Certificate - MV Ankr Voyager', vesselId: allVessels[1].id, expiryDate: daysFromNow(-20), alertDaysBefore: [90, 60, 30, 14, 7], status: 'expired' },
        { organizationId: org.id, entityType: 'insurance', entityId: allVessels[0].id, entityName: 'H&M Insurance - MV Ankr Pioneer', vesselId: allVessels[0].id, expiryDate: daysFromNow(300), alertDaysBefore: [90, 60, 30, 14, 7], status: 'renewed', renewedDate: new Date(), renewedBy: 'Admin User' },
      ],
    });
    console.log('  ExpiryAlerts: 8 seeded');
  } else {
    console.log(`  ExpiryAlerts: already seeded (${existingExpiryAlerts})`);
  }

  // ── Batch 7: Mention Notifications ─────────────────────
  const existingMentions = await prisma.mentionNotification.count();
  if (existingMentions === 0) {
    const allUsers = await prisma.user.findMany({ take: 3, orderBy: { createdAt: 'asc' } });
    if (allUsers.length >= 2) {
      await prisma.mentionNotification.createMany({
        data: [
          { organizationId: org.id, mentionedUserId: allUsers[0].id, mentionedBy: allUsers[1].name, entityType: 'voyage', entityId: 'voy-001', context: '@admin please review the voyage estimate before we proceed', fieldName: 'notes', read: false },
          { organizationId: org.id, mentionedUserId: allUsers[0].id, mentionedBy: allUsers[1].name, entityType: 'charter', entityId: 'chr-001', context: '@admin charter party needs your sign-off by EOD', fieldName: 'comments', read: false },
          { organizationId: org.id, mentionedUserId: allUsers[1].id, mentionedBy: allUsers[0].name, entityType: 'claim', entityId: 'clm-001', context: '@operator please upload the survey report for this cargo claim', fieldName: 'notes', read: true, readAt: new Date() },
          { organizationId: org.id, mentionedUserId: allUsers[0].id, mentionedBy: 'System', entityType: 'da', entityId: 'da-001', context: '@admin DA for Mundra port call exceeds estimate by 15%', fieldName: 'system_alert', read: false },
          { organizationId: org.id, mentionedUserId: allUsers[1].id, mentionedBy: allUsers[0].name, entityType: 'bunker', entityId: 'bnk-001', context: '@operator bunker quotes received, please compare and recommend', fieldName: 'notes', read: false },
        ],
      });
      console.log('  MentionNotifications: 5 seeded');
    }
  } else {
    console.log(`  MentionNotifications: already seeded (${existingMentions})`);
  }

  // ── Batch 8: Charter Party Versions ─────────────────────
  const existingCpVersions = await prisma.charterPartyVersion.count();
  if (existingCpVersions === 0) {
    const cps = await prisma.charterParty.findMany({ take: 2, orderBy: { createdAt: 'asc' } });
    if (cps.length > 0) {
      await prisma.charterPartyVersion.createMany({
        data: [
          { charterPartyId: cps[0].id, versionNumber: 1, content: 'GENCON Charter Party v1 — Original terms as agreed between owners and charterers. Clause 1: Shipbroker commission 2.5%. Clause 2: Laycan 15-20 Feb 2026. Clause 3: Freight rate USD 12.50/MT.', changedBy: 'Admin User', changeReason: 'Initial draft', clausesChanged: ['1', '2', '3'], status: 'superseded' },
          { charterPartyId: cps[0].id, versionNumber: 2, content: 'GENCON Charter Party v2 — Revised terms. Clause 1: Shipbroker commission 2.5%. Clause 2: Laycan 18-22 Feb 2026 (extended). Clause 3: Freight rate USD 13.00/MT (revised up). Clause 4: Demurrage USD 15,000/day.', changedBy: 'Admin User', changeReason: 'Laycan extension and rate revision', clausesChanged: ['2', '3', '4'], diffFromPrevious: { added: ['4'], removed: [], modified: ['2', '3'] }, status: 'approved' },
          { charterPartyId: cps[0].id, versionNumber: 3, content: 'GENCON Charter Party v3 — Final. Clause 1: Commission 2.5%. Clause 2: Laycan 18-22 Feb 2026. Clause 3: Freight USD 13.00/MT. Clause 4: Demurrage USD 15,000/day. Clause 5: War risk clause added per BIMCO 2024.', changedBy: 'Chartering Head', changeReason: 'Added war risk rider', clausesChanged: ['5'], diffFromPrevious: { added: ['5'], removed: [], modified: [] }, status: 'draft' },
        ],
      });
      console.log('  CharterPartyVersions: 3 seeded');
    }
  } else {
    console.log(`  CharterPartyVersions: already seeded (${existingCpVersions})`);
  }

  // ── Batch 8: Port Agents ──────────────────────────────────
  const existingPortAgents = await prisma.portAgent.count();
  if (existingPortAgents === 0) {
    await prisma.portAgent.createMany({
      data: [
        { companyName: 'Inchcape Shipping Services', contactPerson: 'Rajesh Kumar', email: 'rajesh.k@inchcape.com', phone: '+91-22-67891234', country: 'IN', city: 'Mumbai', portIds: ['mundra', 'nhava-sheva', 'mumbai'], serviceTypes: ['husbandry', 'protective', 'customs'], rating: 4.5, totalJobs: 312, avgResponseHrs: 2.1, isVerified: true, verifiedDate: new Date(), licenseNumber: 'MUMB-AGT-2024-001', insuranceCover: 5000000, active: true },
        { companyName: 'GAC India Pvt Ltd', contactPerson: 'Priya Sharma', email: 'priya.s@gac.com', phone: '+91-22-67891235', country: 'IN', city: 'Mumbai', portIds: ['mundra', 'nhava-sheva', 'kandla'], serviceTypes: ['husbandry', 'liner', 'forwarding'], rating: 4.2, totalJobs: 245, avgResponseHrs: 3.5, isVerified: true, verifiedDate: new Date(), licenseNumber: 'MUMB-AGT-2024-002', active: true },
        { companyName: 'Wilhelmsen Ships Service', contactPerson: 'Chen Wei', email: 'chen.w@wilhelmsen.com', phone: '+65-6789-1234', country: 'SG', city: 'Singapore', portIds: ['singapore'], serviceTypes: ['husbandry', 'protective'], rating: 4.8, totalJobs: 520, avgResponseHrs: 1.5, isVerified: true, verifiedDate: new Date(), licenseNumber: 'SG-AGT-2024-001', insuranceCover: 10000000, active: true },
        { companyName: 'Sharaf Shipping Agency', contactPerson: 'Ahmed Al-Rashid', email: 'ahmed@sharaf.ae', phone: '+971-4-5678901', country: 'AE', city: 'Dubai', portIds: ['jebel-ali', 'fujairah'], serviceTypes: ['husbandry', 'customs', 'forwarding'], rating: 4.0, totalJobs: 180, avgResponseHrs: 4.2, isVerified: true, verifiedDate: new Date(), active: true },
        { companyName: 'Consolidated Marine Services', contactPerson: 'George Papadopoulos', email: 'george@cms-piraeus.gr', phone: '+30-210-5678901', country: 'GR', city: 'Piraeus', portIds: ['piraeus', 'thessaloniki'], serviceTypes: ['husbandry', 'protective', 'liner'], rating: 3.8, totalJobs: 150, avgResponseHrs: 5.0, isVerified: false, active: true },
        { companyName: 'P&O Maritime Logistics', contactPerson: 'James Wilson', email: 'j.wilson@po-maritime.com', phone: '+44-20-7891234', country: 'GB', city: 'London', portIds: ['felixstowe', 'southampton', 'tilbury'], serviceTypes: ['husbandry', 'liner', 'customs', 'forwarding'], rating: 4.6, totalJobs: 380, avgResponseHrs: 2.8, isVerified: true, verifiedDate: new Date(), licenseNumber: 'UK-AGT-2024-001', insuranceCover: 8000000, active: true },
        { companyName: 'Nippon Yusen Agency', contactPerson: 'Tanaka Hiroshi', email: 'tanaka@nyk-agency.jp', phone: '+81-3-5678901', country: 'JP', city: 'Tokyo', portIds: ['tokyo', 'yokohama', 'kobe'], serviceTypes: ['husbandry', 'liner'], rating: 4.7, totalJobs: 410, avgResponseHrs: 1.8, isVerified: true, verifiedDate: new Date(), active: true },
        { companyName: 'Mediterranean Shipping Agency', contactPerson: 'Marco Rossi', email: 'marco@msa-genova.it', phone: '+39-010-5678901', country: 'IT', city: 'Genova', portIds: ['genova', 'la-spezia', 'livorno'], serviceTypes: ['husbandry', 'customs', 'forwarding'], rating: 3.9, totalJobs: 165, avgResponseHrs: 4.8, isVerified: false, active: true },
      ],
    });
    console.log('  PortAgents: 8 seeded');
  } else {
    console.log(`  PortAgents: already seeded (${existingPortAgents})`);
  }

  // ── Batch 8: Agent Appointments ───────────────────────────
  const existingAppointments = await prisma.agentAppointment.count();
  if (existingAppointments === 0) {
    const agents = await prisma.portAgent.findMany({ take: 4, orderBy: { createdAt: 'asc' } });
    if (agents.length > 0) {
      await prisma.agentAppointment.createMany({
        data: [
          { organizationId: org.id, agentId: agents[0].id, portName: 'Mundra', serviceType: 'husbandry', status: 'completed', startDate: new Date('2026-01-10'), endDate: new Date('2026-01-15'), estimatedCost: 4500, actualCost: 4200, currency: 'USD', performanceRating: 4.5, performanceNotes: 'Excellent coordination, all docs on time' },
          { organizationId: org.id, agentId: agents[2].id, portName: 'Singapore', serviceType: 'protective', status: 'active', startDate: new Date('2026-01-28'), estimatedCost: 3200, currency: 'USD', instructions: 'Monitor cargo discharge, check draft surveys' },
          { organizationId: org.id, agentId: agents[1].id, portName: 'Kandla', serviceType: 'customs', status: 'pending', estimatedCost: 2800, currency: 'USD' },
          { organizationId: org.id, agentId: agents[3].id, portName: 'Jebel Ali', serviceType: 'husbandry', status: 'confirmed', startDate: new Date('2026-02-05'), estimatedCost: 5100, currency: 'USD', instructions: 'Arrange crew change for 3 personnel' },
        ],
      });
      console.log('  AgentAppointments: 4 seeded');
    }
  } else {
    console.log(`  AgentAppointments: already seeded (${existingAppointments})`);
  }

  // ── Batch 8: Bunker Quantity Disputes ─────────────────────
  const existingBunkerDisputes = await prisma.bunkerQuantityDispute.count();
  if (existingBunkerDisputes === 0) {
    await prisma.bunkerQuantityDispute.createMany({
      data: [
        { organizationId: org.id, vesselId: allVessels[0].id, portName: 'Singapore', fuelType: 'VLSFO', deliveredQtyMt: 500, claimedQtyMt: 487, discrepancyMt: 13, discrepancyPct: 2.6, unitPrice: 580, disputeValueUsd: 7540, supplierName: 'Peninsula Petroleum', status: 'open', notes: 'Vessel draft survey shows 13 MT shortfall' },
        { organizationId: org.id, vesselId: allVessels[1].id, portName: 'Fujairah', fuelType: 'HFO', deliveredQtyMt: 1200, claimedQtyMt: 1178, discrepancyMt: 22, discrepancyPct: 1.83, unitPrice: 420, disputeValueUsd: 9240, supplierName: 'Monjasa', status: 'investigation', surveyorReport: 'SURV-2026-0234', notes: 'Independent surveyor appointed' },
        { organizationId: org.id, vesselId: allVessels[2].id, portName: 'Mundra', fuelType: 'MGO', deliveredQtyMt: 150, claimedQtyMt: 148.5, discrepancyMt: 1.5, discrepancyPct: 1.0, unitPrice: 850, disputeValueUsd: 1275, supplierName: 'IOCL', status: 'settled', resolution: 'partial_credit', creditAmount: 900 },
      ],
    });
    console.log('  BunkerQuantityDisputes: 3 seeded');
  } else {
    console.log(`  BunkerQuantityDisputes: already seeded (${existingBunkerDisputes})`);
  }

  // ── Batch 8: Claim Packages ───────────────────────────────
  const existingClaimPackages = await prisma.claimPackage.count();
  if (existingClaimPackages === 0) {
    const claims = await prisma.claim.findMany({ take: 3, orderBy: { createdAt: 'asc' } });
    if (claims.length > 0) {
      await prisma.claimPackage.createMany({
        data: [
          { claimId: claims[0].id, packageType: 'demurrage', status: 'complete', hasNoticeOfClaim: true, hasStatementOfFacts: true, hasNorDocument: true, hasLaytimeCalc: true, hasSurveyReport: false, hasWeatherLog: true, hasPhotos: false, hasBolCopy: true, hasCharterPartyCopy: true, hasCorrespondence: true, totalDocsRequired: 7, totalDocsPresent: 7, completenessScore: 100 },
          { claimId: claims.length > 1 ? claims[1].id : claims[0].id, packageType: 'cargo_damage', status: 'assembling', hasNoticeOfClaim: true, hasStatementOfFacts: false, hasNorDocument: false, hasSurveyReport: true, hasPhotos: true, hasBolCopy: true, hasCharterPartyCopy: false, hasCorrespondence: false, totalDocsRequired: 8, totalDocsPresent: 4, completenessScore: 50 },
        ],
      });
      console.log('  ClaimPackages: 2 seeded');
    }
  } else {
    console.log(`  ClaimPackages: already seeded (${existingClaimPackages})`);
  }

  // ── Batch 9: Port Cost Benchmarks ───────────────────────
  const existingBenchmarks = await prisma.portCostBenchmark.count();
  if (existingBenchmarks === 0) {
    const now = new Date();
    const q4Start = new Date('2025-10-01');
    const q4End = new Date('2025-12-31');
    await prisma.portCostBenchmark.createMany({
      data: [
        { portId: 'mundra', portName: 'Mundra', vesselType: 'bulk_carrier', dwtRange: '30000-60000', costCategory: 'pilotage', avgCostUsd: 3200, minCostUsd: 2800, maxCostUsd: 3600, medianCostUsd: 3150, sampleSize: 45, periodStart: q4Start, periodEnd: q4End, trend: 'rising', trendPct: 5.2 },
        { portId: 'mundra', portName: 'Mundra', vesselType: 'bulk_carrier', dwtRange: '30000-60000', costCategory: 'towage', avgCostUsd: 4500, minCostUsd: 4000, maxCostUsd: 5200, medianCostUsd: 4400, sampleSize: 45, periodStart: q4Start, periodEnd: q4End, trend: 'stable', trendPct: 0.8 },
        { portId: 'mundra', portName: 'Mundra', vesselType: 'bulk_carrier', dwtRange: '30000-60000', costCategory: 'berth_dues', avgCostUsd: 8500, minCostUsd: 7200, maxCostUsd: 10500, medianCostUsd: 8300, sampleSize: 45, periodStart: q4Start, periodEnd: q4End, trend: 'rising', trendPct: 8.1 },
        { portId: 'singapore', portName: 'Singapore', vesselType: 'bulk_carrier', dwtRange: '30000-60000', costCategory: 'pilotage', avgCostUsd: 4800, minCostUsd: 4200, maxCostUsd: 5500, medianCostUsd: 4700, sampleSize: 120, periodStart: q4Start, periodEnd: q4End, trend: 'stable', trendPct: 1.2 },
        { portId: 'singapore', portName: 'Singapore', vesselType: 'bulk_carrier', dwtRange: '30000-60000', costCategory: 'towage', avgCostUsd: 6200, minCostUsd: 5500, maxCostUsd: 7000, medianCostUsd: 6100, sampleSize: 120, periodStart: q4Start, periodEnd: q4End, trend: 'falling', trendPct: -3.5 },
        { portId: 'singapore', portName: 'Singapore', vesselType: 'bulk_carrier', dwtRange: '30000-60000', costCategory: 'berth_dues', avgCostUsd: 12000, minCostUsd: 10500, maxCostUsd: 14200, medianCostUsd: 11800, sampleSize: 120, periodStart: q4Start, periodEnd: q4End, trend: 'rising', trendPct: 4.3 },
        { portId: 'jebel-ali', portName: 'Jebel Ali', vesselType: 'tanker', dwtRange: '60000-100000', costCategory: 'total', avgCostUsd: 42000, minCostUsd: 35000, maxCostUsd: 52000, medianCostUsd: 41500, sampleSize: 80, periodStart: q4Start, periodEnd: q4End, trend: 'rising', trendPct: 6.8 },
        { portId: 'piraeus', portName: 'Piraeus', vesselType: 'container', dwtRange: '30000-60000', costCategory: 'total', avgCostUsd: 28000, minCostUsd: 22000, maxCostUsd: 35000, medianCostUsd: 27500, sampleSize: 95, periodStart: q4Start, periodEnd: q4End, trend: 'stable', trendPct: 0.5 },
      ],
    });
    console.log('  PortCostBenchmarks: 8 seeded');
  } else {
    console.log(`  PortCostBenchmarks: already seeded (${existingBenchmarks})`);
  }

  // ── Batch 9: Vessel Certificates ──────────────────────────
  const existingCerts = await prisma.vesselCertificate.count();
  if (existingCerts === 0) {
    const daysFromNow2 = (d: number) => new Date(new Date().getTime() + d * 86400000);
    await prisma.vesselCertificate.createMany({
      data: [
        { vesselId: allVessels[0].id, certificateType: 'safety_construction', certificateNumber: 'SC-2024-001', issuedBy: 'DNV', issuedDate: new Date('2024-03-15'), expiryDate: daysFromNow2(180), lastSurveyDate: new Date('2024-03-15'), nextSurveyDue: daysFromNow2(90), status: 'valid' },
        { vesselId: allVessels[0].id, certificateType: 'iopp', certificateNumber: 'IOPP-2024-001', issuedBy: 'DNV', issuedDate: new Date('2024-06-01'), expiryDate: daysFromNow2(300), status: 'valid' },
        { vesselId: allVessels[0].id, certificateType: 'isps', certificateNumber: 'ISPS-2024-001', issuedBy: 'Indian Register of Shipping', issuedDate: new Date('2024-01-10'), expiryDate: daysFromNow2(45), status: 'valid', notes: 'Renewal due soon' },
        { vesselId: allVessels[0].id, certificateType: 'ism_doc', certificateNumber: 'ISM-DOC-2023-001', issuedBy: 'DNV', issuedDate: new Date('2023-12-01'), expiryDate: daysFromNow2(-10), status: 'expired' },
        { vesselId: allVessels[1].id, certificateType: 'safety_construction', certificateNumber: 'SC-2024-002', issuedBy: 'Lloyd\'s Register', issuedDate: new Date('2024-05-20'), expiryDate: daysFromNow2(400), status: 'valid' },
        { vesselId: allVessels[1].id, certificateType: 'class', certificateNumber: 'CL-2024-002', issuedBy: 'Lloyd\'s Register', issuedDate: new Date('2024-05-20'), expiryDate: daysFromNow2(200), lastSurveyDate: new Date('2024-05-20'), nextSurveyDue: daysFromNow2(60), status: 'valid' },
        { vesselId: allVessels[2].id, certificateType: 'loadline', certificateNumber: 'LL-2024-003', issuedBy: 'BV', issuedDate: new Date('2024-02-01'), expiryDate: daysFromNow2(120), status: 'valid' },
        { vesselId: allVessels[2].id, certificateType: 'ballast_water', certificateNumber: 'BW-2024-003', issuedBy: 'BV', issuedDate: new Date('2024-04-15'), expiryDate: daysFromNow2(25), status: 'valid', notes: 'Expiring soon - schedule renewal' },
      ],
    });
    console.log('  VesselCertificates: 8 seeded');
  } else {
    console.log(`  VesselCertificates: already seeded (${existingCerts})`);
  }

  // ── Batch 9: Insurance Policies ───────────────────────────
  const existingInsurance = await prisma.insurancePolicy.count();
  if (existingInsurance === 0) {
    const daysFromNow3 = (d: number) => new Date(new Date().getTime() + d * 86400000);
    await prisma.insurancePolicy.createMany({
      data: [
        { organizationId: org.id, vesselId: allVessels[0].id, policyType: 'hull_machinery', policyNumber: 'HM-2025-001', insurer: 'Gard P&I', broker: 'Marsh', insuredValue: 25000000, deductible: 150000, premiumAnnual: 375000, inceptionDate: new Date('2025-02-20'), expiryDate: daysFromNow3(200), status: 'active', coverageDetails: 'Full H&M cover including machinery damage, collision liability' },
        { organizationId: org.id, vesselId: allVessels[0].id, policyType: 'p_and_i', policyNumber: 'PI-2025-001', insurer: 'UK P&I Club', broker: 'Willis Towers Watson', insuredValue: 500000000, deductible: 10000, premiumAnnual: 180000, inceptionDate: new Date('2025-02-20'), expiryDate: daysFromNow3(200), status: 'active', coverageDetails: 'Full P&I cover including cargo liability, pollution, crew' },
        { organizationId: org.id, vesselId: allVessels[1].id, policyType: 'hull_machinery', policyNumber: 'HM-2025-002', insurer: 'Skuld', broker: 'AON', insuredValue: 18000000, deductible: 100000, premiumAnnual: 270000, inceptionDate: new Date('2025-04-01'), expiryDate: daysFromNow3(280), status: 'active' },
        { organizationId: org.id, vesselId: allVessels[1].id, policyType: 'war_risk', policyNumber: 'WR-2025-002', insurer: 'Hellenic War Risks', insuredValue: 18000000, premiumAnnual: 45000, inceptionDate: new Date('2025-04-01'), expiryDate: daysFromNow3(280), status: 'active' },
        { organizationId: org.id, vesselId: allVessels[2].id, policyType: 'hull_machinery', policyNumber: 'HM-2024-003', insurer: 'Norwegian Hull Club', broker: 'Marsh', insuredValue: 32000000, deductible: 200000, premiumAnnual: 480000, inceptionDate: new Date('2024-08-01'), expiryDate: daysFromNow3(-30), status: 'expired', notes: 'Renewal in progress' },
        { organizationId: org.id, policyType: 'cargo', policyNumber: 'CG-2025-001', insurer: 'TT Club', insuredValue: 10000000, premiumAnnual: 95000, inceptionDate: new Date('2025-01-01'), expiryDate: daysFromNow3(340), status: 'active', coverageDetails: 'Open cargo policy - all voyages' },
      ],
    });
    console.log('  InsurancePolicies: 6 seeded');
  } else {
    console.log(`  InsurancePolicies: already seeded (${existingInsurance})`);
  }

  // ── Batch 9: Weather Working Days ─────────────────────────
  const existingWeatherDays = await prisma.weatherWorkingDay.count();
  if (existingWeatherDays === 0) {
    const allVoyages = await prisma.voyage.findMany({ take: 2, orderBy: { createdAt: 'asc' } });
    if (allVoyages.length > 0) {
      await prisma.weatherWorkingDay.createMany({
        data: [
          { voyageId: allVoyages[0].id, portName: 'Mundra', date: new Date('2026-01-10'), weatherCondition: 'clear', isWorkingDay: true, isWeatherDay: false, hoursLost: 0, source: 'vessel_log' },
          { voyageId: allVoyages[0].id, portName: 'Mundra', date: new Date('2026-01-11'), weatherCondition: 'heavy_rain', windSpeedKnots: 18, isWorkingDay: true, isWeatherDay: true, hoursLost: 6, deductionReason: 'rain_stoppage', source: 'vessel_log' },
          { voyageId: allVoyages[0].id, portName: 'Mundra', date: new Date('2026-01-12'), weatherCondition: 'high_wind', windSpeedKnots: 32, waveHeightM: 2.5, isWorkingDay: false, isWeatherDay: true, hoursLost: 24, deductionReason: 'wind_exceeds_limit', source: 'vessel_log', notes: 'Crane operations suspended' },
          { voyageId: allVoyages[0].id, portName: 'Mundra', date: new Date('2026-01-13'), weatherCondition: 'rain', windSpeedKnots: 15, isWorkingDay: true, isWeatherDay: true, hoursLost: 4, deductionReason: 'rain_stoppage', source: 'manual' },
          { voyageId: allVoyages[0].id, portName: 'Mundra', date: new Date('2026-01-14'), weatherCondition: 'clear', isWorkingDay: true, isWeatherDay: false, hoursLost: 0, source: 'vessel_log' },
        ],
      });
      console.log('  WeatherWorkingDays: 5 seeded');
    }
  } else {
    console.log(`  WeatherWorkingDays: already seeded (${existingWeatherDays})`);
  }

  // ── Batch 10: Freight Indices ────────────────────────────
  const existingIndices = await prisma.freightIndex.count();
  if (existingIndices === 0) {
    const baseDate = new Date('2026-01-20');
    const day = (d: number) => new Date(baseDate.getTime() + d * 86400000);
    await prisma.freightIndex.createMany({
      data: [
        { indexName: 'BDI', date: day(0), value: 1245, change: 32, changePct: 2.6, source: 'baltic_exchange' },
        { indexName: 'BDI', date: day(1), value: 1278, change: 33, changePct: 2.65, source: 'baltic_exchange' },
        { indexName: 'BDI', date: day(2), value: 1305, change: 27, changePct: 2.11, source: 'baltic_exchange' },
        { indexName: 'BDI', date: day(3), value: 1290, change: -15, changePct: -1.15, source: 'baltic_exchange' },
        { indexName: 'BDI', date: day(4), value: 1312, change: 22, changePct: 1.71, source: 'baltic_exchange' },
        { indexName: 'BCI', date: day(0), value: 1890, change: 45, changePct: 2.44 },
        { indexName: 'BCI', date: day(4), value: 1935, change: 45, changePct: 2.38 },
        { indexName: 'BSI', date: day(0), value: 980, change: -12, changePct: -1.21 },
        { indexName: 'BSI', date: day(4), value: 995, change: 15, changePct: 1.53 },
        { indexName: 'BCTI', date: day(0), value: 750, change: 8, changePct: 1.08 },
        { indexName: 'BDTI', date: day(0), value: 1120, change: -25, changePct: -2.18 },
        { indexName: 'BPI', date: day(0), value: 1450, change: 18, changePct: 1.26 },
      ],
    });
    console.log('  FreightIndices: 12 seeded');
  } else {
    console.log(`  FreightIndices: already seeded (${existingIndices})`);
  }

  // ── Batch 10: Market Rates ────────────────────────────────
  const existingMarketRates = await prisma.marketRate.count();
  if (existingMarketRates === 0) {
    await prisma.marketRate.createMany({
      data: [
        { route: 'C5 W.Australia-China', vesselType: 'capesize', rateType: 'spot', rate: 8.50, rateUnit: 'usd_per_mt', dwtMin: 150000, dwtMax: 210000, effectiveDate: new Date('2026-01-25'), region: 'pacific' },
        { route: 'C3 Tubarao-Qingdao', vesselType: 'capesize', rateType: 'spot', rate: 18.75, rateUnit: 'usd_per_mt', effectiveDate: new Date('2026-01-25'), region: 'atlantic' },
        { route: 'P1A Transatlantic RV', vesselType: 'panamax', rateType: 'spot', rate: 12500, rateUnit: 'usd_per_day', dwtMin: 70000, dwtMax: 85000, effectiveDate: new Date('2026-01-25'), region: 'atlantic' },
        { route: 'S1B USG-Skaw/Pass', vesselType: 'supramax', rateType: 'spot', rate: 14200, rateUnit: 'usd_per_day', effectiveDate: new Date('2026-01-25'), region: 'atlantic' },
        { route: 'TC Average', vesselType: 'capesize', rateType: 'time_charter', rate: 22500, rateUnit: 'usd_per_day', duration: '1yr', effectiveDate: new Date('2026-01-25'), region: 'global' },
        { route: 'TC Average', vesselType: 'panamax', rateType: 'time_charter', rate: 15800, rateUnit: 'usd_per_day', duration: '1yr', effectiveDate: new Date('2026-01-25'), region: 'global' },
        { route: 'TC Average', vesselType: 'supramax', rateType: 'time_charter', rate: 14500, rateUnit: 'usd_per_day', duration: '1yr', effectiveDate: new Date('2026-01-25'), region: 'global' },
        { route: 'TC Average', vesselType: 'handysize', rateType: 'time_charter', rate: 12000, rateUnit: 'usd_per_day', duration: '1yr', effectiveDate: new Date('2026-01-25'), region: 'global' },
      ],
    });
    console.log('  MarketRates: 8 seeded');
  } else {
    console.log(`  MarketRates: already seeded (${existingMarketRates})`);
  }

  // ── Batch 10: Vessel Inspections ──────────────────────────
  const existingInspections = await prisma.vesselInspection.count();
  if (existingInspections === 0) {
    await prisma.vesselInspection.createMany({
      data: [
        { vesselId: allVessels[0].id, inspectionType: 'sire', inspectorName: 'Capt. J. Morrison', inspectorOrg: 'OCIMF', inspectionDate: new Date('2025-11-15'), portOfInspection: 'Singapore', overallScore: 85, grade: 'B', deficienciesFound: 3, observationsCount: 8, navigation: 0, safety: 1, pollution: 0, structural: 1, operational: 1, documentation: 0, status: 'completed', closedOutDate: new Date('2025-12-10'), closedOutBy: 'Superintendent', nextInspectionDue: new Date('2026-11-15') },
        { vesselId: allVessels[0].id, inspectionType: 'psc', inspectorName: 'Inspector Lee', inspectorOrg: 'MPA Singapore', inspectionDate: new Date('2026-01-10'), portOfInspection: 'Singapore', overallScore: 92, grade: 'A', deficienciesFound: 1, observationsCount: 3, navigation: 0, safety: 0, pollution: 0, structural: 0, operational: 1, documentation: 0, status: 'completed' },
        { vesselId: allVessels[1].id, inspectionType: 'rightship', inspectorOrg: 'RightShip', inspectionDate: new Date('2025-10-20'), overallScore: 78, grade: 'C', deficienciesFound: 5, observationsCount: 12, navigation: 1, safety: 2, pollution: 0, structural: 1, operational: 1, documentation: 0, status: 'completed' },
        { vesselId: allVessels[1].id, inspectionType: 'psc', inspectorOrg: 'Mundra Port Authority', inspectionDate: new Date('2026-01-20'), portOfInspection: 'Mundra', deficienciesFound: 2, status: 'in_progress', detentionIssued: true, detentionDays: 2, notes: 'Detention for IOPP deficiency' },
        { vesselId: allVessels[2].id, inspectionType: 'class', inspectorOrg: 'Bureau Veritas', inspectionDate: new Date('2026-03-15'), status: 'scheduled', nextInspectionDue: new Date('2026-03-15') },
      ],
    });
    console.log('  VesselInspections: 5 seeded');
  } else {
    console.log(`  VesselInspections: already seeded (${existingInspections})`);
  }

  // ── Batch 10: Document Links ──────────────────────────────
  const existingDocLinks = await prisma.documentLink.count();
  if (existingDocLinks === 0) {
    await prisma.documentLink.createMany({
      data: [
        { organizationId: org.id, sourceDocType: 'charter_party', sourceDocId: 'cp-001', targetDocType: 'bol', targetDocId: 'bol-001', linkType: 'references', description: 'C/P referenced in B/L', createdBy: 'Admin' },
        { organizationId: org.id, sourceDocType: 'charter_party', sourceDocId: 'cp-001', targetDocType: 'charter_party_addendum', targetDocId: 'cpa-001', linkType: 'amends', description: 'Addendum amending laycan clause', createdBy: 'Admin' },
        { organizationId: org.id, sourceDocType: 'claim', sourceDocId: 'clm-001', targetDocType: 'survey_report', targetDocId: 'surv-001', linkType: 'supports', description: 'Survey report supporting cargo damage claim', createdBy: 'Admin' },
        { organizationId: org.id, sourceDocType: 'bol', sourceDocId: 'bol-001', targetDocType: 'invoice', targetDocId: 'inv-001', linkType: 'references', description: 'B/L referenced in freight invoice', createdBy: 'Admin' },
        { organizationId: org.id, sourceDocType: 'charter_party', sourceDocId: 'cp-002', targetDocType: 'charter_party', targetDocId: 'cp-001', linkType: 'supersedes', description: 'New C/P supersedes previous', createdBy: 'Admin' },
      ],
    });
    console.log('  DocumentLinks: 5 seeded');
  } else {
    console.log(`  DocumentLinks: already seeded (${existingDocLinks})`);
  }

  // === Batch 11: CTM, ECA Zones, High Risk Areas, Critical Path, Team Invitations, Beaufort Logs ===

  const existingCTM = await prisma.cashToMaster.count();
  if (existingCTM === 0) {
    const allVoyages = await prisma.voyage.findMany({ take: 3, include: { vessel: true } });
    if (allVoyages.length > 0) {
      for (const v of allVoyages) {
        await prisma.cashToMaster.createMany({
          data: [
            { organizationId: org.id, voyageId: v.id, vesselId: v.vesselId, currency: 'USD', amount: 5000, exchangeRate: 1.0, amountUsd: 5000, purpose: 'crew_wages', status: 'disbursed', requestDate: new Date('2026-01-10'), disbursedDate: new Date('2026-01-11') },
            { organizationId: org.id, voyageId: v.id, vesselId: v.vesselId, currency: 'SGD', amount: 3500, exchangeRate: 0.74, amountUsd: 2590, purpose: 'stores', status: 'approved', requestDate: new Date('2026-01-15') },
          ],
        });
      }
    }
    console.log('  CashToMaster: 6 seeded');
  } else {
    console.log(`  CashToMaster: already seeded (${existingCTM})`);
  }

  const existingECA = await prisma.ecaZone.count();
  if (existingECA === 0) {
    await prisma.ecaZone.createMany({
      data: [
        { name: 'Baltic Sea SECA', code: 'BALTIC_SECA', type: 'seca', fuelRequirement: 'max_sulphur_0.1', description: 'SOx Emission Control Area — Baltic Sea', polygon: [[53.5,9.5],[54.5,10],[55.5,12],[56,13],[57,16],[58,18],[59,20],[60,22],[61,24],[60,26],[58,28],[56,27],[55,26],[54,24],[53,20],[53,15],[53.5,9.5]], active: true, effectiveDate: new Date('2015-01-01'), source: 'IMO' },
        { name: 'North Sea SECA', code: 'NORTH_SEA_SECA', type: 'seca', fuelRequirement: 'max_sulphur_0.1', description: 'SOx Emission Control Area — North Sea', polygon: [[48.5,-5],[51,1.5],[53.5,4],[55,7],[57,8],[58,6],[60,5],[62,-2],[60,-5],[57,-6],[55,-7],[51,-6],[48.5,-5]], active: true, effectiveDate: new Date('2015-01-01'), source: 'IMO' },
        { name: 'North American ECA', code: 'NA_ECA', type: 'seca', fuelRequirement: 'max_sulphur_0.1', description: 'SOx & NOx Emission Control Area — US/Canada', polygon: [[25,-82],[30,-81],[35,-75],[40,-70],[42,-68],[44,-66],[46,-60],[48,-55],[50,-52],[48,-50],[30,-75],[25,-82]], active: true, effectiveDate: new Date('2012-08-01'), source: 'IMO/EPA' },
        { name: 'US Caribbean ECA', code: 'US_CARIBBEAN_ECA', type: 'seca', fuelRequirement: 'max_sulphur_0.1', description: 'SOx Emission Control Area — Puerto Rico & USVI', polygon: [[16.5,-68],[19,-68],[19.5,-64],[18,-63],[16.5,-64.5],[16.5,-68]], active: true, effectiveDate: new Date('2014-01-01'), source: 'EPA' },
        { name: 'Mediterranean SECA', code: 'MED_SECA', type: 'seca', fuelRequirement: 'max_sulphur_0.1', description: 'SOx Emission Control Area — Mediterranean (2025+)', polygon: [[30,-6],[36,-6],[37,0],[38,5],[40,10],[42,15],[41,20],[39,25],[37,28],[35,35],[33,35],[31,32],[30,28],[32,20],[33,15],[34,10],[32,5],[30,-6]], active: true, effectiveDate: new Date('2025-05-01'), source: 'IMO' },
      ],
    });
    console.log('  EcaZones: 5 seeded');
  } else {
    console.log(`  EcaZones: already seeded (${existingECA})`);
  }

  const existingHRA = await prisma.highRiskArea.count();
  if (existingHRA === 0) {
    await prisma.highRiskArea.createMany({
      data: [
        { name: 'Gulf of Aden / Somalia', code: 'GOA', riskType: 'piracy', riskLevel: 'high', description: 'High risk of piracy attacks. IRTC transit corridor recommended.', polygon: [[11,41],[15,41],[15,51],[12,51],[11,48],[11,41]], advisory: 'Use IRTC. Report to UKMTO. Implement BMP5.', insuranceSurcharge: 0.5, bmpRequired: true, armedGuards: 'recommended', source: 'IMO/UKMTO' },
        { name: 'West Africa / Gulf of Guinea', code: 'WAFR', riskType: 'piracy', riskLevel: 'critical', description: 'Highest piracy risk globally. Armed robbery and kidnapping.', polygon: [[-5,-5],[15,-5],[15,15],[-5,15],[-5,-5]], advisory: 'Maintain highest vigilance. Armed guards strongly recommended.', insuranceSurcharge: 0.75, bmpRequired: true, armedGuards: 'mandatory', source: 'IMB' },
        { name: 'Southeast Asia / Malacca Strait', code: 'SEA', riskType: 'piracy', riskLevel: 'medium', description: 'Opportunistic piracy and armed robbery.', polygon: [[-5,95],[10,95],[10,120],[-5,120],[-5,95]], advisory: 'Maintain watch. Report to ReCAAP ISC.', insuranceSurcharge: 0.1, bmpRequired: false, armedGuards: 'not_required', source: 'ReCAAP' },
        { name: 'Black Sea / Ukraine', code: 'BLK_UA', riskType: 'war_risk', riskLevel: 'critical', description: 'Active conflict zone. Floating mines reported.', polygon: [[41,28],[47,28],[47,42],[41,42],[41,28]], advisory: 'Avoid area. War risk insurance required.', insuranceSurcharge: 5.0, bmpRequired: true, armedGuards: 'not_required', source: 'JWC' },
        { name: 'Red Sea / Bab el-Mandeb', code: 'RED_SEA', riskType: 'war_risk', riskLevel: 'high', description: 'Houthi attacks on commercial shipping.', polygon: [[12,40],[16,40],[16,44],[12,44],[12,40]], advisory: 'Consider Cape route. War risk surcharge applies.', insuranceSurcharge: 1.0, bmpRequired: true, armedGuards: 'recommended', source: 'JWC/UKMTO' },
      ],
    });
    console.log('  HighRiskAreas: 5 seeded');
  } else {
    console.log(`  HighRiskAreas: already seeded (${existingHRA})`);
  }

  const existingCPI = await prisma.criticalPathItem.count();
  if (existingCPI === 0) {
    const firstVoyage = await prisma.voyage.findFirst();
    if (firstVoyage) {
      const now = new Date();
      const items = [
        { voyageId: firstVoyage.id, name: 'Arrival Pilot Station', category: 'port_ops', plannedStart: new Date(now.getTime() - 72*3600000), plannedEnd: new Date(now.getTime() - 71*3600000), actualStart: new Date(now.getTime() - 72*3600000), actualEnd: new Date(now.getTime() - 71*3600000), duration: 1, actualDuration: 1, slack: 0, isCritical: true, dependsOn: [] as string[], status: 'completed' },
        { voyageId: firstVoyage.id, name: 'NOR Tendered', category: 'documentation', plannedStart: new Date(now.getTime() - 71*3600000), plannedEnd: new Date(now.getTime() - 70.5*3600000), actualStart: new Date(now.getTime() - 71*3600000), actualEnd: new Date(now.getTime() - 70.5*3600000), duration: 0.5, actualDuration: 0.5, slack: 0, isCritical: true, dependsOn: [] as string[], status: 'completed' },
        { voyageId: firstVoyage.id, name: 'Berth Alongside', category: 'port_ops', plannedStart: new Date(now.getTime() - 48*3600000), plannedEnd: new Date(now.getTime() - 46*3600000), duration: 2, slack: 4, isCritical: false, dependsOn: [] as string[], status: 'in_progress' },
        { voyageId: firstVoyage.id, name: 'Loading Commenced', category: 'cargo_ops', plannedStart: new Date(now.getTime() - 46*3600000), plannedEnd: new Date(now.getTime() - 22*3600000), duration: 24, slack: 0, isCritical: true, dependsOn: [] as string[], status: 'pending' },
        { voyageId: firstVoyage.id, name: 'Loading Completed', category: 'cargo_ops', plannedStart: new Date(now.getTime() - 22*3600000), plannedEnd: new Date(now.getTime() - 20*3600000), duration: 2, slack: 0, isCritical: true, dependsOn: [] as string[], status: 'pending' },
        { voyageId: firstVoyage.id, name: 'Documents On Board', category: 'documentation', plannedStart: new Date(now.getTime() - 20*3600000), plannedEnd: new Date(now.getTime() - 18*3600000), duration: 2, slack: 6, isCritical: false, dependsOn: [] as string[], status: 'pending' },
      ];
      await prisma.criticalPathItem.createMany({ data: items });
    }
    console.log('  CriticalPathItems: 6 seeded');
  } else {
    console.log(`  CriticalPathItems: already seeded (${existingCPI})`);
  }

  const existingInv = await prisma.teamInvitation.count();
  if (existingInv === 0) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await prisma.teamInvitation.createMany({
      data: [
        { organizationId: org.id, email: 'ops.manager@mari8x.com', role: 'manager', invitedBy: admin.id, status: 'accepted', expiresAt, acceptedAt: new Date() },
        { organizationId: org.id, email: 'new.operator@mari8x.com', role: 'operator', invitedBy: admin.id, status: 'pending', expiresAt, message: 'Welcome to the Mari8x team!' },
        { organizationId: org.id, email: 'viewer@partner.com', role: 'viewer', invitedBy: admin.id, status: 'pending', expiresAt },
        { organizationId: org.id, email: 'expired@old.com', role: 'operator', invitedBy: admin.id, status: 'expired', expiresAt: new Date('2026-01-01') },
      ],
    });
    console.log('  TeamInvitations: 4 seeded');
  } else {
    console.log(`  TeamInvitations: already seeded (${existingInv})`);
  }

  const existingBfLogs = await prisma.beaufortLog.count();
  if (existingBfLogs === 0) {
    const bfVoyage = await prisma.voyage.findFirst({ include: { vessel: true } });
    if (bfVoyage) {
      const baseDate = new Date('2026-01-20T06:00:00Z');
      await prisma.beaufortLog.createMany({
        data: [
          { voyageId: bfVoyage.id, vesselId: bfVoyage.vesselId, reportDate: new Date(baseDate.getTime()), latitude: 12.5, longitude: 68.3, beaufortScale: 3, windSpeed: 10, waveHeight: 0.8, seaState: 'slight', warrantySpeed: 14.0, actualSpeed: 14.5, warrantyConsumption: 32, actualConsumption: 31, withinWarranty: true, barometer: 1015, airTemp: 28, seaTemp: 27 },
          { voyageId: bfVoyage.id, vesselId: bfVoyage.vesselId, reportDate: new Date(baseDate.getTime() + 24*3600000), latitude: 10.2, longitude: 72.1, beaufortScale: 5, windSpeed: 22, waveHeight: 2.5, seaState: 'rough', warrantySpeed: 14.0, actualSpeed: 13.2, warrantyConsumption: 32, actualConsumption: 35, withinWarranty: false, barometer: 1008, airTemp: 27, seaTemp: 27 },
          { voyageId: bfVoyage.id, vesselId: bfVoyage.vesselId, reportDate: new Date(baseDate.getTime() + 48*3600000), latitude: 8.1, longitude: 76.5, beaufortScale: 7, windSpeed: 35, waveHeight: 5.0, seaState: 'very_rough', warrantySpeed: 14.0, actualSpeed: 11.0, warrantyConsumption: 32, actualConsumption: 40, withinWarranty: false, barometer: 998, airTemp: 26, seaTemp: 26 },
          { voyageId: bfVoyage.id, vesselId: bfVoyage.vesselId, reportDate: new Date(baseDate.getTime() + 72*3600000), latitude: 6.5, longitude: 80.0, beaufortScale: 4, windSpeed: 16, waveHeight: 1.5, seaState: 'moderate', warrantySpeed: 14.0, actualSpeed: 14.2, warrantyConsumption: 32, actualConsumption: 32, withinWarranty: true, barometer: 1012, airTemp: 28, seaTemp: 27 },
          { voyageId: bfVoyage.id, vesselId: bfVoyage.vesselId, reportDate: new Date(baseDate.getTime() + 96*3600000), latitude: 5.0, longitude: 83.5, beaufortScale: 2, windSpeed: 6, waveHeight: 0.3, seaState: 'calm', warrantySpeed: 14.0, actualSpeed: 14.8, warrantyConsumption: 32, actualConsumption: 30, withinWarranty: true, barometer: 1018, airTemp: 29, seaTemp: 28 },
          { voyageId: bfVoyage.id, vesselId: bfVoyage.vesselId, reportDate: new Date(baseDate.getTime() + 120*3600000), latitude: 3.8, longitude: 87.2, beaufortScale: 6, windSpeed: 28, waveHeight: 3.5, seaState: 'rough', warrantySpeed: 14.0, actualSpeed: 12.5, warrantyConsumption: 32, actualConsumption: 37, withinWarranty: false, barometer: 1003, airTemp: 27, seaTemp: 27 },
        ],
      });
    }
    console.log('  BeaufortLogs: 6 seeded');
  } else {
    console.log(`  BeaufortLogs: already seeded (${existingBfLogs})`);
  }

  // --- S&P Module Seed Data ---
  const existingSaleListings = await prisma.saleListing.count();
  if (existingSaleListings === 0) {
    const saleVessels = allVessels.slice(0, 3);
    const listings = [];
    for (const sv of saleVessels) {
      const listing = await prisma.saleListing.create({
        data: {
          vesselId: sv.id,
          sellerOrgId: org.id,
          askingPrice: sv.dwt ? sv.dwt * 80 : 5000000,
          currency: 'USD',
          condition: sv.yearBuilt && sv.yearBuilt < 2015 ? 'as_is' : 'freshly_classed',
          classStatus: 'full_class',
          specialSurveyDue: new Date('2027-06-15'),
          highlights: `Well-maintained ${sv.type}, ${sv.dwt} DWT, built ${sv.yearBuilt}. Regular drydocking, class maintained throughout.`,
          brokerNotes: 'Prompt delivery available. Sellers motivated.',
          status: 'active',
          publishedAt: new Date(),
        },
      });
      listings.push(listing);
    }
    // Add a draft listing
    if (allVessels.length > 3) {
      const draftListing = await prisma.saleListing.create({
        data: {
          vesselId: allVessels[3].id,
          sellerOrgId: org.id,
          askingPrice: 3500000,
          currency: 'USD',
          condition: 'as_is',
          classStatus: 'full_class',
          highlights: 'Older vessel, suitable for demolition or short-term trading.',
          status: 'draft',
        },
      });
      listings.push(draftListing);
    }
    console.log(`  SaleListings: ${listings.length} seeded`);

    // Buyer interests
    const interestData = [
      { saleListingId: listings[0].id, buyerOrgId: org.id, contactName: 'John Buyer', contactEmail: 'john@buyer.com', status: 'nda_signed', ndaSignedAt: new Date(), notes: 'Very interested, requesting inspection' },
      { saleListingId: listings[0].id, buyerOrgId: org.id, contactName: 'Maria Investor', contactEmail: 'maria@invest.gr', status: 'inspecting', ndaSignedAt: new Date('2026-01-15'), inspectionDate: new Date('2026-02-10'), inspectionPort: 'Piraeus', notes: 'Class inspection arranged' },
      { saleListingId: listings[1].id, buyerOrgId: org.id, contactName: 'Ahmed Shipping', contactEmail: 'ahmed@shipping.ae', status: 'expressed', notes: 'Initial enquiry received' },
    ];
    await prisma.buyerInterest.createMany({ data: interestData });
    console.log('  BuyerInterests: 3 seeded');

    // Offers
    const offer1 = await prisma.sNPOffer.create({
      data: {
        saleListingId: listings[0].id,
        buyerOrgId: org.id,
        sellerOrgId: org.id,
        amount: listings[0].askingPrice * 0.85,
        currency: 'USD',
        conditions: 'Subject to satisfactory class inspection and drydock survey',
        offerType: 'initial',
        status: 'countered',
        expiresAt: new Date('2026-02-15'),
        respondedAt: new Date(),
        responseNotes: 'Price too low, counter offered',
      },
    });
    const offer2 = await prisma.sNPOffer.create({
      data: {
        saleListingId: listings[0].id,
        buyerOrgId: org.id,
        sellerOrgId: org.id,
        amount: listings[0].askingPrice * 0.92,
        currency: 'USD',
        conditions: 'Subject to class inspection only',
        offerType: 'counter',
        status: 'submitted',
        expiresAt: new Date('2026-02-20'),
        parentOfferId: offer1.id,
      },
    });
    await prisma.sNPOffer.create({
      data: {
        saleListingId: listings[1].id,
        buyerOrgId: org.id,
        sellerOrgId: org.id,
        amount: listings[1].askingPrice * 0.90,
        currency: 'USD',
        offerType: 'initial',
        status: 'submitted',
        expiresAt: new Date('2026-02-28'),
      },
    });
    console.log('  SNPOffers: 3 seeded');

    // Transaction (for listing[0] — simulate a deal in progress)
    // First update listing[0] status to under_offer
    await prisma.saleListing.update({
      where: { id: listings[0].id },
      data: { status: 'under_offer' },
    });
    const tx = await prisma.sNPTransaction.create({
      data: {
        saleListingId: listings[0].id,
        buyerOrgId: org.id,
        sellerOrgId: org.id,
        purchasePrice: listings[0].askingPrice * 0.92,
        currency: 'USD',
        moaTemplate: 'nsf_2012',
        moaDate: new Date('2026-01-28'),
        moaRef: 'MOA-2026-001',
        depositPercent: 10,
        depositAmount: listings[0].askingPrice * 0.92 * 0.10,
        depositDueDate: new Date('2026-02-05'),
        deliveryPort: 'Singapore',
        deliveryCondition: 'class_maintained',
        status: 'moa_signed',
      },
    });
    console.log('  SNPTransactions: 1 seeded');

    // Commissions
    await prisma.sNPCommission.createMany({
      data: [
        { transactionId: tx.id, organizationId: org.id, partyType: 'seller_broker', commissionRate: 1.0, commissionAmount: tx.purchasePrice * 0.01, currency: 'USD', status: 'pending' },
        { transactionId: tx.id, organizationId: org.id, partyType: 'buyer_broker', commissionRate: 1.0, commissionAmount: tx.purchasePrice * 0.01, currency: 'USD', status: 'pending' },
      ],
    });
    console.log('  SNPCommissions: 2 seeded');

    // Closing checklist items
    await prisma.closingChecklistItem.createMany({
      data: [
        { transactionId: tx.id, category: 'documents', item: 'Bill of Sale (notarized)', responsible: 'seller', status: 'in_progress', dueDate: new Date('2026-03-01') },
        { transactionId: tx.id, category: 'documents', item: 'Protocol of Delivery and Acceptance', responsible: 'both', status: 'pending', dueDate: new Date('2026-03-15') },
        { transactionId: tx.id, category: 'documents', item: 'Power of Attorney', responsible: 'seller', status: 'completed', completedDate: new Date('2026-01-30'), dueDate: new Date('2026-02-01') },
        { transactionId: tx.id, category: 'flag', item: 'Flag state deletion certificate', responsible: 'seller', status: 'pending', dueDate: new Date('2026-03-10') },
        { transactionId: tx.id, category: 'flag', item: 'New flag state registration', responsible: 'buyer', status: 'pending', dueDate: new Date('2026-03-15') },
        { transactionId: tx.id, category: 'class', item: 'Class transfer / continuity arrangement', responsible: 'buyer', status: 'in_progress', dueDate: new Date('2026-03-10') },
        { transactionId: tx.id, category: 'class', item: 'Outstanding recommendations clearance', responsible: 'seller', status: 'pending', dueDate: new Date('2026-03-05') },
        { transactionId: tx.id, category: 'insurance', item: 'H&M insurance transfer / cancellation', responsible: 'seller', status: 'pending', dueDate: new Date('2026-03-14') },
        { transactionId: tx.id, category: 'insurance', item: 'P&I club cessation of entry', responsible: 'seller', status: 'pending', dueDate: new Date('2026-03-14') },
        { transactionId: tx.id, category: 'financial', item: 'Final payment settlement', responsible: 'buyer', status: 'pending', dueDate: new Date('2026-03-15') },
        { transactionId: tx.id, category: 'financial', item: 'Mortgage / lien release', responsible: 'seller', status: 'completed', completedDate: new Date('2026-01-29'), dueDate: new Date('2026-02-01') },
        { transactionId: tx.id, category: 'operational', item: 'Crew handover / repatriation', responsible: 'both', status: 'pending', dueDate: new Date('2026-03-15') },
        { transactionId: tx.id, category: 'operational', item: 'Stores and spares inventory', responsible: 'both', status: 'pending', dueDate: new Date('2026-03-14') },
        { transactionId: tx.id, category: 'operational', item: 'Bunker survey at delivery', responsible: 'both', status: 'pending', dueDate: new Date('2026-03-15') },
      ],
    });
    console.log('  ClosingChecklistItems: 14 seeded');
  } else {
    console.log(`  SaleListings: already seeded (${existingSaleListings})`);
  }

  // --- Trade Finance Module Seed Data ---
  const existingLCs = await prisma.letterOfCredit.count();
  if (existingLCs === 0) {
    const firstVoyage = await prisma.voyage.findFirst();
    const lc1 = await prisma.letterOfCredit.create({
      data: {
        organizationId: org.id,
        voyageId: firstVoyage?.id,
        reference: 'LC-2026-001',
        type: 'irrevocable',
        amount: 2500000,
        currency: 'USD',
        issuingBank: 'HSBC Singapore',
        advisingBank: 'Standard Chartered Mumbai',
        applicant: 'Cargill International SA',
        beneficiary: 'Pacific Bulk Carriers Ltd',
        issueDate: new Date('2026-01-15'),
        expiryDate: new Date('2026-04-15'),
        latestShipment: new Date('2026-03-30'),
        portOfLoading: 'Mundra, India',
        portOfDischarge: 'Shanghai, China',
        cargoDescription: '50,000 MT (+/- 5%) Iron Ore Fines',
        incoterms: 'CFR',
        paymentTerms: 'at_sight',
        tolerancePercent: 5,
        partialShipment: false,
        transhipment: false,
        status: 'confirmed',
      },
    });
    const lc2 = await prisma.letterOfCredit.create({
      data: {
        organizationId: org.id,
        reference: 'LC-2026-002',
        type: 'confirmed',
        amount: 1800000,
        currency: 'EUR',
        issuingBank: 'Deutsche Bank Frankfurt',
        confirmingBank: 'BNP Paribas Paris',
        applicant: 'Trafigura Maritime',
        beneficiary: 'Oceanic Trading Corp',
        expiryDate: new Date('2026-05-30'),
        latestShipment: new Date('2026-05-15'),
        portOfLoading: 'Rotterdam, Netherlands',
        portOfDischarge: 'Jebel Ali, UAE',
        cargoDescription: '25,000 MT Wheat',
        incoterms: 'CIF',
        paymentTerms: 'deferred_60',
        status: 'issued',
      },
    });
    await prisma.letterOfCredit.create({
      data: {
        organizationId: org.id,
        reference: 'LC-2026-003',
        type: 'standby',
        amount: 500000,
        currency: 'USD',
        issuingBank: 'Citibank New York',
        applicant: 'Pacific Bulk Carriers Ltd',
        beneficiary: 'Bunker Supply Corp',
        expiryDate: new Date('2026-12-31'),
        cargoDescription: 'Standby LC for bunker supply guarantee',
        status: 'draft',
      },
    });

    // LC Documents for lc1
    await prisma.lCDocument.createMany({
      data: [
        { letterOfCreditId: lc1.id, documentType: 'commercial_invoice', required: true, copies: 3, originals: 1, status: 'submitted', submittedDate: new Date() },
        { letterOfCreditId: lc1.id, documentType: 'packing_list', required: true, copies: 3, originals: 0, status: 'submitted', submittedDate: new Date() },
        { letterOfCreditId: lc1.id, documentType: 'bill_of_lading', required: true, copies: 0, originals: 3, description: 'Full set 3/3 original B/Ls', status: 'pending' },
        { letterOfCreditId: lc1.id, documentType: 'certificate_of_origin', required: true, copies: 2, originals: 1, status: 'pending' },
        { letterOfCreditId: lc1.id, documentType: 'weight_certificate', required: true, copies: 2, originals: 0, status: 'pending' },
        { letterOfCreditId: lc1.id, documentType: 'inspection_certificate', required: false, copies: 2, originals: 0, status: 'pending' },
      ],
    });

    // LC Amendment for lc2
    await prisma.lCAmendment.create({
      data: {
        letterOfCreditId: lc2.id,
        amendmentNumber: 1,
        description: 'Extend latest shipment date by 15 days',
        previousValue: '2026-05-15',
        newValue: '2026-05-30',
        requestedBy: 'beneficiary',
        status: 'approved',
        approvedDate: new Date(),
      },
    });

    // LC Drawing for lc1
    await prisma.lCDrawing.create({
      data: {
        letterOfCreditId: lc1.id,
        drawingNumber: 1,
        amount: 2500000,
        currency: 'USD',
        presentationDate: new Date(),
        status: 'presented',
      },
    });

    console.log('  LettersOfCredit: 3 seeded (+ 6 docs, 1 amendment, 1 drawing)');
  } else {
    console.log(`  LettersOfCredit: already seeded (${existingLCs})`);
  }

  const existingTradePayments = await prisma.tradePayment.count();
  if (existingTradePayments === 0) {
    const voyages = await prisma.voyage.findMany({ take: 3 });
    await prisma.tradePayment.createMany({
      data: [
        { organizationId: org.id, voyageId: voyages[0]?.id, reference: 'PAY-2026-001', paymentType: 'freight_advance', payer: 'Cargill International SA', payee: 'Pacific Bulk Carriers Ltd', amount: 750000, currency: 'USD', amountUsd: 750000, dueDate: new Date('2026-02-01'), status: 'paid', paidDate: new Date('2026-01-30'), bankReference: 'SWIFT-001', swiftRef: 'MT103-2026-001', paymentMethod: 'swift' },
        { organizationId: org.id, voyageId: voyages[0]?.id, reference: 'PAY-2026-002', paymentType: 'freight_balance', payer: 'Cargill International SA', payee: 'Pacific Bulk Carriers Ltd', amount: 750000, currency: 'USD', amountUsd: 750000, dueDate: new Date('2026-03-15'), status: 'pending', invoiceRef: 'INV-2026-045' },
        { organizationId: org.id, voyageId: voyages[1]?.id, reference: 'PAY-2026-003', paymentType: 'demurrage', payer: 'Trafigura Maritime', payee: 'Pacific Bulk Carriers Ltd', amount: 125000, currency: 'USD', amountUsd: 125000, dueDate: new Date('2026-01-20'), status: 'overdue' },
        { organizationId: org.id, reference: 'PAY-2026-004', paymentType: 'commission', payer: 'Pacific Bulk Carriers Ltd', payee: 'Clarksons Platou', amount: 37500, currency: 'USD', amountUsd: 37500, dueDate: new Date('2026-02-28'), status: 'approved' },
        { organizationId: org.id, reference: 'PAY-2026-005', paymentType: 'da_payment', payer: 'Pacific Bulk Carriers Ltd', payee: 'Wilhelmsen Ships Service', amount: 45000, currency: 'USD', amountUsd: 45000, dueDate: new Date('2026-02-15'), status: 'pending', invoiceRef: 'DA-MUN-2026-003' },
        { organizationId: org.id, reference: 'PAY-2026-006', paymentType: 'bunker_payment', payer: 'Pacific Bulk Carriers Ltd', payee: 'Cochin Bunker Supply', amount: 3200000, currency: 'INR', exchangeRate: 0.012, amountUsd: 38400, dueDate: new Date('2026-02-10'), status: 'processing', paymentMethod: 'swift' },
        { organizationId: org.id, voyageId: voyages[2]?.id, reference: 'PAY-2026-007', paymentType: 'hire_payment', payer: 'Pacific Bulk Carriers Ltd', payee: 'Golden Ocean Group', amount: 18500, currency: 'USD', amountUsd: 18500, dueDate: new Date('2026-02-15'), status: 'pending', notes: 'Monthly hire for MV Golden Hawk' },
      ],
    });
    console.log('  TradePayments: 7 seeded');
  } else {
    console.log(`  TradePayments: already seeded (${existingTradePayments})`);
  }

  const existingFXExposures = await prisma.fXExposure.count();
  if (existingFXExposures === 0) {
    await prisma.fXExposure.createMany({
      data: [
        { organizationId: org.id, currency: 'EUR', baseCurrency: 'USD', exposureType: 'receivable', amount: 1800000, spotRate: 1.085, hedgedAmount: 900000, hedgeRate: 1.08, hedgeInstrument: 'forward', hedgeMaturity: new Date('2026-05-30'), counterparty: 'HSBC', status: 'partially_hedged' },
        { organizationId: org.id, currency: 'INR', baseCurrency: 'USD', exposureType: 'payable', amount: 25000000, spotRate: 0.012, hedgedAmount: 0, status: 'open', notes: 'Port disbursements and bunker payments in India' },
        { organizationId: org.id, currency: 'GBP', baseCurrency: 'USD', exposureType: 'receivable', amount: 500000, spotRate: 1.27, hedgedAmount: 500000, hedgeRate: 1.265, hedgeInstrument: 'option', hedgeMaturity: new Date('2026-04-15'), counterparty: 'Standard Chartered', status: 'fully_hedged' },
        { organizationId: org.id, currency: 'NOK', baseCurrency: 'USD', exposureType: 'payable', amount: 8500000, spotRate: 0.092, hedgedAmount: 4000000, hedgeRate: 0.091, hedgeInstrument: 'swap', hedgeMaturity: new Date('2026-06-30'), counterparty: 'DNB', status: 'partially_hedged' },
        { organizationId: org.id, currency: 'SGD', baseCurrency: 'USD', exposureType: 'receivable', amount: 750000, spotRate: 0.745, status: 'open', notes: 'Charter hire receivable from Singapore client' },
      ],
    });
    console.log('  FXExposures: 5 seeded');
  } else {
    console.log(`  FXExposures: already seeded (${existingFXExposures})`);
  }

  // === FFA Positions & Trades ===
  const existingFFAPositions = await prisma.fFAPosition.count();
  if (existingFFAPositions === 0) {
    const ffaPos1 = await prisma.fFAPosition.create({
      data: {
        route: 'TC2_37',
        period: 'Q1-2026',
        direction: 'long',
        quantity: 5,
        lotSize: 1000,
        entryPrice: 12.50,
        currentPrice: 13.20,
        mtmValue: 3500,
        clearingHouse: 'ICE Clear Europe',
        clearingRef: 'ICE-2026-00412',
        margin: 25000,
        variationMargin: 3500,
        counterparty: 'Glencore Energy',
        broker: 'SSY Futures',
        status: 'open',
        tradeDate: new Date('2026-01-15'),
        expiryDate: new Date('2026-03-31'),
        organizationId: org.id,
      },
    });
    const ffaPos2 = await prisma.fFAPosition.create({
      data: {
        route: 'TD3C',
        period: 'Feb-2026',
        direction: 'short',
        quantity: 3,
        lotSize: 1000,
        entryPrice: 18.75,
        currentPrice: 17.90,
        mtmValue: 2550,
        clearingHouse: 'LCH',
        clearingRef: 'LCH-2026-08891',
        margin: 22000,
        variationMargin: 2550,
        counterparty: 'Trafigura Maritime',
        broker: 'Braemar ACM',
        status: 'open',
        tradeDate: new Date('2026-01-20'),
        expiryDate: new Date('2026-02-28'),
        organizationId: org.id,
      },
    });
    const ffaPos3 = await prisma.fFAPosition.create({
      data: {
        route: 'C5TC',
        period: 'Cal-2026',
        direction: 'long',
        quantity: 10,
        lotSize: 1000,
        entryPrice: 22.00,
        currentPrice: 21.50,
        mtmValue: -5000,
        clearingHouse: 'SGX',
        clearingRef: 'SGX-2026-14523',
        margin: 75000,
        variationMargin: -5000,
        counterparty: 'Koch Supply & Trading',
        broker: 'Clarksons Platou',
        status: 'open',
        tradeDate: new Date('2026-01-10'),
        expiryDate: new Date('2026-12-31'),
        organizationId: org.id,
      },
    });
    const ffaPos4 = await prisma.fFAPosition.create({
      data: {
        route: 'TD7',
        period: 'Q4-2025',
        direction: 'long',
        quantity: 4,
        lotSize: 1000,
        entryPrice: 15.30,
        currentPrice: 16.80,
        mtmValue: 6000,
        clearingHouse: 'ICE Clear Europe',
        margin: 0,
        variationMargin: 0,
        status: 'closed',
        tradeDate: new Date('2025-09-15'),
        expiryDate: new Date('2025-12-31'),
        organizationId: org.id,
      },
    });

    // Opening trades for each position
    await prisma.fFATrade.createMany({
      data: [
        { positionId: ffaPos1.id, tradeType: 'open', direction: 'buy', quantity: 5, price: 12.50, fees: 250, clearingFee: 100, brokerFee: 150, counterparty: 'Glencore Energy', broker: 'SSY Futures', tradeDate: new Date('2026-01-15'), reference: 'T-2026-0412', organizationId: org.id },
        { positionId: ffaPos2.id, tradeType: 'open', direction: 'sell', quantity: 3, price: 18.75, fees: 180, clearingFee: 60, brokerFee: 120, counterparty: 'Trafigura Maritime', broker: 'Braemar ACM', tradeDate: new Date('2026-01-20'), reference: 'T-2026-0891', organizationId: org.id },
        { positionId: ffaPos3.id, tradeType: 'open', direction: 'buy', quantity: 10, price: 22.00, fees: 500, clearingFee: 200, brokerFee: 300, counterparty: 'Koch Supply & Trading', broker: 'Clarksons Platou', tradeDate: new Date('2026-01-10'), reference: 'T-2026-1452', organizationId: org.id },
        { positionId: ffaPos4.id, tradeType: 'open', direction: 'buy', quantity: 4, price: 15.30, fees: 200, clearingFee: 80, brokerFee: 120, tradeDate: new Date('2025-09-15'), reference: 'T-2025-7841', organizationId: org.id },
        { positionId: ffaPos4.id, tradeType: 'close', direction: 'sell', quantity: 4, price: 16.80, fees: 200, clearingFee: 80, brokerFee: 120, tradeDate: new Date('2025-12-28'), reference: 'T-2025-9102', organizationId: org.id },
      ],
    });
    console.log('  FFAPositions: 4 seeded (+ 5 trades)');

    // VaR Snapshots
    await prisma.vaRSnapshot.createMany({
      data: [
        { snapshotDate: new Date('2026-01-30'), portfolioValue: 1050, varOneDay95: 8500, varOneDay99: 14200, varTenDay95: 26870, varTenDay99: 44900, cvar95: 11200, maxDrawdown: 18500, sharpeRatio: 1.35, positionCount: 3, totalExposure: 305000, methodology: 'historical', lookbackDays: 252, organizationId: org.id },
        { snapshotDate: new Date('2026-01-29'), portfolioValue: 850, varOneDay95: 8200, varOneDay99: 13800, varTenDay95: 25930, varTenDay99: 43630, cvar95: 10800, maxDrawdown: 17200, sharpeRatio: 1.28, positionCount: 3, totalExposure: 302000, methodology: 'historical', lookbackDays: 252, organizationId: org.id },
        { snapshotDate: new Date('2026-01-28'), portfolioValue: 2100, varOneDay95: 8800, varOneDay99: 14600, varTenDay95: 27820, varTenDay99: 46170, cvar95: 11600, maxDrawdown: 16800, sharpeRatio: 1.42, positionCount: 3, totalExposure: 308000, methodology: 'historical', lookbackDays: 252, organizationId: org.id },
      ],
    });
    console.log('  VaRSnapshots: 3 seeded');

    // Backtest Results
    await prisma.backtestResult.createMany({
      data: [
        { strategyName: 'MA Crossover 20/50', description: 'Short-term MA crossover strategy on TC2', route: 'TC2_37', periodStart: new Date('2024-01-01'), periodEnd: new Date('2025-12-31'), entryRule: 'Buy when 20-day SMA crosses above 50-day SMA', exitRule: 'Sell when 20-day SMA crosses below 50-day SMA', trades: 24, winRate: 54.2, avgReturn: 1.8, totalReturn: 43200, maxDrawdown: 12500, sharpeRatio: 1.15, sortinoRatio: 1.52, profitFactor: 1.45, avgHoldingDays: 18.5, parameters: { shortWindow: 20, longWindow: 50, lotSize: 5 }, organizationId: org.id },
        { strategyName: 'Mean Reversion Z-2', description: 'Mean reversion with z-score threshold on TD3C', route: 'TD3C', periodStart: new Date('2024-01-01'), periodEnd: new Date('2025-12-31'), entryRule: 'Buy when z-score < -2.0 (price 2 stddev below mean)', exitRule: 'Sell when z-score > +2.0 (price 2 stddev above mean)', trades: 16, winRate: 62.5, avgReturn: 2.4, totalReturn: 38400, maxDrawdown: 9800, sharpeRatio: 1.38, sortinoRatio: 1.85, profitFactor: 1.72, avgHoldingDays: 22.0, parameters: { window: 30, zThreshold: 2.0, lotSize: 3 }, organizationId: org.id },
        { strategyName: 'Seasonal Q3 Buy', description: 'Seasonal pattern: buy in Q3, sell in Q1 on Capesize', route: 'C5TC', periodStart: new Date('2022-01-01'), periodEnd: new Date('2025-12-31'), entryRule: 'Buy on July 1st each year', exitRule: 'Sell on January 15th following year', trades: 4, winRate: 75.0, avgReturn: 5.2, totalReturn: 20800, maxDrawdown: 15200, sharpeRatio: 0.92, sortinoRatio: 1.18, profitFactor: 2.10, avgHoldingDays: 198, parameters: { buyMonth: 7, sellMonth: 1, lotSize: 10 }, organizationId: org.id },
      ],
    });
    console.log('  BacktestResults: 3 seeded');

    // P&L Entries
    await prisma.pnLEntry.createMany({
      data: [
        { date: new Date('2026-01-30'), category: 'physical', subcategory: 'freight', route: 'AG-Japan', revenue: 285000, cost: 245000, pnl: 40000, pnlUsd: 40000, description: 'VLCC AG-Japan voyage freight', period: 'Jan-2026', organizationId: org.id },
        { date: new Date('2026-01-30'), category: 'physical', subcategory: 'demurrage', route: 'AG-Japan', revenue: 18500, cost: 0, pnl: 18500, pnlUsd: 18500, description: 'Demurrage collection Ras Tanura', period: 'Jan-2026', organizationId: org.id },
        { date: new Date('2026-01-30'), category: 'paper', subcategory: 'ffa', route: 'TC2_37', revenue: 3500, cost: 250, pnl: 3250, pnlUsd: 3250, description: 'TC2 FFA MTM gain', period: 'Jan-2026', positionId: ffaPos1.id, organizationId: org.id },
        { date: new Date('2026-01-30'), category: 'paper', subcategory: 'ffa', route: 'TD3C', revenue: 2550, cost: 180, pnl: 2370, pnlUsd: 2370, description: 'TD3C FFA MTM gain (short)', period: 'Jan-2026', positionId: ffaPos2.id, organizationId: org.id },
        { date: new Date('2026-01-30'), category: 'paper', subcategory: 'ffa', route: 'C5TC', revenue: 0, cost: 5500, pnl: -5500, pnlUsd: -5500, description: 'C5TC FFA MTM loss', period: 'Jan-2026', positionId: ffaPos3.id, organizationId: org.id },
        { date: new Date('2026-01-30'), category: 'hedging', subcategory: 'bunker_hedge', revenue: 1200, cost: 350, pnl: 850, pnlUsd: 850, description: 'Bunker price hedge gain', period: 'Jan-2026', organizationId: org.id },
        { date: new Date('2026-01-30'), category: 'basis', subcategory: 'freight', route: 'AG-Japan', revenue: 0, cost: 2100, pnl: -2100, pnlUsd: -2100, description: 'Basis risk: physical vs paper TD3C', period: 'Jan-2026', organizationId: org.id },
      ],
    });
    console.log('  PnLEntries: 7 seeded');
  } else {
    console.log(`  FFAPositions: already seeded (${existingFFAPositions})`);
  }

  // ==========================================
  // === Sanctions & Compliance (Phase 15) ===
  // ==========================================
  const existingSanctions = await prisma.sanctionScreening.count();
  if (existingSanctions === 0) {
    const v1 = vesselByName('Stellar');
    const v2 = vesselByName('Ocean');
    const cargill = companyByName('Cargill');
    const trafigura = companyByName('Trafigura');
    const aegean = companyByName('Aegean');

    // Sanction Screenings — mix of entity types and statuses
    await prisma.sanctionScreening.createMany({
      data: [
        { entityType: 'vessel', entityName: v1?.name ?? 'Stellar Pioneer', entityId: v1?.id, imoNumber: '9876543', flagState: 'MH', screeningType: 'initial', status: 'clear', riskLevel: 'low', sanctionLists: ['OFAC', 'EU', 'UN'], pepMatch: false, adverseMedia: false, screenedBy: 'system', reviewedBy: 'compliance_officer_1', reviewDate: new Date('2026-01-20'), expiresAt: new Date('2026-07-20'), notes: 'Clean screening, Marshall Islands flag, no adverse findings', organizationId: org.id },
        { entityType: 'vessel', entityName: v2?.name ?? 'Ocean Voyager', entityId: v2?.id, imoNumber: '9654321', flagState: 'PA', screeningType: 'periodic', status: 'possible_match', riskLevel: 'medium', matchDetails: 'Vessel name partial match with sanctioned entity "Ocean Voyager III" (OFAC SDN). Different IMO confirmed — false positive pending review.', sanctionLists: ['OFAC', 'EU', 'UN', 'UK_OFSI'], pepMatch: false, adverseMedia: false, screenedBy: 'system', expiresAt: new Date('2026-04-15'), notes: 'Flagged for manual review due to name similarity', organizationId: org.id },
        { entityType: 'company', entityName: cargill?.name ?? 'Cargill International SA', entityId: cargill?.id, screeningType: 'initial', status: 'clear', riskLevel: 'low', sanctionLists: ['OFAC', 'EU', 'UN'], pepMatch: false, adverseMedia: false, screenedBy: 'system', reviewedBy: 'compliance_officer_1', reviewDate: new Date('2026-01-10'), expiresAt: new Date('2027-01-10'), organizationId: org.id },
        { entityType: 'company', entityName: trafigura?.name ?? 'Trafigura Maritime', entityId: trafigura?.id, screeningType: 'enhanced', status: 'clear', riskLevel: 'medium', sanctionLists: ['OFAC', 'EU', 'UN', 'UK_OFSI'], pepMatch: true, adverseMedia: true, screenedBy: 'system', reviewedBy: 'compliance_officer_2', reviewDate: new Date('2026-01-25'), expiresAt: new Date('2026-07-25'), notes: 'PEP exposure via board member. Adverse media: historic enforcement case (settled). Enhanced monitoring recommended.', organizationId: org.id },
        { entityType: 'individual', entityName: 'Dimitrios Papadopoulos', nationality: 'GR', screeningType: 'transaction', status: 'clear', riskLevel: 'low', sanctionLists: ['OFAC', 'EU'], pepMatch: false, adverseMedia: false, screenedBy: 'system', reviewedBy: 'compliance_officer_1', reviewDate: new Date('2026-01-28'), organizationId: org.id },
        { entityType: 'cargo', entityName: 'Iranian Light Crude Oil', screeningType: 'transaction', status: 'match', riskLevel: 'critical', matchDetails: 'Origin Iran — OFAC comprehensive sanctions apply. EU oil embargo in effect. Transaction blocked.', sanctionLists: ['OFAC', 'EU', 'UN'], pepMatch: false, adverseMedia: true, screenedBy: 'system', notes: 'Auto-flagged: Iranian origin crude. Escalated to compliance head.', organizationId: org.id },
      ],
    });
    console.log('  SanctionScreenings: 6 seeded');

    // Counterparty Risk Scores
    await prisma.counterpartyRiskScore.createMany({
      data: [
        { companyId: cargill?.id ?? 'cargill', companyName: cargill?.name ?? 'Cargill International SA', overallScore: 15, riskCategory: 'low', financialScore: 12, complianceScore: 10, operationalScore: 18, reputationScore: 20, sanctionRisk: false, pepExposure: false, adverseMedia: false, countryRisk: 'low', lastScreeningDate: new Date('2026-01-10'), creditLimit: 5000000, paymentHistory: 'good', validUntil: new Date('2027-01-10'), organizationId: org.id },
        { companyId: trafigura?.id ?? 'trafigura', companyName: trafigura?.name ?? 'Trafigura Maritime', overallScore: 42, riskCategory: 'medium', financialScore: 25, complianceScore: 55, operationalScore: 35, reputationScore: 52, sanctionRisk: false, pepExposure: true, adverseMedia: true, countryRisk: 'medium', lastScreeningDate: new Date('2026-01-25'), creditLimit: 2000000, paymentHistory: 'good', notes: 'Elevated due to PEP board member and historical enforcement action', validUntil: new Date('2026-07-25'), organizationId: org.id },
        { companyId: aegean?.id ?? 'aegean', companyName: aegean?.name ?? 'Aegean Bunkering', overallScore: 58, riskCategory: 'medium', financialScore: 45, complianceScore: 65, operationalScore: 50, reputationScore: 72, sanctionRisk: false, pepExposure: false, adverseMedia: true, countryRisk: 'medium', lastScreeningDate: new Date('2026-01-15'), creditLimit: 500000, paymentHistory: 'fair', notes: 'Adverse media: parent company bankruptcy proceedings (2018). Operating entity unaffected.', validUntil: new Date('2026-07-15'), organizationId: org.id },
      ],
    });
    console.log('  CounterpartyRiskScores: 3 seeded');

    // Ultimate Beneficial Owners
    await prisma.ultimateBeneficialOwner.createMany({
      data: [
        { companyId: cargill?.id ?? 'cargill', companyName: cargill?.name ?? 'Cargill International SA', ownerName: 'Cargill Family Trust', nationality: 'US', ownershipPercent: 88.0, isDirectOwner: false, controlType: 'ownership', pepStatus: false, sanctionStatus: 'clear', verificationStatus: 'verified', verifiedDate: new Date('2026-01-10'), verifiedBy: 'compliance_officer_1', documentRef: 'KYC-2026-CARG-001', expiresAt: new Date('2027-01-10'), organizationId: org.id },
        { companyId: cargill?.id ?? 'cargill', companyName: cargill?.name ?? 'Cargill International SA', ownerName: 'Austen Cargill', nationality: 'US', dateOfBirth: new Date('1951-06-15'), ownershipPercent: 12.0, isDirectOwner: true, controlType: 'voting_rights', pepStatus: false, sanctionStatus: 'clear', verificationStatus: 'verified', verifiedDate: new Date('2026-01-10'), verifiedBy: 'compliance_officer_1', documentRef: 'KYC-2026-CARG-002', expiresAt: new Date('2027-01-10'), organizationId: org.id },
        { companyId: trafigura?.id ?? 'trafigura', companyName: trafigura?.name ?? 'Trafigura Maritime', ownerName: 'Jeremy Weir', nationality: 'GB', dateOfBirth: new Date('1965-03-22'), ownershipPercent: 3.5, isDirectOwner: true, controlType: 'other_control', pepStatus: true, sanctionStatus: 'clear', verificationStatus: 'verified', verifiedDate: new Date('2026-01-25'), verifiedBy: 'compliance_officer_2', documentRef: 'KYC-2026-TRAF-001', expiresAt: new Date('2026-07-25'), notes: 'CEO — PEP due to advisory role on governmental trade body', organizationId: org.id },
        { companyId: trafigura?.id ?? 'trafigura', companyName: trafigura?.name ?? 'Trafigura Maritime', ownerName: 'Trafigura Employee Trust', nationality: 'NL', ownershipPercent: 60.0, isDirectOwner: false, controlType: 'ownership', pepStatus: false, sanctionStatus: 'clear', verificationStatus: 'verified', verifiedDate: new Date('2026-01-25'), verifiedBy: 'compliance_officer_2', documentRef: 'KYC-2026-TRAF-002', expiresAt: new Date('2026-07-25'), organizationId: org.id },
        { companyId: aegean?.id ?? 'aegean', companyName: aegean?.name ?? 'Aegean Bunkering', ownerName: 'Mercuria Energy Group', nationality: 'CH', ownershipPercent: 100, isDirectOwner: true, controlType: 'ownership', pepStatus: false, sanctionStatus: 'clear', verificationStatus: 'pending', documentRef: 'KYC-2026-AEG-001', notes: 'Pending verification — post-acquisition restructuring', organizationId: org.id },
      ],
    });
    console.log('  UltimateBeneficialOwners: 5 seeded');
  } else {
    console.log(`  SanctionScreenings: already seeded (${existingSanctions})`);
  }

  // ==========================================
  // === CRM MODULE (Phase 19) ===
  // ==========================================
  const existingLeads = await prisma.lead.count();
  if (existingLeads === 0) {
    const cargill = companyByName('Cargill');
    const trafigura = companyByName('Trafigura');
    const clarksons = companyByName('Clarksons');
    const ssy = companyByName('Simpson');
    const bluewater = companyByName('Blue Water');

    // Communication Logs
    await prisma.communicationLog.createMany({
      data: [
        { type: 'email', direction: 'inbound', subject: 'VLCC Enquiry AG-Japan Feb stem', body: 'Dear Ops, We are looking for a VLCC for AG-Japan Feb first half stem, 270kmt crude oil. Please advise availability.', contactId: null, companyId: cargill?.id, fromAddress: 'chartering@cargill.com', toAddresses: ['ops@mari8x-demo.com'], tags: ['enquiry', 'vlcc', 'crude'], sentiment: 'neutral', isAutoLogged: true, organizationId: org.id },
        { type: 'call', direction: 'outbound', subject: 'Follow-up: Cargill AG-Japan enquiry', duration: 420, contactId: null, companyId: cargill?.id, fromAddress: 'ops@mari8x-demo.com', toAddresses: ['chartering@cargill.com'], tags: ['follow-up', 'vlcc'], sentiment: 'positive', loggedBy: 'ops_manager', organizationId: org.id },
        { type: 'meeting', direction: 'outbound', subject: 'Clarksons weekly market briefing', body: 'Weekly market update and fixture discussion. BDI trending up, Capesize rates firming.', companyId: clarksons?.id, location: 'London — Clarksons HQ', meetingDate: new Date('2026-01-28T10:00:00Z'), tags: ['market-intel', 'weekly'], sentiment: 'positive', loggedBy: 'chartering_head', organizationId: org.id },
        { type: 'whatsapp', direction: 'inbound', subject: 'Trafigura — quick rate check', body: 'Hi, what is your last done for MR TC2 next 10 days? Need quick indication.', companyId: trafigura?.id, fromAddress: '+6591234567', toAddresses: ['+442071234567'], tags: ['rate-check', 'mr', 'tc2'], sentiment: 'neutral', isAutoLogged: true, organizationId: org.id },
        { type: 'email', direction: 'outbound', subject: 'SSY — Tonnage Position List 31 Jan', body: 'Please find attached our daily tonnage position list for AG/India trade.', companyId: ssy?.id, fromAddress: 'positions@mari8x-demo.com', toAddresses: ['info@ssy.co'], attachments: ['tonnage-list-2026-01-31.pdf'], tags: ['tonnage-list', 'daily'], sentiment: 'neutral', loggedBy: 'ops_desk', organizationId: org.id },
        { type: 'note', subject: 'Blue Water — potential new CHA relationship', body: 'Met at Nor-Shipping. Interested in handling our clearance for Scandinavian ports. Competitive rates. Follow up in Feb.', companyId: bluewater?.id, tags: ['new-business', 'cha', 'scandinavia'], sentiment: 'positive', loggedBy: 'bd_manager', organizationId: org.id },
      ],
    });
    console.log('  CommunicationLogs: 6 seeded');

    // Leads
    const lead1 = await prisma.lead.create({
      data: { title: 'VLCC AG-Japan Feb 2026', source: 'email', stage: 'negotiation', companyId: cargill?.id, companyName: cargill?.name ?? 'Cargill', contactName: 'John Chen', vesselType: 'VLCC', cargoType: 'Crude Oil', route: 'AG-Japan', estimatedValue: 285000, probability: 75, weightedValue: 213750, expectedClose: new Date('2026-02-05'), assignedTo: 'chartering_head', notes: 'Strong lead, discussing last cargo details', organizationId: org.id },
    });
    const lead2 = await prisma.lead.create({
      data: { title: 'Capesize Richards Bay-Qingdao Coal', source: 'broker', stage: 'proposal', companyId: trafigura?.id, companyName: trafigura?.name ?? 'Trafigura', contactName: 'Sarah Lee', vesselType: 'Capesize', cargoType: 'Coal', route: 'Richards Bay-Qingdao', estimatedValue: 195000, probability: 50, weightedValue: 97500, expectedClose: new Date('2026-02-15'), assignedTo: 'chartering_desk_1', organizationId: org.id },
    });
    const lead3 = await prisma.lead.create({
      data: { title: 'MR TC2 6-month COA', source: 'conference', stage: 'qualified', companyName: 'Shell Trading', vesselType: 'MR', cargoType: 'Clean Products', route: 'UKC-USAC', estimatedValue: 720000, probability: 30, weightedValue: 216000, expectedClose: new Date('2026-03-01'), assignedTo: 'chartering_head', notes: 'Met at Singapore Maritime Week. Interested in COA for CPP.', organizationId: org.id },
    });
    const lead4 = await prisma.lead.create({
      data: { title: 'Supramax Grain ECSA-Continent', source: 'referral', stage: 'prospect', companyName: 'Bunge Ltd', vesselType: 'Supramax', cargoType: 'Grain', route: 'ECSA-Continent', estimatedValue: 145000, probability: 15, weightedValue: 21750, expectedClose: new Date('2026-03-15'), assignedTo: 'chartering_desk_2', organizationId: org.id },
    });
    await prisma.lead.create({
      data: { title: 'Handysize Med Cement', source: 'email', stage: 'lost', companyName: 'Heidelberg Materials', vesselType: 'Handysize', cargoType: 'Cement', route: 'Turkey-Algeria', estimatedValue: 85000, probability: 0, weightedValue: 0, actualClose: new Date('2026-01-20'), lostReason: 'price', notes: 'Lost to competitor — undercut by $2/mt', organizationId: org.id },
    });
    console.log('  Leads: 5 seeded');

    // Lead Activities
    await prisma.leadActivity.createMany({
      data: [
        { leadId: lead1.id, type: 'call', title: 'Initial rate discussion with Cargill', description: 'Discussed WS rates for AG-Japan. They want WS55-58 range.', status: 'completed', completedAt: new Date('2026-01-25'), assignedTo: 'chartering_head', priority: 'high', outcome: 'They will revert with firm cargo details by EOD Monday', organizationId: org.id },
        { leadId: lead1.id, type: 'follow_up', title: 'Send revised offer with commission terms', dueDate: new Date('2026-02-01'), status: 'pending', assignedTo: 'chartering_head', priority: 'urgent', organizationId: org.id },
        { leadId: lead2.id, type: 'email', title: 'Send vessel particulars to Trafigura', description: 'Stellar Pioneer details + performance warranty', status: 'completed', completedAt: new Date('2026-01-28'), assignedTo: 'chartering_desk_1', priority: 'high', outcome: 'Vessel accepted subject to vetting', organizationId: org.id },
        { leadId: lead2.id, type: 'task', title: 'Run voyage estimate for Richards Bay-Qingdao', dueDate: new Date('2026-02-02'), status: 'pending', assignedTo: 'chartering_desk_1', priority: 'medium', organizationId: org.id },
        { leadId: lead3.id, type: 'meeting', title: 'Shell COA terms discussion', description: 'Zoom call to discuss COA structure, liftings, and pricing mechanism', dueDate: new Date('2026-02-10'), status: 'pending', assignedTo: 'chartering_head', priority: 'high', organizationId: org.id },
        { leadId: lead4.id, type: 'task', title: 'Research Bunge fixture history', description: 'Check Bunge fixture patterns on ECSA-Continent route', dueDate: new Date('2026-02-05'), status: 'pending', assignedTo: 'chartering_desk_2', priority: 'low', organizationId: org.id },
      ],
    });
    console.log('  LeadActivities: 6 seeded');

    // Customer Profiles
    await prisma.customerProfile.createMany({
      data: [
        { companyId: cargill?.id ?? 'cargill', companyName: cargill?.name ?? 'Cargill International SA', customerSince: new Date('2022-03-15'), totalFixtures: 28, totalRevenue: 7840000, avgFixtureValue: 280000, preferredRoutes: ['AG-Japan', 'AG-China', 'USG-Europe'], preferredVessels: ['VLCC', 'Suezmax', 'Aframax'], preferredCargoes: ['Crude Oil', 'Fuel Oil', 'Grain'], avgPaymentDays: 22, outstandingAmount: 285000, creditRating: 'A', relationshipScore: 92, lastFixtureDate: new Date('2026-01-15'), lastContactDate: new Date('2026-01-30'), tags: ['key-account', 'multi-trade'], organizationId: org.id },
        { companyId: trafigura?.id ?? 'trafigura', companyName: trafigura?.name ?? 'Trafigura Maritime', customerSince: new Date('2023-06-01'), totalFixtures: 14, totalRevenue: 3220000, avgFixtureValue: 230000, preferredRoutes: ['WAF-China', 'Richards Bay-Qingdao', 'AG-India'], preferredVessels: ['Capesize', 'Supramax'], preferredCargoes: ['Coal', 'Iron Ore', 'Crude Oil'], avgPaymentDays: 28, outstandingAmount: 195000, creditRating: 'B', relationshipScore: 74, lastFixtureDate: new Date('2026-01-10'), lastContactDate: new Date('2026-01-29'), riskFlags: ['pep-exposure'], tags: ['growing-account'], organizationId: org.id },
        { companyId: bluewater?.id ?? 'bluewater', companyName: bluewater?.name ?? 'Blue Water Shipping', customerSince: new Date('2024-09-01'), totalFixtures: 3, totalRevenue: 420000, avgFixtureValue: 140000, preferredRoutes: ['Scandinavia-Baltic'], preferredVessels: ['Handysize'], preferredCargoes: ['General Cargo', 'Steel'], avgPaymentDays: 35, outstandingAmount: 0, creditRating: 'C', relationshipScore: 45, lastFixtureDate: new Date('2025-11-20'), lastContactDate: new Date('2026-01-28'), tags: ['small-account', 'cha-partner'], organizationId: org.id },
      ],
    });
    console.log('  CustomerProfiles: 3 seeded');
  } else {
    console.log(`  Leads: already seeded (${existingLeads})`);
  }

  // ==========================================
  // === CARBON & SUSTAINABILITY (Phase 22) ===
  // ==========================================
  const existingEts = await prisma.etsAllowance.count();
  if (existingEts === 0) {
    // EU ETS Allowances
    await prisma.etsAllowance.createMany({
      data: [
        { vesselName: 'Stellar Pioneer', year: 2026, type: 'allocation', quantity: 1200, pricePerUnit: 0, totalCost: 0, source: 'allocation', status: 'active', expiryDate: new Date('2026-12-31'), notes: 'Free allocation based on 2023 baseline', organizationId: org.id },
        { vesselName: 'Stellar Pioneer', year: 2026, type: 'purchase', quantity: 500, pricePerUnit: 78.50, totalCost: 39250, currency: 'EUR', source: 'EEX', status: 'active', tradeReference: 'EEX-2026-04521', notes: 'Purchased to cover expected deficit', organizationId: org.id },
        { vesselName: 'Ocean Voyager', year: 2026, type: 'allocation', quantity: 950, pricePerUnit: 0, totalCost: 0, source: 'allocation', status: 'active', expiryDate: new Date('2026-12-31'), organizationId: org.id },
        { vesselName: 'Stellar Pioneer', year: 2025, type: 'surrender', quantity: 1580, pricePerUnit: 72.30, totalCost: 114234, source: 'allocation', status: 'surrendered', surrenderDate: new Date('2026-01-15'), notes: '2025 compliance surrender', organizationId: org.id },
        { vesselName: null, year: 2025, type: 'carry_over', quantity: 120, pricePerUnit: 72.30, totalCost: 8676, source: 'carry_forward', status: 'active', notes: 'Surplus from 2025 carried forward', organizationId: org.id },
      ],
    });
    console.log('  EtsAllowances: 5 seeded');

    // IMO DCS Reports
    await prisma.imoDcsReport.createMany({
      data: [
        { vesselId: 'stellar-1', vesselName: 'Stellar Pioneer', imoNumber: '9876543', year: 2025, reportingPeriod: '2025-01-01 to 2025-12-31', flagState: 'MH', grossTonnage: 81500, netTonnage: 52000, dwt: 160000, distanceTravelled: 48500, hoursUnderway: 5840, fuelConsumption: { HFO: { consumption: 12800, co2Factor: 3.114 }, MDO: { consumption: 950, co2Factor: 3.206 } }, totalCo2: 42916, transportWork: 6720000000, eeoi: 6.39, ciiRating: 'C', ciiValue: 4.28, ciiRequired: 4.65, submissionDate: new Date('2026-01-20'), verifiedBy: 'ClassNK', verificationDate: new Date('2026-01-25'), status: 'verified', organizationId: org.id },
        { vesselId: 'ocean-1', vesselName: 'Ocean Voyager', imoNumber: '9654321', year: 2025, reportingPeriod: '2025-01-01 to 2025-12-31', flagState: 'PA', grossTonnage: 43200, netTonnage: 28000, dwt: 75000, distanceTravelled: 52000, hoursUnderway: 6200, fuelConsumption: { HFO: { consumption: 8200, co2Factor: 3.114 }, MDO: { consumption: 620, co2Factor: 3.206 } }, totalCo2: 27524, transportWork: 3510000000, eeoi: 7.84, ciiRating: 'D', ciiValue: 7.06, ciiRequired: 5.52, status: 'submitted', submissionDate: new Date('2026-01-28'), notes: 'CII rating D — corrective action plan required', organizationId: org.id },
      ],
    });
    console.log('  ImoDcsReports: 2 seeded');

    // ESG Reports
    await prisma.esgReport.createMany({
      data: [
        { reportingPeriod: '2025', year: 2025, scope1Emissions: 70440, scope2Emissions: 180, scope3Emissions: 12500, totalEmissions: 83120, emissionIntensity: 5.82, renewableEnergy: 2.5, shorePowerHours: 120, wasteRecycled: 45, spillIncidents: 0, safetyIncidents: 1, diversityScore: 38, trainingHours: 4200, communityInvestment: 15000, carbonOffset: 500, offsetCost: 12500, poseidonScore: -2.1, seaCargoCharter: -1.8, status: 'published', publishedDate: new Date('2026-01-30'), organizationId: org.id },
        { reportingPeriod: '2024', year: 2024, scope1Emissions: 75200, scope2Emissions: 195, scope3Emissions: 13200, totalEmissions: 88595, emissionIntensity: 6.15, renewableEnergy: 1.8, shorePowerHours: 80, wasteRecycled: 40, spillIncidents: 0, safetyIncidents: 2, diversityScore: 35, trainingHours: 3800, communityInvestment: 10000, carbonOffset: 200, offsetCost: 4400, poseidonScore: -4.5, seaCargoCharter: -3.2, status: 'published', publishedDate: new Date('2025-02-15'), organizationId: org.id },
        { reportingPeriod: 'Q1-2026', year: 2026, quarter: 1, scope1Emissions: 16800, scope2Emissions: 45, scope3Emissions: 3100, totalEmissions: 19945, emissionIntensity: 5.65, renewableEnergy: 3.0, spillIncidents: 0, safetyIncidents: 0, trainingHours: 1100, status: 'draft', notes: 'Q1 2026 preliminary data — pending fuel reconciliation', organizationId: org.id },
      ],
    });
    console.log('  EsgReports: 3 seeded');

    // Carbon Credits
    await prisma.carbonCredit.createMany({
      data: [
        { projectName: 'Blue Carbon Mangrove Restoration — Sundarbans', registry: 'verra', creditType: 'removal', vintage: 2025, quantity: 500, pricePerTonne: 25.00, totalCost: 12500, status: 'retired', retiredDate: new Date('2026-01-15'), retiredForVessel: 'Stellar Pioneer', serialNumbers: 'VCS-2025-SUND-001-500', verificationStandard: 'VCS', projectCountry: 'IN', organizationId: org.id },
        { projectName: 'Wind Farm — Tamil Nadu', registry: 'gold_standard', creditType: 'avoidance', vintage: 2025, quantity: 200, pricePerTonne: 22.00, totalCost: 4400, status: 'retired', retiredDate: new Date('2025-12-28'), serialNumbers: 'GS-2025-TN-WIND-001-200', verificationStandard: 'GS', projectCountry: 'IN', organizationId: org.id },
        { projectName: 'Cookstove Distribution — Kenya', registry: 'gold_standard', creditType: 'reduction', vintage: 2026, quantity: 1000, pricePerTonne: 18.50, totalCost: 18500, status: 'active', serialNumbers: 'GS-2026-KEN-COOK-001-1000', verificationStandard: 'GS', projectCountry: 'KE', notes: 'Pre-purchased for 2026 compliance', organizationId: org.id },
        { projectName: 'REDD+ Amazonia Forest Protection', registry: 'verra', creditType: 'avoidance', vintage: 2025, quantity: 300, pricePerTonne: 15.00, totalCost: 4500, status: 'active', serialNumbers: 'VCS-2025-AMZ-REDD-001-300', verificationStandard: 'VCS', projectCountry: 'BR', organizationId: org.id },
      ],
    });
    console.log('  CarbonCredits: 4 seeded');
  } else {
    console.log(`  EtsAllowances: already seeded (${existingEts})`);
  }

  // ==========================================
  // === ANALYTICS & BI (Phase 16) ===
  // ==========================================
  const existingForecasts = await prisma.revenueForecast.count();
  if (existingForecasts === 0) {
    // Revenue Forecasts — monthly projections for 2026
    await prisma.revenueForecast.createMany({
      data: [
        { period: 'Jan-2026', year: 2026, month: 1, category: 'freight', projectedAmount: 520000, actualAmount: 545000, variance: 25000, confidence: 85, methodology: 'historical_avg', organizationId: org.id },
        { period: 'Jan-2026', year: 2026, month: 1, category: 'hire', projectedAmount: 180000, actualAmount: 175000, variance: -5000, confidence: 90, methodology: 'weighted_pipeline', organizationId: org.id },
        { period: 'Jan-2026', year: 2026, month: 1, category: 'demurrage', projectedAmount: 45000, actualAmount: 62000, variance: 17000, confidence: 60, methodology: 'historical_avg', organizationId: org.id },
        { period: 'Jan-2026', year: 2026, month: 1, category: 'commission', projectedAmount: 38000, actualAmount: 41000, variance: 3000, confidence: 80, methodology: 'weighted_pipeline', organizationId: org.id },
        { period: 'Feb-2026', year: 2026, month: 2, category: 'freight', projectedAmount: 480000, confidence: 75, methodology: 'regression', organizationId: org.id },
        { period: 'Feb-2026', year: 2026, month: 2, category: 'hire', projectedAmount: 180000, confidence: 88, methodology: 'weighted_pipeline', organizationId: org.id },
        { period: 'Feb-2026', year: 2026, month: 2, category: 'demurrage', projectedAmount: 35000, confidence: 55, methodology: 'historical_avg', organizationId: org.id },
        { period: 'Mar-2026', year: 2026, month: 3, category: 'freight', projectedAmount: 550000, confidence: 65, methodology: 'regression', organizationId: org.id },
      ],
    });
    console.log('  RevenueForecasts: 8 seeded');

    // Fixture Analytics — monthly snapshots
    await prisma.fixtureAnalytics.createMany({
      data: [
        { period: 'Jan-2026', periodType: 'monthly', year: 2026, month: 1, vesselType: 'VLCC', route: 'AG-Japan', cargoType: 'Crude Oil', fixtureCount: 3, totalRevenue: 855000, avgFreightRate: 285000, avgCommission: 2.5, avgLaytime: 4.2, avgDemurrage: 18500, avgTce: 42500, marketShare: 1.2, winRate: 60, avgNegDays: 5, organizationId: org.id },
        { period: 'Jan-2026', periodType: 'monthly', year: 2026, month: 1, vesselType: 'Capesize', route: 'Richards Bay-Qingdao', cargoType: 'Coal', fixtureCount: 2, totalRevenue: 390000, avgFreightRate: 195000, avgCommission: 3.75, avgLaytime: 5.8, avgDemurrage: 22000, avgTce: 28500, marketShare: 0.8, winRate: 50, avgNegDays: 7, organizationId: org.id },
        { period: 'Jan-2026', periodType: 'monthly', year: 2026, month: 1, vesselType: 'Supramax', route: 'ECSA-Continent', cargoType: 'Grain', fixtureCount: 1, totalRevenue: 145000, avgFreightRate: 145000, avgCommission: 3.0, avgLaytime: 3.5, avgDemurrage: 8500, avgTce: 18500, marketShare: 0.5, winRate: 40, avgNegDays: 4, organizationId: org.id },
        { period: 'Dec-2025', periodType: 'monthly', year: 2025, month: 12, vesselType: 'VLCC', route: 'AG-Japan', cargoType: 'Crude Oil', fixtureCount: 4, totalRevenue: 1120000, avgFreightRate: 280000, avgCommission: 2.5, avgLaytime: 3.8, avgDemurrage: 15000, avgTce: 45000, marketShare: 1.5, winRate: 67, avgNegDays: 4, organizationId: org.id },
      ],
    });
    console.log('  FixtureAnalytics: 4 seeded');

    // Cash Flow Entries
    await prisma.cashFlowEntry.createMany({
      data: [
        { date: new Date('2026-01-05'), type: 'inflow', category: 'freight_received', description: 'Freight payment — Cargill AG-Japan V2601', amount: 285000, currency: 'USD', amountUsd: 285000, voyageRef: 'V-2026-001', vesselName: 'Stellar Pioneer', counterparty: 'Cargill International SA', isProjected: false, isReconciled: true, organizationId: org.id },
        { date: new Date('2026-01-10'), type: 'inflow', category: 'hire_received', description: 'TC hire — Ocean Voyager Jan instalment', amount: 175000, currency: 'USD', amountUsd: 175000, vesselName: 'Ocean Voyager', counterparty: 'Shell Trading', isProjected: false, isReconciled: true, organizationId: org.id },
        { date: new Date('2026-01-15'), type: 'outflow', category: 'bunker_payment', description: 'Bunker purchase — Fujairah VLSFO', amount: -125000, currency: 'USD', amountUsd: -125000, vesselName: 'Stellar Pioneer', counterparty: 'Aegean Bunkering', isProjected: false, isReconciled: true, organizationId: org.id },
        { date: new Date('2026-01-20'), type: 'outflow', category: 'pda_payment', description: 'PDA — Ras Tanura port charges', amount: -42000, currency: 'USD', amountUsd: -42000, voyageRef: 'V-2026-001', vesselName: 'Stellar Pioneer', counterparty: 'J M Baxi & Co', isProjected: false, isReconciled: false, organizationId: org.id },
        { date: new Date('2026-01-25'), type: 'inflow', category: 'demurrage_received', description: 'Demurrage collection — Ras Tanura delay', amount: 62000, currency: 'USD', amountUsd: 62000, voyageRef: 'V-2026-001', counterparty: 'Cargill International SA', isProjected: false, isReconciled: false, organizationId: org.id },
        { date: new Date('2026-01-28'), type: 'outflow', category: 'crew_wages', description: 'Jan crew wages — all vessels', amount: -85000, currency: 'USD', amountUsd: -85000, isProjected: false, isReconciled: true, organizationId: org.id },
        { date: new Date('2026-01-30'), type: 'outflow', category: 'insurance_premium', description: 'Q1 2026 P&I club premium', amount: -95000, currency: 'USD', amountUsd: -95000, isProjected: false, isReconciled: false, organizationId: org.id },
        { date: new Date('2026-02-05'), type: 'inflow', category: 'freight_received', description: 'Projected — Trafigura Coal fixture', amount: 195000, currency: 'USD', amountUsd: 195000, vesselName: 'Stellar Pioneer', counterparty: 'Trafigura Maritime', isProjected: true, organizationId: org.id },
        { date: new Date('2026-02-10'), type: 'inflow', category: 'hire_received', description: 'Projected — Ocean Voyager Feb hire', amount: 175000, currency: 'USD', amountUsd: 175000, vesselName: 'Ocean Voyager', isProjected: true, organizationId: org.id },
        { date: new Date('2026-02-15'), type: 'outflow', category: 'ets_payment', description: 'Projected — EU ETS Q4 2025 surrender', amount: -114234, currency: 'EUR', amountUsd: -122000, isProjected: true, organizationId: org.id },
      ],
    });
    console.log('  CashFlowEntries: 10 seeded');

    // Tonnage Heatmap Snapshots
    const snapDate = new Date('2026-01-31');
    await prisma.tonnageHeatmap.createMany({
      data: [
        { snapshotDate: snapDate, region: 'AG', vesselType: 'VLCC', availableCount: 18, onPassageCount: 12, totalCount: 30, avgAge: 8.5, demandCount: 22, supplyDemandRatio: 0.82, avgRate: 285000, weekOverWeek: -3.2, organizationId: org.id },
        { snapshotDate: snapDate, region: 'AG', vesselType: 'Suezmax', availableCount: 8, onPassageCount: 5, totalCount: 13, avgAge: 10.2, demandCount: 10, supplyDemandRatio: 0.80, avgRate: 195000, weekOverWeek: 1.5, organizationId: org.id },
        { snapshotDate: snapDate, region: 'WAF', vesselType: 'Suezmax', availableCount: 12, onPassageCount: 8, totalCount: 20, avgAge: 9.1, demandCount: 14, supplyDemandRatio: 0.86, avgRate: 185000, weekOverWeek: -1.8, organizationId: org.id },
        { snapshotDate: snapDate, region: 'USG', vesselType: 'VLCC', availableCount: 5, onPassageCount: 4, totalCount: 9, avgAge: 7.8, demandCount: 8, supplyDemandRatio: 0.63, avgRate: 310000, weekOverWeek: 5.2, organizationId: org.id },
        { snapshotDate: snapDate, region: 'ECSA', vesselType: 'Capesize', availableCount: 22, onPassageCount: 15, totalCount: 37, avgAge: 11.5, demandCount: 18, supplyDemandRatio: 1.22, avgRate: 175000, weekOverWeek: -2.1, organizationId: org.id },
        { snapshotDate: snapDate, region: 'SEA', vesselType: 'Supramax', availableCount: 35, onPassageCount: 20, totalCount: 55, avgAge: 12.0, demandCount: 28, supplyDemandRatio: 1.25, avgRate: 125000, weekOverWeek: 0.8, organizationId: org.id },
        { snapshotDate: snapDate, region: 'NOPAC', vesselType: 'Panamax', availableCount: 14, onPassageCount: 8, totalCount: 22, avgAge: 13.2, demandCount: 20, supplyDemandRatio: 0.70, avgRate: 155000, weekOverWeek: 4.1, organizationId: org.id },
        { snapshotDate: snapDate, region: 'Med', vesselType: 'Handysize', availableCount: 25, onPassageCount: 10, totalCount: 35, avgAge: 14.5, demandCount: 22, supplyDemandRatio: 1.14, avgRate: 95000, weekOverWeek: -0.5, organizationId: org.id },
      ],
    });
    console.log('  TonnageHeatmaps: 8 seeded');
  } else {
    console.log(`  RevenueForecasts: already seeded (${existingForecasts})`);
  }

  // ==========================================
  // === HRMS MODULE (Phase 20) ===
  // ==========================================
  const existingEmployees = await prisma.employee.count();
  if (existingEmployees === 0) {
    // Employees
    const emp1 = await prisma.employee.create({
      data: { employeeCode: 'EMP-001', firstName: 'Rajesh', lastName: 'Sharma', email: 'rajesh.sharma@mari8x-demo.com', phone: '+919876543210', department: 'chartering', designation: 'Head of Chartering', role: 'management', dateOfJoining: new Date('2020-04-15'), employmentType: 'full_time', status: 'active', officeLocation: 'Mumbai', salary: 250000, currency: 'INR', organizationId: org.id },
    });
    const emp2 = await prisma.employee.create({
      data: { employeeCode: 'EMP-002', firstName: 'Sarah', lastName: 'Chen', email: 'sarah.chen@mari8x-demo.com', phone: '+6591234567', department: 'operations', designation: 'Operations Manager', role: 'management', dateOfJoining: new Date('2021-08-01'), employmentType: 'full_time', status: 'active', officeLocation: 'Singapore', salary: 8500, currency: 'SGD', organizationId: org.id },
    });
    const emp3 = await prisma.employee.create({
      data: { employeeCode: 'EMP-003', firstName: 'Amit', lastName: 'Patel', email: 'amit.patel@mari8x-demo.com', phone: '+919812345678', department: 'chartering', designation: 'Senior Chartering Analyst', role: 'office_staff', reportingTo: emp1.id, dateOfJoining: new Date('2022-01-10'), employmentType: 'full_time', status: 'active', officeLocation: 'Mumbai', salary: 120000, currency: 'INR', organizationId: org.id },
    });
    const emp4 = await prisma.employee.create({
      data: { employeeCode: 'EMP-004', firstName: 'James', lastName: 'Wilson', email: 'james.wilson@mari8x-demo.com', phone: '+442071234567', department: 'snp', designation: 'S&P Broker', role: 'office_staff', dateOfJoining: new Date('2023-03-01'), employmentType: 'full_time', status: 'active', officeLocation: 'London', salary: 6500, currency: 'GBP', organizationId: org.id },
    });
    await prisma.employee.create({
      data: { employeeCode: 'EMP-005', firstName: 'Priya', lastName: 'Nair', email: 'priya.nair@mari8x-demo.com', phone: '+919945678901', department: 'finance', designation: 'Accounts Executive', role: 'office_staff', dateOfJoining: new Date('2023-09-15'), employmentType: 'full_time', status: 'active', officeLocation: 'Mumbai', salary: 65000, currency: 'INR', organizationId: org.id },
    });
    await prisma.employee.create({
      data: { employeeCode: 'EMP-006', firstName: 'Ahmed', lastName: 'Al-Rashid', email: 'ahmed@mari8x-demo.com', department: 'operations', designation: 'Operations Coordinator', role: 'office_staff', reportingTo: emp2.id, dateOfJoining: new Date('2024-02-01'), employmentType: 'full_time', status: 'active', officeLocation: 'Dubai', salary: 15000, currency: 'AED', organizationId: org.id },
    });
    console.log('  Employees: 6 seeded');

    // Leave Balances — 2026
    await prisma.leaveBalance.createMany({
      data: [
        { employeeId: emp1.id, year: 2026, leaveType: 'casual', entitled: 12, taken: 2, pending: 0, balance: 10, organizationId: org.id },
        { employeeId: emp1.id, year: 2026, leaveType: 'sick', entitled: 6, taken: 0, pending: 0, balance: 6, organizationId: org.id },
        { employeeId: emp1.id, year: 2026, leaveType: 'earned', entitled: 15, taken: 0, pending: 0, balance: 15, carriedForward: 5, organizationId: org.id },
        { employeeId: emp2.id, year: 2026, leaveType: 'casual', entitled: 12, taken: 1, pending: 1, balance: 10, organizationId: org.id },
        { employeeId: emp3.id, year: 2026, leaveType: 'casual', entitled: 12, taken: 3, pending: 0, balance: 9, organizationId: org.id },
        { employeeId: emp4.id, year: 2026, leaveType: 'casual', entitled: 12, taken: 0, pending: 0, balance: 12, organizationId: org.id },
      ],
    });
    console.log('  LeaveBalances: 6 seeded');

    // Attendance Logs — Jan 2026 sample
    const janDays = [6, 7, 8, 9, 10, 13, 14, 15, 16, 17, 20, 21, 22, 23, 24, 27, 28, 29, 30, 31];
    const attendanceData = [];
    for (const day of janDays.slice(0, 10)) {
      attendanceData.push(
        { employeeId: emp1.id, date: new Date(`2026-01-${String(day).padStart(2, '0')}`), checkIn: new Date(`2026-01-${String(day).padStart(2, '0')}T09:00:00`), checkOut: new Date(`2026-01-${String(day).padStart(2, '0')}T18:30:00`), hoursWorked: 9.5, status: 'present', organizationId: org.id },
      );
    }
    attendanceData.push(
      { employeeId: emp1.id, date: new Date('2026-01-20'), status: 'on_leave', leaveType: 'casual', organizationId: org.id },
      { employeeId: emp1.id, date: new Date('2026-01-21'), status: 'on_leave', leaveType: 'casual', organizationId: org.id },
      { employeeId: emp3.id, date: new Date('2026-01-15'), status: 'work_from_home', checkIn: new Date('2026-01-15T09:30:00'), checkOut: new Date('2026-01-15T18:00:00'), hoursWorked: 8.5, organizationId: org.id },
    );
    await prisma.attendanceLog.createMany({ data: attendanceData });
    console.log(`  AttendanceLogs: ${attendanceData.length} seeded`);

    // Payslips — Jan 2026
    await prisma.payslip.createMany({
      data: [
        { employeeId: emp1.id, month: 1, year: 2026, basic: 100000, hra: 50000, da: 10000, specialAllow: 90000, grossEarnings: 250000, pf: 1800, esi: 0, tds: 45000, professionalTax: 200, totalDeductions: 47000, netPay: 203000, currency: 'INR', status: 'paid', paidDate: new Date('2026-01-31'), paymentRef: 'NEFT-2026-JAN-001', organizationId: org.id },
        { employeeId: emp3.id, month: 1, year: 2026, basic: 48000, hra: 24000, da: 4800, specialAllow: 43200, grossEarnings: 120000, pf: 1800, esi: 0, tds: 12500, professionalTax: 200, totalDeductions: 14500, netPay: 105500, currency: 'INR', status: 'paid', paidDate: new Date('2026-01-31'), paymentRef: 'NEFT-2026-JAN-003', organizationId: org.id },
      ],
    });
    console.log('  Payslips: 2 seeded');

    // Training Records
    await prisma.trainingRecord.createMany({
      data: [
        { employeeId: emp1.id, employeeName: 'Rajesh Sharma', trainingTitle: 'Advanced Chartering Negotiation', category: 'technical', provider: 'ICS London', startDate: new Date('2026-02-15'), endDate: new Date('2026-02-17'), duration: 24, status: 'scheduled', cost: 2500, currency: 'GBP', organizationId: org.id },
        { employeeId: emp2.id, employeeName: 'Sarah Chen', trainingTitle: 'ISM Code Internal Auditor', category: 'ISM', provider: 'DNV GL Academy', startDate: new Date('2025-11-10'), endDate: new Date('2025-11-12'), duration: 20, status: 'completed', score: 88, passFail: 'pass', certificateRef: 'ISM-INT-2025-4521', expiresAt: new Date('2028-11-10'), cost: 1800, currency: 'SGD', organizationId: org.id },
        { employeeId: emp3.id, employeeName: 'Amit Patel', trainingTitle: 'SOLAS Safety Awareness', category: 'SOLAS', provider: 'Maritime Training Institute Mumbai', startDate: new Date('2025-09-05'), endDate: new Date('2025-09-05'), duration: 8, status: 'completed', score: 92, passFail: 'pass', certificateRef: 'SOL-2025-MUM-891', expiresAt: new Date('2027-09-05'), cost: 5000, currency: 'INR', organizationId: org.id },
        { employeeId: emp4.id, employeeName: 'James Wilson', trainingTitle: 'Sanctions Compliance for Maritime', category: 'compliance', provider: 'BIMCO Academy', startDate: new Date('2026-01-20'), endDate: new Date('2026-01-21'), duration: 16, status: 'completed', score: 85, passFail: 'pass', certificateRef: 'SANC-2026-BIMCO-112', cost: 1200, currency: 'GBP', organizationId: org.id },
        { employeeId: emp2.id, employeeName: 'Sarah Chen', trainingTitle: 'MARPOL Annex VI — SOx/NOx Regulations', category: 'MARPOL', provider: 'Singapore Polytechnic', startDate: new Date('2026-03-10'), duration: 12, status: 'scheduled', cost: 800, currency: 'SGD', organizationId: org.id },
      ],
    });
    console.log('  TrainingRecords: 5 seeded');
  } else {
    console.log(`  Employees: already seeded (${existingEmployees})`);
  }

  // === Communication Hub: Email Messages ===
  const existingEmails = await prisma.emailMessage.count();
  if (existingEmails === 0) {
    await prisma.emailMessage.createMany({
      data: [
        {
          folder: 'inbox', direction: 'inbound',
          fromAddress: 'fixtures@swissmarine.ch', fromName: 'Swiss Marine Fixtures',
          toAddresses: ['ops@ankr.in'], ccAddresses: [],  bccAddresses: [],
          subject: 'Re: M/V ANKR GLORY — Coal Cargo ex Richards Bay / Mundra — Laycan 15-20 Feb',
          bodyText: 'Dear Ops, We confirm interest in the above vessel for coal cargo 55,000 MT +/- 10%. Load port Richards Bay, discharge Mundra. Rate: USD 14.50 pmt FIOST. Laycan 15-20 Feb 2026. Demurrage USD 18,000 PDPR. Please confirm soonest. Regards, Swiss Marine',
          snippet: 'We confirm interest in the above vessel for coal cargo 55,000 MT...',
          isRead: false, isStarred: true, hasAttachments: false, attachmentNames: [],
          aiSummary: 'Fixture inquiry for M/V ANKR GLORY: 55k MT coal, Richards Bay to Mundra, USD 14.50/MT',
          aiSentiment: 'positive', aiCategory: 'fixture_negotiation', aiPriority: 'high',
          receivedAt: new Date('2026-01-30T14:30:00Z'), organizationId: org.id,
        },
        {
          folder: 'inbox', direction: 'inbound',
          fromAddress: 'da@portmumbai.gov.in', fromName: 'Mumbai Port DA Desk',
          toAddresses: ['accounts@ankr.in'], ccAddresses: ['ops@ankr.in'], bccAddresses: [],
          subject: 'PDA — M/V PACIFIC TRADER — Mumbai Port Call #VY-2026-018',
          bodyText: 'Dear Sir/Madam, Please find attached the Preliminary Disbursement Account for vessel PACIFIC TRADER expected ETA 02 Feb 2026. Total estimated: USD 45,200. Kindly arrange funds minimum 48 hours before ETA. Breakdown: Port dues USD 12,000, Pilotage USD 4,500, Towage USD 6,800, Berth hire USD 3,200, Agency fees USD 2,500, Others USD 16,200.',
          snippet: 'Please find attached the Preliminary Disbursement Account for vessel PACIFIC TRADER...',
          isRead: true, isStarred: false, hasAttachments: true, attachmentNames: ['PDA_PACIFIC_TRADER_Mumbai_Feb2026.pdf'],
          aiSummary: 'PDA request for M/V PACIFIC TRADER at Mumbai: USD 45,200 total, funds needed by 31 Jan',
          aiSentiment: 'neutral', aiCategory: 'da_request', aiPriority: 'high',
          receivedAt: new Date('2026-01-29T09:15:00Z'), organizationId: org.id,
        },
        {
          folder: 'inbox', direction: 'inbound',
          fromAddress: 'chartering@cargill.com', fromName: 'Cargill Ocean Transportation',
          toAddresses: ['chartering@ankr.in'], ccAddresses: [], bccAddresses: [],
          subject: 'URGENT: Cargo Enquiry — 70,000 MT Iron Ore — Goa/Qingdao — March lifting',
          bodyText: 'Team, We have urgent requirement for Supramax/Ultramax tonnage for 70,000 MT iron ore fines. Load: Mormugao (Goa). Disch: Qingdao. Laycan: 05-15 March 2026. Freight ideas around USD 18-19 pmt. Please quote your best. Time-sensitive — need responses by COB today.',
          snippet: 'We have urgent requirement for Supramax/Ultramax tonnage for 70,000 MT iron ore fines...',
          isRead: false, isStarred: false, hasAttachments: false, attachmentNames: [],
          aiSummary: 'Urgent cargo enquiry: 70k MT iron ore, Goa to Qingdao, March laycan, ~USD 18-19/MT',
          aiSentiment: 'urgent', aiCategory: 'cargo_enquiry', aiPriority: 'high',
          receivedAt: new Date('2026-01-31T07:45:00Z'), organizationId: org.id,
        },
        {
          folder: 'sent', direction: 'outbound',
          fromAddress: 'ops@ankr.in', fromName: 'ANKR Maritime Operations',
          toAddresses: ['fixtures@swissmarine.ch'], ccAddresses: ['chartering@ankr.in'], bccAddresses: [],
          subject: 'Re: M/V ANKR GLORY — Coal Cargo — Counter Offer',
          bodyText: 'Dear Swiss Marine, Thank you for your interest. We counter at USD 15.25 pmt FIOST basis 55,000 MT +/- 10% MOLOO. Demurrage USD 20,000 PDPR. All other terms as per previous. Vessel opens Richards Bay around 12 Feb. Please revert. Best regards, ANKR Maritime',
          snippet: 'Thank you for your interest. We counter at USD 15.25 pmt FIOST...',
          isRead: true, isStarred: false, hasAttachments: false, attachmentNames: [],
          aiSummary: 'Counter-offer sent: USD 15.25/MT for ANKR GLORY coal fixture',
          aiSentiment: 'positive', aiCategory: 'fixture_negotiation', aiPriority: 'medium',
          receivedAt: new Date('2026-01-30T16:00:00Z'), organizationId: org.id,
        },
        {
          folder: 'inbox', direction: 'inbound',
          fromAddress: 'compliance@bimco.org', fromName: 'BIMCO Sanctions Alert',
          toAddresses: ['compliance@ankr.in'], ccAddresses: [], bccAddresses: [],
          subject: 'Sanctions Alert: New OFAC Designations — Maritime Sector — 28 Jan 2026',
          bodyText: 'BIMCO Sanctions Advisory: OFAC has designated 5 new vessels and 3 entities under Iran sanctions program effective 28 January 2026. Vessels: STAR HORIZON (IMO 9876543), GOLDEN WAVE (IMO 9654321), OCEAN PEARL (IMO 9345678). All members advised to screen counterparties and vessels immediately.',
          snippet: 'OFAC has designated 5 new vessels and 3 entities under Iran sanctions program...',
          isRead: false, isStarred: true, hasAttachments: true, attachmentNames: ['OFAC_Designations_28Jan2026.pdf'],
          aiSummary: 'BIMCO sanctions alert: 5 new OFAC-designated vessels under Iran program',
          aiSentiment: 'urgent', aiCategory: 'compliance_alert', aiPriority: 'high',
          receivedAt: new Date('2026-01-28T11:00:00Z'), organizationId: org.id,
        },
        {
          folder: 'inbox', direction: 'inbound',
          fromAddress: 'market@clarksons.com', fromName: 'Clarksons Research',
          toAddresses: ['research@ankr.in'], ccAddresses: [], bccAddresses: [],
          subject: 'Weekly Market Report — Dry Bulk — W05 2026',
          bodyText: 'BDI closed at 1,245 on Friday, down 3.2% WoW. Capesize: T/A at $12,500/day, Pacific round at $13,200/day. Panamax: ECSA/FEAST at $14,800/day. Supramax: SE Asia round at $11,500/day. Handysize: Cont/Med at $10,200/day. Coal trade firm on India/China demand. Iron ore volumes steady.',
          snippet: 'BDI closed at 1,245 on Friday, down 3.2% WoW. Capesize T/A at $12,500/day...',
          isRead: true, isStarred: false, hasAttachments: true, attachmentNames: ['Clarksons_Weekly_W05_2026.pdf'],
          aiSummary: 'BDI at 1,245 (-3.2% WoW). Capesize $12.5k/day, Panamax $14.8k/day, Supra $11.5k/day',
          aiSentiment: 'neutral', aiCategory: 'market_report', aiPriority: 'medium',
          receivedAt: new Date('2026-01-31T06:30:00Z'), organizationId: org.id,
        },
      ],
    });
    console.log('  EmailMessages: 6 seeded');
  } else {
    console.log(`  EmailMessages: already seeded (${existingEmails})`);
  }

  // === Communication Hub: Notification Digests ===
  const existingDigests = await prisma.notificationDigest.count();
  if (existingDigests === 0) {
    await prisma.notificationDigest.createMany({
      data: [
        {
          userId: admin.id, digestType: 'daily', period: '2026-01-30', status: 'sent', channel: 'email',
          totalEvents: 12,
          categories: { voyages: 3, charters: 2, alerts: 4, compliance: 1, market: 2 },
          highlights: [
            { title: 'M/V ANKR GLORY ETA updated to 12 Feb', type: 'voyage_update', priority: 'high' },
            { title: 'Charter Party CP-2026-015 executed', type: 'charter_status', priority: 'medium' },
            { title: 'OFAC sanctions alert — 5 new vessels designated', type: 'compliance', priority: 'high' },
            { title: 'Laytime clock started for VY-2026-018', type: 'laytime', priority: 'high' },
          ],
          textContent: 'Daily Digest — 30 Jan 2026\n12 events: 3 voyages, 2 charters, 4 alerts, 1 compliance, 2 market\nTop: ETA update ANKR GLORY, CP executed, OFAC alert, Laytime started',
          sentAt: new Date('2026-01-30T18:00:00Z'), deliveredAt: new Date('2026-01-30T18:01:00Z'),
          organizationId: org.id,
        },
        {
          userId: admin.id, digestType: 'daily', period: '2026-01-31', status: 'pending', channel: 'email',
          totalEvents: 8,
          categories: { voyages: 2, charters: 1, alerts: 3, market: 2 },
          highlights: [
            { title: 'Urgent cargo enquiry from Cargill — 70k MT iron ore', type: 'cargo_enquiry', priority: 'high' },
            { title: 'PDA received for PACIFIC TRADER — USD 45,200', type: 'da_request', priority: 'medium' },
          ],
          organizationId: org.id,
        },
        {
          userId: admin.id, digestType: 'weekly', period: '2026-W05', status: 'generated', channel: 'email',
          totalEvents: 47,
          categories: { voyages: 12, charters: 8, alerts: 15, compliance: 3, market: 9 },
          highlights: [
            { title: '3 new fixtures concluded this week', type: 'charter_status', priority: 'medium' },
            { title: '2 vessels entered ECA zones', type: 'compliance', priority: 'high' },
            { title: 'BDI dropped 3.2% WoW', type: 'market', priority: 'medium' },
          ],
          htmlContent: '<div style="font-family:Arial"><h2>Weekly Digest — W05 2026</h2><p>47 events across 5 categories</p></div>',
          textContent: 'Weekly Digest — W05 2026\n47 events: 12 voyages, 8 charters, 15 alerts, 3 compliance, 9 market',
          organizationId: org.id,
        },
      ],
    });
    console.log('  NotificationDigests: 3 seeded');
  } else {
    console.log(`  NotificationDigests: already seeded (${existingDigests})`);
  }

  // === Customs & CHA: Customs Declarations ===
  const existingDeclarations = await prisma.customsDeclaration.count();
  if (existingDeclarations === 0) {
    await prisma.customsDeclaration.createMany({
      data: [
        {
          declarationType: 'igm', referenceNumber: 'IGM-2026-MUM-00421',
          status: 'cleared', vesselName: 'MV PACIFIC TRADER', voyageNumber: 'VY-2026-018',
          portOfOrigin: 'Richards Bay', portOfDestination: 'Mumbai', portOfDischarge: 'Mumbai',
          cargoDescription: 'Steam Coal in bulk', hsCode: '2701', hsCodeDescription: 'Coal; briquettes, ovoids and similar solid fuels manufactured from coal',
          quantity: 55000, unit: 'MT', grossWeight: 55200, netWeight: 55000, numberOfPackages: 1, containerNumbers: [],
          invoiceValue: 4125000, invoiceCurrency: 'USD', assessableValue: 4125000, exchangeRate: 83.15,
          cif: 4312500, basicDuty: 0, socialWelfare: 0, igst: 215625, cess: 41250, totalDuty: 256875, dutyCurrency: 'INR',
          importerExporter: 'Adani Enterprises Ltd', ieCode: 'AADCA1234A', chaName: 'JM Baxi & Co',
          chaLicense: 'CHA-MUM-2019-1542', shippingLine: 'Pacific Basin Shipping', blNumber: 'PBSL-RB-MUM-2026-0045',
          filedAt: new Date('2026-01-20'), assessedAt: new Date('2026-01-22'), clearedAt: new Date('2026-01-24'),
          icegateRefId: 'ICE-MUM-2026-045821', organizationId: org.id,
        },
        {
          declarationType: 'boe', referenceNumber: 'BOE-2026-JNPT-01287',
          status: 'under_assessment', vesselName: 'MSC ELENA', voyageNumber: 'MSC-FA608E',
          portOfOrigin: 'Antwerp', portOfDestination: 'Nhava Sheva', portOfDischarge: 'Nhava Sheva',
          cargoDescription: 'Heavy machinery parts — CNC lathes and milling machines', hsCode: '8458',
          hsCodeDescription: 'Lathes for removing metal', quantity: 12, unit: 'PKG', grossWeight: 48500, netWeight: 45000,
          numberOfPackages: 12, containerNumbers: ['MSCU1234567', 'MSCU2345678', 'MSCU3456789'],
          invoiceValue: 890000, invoiceCurrency: 'EUR', assessableValue: 920000, exchangeRate: 90.25,
          cif: 83030000, basicDuty: 6227250, socialWelfare: 622725, igst: 16178399, totalDuty: 23028374, dutyCurrency: 'INR',
          importerExporter: 'Bharat Forge Ltd', ieCode: 'AABCB5678F', chaName: 'Jeena & Co',
          chaLicense: 'CHA-JNPT-2018-0892', shippingLine: 'MSC', blNumber: 'MSC-ANT-JNPT-2026-0891',
          filedAt: new Date('2026-01-28'), icegateRefId: 'ICE-JNPT-2026-128745', organizationId: org.id,
        },
        {
          declarationType: 'egm', referenceNumber: 'EGM-2026-KAND-00156',
          status: 'filed', vesselName: 'MV ANKR PRIDE', voyageNumber: 'VY-2026-022',
          portOfOrigin: 'Kandla', portOfDestination: 'Jebel Ali', portOfDischarge: 'Jebel Ali',
          cargoDescription: 'Basmati Rice in 50kg bags', hsCode: '1006', hsCodeDescription: 'Rice',
          quantity: 25000, unit: 'MT', grossWeight: 25500, netWeight: 25000, numberOfPackages: 500000,
          containerNumbers: [],
          invoiceValue: 22500000, invoiceCurrency: 'INR', importerExporter: 'KRBL Ltd',
          ieCode: 'AABCK9012L', chaName: 'Krishnai Cargo Services',
          chaLicense: 'CHA-KAN-2020-0245', shippingLine: 'ANKR Maritime', blNumber: 'ANKR-KAN-JAL-2026-0022',
          filedAt: new Date('2026-01-29'), icegateRefId: 'ICE-KAN-2026-015645', organizationId: org.id,
        },
        {
          declarationType: 'shipping_bill', referenceNumber: 'SB-2026-CHN-02891',
          status: 'assessed', vesselName: 'CMA CGM TROCADERO',
          portOfOrigin: 'Chennai', portOfDestination: 'Rotterdam',
          cargoDescription: 'Auto parts — engine components and transmission assemblies', hsCode: '8708',
          hsCodeDescription: 'Parts and accessories of motor vehicles', quantity: 450, unit: 'PKG',
          grossWeight: 12000, netWeight: 11200, numberOfPackages: 450,
          containerNumbers: ['CMAU4567890', 'CMAU5678901'],
          invoiceValue: 2800000, invoiceCurrency: 'USD', importerExporter: 'TVS Motor Company',
          ieCode: 'AABCT3456K', chaName: 'Balmer Lawrie & Co',
          chaLicense: 'CHA-CHN-2017-0421', shippingLine: 'CMA CGM', blNumber: 'CMA-CHN-RTD-2026-0156',
          filedAt: new Date('2026-01-27'), assessedAt: new Date('2026-01-28'),
          icegateRefId: 'ICE-CHN-2026-289145', organizationId: org.id,
        },
        {
          declarationType: 'igm', referenceNumber: 'IGM-2026-VIZ-00089',
          status: 'draft', vesselName: 'MV GOLDEN STAR',
          portOfOrigin: 'Dampier', portOfDestination: 'Visakhapatnam', portOfDischarge: 'Visakhapatnam',
          cargoDescription: 'Iron Ore Fines', hsCode: '2601', hsCodeDescription: 'Iron ores and concentrates',
          quantity: 170000, unit: 'MT', grossWeight: 170500, netWeight: 170000, numberOfPackages: 1,
          containerNumbers: [],
          invoiceValue: 17000000, invoiceCurrency: 'USD', importerExporter: 'Rashtriya Ispat Nigam Ltd',
          ieCode: 'AABCR2345N', chaName: 'Scan Logistics', chaLicense: 'CHA-VIZ-2021-0134',
          shippingLine: 'Berge Bulk', blNumber: 'BB-DAM-VIZ-2026-0089', organizationId: org.id,
        },
      ],
    });
    console.log('  CustomsDeclarations: 5 seeded');
  } else {
    console.log(`  CustomsDeclarations: already seeded (${existingDeclarations})`);
  }

  // === Customs & CHA: HS Code Lookups ===
  const existingHSCodes = await prisma.hSCodeLookup.count();
  if (existingHSCodes === 0) {
    await prisma.hSCodeLookup.createMany({
      data: [
        { hsCode: '2701', description: 'Coal; briquettes, ovoids and similar solid fuels', chapter: '27', heading: '2701', unit: 'MT', basicDutyRate: 0, socialWelfareRate: 0, igstRate: 5, cessRate: 0, category: 'raw_material', country: 'IN', organizationId: org.id },
        { hsCode: '2709', description: 'Petroleum oils, crude', chapter: '27', heading: '2709', unit: 'MT', basicDutyRate: 0, socialWelfareRate: 0, igstRate: 5, cessRate: 0, category: 'raw_material', country: 'IN', organizationId: org.id },
        { hsCode: '2601', description: 'Iron ores and concentrates', chapter: '26', heading: '2601', unit: 'MT', basicDutyRate: 2.5, socialWelfareRate: 10, igstRate: 5, cessRate: 0, category: 'raw_material', country: 'IN', organizationId: org.id },
        { hsCode: '1006', description: 'Rice', chapter: '10', heading: '1006', unit: 'MT', basicDutyRate: 0, socialWelfareRate: 0, igstRate: 5, cessRate: 0, isRestricted: false, exportRestricted: true, category: 'finished', country: 'IN', organizationId: org.id },
        { hsCode: '7208', description: 'Hot-rolled flat products of iron or non-alloy steel', chapter: '72', heading: '7208', unit: 'MT', basicDutyRate: 7.5, socialWelfareRate: 10, igstRate: 18, cessRate: 0, category: 'intermediate', country: 'IN', organizationId: org.id },
        { hsCode: '8458', description: 'Lathes for removing metal', chapter: '84', heading: '8458', unit: 'PKG', basicDutyRate: 7.5, socialWelfareRate: 10, igstRate: 18, cessRate: 0, category: 'capital_goods', country: 'IN', organizationId: org.id },
        { hsCode: '8708', description: 'Parts and accessories of motor vehicles', chapter: '87', heading: '8708', unit: 'PKG', basicDutyRate: 15, socialWelfareRate: 10, igstRate: 28, cessRate: 0, category: 'finished', country: 'IN', organizationId: org.id },
        { hsCode: '2523', description: 'Portland cement, aluminous cement, slag cement', chapter: '25', heading: '2523', unit: 'MT', basicDutyRate: 7.5, socialWelfareRate: 10, igstRate: 28, cessRate: 0, category: 'finished', country: 'IN', organizationId: org.id },
      ],
    });
    console.log('  HSCodeLookups: 8 seeded');
  } else {
    console.log(`  HSCodeLookups: already seeded (${existingHSCodes})`);
  }

  // === Customs & CHA: Delivery Orders ===
  const existingDOs = await prisma.deliveryOrder.count();
  if (existingDOs === 0) {
    await prisma.deliveryOrder.createMany({
      data: [
        {
          doNumber: 'DO-2026-MUM-00421', status: 'collected', vesselName: 'MV PACIFIC TRADER',
          blNumber: 'PBSL-RB-MUM-2026-0045', cargoDescription: 'Steam Coal in bulk 55,000 MT',
          containerNumbers: [], numberOfPackages: 1, grossWeight: 55200,
          consigneeName: 'Adani Enterprises Ltd', consigneeAddress: 'Adani House, Ahmedabad, Gujarat',
          chaName: 'JM Baxi & Co', shippingLine: 'Pacific Basin Shipping', freightStatus: 'prepaid',
          detentionCharges: 0, demurrageCharges: 0, otherCharges: 5000, totalCharges: 5000,
          chargeCurrency: 'INR', isPaid: true,
          issuedAt: new Date('2026-01-24'), validUntil: new Date('2026-02-07'), collectedAt: new Date('2026-01-25'),
          customsRefNumber: 'IGM-2026-MUM-00421', organizationId: org.id,
        },
        {
          doNumber: 'DO-2026-JNPT-01287', status: 'issued', vesselName: 'MSC ELENA',
          blNumber: 'MSC-ANT-JNPT-2026-0891', cargoDescription: 'Heavy machinery parts 12 packages',
          containerNumbers: ['MSCU1234567', 'MSCU2345678', 'MSCU3456789'],
          numberOfPackages: 12, grossWeight: 48500,
          consigneeName: 'Bharat Forge Ltd', consigneeAddress: 'Mundhwa, Pune, Maharashtra',
          chaName: 'Jeena & Co', shippingLine: 'MSC', freightStatus: 'collect',
          detentionCharges: 12000, demurrageCharges: 8000, otherCharges: 3500, totalCharges: 23500,
          chargeCurrency: 'INR', isPaid: false,
          issuedAt: new Date('2026-01-29'), validUntil: new Date('2026-02-12'),
          customsRefNumber: 'BOE-2026-JNPT-01287', organizationId: org.id,
        },
        {
          doNumber: 'DO-2026-CHN-00156', status: 'pending', vesselName: 'CMA CGM TROCADERO',
          blNumber: 'CMA-CHN-RTD-2026-0156', cargoDescription: 'Auto parts 450 packages',
          containerNumbers: ['CMAU4567890', 'CMAU5678901'], numberOfPackages: 450, grossWeight: 12000,
          consigneeName: 'TVS Motor Company', consigneeAddress: 'Harita Techpark, Hosur, Tamil Nadu',
          chaName: 'Balmer Lawrie & Co', shippingLine: 'CMA CGM', freightStatus: 'prepaid',
          totalCharges: 0, chargeCurrency: 'INR', isPaid: false,
          organizationId: org.id,
        },
        {
          doNumber: 'DO-2026-VIZ-00089', status: 'pending', vesselName: 'MV GOLDEN STAR',
          blNumber: 'BB-DAM-VIZ-2026-0089', cargoDescription: 'Iron Ore Fines 170,000 MT',
          containerNumbers: [], numberOfPackages: 1, grossWeight: 170500,
          consigneeName: 'Rashtriya Ispat Nigam Ltd', consigneeAddress: 'Steel Plant, Visakhapatnam, AP',
          chaName: 'Scan Logistics', shippingLine: 'Berge Bulk', freightStatus: 'prepaid',
          totalCharges: 0, chargeCurrency: 'INR', isPaid: false,
          organizationId: org.id,
        },
      ],
    });
    console.log('  DeliveryOrders: 4 seeded');
  } else {
    console.log(`  DeliveryOrders: already seeded (${existingDOs})`);
  }

  // === Customs & CHA: E-way Bills ===
  const existingEwayBills = await prisma.ewayBill.count();
  if (existingEwayBills === 0) {
    await prisma.ewayBill.createMany({
      data: [
        {
          ewayBillNumber: 'EWB311026789012', status: 'delivered',
          supplyType: 'outward', subSupplyType: 'supply', documentType: 'invoice',
          documentNumber: 'INV-2026-ANKR-0421', documentDate: new Date('2026-01-24'),
          fromName: 'JM Baxi & Co (CFS)', fromGstin: '27AABCJ1234F1ZA',
          fromAddress: 'CFS Nhava Sheva', fromCity: 'Navi Mumbai', fromState: 'Maharashtra', fromPincode: '400707',
          toName: 'Adani Enterprises Ltd', toGstin: '24AADCA1234A1ZP',
          toAddress: 'Adani House', toCity: 'Ahmedabad', toState: 'Gujarat', toPincode: '380009',
          hsCode: '2701', productDescription: 'Steam Coal',
          quantity: 55000, unit: 'MT', taxableAmount: 34293750, igstRate: 5, totalInvoiceValue: 36008437,
          transporterName: 'ANKR Transport', transporterId: '24AABCA5678B1ZG',
          transportMode: 'road', vehicleNumber: 'GJ-01-AB-1234', vehicleType: 'regular', distanceKm: 530,
          generatedAt: new Date('2026-01-24'), validUntil: new Date('2026-01-30'),
          voyageId: null, customsRefNumber: 'IGM-2026-MUM-00421', organizationId: org.id,
        },
        {
          ewayBillNumber: 'EWB311026789045', status: 'active',
          supplyType: 'inward', subSupplyType: 'import', documentType: 'invoice',
          documentNumber: 'INV-EUR-2026-0891', documentDate: new Date('2026-01-28'),
          fromName: 'Jeena & Co (CFS)', fromGstin: '27AABCJ5678G1ZB',
          fromAddress: 'CFS JNPT', fromCity: 'Navi Mumbai', fromState: 'Maharashtra', fromPincode: '400707',
          toName: 'Bharat Forge Ltd', toGstin: '27AABCB5678F1ZQ',
          toAddress: 'Mundhwa', toCity: 'Pune', toState: 'Maharashtra', toPincode: '411036',
          hsCode: '8458', productDescription: 'CNC Lathes and Milling Machines',
          quantity: 12, unit: 'PKG', taxableAmount: 83030000, igstRate: 18, totalInvoiceValue: 97975400,
          transporterName: 'TCI Express', transporterId: '27AABCT9012H1ZC',
          transportMode: 'road', vehicleNumber: 'MH-12-CD-5678', vehicleType: 'regular', distanceKm: 160,
          generatedAt: new Date('2026-01-29'), validUntil: new Date('2026-01-31'),
          customsRefNumber: 'BOE-2026-JNPT-01287', organizationId: org.id,
        },
        {
          status: 'draft', supplyType: 'outward', subSupplyType: 'export', documentType: 'delivery_challan',
          documentNumber: 'DC-2026-KAN-0022', documentDate: new Date('2026-01-29'),
          fromName: 'KRBL Ltd', fromGstin: '07AABCK9012L1ZD',
          fromAddress: 'Grain Terminal, Kandla Port', fromCity: 'Gandhidham', fromState: 'Gujarat', fromPincode: '370201',
          toName: 'Kandla Port Trust', toGstin: '24AAAGK4567M1ZE',
          toAddress: 'Berth No. 7, Kandla Port', toCity: 'Gandhidham', toState: 'Gujarat', toPincode: '370210',
          hsCode: '1006', productDescription: 'Basmati Rice',
          quantity: 25000, unit: 'MT', taxableAmount: 22500000, igstRate: 5, totalInvoiceValue: 23625000,
          transportMode: 'road', distanceKm: 15,
          customsRefNumber: 'EGM-2026-KAND-00156', organizationId: org.id,
        },
      ],
    });
    console.log('  EwayBills: 3 seeded');
  } else {
    console.log(`  EwayBills: already seeded (${existingEwayBills})`);
  }

  console.log('\nSeed complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
