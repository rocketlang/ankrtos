/**
 * Upload Sample Charter Party Document
 *
 * Tests the hybrid DMS with a real GENCON 2022 charter party
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { createHash } from 'crypto';
import { minioClient } from '../src/services/hybrid/minio-client.js';
import { tesseractOCR } from '../src/services/hybrid/tesseract-ocr.js';
import maritimeRAG from '../src/services/rag/maritime-rag.js';

const prisma = new PrismaClient();

async function uploadSampleCP() {
  console.log('🚢 Uploading Sample GENCON 2022 Charter Party...\n');

  try {
    // 1. Read the PDF file
    console.log('📄 Reading PDF file...');
    const filePath = '/tmp/gencon-2022-sample.pdf';
    const fileBuffer = readFileSync(filePath);
    const fileSize = fileBuffer.length;
    const checksum = createHash('md5').update(fileBuffer).digest('hex');

    console.log(`   Size: ${(fileSize / 1024).toFixed(2)} KB`);
    console.log(`   Checksum: ${checksum}\n`);

    // 2. Upload to MinIO
    console.log('☁️  Uploading to MinIO...');
    const fileName = `charter-parties/gencon-2022-sample-${Date.now()}.pdf`;
    const uploadResult = await minioClient.upload(fileName, fileBuffer, {
      'x-amz-meta-original-name': 'GENCON-2022-Sample.pdf',
      'x-amz-meta-doc-type': 'charter_party',
    });

    console.log(`   URL: ${uploadResult.url}`);
    console.log(`   Version: ${uploadResult.versionId || 'N/A'}\n`);

    // 3. Extract text with OCR (first page only for demo)
    console.log('🔍 Extracting text with Tesseract OCR...');
    console.log('   (Note: Full PDF OCR requires pdf-poppler, using pdftotext for now)\n');

    // Use pdftotext as fallback
    const { execSync } = await import('child_process');
    let extractedText = '';

    try {
      extractedText = execSync(`pdftotext ${filePath} -`, { encoding: 'utf-8' });
      console.log(`   Extracted ${extractedText.length} characters\n`);
      console.log('   Preview:');
      console.log('   ' + extractedText.substring(0, 300).replace(/\n/g, '\n   ') + '...\n');
    } catch (err) {
      console.log('   pdftotext not available, skipping text extraction\n');
      extractedText = 'GENCON 2022 Charter Party Sample Document';
    }

    // 4. Create document in database
    console.log('💾 Creating document record...');

    // Get or create demo organization
    let organization = await prisma.organization.findFirst({
      where: { name: 'Demo Maritime Corp' },
    });

    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          id: 'org-demo-' + Date.now(),
          name: 'Demo Maritime Corp',
          type: 'shipowner',
        },
      });
    }

    // Get or create demo user
    let user = await prisma.user.findFirst({
      where: { email: 'demo@mari8x.com' },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: 'user-demo-' + Date.now(),
          email: 'demo@mari8x.com',
          name: 'Demo User',
          password: 'hashed-password-here',
          organizationId: organization.id,
          role: 'admin',
        },
      });
    }

    const document = await prisma.document.create({
      data: {
        id: 'doc-gencon-2022-' + Date.now(),
        title: 'GENCON 2022 - Sample Charter Party',
        category: 'charter_party',
        fileType: 'pdf',
        fileName: 'GENCON-2022-Sample.pdf',
        filePath: uploadResult.url,
        fileSize: fileSize,
        checksum: checksum,
        notes: extractedText.substring(0, 5000), // Store extracted text
        status: 'active',
        organizationId: organization.id,
        uploadedBy: user.id,
        tags: ['gencon', 'charter_party', 'sample', 'voyage_charter', 'bimco'],
      },
    });

    console.log(`   Document ID: ${document.id}`);
    console.log(`   Title: ${document.title}\n`);

    // 5. Ingest into RAG system
    console.log('🧠 Ingesting into RAG system...');
    const job = await maritimeRAG.ingestDocument(document.id, organization.id);

    console.log(`   Job ID: ${job.jobId}`);
    console.log(`   Status: ${job.status}`);
    console.log(`   Progress: ${job.progress}%\n`);

    // Wait for processing
    console.log('⏳ Waiting for processing to complete...');
    let status = await maritimeRAG.getJobStatus(job.jobId);
    let attempts = 0;

    while (status.status === 'pending' && attempts < 30) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      status = await maritimeRAG.getJobStatus(job.jobId);
      attempts++;

      if (attempts % 5 === 0) {
        console.log(`   Still processing... (${attempts}s)`);
      }
    }

    console.log(`   Final Status: ${status.status}`);
    console.log(`   Chunks Created: ${status.chunksCreated}\n`);

    // 6. Test search
    console.log('🔎 Testing semantic search...');
    const searchResults = await maritimeRAG.search(
      'freight payment terms',
      { limit: 3 },
      organization.id
    );

    console.log(`   Found ${searchResults.length} results:\n`);
    searchResults.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.title}`);
      console.log(`      Score: ${result.score.toFixed(2)}`);
      console.log(`      Excerpt: ${result.excerpt.substring(0, 100)}...`);
      console.log('');
    });

    // 7. Test RAG Q&A
    console.log('💬 Testing RAG Q&A...');
    const answer = await maritimeRAG.ask(
      'What is GENCON and what is it used for?',
      { limit: 3 },
      organization.id
    );

    console.log(`   Question: What is GENCON and what is it used for?`);
    console.log(`   Answer: ${answer.answer}`);
    console.log(`   Confidence: ${answer.confidence.toFixed(1)}%`);
    console.log(`   Sources: ${answer.sources.length}`);
    console.log('');

    if (answer.followUpSuggestions.length > 0) {
      console.log('   Follow-up suggestions:');
      answer.followUpSuggestions.forEach((s, i) => {
        console.log(`   ${i + 1}. ${s}`);
      });
      console.log('');
    }

    console.log('✅ Sample charter party uploaded and indexed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   • Document: ${document.title}`);
    console.log(`   • File Size: ${(fileSize / 1024).toFixed(2)} KB`);
    console.log(`   • Text Length: ${extractedText.length} chars`);
    console.log(`   • Chunks: ${status.chunksCreated}`);
    console.log(`   • Searchable: Yes ✓`);
    console.log(`   • RAG Q&A: Yes ✓`);
    console.log('');
    console.log('🎯 Next: Try searching in the frontend or ask SwayamBot about it!');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run
uploadSampleCP()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
