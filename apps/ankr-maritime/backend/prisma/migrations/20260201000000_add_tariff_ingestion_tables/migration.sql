-- CreateTable
CREATE TABLE "tariff_review_tasks" (
    "id" TEXT NOT NULL,
    "portId" TEXT NOT NULL,
    "extractedData" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "issues" TEXT[],
    "sourceUrl" TEXT,
    "sourceHash" TEXT,
    "documentPath" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "approvedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tariff_review_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tariff_ingestion_jobs" (
    "id" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "priority" INTEGER NOT NULL DEFAULT 5,
    "portIds" TEXT[],
    "options" JSONB,
    "totalPorts" INTEGER NOT NULL DEFAULT 0,
    "processedPorts" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "estimatedEnd" TIMESTAMP(3),
    "results" JSONB,
    "errorLog" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tariff_ingestion_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "port_tariff_documents" (
    "id" TEXT NOT NULL,
    "portId" TEXT NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "documentHash" TEXT NOT NULL,
    "documentType" TEXT NOT NULL DEFAULT 'tariff_schedule',
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "supersededBy" TEXT,
    "extractedAt" TIMESTAMP(3),
    "tariffCount" INTEGER NOT NULL DEFAULT 0,
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "port_tariff_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tariff_review_tasks_portId_idx" ON "tariff_review_tasks"("portId");

-- CreateIndex
CREATE INDEX "tariff_review_tasks_status_idx" ON "tariff_review_tasks"("status");

-- CreateIndex
CREATE INDEX "tariff_review_tasks_confidence_idx" ON "tariff_review_tasks"("confidence");

-- CreateIndex
CREATE INDEX "tariff_ingestion_jobs_status_idx" ON "tariff_ingestion_jobs"("status");

-- CreateIndex
CREATE INDEX "tariff_ingestion_jobs_jobType_idx" ON "tariff_ingestion_jobs"("jobType");

-- CreateIndex
CREATE INDEX "tariff_ingestion_jobs_priority_idx" ON "tariff_ingestion_jobs"("priority");

-- CreateIndex
CREATE INDEX "port_tariff_documents_portId_idx" ON "port_tariff_documents"("portId");

-- CreateIndex
CREATE INDEX "port_tariff_documents_isActive_idx" ON "port_tariff_documents"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "port_tariff_documents_portId_documentHash_key" ON "port_tariff_documents"("portId", "documentHash");

-- AddForeignKey
ALTER TABLE "tariff_review_tasks" ADD CONSTRAINT "tariff_review_tasks_portId_fkey" FOREIGN KEY ("portId") REFERENCES "ports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "port_tariff_documents" ADD CONSTRAINT "port_tariff_documents_portId_fkey" FOREIGN KEY ("portId") REFERENCES "ports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
