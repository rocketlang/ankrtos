-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create maritime_documents table
CREATE TABLE "maritime_documents" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "section" TEXT,
    "chunkIndex" INTEGER NOT NULL DEFAULT 0,
    "docType" TEXT NOT NULL,
    "embedding" vector(1536),
    "vesselId" TEXT,
    "voyageId" TEXT,
    "charterId" TEXT,
    "companyId" TEXT,
    "vesselNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "portNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cargoTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "parties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "importance" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "contentTsv" tsvector,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maritime_documents_pkey" PRIMARY KEY ("id")
);

-- Create search_queries table
CREATE TABLE "search_queries" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "organizationId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "queryType" TEXT NOT NULL DEFAULT 'semantic',
    "resultsCount" INTEGER NOT NULL DEFAULT 0,
    "responseTime" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_queries_pkey" PRIMARY KEY ("id")
);

-- Create document_processing_jobs table
CREATE TABLE "document_processing_jobs" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "jobType" TEXT NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "chunksCreated" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_processing_jobs_pkey" PRIMARY KEY ("id")
);

-- Create indexes on maritime_documents
CREATE INDEX "maritime_documents_organizationId_docType_idx" ON "maritime_documents"("organizationId", "docType");
CREATE INDEX "maritime_documents_documentId_idx" ON "maritime_documents"("documentId");
CREATE INDEX "maritime_documents_vesselId_idx" ON "maritime_documents"("vesselId");
CREATE INDEX "maritime_documents_voyageId_idx" ON "maritime_documents"("voyageId");

-- Create IVFFlat index on embedding column for fast vector similarity search
CREATE INDEX "maritime_documents_embedding_idx" ON "maritime_documents"
USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);

-- Create GIN index on contentTsv for full-text search
CREATE INDEX "maritime_documents_contentTsv_idx" ON "maritime_documents" USING GIN ("contentTsv");

-- Create GIN indexes on array columns for entity filtering
CREATE INDEX "maritime_documents_vesselNames_idx" ON "maritime_documents" USING GIN ("vesselNames");
CREATE INDEX "maritime_documents_portNames_idx" ON "maritime_documents" USING GIN ("portNames");
CREATE INDEX "maritime_documents_cargoTypes_idx" ON "maritime_documents" USING GIN ("cargoTypes");
CREATE INDEX "maritime_documents_parties_idx" ON "maritime_documents" USING GIN ("parties");
CREATE INDEX "maritime_documents_tags_idx" ON "maritime_documents" USING GIN ("tags");

-- Create indexes on search_queries
CREATE INDEX "search_queries_organizationId_createdAt_idx" ON "search_queries"("organizationId", "createdAt");

-- Create indexes on document_processing_jobs
CREATE INDEX "document_processing_jobs_status_jobType_idx" ON "document_processing_jobs"("status", "jobType");

-- Create trigger function to automatically update contentTsv
CREATE OR REPLACE FUNCTION maritime_documents_tsvector_update() RETURNS trigger AS $$
BEGIN
  NEW.contentTsv :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(NEW.tags, ' ')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update tsvector on insert/update
CREATE TRIGGER maritime_documents_tsvector_update_trigger
BEFORE INSERT OR UPDATE ON "maritime_documents"
FOR EACH ROW EXECUTE FUNCTION maritime_documents_tsvector_update();
