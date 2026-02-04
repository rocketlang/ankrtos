/**
 * Document Processing Queue
 * Background job queue for async document processing using BullMQ
 */

import { Queue, Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6382';
const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;
const USE_VOYAGE = process.env.USE_VOYAGE_EMBEDDINGS === 'true';

// Parse Redis connection
const redisConfig = {
  host: 'localhost',
  port: 6382,
};

// Job types
export interface DocumentProcessingJob {
  documentId: string;
  organizationId: string;
  jobType: 'embed' | 'process' | 'full';
  options?: {
    chunkSize?: number;
    overlap?: number;
  };
}

// Create queue
export const documentQueue = new Queue<DocumentProcessingJob>('document-processing', {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
    },
    removeOnFail: {
      count: 50, // Keep last 50 failed jobs
    },
  },
});

/**
 * Generate embedding using Voyage AI or Ollama
 */
async function generateEmbedding(text: string): Promise<number[]> {
  if (USE_VOYAGE && VOYAGE_API_KEY) {
    const response = await axios.post(
      'https://api.voyageai.com/v1/embeddings',
      {
        input: [text],
        model: 'voyage-code-2',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${VOYAGE_API_KEY}`,
        },
      }
    );
    return response.data.data[0].embedding;
  } else {
    // Fallback to Ollama
    const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
    const response = await axios.post(`${OLLAMA_URL}/api/embeddings`, {
      model: 'nomic-embed-text',
      prompt: text,
    });
    return response.data.embedding;
  }
}

/**
 * Process embedding job
 */
async function processEmbeddingJob(job: Job<DocumentProcessingJob>) {
  const { documentId, organizationId } = job.data;

  await job.updateProgress(10);

  // Get document
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new Error(`Document ${documentId} not found`);
  }

  await job.updateProgress(20);

  // Read file content (simplified - in production would read from MinIO)
  let content = `${document.title}\n\n${document.subcategory || ''}`;

  await job.updateProgress(40);

  // Generate embedding
  console.log(`📄 Generating embedding for: ${document.title}`);
  const embedding = await generateEmbedding(content);

  await job.updateProgress(70);

  // Check if already exists
  const existing = await prisma.$queryRaw<any[]>`
    SELECT id FROM maritime_documents WHERE "documentId" = ${documentId}
  `;

  if (existing.length > 0) {
    // Update existing
    await prisma.$executeRaw`
      UPDATE maritime_documents
      SET embedding = ${JSON.stringify(embedding)}::vector,
          "updatedAt" = NOW()
      WHERE "documentId" = ${documentId}
    `;
  } else {
    // Insert new
    await prisma.$executeRaw`
      INSERT INTO maritime_documents (
        id, "documentId", title, content, "docType",
        embedding, "organizationId", "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(),
        ${documentId},
        ${document.title},
        ${content},
        ${document.category},
        ${JSON.stringify(embedding)}::vector,
        ${organizationId},
        NOW(),
        NOW()
      )
    `;
  }

  await job.updateProgress(90);

  // Update tsvector for full-text search
  await prisma.$executeRaw`
    UPDATE maritime_documents
    SET "contentTsv" = to_tsvector('english', title || ' ' || content)
    WHERE "documentId" = ${documentId}
  `;

  await job.updateProgress(100);

  console.log(`✅ Embedded: ${document.title}`);

  return {
    documentId,
    embeddingDimensions: embedding.length,
    success: true,
  };
}

/**
 * Process document processing job (extraction + embedding)
 */
async function processDocumentJob(job: Job<DocumentProcessingJob>) {
  const { documentId, organizationId } = job.data;

  await job.updateProgress(10);

  // Get document
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new Error(`Document ${documentId} not found`);
  }

  await job.updateProgress(20);

  // Read file content (simplified - in production would read from MinIO)
  // For now, just use title and available metadata
  let content = `${document.title}\n\n${document.subcategory || ''}`;

  // TODO: Read actual file from MinIO when file storage is implemented
  // const fileContent = await minioClient.getObject(document.filePath);

  await job.updateProgress(30);

  // Import processors dynamically to avoid circular deps
  const { processDocument } = await import('../processors/index.js');

  // Extract structured data using appropriate processor
  console.log(`🔍 Processing document: ${document.title}`);
  const extracted = await processDocument(content, document.fileName);

  await job.updateProgress(50);

  console.log(`📊 Extracted data:`, {
    type: extracted.detectedType,
    vessels: extracted.vessels?.length || 0,
    parties: extracted.parties?.length || 0,
    ports: extracted.ports?.length || 0,
    cargo: extracted.cargo?.length || 0,
    rates: extracted.rates?.length || 0,
  });

  // Store extracted metadata (optional - could be saved to Document model)
  // For now, just log it - in production you'd update the document record

  await job.updateProgress(60);

  // Then, generate embeddings
  await processEmbeddingJob(job);

  await job.updateProgress(100);

  return {
    documentId,
    success: true,
    extracted: {
      type: extracted.detectedType,
      entities: {
        vessels: extracted.vessels?.length || 0,
        parties: extracted.parties?.length || 0,
        ports: extracted.ports?.length || 0,
      },
    },
  };
}

/**
 * Create worker to process jobs
 */
export function createDocumentWorker() {
  const worker = new Worker<DocumentProcessingJob>(
    'document-processing',
    async (job) => {
      console.log(`🔄 Processing job ${job.id}: ${job.data.jobType} for doc ${job.data.documentId}`);

      try {
        switch (job.data.jobType) {
          case 'embed':
            return await processEmbeddingJob(job);
          case 'process':
            return await processDocumentJob(job);
          case 'full':
            return await processDocumentJob(job);
          default:
            throw new Error(`Unknown job type: ${job.data.jobType}`);
        }
      } catch (error: any) {
        console.error(`❌ Job ${job.id} failed:`, error.message);
        throw error;
      }
    },
    {
      connection: redisConfig,
      concurrency: 2, // Process 2 jobs at a time
    }
  );

  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message);
  });

  worker.on('progress', (job, progress) => {
    console.log(`📊 Job ${job.id} progress: ${progress}%`);
  });

  console.log('🚀 Document processing worker started');

  return worker;
}

/**
 * Add document to processing queue
 */
export async function queueDocumentProcessing(
  documentId: string,
  organizationId: string,
  jobType: 'embed' | 'process' | 'full' = 'full'
): Promise<string> {
  const job = await documentQueue.add(
    `${jobType}-${documentId}`,
    {
      documentId,
      organizationId,
      jobType,
    },
    {
      jobId: `${jobType}-${documentId}-${Date.now()}`,
    }
  );

  console.log(`📥 Queued job ${job.id} for document ${documentId}`);

  return job.id!;
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string) {
  const job = await documentQueue.getJob(jobId);

  if (!job) {
    return { status: 'not_found' };
  }

  const state = await job.getState();
  const progress = job.progress;

  return {
    id: job.id,
    status: state,
    progress,
    data: job.data,
    finishedOn: job.finishedOn,
    failedReason: job.failedReason,
  };
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  const counts = await documentQueue.getJobCounts();

  return {
    waiting: counts.waiting,
    active: counts.active,
    completed: counts.completed,
    failed: counts.failed,
    delayed: counts.delayed,
  };
}

/**
 * Clear completed jobs
 */
export async function clearCompletedJobs() {
  await documentQueue.clean(0, 0, 'completed');
  console.log('🧹 Cleared completed jobs');
}

export default {
  documentQueue,
  createDocumentWorker,
  queueDocumentProcessing,
  getJobStatus,
  getQueueStats,
  clearCompletedJobs,
};
