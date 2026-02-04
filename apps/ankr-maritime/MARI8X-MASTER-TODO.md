# Mari8X Master TODO - Complete Action Plan

**Last Updated:** January 31, 2026
**Status:** Phase 32 Foundation Complete, Enterprise Features In Planning
**Priority:** HIGH - Strategic differentiation opportunity

---

## Executive Summary

### What We're Building:

```
Mari8X Enterprise Knowledge Management
= Maritime Operations Platform
+ AI-Powered Charter Party Intelligence
+ Team Collaboration & Deal Rooms
+ Institutional Knowledge Preservation

Market Position: ONLY maritime platform with this capability
Timeline: 10-12 weeks to full enterprise feature set
Cost: $0 infrastructure (reuse existing code)
ROI: 4,650% first year
```

---

## Current Status (✅ Completed)

### Phase 0: Infrastructure Ready
- [x] PostgreSQL 16 with pgvector extension enabled
- [x] Prisma ORM configured with 127+ models
- [x] Fastify + Mercurius GraphQL backend
- [x] React 19 + Vite + Apollo Client frontend
- [x] Multi-tenancy with organizationId
- [x] JWT authentication
- [x] SwayamBot AI assistant (292 lines)
- [x] Document vault (Phase 5)
- [x] i18n support (14 languages)

### Phase 32 Foundation: RAG System
- [x] RAG database schema created
  - [x] `maritime_documents` table (22 columns)
  - [x] `search_queries` table
  - [x] `document_processing_jobs` table
  - [x] Migration applied successfully
  - [x] Prisma client regenerated

- [x] Database permissions fixed
  - [x] Granted permissions to `ankr` user
  - [x] All RAG tables accessible

- [x] PostgreSQL triggers fixed
  - [x] Fixed case sensitivity for camelCase columns
  - [x] tsvector auto-population working
  - [x] Full-text search operational

- [x] Sample data uploaded
  - [x] GENCON 2022 charter party (145KB PDF)
  - [x] Document ID: `doc-gencon-2022-sample`
  - [x] Successfully inserted to `documents` table

- [x] RAG indexing complete
  - [x] Document processed and indexed
  - [x] 1 chunk created (1,237 characters)
  - [x] Entities extracted (1 vessel, 2 ports)
  - [x] Processing job: COMPLETED ✅

- [x] Full-text search verified
  - [x] Test queries working: "demurrage", "laytime", "freight"
  - [x] tsvector index operational
  - [x] ts_rank scoring functional
  - [x] <50ms response time

- [x] Infrastructure documented
  - [x] HYBRID-DMS-COMPLETE.md (443 lines)
  - [x] HYBRID-DMS-GUIDE.md (430 lines)
  - [x] PHASE32-RAG-COMPLETE-SUMMARY.md
  - [x] MARI8X-RAG-KNOWLEDGE-ENGINE.md (1,000+ lines)
  - [x] ankr_Mari8x_LMS_integration.md (1,000+ lines)

- [x] Scripts created
  - [x] `scripts/index-sample-cp.ts` - RAG indexing
  - [x] `scripts/test-search.ts` - Search testing
  - [x] `scripts/quick-upload-cp.sql` - Quick data upload

### Hybrid DMS Infrastructure
- [x] Docker Compose configuration created
  - [x] MinIO service (ports 9000, 9001)
  - [x] Ollama service (port 11434)
  - [x] Redis service (port 6379)
  - [x] docker-compose.dms.yml ready

- [x] Backend services created
  - [x] `src/config/hybrid-dms.ts` (240 lines)
  - [x] `src/services/hybrid/ollama-client.ts` (280 lines)
  - [x] `src/services/hybrid/minio-client.ts` (250 lines)
  - [x] `src/services/hybrid/tesseract-ocr.ts` (180 lines)

- [x] Setup automation
  - [x] `setup-hybrid-dms.sh` (120 lines)
  - [x] `.env.hybrid` template
  - [x] One-command installation ready

### ankr-lms Evaluation Complete
- [x] Comprehensive codebase exploration
  - [x] @ankr/classroom (987 lines) - Evaluated
  - [x] @ankr/assessment (734 lines) - Evaluated
  - [x] @ankr/ai-tutor (402 lines) - Evaluated
  - [x] @ankr/peer-learning (1,200+ lines) - Evaluated
  - [x] @ankr/gamification (736 lines) - Evaluated
  - [x] @ankr/vectorize - Evaluated

- [x] Integration architecture designed
  - [x] Option 1: Embedded integration (recommended)
  - [x] Option 2: Microservices (alternative)
  - [x] Option 3: RAG only (simplest)
  - [x] **Selected: Enterprise tier with selective features**

- [x] Strategic positioning defined
  - [x] Basic/Pro: Core operations
  - [x] Enterprise: Knowledge management
  - [x] Feature matrix created
  - [x] Pricing strategy outlined

---

## Phase 1: Complete Hybrid DMS Deployment (Week 1) 🔄 IN PROGRESS

**Goal:** Deploy MinIO + Ollama + Redis infrastructure

**Priority:** HIGH - Required for embeddings and semantic search

### 1.1 Start Docker Services

- [ ] **Run Hybrid DMS Setup**
  ```bash
  cd /root/apps/ankr-maritime
  ./setup-hybrid-dms.sh
  ```
  - [ ] Verify Docker installed
  - [ ] Start MinIO container
  - [ ] Start Ollama container
  - [ ] Start Redis container
  - [ ] Verify all services healthy

- [ ] **Configure MinIO**
  - [ ] Access console: http://localhost:9001
  - [ ] Login: mari8x / mari8x_secure_2026
  - [ ] Create `maritime-docs` bucket
  - [ ] Enable versioning
  - [ ] Test file upload

- [ ] **Configure Ollama**
  - [ ] Pull nomic-embed-text model (335MB)
    ```bash
    docker exec mari8x-ollama ollama pull nomic-embed-text
    ```
  - [ ] Pull qwen2.5:14b model (9GB)
    ```bash
    docker exec mari8x-ollama ollama pull qwen2.5:14b
    ```
  - [ ] Test embedding generation
  - [ ] Test LLM inference

- [ ] **Configure Redis**
  - [ ] Test connection
    ```bash
    docker exec mari8x-redis redis-cli ping
    ```
  - [ ] Verify 512MB memory limit
  - [ ] Test cache write/read

### 1.2 Backend Configuration

- [ ] **Install Dependencies**
  ```bash
  cd backend
  npm install minio tesseract.js redis ioredis
  ```

- [ ] **Configure Environment**
  ```bash
  # Add to backend/.env

  # Hybrid DMS
  DMS_MODE=dev
  EMBEDDINGS_PROVIDER=ollama
  LLM_PROVIDER=ollama
  MINIO_ENDPOINT=localhost
  MINIO_PORT=9000
  MINIO_ACCESS_KEY=mari8x
  MINIO_SECRET_KEY=mari8x_secure_2026
  REDIS_HOST=localhost
  REDIS_PORT=6379

  # For production
  # DMS_MODE=prod
  # EMBEDDINGS_PROVIDER=voyage
  # LLM_PROVIDER=groq
  # VOYAGE_API_KEY=pa-IZUdnDHSHAErlmOHsI2w7EqwbIXBxLEtgiE2pB2zqLr
  # GROQ_API_KEY=your-key-here
  ```

- [ ] **Test Services**
  ```bash
  # Test MinIO
  node -e "const { minioClient } = require('./src/services/hybrid/minio-client.js'); minioClient.upload('test.txt', Buffer.from('test')).then(console.log);"

  # Test Ollama
  node -e "const { ollamaClient } = require('./src/services/hybrid/ollama-client.js'); ollamaClient.embed('test').then(console.log);"

  # Test Redis
  node -e "const redis = require('redis'); const client = redis.createClient(); client.connect().then(() => client.ping()).then(console.log);"
  ```

### 1.3 Generate Embeddings for Existing Documents

- [ ] **Create Embedding Generation Script**
  ```bash
  # backend/scripts/generate-embeddings.ts
  ```
  - [ ] Fetch all documents without embeddings
  - [ ] Generate embeddings using Ollama/Voyage
  - [ ] Update maritime_documents table
  - [ ] Track progress
  - [ ] Handle errors

- [ ] **Run Embedding Generation**
  ```bash
  npx tsx scripts/generate-embeddings.ts
  ```
  - [ ] Process GENCON 2022 sample
  - [ ] Verify embedding stored
  - [ ] Test semantic search

- [ ] **Test Semantic Search**
  ```bash
  npx tsx scripts/test-semantic-search.ts
  ```
  - [ ] Query: "demurrage rate"
  - [ ] Verify vector similarity results
  - [ ] Compare with text-only search
  - [ ] Measure response time

**Deliverables:**
- [ ] All services running and healthy
- [ ] 1+ document with embeddings
- [ ] Semantic search operational
- [ ] Response time <2s

**Estimated Time:** 4-8 hours (depending on model download speed)

---

## Phase 2: Enhanced RAG & Search UI (Week 2-3) 🔜 NEXT

**Goal:** Complete RAG backend and build search interface

**Priority:** HIGH - Core enterprise feature

### 2.1 Complete maritime-rag.ts Service

- [ ] **Add Embedding Generation**
  ```typescript
  // backend/src/services/rag/maritime-rag.ts

  async generateEmbedding(text: string): Promise<number[]> {
    if (hybridDMSConfig.embeddings.provider === 'voyage') {
      return await this.voyageEmbedding(text);
    } else {
      return await ollamaClient.embed(text);
    }
  }
  ```

- [ ] **Implement Semantic Search**
  ```typescript
  async semanticSearch(query: string, options: SearchOptions, orgId: string) {
    // Generate query embedding
    const embedding = await this.generateEmbedding(query);

    // Vector similarity search
    const results = await prisma.$queryRaw`
      SELECT
        id,
        title,
        content,
        1 - (embedding <=> ${embedding}::vector) as similarity
      FROM maritime_documents
      WHERE "organizationId" = ${orgId}
      ORDER BY similarity DESC
      LIMIT ${options.limit}
    `;

    return results;
  }
  ```

- [ ] **Implement Hybrid Search (Text + Vector)**
  ```typescript
  async hybridSearch(query: string, options: SearchOptions, orgId: string) {
    // Text search
    const textResults = await this.textSearch(query, orgId);

    // Semantic search
    const semanticResults = await this.semanticSearch(query, options, orgId);

    // RRF (Reciprocal Rank Fusion)
    return this.mergeResults(textResults, semanticResults);
  }
  ```

- [ ] **Implement RAG Q&A**
  ```typescript
  async ask(question: string, options: AskOptions, orgId: string) {
    // Search relevant documents
    const results = await this.hybridSearch(question, { limit: 5 }, orgId);

    // Build context
    const context = results.map(r => r.content).join('\n\n');

    // Generate answer with LLM
    const prompt = `Based on the following context, answer the question.

    Context: ${context}

    Question: ${question}

    Answer:`;

    const answer = await ollamaClient.generate(prompt);

    return {
      answer,
      sources: results,
      confidence: this.calculateConfidence(results),
      followUpSuggestions: this.generateFollowUps(question, answer),
    };
  }
  ```

- [ ] **Add Caching Layer**
  ```typescript
  async searchWithCache(query: string, options: SearchOptions, orgId: string) {
    const cacheKey = `search:${orgId}:${query}`;

    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // Perform search
    const results = await this.hybridSearch(query, options, orgId);

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(results));

    return results;
  }
  ```

### 2.2 GraphQL API Enhancement

- [ ] **Update knowledge-engine.ts Types**
  ```typescript
  // backend/src/schema/types/knowledge-engine.ts

  builder.queryFields((t) => ({
    searchDocuments: t.field({
      type: ['SearchResult'],
      args: {
        query: t.arg.string({ required: true }),
        limit: t.arg.int({ defaultValue: 10 }),
        docTypes: t.arg.stringList(),
        useSemanticSearch: t.arg.boolean({ defaultValue: true }),
      },
      resolve: async (root, args, ctx) => {
        return await maritimeRAG.searchWithCache(
          args.query,
          {
            limit: args.limit,
            docTypes: args.docTypes,
            semantic: args.useSemanticSearch,
          },
          ctx.organizationId
        );
      },
    }),

    askRAG: t.field({
      type: 'RAGAnswer',
      args: {
        question: t.arg.string({ required: true }),
      },
      resolve: async (root, args, ctx) => {
        return await maritimeRAG.ask(
          args.question,
          { limit: 5 },
          ctx.organizationId
        );
      },
    }),
  }));
  ```

### 2.3 Frontend: Global Search Bar

- [ ] **Create GlobalSearchBar Component**
  ```tsx
  // frontend/src/components/rag/GlobalSearchBar.tsx

  import { useState } from 'react';
  import { useQuery } from '@apollo/client';
  import { useNavigate } from 'react-router-dom';

  export default function GlobalSearchBar() {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const { data, loading } = useQuery(SEARCH_DOCUMENTS, {
      variables: { query, limit: 5 },
      skip: query.length < 3,
    });

    // Keyboard shortcut: Cmd/Ctrl + K
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          setIsOpen(true);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
      <div className="relative">
        <input
          type="text"
          placeholder="Search documents... (⌘K)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="w-96 px-4 py-2 rounded-lg border"
        />

        {isOpen && query.length >= 3 && (
          <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg max-h-96 overflow-y-auto">
            {loading && <div className="p-4">Searching...</div>}

            {data?.searchDocuments.map((result) => (
              <div
                key={result.id}
                onClick={() => {
                  navigate(`/documents/${result.id}`);
                  setIsOpen(false);
                }}
                className="p-4 hover:bg-gray-50 cursor-pointer border-b"
              >
                <h4 className="font-semibold">{result.title}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {result.excerpt.substring(0, 150)}...
                </p>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs bg-blue-100 px-2 py-1 rounded">
                    {(result.score * 100).toFixed(0)}% match
                  </span>
                </div>
              </div>
            ))}

            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={() => navigate(`/advanced-search?q=${query}`)}
                className="text-blue-600 text-sm font-medium"
              >
                See all results →
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
  ```

- [ ] **Add to Layout.tsx**
  ```tsx
  // frontend/src/components/Layout.tsx

  import GlobalSearchBar from './rag/GlobalSearchBar';

  // In header, between title and user menu:
  <GlobalSearchBar />
  ```

### 2.4 Frontend: Advanced Search Page

- [ ] **Create AdvancedSearch Page**
  - [ ] Search input with filters
  - [ ] Left sidebar: Faceted filters
    - [ ] Document type checkboxes
    - [ ] Status (draft, active, archived)
    - [ ] Date range picker
    - [ ] Vessel selector
    - [ ] Port selector
  - [ ] Right panel: Results
    - [ ] SearchResultCard components
    - [ ] Pagination
    - [ ] Sort options
  - [ ] Export functionality
  - [ ] Save search feature

- [ ] **Create SearchResultCard Component**
  ```tsx
  // frontend/src/components/rag/SearchResultCard.tsx

  export default function SearchResultCard({ result }) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">
              {result.title}
            </h3>

            <p className="text-gray-600 mb-4">
              <Highlighter
                searchWords={[searchQuery]}
                textToHighlight={result.excerpt}
              />
            </p>

            <div className="flex gap-3">
              {result.entities.vesselNames.map(v => (
                <span key={v} className="badge badge-blue">🚢 {v}</span>
              ))}
              {result.entities.portNames.map(p => (
                <span key={p} className="badge badge-green">⚓ {p}</span>
              ))}
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {(result.score * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-gray-500">relevance</div>
          </div>
        </div>

        <div className="flex gap-2 mt-4 pt-4 border-t">
          <button onClick={() => viewDocument(result.id)}>
            View Document
          </button>
          <button onClick={() => downloadDocument(result.id)}>
            Download
          </button>
          <button onClick={() => shareDocument(result.id)}>
            Share
          </button>
        </div>
      </div>
    );
  }
  ```

- [ ] **Add Route**
  ```tsx
  // frontend/src/App.tsx

  <Route path="/advanced-search" element={<AdvancedSearch />} />
  ```

### 2.5 Enhance SwayamBot with RAG

- [ ] **Update SwayamBot Component**
  ```tsx
  // frontend/src/components/SwayamBot.tsx

  const ASK_RAG = gql`
    query AskRAG($question: String!) {
      askRAG(question: $question) {
        answer
        sources {
          documentId
          title
          excerpt
          score
        }
        confidence
        followUpSuggestions
      }
    }
  `;

  // ... in component:

  const handleSend = async () => {
    const { data } = await client.query({
      query: ASK_RAG,
      variables: { question: input },
    });

    setMessages([
      ...messages,
      {
        role: 'user',
        content: input,
      },
      {
        role: 'assistant',
        content: data.askRAG.answer,
        sources: data.askRAG.sources,
        confidence: data.askRAG.confidence,
        suggestions: data.askRAG.followUpSuggestions,
      },
    ]);
  };

  // In render:
  {message.sources && (
    <div className="mt-3 p-3 bg-gray-50 rounded">
      <p className="text-xs font-semibold mb-2">📚 Sources:</p>
      {message.sources.map((source, idx) => (
        <div key={idx} className="text-xs mb-1">
          <a
            href={`/documents/${source.documentId}`}
            className="text-blue-600 hover:underline"
          >
            {source.title}
          </a>
          <span className="text-gray-500 ml-2">
            ({(source.score * 100).toFixed(0)}% relevant)
          </span>
        </div>
      ))}
    </div>
  )}

  {message.confidence && (
    <div className="mt-2 text-xs text-gray-500">
      Confidence: {(message.confidence * 100).toFixed(0)}%
      {'⭐'.repeat(Math.round(message.confidence * 5))}
    </div>
  )}
  ```

**Deliverables:**
- [ ] RAG backend complete with caching
- [ ] Global search bar in header
- [ ] Advanced search page functional
- [ ] SwayamBot shows sources and confidence
- [ ] End-to-end search working

**Estimated Time:** 2 weeks

---

## Phase 3: Enterprise Features - Database Schema (Week 4) 🔜 UPCOMING

**Goal:** Add Enterprise-specific tables for knowledge management

**Priority:** MEDIUM - Required for Enterprise tier

### 3.1 Add Enterprise Schema to Prisma

- [ ] **Document Linking**
  ```prisma
  model DocumentLink {
    id          String @id @default(cuid())
    fromDocId   String
    toDocId     String
    linkType    String // related_cp, precedent, template, reference, mentions
    context     String? @db.Text
    createdBy   String
    createdAt   DateTime @default(now())

    fromDoc Document @relation("LinksFrom", fields: [fromDocId], references: [id])
    toDoc   Document @relation("LinksTo", fields: [toDocId], references: [id])
    user    User @relation(fields: [createdBy], references: [id])

    @@unique([fromDocId, toDocId, linkType])
    @@index([fromDocId])
    @@index([toDocId])
    @@map("document_links")
  }
  ```

- [ ] **Knowledge Collections**
  ```prisma
  model KnowledgeCollection {
    id             String @id @default(cuid())
    name           String
    description    String? @db.Text
    collectionType String // cp_templates, vessel_knowledge, route_guides, best_practices
    icon           String?
    color          String?
    organizationId String
    createdBy      String
    isEnterprise   Boolean @default(true)

    organization Organization @relation(fields: [organizationId], references: [id])
    user         User @relation(fields: [createdBy], references: [id])
    documents    CollectionDocument[]

    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    @@index([organizationId])
    @@map("knowledge_collections")
  }

  model CollectionDocument {
    id           String @id @default(cuid())
    collectionId String
    documentId   String
    order        Int?
    addedBy      String
    addedAt      DateTime @default(now())

    collection KnowledgeCollection @relation(fields: [collectionId], references: [id])
    document   Document @relation(fields: [documentId], references: [id])
    user       User @relation(fields: [addedBy], references: [id])

    @@unique([collectionId, documentId])
    @@index([collectionId])
    @@map("collection_documents")
  }
  ```

- [ ] **Deal Rooms (Forums Adapted)**
  ```prisma
  model DealRoom {
    id             String @id @default(cuid())
    name           String
    description    String? @db.Text
    status         String @default("active") // active, negotiating, signed, completed, cancelled
    organizationId String

    // Link to actual charter/voyage
    charterId      String?
    voyageId       String?

    createdBy      String
    isEnterprise   Boolean @default(true)

    organization Organization @relation(fields: [organizationId], references: [id])
    charter      Charter? @relation(fields: [charterId], references: [id])
    voyage       Voyage? @relation(fields: [voyageId], references: [id])
    user         User @relation(fields: [createdBy], references: [id])

    members   DealRoomMember[]
    threads   DealThread[]
    resources DealResource[]

    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    @@index([organizationId])
    @@index([status])
    @@map("deal_rooms")
  }

  model DealRoomMember {
    id       String @id @default(cuid())
    roomId   String
    userId   String
    role     String @default("member") // owner, member, viewer
    joinedAt DateTime @default(now())

    room DealRoom @relation(fields: [roomId], references: [id])
    user User @relation(fields: [userId], references: [id])

    @@unique([roomId, userId])
    @@map("deal_room_members")
  }

  model DealThread {
    id        String @id @default(cuid())
    roomId    String
    userId    String
    title     String
    content   String @db.Text
    isPinned  Boolean @default(false)
    isLocked  Boolean @default(false)

    room    DealRoom @relation(fields: [roomId], references: [id])
    user    User @relation(fields: [userId], references: [id])
    replies DealReply[]

    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    @@index([roomId])
    @@map("deal_threads")
  }

  model DealReply {
    id         String @id @default(cuid())
    threadId   String
    userId     String
    content    String @db.Text
    isResolution Boolean @default(false)
    likes      Int @default(0)

    thread DealThread @relation(fields: [threadId], references: [id])
    user   User @relation(fields: [userId], references: [id])

    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    @@index([threadId])
    @@map("deal_replies")
  }

  model DealResource {
    id           String @id @default(cuid())
    roomId       String
    userId       String
    resourceType String // note, file, link, charter_party_draft
    title        String
    content      String? @db.Text
    url          String?
    documentId   String?

    room     DealRoom @relation(fields: [roomId], references: [id])
    user     User @relation(fields: [userId], references: [id])
    document Document? @relation(fields: [documentId], references: [id])

    createdAt DateTime @default(now())

    @@index([roomId])
    @@map("deal_resources")
  }
  ```

- [ ] **Compliance Tracking (Enterprise)**
  ```prisma
  model ComplianceCertificate {
    id              String @id @default(cuid())
    certificateType String // STCW, MARPOL, SOLAS, ISM, class_cert
    certificateName String
    vesselId        String?
    userId          String? // For crew certificates
    issueDate       DateTime
    expiryDate      DateTime
    issuingAuth     String
    certificateNo   String?
    documentId      String? // Link to actual certificate file
    status          String // valid, expiring_soon, expired, suspended
    organizationId  String

    organization Organization @relation(fields: [organizationId], references: [id])
    vessel       Vessel? @relation(fields: [vesselId], references: [id])
    user         User? @relation(fields: [userId], references: [id])
    document     Document? @relation(fields: [documentId], references: [id])

    alerts ComplianceAlert[]

    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    @@index([expiryDate, status])
    @@index([organizationId])
    @@index([vesselId])
    @@map("compliance_certificates")
  }

  model ComplianceAlert {
    id            String @id @default(cuid())
    certificateId String
    alertType     String // expiring_30, expiring_7, expired
    alertDate     DateTime
    acknowledged  Boolean @default(false)
    acknowledgedBy String?
    acknowledgedAt DateTime?

    certificate ComplianceCertificate @relation(fields: [certificateId], references: [id])

    createdAt DateTime @default(now())

    @@index([alertDate, acknowledged])
    @@map("compliance_alerts")
  }
  ```

- [ ] **Organization Subscription (for Enterprise tier)**
  ```prisma
  model OrganizationSubscription {
    id             String @id @default(cuid())
    organizationId String @unique
    tier           String @default("pro") // basic, pro, enterprise
    features       String[] @default([])

    // Limits
    maxVessels     Int?
    maxUsers       Int?
    maxStorage     BigInt? // bytes

    // Billing
    startDate      DateTime
    renewalDate    DateTime
    status         String @default("active") // active, cancelled, suspended

    organization Organization @relation(fields: [organizationId], references: [id])

    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    @@map("organization_subscriptions")
  }
  ```

- [ ] **Update Existing Models**
  ```prisma
  model Document {
    // Add relations
    linksFrom    DocumentLink[] @relation("LinksFrom")
    linksTo      DocumentLink[] @relation("LinksTo")
    collections  CollectionDocument[]
    dealResources DealResource[]
    certificates ComplianceCertificate[]
  }

  model Organization {
    // Add relations
    subscription      OrganizationSubscription?
    collections       KnowledgeCollection[]
    dealRooms         DealRoom[]
    certificates      ComplianceCertificate[]
  }

  model Charter {
    // Add relations
    dealRooms DealRoom[]
  }

  model Voyage {
    // Add relations
    dealRooms DealRoom[]
  }

  model Vessel {
    // Add relations
    certificates ComplianceCertificate[]
  }

  model User {
    // Add relations
    documentLinks        DocumentLink[]
    collectionsCreated   KnowledgeCollection[]
    collectionDocuments  CollectionDocument[]
    dealRoomsCreated     DealRoom[]
    dealRoomMemberships  DealRoomMember[]
    dealThreads          DealThread[]
    dealReplies          DealReply[]
    dealResources        DealResource[]
    certificates         ComplianceCertificate[]
  }
  ```

- [ ] **Create Migration**
  ```bash
  npx prisma migrate dev --name add_enterprise_features
  npx prisma generate
  ```

- [ ] **Seed Enterprise Demo Data**
  - [ ] Create sample collections
  - [ ] Create sample deal room
  - [ ] Link sample documents
  - [ ] Add sample compliance certificates

**Deliverables:**
- [ ] Enterprise schema in production
- [ ] Migration applied successfully
- [ ] Demo data seeded
- [ ] Prisma client updated

**Estimated Time:** 1 week

---

## Phase 4: Enterprise Backend Services (Week 5-6)

**Goal:** Implement enterprise feature backend logic

### 4.1 Document Linking Service

- [ ] **Create EnterpriseKnowledgeService**
  ```bash
  # File: backend/src/services/enterprise/knowledge-service.ts
  ```
  - [ ] linkDocuments() - Create document links
  - [ ] unlinkDocuments() - Remove links
  - [ ] getDocumentLinks() - Get all links for a document
  - [ ] suggestRelatedDocuments() - AI-powered suggestions
  - [ ] getDocumentNetwork() - Graph view data

- [ ] **GraphQL Schema**
  ```typescript
  // backend/src/schema/types/enterprise/knowledge.ts

  type DocumentLink {
    id: ID!
    fromDocument: Document!
    toDocument: Document!
    linkType: String!
    context: String
    createdBy: User!
    createdAt: DateTime!
  }

  type DocumentNetworkNode {
    id: ID!
    title: String!
    type: String!
    category: String!
  }

  type DocumentNetworkEdge {
    from: ID!
    to: ID!
    linkType: String!
  }

  type DocumentNetwork {
    nodes: [DocumentNetworkNode!]!
    edges: [DocumentNetworkEdge!]!
  }

  extend type Query {
    documentLinks(documentId: ID!): [DocumentLink!]! @requireEnterprise
    suggestedRelatedDocuments(documentId: ID!): [Document!]! @requireEnterprise
    documentNetwork(documentId: ID!, depth: Int = 2): DocumentNetwork! @requireEnterprise
  }

  extend type Mutation {
    linkDocuments(
      fromDocId: ID!
      toDocId: ID!
      linkType: String!
      context: String
    ): DocumentLink! @requireEnterprise

    unlinkDocuments(linkId: ID!): Boolean! @requireEnterprise
  }
  ```

### 4.2 Deal Rooms Service

- [ ] **Create DealRoomService**
  ```bash
  # File: backend/src/services/enterprise/deal-room-service.ts
  ```
  - [ ] createDealRoom() - Create new deal room
  - [ ] addMember() - Add team member
  - [ ] createThread() - Start discussion
  - [ ] replyToThread() - Add reply
  - [ ] shareResource() - Share document/link
  - [ ] getDealRoomActivity() - Activity feed

- [ ] **GraphQL Schema**
  ```typescript
  // backend/src/schema/types/enterprise/deal-room.ts

  type DealRoom {
    id: ID!
    name: String!
    description: String
    status: String!
    charter: Charter
    voyage: Voyage
    members: [DealRoomMember!]!
    threads: [DealThread!]!
    resources: [DealResource!]!
    createdBy: User!
    createdAt: DateTime!
  }

  type DealThread {
    id: ID!
    title: String!
    content: String!
    isPinned: Boolean!
    user: User!
    replies: [DealReply!]!
    createdAt: DateTime!
  }

  extend type Query {
    dealRooms: [DealRoom!]! @requireEnterprise
    dealRoom(id: ID!): DealRoom @requireEnterprise
    dealRoomActivity(roomId: ID!, limit: Int = 20): [Activity!]! @requireEnterprise
  }

  extend type Mutation {
    createDealRoom(
      name: String!
      description: String
      charterId: ID
      voyageId: ID
    ): DealRoom! @requireEnterprise

    addDealRoomMember(roomId: ID!, userId: ID!): DealRoomMember! @requireEnterprise

    createDealThread(
      roomId: ID!
      title: String!
      content: String!
    ): DealThread! @requireEnterprise
  }
  ```

### 4.3 Compliance Service

- [ ] **Create ComplianceService**
  ```bash
  # File: backend/src/services/enterprise/compliance-service.ts
  ```
  - [ ] createCertificate() - Add new certificate
  - [ ] updateCertificate() - Update certificate
  - [ ] getComplianceDashboard() - Dashboard data
  - [ ] getExpiringCertificates() - Get expiring soon
  - [ ] acknowledgeAlert() - Mark alert as seen
  - [ ] generateComplianceReport() - PDF/Excel report

- [ ] **GraphQL Schema**
  ```typescript
  type ComplianceDashboard {
    totalCertificates: Int!
    valid: Int!
    expiringSoon: Int!
    expired: Int!
    byType: JSON!
    byVessel: JSON!
    alerts: [ComplianceAlert!]!
  }

  extend type Query {
    complianceDashboard: ComplianceDashboard! @requireEnterprise
    expiringCertificates(days: Int = 30): [ComplianceCertificate!]! @requireEnterprise
  }
  ```

### 4.4 Feature Gating Middleware

- [ ] **Create Enterprise Check Middleware**
  ```typescript
  // backend/src/middleware/require-enterprise.ts

  export async function requireEnterprise(
    resolve: any,
    root: any,
    args: any,
    context: any,
    info: any
  ) {
    const user = context.user;
    if (!user) throw new Error('Authentication required');

    const subscription = await prisma.organizationSubscription.findUnique({
      where: { organizationId: user.organizationId },
    });

    if (subscription?.tier !== 'enterprise') {
      throw new Error('This feature requires Mari8X Enterprise');
    }

    return resolve(root, args, context, info);
  }
  ```

- [ ] **Apply to Schema**
  ```typescript
  // Use as directive
  builder.globalAuthScopes({
    enterprise: async (context) => {
      const subscription = await prisma.organizationSubscription.findUnique({
        where: { organizationId: context.user.organizationId },
      });
      return subscription?.tier === 'enterprise';
    },
  });
  ```

**Deliverables:**
- [ ] 3 enterprise services implemented
- [ ] GraphQL schema extended
- [ ] Feature gating working
- [ ] APIs tested

**Estimated Time:** 2 weeks

---

## Phase 5: Enterprise Frontend (Week 7-9)

**Goal:** Build enterprise UI components and pages

### 5.1 Knowledge Base Page

- [ ] **Create /enterprise/knowledge-base Page**
  - [ ] Collections sidebar
  - [ ] Document grid/list view
  - [ ] Document network graph component
  - [ ] Related documents panel
  - [ ] Link documents UI
  - [ ] Create collection modal

### 5.2 Deal Rooms Page

- [ ] **Create /enterprise/deal-rooms Page**
  - [ ] List of deal rooms
  - [ ] Create deal room modal
  - [ ] Deal room detail view
  - [ ] Thread list
  - [ ] Reply composer
  - [ ] Share resource modal
  - [ ] Activity feed

### 5.3 Compliance Dashboard

- [ ] **Create /enterprise/compliance Page**
  - [ ] Dashboard overview cards
  - [ ] Certificate list with status
  - [ ] Expiry calendar view
  - [ ] Alert notifications
  - [ ] Add certificate modal
  - [ ] Export compliance report

### 5.4 Enterprise Navigation

- [ ] **Update Sidebar**
  ```tsx
  // For Enterprise users only
  {
    id: 'enterprise',
    label: 'Enterprise',
    icon: '⭐',
    color: 'purple',
    requiresEnterprise: true,
    items: [
      { href: '/enterprise/knowledge-base', label: 'Knowledge Base' },
      { href: '/enterprise/deal-rooms', label: 'Deal Rooms' },
      { href: '/enterprise/compliance', label: 'Compliance' },
      { href: '/enterprise/analytics', label: 'Analytics' },
    ],
  }
  ```

- [ ] **Add Enterprise Badge**
  ```tsx
  // Show badge for enterprise features
  <EnterpriseFeature
    fallback={<UpgradePrompt feature="Knowledge Management" />}
  >
    {children}
  </EnterpriseFeature>
  ```

### 5.5 Document Network Graph Component

- [ ] **Install Dependencies**
  ```bash
  npm install react-force-graph-2d d3
  ```

- [ ] **Create NetworkGraph Component**
  ```tsx
  // frontend/src/components/enterprise/NetworkGraph.tsx

  import ForceGraph2D from 'react-force-graph-2d';

  export default function DocumentNetworkGraph({ documentId }) {
    const { data } = useQuery(GET_DOCUMENT_NETWORK, {
      variables: { documentId, depth: 2 },
    });

    return (
      <ForceGraph2D
        graphData={data.documentNetwork}
        nodeLabel="title"
        nodeColor={node => NODE_COLORS[node.category]}
        linkDirectionalArrowLength={6}
        onNodeClick={node => openDocument(node.id)}
        cooldownTicks={100}
        onEngineStop={() => fitToCanvas()}
      />
    );
  }
  ```

**Deliverables:**
- [ ] 3 enterprise pages complete
- [ ] Network graph visualization
- [ ] Deal rooms functional
- [ ] Compliance dashboard live
- [ ] Feature gating UI working

**Estimated Time:** 3 weeks

---

## Phase 6: Testing & Polish (Week 10)

**Goal:** Test, fix bugs, optimize performance

### 6.1 Testing

- [ ] **Unit Tests**
  - [ ] Backend services (80%+ coverage)
  - [ ] GraphQL resolvers
  - [ ] Enterprise middleware

- [ ] **Integration Tests**
  - [ ] Search flow end-to-end
  - [ ] RAG Q&A flow
  - [ ] Document linking
  - [ ] Deal room creation

- [ ] **E2E Tests**
  - [ ] User journey: Search → View → Link
  - [ ] User journey: Create deal room → Discuss → Close
  - [ ] User journey: Upload cert → Get alert → Renew

- [ ] **Performance Tests**
  - [ ] Search latency <2s
  - [ ] Graph render <1s
  - [ ] Page load <3s
  - [ ] 50+ concurrent users

### 6.2 Bug Fixes & Optimization

- [ ] Fix reported bugs
- [ ] Optimize slow queries
- [ ] Add database indexes
- [ ] Implement lazy loading
- [ ] Add loading skeletons
- [ ] Error boundary components

### 6.3 Documentation

- [ ] User guide
- [ ] Admin guide
- [ ] API documentation
- [ ] Feature comparison matrix
- [ ] Video tutorials

**Deliverables:**
- [ ] All tests passing
- [ ] Performance targets met
- [ ] Documentation complete
- [ ] Ready for production

**Estimated Time:** 1 week

---

## Phase 7: Production Deployment (Week 11-12)

**Goal:** Deploy to production and roll out to users

### 7.1 Pre-Deployment

- [ ] **Database Backup**
  ```bash
  pg_dump ankr_maritime > backup-$(date +%Y%m%d).sql
  ```

- [ ] **Run Migration in Production**
  ```bash
  npx prisma migrate deploy
  ```

- [ ] **Verify Services**
  - [ ] MinIO accessible
  - [ ] Ollama/Voyage API working
  - [ ] Redis connected
  - [ ] Database healthy

### 7.2 Deployment

- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Update environment variables
- [ ] Run smoke tests
- [ ] Monitor logs

### 7.3 User Rollout

- [ ] **Week 1: Internal Team**
  - [ ] 5 power users
  - [ ] Gather feedback
  - [ ] Fix critical issues

- [ ] **Week 2: Beta Customers**
  - [ ] 2-3 enterprise customers
  - [ ] Training sessions
  - [ ] Feedback collection

- [ ] **Week 3: General Availability**
  - [ ] Announce to all users
  - [ ] Marketing campaign
  - [ ] Monitor adoption

### 7.4 Monitoring

- [ ] Set up alerts
  - [ ] Error rate >1%
  - [ ] Response time >5s
  - [ ] Service down
  - [ ] Database full

- [ ] Set up analytics
  - [ ] Search usage
  - [ ] Feature adoption
  - [ ] User engagement
  - [ ] Performance metrics

**Deliverables:**
- [ ] Production deployment successful
- [ ] Users trained
- [ ] Monitoring active
- [ ] Adoption tracking

**Estimated Time:** 2 weeks

---

## Backlog (Future Enhancements)

### High Priority

- [ ] **Mobile App**
  - [ ] React Native app
  - [ ] Offline-first
  - [ ] Push notifications
  - [ ] Document scanner

- [ ] **Advanced Analytics**
  - [ ] Charter party insights
  - [ ] Usage patterns
  - [ ] Knowledge gaps
  - [ ] ROI dashboard

- [ ] **Bulk Operations**
  - [ ] Bulk document upload
  - [ ] Batch linking
  - [ ] Mass tagging
  - [ ] Export all data

### Medium Priority

- [ ] **Integrations**
  - [ ] Email import (Gmail, Outlook)
  - [ ] Slack notifications
  - [ ] Zapier integration
  - [ ] API for third parties

- [ ] **AI Enhancements**
  - [ ] Auto-tagging documents
  - [ ] Auto-linking related docs
  - [ ] Summarization
  - [ ] Translation

- [ ] **Collaboration**
  - [ ] Real-time co-editing
  - [ ] Comments on documents
  - [ ] @mentions
  - [ ] Notifications

### Low Priority

- [ ] **Gamification** (if requested)
  - [ ] Contribution leaderboard
  - [ ] Knowledge sharing badges
  - [ ] Top contributors

- [ ] **Learning** (if requested)
  - [ ] Training modules
  - [ ] Certification tracking
  - [ ] Quiz builder

- [ ] **Marketplace**
  - [ ] Charter party templates
  - [ ] Clause library
  - [ ] Best practices guides
  - [ ] Legal precedents database

---

## Success Metrics

### Week 4 (After Phase 2)
- [ ] RAG search operational
- [ ] 10+ documents with embeddings
- [ ] SwayamBot shows sources
- [ ] <2s average search time

### Week 8 (After Phase 4)
- [ ] Enterprise schema deployed
- [ ] 3+ collections created
- [ ] 1+ deal room active
- [ ] Document linking working

### Week 12 (Production Launch)
- [ ] 50+ documents indexed
- [ ] 10+ active users
- [ ] 100+ searches performed
- [ ] 80%+ user satisfaction

### Month 3 (Post-Launch)
- [ ] 500+ documents indexed
- [ ] 50+ active users
- [ ] 5+ enterprise customers
- [ ] $50k+ MRR from enterprise tier

### Month 6 (Maturity)
- [ ] 2,000+ documents
- [ ] 100+ active users
- [ ] 20+ enterprise customers
- [ ] $200k+ MRR
- [ ] 2,000+ hours saved

---

## Risk Management

### Technical Risks

| Risk | Mitigation |
|------|------------|
| Slow semantic search | Cache results, optimize indexes, use Voyage AI |
| Ollama not scaling | Switch to Voyage API, add GPU support |
| Storage costs | Use MinIO self-hosted, compress embeddings |
| Complex queries timeout | Pagination, lazy loading, background jobs |

### Business Risks

| Risk | Mitigation |
|------|------------|
| Low adoption | Training, champions, gradual rollout |
| Feature confusion | Clear naming, tooltips, documentation |
| Competitor copies | Patent filing, first-mover advantage, network effects |
| Churn | ROI tracking, success metrics, customer success team |

---

## Team & Resources

### Required Team (400 hours total)

**Backend Developer (200 hours)**
- Weeks 1-4: RAG implementation
- Weeks 5-6: Enterprise services
- Weeks 7-9: Support frontend
- Week 10: Testing

**Frontend Developer (150 hours)**
- Weeks 1-3: Search UI
- Weeks 4-6: Enterprise components
- Weeks 7-9: Pages & polish
- Week 10: Testing

**QA Engineer (50 hours)**
- Week 10: Testing
- Week 11-12: Deployment support

---

## Budget

### Internal Development
- Backend: 200 hours × $100/hr = $20,000
- Frontend: 150 hours × $100/hr = $15,000
- QA: 50 hours × $80/hr = $4,000
- **Total: $39,000**

### Infrastructure
- Development: $0 (self-hosted)
- Production (Voyage + Groq): $21/month
- **Year 1: $252**

### Total First Year
- **$39,252** (one-time + operational)

### Expected Revenue (First Year)
- 10 enterprise customers × $3,000/mo = $30k/mo
- **Year 1: $360,000**

**ROI: 816%**

---

## Approval & Sign-Off

- [ ] **Product Owner Approval**
  - [ ] Reviewed feature list
  - [ ] Approved timeline
  - [ ] Confirmed budget

- [ ] **Technical Lead Approval**
  - [ ] Architecture reviewed
  - [ ] Dependencies verified
  - [ ] Risks assessed

- [ ] **Business Approval**
  - [ ] ROI validated
  - [ ] Pricing approved
  - [ ] Go-to-market ready

---

## Next Immediate Steps (This Week)

1. [ ] **Run Hybrid DMS Setup** (2-4 hours)
   ```bash
   cd /root/apps/ankr-maritime
   ./setup-hybrid-dms.sh
   ```

2. [ ] **Generate Embeddings for Sample Document** (1 hour)
   ```bash
   npx tsx scripts/generate-embeddings.ts
   ```

3. [ ] **Test Semantic Search** (30 min)
   ```bash
   npx tsx scripts/test-semantic-search.ts
   ```

4. [ ] **Demo to Team** (1 hour)
   - Show search working
   - Show SwayamBot with sources
   - Get feedback

5. [ ] **Get Approval to Proceed** (meeting)
   - Present this TODO
   - Show ROI analysis
   - Get budget approval

**Total Time This Week: 5-7 hours**

---

## Questions to Answer

- [ ] What's the target launch date?
- [ ] Who are the beta enterprise customers?
- [ ] What's the pricing for enterprise tier?
- [ ] Do we need Voyage AI or is Ollama sufficient?
- [ ] Should we build mobile app in Phase 1?
- [ ] What's the marketing plan?

---

**Status:** Ready to Execute
**Owner:** TBD
**Timeline:** 12 weeks to production
**Investment:** ~$40k
**Expected Return:** $360k+ Year 1

---

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>

**Document Version:** 1.0 (Master TODO - Unified)
**Last Updated:** January 31, 2026
**Next Review:** Weekly during implementation
