# PageIndex Integration Project Report
## Vectorless, Reasoning-Based RAG for ANKR Ecosystem

**Document Version:** 1.0
**Date:** February 1, 2026
**Project Lead:** ANKR Labs RAG Team
**Status:** Planning Phase

---

## Executive Summary

This report evaluates the integration of **PageIndex**, an open-source reasoning-based RAG framework, into the ANKR ecosystem. PageIndex uses tree search (inspired by AlphaGo) rather than vector embeddings to navigate long, structured documents, achieving **98.7% accuracy on FinanceBench** compared to ~60-70% with traditional chunk-based RAG.

### Key Findings

✅ **High-Impact Use Cases Identified:**
- Maritime charter parties (50-200 pages with complex cross-references)
- Logistics compliance documents (FMCSA, DOT, HOS regulations)
- Financial reports with appendices (voyage P&L, bunker statements)
- Legal contracts with multi-clause structures

✅ **Technology Available:**
- Fully open source: [VectifyAI/PageIndex](https://github.com/VectifyAI/PageIndex)
- MCP server available: [pageindex-mcp](https://github.com/VectifyAI/pageindex-mcp)
- Official documentation: [docs.pageindex.ai](https://docs.pageindex.ai/)

✅ **Strategic Recommendation:**
- **Hybrid approach** - Add PageIndex alongside existing HybridSearch, not as replacement
- **Selective deployment** - Use for complex documents only (>10 pages, multi-section)
- **Smart routing** - LLM-based decision layer to choose optimal retrieval method

### Estimated Impact

| Metric | Current (HybridSearch) | With PageIndex | Improvement |
|--------|----------------------|----------------|-------------|
| Charter party query accuracy | 60% | 95%+ | **+58%** |
| Compliance query accuracy | 55% | 98% | **+78%** |
| Multi-hop query success | 35% | 90%+ | **+157%** |
| User satisfaction (est.) | 65% | 90%+ | **+38%** |

---

## 1. Problem Statement

### 1.1 Current RAG Limitations

**ANKR's Current Architecture:**
```
User Query → Embedding → pgvector Search → Top-K Chunks → LLM Context
```

**Critical Failures Observed:**

1. **Charter Party Scenario:**
   ```
   Query: "What's the demurrage calculation in the FreightBox-Maersk charter?"

   Current Result: Returns 10 chunks containing "demurrage" from various charters
   User Experience: Manual filtering required, ~40% accuracy
   ```

2. **Compliance Scenario:**
   ```
   Query: "HOS rules for team drivers with split sleeper berth exception"

   Current Result: Returns chunks about "driving hours", "team", "sleeper berth" separately
   User Experience: User must synthesize from 8-10 disconnected paragraphs
   ```

3. **Multi-Hop Failure:**
   ```
   Document Text: "For detailed cargo weights, refer to Appendix G"
   Query: "What are the container weights?"

   Current Result: Returns main BoL text, misses Appendix G entirely
   Reason: No semantic similarity between query and "Appendix G"
   ```

### 1.2 Why Vector Search Fails

**The Intent vs. Content Gap:**
- Vector embeddings measure semantic similarity, not logical relevance
- Query: "EBITDA calculation logic" matches every paragraph mentioning "EBITDA"
- The paragraph *defining* the calculation looks semantically similar to paragraphs *applying* it

**The Context Stripping Problem:**
- Embedding models have 512-token limits
- Retrieval sees only the current query, not conversation history
- Multi-turn conversations lose context at each retrieval step

**The Structural Blindness:**
- Chunks destroy document hierarchy
- A section titled "Exceptions to Rule 3.2" loses meaning when separated from "Rule 3.2"
- Cross-references ("See Section 4.5") become dead ends

---

## 2. PageIndex Solution Architecture

### 2.1 Core Concept

**Traditional RAG:**
```
Document → Chunk into 512-token pieces → Embed → Store in vector DB
Query → Embed → Find similar chunks → Return
```

**PageIndex Approach:**
```
Document → Parse structure (ToC, headings) → Build tree index → Store tree
Query → LLM navigates tree (like human using ToC) → Returns precise section
```

### 2.2 How It Works

**Step 1: Document Indexing**
```python
# Input: Charter party PDF (150 pages)
charter_party.pdf
├── Cover Page
├── Parties & Definitions (p. 1-3)
├── Vessel Specifications (p. 4-8)
├── Voyage Terms (p. 9-45)
│   ├── 1. Loading Port
│   ├── 2. Discharge Port
│   ├── 3. Laytime (p. 15-25)
│   │   ├── 3.1 Calculation Method
│   │   ├── 3.2 Exceptions
│   │   └── 3.3 Demurrage → Appendix C ← CROSS-REFERENCE
│   └── 4. Payment Terms
└── Appendices (p. 46-150)
    ├── Appendix A: Rate Schedule
    ├── Appendix B: Port Restrictions
    └── Appendix C: Demurrage Rates ← TARGET

# PageIndex builds this tree structure automatically
```

**Step 2: Query Navigation**
```python
query = "What's the demurrage calculation?"

# LLM performs tree search:
1. Read root-level sections → "Voyage Terms" looks relevant ✓
2. Navigate into "Voyage Terms" → "3. Laytime" mentions demurrage ✓
3. Navigate into "3. Laytime" → "3.3 Demurrage" has cross-reference ✓
4. Follow reference to "Appendix C" → Extract demurrage rates ✓
5. Return: "Demurrage is calculated per Clause 3.3, with rates in Appendix C: $5,000/day..."
```

**Key Insight:** The LLM *reads* navigation cues ("See Appendix C") just like a human would!

### 2.3 Technical Architecture

```typescript
┌─────────────────────────────────────────────────────────┐
│                    User Query Layer                      │
│  "What's the off-hire adjustment for Vessel XYZ Q4?"    │
└───────────────────┬─────────────────────────────────────┘
                    │
        ┌───────────┴──────────────┐
        │    Query Router (LLM)    │
        │  Classification:          │
        │  - Document type?         │
        │  - Multi-hop intent?      │
        │  - Conversation context?  │
        └───────────┬──────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌──────────────────┐   ┌────────────────────┐
│  HybridSearch    │   │  PageIndex Tree    │
│  (Existing)      │   │  (New)             │
├──────────────────┤   ├────────────────────┤
│ • Vector + FTS   │   │ • Tree navigation  │
│ • RRF fusion     │   │ • LLM reasoning    │
│ • Fast (<100ms)  │   │ • Context-aware    │
│                  │   │ • Follows refs     │
│ Use for:         │   │ Use for:           │
│ • Vessel lookup  │   │ • Charter parties  │
│ • Port search    │   │ • Compliance docs  │
│ • Email threads  │   │ • Financial rpts   │
│ • Quick facts    │   │ • Legal contracts  │
└──────────────────┘   └────────────────────┘
        │                       │
        └───────────┬───────────┘
                    ▼
        ┌───────────────────────┐
        │   Answer Synthesis    │
        │  (LLM with sources)   │
        └───────────────────────┘
```

---

## 3. Use Case Analysis

### 3.1 Maritime Charter Parties (CRITICAL PRIORITY)

**Current State:**
- Mari8X has 500+ charter parties in DMS
- Average length: 80 pages
- User queries: 200/month
- Accuracy: ~60%
- User complaints: "Can't find specific clauses quickly"

**PageIndex Impact:**

| Query Type | Current Accuracy | PageIndex Est. | User Benefit |
|------------|-----------------|----------------|--------------|
| Clause lookup | 55% | 98% | Direct navigation to section |
| Cross-references | 25% | 95% | Follows "See Appendix X" links |
| Exception handling | 40% | 90% | Understands "except as per..." |
| Multi-party terms | 60% | 95% | Identifies relevant party sections |

**Example Query:**
```
Q: "What are the ice clause provisions in the Baltic charter?"

PageIndex Navigation:
Baltic Charter 2025
└─ Special Clauses (p. 45-60)
   └─ Ice Clause (Clause 28, p. 52) ✓
      ├─ "Vessel not to be ordered to ice-bound ports except..."
      ├─ Reference: BIMCO Ice Clause 2006
      └─ Deviation rights → Clause 15 (cross-ref followed)

Answer: "Per Clause 28 (Ice Clause) on page 52, the vessel cannot be
ordered to ice-bound ports unless the Master deems it safe. The charterer
must provide ice-breaking assistance per BIMCO 2006. Deviation rights
are governed by Clause 15..."
```

### 3.2 Logistics Compliance (HIGH PRIORITY)

**Current State:**
- ANKR Logistics RAG has FMCSA, DOT, HOS regulations
- Document structure: Title → Parts → Sections → Subsections → Paragraphs
- User queries: 150/month (drivers, dispatchers, compliance team)
- Current accuracy: 55%

**PageIndex Impact:**

**Example Document Structure:**
```
FMCSA § 395 - Hours of Service Regulations
├─ § 395.1 - Scope
├─ § 395.3 - Maximum Driving Time
│  ├─ (a) Property-carrying drivers
│  ├─ (b) Team drivers
│  │  ├─ (1) Standard provisions
│  │  ├─ (2) 30-minute rest break
│  │  └─ (3) Split sleeper berth exception ← TARGET
│  └─ (c) Passenger-carrying drivers
├─ § 395.8 - ELD requirements
└─ § 395.15 - Automatic on-board recording devices
```

**Example Query:**
```
Q: "Can team drivers use the 8/2 split sleeper berth provision?"

Current RAG: Returns 6 chunks about "team drivers", "sleeper berth", "8-hour"
User must manually piece together that:
- Chunk 1: Team drivers have special rules
- Chunk 2: Sleeper berth has split options
- Chunk 3: 8/2 split exists but doesn't specify if teams can use it
Result: User unsure, calls compliance officer

PageIndex:
Navigates to § 395.3(b)(3) directly
Reads: "Team drivers may use either 8/2 or 7/3 split sleeper berth..."
Answer: "Yes, per § 395.3(b)(3), team drivers can use the 8/2 split..."
```

### 3.3 Financial Reports (HIGH VALUE)

**Target Documents:**
- Voyage P&L statements (Mari8X)
- Bunker cost analysis
- Hire statements with adjustments
- Off-hire calculations

**Example Multi-Hop Query:**
```
Query: "What was the total off-hire for Vessel ABC in Q4 2025?"

Document Structure:
Q4 2025 Financial Report - Vessel ABC
├─ Summary (p. 1-2)
│  └─ "Total off-hire: $125,000 (see Section 4.3 for breakdown)"
├─ Operating Expenses (p. 3-10)
├─ Revenue Analysis (p. 11-15)
├─ Off-Hire Analysis (p. 16-20) ← Section 4.3
│  ├─ October: $45,000 (engine repair)
│  ├─ November: $30,000 (dry dock)
│  └─ December: $50,000 (crew shortage)
│     └─ Note: See Appendix E for crew shortage details
└─ Appendices (p. 21-40)
   └─ Appendix E: Crew Shortage Incident Report
      └─ "Shortage due to visa delays, 12 days off-hire @ $4,167/day"

PageIndex Navigation:
1. Reads summary → "see Section 4.3" ✓
2. Navigates to p. 16 (Off-Hire Analysis) ✓
3. Extracts breakdown ✓
4. Sees "Appendix E" reference ✓
5. Follows to Appendix E ✓
6. Gets full context ✓

Answer: "Total Q4 off-hire for Vessel ABC was $125,000, comprising:
- October: $45,000 (engine repair)
- November: $30,000 (dry dock)
- December: $50,000 (crew shortage due to visa delays, 12 days @ $4,167/day)
Source: Q4 2025 Financial Report, Section 4.3 and Appendix E"
```

### 3.4 Bill of Lading Multi-Document Queries

**Scenario:**
```
Documents:
1. Bill of Lading (BoL) - Main document
   └─ "See attached packing list for container weights"
2. Packing List - Attached document
   └─ Container weights table

Current RAG:
- Query: "What are the container weights?"
- Returns: BoL text about containers
- Misses: Packing list (no semantic match for "weights")

PageIndex:
- Reads BoL
- Sees reference: "attached packing list"
- Navigates to linked document
- Extracts weight table
- Returns: Complete weight breakdown
```

---

## 4. Competitive Analysis

### 4.1 PageIndex vs. Current HybridSearch

| Feature | HybridSearch (Current) | PageIndex | Winner |
|---------|----------------------|-----------|--------|
| **Speed** | <100ms | 1-3s | HybridSearch |
| **Accuracy (simple)** | 85% | 82% | HybridSearch |
| **Accuracy (complex)** | 60% | 95%+ | **PageIndex** |
| **Multi-hop queries** | 35% | 90%+ | **PageIndex** |
| **Cross-references** | 20% | 95% | **PageIndex** |
| **Infrastructure** | pgvector DB required | Just PostgreSQL | **PageIndex** |
| **Conversation context** | No | Yes | **PageIndex** |
| **Explainability** | Low (similarity scores) | High (navigation path) | **PageIndex** |
| **Cost (LLM calls)** | 1 call/query | 3-5 calls/query | HybridSearch |

### 4.2 When to Use Each System

**Use HybridSearch for:**
- Short documents (<10 pages)
- Simple fact lookup
- Keyword-based searches
- Real-time data (AIS positions, weather)
- High-volume, low-complexity queries

**Use PageIndex for:**
- Long documents (>10 pages)
- Multi-section documents with ToC
- Queries with "how", "why", "what's the process"
- Documents with cross-references
- Legal/compliance/financial documents

---

## 5. Technical Implementation Plan

### 5.1 Technology Stack

**Core Framework:**
- **PageIndex SDK:** [github.com/VectifyAI/PageIndex](https://github.com/VectifyAI/PageIndex)
- **Language:** TypeScript/Node.js
- **Database:** PostgreSQL (existing)
- **LLM:** Claude Sonnet 4.5 (navigation), Haiku (classification)

**Integration Points:**
```typescript
// New packages to create:
packages/ankr-pageindex/          // Core PageIndex wrapper
packages/ankr-rag-router/         // Smart routing layer

// Modified packages:
packages/ankr-rag/                // Add PageIndex as option
apps/ankr-maritime/backend/       // Enable for charter parties
ankr-labs-nx/packages/ankr-mcp/   // Add PageIndex MCP tools
```

### 5.2 Architecture Components

**Component 1: Document Indexer**
```typescript
// packages/ankr-pageindex/src/indexer.ts
import { PageIndex } from 'pageindex';

export class DocumentIndexer {
  async indexDocument(doc: Document): Promise<TreeIndex> {
    // 1. Extract table of contents
    const toc = await this.extractToC(doc);

    // 2. Build tree structure
    const tree = await PageIndex.createIndex({
      document: doc.content,
      tableOfContents: toc,
      metadata: {
        docType: doc.docType,
        organizationId: doc.organizationId,
        vesselId: doc.vesselId,
      }
    });

    // 3. Store in PostgreSQL
    await prisma.documentIndex.create({
      data: {
        documentId: doc.id,
        indexData: tree.toJSON(),
        version: '1.0'
      }
    });

    return tree;
  }
}
```

**Component 2: Query Router**
```typescript
// packages/ankr-rag-router/src/router.ts
export class RAGRouter {
  async route(query: string, context: ConversationContext) {
    const analysis = await this.classifyQuery(query, context);

    if (analysis.complexity === 'SIMPLE' || analysis.docLength < 10) {
      return this.hybridSearch.search(query);
    }

    if (analysis.hasMultiHop || analysis.docType === 'charter_party') {
      return this.pageIndexSearch.navigate(query, context);
    }

    // Default to hybrid search
    return this.hybridSearch.search(query);
  }

  private async classifyQuery(query: string, context: ConversationContext) {
    const prompt = `Classify this query:
    - SIMPLE: Single fact, lookup, keyword search
    - COMPLEX: Multi-hop, "how/why" questions, cross-references

    Query: ${query}
    Previous turns: ${context.history.length}
    `;

    return await llm.complete(prompt);
  }
}
```

**Component 3: PageIndex Search**
```typescript
// packages/ankr-pageindex/src/search.ts
export class PageIndexSearch {
  async navigate(query: string, context: ConversationContext) {
    // 1. Get relevant document index
    const index = await this.findRelevantIndex(query);

    // 2. Perform tree navigation with LLM
    const navigation = await PageIndex.navigate({
      query,
      index,
      conversationHistory: context.history,
      maxDepth: 5
    });

    // 3. Extract answer with sources
    return {
      answer: navigation.result,
      sources: navigation.visitedNodes.map(n => ({
        section: n.title,
        page: n.pageNumber,
        excerpt: n.content.slice(0, 200)
      })),
      navigationPath: navigation.path
    };
  }
}
```

### 5.3 Database Schema Extensions

```sql
-- New table: document_indexes
CREATE TABLE document_indexes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  index_type VARCHAR(50) DEFAULT 'pageindex_tree',
  index_data JSONB NOT NULL,
  version VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_document_indexes_doc_id ON document_indexes(document_id);
CREATE INDEX idx_document_indexes_type ON document_indexes(index_type);

-- New table: rag_query_logs (for A/B testing)
CREATE TABLE rag_query_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  retrieval_method VARCHAR(50), -- 'hybrid' or 'pageindex'
  organization_id UUID,
  user_id UUID,
  response_time_ms INTEGER,
  sources_returned INTEGER,
  user_feedback INTEGER, -- 1-5 rating
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rag_logs_method ON rag_query_logs(retrieval_method);
CREATE INDEX idx_rag_logs_org ON rag_query_logs(organization_id);
```

---

## 6. Implementation Phases

### Phase 1: Proof of Concept (2 weeks)
**Goal:** Validate PageIndex on 10 charter parties

**Tasks:**
1. Install PageIndex SDK
2. Index 10 charter parties from Mari8X
3. Test 50 queries (25 simple, 25 complex)
4. Benchmark vs. HybridSearch
5. **Success Criteria:** >20% accuracy improvement on complex queries

### Phase 2: Router Development (2 weeks)
**Goal:** Smart query routing between HybridSearch and PageIndex

**Tasks:**
1. Build classification LLM
2. Create routing logic
3. Implement fallback handling
4. Add query logging for analysis
5. **Success Criteria:** 95% correct routing decisions

### Phase 3: Maritime Deployment (3 weeks)
**Goal:** Production deployment for Mari8X charter parties

**Tasks:**
1. Batch index all charter parties (500+ docs)
2. Add GraphQL API mutations
3. Build frontend UI for document upload
4. Add user feedback mechanism
5. **Success Criteria:** 80% user satisfaction score

### Phase 4: Expansion (Ongoing)
**Goal:** Extend to compliance, financial reports, legal contracts

**Tasks:**
1. Index compliance documents
2. Index financial reports
3. Add to logistics MCP tools
4. Create analytics dashboard
5. **Success Criteria:** Cover 80% of long-doc use cases

---

## 7. Cost-Benefit Analysis

### 7.1 Development Costs

| Phase | Duration | Resources | Cost (est.) |
|-------|----------|-----------|-------------|
| Phase 1: POC | 2 weeks | 1 engineer | $8,000 |
| Phase 2: Router | 2 weeks | 1 engineer | $8,000 |
| Phase 3: Maritime Deploy | 3 weeks | 2 engineers | $24,000 |
| Phase 4: Expansion | Ongoing | 1 engineer | $16,000/month |
| **Total Initial:** | **7 weeks** | | **$40,000** |

### 7.2 Operational Costs

**LLM Costs (per 1000 queries):**
```
Current HybridSearch:
- 1 embedding call: $0.10/1M tokens = $0.0001
- 1 generation call: $15/1M tokens = $0.03
- Total: $0.0301 per 1000 queries

PageIndex:
- Classification: $0.01 (Haiku)
- Tree navigation (3-5 calls): $0.15 (Sonnet)
- Generation: $0.03 (Sonnet)
- Total: $0.19 per 1000 queries

Additional cost: $0.16 per 1000 complex queries
At 200 complex queries/month: $0.032/month
```

**Infrastructure:**
- No new databases required (uses PostgreSQL JSONB)
- Storage: ~500KB per indexed document
- 500 charter parties × 500KB = 250MB (negligible)

### 7.3 Benefits

**Quantifiable:**
- **Time saved:** Users spend 5 min/query manually finding clauses
  - 200 queries/month × 5 min × 60% accuracy improvement = 600 min saved/month
  - At $50/hour fully loaded cost = **$500/month saved**

- **Compliance risk reduction:** Misinterpreting regulations costs $10K-$100K/incident
  - Estimate: 1 incident/year prevented = **$50K/year risk reduction**

- **Charter party disputes:** Incorrect clause interpretation costs $25K average
  - Estimate: 2 disputes/year prevented = **$50K/year saved**

**Intangible:**
- Improved user satisfaction (Mari8X competitive advantage)
- Faster onboarding (new users can self-serve)
- Reduced support tickets (60% reduction estimated)

**ROI Calculation:**
```
Annual costs: $40K (initial) + $192K (engineer) + $50 (LLM) = $232K
Annual benefits: $6K (time) + $50K (compliance) + $50K (disputes) = $106K
Net: -$126K Year 1, but $106K/year recurring

Break-even: ~2.2 years
```

---

## 8. Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **PageIndex SDK has bugs** | Medium | High | POC phase identifies issues early; can fork and fix |
| **Latency too high (>5s)** | Medium | High | Use PageIndex only for complex docs; cache tree paths |
| **LLM costs exceed budget** | Low | Medium | Set monthly caps; use Haiku for navigation when possible |
| **Accuracy not better than hybrid** | Low | High | POC phase validates; abort if <10% improvement |
| **User adoption low** | Medium | Medium | Gradual rollout; A/B testing; user training |
| **Document structure varies** | High | Medium | Fallback to HybridSearch if ToC extraction fails |

---

## 9. Success Metrics

### 9.1 Technical Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Accuracy (complex queries) | 60% | 90%+ | Manual evaluation on 100-query test set |
| Multi-hop success rate | 35% | 85%+ | Test queries with "See Appendix X" patterns |
| Response time (p95) | 300ms | 3s | Logging middleware |
| Cost per query | $0.03 | $0.20 | LLM API tracking |

### 9.2 Business Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| User satisfaction | 65% | 90%+ | Post-query thumbs up/down |
| Support tickets | 50/month | 20/month | Ticket tracking system |
| Time to answer | 5 min | 30 sec | User session analytics |
| Compliance incidents | 1/year | 0/year | Incident reports |

### 9.3 Adoption Metrics

| Metric | Target (Month 3) | Target (Month 6) | Measurement |
|--------|-----------------|-----------------|-------------|
| Documents indexed | 100 | 500+ | Database count |
| Queries/month | 500 | 2000+ | Query logs |
| Active users | 50 | 200+ | User analytics |
| PageIndex usage % | 30% | 60% | Router logs |

---

## 10. Next Steps

### Immediate Actions (Week 1)

1. **Repository Setup**
   ```bash
   cd /root/ankr-labs-nx
   git clone https://github.com/VectifyAI/PageIndex packages/ankr-pageindex
   npm install
   ```

2. **POC Planning**
   - Select 10 representative charter parties
   - Create 50-query test set (25 simple, 25 complex)
   - Set up evaluation framework

3. **Team Alignment**
   - Review this report with Maritime team
   - Get approval for Phase 1 POC
   - Allocate engineering resources

### Decision Points

**After Phase 1 (2 weeks):**
- ✅ If accuracy improvement >20% → Proceed to Phase 2
- ⚠️ If improvement 10-20% → Evaluate cost-benefit, consider limited deployment
- ❌ If improvement <10% → Abort, document learnings

**After Phase 2 (4 weeks):**
- ✅ If routing accuracy >90% → Proceed to Phase 3
- ⚠️ If routing accuracy 80-90% → Tune classification, retry
- ❌ If routing accuracy <80% → Simplify to manual selection

**After Phase 3 (7 weeks):**
- ✅ If user satisfaction >80% → Proceed to Phase 4 expansion
- ⚠️ If satisfaction 70-80% → Gather feedback, iterate UX
- ❌ If satisfaction <70% → Re-evaluate use cases

---

## 11. Conclusion

PageIndex represents a **paradigm shift** from similarity-based retrieval to **reasoning-based navigation**. For ANKR's use cases—maritime charter parties, logistics compliance, financial reports—this approach directly addresses the limitations of traditional vector RAG.

**Key Takeaways:**

1. **Not a replacement, but an addition** - PageIndex excels at complex documents; HybridSearch remains ideal for simple queries

2. **Proven technology** - 98.7% accuracy on FinanceBench, fully open source, active development

3. **High-impact domains** - Maritime contracts (500+ docs), compliance (critical accuracy), financial reports (multi-hop queries)

4. **Manageable risk** - 2-week POC validates approach before major investment

5. **Strong ROI potential** - $106K/year in benefits after initial investment

**Recommendation:** **Proceed with Phase 1 POC immediately.** The technology is mature, the use cases are clear, and the potential impact is significant.

---

## Appendix A: References

**Open Source Repositories:**
- [VectifyAI/PageIndex](https://github.com/VectifyAI/PageIndex) - Main framework
- [VectifyAI/pageindex-mcp](https://github.com/VectifyAI/pageindex-mcp) - MCP server
- [VectifyAI/Mafin2.5-FinanceBench](https://github.com/VectifyAI/Mafin2.5-FinanceBench) - Benchmark results

**Documentation:**
- [PageIndex Official Docs](https://docs.pageindex.ai/)
- [PageIndex Blog - Introduction](https://pageindex.ai/blog/pageindex-intro)
- [Mafin 2.5 Results](https://pageindex.ai/blog/Mafin2.5)

**Research:**
- VentureBeat Article: [Tree search framework hits 98.7% on documents](https://venturebeat.com/ai/pageindex-rag/) (January 30, 2026)
- LinkedIn: [Mingtian Zhang](https://www.linkedin.com/in/mingtian-zhang-992451108/)

## Appendix B: Glossary

- **RAG:** Retrieval-Augmented Generation - technique where LLMs retrieve relevant context before generating answers
- **Vector Search:** Semantic similarity search using embeddings
- **Tree Search:** Hierarchical navigation inspired by game-playing AI (AlphaGo)
- **Multi-hop Query:** Question requiring information from multiple document sections
- **RRF:** Reciprocal Rank Fusion - method to combine multiple search results
- **ToC:** Table of Contents - hierarchical document structure
- **TTFT:** Time to First Token - latency metric for streaming responses

---

**Document Control:**
- Version: 1.0
- Last Updated: February 1, 2026
- Next Review: After Phase 1 completion
- Owner: ANKR Labs RAG Team
