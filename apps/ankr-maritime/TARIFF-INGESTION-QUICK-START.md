# Tariff Ingestion Pipeline - Quick Start Guide

## 🚀 Getting Started (5 Minutes)

### 1. Apply Database Migrations
```bash
cd /root/apps/ankr-maritime/backend
npm run db:migrate
npm run db:generate
```

### 2. Start the Backend
```bash
npm run dev
```

### 3. Test CLI Commands

#### Dry Run (Preview Only)
```bash
npm run ingest:ports -- SGSIN INMUN --dry-run
```

#### Process Specific Ports
```bash
npm run ingest:ports -- SGSIN INMUN INNSA
```

#### Process All Ports
```bash
npm run ingest:all
```

---

## 📖 Common Use Cases

### Use Case 1: Ingest Single Port via API

```graphql
mutation {
  ingestPortTariffs(
    document: {
      url: "https://example.com/port-tariff.pdf"
      portId: "port_id_here"
    }
  )
}
```

**Response**:
```json
{
  "importedCount": 15,
  "confidence": 0.92
}
```
OR
```json
{
  "reviewTaskId": "review_task_id",
  "confidence": 0.65
}
```

---

### Use Case 2: Bulk Ingestion via GraphQL

```graphql
mutation {
  queueBulkIngestion(
    portIds: ["port_1", "port_2", "port_3"]
    priority: 5
  ) {
    id
    status
    totalPorts
    progress
  }
}
```

**Monitor Progress**:
```graphql
query {
  ingestionJobStatus(jobId: "job_id") {
    id
    status
    progress
    processedPorts
    successCount
    failureCount
    reviewCount
  }
}
```

---

### Use Case 3: Review Low-Confidence Tariffs

**Get Review Queue**:
```graphql
query {
  tariffsNeedingReview(limit: 10) {
    id
    portId
    port {
      name
      unlocode
    }
    confidence
    extractedData
    issues
  }
}
```

**Approve**:
```graphql
mutation {
  approveTariffFromReview(reviewTaskId: "task_id")
}
```

**Reject**:
```graphql
mutation {
  rejectTariffReview(
    reviewTaskId: "task_id"
    reason: "Incorrect charge type classification"
  ) {
    id
    status
  }
}
```

---

### Use Case 4: Detect Price Changes

```graphql
query {
  detectTariffUpdates(
    portId: "port_id"
    newDocument: {
      url: "https://example.com/new-tariff.pdf"
      portId: "port_id"
    }
  ) {
    added
    modified
    removed
    priceChanges
  }
}
```

**Apply Changes**:
```graphql
mutation {
  applyTariffChanges(
    portId: "port_id"
    changes: $changesJson
    document: {
      url: "https://example.com/new-tariff.pdf"
      portId: "port_id"
      effectiveFrom: "2026-02-01T00:00:00Z"
    }
  )
}
```

---

### Use Case 5: Check Statistics

```graphql
query {
  ingestionStats {
    total
    realScraped
    simulated
    reviewPending
    coveragePercent
  }
}

# Port-specific stats
query {
  ingestionStats(portId: "port_id") {
    total
    realScraped
    coveragePercent
  }
}
```

---

### Use Case 6: Manual Schedule Trigger (Admin Only)

```graphql
mutation {
  triggerScheduledUpdate(type: "daily")
}

mutation {
  triggerScheduledUpdate(type: "quarterly")
}
```

---

## 🛠️ Architecture Flow

```
User Action
    ↓
GraphQL Mutation: queueBulkIngestion()
    ↓
BullMQ Worker Queue (Redis)
    ↓
tariff-ingestion-worker.ts
    ↓
For each port:
    ├─ Download PDF (axios)
    ├─ Hash Check (SHA-256)
    ├─ Extract Text (pdf-parse/Tesseract)
    ├─ Structure with LLM (@ankr/eon)
    ├─ 4-Layer Validation
    │   ├─ Schema
    │   ├─ Business Logic
    │   ├─ Duplicate Detection
    │   └─ Confidence Routing
    ├─ Auto-Import (≥0.8) OR Review Queue (<0.8)
    └─ Update Progress
    ↓
Job Complete
    ↓
Update ingestion_jobs table
```

---

## 📋 Key Files Reference

| Purpose | File Path | Lines |
|---------|-----------|-------|
| PDF Extraction | `/src/services/pdf-extraction-service.ts` | 250 |
| Patterns & Regex | `/src/services/tariff-extraction-patterns.ts` | 200 |
| LLM Structuring | `/src/services/llm-tariff-structurer.ts` | 250 |
| Currency Service | `/src/services/currency-service.ts` | 150 |
| Ingestion Logic | `/src/services/tariff-ingestion-service.ts` | 524 |
| BullMQ Worker | `/src/workers/tariff-ingestion-worker.ts` | 400 |
| CLI Script | `/scripts/bulk-ingest-tariffs.ts` | 350 |
| Cron Scheduler | `/src/jobs/tariff-update-scheduler.ts` | 300 |
| GraphQL API | `/src/schema/types/tariff-ingestion.ts` | 367 |

---

## 🔧 Configuration

### Environment Variables
```bash
# Required
DATABASE_URL=postgresql://user:pass@localhost:5432/mari8x
REDIS_URL=redis://localhost:6379
ANKR_EON_API_KEY=your_claude_api_key

# Optional (has fallback)
EXCHANGE_RATE_API_KEY=your_exchange_rate_api_key
```

### Scheduler Configuration

Edit `/src/jobs/tariff-update-scheduler.ts`:

```typescript
// Daily: 2am every day
cron.schedule('0 2 * * *', async () => { ... })

// Weekly: 3am every Sunday
cron.schedule('0 3 * * 0', async () => { ... })

// Monthly: 4am on 1st of month
cron.schedule('0 4 1 * *', async () => { ... })

// Quarterly: 5am on Jan/Apr/Jul/Oct 1st
cron.schedule('0 5 1 1,4,7,10 *', async () => { ... })
```

---

## 🎯 Performance Tuning

### BullMQ Worker
```typescript
// Edit: /src/workers/tariff-ingestion-worker.ts

// Concurrency (parallel jobs)
concurrency: 5  // Default: 5 jobs at once

// Rate limiting
limiter: {
  max: 10,       // Max 10 jobs
  duration: 60000 // Per minute
}

// Delay between ports (respectful scraping)
await this.sleep(30000) // 30 seconds
```

### Currency Cache
```typescript
// Edit: /src/services/currency-service.ts

private readonly CACHE_TTL = 24 * 60 * 60; // 24 hours
```

### LLM Batch Size
```typescript
// Edit: /src/services/llm-tariff-structurer.ts

const CONCURRENCY = 3; // Process 3 documents in parallel
```

---

## 🐛 Troubleshooting

### Issue: "Queue not initialized"
**Solution**: Worker auto-initializes in production. For manual testing:
```typescript
import { tariffIngestionWorker } from './workers/tariff-ingestion-worker.js';
await tariffIngestionWorker.initialize();
```

### Issue: "PDF extraction failed"
**Check**:
1. Is Tesseract installed? `which tesseract`
2. Is pdfjs-dist working? Check logs for errors
3. Try with `preferOcr: true` option

### Issue: "Low confidence extractions"
**Causes**:
- Poor quality scanned PDF → Use OCR
- Unusual tariff format → Add patterns to `tariff-extraction-patterns.ts`
- Missing currency/unit → Update regex patterns

**Solution**: Review and approve manually, or update patterns for future

### Issue: "Duplicate tariff error"
**Expected Behavior**: Duplicate detection prevents re-importing same tariff
**Check**: Verify `portId + chargeType + sizeRange` uniqueness

---

## 📊 Monitoring

### Check Queue Metrics
```typescript
import { tariffIngestionWorker } from './workers/tariff-ingestion-worker.js';

const metrics = await tariffIngestionWorker.getQueueMetrics();
console.log(metrics);
// { waiting: 5, active: 2, completed: 100, failed: 3, delayed: 0 }
```

### Check Recent Jobs (GraphQL)
```graphql
query {
  recentIngestionJobs(limit: 10, status: "failed") {
    id
    status
    errorLog
    createdAt
  }
}
```

### Check Coverage
```graphql
query {
  ingestionStats {
    coveragePercent  # % of tariffs from real sources
    reviewPending    # Count needing manual review
  }
}
```

---

## 🧪 Testing

### Unit Tests (Pending)
```bash
npm run test -- tariff-extraction
npm run test -- currency-service
npm run test -- llm-structurer
```

### E2E Tests (Pending)
```bash
npm run test:e2e -- tariff-ingestion
```

### Manual Test with Sample PDF
```typescript
import { tariffIngestionService } from './services/tariff-ingestion-service.js';

const result = await tariffIngestionService.ingestFromUrl({
  url: 'https://example.com/sample-tariff.pdf',
  portId: 'port_id_here',
});

console.log(result);
```

---

## 📚 Additional Resources

- **Full Implementation Doc**: `TARIFF-INGESTION-COMPLETE.md`
- **Status Doc**: `TARIFF-INGESTION-IMPLEMENTATION-STATUS.md`
- **GraphQL Schema**: `/src/schema/types/tariff-ingestion.ts`
- **Database Schema**: `/prisma/schema.prisma` (lines 4721-4809)

---

## 🆘 Support

**Issues?** Check:
1. Database migrations applied? `npm run db:migrate`
2. Redis running? `redis-cli ping`
3. Environment variables set?
4. Check logs in console

**Questions?** Reference the full implementation docs above.

---

**Quick Start Complete!** 🎉
**Next**: Run your first ingestion with `npm run ingest:ports -- SGSIN --dry-run`
