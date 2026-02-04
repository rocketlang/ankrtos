# PageIndex + Email Intelligence + Vector RAG Integration
## February 4, 2026

## 🎯 Executive Summary

**Current Status:**
- ✅ **Email Intelligence**: WORLD-CLASS, 1,264 lines, production-ready
- ✅ **PageIndex Router**: Implemented, needs initialization (273 lines)
- ✅ **Vector RAG**: Implemented (maritime-rag.ts)
- ⏳ **Integration**: Need to connect all 3 systems for intelligent email routing

---

## 📊 What We Have

### 1. Email Intelligence ✅ (COMPLETE)

**email-parser.ts (675 lines)**:
- Entity extraction (vessels, ports, cargo, dates, amounts)
- Email categorization (9 categories)
- Sentiment analysis (urgent, positive, negative, neutral)
- Deal terms extraction (rate, laycan, ports, quantity, commission)
- Email summarization

**email-classifier.ts (589 lines)**:
- AI-powered classification (10 categories)
- Urgency levels (CRITICAL, HIGH, MEDIUM, LOW)
- Actionability detection (REQUIRES_RESPONSE, REQUIRES_APPROVAL, REQUIRES_ACTION)
- Entity extraction with context
- Deal term parsing
- Role assignment
- Batch processing

### 2. PageIndex Router ✅ (NEEDS INITIALIZATION)

**pageindex-router.ts (273 lines)**:
- `MaritimePageIndexRouter` class
- Query classification with Claude Haiku
- RouterCache with TTL (1h classification, 2h navigation, 30min answers)
- Router integration with fallback
- Statistics tracking
- Health check

**Status**: Implemented but lines 83-92 have TODOs:
```typescript
// TODO: Initialize HybridSearchService
// this.hybridSearch = new HybridSearchService(...);
// this.router.setHybridSearch(this.hybridSearch);

// TODO: Initialize PageIndexSearchService
// this.pageIndexSearch = new PageIndexSearchService(...);
// this.router.setPageIndexSearch(this.pageIndexSearch);
```

### 3. Vector RAG ✅ (COMPLETE)

**maritime-rag.ts**:
- Document ingestion with chunking
- Semantic search with embeddings
- RAG answer generation
- Source tracking
- Multi-tenant support
- Router method selection: `method?: 'auto' | 'hybrid' | 'pageindex'`

---

## 🚀 Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    INCOMING EMAIL                            │
│         (Broker/Agent via IMAP, Gmail API, etc.)            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              EMAIL INTELLIGENCE LAYER                        │
│  • Parse entities (vessels, ports, cargo, dates, amounts)   │
│  • Classify category (FIXTURE, OPERATIONS, CLAIMS, etc.)    │
│  • Determine urgency (CRITICAL, HIGH, MEDIUM, LOW)          │
│  • Extract deal terms (rate, laycan, ports, quantity)       │
│  • Detect actionability (response, approval, action)        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                SMART ROUTING DECISION                        │
│                                                              │
│  IF (fixture offer with deal terms):                        │
│     → Match against open positions (vessel availability)    │
│     → Match against cargo enquiries (shipper requirements)  │
│     → Route to commercial_manager                           │
│                                                              │
│  IF (operations update with vessel):                        │
│     → Update voyage timeline                                │
│     → Trigger proximity alerts                              │
│     → Route to ops_manager                                  │
│                                                              │
│  IF (compliance alert):                                     │
│     → Check vessel certificates                             │
│     → Flag expiring documents                               │
│     → Route to compliance_officer                           │
│                                                              │
│  IF (claim/dispute):                                        │
│     → Search related charter party clauses                  │
│     → Extract laytime calculation references                │
│     → Route to commercial_manager                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              KNOWLEDGE RETRIEVAL LAYER                       │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │         PageIndex Router (AUTO)                    │    │
│  │  • Classifies query complexity                     │    │
│  │  • SIMPLE → Hybrid Search (vector + full-text)    │    │
│  │  • COMPLEX → PageIndex (tree navigation)          │    │
│  └─────┬──────────────────────────┬───────────────────┘    │
│        │                          │                         │
│        ▼                          ▼                         │
│  ┌──────────────┐          ┌──────────────┐                │
│  │Hybrid Search │          │PageIndex Tree│                │
│  │(Quick Facts) │          │ (Deep Docs)  │                │
│  │• Port tariffs│          │• Charter CPs │                │
│  │• DA costs    │          │• COAs        │                │
│  │• Vessel specs│          │• Regulations │                │
│  └──────────────┘          └──────────────┘                │
│                                                              │
│  Both use:                                                  │
│  • Pgvector embeddings (768-dim)                           │
│  • Full-text search (tsvector)                             │
│  • Metadata filtering (vessel, voyage, docType)            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    ANSWER GENERATION                         │
│  • Synthesize from multiple sources                         │
│  • Cite specific documents + page numbers                   │
│  • Provide confidence scores                                │
│  • Suggest follow-up questions                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              INTELLIGENT RESPONSE LAYER                      │
│                                                              │
│  FOR commercial_manager:                                    │
│    • Draft counter-offer with TCE calculations             │
│    • Show similar fixtures (last 30 days)                  │
│    • Market rate comparison                                │
│                                                              │
│  FOR ops_manager:                                           │
│    • Update voyage ETA                                      │
│    • Generate proforma DA                                   │
│    • Alert nearby vessels                                   │
│                                                              │
│  FOR compliance_officer:                                    │
│    • List missing certificates                              │
│    • Show regulatory requirements                           │
│    • Generate compliance checklist                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementation Tasks

### Task 1: Initialize PageIndex Search Services (HIGH PRIORITY)

**File**: `backend/src/services/rag/pageindex-router.ts`

**Current (lines 83-92)**:
```typescript
async initialize() {
  // TODO: Initialize HybridSearchService
  // this.hybridSearch = new HybridSearchService(...);
  // this.router.setHybridSearch(this.hybridSearch);

  // TODO: Initialize PageIndexSearchService
  // this.pageIndexSearch = new PageIndexSearchService(...);
  // this.router.setPageIndexSearch(this.pageIndexSearch);

  console.log('Maritime PageIndex Router initialized');
}
```

**What to implement**:
```typescript
async initialize() {
  // Initialize HybridSearchService
  this.hybridSearch = new HybridSearchService({
    pgPool: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    },
    embedding: {
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      model: 'voyage-3',
      baseUrl: process.env.AI_PROXY_URL,
    },
    table: 'document_chunks', // Or your RAG table name
    embeddingColumn: 'embedding',
    contentColumn: 'content',
    metadataColumn: 'metadata',
  });

  this.router.setHybridSearch(this.hybridSearch);

  // Initialize PageIndexSearchService
  this.pageIndexSearch = new PageIndexSearchService({
    pgPool: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    },
    embedding: {
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      model: 'voyage-3',
      baseUrl: process.env.AI_PROXY_URL,
    },
    table: 'pageindex_trees', // PageIndex tree table
    treeColumn: 'tree_structure',
    metadataColumn: 'metadata',
  });

  this.router.setPageIndexSearch(this.pageIndexSearch);

  console.log('Maritime PageIndex Router initialized with HybridSearch & PageIndex');
}
```

**Time**: 2 hours

---

### Task 2: Email-to-RAG Query Bridge (NEW)

**File**: `backend/src/services/email-rag-bridge.ts` (NEW - 400 lines)

**Purpose**: Convert email classification results into optimized RAG queries

```typescript
import { emailClassifier, EmailCategory } from './ai/email-classifier.js';
import { maritimeRAG } from './rag/maritime-rag.js';
import { maritimeRouter } from './rag/pageindex-router.js';

interface EmailQueryContext {
  category: EmailCategory;
  urgency: string;
  actionable: string;
  entities: {
    vessels?: string[];
    ports?: string[];
    amounts?: any[];
    references?: any[];
  };
  dealTerms?: any;
}

export class EmailRAGBridge {
  /**
   * Process email and generate RAG query
   */
  async processEmail(subject: string, body: string, organizationId: string) {
    // Step 1: Classify email
    const classification = await emailClassifier.classifyEmail(
      subject,
      body,
      'unknown',
      organizationId
    );

    // Step 2: Determine RAG strategy based on category
    const ragQueries = this.generateRAGQueries(classification);

    // Step 3: Execute queries using appropriate method
    const results = await Promise.all(
      ragQueries.map((query) =>
        this.executeQuery(query, classification, organizationId)
      )
    );

    // Step 4: Synthesize results
    return this.synthesizeResults(classification, results);
  }

  /**
   * Generate RAG queries based on email classification
   */
  private generateRAGQueries(classification: any): string[] {
    const queries: string[] = [];

    switch (classification.category) {
      case 'fixture':
        // For fixture emails, search for:
        // 1. Similar fixtures (market intelligence)
        // 2. Charter party templates
        // 3. Vessel availability
        if (classification.dealTerms?.vesselName) {
          queries.push(
            `Find charter party clauses for vessels similar to ${classification.dealTerms.vesselName}`
          );
        }
        if (
          classification.dealTerms?.loadPort &&
          classification.dealTerms?.dischargePort
        ) {
          queries.push(
            `Show recent fixtures from ${classification.dealTerms.loadPort} to ${classification.dealTerms.dischargePort}`
          );
        }
        if (classification.dealTerms?.cargoType) {
          queries.push(
            `What are typical freight rates for ${classification.dealTerms.cargoType}?`
          );
        }
        break;

      case 'operations':
        // For operations emails, search for:
        // 1. Port information
        // 2. Vessel voyage history
        // 3. Proforma DA costs
        if (classification.extractedEntities.ports?.length) {
          const port = classification.extractedEntities.ports[0];
          queries.push(`What are the port charges at ${port}?`);
          queries.push(`Show typical proforma DA costs for ${port}`);
        }
        if (classification.extractedEntities.vessels?.length) {
          const vessel = classification.extractedEntities.vessels[0];
          queries.push(`Show recent voyage history for ${vessel}`);
        }
        break;

      case 'claims':
        // For claims/disputes, search for:
        // 1. Charter party laytime clauses
        // 2. SOF/time sheet templates
        // 3. Similar past claims
        queries.push('Show charter party laytime calculation clauses');
        queries.push('What are typical demurrage dispute resolution steps?');
        if (classification.extractedEntities.references?.length) {
          const ref = classification.extractedEntities.references[0];
          queries.push(`Find charter party ${ref.value} laytime terms`);
        }
        break;

      case 'compliance':
        // For compliance emails, search for:
        // 1. Regulatory requirements
        // 2. Certificate expiry dates
        // 3. Compliance checklists
        if (classification.extractedEntities.vessels?.length) {
          const vessel = classification.extractedEntities.vessels[0];
          queries.push(`Show certificate status for vessel ${vessel}`);
          queries.push(`What are IMO compliance requirements for ${vessel}?`);
        }
        break;

      case 'bunker':
        // For bunker emails, search for:
        // 1. Bunker prices at ports
        // 2. Quality specifications
        // 3. Delivery terms
        if (classification.extractedEntities.ports?.length) {
          const port = classification.extractedEntities.ports[0];
          queries.push(`Show current bunker prices at ${port}`);
        }
        break;

      default:
        // General query
        queries.push(`Summarize relevant information about: ${subject}`);
    }

    return queries;
  }

  /**
   * Execute RAG query using appropriate method (hybrid vs pageindex)
   */
  private async executeQuery(
    query: string,
    classification: any,
    organizationId: string
  ) {
    // Determine method based on query complexity
    let method: 'auto' | 'hybrid' | 'pageindex' = 'auto';

    // Use PageIndex for complex document navigation
    if (
      query.includes('charter party') ||
      query.includes('COA') ||
      query.includes('clauses') ||
      query.includes('terms and conditions')
    ) {
      method = 'pageindex';
    }

    // Use Hybrid for quick facts
    if (
      query.includes('price') ||
      query.includes('cost') ||
      query.includes('rate') ||
      query.includes('recent')
    ) {
      method = 'hybrid';
    }

    // Execute via router
    const result = await maritimeRouter.ask(
      query,
      {
        method,
        docTypes: this.getRelevantDocTypes(classification.category),
        limit: 5,
      },
      organizationId
    );

    return result;
  }

  /**
   * Get relevant document types for email category
   */
  private getRelevantDocTypes(category: string): string[] {
    const docTypeMap: Record<string, string[]> = {
      fixture: ['charter_party', 'fixture_recap', 'coa'],
      operations: ['noon_report', 'sof', 'port_tariff', 'proforma_da'],
      claims: ['charter_party', 'sof', 'time_sheet', 'claim_correspondence'],
      compliance: ['certificate', 'inspection_report', 'regulation'],
      bunker: ['bunker_dn', 'bunker_quotation'],
      finance: ['invoice', 'bank_guarantee', 'letter_of_credit'],
      technical: ['survey_report', 'repair_quotation', 'classification_record'],
    };

    return docTypeMap[category] || [];
  }

  /**
   * Synthesize RAG results into actionable response
   */
  private synthesizeResults(classification: any, results: any[]) {
    return {
      emailClassification: {
        category: classification.category,
        urgency: classification.urgency,
        actionable: classification.actionable,
        confidence: classification.confidence,
      },
      ragAnswers: results,
      suggestedActions: this.generateSuggestedActions(classification, results),
      draftResponse: this.generateDraftResponse(classification, results),
    };
  }

  /**
   * Generate suggested actions based on email + RAG context
   */
  private generateSuggestedActions(classification: any, results: any[]): string[] {
    const actions: string[] = [];

    if (classification.category === 'fixture') {
      actions.push('Create counter-offer using TCE calculator');
      actions.push('Check vessel availability');
      actions.push('Review similar fixtures from last 30 days');
    }

    if (classification.category === 'operations') {
      actions.push('Update voyage ETA');
      actions.push('Generate proforma DA');
      actions.push('Notify master via Swayam');
    }

    if (classification.category === 'claims') {
      actions.push('Review charter party laytime clauses');
      actions.push('Prepare time sheet with SOF');
      actions.push('Consult legal team if >$50K');
    }

    return actions;
  }

  /**
   * Generate draft email response
   */
  private generateDraftResponse(classification: any, results: any[]): string {
    // TODO: Use Claude to generate contextual draft response
    // based on email classification + RAG results
    return 'Draft response will be generated here...';
  }
}

export const emailRAGBridge = new EmailRAGBridge();
```

**Time**: 1 day

---

### Task 3: Email Sorting & Bucketization (NEW)

**File**: `backend/src/services/email-sorting-engine.ts` (NEW - 300 lines)

**Purpose**: Sort and bucketize emails for intelligent routing

```typescript
import { emailClassifier } from './ai/email-classifier.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface EmailBucket {
  id: string;
  name: string;
  category: string;
  urgency: string;
  autoRespond: boolean;
  assignToRole: string;
  notificationChannels: string[]; // email, sms, slack, whatsapp
  escalationRules?: {
    afterMinutes: number;
    escalateTo: string;
  };
}

export class EmailSortingEngine {
  /**
   * Default buckets for maritime operations
   */
  private defaultBuckets: EmailBucket[] = [
    {
      id: 'fixture-urgent',
      name: 'Urgent Fixture Offers',
      category: 'fixture',
      urgency: 'critical',
      autoRespond: true,
      assignToRole: 'commercial_manager',
      notificationChannels: ['sms', 'slack'],
      escalationRules: {
        afterMinutes: 60,
        escalateTo: 'ceo',
      },
    },
    {
      id: 'fixture-normal',
      name: 'Fixture Offers',
      category: 'fixture',
      urgency: 'high',
      autoRespond: false,
      assignToRole: 'commercial_manager',
      notificationChannels: ['email', 'slack'],
    },
    {
      id: 'ops-critical',
      name: 'Critical Operations',
      category: 'operations',
      urgency: 'critical',
      autoRespond: true,
      assignToRole: 'ops_manager',
      notificationChannels: ['sms', 'slack'],
      escalationRules: {
        afterMinutes: 30,
        escalateTo: 'director_operations',
      },
    },
    {
      id: 'claims',
      name: 'Claims & Disputes',
      category: 'claims',
      urgency: 'high',
      autoRespond: false,
      assignToRole: 'commercial_manager',
      notificationChannels: ['email', 'slack'],
    },
    {
      id: 'compliance',
      name: 'Compliance Alerts',
      category: 'compliance',
      urgency: 'medium',
      autoRespond: false,
      assignToRole: 'compliance_officer',
      notificationChannels: ['email'],
    },
    {
      id: 'bunker',
      name: 'Bunker Enquiries',
      category: 'bunker',
      urgency: 'medium',
      autoRespond: false,
      assignToRole: 'ops_manager',
      notificationChannels: ['email'],
    },
    {
      id: 'finance',
      name: 'Finance & Payments',
      category: 'finance',
      urgency: 'high',
      autoRespond: false,
      assignToRole: 'finance_manager',
      notificationChannels: ['email', 'slack'],
    },
    {
      id: 'general',
      name: 'General Correspondence',
      category: 'general',
      urgency: 'low',
      autoRespond: false,
      assignToRole: 'user',
      notificationChannels: ['email'],
    },
  ];

  /**
   * Sort email into appropriate bucket
   */
  async sortEmail(emailId: string, organizationId: string) {
    // Get email
    const email = await prisma.emailMessage?.findUnique({
      where: { id: emailId },
    });

    if (!email) {
      throw new Error('Email not found');
    }

    // Classify email
    const classification = await emailClassifier.classifyEmail(
      email.subject,
      email.body || '',
      email.fromEmail,
      organizationId
    );

    // Find matching bucket
    const bucket = this.findBucket(classification);

    // Assign to bucket
    await prisma.emailMessage?.update({
      where: { id: emailId },
      data: {
        bucket: bucket.id,
        assignedToRole: bucket.assignToRole,
        category: classification.category,
        urgency: classification.urgency,
        actionable: classification.actionable,
      },
    });

    // Trigger notifications
    await this.sendNotifications(email, classification, bucket);

    // Auto-respond if enabled
    if (bucket.autoRespond && classification.actionable === 'requires_response') {
      await this.sendAutoResponse(email, classification);
    }

    // Schedule escalation if needed
    if (bucket.escalationRules && classification.urgency === 'critical') {
      await this.scheduleEscalation(emailId, bucket);
    }

    return {
      bucket: bucket.name,
      assignedTo: bucket.assignToRole,
      notifications: bucket.notificationChannels,
      autoResponded: bucket.autoRespond,
    };
  }

  /**
   * Find matching bucket for email classification
   */
  private findBucket(classification: any): EmailBucket {
    // Match by category + urgency first
    let bucket = this.defaultBuckets.find(
      (b) =>
        b.category === classification.category &&
        b.urgency === classification.urgency
    );

    // Fallback to category only
    if (!bucket) {
      bucket = this.defaultBuckets.find(
        (b) => b.category === classification.category
      );
    }

    // Fallback to general
    if (!bucket) {
      bucket = this.defaultBuckets.find((b) => b.category === 'general')!;
    }

    return bucket;
  }

  /**
   * Send notifications via configured channels
   */
  private async sendNotifications(email: any, classification: any, bucket: EmailBucket) {
    for (const channel of bucket.notificationChannels) {
      switch (channel) {
        case 'sms':
          // TODO: Send SMS via Twilio
          console.log(`[SMS] ${bucket.name}: ${email.subject}`);
          break;
        case 'slack':
          // TODO: Send Slack message
          console.log(`[Slack] ${bucket.name}: ${email.subject}`);
          break;
        case 'whatsapp':
          // TODO: Send WhatsApp via Business API
          console.log(`[WhatsApp] ${bucket.name}: ${email.subject}`);
          break;
        case 'email':
          // TODO: Send email notification
          console.log(`[Email] ${bucket.name}: ${email.subject}`);
          break;
      }
    }
  }

  /**
   * Send auto-response (acknowledgment)
   */
  private async sendAutoResponse(email: any, classification: any) {
    // TODO: Generate and send auto-response
    console.log(`Auto-responding to: ${email.subject}`);
  }

  /**
   * Schedule escalation job
   */
  private async scheduleEscalation(emailId: string, bucket: EmailBucket) {
    if (!bucket.escalationRules) return;

    // TODO: Schedule background job to escalate after X minutes
    console.log(
      `Escalation scheduled for ${emailId} after ${bucket.escalationRules.afterMinutes} minutes`
    );
  }

  /**
   * Get email counts by bucket
   */
  async getBucketStats(organizationId: string) {
    const stats: Record<string, number> = {};

    for (const bucket of this.defaultBuckets) {
      const count = await prisma.emailMessage?.count({
        where: {
          organizationId,
          bucket: bucket.id,
        },
      });

      stats[bucket.name] = count || 0;
    }

    return stats;
  }
}

export const emailSortingEngine = new EmailSortingEngine();
```

**Time**: 1 day

---

### Task 4: Unified Email Intelligence API (GraphQL)

**File**: `backend/src/schema/types/email-intelligence.ts` (NEW - 250 lines)

**Purpose**: Expose email + PageIndex + RAG integration via GraphQL

```typescript
import { builder } from '../builder.js';
import { emailRAGBridge } from '../../services/email-rag-bridge.js';
import { emailSortingEngine } from '../../services/email-sorting-engine.ts';
import { maritimeRouter } from '../../services/rag/pageindex-router.js';

// === Types ===

const EmailIntelligenceResultType = builder.objectRef<any>('EmailIntelligenceResult');

EmailIntelligenceResultType.implement({
  fields: (t) => ({
    emailClassification: t.field({
      type: 'JSON',
      resolve: (parent) => parent.emailClassification,
    }),
    ragAnswers: t.field({
      type: ['JSON'],
      resolve: (parent) => parent.ragAnswers,
    }),
    suggestedActions: t.stringList({
      resolve: (parent) => parent.suggestedActions,
    }),
    draftResponse: t.string({
      resolve: (parent) => parent.draftResponse,
    }),
  }),
});

// === Queries ===

builder.queryFields((t) => ({
  processEmailIntelligence: t.field({
    type: EmailIntelligenceResultType,
    args: {
      subject: t.arg.string({ required: true }),
      body: t.arg.string({ required: true }),
    },
    authScopes: {
      authenticated: true,
    },
    resolve: async (_parent, args, ctx) => {
      const result = await emailRAGBridge.processEmail(
        args.subject,
        args.body,
        ctx.user!.organizationId
      );
      return result;
    },
  }),

  emailBucketStats: t.field({
    type: 'JSON',
    authScopes: {
      authenticated: true,
    },
    resolve: async (_parent, _args, ctx) => {
      const stats = await emailSortingEngine.getBucketStats(
        ctx.user!.organizationId
      );
      return stats;
    },
  }),

  pageIndexRouterStats: t.field({
    type: 'JSON',
    authScopes: {
      authenticated: true,
    },
    resolve: async () => {
      const stats = await maritimeRouter.getStats();
      return stats;
    },
  }),
}));

// === Mutations ===

builder.mutationFields((t) => ({
  sortEmail: t.field({
    type: 'JSON',
    args: {
      emailId: t.arg.string({ required: true }),
    },
    authScopes: {
      authenticated: true,
    },
    resolve: async (_parent, args, ctx) => {
      const result = await emailSortingEngine.sortEmail(
        args.emailId,
        ctx.user!.organizationId
      );
      return result;
    },
  }),

  clearPageIndexCache: t.field({
    type: 'Boolean',
    authScopes: {
      role: 'admin',
    },
    resolve: async () => {
      await maritimeRouter.clearCache();
      return true;
    },
  }),
}));
```

**Time**: 4 hours

---

### Task 5: Email Sync Service (IMAP/Gmail API) (OPTIONAL)

**File**: `backend/src/services/email-sync.ts` (NEW - 500 lines)

**Purpose**: Auto-fetch emails from IMAP/Gmail and process them

**Features**:
- IMAP connection with OAuth2
- Gmail API integration
- Email deduplication by Message-ID
- Auto-classification on fetch
- Real-time processing

**Time**: 2 days

---

## 📊 Implementation Summary

| Task | File | Lines | Time | Priority |
|------|------|-------|------|----------|
| 1. PageIndex Initialization | pageindex-router.ts | +50 | 2h | HIGH |
| 2. Email-RAG Bridge | email-rag-bridge.ts | 400 | 1d | HIGH |
| 3. Email Sorting Engine | email-sorting-engine.ts | 300 | 1d | HIGH |
| 4. GraphQL API | email-intelligence.ts | 250 | 4h | MEDIUM |
| 5. Email Sync (Optional) | email-sync.ts | 500 | 2d | LOW |

**Total**: 1,500 lines, 4-5 days

---

## 🎯 Expected Outcomes

### 1. Intelligent Email Processing
- ✅ Auto-classify emails (10 categories, 4 urgency levels)
- ✅ Extract entities (vessels, ports, cargo, dates, amounts)
- ✅ Parse deal terms (rate, laycan, ports, quantity, commission)
- ✅ Route to appropriate role automatically

### 2. Context-Aware RAG
- ✅ Hybrid Search for quick facts (port tariffs, bunker prices, vessel specs)
- ✅ PageIndex for deep document navigation (charter parties, COAs, regulations)
- ✅ Auto-select method based on query complexity

### 3. Smart Bucketization
- ✅ 8 default buckets (urgent fixtures, operations, claims, etc.)
- ✅ Auto-assignment to roles
- ✅ Multi-channel notifications (email, SMS, Slack, WhatsApp)
- ✅ Escalation rules for critical emails

### 4. Actionable Intelligence
- ✅ Generate suggested actions (create counter-offer, update ETA, review CP)
- ✅ Draft responses based on email type
- ✅ Link to related documents via RAG
- ✅ Show market intelligence for fixtures

---

## 🔐 Environment Variables

```bash
# PageIndex Router
ENABLE_PAGEINDEX_ROUTER=true
ENABLE_ROUTER_CACHE=true
DEFAULT_ROUTER_METHOD=auto  # auto, hybrid, or pageindex

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mari8x
DB_USER=postgres
DB_PASSWORD=...

# AI/Embeddings
ANTHROPIC_API_KEY=...
AI_PROXY_URL=https://your-proxy.com/v1

# Email Sync (Optional)
EMAIL_IMAP_HOST=imap.gmail.com
EMAIL_IMAP_PORT=993
EMAIL_IMAP_USER=...
EMAIL_IMAP_PASSWORD=...
EMAIL_SYNC_INTERVAL_MINUTES=5
```

---

## 🧪 Testing Strategy

### Unit Tests
```bash
npm test email-rag-bridge.test.ts
npm test email-sorting-engine.test.ts
npm test pageindex-router.test.ts
```

### Integration Tests
```bash
# Test full flow: Email → Classification → RAG → Response
npm test:e2e email-intelligence-flow.test.ts

# Test bucket sorting
npm test:e2e email-sorting-flow.test.ts

# Test PageIndex routing
npm test:e2e pageindex-routing-flow.test.ts
```

### Manual Testing
1. Send test fixture email → Verify classification → Check RAG results
2. Send test operations email → Verify proforma DA retrieval
3. Send test claim email → Verify charter party clause extraction
4. Send test compliance email → Verify certificate status check

---

## 📈 Success Metrics

### Email Processing
- ✅ **Classification Accuracy**: >95% (measure against manual labels)
- ✅ **Entity Extraction Accuracy**: >90%
- ✅ **Processing Latency**: <2 seconds per email
- ✅ **Auto-Response Rate**: >70% for fixture offers

### RAG Performance
- ✅ **Answer Relevance**: >85% (user feedback)
- ✅ **Hybrid Search Latency**: <500ms
- ✅ **PageIndex Latency**: <2 seconds
- ✅ **Cache Hit Rate**: >60%

### User Impact
- ✅ **Time Saved**: 5-10 minutes per email → <1 minute
- ✅ **Missed Opportunities**: 0 (all urgent fixtures flagged)
- ✅ **Response Time**: 1 hour → 10 minutes (for urgent emails)

---

## 🎉 Conclusion

### What We Have ✅
1. **World-class email intelligence** (1,264 lines)
2. **PageIndex router** (273 lines, needs initialization)
3. **Vector RAG** (complete)

### What We Need ⏳
1. Initialize PageIndex search services (2 hours)
2. Build Email-RAG bridge (1 day)
3. Build email sorting engine (1 day)
4. Create GraphQL API (4 hours)

**Total**: 1,500 lines, 4-5 days

### Business Impact 💰
- **Time savings**: 5-10 min → <1 min per email = 90% reduction
- **Opportunity capture**: 100% of urgent fixtures flagged instantly
- **Compliance**: 100% of regulatory emails routed to compliance officer
- **Customer satisfaction**: Faster response times, better service

---

**Created**: February 4, 2026
**Status**: Integration plan ready
**Next**: Task 1 - Initialize PageIndex services (2 hours)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
