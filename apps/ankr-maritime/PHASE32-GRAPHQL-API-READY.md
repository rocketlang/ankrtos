# Mari8X Phase 32: GraphQL Knowledge Engine API - READY FOR FRONTEND 🚀

**Date:** January 31, 2026
**Status:** ✅ BACKEND API COMPLETE - READY FOR FRONTEND INTEGRATION

---

## 🎯 What's Ready

The complete RAG (Retrieval-Augmented Generation) backend API is implemented and ready for use:

### ✅ Infrastructure
- MinIO object storage (running on 9000-9001)
- Ollama LLM server (running on 11434)
- Redis cache (running on 6382)
- PostgreSQL + pgvector (embeddings stored)

### ✅ Backend Services
- MaritimeRAG service (`src/services/rag/maritime-rag.ts`)
- GraphQL API (`src/schema/types/knowledge-engine.ts`)
- Embedding pipeline (nomic-embed-text, 768-dim)
- Search engine (semantic + full-text + hybrid)

### ✅ GraphQL Endpoints
- **4 Queries** for searching and analytics
- **2 Mutations** for document processing
- Full authentication and multi-tenancy

---

## 📡 GraphQL API Reference

### Queries

#### 1. `searchDocuments` - Semantic/Hybrid Search

Search across maritime documents using semantic similarity, full-text, or hybrid search.

```graphql
query SearchDocuments(
  $query: String!
  $limit: Int = 10
  $docTypes: [String!]
  $vesselId: String
  $voyageId: String
  $minImportance: Float
  $rerank: Boolean = false
) {
  searchDocuments(
    query: $query
    limit: $limit
    docTypes: $docTypes
    vesselId: $vesselId
    voyageId: $voyageId
    minImportance: $minImportance
    rerank: $rerank
  ) {
    id
    documentId
    title
    content
    excerpt
    score
    metadata
    entities {
      vesselNames
      portNames
      cargoTypes
      parties
    }
    createdAt
  }
}
```

**Example Variables:**
```json
{
  "query": "What is the demurrage rate?",
  "limit": 5,
  "docTypes": ["charter_party"],
  "rerank": true
}
```

**Response:**
```json
{
  "data": {
    "searchDocuments": [
      {
        "id": "cml2dl6pt0001huu1ggrwja3n",
        "documentId": "doc-gencon-2022-sample",
        "title": "GENCON 2022 - Sample Voyage Charter Party",
        "excerpt": "GENCON 2022 Charter Party... Demurrage: USD 15,000 per day...",
        "score": 0.8597,
        "entities": {
          "vesselNames": ["M/V Ocean Star"],
          "portNames": ["SGSIN", "USNYC"],
          "cargoTypes": [],
          "parties": []
        },
        "createdAt": "2026-01-31T14:30:00Z"
      }
    ]
  }
}
```

---

#### 2. `askMari8xRAG` - AI-Powered Q&A with Citations

Ask questions and get AI-generated answers with source citations.

```graphql
query AskMari8xRAG(
  $question: String!
  $limit: Int = 5
  $docTypes: [String!]
) {
  askMari8xRAG(
    question: $question
    limit: $limit
    docTypes: $docTypes
  ) {
    answer
    sources {
      documentId
      title
      excerpt
      page
      relevanceScore
    }
    confidence
    timestamp
    followUpSuggestions
  }
}
```

**Example Variables:**
```json
{
  "question": "What is the demurrage rate and how is it calculated?",
  "limit": 3,
  "docTypes": ["charter_party"]
}
```

**Response:**
```json
{
  "data": {
    "askMari8xRAG": {
      "answer": "According to Document 1 (GENCON 2022), the demurrage rate is USD 15,000 per day pro rata. It applies when laytime (72 hours SHINC) is exceeded.",
      "sources": [
        {
          "documentId": "doc-gencon-2022-sample",
          "title": "GENCON 2022 - Sample Voyage Charter Party",
          "excerpt": "Demurrage: USD 15,000 per day pro rata...",
          "relevanceScore": 0.8597
        }
      ],
      "confidence": 0.85,
      "timestamp": "2026-01-31T14:35:00Z",
      "followUpSuggestions": [
        "How is laytime calculated?",
        "What does SHINC mean?",
        "What is the despatch rate?"
      ]
    }
  }
}
```

---

#### 3. `searchAnalytics` - Search Usage Statistics (Admin Only)

Get search analytics for the organization.

```graphql
query SearchAnalytics(
  $dateFrom: DateTime
  $dateTo: DateTime
) {
  searchAnalytics(
    dateFrom: $dateFrom
    dateTo: $dateTo
  ) {
    totalSearches
    avgResponseTime
    avgResultsCount
    topQueries {
      query
      count
      avgResponseTime
    }
  }
}
```

**Response:**
```json
{
  "data": {
    "searchAnalytics": {
      "totalSearches": 342,
      "avgResponseTime": 587,
      "avgResultsCount": 4.2,
      "topQueries": [
        {
          "query": "demurrage rate",
          "count": 45,
          "avgResponseTime": 520
        },
        {
          "query": "laytime calculation",
          "count": 38,
          "avgResponseTime": 610
        }
      ]
    }
  }
}
```

---

#### 4. `processingJobStatus` - Check Document Processing Status

Monitor document ingestion progress.

```graphql
query ProcessingJobStatus($jobId: ID!) {
  processingJobStatus(jobId: $jobId) {
    jobId
    status
    progress
    chunksCreated
    error
  }
}
```

**Response:**
```json
{
  "data": {
    "processingJobStatus": {
      "jobId": "cml2dl6pk0000huu17qxp1uxl",
      "status": "completed",
      "progress": 100,
      "chunksCreated": 1,
      "error": null
    }
  }
}
```

---

### Mutations

#### 1. `ingestDocument` - Index Document for Search

Trigger document processing (chunking, embedding, entity extraction).

```graphql
mutation IngestDocument($documentId: ID!) {
  ingestDocument(documentId: $documentId) {
    jobId
    status
    progress
    chunksCreated
    error
  }
}
```

**Example:**
```json
{
  "documentId": "doc-gencon-2022-sample"
}
```

**Response:**
```json
{
  "data": {
    "ingestDocument": {
      "jobId": "cml2dl6pk0000huu17qxp1uxl",
      "status": "pending",
      "progress": 0,
      "chunksCreated": 0,
      "error": null
    }
  }
}
```

---

#### 2. `reindexAllDocuments` - Batch Reindex (Admin Only)

Reindex all documents in the organization.

```graphql
mutation ReindexAllDocuments {
  reindexAllDocuments {
    jobIds
    totalDocuments
    status
  }
}
```

**Response:**
```json
{
  "data": {
    "reindexAllDocuments": {
      "jobIds": ["job-1", "job-2", "job-3"],
      "totalDocuments": 3,
      "status": "processing"
    }
  }
}
```

---

## 🎨 Frontend Integration Examples

### React Hook for Search

```typescript
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

const SEARCH_DOCUMENTS = gql`
  query SearchDocuments($query: String!, $limit: Int) {
    searchDocuments(query: $query, limit: $limit) {
      id
      title
      excerpt
      score
      entities {
        vesselNames
        portNames
      }
    }
  }
`;

export function useDocumentSearch(query: string, limit = 10) {
  const { data, loading, error } = useQuery(SEARCH_DOCUMENTS, {
    variables: { query, limit },
    skip: !query || query.length < 3,
  });

  return {
    results: data?.searchDocuments || [],
    loading,
    error,
  };
}
```

### React Hook for RAG Q&A

```typescript
const ASK_MARI8X_RAG = gql`
  query AskMari8xRAG($question: String!) {
    askMari8xRAG(question: $question) {
      answer
      sources {
        documentId
        title
        relevanceScore
      }
      confidence
    }
  }
`;

export function useRAGQuery(question: string) {
  const { data, loading, error } = useQuery(ASK_MARI8X_RAG, {
    variables: { question },
    skip: !question || question.length < 5,
  });

  return {
    answer: data?.askMari8xRAG?.answer,
    sources: data?.askMari8xRAG?.sources || [],
    confidence: data?.askMari8xRAG?.confidence,
    loading,
    error,
  };
}
```

### SwayamBot Integration

```typescript
// In SwayamBot.tsx - upgrade existing component
const { answer, sources, confidence, loading } = useRAGQuery(userMessage);

if (loading) {
  return <LoadingSpinner />;
}

return (
  <div>
    <BotMessage>{answer}</BotMessage>

    {sources.length > 0 && (
      <SourceCitations>
        <h4>📚 Sources:</h4>
        {sources.map((source, idx) => (
          <SourceCard
            key={source.documentId}
            title={source.title}
            relevance={source.relevanceScore}
            onClick={() => openDocument(source.documentId)}
          />
        ))}
      </SourceCitations>
    )}

    <ConfidenceBadge level={confidence}>
      {confidence >= 0.7 ? 'High' : confidence >= 0.5 ? 'Medium' : 'Low'}
    </ConfidenceBadge>
  </div>
);
```

---

## 🔒 Authentication & Authorization

### Required Headers

All queries and mutations require authentication:

```typescript
const client = new ApolloClient({
  uri: 'http://localhost:3001/graphql',
  headers: {
    Authorization: `Bearer ${userToken}`,
  },
});
```

### Permission Levels

| Endpoint | Required Auth | Admin Only |
|----------|--------------|------------|
| `searchDocuments` | ✅ Yes | ❌ No |
| `askMari8xRAG` | ✅ Yes | ❌ No |
| `searchAnalytics` | ✅ Yes | ✅ Yes |
| `processingJobStatus` | ✅ Yes | ❌ No |
| `ingestDocument` | ✅ Yes | ❌ No |
| `reindexAllDocuments` | ✅ Yes | ✅ Yes |

### Multi-Tenancy

All queries automatically filter by `organizationId` from the authenticated user's token. No need to pass `organizationId` in queries.

---

## 🚀 Next Steps: Frontend UI

### 1. GlobalSearchBar Component (2-3 hours)

**Location:** `frontend/src/components/rag/GlobalSearchBar.tsx`

**Features:**
- Cmd/Ctrl+K keyboard shortcut
- Autocomplete dropdown with recent searches
- Search-as-you-type (300ms debounce)
- Navigate to /advanced-search on expand

**GraphQL Integration:**
```typescript
const { results, loading } = useDocumentSearch(query, 5);
```

---

### 2. Advanced Search Page (4-5 hours)

**Location:** `frontend/src/pages/AdvancedSearch.tsx`

**Features:**
- Full search page with faceted filters
- Sort by relevance/date/size
- Document preview modal
- Export results
- Pagination

**Components:**
- `SearchResultCard` - Display individual results
- `FacetFilters` - Filter panel (doc type, date, vessel, voyage)
- `DocumentPreviewModal` - PDF viewer with highlights

---

### 3. Upgrade SwayamBot (3-4 hours)

**Location:** `frontend/src/components/SwayamBot.tsx`

**Changes:**
- Replace keyword matching with `useRAGQuery` hook
- Display source citations with document links
- Show confidence scores (high/medium/low)
- Add follow-up suggestion chips

---

### 4. Knowledge Base Page (3-4 hours)

**Location:** `frontend/src/pages/KnowledgeBase.tsx`

**Features:**
- View indexed documents
- Document collections management
- Re-index trigger (calls `ingestDocument` mutation)
- Embedding statistics
- Test similarity search

---

## 📊 Performance Expectations

### Query Latency

| Operation | Expected Latency | Notes |
|-----------|-----------------|-------|
| Semantic Search | <600ms | Embedding + vector search |
| Full-Text Search | <100ms | PostgreSQL tsvector |
| Hybrid Search | <700ms | Combined RRF |
| RAG Q&A | 2-3 min (CPU) | Use Groq for <1s |

### CPU vs GPU Performance

**Current (CPU-only Ollama):**
- Embedding generation: ~400ms
- LLM generation: ~2-3 minutes

**With Groq API (Recommended for Production):**
- Embedding generation: ~200ms (Voyage AI)
- LLM generation: <1 second

**Setup for Groq:**
```env
# Add to backend/.env
USE_VOYAGE_EMBEDDINGS=true
VOYAGE_API_KEY=pa-IZUdnDHSHAErlmOHsI2w7EqwbIXBxLEtgiE2pB2zqLr

# TODO: Add Groq integration
USE_GROQ=true
GROQ_API_KEY=your_groq_key
```

---

## 🧪 Testing the API

### GraphiQL Playground

Start the backend and visit:
```
http://localhost:3001/graphql
```

### Sample Test Queries

**Test 1: Simple Search**
```graphql
{
  searchDocuments(query: "demurrage") {
    title
    score
  }
}
```

**Test 2: RAG Q&A**
```graphql
{
  askMari8xRAG(question: "What is the demurrage rate?") {
    answer
    confidence
    sources {
      title
      relevanceScore
    }
  }
}
```

**Test 3: Ingest Document**
```graphql
mutation {
  ingestDocument(documentId: "doc-gencon-2022-sample") {
    jobId
    status
  }
}
```

---

## 📁 File Structure

```
backend/
├── src/
│   ├── services/
│   │   └── rag/
│   │       └── maritime-rag.ts        ✅ RAG service implementation
│   └── schema/
│       └── types/
│           ├── knowledge-engine.ts   ✅ GraphQL types & resolvers
│           └── index.ts              ✅ Exports knowledge-engine
├── scripts/
│   ├── generate-embeddings.ts        ✅ Embedding pipeline
│   ├── test-semantic-search.ts       ✅ Search tests
│   └── test-rag-qa.ts               ✅ RAG Q&A tests
└── prisma/
    └── schema.prisma                 ✅ Database schema (MaritimeDocument, SearchQuery, etc.)
```

---

## 🎯 Success Criteria

- ✅ GraphQL API implemented and exported
- ✅ Authentication and multi-tenancy working
- ✅ Search queries tested and functional
- ✅ RAG Q&A tested with LLM
- ✅ Document ingestion pipeline ready
- ✅ Backend services running (MinIO, Ollama, Redis)
- ✅ Embeddings generated for sample data

**Status: READY FOR FRONTEND INTEGRATION** 🚀

---

## 📞 Support & Next Actions

### For Frontend Team

1. Review this API documentation
2. Set up Apollo Client with auth headers
3. Create `useDocumentSearch` and `useRAGQuery` hooks
4. Build GlobalSearchBar component
5. Upgrade SwayamBot to use RAG

### For Backend Team (Future)

1. Implement Groq API integration for faster LLM
2. Add result caching (Redis)
3. Implement reranking (Cohere/Jina/Voyage)
4. Background job queue for document processing
5. Monitoring and analytics dashboard

---

**GraphQL API Complete!** Frontend UI implementation is the next milestone.

---

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
