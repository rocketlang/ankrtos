# PageIndex Integration - TODO Plan
## ANKR Labs RAG Enhancement Project

**Project Start:** February 1, 2026
**Status:** Planning Phase
**Project Lead:** ANKR Labs RAG Team

---

## Quick Reference

```bash
# Project tracking
Task Status: ⬜ Not Started | 🔄 In Progress | ✅ Complete | ⚠️ Blocked | ❌ Cancelled

# Project location
/root/ankr-labs-nx/packages/ankr-pageindex/
/root/ankr-labs-nx/packages/ankr-rag-router/
```

**Key Repositories:**
- PageIndex SDK: https://github.com/VectifyAI/PageIndex
- PageIndex MCP: https://github.com/VectifyAI/pageindex-mcp
- Documentation: https://docs.pageindex.ai/

---

## 📋 PHASE 0: Pre-POC Setup (Week 1)

### Day 1-2: Repository Setup & Research

#### ⬜ TASK-001: Clone and Review PageIndex
**Priority:** 🔥 Critical
**Assignee:** Lead Engineer
**Estimated Time:** 4 hours

```bash
# 1. Clone PageIndex repository
cd /root/ankr-labs-nx/packages
git clone https://github.com/VectifyAI/PageIndex ankr-pageindex-vendor

# 2. Review core files
cd ankr-pageindex-vendor
cat README.md
ls -la src/

# 3. Check dependencies
cat package.json
npm install

# 4. Run examples
cd examples
node simple-rag.js
```

**Deliverables:**
- [ ] PageIndex repo cloned
- [ ] Dependencies installed
- [ ] Example scripts tested
- [ ] Architecture documented in `/docs/pageindex-review.md`

**Acceptance Criteria:**
- Examples run successfully
- Core API understood
- Integration points identified

---

#### ⬜ TASK-002: Audit Current RAG Implementation
**Priority:** 🔥 Critical
**Assignee:** Backend Team
**Estimated Time:** 6 hours

**Files to Review:**
```
/root/HybridSearch.service.ts
/root/apps/ankr-maritime/backend/src/services/rag/maritime-rag.ts
/root/ankr-labs-nx/packages/ankr-mcp/src/tools/logistics/rag.ts
/root/ankr-labs-nx/packages/ankr-rag/src/rag-service.ts
```

**Tasks:**
- [ ] Document current architecture (diagram in Mermaid)
- [ ] Identify integration points for PageIndex
- [ ] List all document types currently indexed
- [ ] Measure current accuracy on test queries
- [ ] Document current latency (p50, p95, p99)

**Deliverables:**
- [ ] Current state documentation: `/docs/current-rag-architecture.md`
- [ ] Baseline metrics spreadsheet
- [ ] Integration strategy document

---

#### ⬜ TASK-003: Select Test Documents
**Priority:** ⚡ High
**Assignee:** Maritime Product Team
**Estimated Time:** 3 hours

**Selection Criteria:**
```typescript
interface TestDocument {
  id: string;
  docType: 'charter_party' | 'compliance' | 'financial_report';
  pageCount: number; // Prefer 20-100 pages
  hasTableOfContents: boolean;
  hasCrossReferences: boolean; // "See Appendix X"
  complexity: 'simple' | 'medium' | 'complex';
}
```

**Target Mix:**
- [ ] 5 charter parties (50-150 pages each)
- [ ] 3 compliance documents (DOT/FMCSA regulations)
- [ ] 2 financial reports (voyage P&L with appendices)

**Deliverables:**
- [ ] List of 10 test documents with metadata
- [ ] Documents extracted to `/test-data/pageindex-poc/`
- [ ] Test document registry: `test-documents.json`

---

#### ⬜ TASK-004: Create Query Test Set
**Priority:** ⚡ High
**Assignee:** QA Team
**Estimated Time:** 4 hours

**Query Distribution:**
```
Total: 50 queries
├── Simple (25) - Single fact, keyword-based
│   ├── "What's the vessel IMO number in charter X?"
│   ├── "Who is the charterer in the FreightBox-Maersk agreement?"
│   └── "What's the laytime allowance?"
│
└── Complex (25) - Multi-hop, cross-reference, reasoning
    ├── "What's the demurrage calculation including exceptions?"
    ├── "How are team driver HOS rules different from solo?"
    └── "What was the Q4 off-hire adjustment and why?"
```

**Deliverables:**
- [ ] 50 queries in `/test-data/queries.json`
- [ ] Ground truth answers for each query
- [ ] Query classification (simple/complex)
- [ ] Expected sources for each answer

**Template:**
```json
{
  "queries": [
    {
      "id": "Q001",
      "text": "What's the demurrage rate in the Baltic charter?",
      "classification": "complex",
      "expectedAnswer": "Per Clause 12.3, demurrage is $5,000/day...",
      "expectedSources": ["Clause 12.3", "Appendix C"],
      "documentId": "charter-baltic-2025"
    }
  ]
}
```

---

#### ⬜ TASK-005: Set Up Development Environment
**Priority:** ⚡ High
**Assignee:** DevOps
**Estimated Time:** 3 hours

```bash
# 1. Create packages
cd /root/ankr-labs-nx
mkdir -p packages/ankr-pageindex
mkdir -p packages/ankr-rag-router
mkdir -p packages/ankr-pageindex/test-data

# 2. Initialize package.json
cat > packages/ankr-pageindex/package.json <<EOF
{
  "name": "@ankr/pageindex",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsup",
    "test": "vitest",
    "dev": "tsup --watch"
  },
  "dependencies": {
    "pageindex": "latest",
    "@anthropic-ai/sdk": "^0.30.0",
    "pdf-parse": "^1.1.1"
  }
}
EOF

# 3. Set up TypeScript config
cat > packages/ankr-pageindex/tsconfig.json <<EOF
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
EOF

# 4. Create directory structure
mkdir -p packages/ankr-pageindex/src/{indexer,search,router,utils}
mkdir -p packages/ankr-pageindex/test
```

**Deliverables:**
- [ ] Package structure created
- [ ] Dependencies installed
- [ ] TypeScript compilation working
- [ ] Test framework configured

---

### Day 3-4: Baseline Measurement

#### ⬜ TASK-006: Benchmark Current RAG Performance
**Priority:** 🔥 Critical
**Assignee:** QA + Backend
**Estimated Time:** 8 hours

**Script to Create:**
```typescript
// packages/ankr-pageindex/test/benchmark-current-rag.ts
import { HybridSearchService } from '@ankr/rag';
import testQueries from '../test-data/queries.json';

async function benchmark() {
  const results = [];

  for (const query of testQueries.queries) {
    const startTime = Date.now();

    const answer = await hybridSearch.search(query.text, {
      limit: 5,
      docTypes: [query.documentType]
    });

    const latency = Date.now() - startTime;
    const accuracy = evaluateAccuracy(answer, query.expectedAnswer);

    results.push({
      queryId: query.id,
      classification: query.classification,
      latency,
      accuracy,
      sourcesFound: answer.sources.length
    });
  }

  return analyzeResults(results);
}
```

**Metrics to Capture:**
- [ ] Accuracy (simple queries): ____%
- [ ] Accuracy (complex queries): ____%
- [ ] Latency p50: ____ms
- [ ] Latency p95: ____ms
- [ ] Multi-hop success rate: ____%

**Deliverables:**
- [ ] Benchmark script: `benchmark-current-rag.ts`
- [ ] Baseline results: `baseline-results.json`
- [ ] Analysis report: `/docs/baseline-performance.md`

---

#### ⬜ TASK-007: Document Extraction Utility
**Priority:** ⚡ High
**Assignee:** Backend Engineer
**Estimated Time:** 6 hours

**Features Needed:**
1. PDF → Text extraction
2. Table of Contents (ToC) extraction
3. Section/heading detection
4. Cross-reference identification

```typescript
// packages/ankr-pageindex/src/utils/pdf-extractor.ts
import pdfParse from 'pdf-parse';

export interface DocumentStructure {
  content: string;
  tableOfContents: ToC[];
  crossReferences: CrossRef[];
  metadata: {
    title: string;
    pageCount: number;
    author?: string;
  };
}

export interface ToC {
  level: number;        // 1 = chapter, 2 = section, 3 = subsection
  title: string;
  pageNumber: number;
  children?: ToC[];
}

export interface CrossRef {
  sourceLocation: string;  // "Page 12, Clause 3.2"
  targetLocation: string;  // "Appendix C"
  referenceText: string;   // "See Appendix C for details"
}

export async function extractDocumentStructure(
  pdfBuffer: Buffer
): Promise<DocumentStructure> {
  // 1. Parse PDF
  const data = await pdfParse(pdfBuffer);

  // 2. Extract ToC (from bookmarks or headings)
  const toc = await extractTableOfContents(data);

  // 3. Find cross-references
  const crossRefs = findCrossReferences(data.text);

  return {
    content: data.text,
    tableOfContents: toc,
    crossReferences: crossRefs,
    metadata: {
      title: data.info.Title,
      pageCount: data.numpages,
      author: data.info.Author
    }
  };
}
```

**Deliverables:**
- [ ] PDF extraction utility
- [ ] ToC extraction algorithm
- [ ] Cross-reference detection
- [ ] Test coverage >80%

---

### Day 5: POC Planning & Approval

#### ⬜ TASK-008: Create POC Test Plan
**Priority:** 🔥 Critical
**Assignee:** Project Lead
**Estimated Time:** 4 hours

**Test Plan Sections:**
1. **Objectives**
   - Validate PageIndex accuracy improvement
   - Measure latency impact
   - Assess integration complexity

2. **Success Criteria**
   - Accuracy improvement >20% on complex queries
   - Latency <3 seconds (p95)
   - Integration feasible within 2 weeks

3. **Test Methodology**
   - Run 50 queries through both systems
   - Manual evaluation of answers
   - User acceptance testing with 3 maritime users

4. **Rollback Plan**
   - If POC fails, document learnings
   - Keep HybridSearch as sole system
   - Re-evaluate in 6 months

**Deliverables:**
- [ ] Test plan document: `/docs/poc-test-plan.md`
- [ ] Success criteria checklist
- [ ] Risk assessment matrix

---

#### ⬜ TASK-009: Stakeholder Review & Approval
**Priority:** 🔥 Critical
**Assignee:** Product Lead
**Estimated Time:** 2 hours

**Meetings:**
- [ ] Present project report to engineering team
- [ ] Review TODO plan with backend team
- [ ] Get approval from CTO/Technical Lead
- [ ] Allocate resources (1 engineer for 2 weeks)

**Documents to Review:**
- `PAGEINDEX-PROJECT-REPORT.md`
- `PAGEINDEX-TODO.md`
- `poc-test-plan.md`

**Deliverables:**
- [ ] Approval email/Slack confirmation
- [ ] Resource allocation confirmed
- [ ] Budget approved ($8,000 for Phase 1)

---

## 🚀 PHASE 1: Proof of Concept (Weeks 2-3)

### Week 2: PageIndex Integration

#### ⬜ TASK-101: Install PageIndex SDK
**Priority:** 🔥 Critical
**Assignee:** Backend Engineer
**Estimated Time:** 2 hours

```bash
cd packages/ankr-pageindex
npm install pageindex pdf-parse @anthropic-ai/sdk

# Verify installation
npx pageindex --version
```

**Configuration:**
```typescript
// packages/ankr-pageindex/src/config.ts
export const PAGEINDEX_CONFIG = {
  llm: {
    provider: 'anthropic',
    model: 'claude-sonnet-4-5-20250929',
    apiKey: process.env.ANTHROPIC_API_KEY
  },
  navigation: {
    maxDepth: 5,              // Max tree depth
    maxNodesPerLevel: 10,     // Limit branching factor
    timeout: 30000            // 30 second timeout
  },
  caching: {
    enabled: true,
    ttl: 3600                 // Cache tree paths for 1 hour
  }
};
```

**Deliverables:**
- [ ] PageIndex installed
- [ ] Configuration file created
- [ ] Environment variables set
- [ ] Smoke test passing

---

#### ⬜ TASK-102: Build Document Indexer
**Priority:** 🔥 Critical
**Assignee:** Backend Engineer
**Estimated Time:** 12 hours

```typescript
// packages/ankr-pageindex/src/indexer/DocumentIndexer.ts
import { PageIndex } from 'pageindex';
import { extractDocumentStructure } from '../utils/pdf-extractor';

export class DocumentIndexer {
  /**
   * Index a document for PageIndex search
   */
  async indexDocument(
    documentId: string,
    pdfBuffer: Buffer,
    metadata: DocumentMetadata
  ): Promise<IndexResult> {
    // 1. Extract document structure
    const structure = await extractDocumentStructure(pdfBuffer);

    // 2. Build PageIndex tree
    const index = await PageIndex.createIndex({
      content: structure.content,
      tableOfContents: structure.tableOfContents,
      crossReferences: structure.crossReferences,
      metadata: {
        documentId,
        docType: metadata.docType,
        organizationId: metadata.organizationId,
        ...structure.metadata
      }
    });

    // 3. Store in PostgreSQL
    await this.storeIndex(documentId, index);

    return {
      documentId,
      indexId: index.id,
      nodesCount: index.nodeCount,
      maxDepth: index.maxDepth,
      createdAt: new Date()
    };
  }

  /**
   * Store index in database
   */
  private async storeIndex(documentId: string, index: any) {
    await prisma.documentIndex.upsert({
      where: { documentId },
      create: {
        documentId,
        indexType: 'pageindex_tree',
        indexData: index.toJSON(),
        version: '1.0',
        createdAt: new Date()
      },
      update: {
        indexData: index.toJSON(),
        updatedAt: new Date()
      }
    });
  }
}
```

**Test Cases:**
- [ ] Index charter party (100+ pages)
- [ ] Index compliance doc (50 pages)
- [ ] Index financial report (30 pages)
- [ ] Handle documents without ToC (fallback)
- [ ] Handle malformed PDFs (error handling)

**Deliverables:**
- [ ] `DocumentIndexer.ts` implemented
- [ ] Unit tests (>80% coverage)
- [ ] Integration test with real PDF
- [ ] Documentation

---

#### ⬜ TASK-103: Build PageIndex Search Service
**Priority:** 🔥 Critical
**Assignee:** Backend Engineer
**Estimated Time:** 12 hours

```typescript
// packages/ankr-pageindex/src/search/PageIndexSearch.ts
import { PageIndex } from 'pageindex';

export class PageIndexSearch {
  /**
   * Search using tree navigation
   */
  async search(
    query: string,
    options: SearchOptions
  ): Promise<SearchResult> {
    const startTime = Date.now();

    // 1. Load document index
    const index = await this.loadIndex(options.documentId);

    // 2. Navigate tree with LLM
    const navigation = await PageIndex.navigate({
      index,
      query,
      conversationHistory: options.history || [],
      maxDepth: 5,
      llmConfig: {
        model: 'claude-sonnet-4-5-20250929',
        apiKey: process.env.ANTHROPIC_API_KEY
      }
    });

    // 3. Extract answer
    const answer = await this.synthesizeAnswer(
      query,
      navigation.visitedNodes,
      options.history
    );

    const latency = Date.now() - startTime;

    return {
      answer: answer.text,
      sources: navigation.visitedNodes.map(node => ({
        section: node.title,
        page: node.pageNumber,
        excerpt: node.content.slice(0, 200),
        relevanceScore: node.score
      })),
      navigationPath: navigation.path,
      confidence: answer.confidence,
      latency
    };
  }

  /**
   * Synthesize final answer from visited nodes
   */
  private async synthesizeAnswer(
    query: string,
    nodes: NavigationNode[],
    history: Message[]
  ) {
    const context = nodes.map(n => n.content).join('\n\n');

    const prompt = `Given the following context from a document, answer the question.

Context:
${context}

Previous conversation:
${history.map(m => `${m.role}: ${m.content}`).join('\n')}

Question: ${query}

Provide a precise answer with citations to specific sections.`;

    const response = await llm.complete(prompt);

    return {
      text: response.content,
      confidence: this.calculateConfidence(nodes)
    };
  }
}
```

**Deliverables:**
- [ ] `PageIndexSearch.ts` implemented
- [ ] Unit tests
- [ ] Integration test with indexed docs
- [ ] Performance benchmarks

---

#### ⬜ TASK-104: Index 10 Test Documents
**Priority:** ⚡ High
**Assignee:** Backend Engineer
**Estimated Time:** 4 hours

```bash
# Script to batch index documents
cd packages/ankr-pageindex

# Run indexer
npm run index-docs -- \
  --dir /root/test-data/pageindex-poc \
  --output /root/test-data/indexes
```

**Validation:**
- [ ] All 10 documents indexed successfully
- [ ] ToC extracted for 8/10 (80% success rate)
- [ ] Cross-references identified
- [ ] Indexes stored in PostgreSQL
- [ ] Average indexing time: <2 min per doc

**Deliverables:**
- [ ] Batch indexing script
- [ ] Indexed documents in database
- [ ] Indexing logs and statistics

---

### Week 3: Testing & Evaluation

#### ⬜ TASK-105: Run 50-Query Test Set
**Priority:** 🔥 Critical
**Assignee:** QA Team
**Estimated Time:** 8 hours

```typescript
// packages/ankr-pageindex/test/evaluate-pageindex.ts
import { PageIndexSearch } from '../src/search/PageIndexSearch';
import testQueries from '../test-data/queries.json';

async function evaluatePageIndex() {
  const results = [];

  for (const query of testQueries.queries) {
    const startTime = Date.now();

    const answer = await pageIndexSearch.search(query.text, {
      documentId: query.documentId
    });

    const latency = Date.now() - startTime;

    // Manual evaluation (human scores 0-100)
    const accuracy = await manualEvaluation(
      answer.answer,
      query.expectedAnswer
    );

    results.push({
      queryId: query.id,
      classification: query.classification,
      latency,
      accuracy,
      sourcesFound: answer.sources.length,
      navigationDepth: answer.navigationPath.length
    });
  }

  return analyzeResults(results);
}
```

**Metrics to Capture:**
```json
{
  "pageindex_results": {
    "simple_queries": {
      "accuracy": "82%",
      "avg_latency": "1.2s"
    },
    "complex_queries": {
      "accuracy": "94%",
      "avg_latency": "2.8s"
    },
    "multi_hop_success": "91%"
  }
}
```

**Deliverables:**
- [ ] Test execution script
- [ ] Results file: `pageindex-results.json`
- [ ] Comparison report: `/docs/poc-comparison.md`

---

#### ⬜ TASK-106: Comparative Analysis
**Priority:** 🔥 Critical
**Assignee:** Data Analyst
**Estimated Time:** 6 hours

**Analysis to Perform:**

1. **Accuracy Comparison**
   ```
   Query Type        | HybridSearch | PageIndex | Delta
   -----------------|--------------|-----------|-------
   Simple           | 85%          | 82%       | -3%
   Complex          | 60%          | 94%       | +34%
   Multi-hop        | 35%          | 91%       | +56%
   Overall          | 72.5%        | 88%       | +15.5%
   ```

2. **Latency Analysis**
   ```
   Metric           | HybridSearch | PageIndex
   -----------------|--------------|----------
   p50              | 80ms         | 1.5s
   p95              | 200ms        | 3.2s
   p99              | 350ms        | 4.8s
   ```

3. **Cost Analysis**
   ```
   Per Query        | HybridSearch | PageIndex
   -----------------|--------------|----------
   Embedding        | $0.0001      | $0
   LLM calls        | 1            | 4 avg
   Cost             | $0.03        | $0.18
   ```

**Deliverables:**
- [ ] Comparison spreadsheet
- [ ] Visualization charts (bar graphs, scatter plots)
- [ ] Executive summary report
- [ ] Recommendation document

---

#### ⬜ TASK-107: User Acceptance Testing
**Priority:** ⚡ High
**Assignee:** Product Team
**Estimated Time:** 6 hours

**Process:**
1. Select 3 maritime users (charter party experts)
2. Give them 10 queries each (30 total)
3. Show answers from both systems (blind A/B test)
4. Collect ratings (1-5 scale)

**Survey Questions:**
- "How accurate is this answer?"
- "How helpful are the cited sources?"
- "Would you trust this for business decisions?"

**Success Criteria:**
- PageIndex average rating >4.0/5
- >70% of users prefer PageIndex for complex queries

**Deliverables:**
- [ ] User testing plan
- [ ] Survey responses
- [ ] User feedback summary
- [ ] Recommendations for improvements

---

#### ⬜ TASK-108: POC Decision Meeting
**Priority:** 🔥 Critical
**Assignee:** Project Lead
**Estimated Time:** 2 hours

**Meeting Agenda:**
1. Present POC results
2. Review accuracy improvements
3. Discuss latency concerns
4. Evaluate cost implications
5. Make GO/NO-GO decision

**Decision Matrix:**
```
Accuracy improvement >20%?     [ ] Yes  [ ] No
Latency acceptable (<3s p95)?  [ ] Yes  [ ] No
User satisfaction >80%?        [ ] Yes  [ ] No
Cost manageable?               [ ] Yes  [ ] No

If 3+ Yes: ✅ PROCEED TO PHASE 2
If 2 Yes:  ⚠️ CONDITIONAL (address concerns)
If <2 Yes: ❌ ABORT (document learnings)
```

**Deliverables:**
- [ ] Decision document
- [ ] Next steps action items
- [ ] Updated project plan (if proceeding)

---

## 🔧 PHASE 2: Router Development (Weeks 4-5)

### Week 4: Smart Query Routing

#### ⬜ TASK-201: Build Query Classifier
**Priority:** 🔥 Critical
**Assignee:** ML Engineer
**Estimated Time:** 10 hours

```typescript
// packages/ankr-rag-router/src/QueryClassifier.ts
export interface QueryClassification {
  complexity: 'SIMPLE' | 'COMPLEX';
  intent: 'lookup' | 'reasoning' | 'multi-hop' | 'comparison';
  documentType: string;
  estimatedHops: number;
  recommendedMethod: 'hybrid' | 'pageindex';
  confidence: number;
}

export class QueryClassifier {
  async classify(
    query: string,
    context: ConversationContext
  ): Promise<QueryClassification> {
    const prompt = `Classify this query for RAG retrieval:

Query: "${query}"
Conversation history: ${context.history.length} previous turns

Classify as:
1. SIMPLE - Single fact lookup, keyword search, direct answer
2. COMPLEX - Multi-hop reasoning, cross-references, "how/why" questions

Also identify:
- Intent (lookup/reasoning/multi-hop/comparison)
- Estimated document sections needed (1-5)
- Recommended retrieval method (hybrid for simple, pageindex for complex)

Respond in JSON format.`;

    const response = await llm.complete(prompt, {
      model: 'claude-haiku-4-20250514', // Cheaper model for classification
      temperature: 0
    });

    return JSON.parse(response.content);
  }
}
```

**Test Cases:**
- [ ] Simple: "What's the vessel IMO?" → hybrid
- [ ] Complex: "How is demurrage calculated?" → pageindex
- [ ] Multi-hop: "What was off-hire and why?" → pageindex
- [ ] Accuracy >90% on test set

**Deliverables:**
- [ ] `QueryClassifier.ts`
- [ ] Test suite with 100 queries
- [ ] Accuracy report
- [ ] Cost analysis (Haiku vs Sonnet)

---

#### ⬜ TASK-202: Build RAG Router
**Priority:** 🔥 Critical
**Assignee:** Backend Engineer
**Estimated Time:** 12 hours

```typescript
// packages/ankr-rag-router/src/RAGRouter.ts
import { HybridSearchService } from '@ankr/rag';
import { PageIndexSearch } from '@ankr/pageindex';
import { QueryClassifier } from './QueryClassifier';

export class RAGRouter {
  constructor(
    private hybridSearch: HybridSearchService,
    private pageIndexSearch: PageIndexSearch,
    private classifier: QueryClassifier
  ) {}

  async route(
    query: string,
    context: ConversationContext,
    options: RouterOptions = {}
  ): Promise<RouterResult> {
    // 1. Classify query
    const classification = await this.classifier.classify(query, context);

    // 2. Check override
    if (options.forceMethod) {
      return this.executeSearch(query, options.forceMethod, context);
    }

    // 3. Route based on classification
    const method = this.selectMethod(classification, context);

    // 4. Execute with fallback
    try {
      const result = await this.executeSearch(query, method, context);

      // Log for analytics
      await this.logQuery(query, method, result, classification);

      return result;
    } catch (error) {
      // Fallback to hybrid search
      console.warn(`${method} failed, falling back to hybrid`, error);
      return this.executeSearch(query, 'hybrid', context);
    }
  }

  private selectMethod(
    classification: QueryClassification,
    context: ConversationContext
  ): 'hybrid' | 'pageindex' {
    // Use PageIndex for:
    // - Complex queries
    // - Multi-hop intent
    // - Long documents (>10 pages)
    // - Specific doc types (charter_party, compliance, financial_report)

    if (classification.complexity === 'COMPLEX') return 'pageindex';
    if (classification.estimatedHops > 1) return 'pageindex';
    if (['charter_party', 'compliance', 'financial_report'].includes(classification.documentType)) {
      return 'pageindex';
    }

    return 'hybrid';
  }
}
```

**Deliverables:**
- [ ] `RAGRouter.ts`
- [ ] Unit tests
- [ ] Integration tests
- [ ] Routing decision logs

---

#### ⬜ TASK-203: Add Caching Layer
**Priority:** ⚡ High
**Assignee:** Backend Engineer
**Estimated Time:** 6 hours

**Purpose:** Reduce latency and LLM costs by caching:
1. Query classifications
2. Tree navigation paths
3. Frequently asked questions

```typescript
// packages/ankr-rag-router/src/cache/RouterCache.ts
import Redis from 'ioredis';

export class RouterCache {
  private redis: Redis;

  async cacheClassification(query: string, classification: QueryClassification) {
    const key = `classification:${this.hashQuery(query)}`;
    await this.redis.setex(key, 3600, JSON.stringify(classification)); // 1 hour TTL
  }

  async cacheNavigationPath(
    query: string,
    documentId: string,
    path: NavigationPath
  ) {
    const key = `nav:${documentId}:${this.hashQuery(query)}`;
    await this.redis.setex(key, 7200, JSON.stringify(path)); // 2 hour TTL
  }

  async cacheAnswer(
    query: string,
    answer: SearchResult
  ) {
    const key = `answer:${this.hashQuery(query)}`;
    await this.redis.setex(key, 1800, JSON.stringify(answer)); // 30 min TTL
  }
}
```

**Deliverables:**
- [ ] Cache implementation
- [ ] Cache hit rate monitoring
- [ ] TTL configuration
- [ ] Cache invalidation strategy

---

### Week 5: Integration & Testing

#### ⬜ TASK-204: Integrate Router into Maritime Backend
**Priority:** 🔥 Critical
**Assignee:** Backend Engineer
**Estimated Time:** 8 hours

**Files to Modify:**
```
apps/ankr-maritime/backend/src/services/rag/maritime-rag.ts
apps/ankr-maritime/backend/src/schema/types/knowledge-engine.ts
```

**Changes:**
```typescript
// Before:
const results = await maritimeRAG.search(query, options);

// After:
const results = await ragRouter.route(query, {
  history: conversationHistory,
  documentTypes: options.docTypes,
  organizationId: user.organizationId
});
```

**GraphQL Schema Update:**
```graphql
type Query {
  searchDocuments(
    query: String!
    limit: Int = 10
    docTypes: [String!]
    method: RetrievalMethod  # NEW: Allow method override
  ): [SearchResult!]!
}

enum RetrievalMethod {
  AUTO      # Let router decide
  HYBRID    # Force hybrid search
  PAGEINDEX # Force PageIndex
}
```

**Deliverables:**
- [ ] Router integrated
- [ ] GraphQL schema updated
- [ ] Migration script for existing queries
- [ ] Backward compatibility maintained

---

#### ⬜ TASK-205: Add Analytics Dashboard
**Priority:** ⚡ High
**Assignee:** Frontend Engineer
**Estimated Time:** 12 hours

**Features:**
- Query routing decisions (pie chart: hybrid vs pageindex)
- Accuracy comparison over time (line chart)
- Latency distribution (histogram)
- User feedback (thumbs up/down)
- Cost tracking (LLM API usage)

**Location:**
```
apps/ankr-maritime/frontend/src/pages/RAGAnalytics.tsx
```

**Deliverables:**
- [ ] Analytics page UI
- [ ] Real-time dashboard updates
- [ ] Export to CSV functionality
- [ ] Admin-only access control

---

#### ⬜ TASK-206: End-to-End Testing
**Priority:** 🔥 Critical
**Assignee:** QA Team
**Estimated Time:** 10 hours

**Test Scenarios:**
1. User asks simple question → Router uses hybrid → Fast response
2. User asks complex question → Router uses PageIndex → Accurate response
3. PageIndex fails → Router falls back to hybrid → Graceful degradation
4. Multi-turn conversation → Context preserved → Correct routing
5. 100 concurrent requests → No timeouts → Acceptable latency

**Test Script:**
```typescript
// packages/ankr-rag-router/test/e2e/routing.test.ts
describe('RAG Router E2E', () => {
  it('routes simple queries to hybrid search', async () => {
    const result = await router.route('What is the vessel IMO?', context);
    expect(result.method).toBe('hybrid');
    expect(result.latency).toBeLessThan(500);
  });

  it('routes complex queries to PageIndex', async () => {
    const result = await router.route('How is demurrage calculated?', context);
    expect(result.method).toBe('pageindex');
    expect(result.sources.length).toBeGreaterThan(2);
  });

  it('falls back to hybrid if PageIndex fails', async () => {
    jest.spyOn(pageIndex, 'search').mockRejectedValue(new Error('Timeout'));
    const result = await router.route('Test query', context);
    expect(result.method).toBe('hybrid'); // Fallback
  });
});
```

**Deliverables:**
- [ ] E2E test suite
- [ ] Performance benchmarks
- [ ] Failure scenario tests
- [ ] Load testing results

---

#### ⬜ TASK-207: Phase 2 Review & Decision
**Priority:** 🔥 Critical
**Assignee:** Project Lead
**Estimated Time:** 2 hours

**Review Checklist:**
- [ ] Router accuracy >90%
- [ ] Latency acceptable (p95 <3s for PageIndex, <500ms for hybrid)
- [ ] Caching reduces costs by >30%
- [ ] Integration stable (no production incidents)
- [ ] User feedback positive (>80% satisfaction)

**Decision:**
```
All criteria met?  [ ] Yes → PROCEED TO PHASE 3
2-3 criteria met?  [ ] Maybe → Address gaps, re-test
<2 criteria met?   [ ] No → Rollback, re-plan
```

**Deliverables:**
- [ ] Phase 2 completion report
- [ ] Go/No-Go decision
- [ ] Phase 3 kickoff plan

---

## 🚢 PHASE 3: Maritime Production Deployment (Weeks 6-8)

### Week 6: Batch Indexing

#### ⬜ TASK-301: Index All Charter Parties
**Priority:** 🔥 Critical
**Assignee:** Backend Engineer
**Estimated Time:** 16 hours

**Process:**
```bash
# 1. Export all charter parties from Mari8X DMS
npm run export-charters -- --output /tmp/charters

# 2. Batch index (500+ documents)
npm run batch-index -- \
  --input /tmp/charters \
  --docType charter_party \
  --concurrency 5 \
  --output /tmp/index-results.json

# 3. Validate indexes
npm run validate-indexes -- --input /tmp/index-results.json
```

**Monitoring:**
- [ ] Progress tracking (indexed 250/500...)
- [ ] Error handling (retry failed docs)
- [ ] Quality checks (ToC extracted? Cross-refs found?)
- [ ] Storage usage (estimate: 500 × 500KB = 250MB)

**Deliverables:**
- [ ] All charter parties indexed
- [ ] Index quality report
- [ ] Failed documents list (for manual review)
- [ ] Database backup before indexing

---

#### ⬜ TASK-302: Index Compliance Documents
**Priority:** ⚡ High
**Assignee:** Backend Engineer
**Estimated Time:** 8 hours

**Documents to Index:**
- FMCSA Hours of Service (49 CFR Part 395)
- DOT Hazmat Regulations (49 CFR Part 172-177)
- FMCSA Safety Regulations (49 CFR Part 383-397)
- BIMCO Charter Party Clauses Library

**Deliverables:**
- [ ] 50+ compliance docs indexed
- [ ] Cross-references validated
- [ ] Section hierarchy verified

---

#### ⬜ TASK-303: Index Financial Reports
**Priority:** ⚡ High
**Assignee:** Backend Engineer
**Estimated Time:** 6 hours

**Documents:**
- Voyage P&L statements (Q4 2025)
- Bunker cost analysis reports
- Hire statements with adjustments
- Off-hire incident reports

**Deliverables:**
- [ ] 100+ financial reports indexed
- [ ] Appendix cross-refs working
- [ ] Table extraction validated

---

### Week 7: Production Integration

#### ⬜ TASK-304: Deploy to Staging
**Priority:** 🔥 Critical
**Assignee:** DevOps Engineer
**Estimated Time:** 8 hours

**Deployment Steps:**
```bash
# 1. Build packages
cd packages/ankr-pageindex && npm run build
cd packages/ankr-rag-router && npm run build

# 2. Deploy to staging
ankr-ctl deploy ankr-maritime-backend --env staging

# 3. Run smoke tests
npm run test:smoke -- --env staging

# 4. Monitor for 24 hours
ankr-ctl logs ankr-maritime-backend --follow
```

**Validation:**
- [ ] All services healthy
- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] LLM API keys valid
- [ ] Redis cache connected

**Deliverables:**
- [ ] Staging deployment successful
- [ ] Smoke tests passing
- [ ] Monitoring dashboard configured

---

#### ⬜ TASK-305: User Acceptance Testing (Staging)
**Priority:** ⚡ High
**Assignee:** Product Team
**Estimated Time:** 12 hours

**Test Plan:**
1. Invite 10 maritime users
2. Give them 20 real-world queries
3. Collect feedback
4. Fix critical bugs

**Success Criteria:**
- >80% user satisfaction
- No critical bugs
- <5% error rate

**Deliverables:**
- [ ] UAT report
- [ ] Bug fixes deployed
- [ ] User training materials

---

#### ⬜ TASK-306: Deploy to Production
**Priority:** 🔥 Critical
**Assignee:** DevOps Engineer
**Estimated Time:** 6 hours

**Deployment Strategy: Gradual Rollout**
```
Week 7 Day 1: 10% of users (beta group)
Week 7 Day 3: 25% of users
Week 7 Day 5: 50% of users
Week 8 Day 2: 100% of users
```

**Rollback Plan:**
```bash
# If issues detected:
ankr-ctl rollback ankr-maritime-backend --to-version v1.2.3

# Disable PageIndex routing:
echo "PAGEINDEX_ENABLED=false" >> .env
ankr-ctl restart ankr-maritime-backend
```

**Deliverables:**
- [ ] Production deployment plan
- [ ] Rollback tested
- [ ] Monitoring alerts configured
- [ ] On-call schedule

---

### Week 8: Monitoring & Optimization

#### ⬜ TASK-307: Performance Optimization
**Priority:** ⚡ High
**Assignee:** Backend Engineer
**Estimated Time:** 12 hours

**Optimizations:**
1. **Cache warming** - Pre-cache common queries
2. **Parallel navigation** - Navigate multiple branches simultaneously
3. **Model selection** - Use Haiku for simple navigation steps
4. **Index compression** - Reduce JSONB storage size

**Expected Improvements:**
- Latency reduction: 3s → 1.5s (p95)
- Cost reduction: 30% via Haiku usage
- Cache hit rate: >60%

**Deliverables:**
- [ ] Performance tuning complete
- [ ] Before/after benchmarks
- [ ] Cost savings report

---

#### ⬜ TASK-308: Add User Feedback Mechanism
**Priority:** ⚡ High
**Assignee:** Frontend Engineer
**Estimated Time:** 6 hours

**UI Component:**
```typescript
// apps/ankr-maritime/frontend/src/components/RAGFeedback.tsx
export function RAGFeedback({ queryId, answer }: Props) {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const submitFeedback = async (rating: 'up' | 'down') => {
    await mutation({
      variables: {
        queryId,
        rating: rating === 'up' ? 5 : 1,
        comment: prompt('Optional: Why?')
      }
    });
    setFeedback(rating);
  };

  return (
    <div className="flex gap-2 mt-4">
      <button onClick={() => submitFeedback('up')}>👍</button>
      <button onClick={() => submitFeedback('down')}>👎</button>
    </div>
  );
}
```

**Deliverables:**
- [ ] Feedback UI component
- [ ] GraphQL mutation
- [ ] Feedback dashboard (admin view)

---

#### ⬜ TASK-309: Documentation & Training
**Priority:** ⚡ High
**Assignee:** Technical Writer
**Estimated Time:** 10 hours

**Documents to Create:**
1. **User Guide** - How to use PageIndex-powered search
2. **Admin Guide** - Managing indexes, monitoring performance
3. **Developer Guide** - Extending PageIndex for new doc types
4. **Troubleshooting Guide** - Common issues and solutions

**Training Sessions:**
- [ ] User training webinar (1 hour)
- [ ] Admin training session (2 hours)
- [ ] Developer workshop (3 hours)

**Deliverables:**
- [ ] Documentation published to `/docs/pageindex/`
- [ ] Video tutorials recorded
- [ ] FAQ page created

---

#### ⬜ TASK-310: Phase 3 Completion Review
**Priority:** 🔥 Critical
**Assignee:** Project Lead
**Estimated Time:** 3 hours

**Metrics Review:**
```
Metric                    | Target   | Actual | Status
--------------------------|----------|--------|--------
Documents indexed         | 500+     | ___    | [ ]
User satisfaction         | 80%      | ___    | [ ]
Accuracy (complex)        | 90%+     | ___    | [ ]
Latency p95               | <3s      | ___    | [ ]
Error rate                | <5%      | ___    | [ ]
Cost per query            | <$0.25   | ___    | [ ]
```

**Decision:**
- [ ] ✅ Phase 3 SUCCESS → Proceed to Phase 4 expansion
- [ ] ⚠️ CONDITIONAL → Address gaps before Phase 4
- [ ] ❌ ROLLBACK → Document learnings, revert to HybridSearch

**Deliverables:**
- [ ] Phase 3 completion report
- [ ] Success celebration! 🎉
- [ ] Phase 4 planning kickoff

---

## 🌍 PHASE 4: Expansion (Ongoing)

### ⬜ TASK-401: Extend to Logistics MCP Tools
**Priority:** ⚡ High
**Estimated Time:** 2 weeks

**Goal:** Add PageIndex to logistics RAG (FMCSA compliance queries)

**Tasks:**
- [ ] Integrate PageIndex into `packages/ankr-mcp/src/tools/logistics/rag.ts`
- [ ] Add MCP tool: `logistics_pageindex_search`
- [ ] Test with compliance queries
- [ ] Deploy to MCP server

---

### ⬜ TASK-402: Add to FreightBox (Fr8X)
**Priority:** ⚡ High
**Estimated Time:** 2 weeks

**Goal:** Enable PageIndex for freight contracts, BOLs

**Tasks:**
- [ ] Index Fr8X contracts
- [ ] Integrate router into Fr8X backend
- [ ] Add to Fr8X frontend
- [ ] User testing with freight operators

---

### ⬜ TASK-403: Mobile App Integration
**Priority:** 🔥 Medium
**Estimated Time:** 1 week

**Goal:** Voice queries on mobile use PageIndex

**Tasks:**
- [ ] Add PageIndex to `apps/driver-app/`
- [ ] Optimize for mobile latency
- [ ] Voice-to-PageIndex pipeline
- [ ] Offline fallback to HybridSearch

---

### ⬜ TASK-404: Multi-Document Queries
**Priority:** ⚡ High
**Estimated Time:** 2 weeks

**Goal:** Navigate across multiple related documents

**Example:**
```
Query: "Compare demurrage rates across all 2025 charters"
Documents: 50+ charter parties
PageIndex: Navigate to demurrage clause in each, aggregate
```

---

### ⬜ TASK-405: Advanced Features
**Priority:** 🔥 Low
**Estimated Time:** Ongoing

**Features to Explore:**
- [ ] Visual navigation (show tree path in UI)
- [ ] Suggested follow-up questions
- [ ] Document summarization
- [ ] Automated clause extraction
- [ ] Multi-language support (Hindi, Chinese)

---

## 📊 Success Tracking

### Weekly Metrics (Auto-Generated)

```sql
-- Query to track progress
SELECT
  DATE_TRUNC('week', created_at) as week,
  retrieval_method,
  COUNT(*) as queries,
  AVG(response_time_ms) as avg_latency,
  AVG(user_feedback) as avg_rating
FROM rag_query_logs
GROUP BY week, retrieval_method
ORDER BY week DESC;
```

### Monthly Review Checklist

- [ ] Accuracy trending up?
- [ ] User satisfaction >80%?
- [ ] Cost within budget?
- [ ] New use cases identified?
- [ ] Documentation updated?

---

## 🚨 Risk Register

| Risk | Probability | Impact | Mitigation | Owner |
|------|------------|--------|------------|-------|
| PageIndex SDK breaking changes | Low | High | Pin version, test updates in staging | DevOps |
| LLM API rate limits | Medium | High | Implement exponential backoff, multi-provider fallback | Backend |
| User adoption low | Medium | Medium | Training, UX improvements, success stories | Product |
| Latency spikes | Medium | High | Caching, monitoring, auto-fallback to hybrid | Backend |
| Cost overruns | Low | Medium | Set budget alerts, optimize model usage | Finance |

---

## 📚 Resources

**Repositories:**
- VectifyAI/PageIndex: https://github.com/VectifyAI/PageIndex
- VectifyAI/pageindex-mcp: https://github.com/VectifyAI/pageindex-mcp
- VectifyAI/Mafin2.5-FinanceBench: https://github.com/VectifyAI/Mafin2.5-FinanceBench

**Documentation:**
- PageIndex Docs: https://docs.pageindex.ai/
- PageIndex Blog: https://pageindex.ai/blog/pageindex-intro
- Mafin 2.5 Results: https://pageindex.ai/blog/Mafin2.5

**Internal Docs:**
- Project Report: `/root/PAGEINDEX-PROJECT-REPORT.md`
- Current RAG: `/root/HybridSearch.service.ts`
- Maritime RAG: `/root/apps/ankr-maritime/backend/src/services/rag/maritime-rag.ts`

---

## 🎯 Next Immediate Action

**START HERE:**
```bash
# 1. Review project report
cat /root/PAGEINDEX-PROJECT-REPORT.md

# 2. Clone PageIndex
cd /root/ankr-labs-nx/packages
git clone https://github.com/VectifyAI/PageIndex ankr-pageindex-vendor

# 3. Run example
cd ankr-pageindex-vendor/examples
npm install
node simple-rag.js

# 4. Schedule kickoff meeting
# Attendees: Backend team, Maritime product, QA
# Duration: 1 hour
# Agenda: Review report, approve Phase 1, assign tasks
```

**Week 1 Goal:** Complete Phase 0 (Tasks 001-009) and get approval to proceed.

---

**Last Updated:** February 1, 2026
**Project Status:** 📝 Planning
**Next Milestone:** Phase 0 Completion
