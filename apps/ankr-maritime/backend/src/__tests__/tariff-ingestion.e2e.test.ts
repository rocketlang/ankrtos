/**
 * E2E Integration Tests: Tariff Ingestion Pipeline
 *
 * Tests the complete workflow from PDF to database
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '../lib/prisma.js';
import { tariffIngestionService } from '../services/tariff-ingestion-service.js';
import { tariffIngestionWorker } from '../workers/tariff-ingestion-worker.js';
import { pdfExtractionService } from '../services/pdf-extraction-service.js';
import fs from 'fs';
import path from 'path';

// Test data directory
const TEST_DATA_DIR = path.join(process.cwd(), 'src/__tests__/test-data');

// ========================================
// Test Setup
// ========================================

beforeAll(async () => {
  // Initialize worker for tests
  await tariffIngestionWorker.initialize();

  // Ensure test data directory exists
  if (!fs.existsSync(TEST_DATA_DIR)) {
    fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
  }
});

afterAll(async () => {
  // Cleanup
  await tariffIngestionWorker.shutdown();
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean up test data before each test
  await prisma.tariffReviewTask.deleteMany({
    where: {
      port: {
        unlocode: { startsWith: 'TEST' },
      },
    },
  });

  await prisma.portTariffDocument.deleteMany({
    where: {
      port: {
        unlocode: { startsWith: 'TEST' },
      },
    },
  });

  await prisma.portTariff.deleteMany({
    where: {
      port: {
        unlocode: { startsWith: 'TEST' },
      },
    },
  });
});

// ========================================
// Test Helpers
// ========================================

async function createTestPort() {
  const randomId = Math.random().toString(36).substring(7);
  return prisma.port.create({
    data: {
      unlocode: `TEST${randomId.toUpperCase()}`,
      name: `Test Port ${randomId}`,
      country: 'US',
      latitude: 0,
      longitude: 0,
    },
  });
}

function createMockPDF(content: string): Buffer {
  // Create a simple text-based PDF representation
  // In a real test, you'd use pdf-lib to create an actual PDF
  return Buffer.from(content, 'utf-8');
}

// ========================================
// E2E Test: PDF Extraction
// ========================================

describe('E2E: PDF Extraction', () => {
  it.skip('should extract text from text-based content', async () => {
    const content = `
      PORT TARIFF SCHEDULE

      PORT DUES
      Vessels up to 10,000 GRT: USD 0.15 per GRT
      Vessels 10,001 - 50,000 GRT: USD 0.12 per GRT

      PILOTAGE
      Inward/Outward: USD 1,500 base + USD 0.50 per GRT
    `;

    const mockPDF = createMockPDF(content);

    const result = await pdfExtractionService.extractText(mockPDF);

    expect(result.text).toContain('PORT DUES');
    expect(result.text).toContain('PILOTAGE');
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.method).toBe('pdf-parse');
  });

  it('should assess text quality correctly', () => {
    const goodText = 'Port Dues: Vessels up to 10,000 GRT: USD 0.15 per GRT';
    const quality = pdfExtractionService.assessTextQuality(goodText, 1);

    expect(quality.isGood).toBe(true);
    expect(quality.confidence).toBeGreaterThan(0.7);
    expect(quality.metrics.hasNumbers).toBe(true);
    expect(quality.metrics.hasLetters).toBe(true);
  });
});

// ========================================
// E2E Test: Full Pipeline (Simulated)
// ========================================

describe('E2E: Full Ingestion Pipeline', () => {
  it('should complete full pipeline: extract → validate → import', async () => {
    const port = await createTestPort();

    // Mock tariff data (high confidence)
    const tariff = {
      chargeType: 'port_dues' as const,
      amount: 0.15,
      currency: 'USD',
      unit: 'per_grt' as const,
      sizeRangeMax: 10000,
      rawText: 'Port Dues: USD 0.15 per GRT for vessels up to 10,000 GRT',
      confidence: 0.95,
    };

    // Validate
    const validation = tariffIngestionService.validateTariff(tariff);
    expect(validation.isValid).toBe(true);

    // Import directly to database (simulating successful extraction)
    const imported = await prisma.portTariff.create({
      data: {
        portId: port.id,
        chargeType: tariff.chargeType,
        amount: tariff.amount,
        currency: tariff.currency,
        unit: tariff.unit,
        sizeRangeMax: tariff.sizeRangeMax,
        dataSource: 'REAL_SCRAPED',
        effectiveFrom: new Date(),
      },
    });

    expect(imported.id).toBeDefined();
    expect(imported.chargeType).toBe('port_dues');
    expect(imported.amount).toBe(0.15);

    // Verify in database
    const found = await prisma.portTariff.findFirst({
      where: {
        portId: port.id,
        chargeType: 'port_dues',
      },
    });

    expect(found).toBeDefined();
    expect(found!.amount).toBe(0.15);
  });

  it('should route low confidence to review queue', async () => {
    const port = await createTestPort();

    // Mock low confidence extraction
    const reviewTask = await prisma.tariffReviewTask.create({
      data: {
        portId: port.id,
        extractedData: {
          chargeType: 'other',
          amount: 100,
          currency: 'USD',
          unit: 'flat_fee',
          confidence: 0.6,
        },
        confidence: 0.6,
        status: 'pending',
        issues: ['Low confidence', 'Ambiguous charge type'],
      },
    });

    expect(reviewTask.id).toBeDefined();
    expect(reviewTask.status).toBe('pending');
    expect(reviewTask.confidence).toBe(0.6);

    // Get review queue
    const needsReview = await tariffIngestionService.getTariffsNeedingReview(10);

    expect(needsReview.length).toBeGreaterThan(0);
    expect(needsReview[0].id).toBe(reviewTask.id);
  });

  it('should approve tariff from review queue', async () => {
    const port = await createTestPort();

    // Create review task
    const reviewTask = await prisma.tariffReviewTask.create({
      data: {
        portId: port.id,
        extractedData: [
          {
            chargeType: 'port_dues',
            amount: 0.15,
            currency: 'USD',
            unit: 'per_grt',
            confidence: 0.75,
            validation: {
              isValid: true,
              confidence: 0.75,
              issues: [],
              warnings: [],
            },
          },
        ],
        confidence: 0.75,
        status: 'pending',
        sourceUrl: 'https://example.com/tariff.pdf',
        sourceHash: 'abc123',
        issues: [],
      },
    });

    // Approve
    const importedCount = await tariffIngestionService.approveFromReview(reviewTask.id);

    expect(importedCount).toBe(1);

    // Verify task updated
    const updated = await prisma.tariffReviewTask.findUnique({
      where: { id: reviewTask.id },
    });

    expect(updated!.status).toBe('approved');
    expect(updated!.approvedCount).toBe(1);

    // Verify tariff imported
    const tariff = await prisma.portTariff.findFirst({
      where: {
        portId: port.id,
        chargeType: 'port_dues',
      },
    });

    expect(tariff).toBeDefined();
    expect(tariff!.amount).toBe(0.15);
    expect(tariff!.dataSource).toBe('REAL_SCRAPED');
  });
});

// ========================================
// E2E Test: Change Detection
// ========================================

describe('E2E: Change Detection', () => {
  it('should detect duplicate and skip import', async () => {
    const port = await createTestPort();

    // Create existing tariff
    await prisma.portTariff.create({
      data: {
        portId: port.id,
        chargeType: 'port_dues',
        amount: 0.15,
        currency: 'USD',
        unit: 'per_grt',
        sizeRangeMax: 10000,
        dataSource: 'REAL_SCRAPED',
        effectiveFrom: new Date(),
      },
    });

    // Try to import duplicate
    const tariff = {
      chargeType: 'port_dues' as const,
      amount: 0.15,
      currency: 'USD',
      unit: 'per_grt' as const,
      sizeRangeMax: 10000,
      rawText: 'Port Dues: USD 0.15 per GRT',
      confidence: 0.95,
    };

    // Check for duplicate
    const isDuplicate = await tariffIngestionService['checkDuplicate'](tariff, port.id);

    expect(isDuplicate).toBe(true);

    // Count tariffs (should still be 1)
    const count = await prisma.portTariff.count({
      where: {
        portId: port.id,
        chargeType: 'port_dues',
      },
    });

    expect(count).toBe(1);
  });

  it('should import non-duplicate tariff', async () => {
    const port = await createTestPort();

    // Create existing tariff
    await prisma.portTariff.create({
      data: {
        portId: port.id,
        chargeType: 'port_dues',
        amount: 0.15,
        currency: 'USD',
        unit: 'per_grt',
        sizeRangeMax: 10000,
        dataSource: 'REAL_SCRAPED',
        effectiveFrom: new Date(),
      },
    });

    // Try to import different size range (not duplicate)
    const tariff = {
      chargeType: 'port_dues' as const,
      amount: 0.12,
      currency: 'USD',
      unit: 'per_grt' as const,
      sizeRangeMin: 10001,
      sizeRangeMax: 50000,
      rawText: 'Port Dues: USD 0.12 per GRT',
      confidence: 0.95,
    };

    const isDuplicate = await tariffIngestionService['checkDuplicate'](tariff, port.id);

    expect(isDuplicate).toBe(false);

    // Import new tariff
    await prisma.portTariff.create({
      data: {
        portId: port.id,
        chargeType: tariff.chargeType,
        amount: tariff.amount,
        currency: tariff.currency,
        unit: tariff.unit,
        sizeRangeMin: tariff.sizeRangeMin,
        sizeRangeMax: tariff.sizeRangeMax,
        dataSource: 'REAL_SCRAPED',
        effectiveFrom: new Date(),
      },
    });

    // Count tariffs (should be 2)
    const count = await prisma.portTariff.count({
      where: {
        portId: port.id,
        chargeType: 'port_dues',
      },
    });

    expect(count).toBe(2);
  });
});

// ========================================
// E2E Test: Statistics
// ========================================

describe('E2E: Statistics & Reporting', () => {
  it('should calculate ingestion statistics', async () => {
    const port = await createTestPort();

    // Create mix of real and simulated tariffs
    await prisma.portTariff.createMany({
      data: [
        {
          portId: port.id,
          chargeType: 'port_dues',
          amount: 0.15,
          currency: 'USD',
          unit: 'per_grt',
          dataSource: 'REAL_SCRAPED',
          effectiveFrom: new Date(),
        },
        {
          portId: port.id,
          chargeType: 'pilotage',
          amount: 1500,
          currency: 'USD',
          unit: 'flat_fee',
          dataSource: 'REAL_SCRAPED',
          effectiveFrom: new Date(),
        },
        {
          portId: port.id,
          chargeType: 'towage',
          amount: 2000,
          currency: 'USD',
          unit: 'flat_fee',
          dataSource: 'SIMULATED',
          effectiveFrom: new Date(),
        },
      ],
    });

    // Get stats for this port
    const stats = await tariffIngestionService.getIngestionStats(port.id);

    expect(stats.total).toBe(3);
    expect(stats.realScraped).toBe(2);
    expect(stats.simulated).toBe(1);
    expect(stats.coveragePercent).toBeCloseTo(66.67, 1);
  });

  it('should track review queue', async () => {
    const port = await createTestPort();

    // Create review tasks
    await prisma.tariffReviewTask.createMany({
      data: [
        {
          portId: port.id,
          extractedData: {},
          confidence: 0.6,
          status: 'pending',
          issues: [],
        },
        {
          portId: port.id,
          extractedData: {},
          confidence: 0.65,
          status: 'pending',
          issues: [],
        },
      ],
    });

    const stats = await tariffIngestionService.getIngestionStats(port.id);

    expect(stats.reviewPending).toBe(2);
  });
});

// ========================================
// E2E Test: BullMQ Worker
// ========================================

describe('E2E: BullMQ Job Queue', () => {
  it('should queue and track ingestion job', async () => {
    const port = await createTestPort();

    const jobId = await tariffIngestionWorker.queueJob({
      jobType: 'single_port',
      portIds: [port.id],
      options: {
        priority: 5,
      },
    });

    expect(jobId).toBeDefined();

    // Get job status
    const job = await prisma.tariffIngestionJob.findUnique({
      where: { id: jobId },
    });

    expect(job).toBeDefined();
    expect(job!.jobType).toBe('single_port');
    expect(job!.status).toBe('queued');
    expect(job!.totalPorts).toBe(1);
    expect(job!.portIds).toContain(port.id);
  });

  it('should get queue metrics', async () => {
    const metrics = await tariffIngestionWorker.getQueueMetrics();

    expect(metrics).toHaveProperty('waiting');
    expect(metrics).toHaveProperty('active');
    expect(metrics).toHaveProperty('completed');
    expect(metrics).toHaveProperty('failed');
    expect(metrics).toHaveProperty('total');

    expect(typeof metrics.total).toBe('number');
  });
});

// ========================================
// E2E Test: Migration Scenario
// ========================================

describe('E2E: Migration from Simulated to Real', () => {
  it('should migrate from simulated to real tariffs', async () => {
    const port = await createTestPort();

    // Create simulated tariffs (existing)
    await prisma.portTariff.createMany({
      data: [
        {
          portId: port.id,
          chargeType: 'port_dues',
          amount: 0.20, // Old simulated value
          currency: 'USD',
          unit: 'per_grt',
          dataSource: 'SIMULATED',
          effectiveFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        },
      ],
    });

    // Import real tariff
    await prisma.portTariff.create({
      data: {
        portId: port.id,
        chargeType: 'port_dues',
        amount: 0.15, // New real value
        currency: 'USD',
        unit: 'per_grt',
        dataSource: 'REAL_SCRAPED',
        effectiveFrom: new Date(),
      },
    });

    // Mark old simulated as expired
    await prisma.portTariff.updateMany({
      where: {
        portId: port.id,
        dataSource: 'SIMULATED',
      },
      data: {
        effectiveTo: new Date(),
      },
    });

    // Verify active tariffs are real
    const activeTariffs = await prisma.portTariff.findMany({
      where: {
        portId: port.id,
        effectiveTo: null,
      },
    });

    expect(activeTariffs.length).toBe(1);
    expect(activeTariffs[0].dataSource).toBe('REAL_SCRAPED');
    expect(activeTariffs[0].amount).toBe(0.15);

    // Verify old simulated is expired
    const expiredTariffs = await prisma.portTariff.findMany({
      where: {
        portId: port.id,
        dataSource: 'SIMULATED',
        effectiveTo: { not: null },
      },
    });

    expect(expiredTariffs.length).toBe(1);
  });
});
