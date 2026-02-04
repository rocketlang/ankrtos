#!/usr/bin/env tsx
/**
 * Backfill RAG Index Script
 *
 * Processes all existing documents in the database and indexes them into the RAG system.
 * Run once after Phase 32 deployment.
 *
 * Usage: tsx scripts/backfill-rag.ts
 */

import { PrismaClient } from '@prisma/client';
import { maritimeRAG } from '../src/services/maritime-rag.js';

const prisma = new PrismaClient();

interface BackfillStats {
  totalOrgs: number;
  totalDocs: number;
  processed: number;
  failed: number;
  skipped: number;
  startTime: Date;
  endTime?: Date;
}

async function backfillRAG() {
  const stats: BackfillStats = {
    totalOrgs: 0,
    totalDocs: 0,
    processed: 0,
    failed: 0,
    skipped: 0,
    startTime: new Date(),
  };

  console.log('='.repeat(60));
  console.log('Mari8X RAG Backfill Script');
  console.log('='.repeat(60));
  console.log('Started at:', stats.startTime.toISOString());
  console.log('');

  try {
    // Get all organizations
    const organizations = await prisma.organization.findMany({
      select: { id: true, name: true },
    });

    stats.totalOrgs = organizations.length;
    console.log(`Found ${stats.totalOrgs} organizations\n`);

    // Process each organization
    for (const org of organizations) {
      console.log(`\nProcessing organization: ${org.name} (${org.id})`);
      console.log('-'.repeat(60));

      // Get all active documents for this org
      const documents = await prisma.document.findMany({
        where: {
          organizationId: org.id,
          status: 'active',
        },
        select: {
          id: true,
          title: true,
          category: true,
          fileSize: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      console.log(`  Found ${documents.length} active documents`);
      stats.totalDocs += documents.length;

      // Check which documents are already indexed
      const alreadyIndexed = await prisma.maritimeDocument.groupBy({
        by: ['documentId'],
        where: {
          documentId: { in: documents.map((d) => d.id) },
        },
      });

      const indexedDocIds = new Set(alreadyIndexed.map((g) => g.documentId));
      console.log(`  Already indexed: ${indexedDocIds.size} documents`);

      // Process each document
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        const progress = ((i + 1) / documents.length) * 100;

        // Skip if already indexed
        if (indexedDocIds.has(doc.id)) {
          console.log(`  [${i + 1}/${documents.length}] ⏭️  ${doc.title} (already indexed)`);
          stats.skipped++;
          continue;
        }

        // Skip very large files (> 10MB)
        if (doc.fileSize > 10 * 1024 * 1024) {
          console.log(`  [${i + 1}/${documents.length}] ⚠️  ${doc.title} (file too large: ${(doc.fileSize / 1024 / 1024).toFixed(2)}MB)`);
          stats.skipped++;
          continue;
        }

        try {
          console.log(`  [${i + 1}/${documents.length}] 🔄 Processing: ${doc.title}...`);

          // Ingest document
          const job = await maritimeRAG.ingestDocument(doc.id, org.id);

          // Wait for job to complete (with timeout)
          let attempts = 0;
          const maxAttempts = 60; // 60 seconds max
          let jobStatus = await maritimeRAG.getJobStatus(job.jobId);

          while (jobStatus && jobStatus.status === 'processing' && attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            jobStatus = await maritimeRAG.getJobStatus(job.jobId);
            attempts++;
          }

          if (!jobStatus) {
            throw new Error('Job status not found');
          }

          if (jobStatus.status === 'completed') {
            console.log(`  [${i + 1}/${documents.length}] ✅ ${doc.title} (${jobStatus.chunksCreated} chunks)`);
            stats.processed++;
          } else if (jobStatus.status === 'failed') {
            console.log(`  [${i + 1}/${documents.length}] ❌ ${doc.title} (${jobStatus.error})`);
            stats.failed++;
          } else {
            console.log(`  [${i + 1}/${documents.length}] ⏸️  ${doc.title} (timeout - still processing)`);
            stats.processed++; // Count as processed even if still running
          }
        } catch (error: any) {
          console.log(`  [${i + 1}/${documents.length}] ❌ ${doc.title} (${error.message})`);
          stats.failed++;
        }

        // Progress indicator
        if ((i + 1) % 10 === 0) {
          console.log(`  Progress: ${progress.toFixed(1)}% (${i + 1}/${documents.length})`);
        }
      }

      console.log(`  Organization complete: ${org.name}`);
    }

    stats.endTime = new Date();

    // Final summary
    console.log('');
    console.log('='.repeat(60));
    console.log('Backfill Complete!');
    console.log('='.repeat(60));
    console.log(`Total Organizations: ${stats.totalOrgs}`);
    console.log(`Total Documents:     ${stats.totalDocs}`);
    console.log(`Processed:           ${stats.processed}`);
    console.log(`Failed:              ${stats.failed}`);
    console.log(`Skipped:             ${stats.skipped}`);
    console.log('');
    console.log(`Started:  ${stats.startTime.toISOString()}`);
    console.log(`Finished: ${stats.endTime.toISOString()}`);
    console.log(`Duration: ${((stats.endTime.getTime() - stats.startTime.getTime()) / 1000).toFixed(2)}s`);
    console.log('='.repeat(60));

    // Log to database
    await prisma.searchQuery.create({
      data: {
        userId: null,
        organizationId: 'system',
        query: `BACKFILL_COMPLETE: ${stats.processed} docs`,
        queryType: 'backfill',
        resultsCount: stats.processed,
        responseTime: stats.endTime.getTime() - stats.startTime.getTime(),
      },
    });
  } catch (error) {
    console.error('');
    console.error('❌ Backfill failed with error:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the backfill
backfillRAG()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
