# ANKR LMS + NotebookLM: Complete Enhancement Project

**Date:** January 26, 2026
**Status:** Implementation Ready
**Codename:** ANKR Notebook

---

## Executive Summary

This document outlines the complete project to add NotebookLM-style features to ANKR LMS, creating **ANKR Notebook** - a source-grounded AI learning platform that surpasses NotebookLM while leveraging ANKR's existing infrastructure.

### What We're Building

| Feature | NotebookLM | ANKR LMS Today | ANKR Notebook (Target) |
|---------|------------|----------------|------------------------|
| Personal Knowledge Base | ✅ | ❌ | ✅ |
| Multi-source Ingestion | ✅ YouTube, PDF, weblinks, docs | ⚠️ PDF only | ✅ All formats |
| Source-grounded Q&A | ✅ | ⚠️ Course-focused only | ✅ Any uploaded content |
| AI Slide Generator | ✅ | ❌ | ✅ |
| Audio Overviews | ✅ Podcast-style | ⚠️ Lesson podcasts only | ✅ Any content |
| Collaboration | ✅ | ❌ | ✅ |
| AI Tutor | ❌ | ✅ 4 personas | ✅ Enhanced |
| Quizzes & Assessment | ❌ | ✅ 8 question types | ✅ |
| Progress Tracking | ❌ | ✅ | ✅ |
| Certifications | ❌ | ✅ | ✅ |
| Offline-first | ❌ | ⚠️ Planned | ✅ |
| Indian Languages | ❌ | ✅ 22 languages | ✅ |

---

## Part 1: Architecture Deep Dive

### 1.1 Current ANKR LMS Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                     ANKR LMS Architecture                        │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (ankr-interact)                                        │
│  ├── React 19 + Vite + Tailwind                                 │
│  ├── TutorChat component                                        │
│  ├── QuizRenderer                                               │
│  └── VideoLessonPage with podcasts                              │
├─────────────────────────────────────────────────────────────────┤
│  Backend (ankr-interact/server)                                  │
│  ├── Fastify + Mercurius GraphQL                                │
│  ├── AITutorService → AI_PROXY_URL (localhost:4444)             │
│  ├── podcast-routes.ts → EdgeTTS                                │
│  └── lms-auth.ts → OAuth + RBAC                                 │
├─────────────────────────────────────────────────────────────────┤
│  Core Packages                                                   │
│  ├── @ankr/learning (CourseService, QuizService, ProgressService)│
│  ├── @ankr/eon (RAGRetriever, HybridSearch, Reranker)           │
│  ├── @ankr/ai-router (15 LLM providers)                         │
│  └── @ankr/voice (Sarvam TTS/STT for Indian languages)          │
├─────────────────────────────────────────────────────────────────┤
│  Data Layer                                                      │
│  ├── PostgreSQL + pgvector                                       │
│  ├── Redis (embedding cache)                                     │
│  └── In-memory storage (services default)                        │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Target ANKR Notebook Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                    ANKR Notebook Architecture                    │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (ankr-interact)                                        │
│  ├── NotebookPage (NEW)                                         │
│  │   ├── SourcePanel (upload, YouTube, weblinks)                │
│  │   ├── ChatPanel (source-grounded Q&A)                        │
│  │   ├── AudioPanel (podcast generation)                        │
│  │   └── SlidesPanel (presentation generation)                  │
│  ├── CollaborationOverlay (NEW)                                 │
│  └── Existing: TutorChat, QuizRenderer, VideoLessonPage         │
├─────────────────────────────────────────────────────────────────┤
│  Backend (ankr-interact/server)                                  │
│  ├── notebook-routes.ts (NEW)                                   │
│  │   ├── POST /api/notebook/create                              │
│  │   ├── POST /api/notebook/:id/sources                         │
│  │   ├── POST /api/notebook/:id/chat                            │
│  │   ├── POST /api/notebook/:id/slides                          │
│  │   └── POST /api/notebook/:id/audio-overview                  │
│  ├── source-ingestion.ts (NEW)                                  │
│  │   ├── YouTubeTranscriptIngester                              │
│  │   ├── WebPageIngester                                        │
│  │   ├── PDFIngester (enhanced)                                 │
│  │   └── MarkdownIngester                                       │
│  └── collaboration-service.ts (NEW)                             │
├─────────────────────────────────────────────────────────────────┤
│  Core Packages                                                   │
│  ├── @ankr/notebook (NEW)                                       │
│  │   ├── NotebookService                                        │
│  │   ├── SourceService                                          │
│  │   ├── SlideGenerator                                         │
│  │   └── AudioOverviewGenerator                                 │
│  ├── @ankr/learning (existing, enhanced)                        │
│  ├── @ankr/eon (existing - RAGRetriever)                        │
│  └── @ankr/quick-capture (planned)                              │
├─────────────────────────────────────────────────────────────────┤
│  Data Layer                                                      │
│  ├── PostgreSQL + pgvector                                       │
│  │   ├── notebooks table (NEW)                                  │
│  │   ├── notebook_sources table (NEW)                           │
│  │   └── notebook_chunks table (NEW - vectors)                  │
│  ├── Redis (embedding cache + collaboration)                     │
│  └── S3/Local (audio files, slides)                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 2: Database Schema

### 2.1 New Tables for ANKR Notebook

```sql
-- Notebooks (personal knowledge bases)
CREATE TABLE notebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Settings
  language VARCHAR(10) DEFAULT 'en',
  is_public BOOLEAN DEFAULT false,

  -- Collaboration
  collaborators JSONB DEFAULT '[]',
  -- [{ userId: 'xxx', role: 'viewer' | 'editor' | 'admin', addedAt: timestamp }]

  -- Metadata
  source_count INTEGER DEFAULT 0,
  chunk_count INTEGER DEFAULT 0,
  last_queried_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sources (documents, videos, webpages added to notebook)
CREATE TABLE notebook_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id UUID NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,

  -- Source info
  source_type VARCHAR(50) NOT NULL, -- 'pdf', 'youtube', 'webpage', 'markdown', 'google_doc', 'text'
  title VARCHAR(500) NOT NULL,
  original_url TEXT,
  file_path TEXT,

  -- Content
  raw_content TEXT,
  content_length INTEGER,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  -- For YouTube: { videoId, channelName, duration, thumbnailUrl }
  -- For PDF: { pageCount, author, isbn }
  -- For webpage: { domain, description, ogImage }

  -- Processing status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'ready', 'failed'
  chunk_count INTEGER DEFAULT 0,
  error_message TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

-- Chunks (vectorized content for RAG)
CREATE TABLE notebook_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id UUID NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES notebook_sources(id) ON DELETE CASCADE,

  -- Content
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,

  -- Vector embedding (1536 dimensions for Voyage/OpenAI)
  embedding vector(1536),

  -- Metadata for retrieval
  metadata JSONB DEFAULT '{}',
  -- { startChar, endChar, pageNumber, timestamp (for video) }

  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for vector similarity search
CREATE INDEX idx_notebook_chunks_embedding ON notebook_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Index for full-text search
CREATE INDEX idx_notebook_chunks_content ON notebook_chunks
  USING gin(to_tsvector('english', content));

-- Generated outputs (slides, audio)
CREATE TABLE notebook_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id UUID NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,

  output_type VARCHAR(50) NOT NULL, -- 'slides', 'audio_overview', 'summary', 'quiz'
  title VARCHAR(255),

  -- Content
  content JSONB, -- For slides: { slides: [...] }
  file_path TEXT, -- For audio: '/outputs/audio/xxx.mp3'
  file_size INTEGER,
  duration INTEGER, -- For audio, in seconds

  -- Generation settings
  settings JSONB DEFAULT '{}',
  -- { language, voice, slideCount, style }

  created_at TIMESTAMP DEFAULT NOW()
);

-- Chat history within notebooks
CREATE TABLE notebook_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id UUID NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),

  -- Messages
  messages JSONB DEFAULT '[]',
  -- [{ role: 'user'|'assistant', content: '', sources: [], timestamp }]

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2.2 Prisma Schema Addition

```prisma
// Add to existing schema.prisma

model Notebook {
  id            String   @id @default(uuid())
  userId        String   @map("user_id")
  title         String   @db.VarChar(255)
  description   String?  @db.Text

  language      String   @default("en") @db.VarChar(10)
  isPublic      Boolean  @default(false) @map("is_public")
  collaborators Json     @default("[]")

  sourceCount   Int      @default(0) @map("source_count")
  chunkCount    Int      @default(0) @map("chunk_count")
  lastQueriedAt DateTime? @map("last_queried_at")

  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // Relations
  user          User     @relation(fields: [userId], references: [id])
  sources       NotebookSource[]
  chunks        NotebookChunk[]
  outputs       NotebookOutput[]
  conversations NotebookConversation[]

  @@map("notebooks")
}

model NotebookSource {
  id            String   @id @default(uuid())
  notebookId    String   @map("notebook_id")

  sourceType    String   @map("source_type") @db.VarChar(50)
  title         String   @db.VarChar(500)
  originalUrl   String?  @map("original_url") @db.Text
  filePath      String?  @map("file_path") @db.Text

  rawContent    String?  @map("raw_content") @db.Text
  contentLength Int?     @map("content_length")

  metadata      Json     @default("{}")

  status        String   @default("pending") @db.VarChar(50)
  chunkCount    Int      @default(0) @map("chunk_count")
  errorMessage  String?  @map("error_message") @db.Text

  createdAt     DateTime @default(now()) @map("created_at")
  processedAt   DateTime? @map("processed_at")

  // Relations
  notebook      Notebook @relation(fields: [notebookId], references: [id], onDelete: Cascade)
  chunks        NotebookChunk[]

  @@map("notebook_sources")
}

model NotebookChunk {
  id          String   @id @default(uuid())
  notebookId  String   @map("notebook_id")
  sourceId    String   @map("source_id")

  content     String   @db.Text
  chunkIndex  Int      @map("chunk_index")

  embedding   Unsupported("vector(1536)")?

  metadata    Json     @default("{}")

  createdAt   DateTime @default(now()) @map("created_at")

  // Relations
  notebook    Notebook       @relation(fields: [notebookId], references: [id], onDelete: Cascade)
  source      NotebookSource @relation(fields: [sourceId], references: [id], onDelete: Cascade)

  @@map("notebook_chunks")
}

model NotebookOutput {
  id          String   @id @default(uuid())
  notebookId  String   @map("notebook_id")

  outputType  String   @map("output_type") @db.VarChar(50)
  title       String?  @db.VarChar(255)

  content     Json?
  filePath    String?  @map("file_path") @db.Text
  fileSize    Int?     @map("file_size")
  duration    Int?

  settings    Json     @default("{}")

  createdAt   DateTime @default(now()) @map("created_at")

  // Relations
  notebook    Notebook @relation(fields: [notebookId], references: [id], onDelete: Cascade)

  @@map("notebook_outputs")
}

model NotebookConversation {
  id          String   @id @default(uuid())
  notebookId  String   @map("notebook_id")
  userId      String   @map("user_id")

  messages    Json     @default("[]")

  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  notebook    Notebook @relation(fields: [notebookId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id])

  @@map("notebook_conversations")
}
```

---

## Part 3: Core Services Implementation

### 3.1 NotebookService

```typescript
// packages/ankr-notebook/src/services/NotebookService.ts

import { nanoid } from 'nanoid';
import { PrismaClient } from '@prisma/client';
import { RAGRetriever, createRAG } from '@ankr/eon';
import { AIRouter } from '@ankr/ai-router';

export interface CreateNotebookInput {
  userId: string;
  title: string;
  description?: string;
  language?: string;
}

export interface NotebookWithSources {
  id: string;
  title: string;
  description: string | null;
  sourceCount: number;
  sources: {
    id: string;
    title: string;
    sourceType: string;
    status: string;
  }[];
}

export class NotebookService {
  private prisma: PrismaClient;
  private rag: RAGRetriever;
  private llm: AIRouter;

  constructor(prisma: PrismaClient, rag: RAGRetriever, llm: AIRouter) {
    this.prisma = prisma;
    this.rag = rag;
    this.llm = llm;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTEBOOK CRUD
  // ═══════════════════════════════════════════════════════════════════════════

  async create(input: CreateNotebookInput): Promise<Notebook> {
    return this.prisma.notebook.create({
      data: {
        id: nanoid(),
        userId: input.userId,
        title: input.title,
        description: input.description,
        language: input.language || 'en',
      },
    });
  }

  async getById(id: string, userId: string): Promise<NotebookWithSources | null> {
    const notebook = await this.prisma.notebook.findFirst({
      where: {
        id,
        OR: [
          { userId },
          { collaborators: { path: ['$[*].userId'], array_contains: userId } },
          { isPublic: true },
        ],
      },
      include: {
        sources: {
          select: {
            id: true,
            title: true,
            sourceType: true,
            status: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return notebook;
  }

  async list(userId: string): Promise<Notebook[]> {
    return this.prisma.notebook.findMany({
      where: {
        OR: [
          { userId },
          { collaborators: { path: ['$[*].userId'], array_contains: userId } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const notebook = await this.prisma.notebook.findFirst({
      where: { id, userId },
    });

    if (!notebook) return false;

    await this.prisma.notebook.delete({ where: { id } });
    return true;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SOURCE-GROUNDED Q&A (The core NotebookLM feature)
  // ═══════════════════════════════════════════════════════════════════════════

  async chat(
    notebookId: string,
    userId: string,
    message: string,
    conversationId?: string
  ): Promise<{
    response: string;
    sources: Array<{ id: string; title: string; excerpt: string; relevance: number }>;
    conversationId: string;
  }> {
    // 1. Retrieve relevant chunks from this notebook only
    const retrieval = await this.rag.retrieve(message, {
      limit: 10,
      rerank: true,
      rerankTopK: 5,
      filters: { notebookId },
    });

    // 2. Build context from retrieved chunks
    const context = retrieval.chunks
      .map((chunk, i) => `[Source ${i + 1}]: ${chunk.content}`)
      .join('\n\n');

    // 3. Get or create conversation
    let conversation = conversationId
      ? await this.prisma.notebookConversation.findUnique({
          where: { id: conversationId },
        })
      : null;

    if (!conversation) {
      conversation = await this.prisma.notebookConversation.create({
        data: {
          id: nanoid(),
          notebookId,
          userId,
          messages: [],
        },
      });
    }

    const previousMessages = (conversation.messages as any[]).slice(-6);

    // 4. Generate response with LLM
    const systemPrompt = `You are a helpful AI assistant that answers questions based ONLY on the provided sources.
If the answer cannot be found in the sources, say so clearly.
Always cite which source(s) your answer is based on using [Source N] notation.
Be concise but thorough.`;

    const userPrompt = `Based on the following sources from the user's notebook:

${context}

User's question: ${message}

Provide a helpful answer based ONLY on these sources. Cite your sources.`;

    const response = await this.llm.complete({
      messages: [
        { role: 'system', content: systemPrompt },
        ...previousMessages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const assistantMessage = response.content;

    // 5. Save conversation
    const updatedMessages = [
      ...previousMessages,
      { role: 'user', content: message, timestamp: new Date() },
      {
        role: 'assistant',
        content: assistantMessage,
        sources: retrieval.chunks.map((c) => c.sourceId),
        timestamp: new Date(),
      },
    ];

    await this.prisma.notebookConversation.update({
      where: { id: conversation.id },
      data: { messages: updatedMessages },
    });

    // 6. Update notebook last queried
    await this.prisma.notebook.update({
      where: { id: notebookId },
      data: { lastQueriedAt: new Date() },
    });

    // 7. Format sources for response
    const sources = await Promise.all(
      retrieval.chunks.slice(0, 5).map(async (chunk) => {
        const source = await this.prisma.notebookSource.findUnique({
          where: { id: chunk.sourceId },
          select: { id: true, title: true },
        });
        return {
          id: chunk.sourceId,
          title: source?.title || 'Unknown',
          excerpt: chunk.content.slice(0, 200) + '...',
          relevance: chunk.scores.rerankScore || chunk.scores.rrfScore,
        };
      })
    );

    return {
      response: assistantMessage,
      sources,
      conversationId: conversation.id,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COLLABORATION
  // ═══════════════════════════════════════════════════════════════════════════

  async addCollaborator(
    notebookId: string,
    ownerId: string,
    collaboratorId: string,
    role: 'viewer' | 'editor' | 'admin'
  ): Promise<boolean> {
    const notebook = await this.prisma.notebook.findFirst({
      where: { id: notebookId, userId: ownerId },
    });

    if (!notebook) return false;

    const collaborators = (notebook.collaborators as any[]) || [];
    const existing = collaborators.find((c) => c.userId === collaboratorId);

    if (existing) {
      existing.role = role;
    } else {
      collaborators.push({
        userId: collaboratorId,
        role,
        addedAt: new Date(),
      });
    }

    await this.prisma.notebook.update({
      where: { id: notebookId },
      data: { collaborators },
    });

    return true;
  }

  async removeCollaborator(
    notebookId: string,
    ownerId: string,
    collaboratorId: string
  ): Promise<boolean> {
    const notebook = await this.prisma.notebook.findFirst({
      where: { id: notebookId, userId: ownerId },
    });

    if (!notebook) return false;

    const collaborators = (notebook.collaborators as any[]).filter(
      (c) => c.userId !== collaboratorId
    );

    await this.prisma.notebook.update({
      where: { id: notebookId },
      data: { collaborators },
    });

    return true;
  }
}
```

### 3.2 SourceIngestionService

```typescript
// packages/ankr-notebook/src/services/SourceIngestionService.ts

import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';
import { VoyageEmbedding } from '@ankr/eon';
import * as pdfParse from 'pdf-parse';
import { YoutubeTranscript } from 'youtube-transcript';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

export type SourceType = 'pdf' | 'youtube' | 'webpage' | 'markdown' | 'text' | 'google_doc';

export interface IngestSourceInput {
  notebookId: string;
  sourceType: SourceType;
  title?: string;
  url?: string;
  content?: string;
  file?: Buffer;
}

export interface IngestResult {
  sourceId: string;
  title: string;
  chunkCount: number;
  status: 'ready' | 'failed';
  error?: string;
}

export class SourceIngestionService {
  private prisma: PrismaClient;
  private embedder: VoyageEmbedding;
  private chunkSize: number = 1000;
  private chunkOverlap: number = 200;

  constructor(prisma: PrismaClient, voyageApiKey: string) {
    this.prisma = prisma;
    this.embedder = new VoyageEmbedding(voyageApiKey);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN INGESTION PIPELINE
  // ═══════════════════════════════════════════════════════════════════════════

  async ingest(input: IngestSourceInput): Promise<IngestResult> {
    // 1. Create source record
    const source = await this.prisma.notebookSource.create({
      data: {
        id: nanoid(),
        notebookId: input.notebookId,
        sourceType: input.sourceType,
        title: input.title || 'Untitled',
        originalUrl: input.url,
        status: 'processing',
      },
    });

    try {
      // 2. Extract content based on source type
      let content: string;
      let metadata: Record<string, any> = {};

      switch (input.sourceType) {
        case 'youtube':
          const ytResult = await this.extractYouTube(input.url!);
          content = ytResult.content;
          metadata = ytResult.metadata;
          break;

        case 'webpage':
          const webResult = await this.extractWebpage(input.url!);
          content = webResult.content;
          metadata = webResult.metadata;
          break;

        case 'pdf':
          const pdfResult = await this.extractPDF(input.file!);
          content = pdfResult.content;
          metadata = pdfResult.metadata;
          break;

        case 'markdown':
        case 'text':
          content = input.content || '';
          break;

        default:
          throw new Error(`Unsupported source type: ${input.sourceType}`);
      }

      // 3. Update source with extracted content
      const title = input.title || metadata.title || 'Untitled';
      await this.prisma.notebookSource.update({
        where: { id: source.id },
        data: {
          title,
          rawContent: content,
          contentLength: content.length,
          metadata,
        },
      });

      // 4. Chunk the content
      const chunks = this.chunkContent(content);

      // 5. Generate embeddings for all chunks
      const embeddings = await this.embedder.embedBatch(chunks);

      // 6. Store chunks with embeddings
      await this.prisma.$transaction(
        chunks.map((chunkContent, index) =>
          this.prisma.$executeRaw`
            INSERT INTO notebook_chunks (id, notebook_id, source_id, content, chunk_index, embedding, metadata, created_at)
            VALUES (
              ${nanoid()},
              ${input.notebookId},
              ${source.id},
              ${chunkContent},
              ${index},
              ${embeddings[index]}::vector,
              ${{}}::jsonb,
              NOW()
            )
          `
        )
      );

      // 7. Update source and notebook counts
      await this.prisma.notebookSource.update({
        where: { id: source.id },
        data: {
          status: 'ready',
          chunkCount: chunks.length,
          processedAt: new Date(),
        },
      });

      await this.prisma.notebook.update({
        where: { id: input.notebookId },
        data: {
          sourceCount: { increment: 1 },
          chunkCount: { increment: chunks.length },
        },
      });

      return {
        sourceId: source.id,
        title,
        chunkCount: chunks.length,
        status: 'ready',
      };
    } catch (error: any) {
      // Update source with error
      await this.prisma.notebookSource.update({
        where: { id: source.id },
        data: {
          status: 'failed',
          errorMessage: error.message,
        },
      });

      return {
        sourceId: source.id,
        title: input.title || 'Failed',
        chunkCount: 0,
        status: 'failed',
        error: error.message,
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXTRACTORS
  // ═══════════════════════════════════════════════════════════════════════════

  private async extractYouTube(url: string): Promise<{
    content: string;
    metadata: Record<string, any>;
  }> {
    // Extract video ID
    const videoIdMatch = url.match(/(?:v=|\/)([\w-]{11})(?:\?|&|$)/);
    if (!videoIdMatch) throw new Error('Invalid YouTube URL');
    const videoId = videoIdMatch[1];

    // Get transcript
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    const content = transcript.map((t) => t.text).join(' ');

    // Get video metadata via oEmbed
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oembedUrl);
    const videoMeta = await response.json();

    return {
      content,
      metadata: {
        videoId,
        title: videoMeta.title,
        channelName: videoMeta.author_name,
        thumbnailUrl: videoMeta.thumbnail_url,
        transcriptSegments: transcript.length,
      },
    };
  }

  private async extractWebpage(url: string): Promise<{
    content: string;
    metadata: Record<string, any>;
  }> {
    const response = await fetch(url);
    const html = await response.text();

    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) throw new Error('Could not parse webpage content');

    return {
      content: article.textContent,
      metadata: {
        title: article.title,
        byline: article.byline,
        siteName: article.siteName,
        excerpt: article.excerpt,
        length: article.length,
      },
    };
  }

  private async extractPDF(file: Buffer): Promise<{
    content: string;
    metadata: Record<string, any>;
  }> {
    const data = await pdfParse(file);

    return {
      content: data.text,
      metadata: {
        pageCount: data.numpages,
        info: data.info,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CHUNKING
  // ═══════════════════════════════════════════════════════════════════════════

  private chunkContent(content: string): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < content.length) {
      let end = start + this.chunkSize;

      // Try to break at sentence boundary
      if (end < content.length) {
        const lastPeriod = content.lastIndexOf('.', end);
        if (lastPeriod > start + this.chunkSize / 2) {
          end = lastPeriod + 1;
        }
      }

      chunks.push(content.slice(start, end).trim());
      start = end - this.chunkOverlap;
    }

    return chunks.filter((c) => c.length > 50); // Filter out tiny chunks
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SOURCE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  async deleteSource(sourceId: string, notebookId: string): Promise<boolean> {
    const source = await this.prisma.notebookSource.findFirst({
      where: { id: sourceId, notebookId },
    });

    if (!source) return false;

    // Delete source (cascades to chunks)
    await this.prisma.notebookSource.delete({ where: { id: sourceId } });

    // Update notebook counts
    await this.prisma.notebook.update({
      where: { id: notebookId },
      data: {
        sourceCount: { decrement: 1 },
        chunkCount: { decrement: source.chunkCount },
      },
    });

    return true;
  }
}
```

### 3.3 SlideGeneratorService

```typescript
// packages/ankr-notebook/src/services/SlideGeneratorService.ts

import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';
import { RAGRetriever } from '@ankr/eon';
import { AIRouter } from '@ankr/ai-router';

export interface SlideGenerationInput {
  notebookId: string;
  userId: string;
  title?: string;
  slideCount?: number;
  style?: 'professional' | 'casual' | 'academic' | 'minimal';
  language?: string;
  focusTopics?: string[];
  customPrompt?: string;
}

export interface Slide {
  id: string;
  type: 'title' | 'content' | 'bullets' | 'image' | 'quote' | 'summary';
  title: string;
  content: string;
  bullets?: string[];
  notes?: string;
  sourceRefs?: string[];
}

export interface SlidePresentation {
  id: string;
  title: string;
  slides: Slide[];
  metadata: {
    slideCount: number;
    generatedAt: Date;
    sourcesUsed: number;
  };
}

export class SlideGeneratorService {
  private prisma: PrismaClient;
  private rag: RAGRetriever;
  private llm: AIRouter;

  constructor(prisma: PrismaClient, rag: RAGRetriever, llm: AIRouter) {
    this.prisma = prisma;
    this.rag = rag;
    this.llm = llm;
  }

  async generate(input: SlideGenerationInput): Promise<SlidePresentation> {
    const notebook = await this.prisma.notebook.findUnique({
      where: { id: input.notebookId },
      include: { sources: { where: { status: 'ready' } } },
    });

    if (!notebook) throw new Error('Notebook not found');

    // 1. Retrieve key content from notebook
    const query = input.focusTopics?.join(' ') || 'main topics and key points';
    const retrieval = await this.rag.retrieve(query, {
      limit: 20,
      rerank: true,
      rerankTopK: 15,
      filters: { notebookId: input.notebookId },
    });

    // 2. Build context from retrieved content
    const context = retrieval.chunks.map((c) => c.content).join('\n\n---\n\n');

    // 3. Generate slide structure with LLM
    const slideCount = input.slideCount || 10;
    const style = input.style || 'professional';

    const systemPrompt = `You are an expert presentation designer. Create clear, engaging slides based on source material.
Style: ${style}
Language: ${input.language || 'English'}
Output format: JSON array of slide objects.`;

    const userPrompt = `Based on the following source content, create a ${slideCount}-slide presentation${input.title ? ` titled "${input.title}"` : ''}.

Source content:
${context}

${input.customPrompt ? `Additional instructions: ${input.customPrompt}` : ''}

Generate a JSON array with exactly ${slideCount} slides. Each slide should have:
- id: unique string
- type: 'title' | 'content' | 'bullets' | 'quote' | 'summary'
- title: slide title
- content: main text content
- bullets: array of bullet points (for bullet slides)
- notes: speaker notes
- sourceRefs: array of source references used

Return ONLY valid JSON, no markdown formatting.`;

    const response = await this.llm.complete({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    // 4. Parse and validate slides
    let slides: Slide[];
    try {
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('No JSON array found in response');
      slides = JSON.parse(jsonMatch[0]);
    } catch (error) {
      throw new Error('Failed to parse slide structure from LLM response');
    }

    // 5. Ensure first slide is title slide
    if (slides[0]?.type !== 'title') {
      slides.unshift({
        id: nanoid(),
        type: 'title',
        title: input.title || notebook.title,
        content: `Based on ${notebook.sources.length} sources`,
      });
    }

    // 6. Ensure last slide is summary
    if (slides[slides.length - 1]?.type !== 'summary') {
      slides.push({
        id: nanoid(),
        type: 'summary',
        title: 'Summary',
        content: 'Key takeaways from this presentation',
        bullets: slides
          .filter((s) => s.type === 'bullets')
          .flatMap((s) => s.bullets || [])
          .slice(0, 5),
      });
    }

    // 7. Save to database
    const presentation: SlidePresentation = {
      id: nanoid(),
      title: input.title || notebook.title,
      slides,
      metadata: {
        slideCount: slides.length,
        generatedAt: new Date(),
        sourcesUsed: retrieval.chunks.length,
      },
    };

    await this.prisma.notebookOutput.create({
      data: {
        id: presentation.id,
        notebookId: input.notebookId,
        outputType: 'slides',
        title: presentation.title,
        content: presentation as any,
        settings: {
          style: input.style,
          language: input.language,
          focusTopics: input.focusTopics,
        },
      },
    });

    return presentation;
  }

  async exportToHTML(presentationId: string): Promise<string> {
    const output = await this.prisma.notebookOutput.findUnique({
      where: { id: presentationId },
    });

    if (!output || output.outputType !== 'slides') {
      throw new Error('Presentation not found');
    }

    const presentation = output.content as unknown as SlidePresentation;

    // Generate reveal.js HTML
    const slidesHtml = presentation.slides
      .map(
        (slide) => `
        <section>
          <h2>${slide.title}</h2>
          ${slide.content ? `<p>${slide.content}</p>` : ''}
          ${
            slide.bullets
              ? `<ul>${slide.bullets.map((b) => `<li>${b}</li>`).join('')}</ul>`
              : ''
          }
          ${slide.notes ? `<aside class="notes">${slide.notes}</aside>` : ''}
        </section>
      `
      )
      .join('\n');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${presentation.title}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4/dist/reveal.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4/dist/theme/white.css">
</head>
<body>
  <div class="reveal">
    <div class="slides">
      ${slidesHtml}
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/reveal.js@4/dist/reveal.js"></script>
  <script>Reveal.initialize();</script>
</body>
</html>`;
  }
}
```

### 3.4 AudioOverviewService

```typescript
// packages/ankr-notebook/src/services/AudioOverviewService.ts

import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';
import { RAGRetriever } from '@ankr/eon';
import { AIRouter } from '@ankr/ai-router';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export interface AudioOverviewInput {
  notebookId: string;
  userId: string;
  style?: 'podcast' | 'lecture' | 'summary' | 'conversational';
  duration?: 'short' | 'medium' | 'long'; // 2-3min, 5-7min, 10-15min
  language?: string;
  voices?: {
    host: string;
    cohost?: string;
  };
  focusTopics?: string[];
}

export interface AudioOverviewResult {
  id: string;
  title: string;
  audioUrl: string;
  duration: number;
  transcript: string;
}

export class AudioOverviewService {
  private prisma: PrismaClient;
  private rag: RAGRetriever;
  private llm: AIRouter;
  private audioDir: string;

  constructor(prisma: PrismaClient, rag: RAGRetriever, llm: AIRouter) {
    this.prisma = prisma;
    this.rag = rag;
    this.llm = llm;
    this.audioDir = path.join(process.cwd(), 'public', 'audio-overviews');
  }

  async generate(input: AudioOverviewInput): Promise<AudioOverviewResult> {
    await mkdir(this.audioDir, { recursive: true });

    const notebook = await this.prisma.notebook.findUnique({
      where: { id: input.notebookId },
      include: { sources: { where: { status: 'ready' } } },
    });

    if (!notebook) throw new Error('Notebook not found');

    // 1. Retrieve key content
    const query = input.focusTopics?.join(' ') || 'main topics key insights important points';
    const retrieval = await this.rag.retrieve(query, {
      limit: 25,
      rerank: true,
      rerankTopK: 15,
      filters: { notebookId: input.notebookId },
    });

    const context = retrieval.chunks.map((c) => c.content).join('\n\n---\n\n');

    // 2. Determine target word count based on duration
    const wordCounts = {
      short: 400,    // ~2-3 min at 150 wpm
      medium: 900,   // ~6 min
      long: 1800,    // ~12 min
    };
    const targetWords = wordCounts[input.duration || 'medium'];

    // 3. Generate script
    const style = input.style || 'podcast';
    const isConversational = style === 'podcast' || style === 'conversational';

    const systemPrompt = isConversational
      ? `You are a podcast script writer. Create an engaging conversation between two hosts discussing the source material.
Use natural dialogue with [HOST] and [COHOST] labels.
Make it informative yet conversational, like NotebookLM's audio overviews.`
      : `You are an educational content writer. Create a clear, engaging ${style} script based on the source material.
Write in a natural speaking style with good pacing.`;

    const userPrompt = `Based on the following source content from a notebook titled "${notebook.title}":

${context}

Create a ${style}-style audio script of approximately ${targetWords} words (${input.duration || 'medium'} duration).
${isConversational ? 'Format as dialogue between [HOST] and [COHOST].' : ''}
${input.focusTopics ? `Focus on: ${input.focusTopics.join(', ')}` : ''}

Make it engaging, informative, and suitable for audio listening.
Include an introduction and conclusion.`;

    const response = await this.llm.complete({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 3000,
    });

    const script = response.content;

    // 4. Generate audio using EdgeTTS
    const outputId = nanoid();
    const audioPath = path.join(this.audioDir, `${outputId}.mp3`);

    // Choose voices
    const hostVoice = input.voices?.host || this.getDefaultVoice(input.language, 'female');
    const cohostVoice = input.voices?.cohost || this.getDefaultVoice(input.language, 'male');

    if (isConversational) {
      // For conversational, we need to split and merge
      await this.generateConversationalAudio(script, audioPath, hostVoice, cohostVoice);
    } else {
      // Single voice
      await this.generateSingleVoiceAudio(script, audioPath, hostVoice);
    }

    // 5. Get audio duration
    const duration = await this.getAudioDuration(audioPath);

    // 6. Save to database
    const result: AudioOverviewResult = {
      id: outputId,
      title: `Audio Overview: ${notebook.title}`,
      audioUrl: `/audio-overviews/${outputId}.mp3`,
      duration,
      transcript: script,
    };

    await this.prisma.notebookOutput.create({
      data: {
        id: outputId,
        notebookId: input.notebookId,
        outputType: 'audio_overview',
        title: result.title,
        content: { transcript: script },
        filePath: result.audioUrl,
        duration,
        settings: {
          style: input.style,
          language: input.language,
          voices: input.voices,
        },
      },
    });

    return result;
  }

  private getDefaultVoice(language?: string, gender: 'male' | 'female' = 'female'): string {
    const voices: Record<string, Record<string, string>> = {
      en: { female: 'en-US-JennyNeural', male: 'en-US-GuyNeural' },
      hi: { female: 'hi-IN-SwaraNeural', male: 'hi-IN-MadhurNeural' },
      ta: { female: 'ta-IN-PallaviNeural', male: 'ta-IN-ValluvarNeural' },
      te: { female: 'te-IN-ShrutiNeural', male: 'te-IN-MohanNeural' },
    };

    const lang = language?.split('-')[0] || 'en';
    return voices[lang]?.[gender] || voices.en[gender];
  }

  private async generateSingleVoiceAudio(
    text: string,
    outputPath: string,
    voice: string
  ): Promise<void> {
    const cleanText = text.replace(/"/g, '\\"').replace(/\n/g, ' ');
    const command = `edge-tts --voice "${voice}" --text "${cleanText}" --write-media "${outputPath}"`;

    try {
      await execAsync(command, { timeout: 120000 });
    } catch (error) {
      console.error('EdgeTTS error:', error);
      throw new Error('Failed to generate audio');
    }
  }

  private async generateConversationalAudio(
    script: string,
    outputPath: string,
    hostVoice: string,
    cohostVoice: string
  ): Promise<void> {
    // Parse script into segments
    const segments: Array<{ speaker: 'host' | 'cohost'; text: string }> = [];
    const lines = script.split('\n');

    for (const line of lines) {
      if (line.startsWith('[HOST]')) {
        segments.push({ speaker: 'host', text: line.replace('[HOST]', '').trim() });
      } else if (line.startsWith('[COHOST]')) {
        segments.push({ speaker: 'cohost', text: line.replace('[COHOST]', '').trim() });
      } else if (line.trim() && segments.length > 0) {
        // Continuation of previous speaker
        segments[segments.length - 1].text += ' ' + line.trim();
      }
    }

    // Generate audio for each segment
    const tempDir = path.join(this.audioDir, 'temp', nanoid());
    await mkdir(tempDir, { recursive: true });

    const segmentFiles: string[] = [];

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const voice = segment.speaker === 'host' ? hostVoice : cohostVoice;
      const segmentPath = path.join(tempDir, `segment_${i}.mp3`);

      const cleanText = segment.text.replace(/"/g, '\\"');
      const command = `edge-tts --voice "${voice}" --text "${cleanText}" --write-media "${segmentPath}"`;

      try {
        await execAsync(command, { timeout: 60000 });
        segmentFiles.push(segmentPath);
      } catch (error) {
        console.error(`Failed to generate segment ${i}:`, error);
      }
    }

    // Concatenate all segments using ffmpeg
    const listFile = path.join(tempDir, 'list.txt');
    await writeFile(listFile, segmentFiles.map((f) => `file '${f}'`).join('\n'));

    const concatCommand = `ffmpeg -f concat -safe 0 -i "${listFile}" -c copy "${outputPath}"`;
    await execAsync(concatCommand, { timeout: 300000 });

    // Cleanup temp files
    await execAsync(`rm -rf "${tempDir}"`);
  }

  private async getAudioDuration(audioPath: string): Promise<number> {
    try {
      const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`;
      const { stdout } = await execAsync(command);
      return Math.round(parseFloat(stdout.trim()));
    } catch (error) {
      return 0;
    }
  }
}
```

---

## Part 4: API Routes

### 4.1 Notebook Routes

```typescript
// apps/ankr-interact/src/server/notebook-routes.ts

import { FastifyInstance } from 'fastify';
import { NotebookService } from '@ankr/notebook';
import { SourceIngestionService } from '@ankr/notebook';
import { SlideGeneratorService } from '@ankr/notebook';
import { AudioOverviewService } from '@ankr/notebook';

export async function registerNotebookRoutes(
  server: FastifyInstance,
  services: {
    notebook: NotebookService;
    ingestion: SourceIngestionService;
    slides: SlideGeneratorService;
    audio: AudioOverviewService;
  }
) {
  // ═══════════════════════════════════════════════════════════════════════════
  // NOTEBOOK CRUD
  // ═══════════════════════════════════════════════════════════════════════════

  // Create notebook
  server.post('/api/notebooks', async (request, reply) => {
    const { title, description, language } = request.body as any;
    const userId = (request as any).user?.id;

    if (!userId) return reply.code(401).send({ error: 'Unauthorized' });
    if (!title) return reply.code(400).send({ error: 'Title required' });

    const notebook = await services.notebook.create({
      userId,
      title,
      description,
      language,
    });

    return reply.code(201).send(notebook);
  });

  // List notebooks
  server.get('/api/notebooks', async (request, reply) => {
    const userId = (request as any).user?.id;
    if (!userId) return reply.code(401).send({ error: 'Unauthorized' });

    const notebooks = await services.notebook.list(userId);
    return reply.send(notebooks);
  });

  // Get notebook
  server.get('/api/notebooks/:id', async (request, reply) => {
    const { id } = request.params as any;
    const userId = (request as any).user?.id;

    if (!userId) return reply.code(401).send({ error: 'Unauthorized' });

    const notebook = await services.notebook.getById(id, userId);
    if (!notebook) return reply.code(404).send({ error: 'Not found' });

    return reply.send(notebook);
  });

  // Delete notebook
  server.delete('/api/notebooks/:id', async (request, reply) => {
    const { id } = request.params as any;
    const userId = (request as any).user?.id;

    if (!userId) return reply.code(401).send({ error: 'Unauthorized' });

    const deleted = await services.notebook.delete(id, userId);
    if (!deleted) return reply.code(404).send({ error: 'Not found' });

    return reply.code(204).send();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SOURCE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  // Add source (YouTube, webpage, text)
  server.post('/api/notebooks/:id/sources', async (request, reply) => {
    const { id: notebookId } = request.params as any;
    const { sourceType, url, content, title } = request.body as any;
    const userId = (request as any).user?.id;

    if (!userId) return reply.code(401).send({ error: 'Unauthorized' });

    // Verify access
    const notebook = await services.notebook.getById(notebookId, userId);
    if (!notebook) return reply.code(404).send({ error: 'Notebook not found' });

    const result = await services.ingestion.ingest({
      notebookId,
      sourceType,
      url,
      content,
      title,
    });

    return reply.code(201).send(result);
  });

  // Upload PDF source
  server.post('/api/notebooks/:id/sources/upload', async (request, reply) => {
    const { id: notebookId } = request.params as any;
    const userId = (request as any).user?.id;

    if (!userId) return reply.code(401).send({ error: 'Unauthorized' });

    const data = await request.file();
    if (!data) return reply.code(400).send({ error: 'No file uploaded' });

    const buffer = await data.toBuffer();

    const result = await services.ingestion.ingest({
      notebookId,
      sourceType: 'pdf',
      title: data.filename,
      file: buffer,
    });

    return reply.code(201).send(result);
  });

  // Delete source
  server.delete('/api/notebooks/:notebookId/sources/:sourceId', async (request, reply) => {
    const { notebookId, sourceId } = request.params as any;
    const userId = (request as any).user?.id;

    if (!userId) return reply.code(401).send({ error: 'Unauthorized' });

    const deleted = await services.ingestion.deleteSource(sourceId, notebookId);
    if (!deleted) return reply.code(404).send({ error: 'Not found' });

    return reply.code(204).send();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAT (Source-grounded Q&A)
  // ═══════════════════════════════════════════════════════════════════════════

  server.post('/api/notebooks/:id/chat', async (request, reply) => {
    const { id: notebookId } = request.params as any;
    const { message, conversationId } = request.body as any;
    const userId = (request as any).user?.id;

    if (!userId) return reply.code(401).send({ error: 'Unauthorized' });
    if (!message) return reply.code(400).send({ error: 'Message required' });

    const response = await services.notebook.chat(
      notebookId,
      userId,
      message,
      conversationId
    );

    return reply.send(response);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDES
  // ═══════════════════════════════════════════════════════════════════════════

  server.post('/api/notebooks/:id/slides', async (request, reply) => {
    const { id: notebookId } = request.params as any;
    const { title, slideCount, style, language, focusTopics, customPrompt } =
      request.body as any;
    const userId = (request as any).user?.id;

    if (!userId) return reply.code(401).send({ error: 'Unauthorized' });

    const presentation = await services.slides.generate({
      notebookId,
      userId,
      title,
      slideCount,
      style,
      language,
      focusTopics,
      customPrompt,
    });

    return reply.code(201).send(presentation);
  });

  server.get('/api/notebooks/:id/slides/:slideId/export', async (request, reply) => {
    const { slideId } = request.params as any;

    const html = await services.slides.exportToHTML(slideId);

    return reply.type('text/html').send(html);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIO OVERVIEW
  // ═══════════════════════════════════════════════════════════════════════════

  server.post('/api/notebooks/:id/audio-overview', async (request, reply) => {
    const { id: notebookId } = request.params as any;
    const { style, duration, language, voices, focusTopics } = request.body as any;
    const userId = (request as any).user?.id;

    if (!userId) return reply.code(401).send({ error: 'Unauthorized' });

    const result = await services.audio.generate({
      notebookId,
      userId,
      style,
      duration,
      language,
      voices,
      focusTopics,
    });

    return reply.code(201).send(result);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // COLLABORATION
  // ═══════════════════════════════════════════════════════════════════════════

  server.post('/api/notebooks/:id/collaborators', async (request, reply) => {
    const { id: notebookId } = request.params as any;
    const { collaboratorId, role } = request.body as any;
    const userId = (request as any).user?.id;

    if (!userId) return reply.code(401).send({ error: 'Unauthorized' });

    const added = await services.notebook.addCollaborator(
      notebookId,
      userId,
      collaboratorId,
      role
    );

    if (!added) return reply.code(404).send({ error: 'Notebook not found' });

    return reply.code(201).send({ success: true });
  });

  server.delete('/api/notebooks/:id/collaborators/:collabId', async (request, reply) => {
    const { id: notebookId, collabId } = request.params as any;
    const userId = (request as any).user?.id;

    if (!userId) return reply.code(401).send({ error: 'Unauthorized' });

    const removed = await services.notebook.removeCollaborator(
      notebookId,
      userId,
      collabId
    );

    if (!removed) return reply.code(404).send({ error: 'Not found' });

    return reply.code(204).send();
  });
}
```

---

## Part 5: Frontend Components

### 5.1 NotebookPage

```tsx
// apps/ankr-interact/src/client/platform/pages/NotebookPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { SourcePanel } from '../components/notebook/SourcePanel';
import { ChatPanel } from '../components/notebook/ChatPanel';
import { OutputPanel } from '../components/notebook/OutputPanel';

export function NotebookPage() {
  const { id } = useParams<{ id: string }>();
  const [notebook, setNotebook] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'slides' | 'audio'>('chat');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotebook();
  }, [id]);

  const loadNotebook = async () => {
    const response = await fetch(`/api/notebooks/${id}`);
    const data = await response.json();
    setNotebook(data);
    setLoading(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!notebook) {
    return <div className="text-center py-20">Notebook not found</div>;
  }

  return (
    <div className="h-screen flex">
      {/* Left Panel - Sources */}
      <div className="w-80 border-r bg-gray-50 flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">{notebook.title}</h1>
          <p className="text-sm text-gray-500">
            {notebook.sourceCount} sources
          </p>
        </div>
        <SourcePanel
          notebookId={id!}
          sources={notebook.sources}
          onSourceAdded={loadNotebook}
        />
      </div>

      {/* Right Panel - Chat/Slides/Audio */}
      <div className="flex-1 flex flex-col">
        {/* Tabs */}
        <div className="border-b flex">
          <button
            className={`px-6 py-3 ${activeTab === 'chat' ? 'border-b-2 border-blue-500 text-blue-600' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            Chat
          </button>
          <button
            className={`px-6 py-3 ${activeTab === 'slides' ? 'border-b-2 border-blue-500 text-blue-600' : ''}`}
            onClick={() => setActiveTab('slides')}
          >
            Slides
          </button>
          <button
            className={`px-6 py-3 ${activeTab === 'audio' ? 'border-b-2 border-blue-500 text-blue-600' : ''}`}
            onClick={() => setActiveTab('audio')}
          >
            Audio Overview
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'chat' && (
            <ChatPanel notebookId={id!} />
          )}
          {activeTab === 'slides' && (
            <OutputPanel notebookId={id!} type="slides" />
          )}
          {activeTab === 'audio' && (
            <OutputPanel notebookId={id!} type="audio" />
          )}
        </div>
      </div>
    </div>
  );
}
```

### 5.2 SourcePanel

```tsx
// apps/ankr-interact/src/client/platform/components/notebook/SourcePanel.tsx

import React, { useState } from 'react';

interface Source {
  id: string;
  title: string;
  sourceType: string;
  status: string;
}

interface SourcePanelProps {
  notebookId: string;
  sources: Source[];
  onSourceAdded: () => void;
}

export function SourcePanel({ notebookId, sources, onSourceAdded }: SourcePanelProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'youtube' | 'webpage' | 'text' | 'pdf'>('youtube');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    setLoading(true);
    try {
      if (addType === 'pdf') {
        // File upload handled separately
        return;
      }

      const response = await fetch(`/api/notebooks/${notebookId}/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: addType,
          url: addType !== 'text' ? url : undefined,
          content: addType === 'text' ? text : undefined,
        }),
      });

      if (response.ok) {
        onSourceAdded();
        setShowAddModal(false);
        setUrl('');
        setText('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      const response = await fetch(`/api/notebooks/${notebookId}/sources/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        onSourceAdded();
        setShowAddModal(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'youtube': return '🎬';
      case 'webpage': return '🌐';
      case 'pdf': return '📄';
      case 'text': return '📝';
      default: return '📎';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Add Source Button */}
      <div className="p-4">
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          + Add Source
        </button>
      </div>

      {/* Source List */}
      <div className="px-4 space-y-2">
        {sources.map((source) => (
          <div
            key={source.id}
            className="p-3 bg-white rounded-lg border hover:shadow-sm cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span>{getIcon(source.sourceType)}</span>
              <span className="flex-1 truncate text-sm">{source.title}</span>
              {source.status === 'processing' && (
                <span className="text-xs text-yellow-600">Processing...</span>
              )}
            </div>
          </div>
        ))}

        {sources.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            No sources yet. Add a YouTube video, webpage, or PDF to get started.
          </p>
        )}
      </div>

      {/* Add Source Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Source</h2>

            {/* Type Selector */}
            <div className="flex gap-2 mb-4">
              {(['youtube', 'webpage', 'pdf', 'text'] as const).map((type) => (
                <button
                  key={type}
                  className={`px-3 py-1 rounded ${addType === type ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                  onClick={() => setAddType(type)}
                >
                  {getIcon(type)} {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            {/* Input */}
            {(addType === 'youtube' || addType === 'webpage') && (
              <input
                type="url"
                placeholder={`Paste ${addType === 'youtube' ? 'YouTube' : 'webpage'} URL`}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full p-3 border rounded-lg mb-4"
              />
            )}

            {addType === 'text' && (
              <textarea
                placeholder="Paste or type your content"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full p-3 border rounded-lg mb-4 h-40"
              />
            )}

            {addType === 'pdf' && (
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="w-full p-3 border rounded-lg mb-4"
              />
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg border"
              >
                Cancel
              </button>
              {addType !== 'pdf' && (
                <button
                  onClick={handleAdd}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 5.3 ChatPanel

```tsx
// apps/ankr-interact/src/client/platform/components/notebook/ChatPanel.tsx

import React, { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ title: string; excerpt: string }>;
}

interface ChatPanelProps {
  notebookId: string;
}

export function ChatPanel({ notebookId }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch(`/api/notebooks/${notebookId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationId,
        }),
      });

      const data = await response.json();

      setConversationId(data.conversationId);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.response,
          sources: data.sources,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-20">
            <p className="text-2xl mb-2">Ask anything about your sources</p>
            <p>Your AI assistant will answer based ONLY on the documents you've added.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>

              {/* Sources */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-500 mb-2">Sources:</p>
                  {msg.sources.map((source, j) => (
                    <div key={j} className="text-xs bg-white rounded p-2 mb-1">
                      <p className="font-medium">{source.title}</p>
                      <p className="text-gray-500 truncate">{source.excerpt}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-4 rounded-2xl">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your sources..."
            className="flex-1 p-3 border rounded-xl resize-none"
            rows={2}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-6 bg-blue-500 text-white rounded-xl disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## Part 6: Implementation Timeline

### Phase 1: Core Notebook (Week 1-2)
- [ ] Database schema migration
- [ ] NotebookService implementation
- [ ] SourceIngestionService with PDF, text
- [ ] Basic notebook CRUD routes
- [ ] Source-grounded chat (core feature)
- [ ] Basic NotebookPage UI

### Phase 2: Multi-source Ingestion (Week 2-3)
- [ ] YouTube transcript extraction
- [ ] Webpage content extraction
- [ ] Google Drive sync (leverage existing)
- [ ] Enhanced chunking with overlap
- [ ] SourcePanel with all source types

### Phase 3: Slides & Audio (Week 3-4)
- [ ] SlideGeneratorService
- [ ] Reveal.js export
- [ ] AudioOverviewService
- [ ] Conversational podcast style
- [ ] Indian language voice support (Sarvam)

### Phase 4: Collaboration & Polish (Week 4-5)
- [ ] Collaborator management
- [ ] Real-time updates (WebSocket)
- [ ] Mobile responsive design
- [ ] Performance optimization
- [ ] Documentation & testing

---

## Part 7: Differentiation from NotebookLM

### ANKR Notebook Advantages

| Feature | NotebookLM | ANKR Notebook |
|---------|------------|---------------|
| **Free Tier** | Limited | Unlimited |
| **Indian Languages** | No | 22 languages + Sarvam TTS |
| **Offline Mode** | No | PWA with offline |
| **Quiz Generation** | No | 8 question types |
| **AI Tutor** | No | 4 personas |
| **Progress Tracking** | No | Full LMS |
| **Certifications** | No | Verifiable certs |
| **API Access** | No | Full GraphQL API |
| **Self-hosted** | No | Yes |
| **Collaboration** | Basic | Full RBAC |
| **Export Formats** | PDF only | HTML, PPTX, JSON |

### Marketing Positioning

> "ANKR Notebook: NotebookLM features + complete LMS - Free for India"

**Tagline:** "Your personal AI research assistant that actually teaches you"

---

## Part 8: Technical Dependencies

### New Dependencies

```json
{
  "youtube-transcript": "^1.2.1",
  "@mozilla/readability": "^0.5.0",
  "jsdom": "^24.0.0",
  "pdf-parse": "^1.1.1",
  "reveal.js": "^5.0.0"
}
```

### Environment Variables

```bash
# Required
DATABASE_URL=postgresql://ankr:xxx@localhost:5432/ankr_eon
VOYAGE_API_KEY=xxx
AI_PROXY_URL=http://localhost:4444

# Optional
COHERE_API_KEY=xxx          # For reranking
SARVAM_API_KEY=xxx          # For Indian language TTS
REDIS_URL=redis://localhost:6379  # For embedding cache
```

---

## Summary

This project transforms ANKR LMS into a complete NotebookLM competitor while retaining all existing LMS functionality. Key advantages:

1. **Source-grounded Q&A** - Chat with your documents, not the internet
2. **Multi-format ingestion** - YouTube, webpages, PDFs, text
3. **AI Slides** - Generate presentations from your research
4. **Audio Overviews** - Podcast-style summaries in 22+ languages
5. **Full LMS** - Quizzes, progress tracking, certifications
6. **AI Tutor** - 4 teaching personas for personalized learning
7. **Collaboration** - Share notebooks with team
8. **Offline-first** - PWA with local-first architecture
9. **Free** - No subscription required

**Estimated Timeline:** 4-5 weeks
**Estimated Effort:** ~15,000 lines of code

---

*Document Created: January 26, 2026*
*Status: Ready for Implementation*
