import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const prisma = new PrismaClient();

// Helper to generate CUID-like IDs
const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

async function seedPortAgency() {
  console.log('🌱 Seeding Port Agency Portal data...\n');

  // Get first organization and vessels
  const org = await prisma.organization.findFirst();
  if (!org) {
    throw new Error('No organization found. Run seed-clean.ts first.');
  }

  const vessels = await prisma.vessel.findMany({ take: 10 });
  if (vessels.length === 0) {
    throw new Error('No vessels found. Run seed-clean.ts first.');
  }

  const companies = await prisma.company.findMany({ take: 5 });

  console.log(`✅ Found organization: ${org.name}`);
  console.log(`✅ Found ${vessels.length} vessels`);
  console.log(`✅ Found ${companies.length} companies\n`);

  // ============================================================================
  // 1. CREATE PORT AGENT APPOINTMENTS (10)
  // ============================================================================
  console.log('📋 Creating 10 Port Agent Appointments...');

  const ports = [
    { code: 'SGSIN', name: 'Singapore', currency: 'SGD', fxRate: 1.35 },
    { code: 'INMUN', name: 'Mumbai', currency: 'INR', fxRate: 83.0 },
    { code: 'AEJEA', name: 'Jebel Ali', currency: 'AED', fxRate: 3.67 },
    { code: 'NLRTM', name: 'Rotterdam', currency: 'EUR', fxRate: 0.92 },
    { code: 'USNYC', name: 'New York', currency: 'USD', fxRate: 1.0 },
    { code: 'CNSHA', name: 'Shanghai', currency: 'CNY', fxRate: 7.2 },
    { code: 'GBLON', name: 'London', currency: 'GBP', fxRate: 0.79 },
    { code: 'JPYOK', name: 'Yokohama', currency: 'JPY', fxRate: 149.0 },
    { code: 'NOKRS', name: 'Kristiansand', currency: 'NOK', fxRate: 10.5 },
    { code: 'INNSA', name: 'JNPT (Nhava Sheva)', currency: 'INR', fxRate: 83.0 },
  ];

  const serviceTypes = ['husbandry', 'cargo', 'crew_change', 'bunker'];
  const appointments = [];

  for (let i = 0; i < 10; i++) {
    const vessel = vessels[i % vessels.length];
    const port = ports[i];
    const eta = new Date(2026, 2, 5 + i, 8, 0); // March 5-14, 2026
    const etb = new Date(eta.getTime() + 2 * 60 * 60 * 1000); // +2 hours
    const etd = new Date(eta.getTime() + 36 * 60 * 60 * 1000); // +36 hours

    const appointment = await prisma.portAgentAppointment.create({
      data: {
        organizationId: org.id,
        vesselId: vessel.id,
        portCode: port.code,
        eta,
        etb,
        etd,
        serviceType: serviceTypes[i % serviceTypes.length],
        status: i < 3 ? 'nominated' : i < 7 ? 'confirmed' : 'completed',
        nominatedBy: 'admin',
        nominatedAt: new Date(),
      },
    });

    appointments.push({ ...appointment, portName: port.name, portCurrency: port.currency, portFxRate: port.fxRate });
    console.log(`  ${i + 1}. ${vessel.name} → ${port.name} (${port.code}) - ${appointment.status}`);
  }

  console.log(`\n✅ Created ${appointments.length} appointments\n`);

  // ============================================================================
  // 2. CREATE PDAs (5)
  // ============================================================================
  console.log('💰 Creating 5 Proforma Disbursement Accounts (PDAs)...');

  const pdaCategories = [
    { name: 'port_dues', unit: 'per_grt', baseRate: 0.12 },
    { name: 'pilotage', unit: 'per_movement', baseRate: 2500 },
    { name: 'towage', unit: 'per_movement', baseRate: 3500 },
    { name: 'mooring', unit: 'per_movement', baseRate: 800 },
    { name: 'unmooring', unit: 'per_movement', baseRate: 800 },
    { name: 'berth_hire', unit: 'per_day', baseRate: 1200 },
    { name: 'agency_fee', unit: 'lumpsum', baseRate: 1500 },
    { name: 'garbage_disposal', unit: 'lumpsum', baseRate: 350 },
    { name: 'freshwater', unit: 'per_ton', baseRate: 8 },
    { name: 'documentation', unit: 'lumpsum', baseRate: 250 },
  ];

  const pdas = [];

  for (let i = 0; i < 5; i++) {
    const appt = appointments[i];
    const vessel = vessels.find((v) => v.id === appt.vesselId)!;
    const stayDuration = (appt.etd.getTime() - appt.etb.getTime()) / (1000 * 60 * 60); // hours

    // Calculate line items
    const lineItemsData = [];
    let totalUSD = 0;

    for (const category of pdaCategories) {
      let quantity = 1;
      let amount = category.baseRate;

      if (category.unit === 'per_grt') {
        quantity = vessel.grt || 50000;
        amount = quantity * category.baseRate;
      } else if (category.unit === 'per_day') {
        quantity = Math.ceil(stayDuration / 24);
        amount = quantity * category.baseRate;
      } else if (category.unit === 'per_ton') {
        quantity = 100; // Assume 100 tons water
        amount = quantity * category.baseRate;
      }

      totalUSD += amount;

      lineItemsData.push({
        category: category.name,
        description: `${category.name.replace(/_/g, ' ').toUpperCase()} - ${appt.portName}`,
        quantity: category.unit !== 'lumpsum' ? quantity : undefined,
        unit: category.unit,
        unitPrice: category.unit !== 'lumpsum' ? category.baseRate : undefined,
        amount,
        currency: 'USD',
        tariffSource: i < 3 ? 'port_authority' : 'ml_prediction',
        isPredicted: i >= 3,
        confidence: i >= 3 ? 0.85 + Math.random() * 0.1 : undefined,
      });
    }

    const totalLocal = totalUSD * appt.portFxRate;

    const pda = await prisma.proformaDisbursementAccount.create({
      data: {
        appointmentId: appt.id,
        reference: `PDA-${appt.portCode}-2026-${String(i + 1).padStart(3, '0')}`,
        version: 1,
        status: i < 2 ? 'draft' : i < 4 ? 'sent' : 'approved',
        portCode: appt.portCode,
        portName: appt.portName,
        arrivalDate: appt.eta,
        departureDate: appt.etd,
        stayDuration,
        vesselId: vessel.id,
        vesselName: vessel.name,
        imo: vessel.imo,
        flag: vessel.flag,
        grt: vessel.grt,
        nrt: vessel.nrt,
        loa: vessel.loa,
        beam: vessel.beam,
        draft: vessel.draft,
        baseCurrency: 'USD',
        totalAmount: totalUSD,
        totalAmountLocal: totalLocal,
        localCurrency: appt.portCurrency,
        fxRate: appt.portFxRate,
        generatedBy: 'AUTO',
        generatedAt: new Date(),
        sentAt: i >= 2 ? new Date() : undefined,
        approvedAt: i >= 4 ? new Date() : undefined,
        approvedBy: i >= 4 ? 'owner_user_123' : undefined,
        confidenceScore: i >= 3 ? 0.88 : undefined,
        predictionModel: i >= 3 ? 'mari8x-tariff-predictor-v1' : undefined,
        lineItems: {
          create: lineItemsData,
        },
      },
      include: {
        lineItems: true,
      },
    });

    pdas.push(pda);
    console.log(
      `  ${i + 1}. ${pda.reference} - ${vessel.name} @ ${appt.portName} - USD ${totalUSD.toFixed(2)} (${appt.portCurrency} ${totalLocal.toFixed(2)}) - ${pda.lineItems.length} items`
    );
  }

  console.log(`\n✅ Created ${pdas.length} PDAs with ${pdas.reduce((sum, p) => sum + p.lineItems.length, 0)} line items\n`);

  // ============================================================================
  // 3. CREATE FDAs (3)
  // ============================================================================
  console.log('📊 Creating 3 Final Disbursement Accounts (FDAs)...');

  const fdas = [];

  for (let i = 0; i < 3; i++) {
    const pda = pdas[i + 2]; // Use PDAs 3, 4, 5 (approved ones)

    // Simulate variance: FDA is 5-15% different from PDA
    const varianceFactor = 1 + (Math.random() * 0.1 - 0.05); // 0.95 to 1.15
    const fdaTotal = pda.totalAmount * varianceFactor;
    const variance = fdaTotal - pda.totalAmount;
    const variancePercent = (variance / pda.totalAmount) * 100;

    // Create FDA line items with variance
    const fdaLineItemsData = [];
    const varianceAnalysisData = [];

    for (const pdaItem of pda.lineItems) {
      const itemVarianceFactor = 0.9 + Math.random() * 0.3; // 0.9 to 1.2
      const fdaAmount = pdaItem.amount * itemVarianceFactor;
      const itemVariance = fdaAmount - pdaItem.amount;

      fdaLineItemsData.push({
        category: pdaItem.category,
        description: pdaItem.description,
        quantity: pdaItem.quantity,
        unit: pdaItem.unit,
        unitPrice: pdaItem.unitPrice,
        amount: fdaAmount,
        currency: 'USD',
        invoiceNumber: `INV-${pda.portCode}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        invoiceDate: new Date(),
        pdaLineItemId: pdaItem.id,
        pdaAmount: pdaItem.amount,
        variance: itemVariance,
        vendorId: companies.length > 0 ? companies[i % companies.length].id : undefined,
      });

      // Add variance analysis if significant (>5%)
      const itemVariancePercent = (itemVariance / pdaItem.amount) * 100;
      if (Math.abs(itemVariancePercent) > 5) {
        const reasons = ['rate_change', 'additional_services', 'currency_fluctuation', 'measurement_difference'];
        varianceAnalysisData.push({
          category: pdaItem.category,
          pdaAmount: pdaItem.amount,
          fdaAmount,
          variance: itemVariance,
          variancePercent: itemVariancePercent,
          reason: reasons[Math.floor(Math.random() * reasons.length)],
          notes: `Actual ${pdaItem.category} differed from estimate by ${itemVariancePercent.toFixed(1)}%`,
        });
      }
    }

    const fda = await prisma.finalDisbursementAccount.create({
      data: {
        pdaId: pda.id,
        appointmentId: pda.appointmentId,
        reference: `FDA-${pda.portCode}-2026-${String(i + 1).padStart(3, '0')}`,
        baseCurrency: 'USD',
        totalAmount: fdaTotal,
        totalAmountLocal: fdaTotal * pda.fxRate,
        localCurrency: pda.localCurrency,
        fxRate: pda.fxRate,
        pdaTotal: pda.totalAmount,
        variance,
        variancePercent,
        status: i < 1 ? 'draft' : i < 2 ? 'submitted' : 'approved',
        submittedAt: i >= 1 ? new Date() : undefined,
        approvedAt: i >= 2 ? new Date() : undefined,
        settledAt: i >= 2 ? new Date() : undefined,
        paymentMethod: i >= 2 ? 'wire_transfer' : undefined,
        paymentReference: i >= 2 ? `WIRE-${Date.now()}` : undefined,
        lineItems: {
          create: fdaLineItemsData,
        },
        variances: {
          create: varianceAnalysisData,
        },
      },
      include: {
        lineItems: true,
        variances: true,
      },
    });

    fdas.push(fda);
    console.log(
      `  ${i + 1}. ${fda.reference} - Variance: ${variance >= 0 ? '+' : ''}${variance.toFixed(2)} USD (${variancePercent >= 0 ? '+' : ''}${variancePercent.toFixed(1)}%) - ${fda.lineItems.length} items, ${fda.variances.length} variances`
    );
  }

  console.log(`\n✅ Created ${fdas.length} FDAs with variance analysis\n`);

  // ============================================================================
  // 4. CREATE SERVICE REQUESTS (10)
  // ============================================================================
  console.log('🛠️ Creating 10 Service Requests...');

  const serviceRequestTypes = [
    'pilotage',
    'towage',
    'mooring',
    'garbage_disposal',
    'freshwater_supply',
    'provisions',
    'crew_transport',
    'customs_clearance',
  ];

  const serviceRequests = [];

  for (let i = 0; i < 10; i++) {
    const appt = appointments[i];
    const serviceType = serviceRequestTypes[i % serviceRequestTypes.length];

    const request = await prisma.portServiceRequest.create({
      data: {
        appointmentId: appt.id,
        serviceType,
        description: `${serviceType.replace(/_/g, ' ').toUpperCase()} service for ${vessels[i % vessels.length].name} at ${appt.portName}`,
        requestedAt: new Date(),
        requiredBy: appt.eta,
        status: i < 3 ? 'pending' : i < 7 ? 'quoted' : 'completed',
        completedAt: i >= 7 ? new Date() : undefined,
        actualCost: i >= 7 ? 2000 + Math.random() * 3000 : undefined,
        currency: i >= 7 ? 'USD' : undefined,
        rating: i >= 7 ? Math.floor(3 + Math.random() * 3) : undefined, // 3-5 stars
        review: i >= 7 ? 'Service completed satisfactorily' : undefined,
      },
    });

    serviceRequests.push(request);
    console.log(`  ${i + 1}. ${serviceType} for ${vessels[i % vessels.length].name} @ ${appt.portName} - ${request.status}`);
  }

  console.log(`\n✅ Created ${serviceRequests.length} service requests\n`);

  // ============================================================================
  // 5. CREATE VENDOR QUOTES (25)
  // ============================================================================
  console.log('💵 Creating 25 Vendor Quotes (2-3 per service request)...');

  let quoteCount = 0;

  for (let i = 0; i < serviceRequests.length; i++) {
    const request = serviceRequests[i];
    const numQuotes = 2 + Math.floor(Math.random() * 2); // 2-3 quotes per request

    for (let j = 0; j < numQuotes && companies.length > 0; j++) {
      const vendor = companies[j % companies.length];
      const baseAmount = 1000 + Math.random() * 4000;
      const amount = baseAmount * (1 + j * 0.15); // Each quote 15% higher than previous

      await prisma.portVendorQuote.create({
        data: {
          serviceRequestId: request.id,
          vendorId: vendor.id,
          amount,
          currency: 'USD',
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 days
          description: `Quote for ${request.serviceType} service`,
          terms: '50% advance, 50% on completion. Valid for 7 days.',
          status: j === 0 && i >= 7 ? 'accepted' : j === 0 && i >= 3 ? 'pending' : 'pending',
          respondedAt: new Date(),
        },
      });

      quoteCount++;
    }
  }

  console.log(`✅ Created ${quoteCount} vendor quotes\n`);

  // ============================================================================
  // 6. CREATE PORT SERVICES MASTER DATA (15)
  // ============================================================================
  console.log('📚 Creating 15 Port Services Master Data entries...');

  const portServiceTypes = ['pilotage', 'towage', 'mooring', 'garbage_disposal', 'freshwater_supply'];

  let serviceCount = 0;

  for (const port of ports.slice(0, 3)) {
    for (const serviceType of portServiceTypes) {
      if (companies.length > 0) {
        await prisma.portServiceMaster.create({
          data: {
            portCode: port.code,
            serviceType,
            vendorId: companies[serviceCount % companies.length].id,
            isActive: true,
            priority: 1,
            contactName: `${port.name} ${serviceType} Manager`,
            contactEmail: `${serviceType}@${port.code.toLowerCase()}.port`,
            contactPhone: `+${Math.floor(Math.random() * 90 + 10)}-${Math.floor(Math.random() * 900000000 + 100000000)}`,
            baseRate: 1000 + Math.random() * 3000,
            currency: port.currency,
            unit: serviceType === 'pilotage' || serviceType === 'towage' ? 'per_movement' : 'lumpsum',
            notes: `Preferred vendor for ${serviceType} at ${port.name}`,
          },
        });

        serviceCount++;
      }
    }
  }

  console.log(`✅ Created ${serviceCount} port service master data entries\n`);

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n' + '='.repeat(60));
  console.log('🎉 PORT AGENCY PORTAL SEED DATA COMPLETE');
  console.log('='.repeat(60));

  const counts = {
    appointments: await prisma.portAgentAppointment.count(),
    pdas: await prisma.proformaDisbursementAccount.count(),
    pdaItems: await prisma.proformaDisbursementLineItem.count(),
    fdas: await prisma.finalDisbursementAccount.count(),
    fdaItems: await prisma.finalDisbursementLineItem.count(),
    variances: await prisma.fdaVarianceAnalysis.count(),
    serviceRequests: await prisma.portServiceRequest.count(),
    vendorQuotes: await prisma.portVendorQuote.count(),
    portServices: await prisma.portServiceMaster.count(),
  };

  console.log('\n📊 FINAL COUNTS:');
  console.log(`  - Port Agent Appointments: ${counts.appointments}`);
  console.log(`  - PDAs: ${counts.pdas}`);
  console.log(`  - PDA Line Items: ${counts.pdaItems}`);
  console.log(`  - FDAs: ${counts.fdas}`);
  console.log(`  - FDA Line Items: ${counts.fdaItems}`);
  console.log(`  - FDA Variances: ${counts.variances}`);
  console.log(`  - Service Requests: ${counts.serviceRequests}`);
  console.log(`  - Vendor Quotes: ${counts.vendorQuotes}`);
  console.log(`  - Port Services (Master): ${counts.portServices}`);
  console.log(`\n  TOTAL RECORDS: ${Object.values(counts).reduce((a, b) => a + b, 0)}`);

  console.log('\n✅ Seed data ready for testing!');
  console.log('\n💡 Test the API:');
  console.log('   http://localhost:4051/graphql\n');
}

seedPortAgency()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
