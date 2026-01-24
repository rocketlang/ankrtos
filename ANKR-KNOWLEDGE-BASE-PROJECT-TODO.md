# ANKR Knowledge Base & Code Creator - Complete TODO

**Vision:** Build an AI-powered knowledge system that learns from all ANKR code/docs and enables:
- Semantic search across all documentation and code
- Code generation based on existing patterns
- Teaching coding through the LMS
- Eventually: Custom mini-LLM trained on ANKR patterns

**Status:** 📋 Planning Phase
**Timeline:** TBD (after Fermi features complete)
**Priority:** HIGH (Future product differentiator)

---

## Project Scope Evolution

### Phase 1: Documentation RAG (MVP)
**Goal:** Semantic search over all .md documentation
**Timeline:** 2-3 days
**Dependencies:** None

### Phase 2: Code Indexing
**Goal:** Index and search all TypeScript/JavaScript code
**Timeline:** 4-5 days
**Dependencies:** Phase 1

### Phase 3: Code Generation
**Goal:** Generate new code based on existing patterns
**Timeline:** 1 week
**Dependencies:** Phase 2

### Phase 4: LMS Integration
**Goal:** Teach coding through ANKR LMS
**Timeline:** 1 week
**Dependencies:** Phase 3

### Phase 5: Custom Mini-LLM (Stretch Goal)
**Goal:** Train custom model on ANKR codebase
**Timeline:** TBD (research needed)
**Dependencies:** Phase 4

---

## Phase 1: Documentation RAG (MVP)

### Database Schema
- [ ] Create `knowledge_chunks` table in ankr_eon database
  ```sql
  CREATE TABLE knowledge_chunks (
    id UUID PRIMARY KEY,
    content TEXT NOT NULL,
    embedding vector(1536),
    source TEXT NOT NULL,
    type VARCHAR(50), -- 'documentation', 'code', 'github'
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  CREATE INDEX idx_knowledge_embedding ON knowledge_chunks
    USING ivfflat (embedding vector_cosine_ops);

  CREATE INDEX idx_knowledge_source ON knowledge_chunks (source);
  CREATE INDEX idx_knowledge_type ON knowledge_chunks (type);
  ```

- [ ] Create `knowledge_sources` table (track what's indexed)
  ```sql
  CREATE TABLE knowledge_sources (
    id UUID PRIMARY KEY,
    path TEXT NOT NULL UNIQUE,
    type VARCHAR(50),
    last_indexed TIMESTAMP,
    chunk_count INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending'
  );
  ```

### Backend Services

- [ ] **Document Chunker Service**
  - File: `packages/ankr-knowledge/src/services/chunker.ts`
  - Split documents into 512-token chunks
  - Preserve context (overlap 50 tokens)
  - Handle Markdown structure (headers, code blocks)
  - Support multiple formats (.md, .txt, .pdf)

- [ ] **Embedding Service**
  - File: `packages/ankr-knowledge/src/services/embeddings.ts`
  - Generate embeddings using Voyage AI or OpenAI
  - Batch processing (100 chunks at a time)
  - Cost tracking
  - Caching for duplicate content

- [ ] **Knowledge Indexer Service**
  - File: `packages/ankr-knowledge/src/services/indexer.ts`
  - Scan directories for .md files
  - Chunk documents
  - Generate embeddings
  - Store in pgvector
  - Track indexing status
  - Handle updates (re-index changed files)

- [ ] **Semantic Search Service**
  - File: `packages/ankr-knowledge/src/services/search.ts`
  - Query vector database
  - Hybrid search (vector + keyword)
  - Re-ranking results
  - Context extraction
  - Highlighted snippets

- [ ] **Document Crawler**
  - File: `packages/ankr-knowledge/src/services/crawler.ts`
  - Auto-discover .md files in /root
  - Watch for new files (file watcher)
  - Incremental indexing
  - Scheduled full re-index (weekly)

### API Endpoints (GraphQL)

- [ ] **Indexing Mutations**
  ```graphql
  type Mutation {
    indexDocuments(directory: String!): IndexResult!
    indexSingleFile(path: String!): IndexResult!
    reindexAll: IndexResult!
  }

  type IndexResult {
    success: Boolean!
    filesIndexed: Int!
    chunksCreated: Int!
    errors: [String!]
    duration: Float
  }
  ```

- [ ] **Search Queries**
  ```graphql
  type Query {
    searchKnowledge(
      query: String!
      type: KnowledgeType
      limit: Int = 10
    ): [KnowledgeResult!]!

    getKnowledgeSource(path: String!): KnowledgeSource
    listKnowledgeSources: [KnowledgeSource!]!
  }

  type KnowledgeResult {
    id: ID!
    content: String!
    source: String!
    type: KnowledgeType!
    similarity: Float!
    metadata: JSON
  }
  ```

### Frontend Components

- [ ] **Global Search Bar**
  - File: `packages/ankr-interact/src/components/KnowledgeSearch/GlobalSearchBar.tsx`
  - Keyboard shortcut (Cmd+K / Ctrl+K)
  - Auto-suggest as you type
  - Recent searches
  - Filter by type (docs, code, github)

- [ ] **Search Results Page**
  - File: `packages/ankr-interact/src/components/KnowledgeSearch/SearchResults.tsx`
  - Grid/list view
  - Similarity scores
  - Highlighted snippets
  - Click to open full document
  - "View in context" button

- [ ] **Knowledge Explorer**
  - File: `packages/ankr-interact/src/components/KnowledgeSearch/KnowledgeExplorer.tsx`
  - Browse indexed sources
  - Re-index button
  - Indexing status
  - Statistics (total chunks, sources, etc.)

### CLI Tools

- [ ] **ankr-knowledge CLI**
  - File: `packages/ankr-knowledge/src/cli.ts`
  - Commands:
    ```bash
    ankr-knowledge index <directory>    # Index documents
    ankr-knowledge search <query>       # Search from CLI
    ankr-knowledge status               # Indexing status
    ankr-knowledge reindex              # Full reindex
    ankr-knowledge stats                # Show statistics
    ```

### Testing

- [ ] Unit tests for chunker
- [ ] Unit tests for embeddings service
- [ ] Unit tests for search service
- [ ] Integration test: Index → Search → Retrieve
- [ ] Load test: 10,000 documents
- [ ] Accuracy test: Measure search quality

### Documentation

- [ ] README.md for ankr-knowledge package
- [ ] API documentation (GraphQL schema docs)
- [ ] Usage guide for developers
- [ ] Search tips for end users

---

## Phase 2: Code Indexing

### Code Parsing

- [ ] **TypeScript Parser**
  - File: `packages/ankr-knowledge/src/parsers/typescript-parser.ts`
  - Parse .ts/.tsx files using TypeScript Compiler API
  - Extract functions, classes, interfaces, types
  - Include JSDoc comments
  - Preserve file/line references

- [ ] **JavaScript Parser**
  - File: `packages/ankr-knowledge/src/parsers/javascript-parser.ts`
  - Parse .js/.jsx files
  - Handle ES6+ syntax
  - Extract exports

- [ ] **Code Chunker**
  - File: `packages/ankr-knowledge/src/services/code-chunker.ts`
  - Chunk by semantic unit (function/class)
  - Include surrounding context
  - Preserve imports

### GitHub Integration

- [ ] **GitHub Repo Crawler**
  - File: `packages/ankr-knowledge/src/services/github-crawler.ts`
  - Clone repos locally (or use GitHub API)
  - Scan all files
  - Track commit history
  - Incremental updates

- [ ] **Code Metadata Extractor**
  - File: `packages/ankr-knowledge/src/services/metadata-extractor.ts`
  - Extract package.json data
  - Identify framework (React, Fastify, etc.)
  - Map dependencies
  - Categorize by type (frontend, backend, etc.)

### Enhanced Search

- [ ] **Code-specific Search**
  - File: `packages/ankr-knowledge/src/services/code-search.ts`
  - Search by function name
  - Search by import/dependency
  - Filter by file extension
  - Filter by package

- [ ] **Symbol Search**
  - "Find all GraphQL resolvers"
  - "Find all React hooks"
  - "Find all Prisma models"

### UI Enhancements

- [ ] **Code Viewer Component**
  - Syntax highlighting
  - Line numbers
  - "Open in IDE" button
  - "Copy code" button

- [ ] **Code Search Filters**
  - Language filter
  - Package filter
  - File type filter
  - Date range

---

## Phase 3: Code Generation

### Pattern Recognition

- [ ] **Pattern Analyzer**
  - File: `packages/ankr-knowledge/src/services/pattern-analyzer.ts`
  - Identify common patterns in codebase
  - Extract component structures
  - Map GraphQL schema patterns
  - Detect React component patterns

- [ ] **Style Guide Extractor**
  - Analyze naming conventions
  - Detect file structure patterns
  - Extract TypeScript patterns
  - Build "ANKR style guide" automatically

### Code Generator

- [ ] **RAG-based Code Generator**
  - File: `packages/ankr-knowledge/src/services/code-generator.ts`
  - Search for similar code patterns
  - Build context from examples
  - Generate code using AI (GPT-4)
  - Validate generated code (TypeScript check)

- [ ] **Template Generator**
  - Generate from user prompt
  - Use RocketLang DSL integration
  - Support multiple templates:
    - React component
    - GraphQL resolver
    - Prisma model
    - API endpoint
    - Full feature (multi-file)

### Integration with OpenClaude IDE

- [ ] **Code Generation UI in IDE**
  - File: `packages/openclaude-ide/src/components/CodeGenerator.tsx`
  - Prompt input
  - Show similar patterns
  - Generate button
  - Preview generated code
  - Insert into editor

- [ ] **Code Suggestion Panel**
  - Suggest similar code while typing
  - "Generate from description" button
  - Auto-complete from codebase

---

## Phase 4: LMS Integration (Teaching Coding)

### Educational Features

- [ ] **Code Explanation Service**
  - File: `packages/ankr-lms/src/services/code-explainer.ts`
  - Explain code line-by-line
  - Interactive mode (click for explanation)
  - Use RAG to provide context
  - Generate quizzes from code

- [ ] **Practice Problem Generator**
  - File: `packages/ankr-lms/src/services/practice-generator.ts`
  - Generate coding challenges based on codebase
  - Different difficulty levels
  - Auto-grading
  - Solution hints from existing code

- [ ] **Coding Tutorial Generator**
  - File: `packages/ankr-lms/src/services/tutorial-generator.ts`
  - Generate step-by-step tutorials
  - Based on actual ANKR code
  - Interactive exercises
  - Progressive complexity

### UI Components

- [ ] **Code Learning Dashboard**
  - File: `packages/ankr-lms/src/components/CodeLearning/Dashboard.tsx`
  - Browse tutorials
  - Practice challenges
  - Progress tracking
  - Leaderboard

- [ ] **Interactive Code Editor**
  - File: `packages/ankr-lms/src/components/CodeLearning/InteractiveEditor.tsx`
  - Monaco editor
  - Run code in sandbox
  - Inline hints
  - Auto-grading

- [ ] **Code Tutor Chat**
  - File: `packages/ankr-lms/src/components/CodeLearning/CodeTutor.tsx`
  - Chat interface
  - Ask questions about code
  - Get explanations with examples from codebase
  - "Show me similar code" feature

### Curriculum Builder

- [ ] **Auto-generate Curriculum**
  - Analyze codebase complexity
  - Create learning paths
  - Beginner → Intermediate → Advanced
  - Based on actual ANKR tech stack

---

## Phase 5: Custom Mini-LLM (Stretch Goal)

### Research & Planning

- [ ] **Feasibility Study**
  - Research fine-tuning vs. training from scratch
  - Evaluate model sizes (1B, 3B, 7B parameters)
  - Cost analysis
  - Hardware requirements

- [ ] **Data Preparation**
  - Collect all ANKR code
  - Clean and format
  - Create training/validation splits
  - Generate synthetic examples

### Model Training

- [ ] **Fine-tune Existing Model**
  - Options: CodeLlama, StarCoder, Phi-2
  - Train on ANKR codebase
  - Optimize for ANKR patterns
  - Benchmark against GPT-4

- [ ] **Custom Tokenizer**
  - Build ANKR-specific tokenizer
  - Include common patterns
  - Optimize for TypeScript/React

### Deployment

- [ ] **Model Serving**
  - Deploy on local GPU server
  - API endpoint for inference
  - Fallback to cloud models
  - Cost tracking

- [ ] **Integration**
  - Replace OpenAI calls with local model
  - A/B testing vs cloud models
  - Monitor quality

---

## Infrastructure Requirements

### Database
- [ ] PostgreSQL with pgvector extension
- [ ] Redis for caching
- [ ] S3/MinIO for storing embeddings backup

### Compute
- [ ] Embedding generation server
- [ ] Search API server
- [ ] Optional: GPU for custom LLM

### Storage
- [ ] ~10GB for initial documentation embeddings
- [ ] ~100GB+ for full code indexing
- [ ] ~500GB+ for custom LLM (if Phase 5)

### Monitoring
- [ ] Track indexing progress
- [ ] Search analytics (popular queries)
- [ ] Embedding costs
- [ ] Response times

---

## Success Metrics

### Phase 1 (Documentation RAG)
- [ ] Index 1,000+ documents
- [ ] Search results < 500ms
- [ ] 90%+ relevance score

### Phase 2 (Code Indexing)
- [ ] Index all ANKR packages (~121 packages)
- [ ] Symbol search accuracy 95%+
- [ ] Find code in < 200ms

### Phase 3 (Code Generation)
- [ ] Generate working code 80%+ of time
- [ ] Code passes TypeScript check
- [ ] Follows ANKR patterns

### Phase 4 (LMS Integration)
- [ ] 100+ auto-generated tutorials
- [ ] Student completion rate 70%+
- [ ] Code explanation accuracy 90%+

### Phase 5 (Custom LLM)
- [ ] Match GPT-4 quality for ANKR code
- [ ] 10x cost reduction
- [ ] < 2 second inference time

---

## Risks & Mitigations

### Risk 1: Embedding Costs Too High
**Mitigation:**
- Use cheaper models (Voyage AI: $0.10/1M tokens vs OpenAI: $0.13/1M)
- Cache embeddings
- Incremental indexing only

### Risk 2: Search Quality Poor
**Mitigation:**
- Hybrid search (vector + keyword)
- Re-ranking with AI
- User feedback loop
- A/B testing different chunking strategies

### Risk 3: Code Generation Inaccurate
**Mitigation:**
- Start with simple templates
- Validate with TypeScript compiler
- Human review before commit
- Iterative improvement

### Risk 4: Custom LLM Too Expensive
**Mitigation:**
- Phase 5 is optional
- Use fine-tuning instead of training from scratch
- Start with small model (1B parameters)
- Measure ROI before scaling

---

## Competitive Analysis

### Similar Products

**Cursor / GitHub Copilot:**
- Pro: Code completion, chat
- Con: Generic (not your codebase)
- ANKR Advantage: Learns YOUR patterns

**Sourcegraph:**
- Pro: Code search across repos
- Con: Keyword-based, expensive
- ANKR Advantage: Semantic search, cheaper

**Replit Agent:**
- Pro: AI code generation
- Con: Generic templates
- ANKR Advantage: Based on your actual code

**Fermi.ai (for education):**
- Pro: AI tutoring
- Con: Generic curriculum
- ANKR Advantage: Teach coding using your codebase

---

## Business Value

### Internal Use (ANKR Team)
- **Developer Productivity:** Find code 10x faster
- **Code Consistency:** Generate code following patterns
- **Onboarding:** New devs learn from existing code
- **Documentation:** Auto-generated from code

### Product Offering (External)
- **ANKR LMS + Code Learning:** New revenue stream
- **Code Search SaaS:** Sell to other dev teams
- **Consulting:** "We'll build a knowledge base for your codebase"
- **White Label:** License to enterprises

### Pratham Use Case
- **Teacher Training:** Teach teachers to code
- **Student Coding Courses:** Learn to code with AI tutor
- **Curriculum Generation:** Auto-generate coding lessons
- **Job Readiness:** Students learn real-world patterns

---

## Timeline Estimate

**Phase 1 (Documentation RAG):** 2-3 days
**Phase 2 (Code Indexing):** 4-5 days
**Phase 3 (Code Generation):** 1 week
**Phase 4 (LMS Integration):** 1 week
**Phase 5 (Custom LLM):** TBD (research needed)

**Total (Phases 1-4):** ~3 weeks full-time

**Recommended Approach:**
- Build Phase 1 first (MVP)
- Demo to users, gather feedback
- Decide if Phase 2-5 are worth it based on usage

---

## Next Actions (After Fermi Features)

1. ✅ Complete Fermi Features 3/5 (in progress)
2. ✅ Publish all documentation
3. 📋 Review this TODO with team
4. 🚀 Start Phase 1: Documentation RAG
5. 🎯 Demo Phase 1 to Pratham on Monday
6. 📊 Gather feedback, decide on Phase 2+

---

## Project Name Ideas

- **ANKR Knowledge** (simple, clear)
- **ANKR Brain** (catchy, implies intelligence)
- **ANKR Codex** (sounds powerful)
- **ANKR Universe Search** (fits the ecosystem)
- **ANKR Omnisearch** (comprehensive)

**Recommended:** `@ankr/knowledge` (package name)

---

**Document Version:** 1.0
**Date:** 2026-01-25
**Status:** Planning phase, ready to execute after Fermi features
**Owner:** Captain Anil + Claude

**This is a LIVING document - will evolve as we build!**
