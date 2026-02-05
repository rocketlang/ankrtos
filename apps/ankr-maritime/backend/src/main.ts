import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import fastifyStatic from '@fastify/static';
import multipart from '@fastify/multipart';
import mercurius from 'mercurius';
import path from 'path';
import { fileURLToPath } from 'url';
import { schema } from './schema/index.js';
import { buildContext, prisma } from './schema/context.js';
import { logger } from './utils/logger.js';
import { generatePdf } from './services/pdf-generator.js';
import { generateCsv } from './services/csv-export.js';
import { documentUploadRoutes } from './routes/document-upload.js';
import { bulkOperationsRoutes } from './routes/bulk-operations.js';
import { registerRazorpayWebhook } from './routes/razorpay-webhook.js';
import { startCertificateExpiryCron } from './jobs/certificate-expiry-cron.js';
import { ciiDowngradeMonitor } from './jobs/cii-downgrade-monitor.js';
import { getTariffUpdateScheduler } from './jobs/tariff-update-scheduler.js';
import { getAutoEnrichmentScheduler } from './jobs/auto-enrichment-scheduler.js';
import { startPortCongestionSnapshotCron } from './jobs/port-congestion-snapshot-cron.js';
import { AISStreamService } from './services/aisstream-service.js';
import { initializeAlertSystem } from './loaders/alert-system.loader.js';
import { alertSystemHealthRoutes } from './routes/health/alert-system.health.js';
import { smsReplyWebhook } from './routes/webhooks/sms-reply.js';
import { whatsappReplyWebhook } from './routes/webhooks/whatsapp-reply.js';
import { emailReplyWebhook } from './routes/webhooks/email-reply.js';
import { whatsappBusinessWebhook } from './routes/webhooks/whatsapp-business-webhook.js';
// Temporarily disabled until PageIndex packages are published with dist
// import { maritimeRouter } from './services/rag/pageindex-router.js';
// import { testConnections } from './services/rag/connections.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT) || 4051;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3008';

async function main() {
  const app = Fastify({ logger: false });

  // CORS
  await app.register(cors, {
    origin: [FRONTEND_URL, 'http://localhost:3008'],
    credentials: true,
  });

  // Cookies
  await app.register(cookie);

  // JWT
  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
  });

  // Multipart (file uploads)
  await app.register(multipart, {
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB max file size
      files: 1, // Max 1 file per upload
    },
  });

  // Document Upload Routes
  await app.register(documentUploadRoutes);

  // Bulk Operations Routes
  await app.register(bulkOperationsRoutes);

  // Razorpay Webhook
  await registerRazorpayWebhook(app);

  // Alert System Health Checks
  await app.register(alertSystemHealthRoutes);

  // Master Alert Reply Webhooks
  await app.register(smsReplyWebhook);
  await app.register(whatsappReplyWebhook);
  await app.register(emailReplyWebhook);

  // Universal AI Assistant - WhatsApp Business API Webhook
  await app.register(whatsappBusinessWebhook);

  // GraphQL via Mercurius
  await app.register(mercurius, {
    schema,
    context: buildContext,
    graphiql: true,
    subscription: true,
    path: '/graphql',
  });

  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    service: 'ankr-maritime',
    timestamp: new Date().toISOString(),
  }));

  // === PDF Export Endpoints ===

  // Voyage P&L PDF
  app.get<{ Params: { voyageId: string } }>('/api/pdf/voyage-pnl/:voyageId', async (req, reply) => {
    const voyage = await prisma.voyage.findUnique({
      where: { id: req.params.voyageId },
      include: {
        vessel: true, charter: true, cargo: true,
        disbursementAccounts: { include: { lineItems: true } },
        laytimeCalculations: true,
      },
    });
    if (!voyage) return reply.status(404).send({ error: 'Voyage not found' });

    let revenue = 0;
    if (voyage.charter?.freightRate && voyage.charter.freightUnit === 'lumpsum') {
      revenue = voyage.charter.freightRate;
    } else if (voyage.charter?.freightRate && voyage.cargo?.quantity) {
      revenue = voyage.charter.freightRate * voyage.cargo.quantity;
    }
    let daCosts = 0;
    const costRows: { cells: string[] }[] = [];
    for (const da of voyage.disbursementAccounts) {
      for (const item of da.lineItems) {
        daCosts += item.amount;
        costRows.push({ cells: [item.description, item.category, `$${item.amount.toLocaleString()}`] });
      }
    }
    let demurrage = 0, despatch = 0;
    for (const lt of voyage.laytimeCalculations) {
      if (lt.result === 'on_demurrage' && lt.amountDue > 0) demurrage += lt.amountDue;
      if (lt.result === 'on_despatch' && lt.amountDue < 0) despatch += Math.abs(lt.amountDue);
    }
    const netResult = revenue + despatch - daCosts - demurrage;
    const fmt = (n: number) => `$${n.toLocaleString()}`;

    const pdf = await generatePdf({
      title: `Voyage P&L — ${voyage.voyageNumber}`,
      subtitle: `${voyage.vessel.name} | ${voyage.charter?.currency ?? 'USD'}`,
      sections: [
        {
          heading: 'Summary',
          rows: [
            { label: 'Vessel', value: `${voyage.vessel.name} (IMO ${voyage.vessel.imo})` },
            { label: 'Status', value: voyage.status },
            { label: 'Cargo', value: voyage.cargo ? `${voyage.cargo.commodity} — ${voyage.cargo.quantity.toLocaleString()} MT` : 'N/A' },
          ],
        },
        {
          heading: 'Financial Summary',
          rows: [
            { label: 'Revenue', value: fmt(revenue), color: '#059669' },
            { label: 'DA Costs', value: fmt(daCosts), color: '#d97706' },
            { label: 'Demurrage', value: fmt(demurrage), color: '#dc2626' },
            { label: 'Despatch', value: fmt(despatch), color: '#0891b2' },
            { label: 'Net Result', value: fmt(netResult), bold: true, color: netResult >= 0 ? '#059669' : '#dc2626' },
          ],
        },
        { spacer: true },
        {
          heading: 'DA Cost Details',
          table: {
            headers: ['Description', 'Category', 'Amount'],
            rows: [...costRows, { cells: ['TOTAL', '', fmt(daCosts)], bold: true }],
            columnWidths: [250, 120, 125],
          },
        },
      ],
    });

    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', `attachment; filename="PnL-${voyage.voyageNumber}.pdf"`);
    return reply.send(pdf);
  });

  // DA Report PDF
  app.get<{ Params: { daId: string } }>('/api/pdf/da/:daId', async (req, reply) => {
    const da = await prisma.disbursementAccount.findUnique({
      where: { id: req.params.daId },
      include: { voyage: { include: { vessel: true } }, port: true, lineItems: true },
    });
    if (!da) return reply.status(404).send({ error: 'DA not found' });

    const total = da.lineItems.reduce((s, i) => s + i.amount, 0);
    const fmt = (n: number) => `$${n.toLocaleString()}`;

    const pdf = await generatePdf({
      title: `Disbursement Account — ${da.type.toUpperCase()}`,
      subtitle: `${da.voyage.vessel.name} | ${da.port.name} | ${da.voyage.voyageNumber}`,
      sections: [
        {
          heading: 'Details',
          rows: [
            { label: 'Type', value: da.type.toUpperCase() },
            { label: 'Status', value: da.status },
            { label: 'Port', value: `${da.port.name} (${da.port.unlocode})` },
            { label: 'Currency', value: da.currency },
          ],
        },
        { spacer: true },
        {
          heading: 'Line Items',
          table: {
            headers: ['Description', 'Category', 'Amount'],
            rows: [
              ...da.lineItems.map((i) => ({ cells: [i.description, i.category.replace(/_/g, ' '), fmt(i.amount)] })),
              { cells: ['TOTAL', '', fmt(total)], bold: true },
            ],
            columnWidths: [250, 120, 125],
          },
        },
      ],
    });

    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', `attachment; filename="DA-${da.port.unlocode}-${da.type.toUpperCase()}.pdf"`);
    return reply.send(pdf);
  });

  // Bill of Lading PDF
  app.get<{ Params: { bolId: string } }>('/api/pdf/bol/:bolId', async (req, reply) => {
    const bol = await prisma.billOfLading.findUnique({
      where: { id: req.params.bolId },
      include: { voyage: { include: { vessel: true } } },
    });
    if (!bol) return reply.status(404).send({ error: 'B/L not found' });

    const pdf = await generatePdf({
      title: 'BILL OF LADING',
      subtitle: `${bol.bolNumber} | ${bol.type.toUpperCase()}`,
      sections: [
        {
          heading: 'Shipment Details',
          rows: [
            { label: 'B/L Number', value: bol.bolNumber },
            { label: 'Type', value: bol.type.toUpperCase() },
            { label: 'Status', value: bol.status },
            { label: 'Vessel', value: bol.voyage.vessel.name },
            { label: 'Voyage', value: bol.voyage.voyageNumber },
          ],
        },
        {
          heading: 'Ports',
          rows: [
            { label: 'Port of Loading', value: bol.portOfLoading ?? '-' },
            { label: 'Port of Discharge', value: bol.portOfDischarge ?? '-' },
            { label: 'Place of Receipt', value: bol.placeOfReceipt ?? '-' },
            { label: 'Place of Delivery', value: bol.placeOfDelivery ?? '-' },
          ],
        },
        {
          heading: 'Cargo',
          rows: [
            { label: 'Description', value: bol.description ?? '-' },
            { label: 'Gross Weight', value: bol.grossWeight ? `${bol.grossWeight.toLocaleString()} MT` : '-' },
            { label: 'Measurement', value: bol.measurement ? `${bol.measurement.toLocaleString()} CBM` : '-' },
            { label: 'Freight Terms', value: bol.freightTerms },
            { label: 'Originals', value: String(bol.numberOfOriginals) },
          ],
        },
        {
          heading: 'Issue Details',
          rows: [
            { label: 'Issued At', value: bol.issuedAt?.toISOString().split('T')[0] ?? 'Not issued' },
            { label: 'Issued By', value: bol.issuedBy ?? '-' },
          ],
        },
      ],
    });

    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', `attachment; filename="BL-${bol.bolNumber}.pdf"`);
    return reply.send(pdf);
  });

  // === CSV Export Endpoints ===

  app.get('/api/csv/vessels', async (_req, reply) => {
    const vessels = await prisma.vessel.findMany({ orderBy: { name: 'asc' } });
    const csv = generateCsv(
      ['Name', 'IMO', 'Type', 'Flag', 'DWT', 'GRT', 'LOA', 'Year Built', 'Status'],
      vessels.map((v) => [v.name, v.imo, v.type, v.flag, v.dwt, v.grt, v.loa, v.yearBuilt, v.status]),
    );
    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', 'attachment; filename="vessels.csv"');
    return reply.send(csv);
  });

  app.get('/api/csv/voyages', async (_req, reply) => {
    const voyages = await prisma.voyage.findMany({ include: { vessel: true, charter: true, cargo: true }, orderBy: { createdAt: 'desc' } });
    const csv = generateCsv(
      ['Voyage #', 'Vessel', 'Status', 'ETD', 'ETA', 'ATD', 'ATA', 'Charter Type', 'Cargo'],
      voyages.map((v) => [v.voyageNumber, v.vessel.name, v.status, v.etd?.toISOString().split('T')[0], v.eta?.toISOString().split('T')[0], v.atd?.toISOString().split('T')[0], v.ata?.toISOString().split('T')[0], v.charter?.type, v.cargo?.commodity]),
    );
    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', 'attachment; filename="voyages.csv"');
    return reply.send(csv);
  });

  app.get('/api/csv/companies', async (_req, reply) => {
    const companies = await prisma.company.findMany({ orderBy: { name: 'asc' } });
    const csv = generateCsv(
      ['Name', 'Type', 'Country', 'City', 'Email', 'Phone'],
      companies.map((c) => [c.name, c.type, c.country, c.city, c.email, c.phone]),
    );
    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', 'attachment; filename="companies.csv"');
    return reply.send(csv);
  });

  app.get('/api/csv/claims', async (_req, reply) => {
    const claims = await prisma.claim.findMany({ include: { voyage: { include: { vessel: true } } }, orderBy: { createdAt: 'desc' } });
    const csv = generateCsv(
      ['Claim #', 'Type', 'Voyage', 'Vessel', 'Amount', 'Settlement', 'Status', 'Priority', 'Filed Date'],
      claims.map((c) => [c.claimNumber, c.type, c.voyage.voyageNumber, c.voyage.vessel.name, c.amount, c.settlementAmount, c.status, c.priority, c.filedDate?.toISOString().split('T')[0]]),
    );
    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', 'attachment; filename="claims.csv"');
    return reply.send(csv);
  });

  app.get('/api/csv/crew', async (_req, reply) => {
    const crew = await prisma.crewMember.findMany({ include: { assignments: { where: { status: 'active' }, include: { vessel: true }, take: 1 } }, orderBy: { lastName: 'asc' } });
    const csv = generateCsv(
      ['First Name', 'Last Name', 'Rank', 'Nationality', 'Status', 'Current Vessel', 'Phone', 'Email'],
      crew.map((c) => [c.firstName, c.lastName, c.rank, c.nationality, c.status, c.assignments[0]?.vessel?.name, c.phone, c.email]),
    );
    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', 'attachment; filename="crew.csv"');
    return reply.send(csv);
  });

  app.get('/api/csv/bunkers', async (_req, reply) => {
    const stems = await prisma.bunkerStem.findMany({ include: { voyage: { include: { vessel: true } } }, orderBy: { createdAt: 'desc' } });
    const csv = generateCsv(
      ['Fuel Type', 'Voyage', 'Vessel', 'Qty (MT)', 'Delivered', 'Price/MT', 'Total', 'Supplier', 'Status'],
      stems.map((s) => [s.fuelType, s.voyage.voyageNumber, s.voyage.vessel.name, s.quantity, s.delivered, s.pricePerMt, (s.delivered ?? s.quantity) * s.pricePerMt, s.supplier, s.status]),
    );
    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', 'attachment; filename="bunkers.csv"');
    return reply.send(csv);
  });

  app.get('/api/csv/ports', async (_req, reply) => {
    const ports = await prisma.port.findMany({ orderBy: { name: 'asc' } });
    const csv = generateCsv(
      ['Name', 'UNLOCODE', 'Country', 'Type', 'Latitude', 'Longitude', 'Timezone'],
      ports.map((p) => [p.name, p.unlocode, p.country, p.type, p.latitude, p.longitude, p.timezone]),
    );
    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', 'attachment; filename="ports.csv"');
    return reply.send(csv);
  });

  // === Static File Serving (Production) ===
  const frontendDist = path.resolve(__dirname, '../../frontend/dist');
  try {
    await app.register(fastifyStatic, {
      root: frontendDist,
      prefix: '/',
    });
    // SPA fallback: serve index.html for all non-API/GraphQL routes
    app.setNotFoundHandler(async (_req, reply) => {
      return reply.sendFile('index.html');
    });
    logger.info(`Serving frontend from ${frontendDist}`);
  } catch {
    logger.info('No frontend dist found — running in API-only mode');
  }

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down...');
    await prisma.$disconnect();
    // const { closeConnections } = await import('./services/rag/connections.js');
    // await closeConnections();
    await app.close();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  // Start
  await app.listen({ port: PORT, host: '0.0.0.0' });
  logger.info(`ankr-maritime backend running on http://localhost:${PORT}`);
  logger.info(`GraphiQL IDE: http://localhost:${PORT}/graphiql`);

  // Start AIS real-time tracking (if enabled)
  if (process.env.ENABLE_AIS === 'true') {
    const aisService = new AISStreamService();

    // Get configured high-priority trade areas
    const { MAJOR_TRADE_AREAS } = await import('../scripts/configure-ais-trade-areas.js');
    const priorityAreaBoxes = MAJOR_TRADE_AREAS
      .filter(area => area.priority === 1) // High-priority detailed tracking
      .map(area => area.boundingBox);

    // ADD global bounding box to also track rest of world
    const globalBox = [[-90, -180], [90, 180]]; // Entire world
    const allBoundingBoxes = [...priorityAreaBoxes, globalBox];

    console.log(`🌍 AIS Coverage: ${priorityAreaBoxes.length} priority areas + GLOBAL coverage`);
    console.log('   - Detailed: Major trade routes (Priority 1)');
    console.log('   - Global: Rest of world for situational awareness');

    await aisService.connect({
      boundingBoxes: allBoundingBoxes,
      messageTypes: ['PositionReport', 'ShipStaticData']
    });
    logger.info(`AIS tracking: ${priorityAreaBoxes.length} priority areas + global coverage`);
  } else {
    logger.info('AIS tracking disabled (set ENABLE_AIS=true to enable)');
  }

  // Start certificate expiry monitoring cron job
  startCertificateExpiryCron();
  logger.info('Certificate expiry monitoring cron job started');

  // Start CII downgrade monitoring cron job
  ciiDowngradeMonitor.start();
  logger.info('CII downgrade monitoring cron job started');

  // Start tariff update scheduler (daily 2am, weekly, monthly, quarterly)
  const tariffScheduler = getTariffUpdateScheduler();
  tariffScheduler.start();
  logger.info('Tariff update scheduler started (daily 2am for priority ports)');

  // Start auto-enrichment scheduler (daily 3am, 6-hourly batches)
  const autoEnrichmentScheduler = getAutoEnrichmentScheduler();
  autoEnrichmentScheduler.start();
  logger.info('Auto-enrichment scheduler started (AIS, user queries, email parsing)');

  // Start port congestion snapshot generator (hourly)
  startPortCongestionSnapshotCron();
  logger.info('Port congestion snapshot generator started (hourly at :00 UTC)');

  // Initialize master alert system (Phase 3)
  await initializeAlertSystem();
  logger.info('Master alert system initialized (multi-channel alerts + two-way communication)');

  // PageIndex Hybrid RAG System temporarily disabled
  // TODO: Publish @ankr/pageindex and @ankr/rag-router packages with built dist folders
  // if (process.env.ENABLE_PAGEINDEX_ROUTER === 'true') {
  //   logger.info('Initializing PageIndex Hybrid RAG System...');
  //   const connectionStatus = await testConnections();
  //   if (connectionStatus.pg) {
  //     await maritimeRouter.initialize();
  //     logger.info('✅ PageIndex Hybrid RAG System initialized');
  //   }
  // }
  logger.info('PageIndex router: pending package publish (infrastructure ready ✅)');
}

main().catch((err) => {
  logger.error(err, 'Failed to start ankr-maritime backend');
  process.exit(1);
});
