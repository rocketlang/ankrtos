/**
 * Upload Test Documents and Generate Embeddings
 * Uploads diverse maritime documents for testing RAG system
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import axios from 'axios';

const prisma = new PrismaClient();

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

interface TestDocument {
  id: string;
  title: string;
  filename: string;
  docType: string;
  description: string;
}

const testDocuments: TestDocument[] = [
  {
    id: 'doc-nype-2015-sample',
    title: 'NYPE 2015 Time Charter - MV PACIFIC STAR',
    filename: 'nype-time-charter-sample.txt',
    docType: 'charter_party',
    description: '12-month time charter for 75,000 DWT bulk carrier',
  },
  {
    id: 'doc-bol-maersk-001',
    title: 'Bill of Lading - Steel Coils Singapore to Long Beach',
    filename: 'bill-of-lading-sample-1.txt',
    docType: 'bol',
    description: '3x40HC containers of steel coils, prepaid freight',
  },
  {
    id: 'doc-port-notice-sgsin-2026',
    title: 'Port Notice - Singapore Operations Jan 2026',
    filename: 'port-notice-singapore.txt',
    docType: 'port_notice',
    description: 'MPA Singapore port operations, congestion, and procedures',
  },
  {
    id: 'doc-email-fixture-negotiation',
    title: 'Email: Fixture Negotiation - MV PACIFIC STAR TC',
    filename: 'email-fixture-negotiation.txt',
    docType: 'email',
    description: 'Counter-offer email for time charter negotiation',
  },
  {
    id: 'doc-laytime-calc-example',
    title: 'Laytime Calculation - MV OCEAN STAR Singapore-New York',
    filename: 'laytime-calculation-example.txt',
    docType: 'laytime_statement',
    description: 'Complete laytime calculation with demurrage claim',
  },
];

/**
 * Generate embedding using Ollama
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await axios.post(`${OLLAMA_URL}/api/embeddings`, {
      model: 'nomic-embed-text',
      prompt: text,
    });
    return response.data.embedding;
  } catch (error: any) {
    console.error('Ollama embedding error:', error.message);
    throw error;
  }
}

/**
 * Extract entities from document content
 */
function extractEntities(content: string, docType: string): {
  vesselNames: string[];
  portNames: string[];
  cargoTypes: string[];
} {
  const vesselNames: string[] = [];
  const portNames: string[] = [];
  const cargoTypes: string[] = [];

  // Vessel name patterns
  const vesselPatterns = [
    /(?:M\/V|MV|MT|S\/S)\s+([A-Z][A-Z\s]+?)(?:\s|,|\n|$)/gi,
    /Vessel[:\s]+([A-Z][A-Z\s]+?)(?:\s|,|\n|$)/gi,
    /Name:\s+([A-Z][A-Z\s]+?)(?:\s|,|\n|$)/gi,
  ];

  vesselPatterns.forEach((pattern) => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const vessel = match[1].trim();
      if (vessel.length > 2 && vessel.length < 30 && !vesselNames.includes(vessel)) {
        vesselNames.push(vessel);
      }
    }
  });

  // Port name patterns (common port codes)
  const portCodes = [
    'SGSIN', 'USNYC', 'USLGB', 'CNSHA', 'CNSHK', 'NLRTM', 'DEHAM',
    'USHOU', 'JPTYO', 'KRPUS', 'AEJEA', 'HKHKG', 'THBKK', 'MYPKG',
  ];

  portCodes.forEach((code) => {
    if (content.includes(code)) {
      portNames.push(code);
    }
  });

  // Also extract city names as ports
  const cityPortPattern = /(?:Port of|Loading Port|Discharge Port|POL|POD)[:\s]+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/gi;
  const cityMatches = content.matchAll(cityPortPattern);
  for (const match of cityMatches) {
    const port = match[1].trim();
    if (!portNames.includes(port)) {
      portNames.push(port);
    }
  }

  // Cargo type patterns
  const cargoPatterns = [
    /Cargo[:\s]+([A-Z][a-z\s]+?)(?:\n|,|$)/gi,
    /([0-9,]+\s*(?:MT|tons?|TEU|containers?)[s\s]+of\s+([A-Z][a-z\s]+))/gi,
  ];

  cargoPatterns.forEach((pattern) => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      let cargo = match[match.length - 1]?.trim();
      if (cargo && cargo.length > 3 && cargo.length < 50 && !cargoTypes.includes(cargo)) {
        cargoTypes.push(cargo);
      }
    }
  });

  return { vesselNames, portNames, cargoTypes };
}

/**
 * Main upload function
 */
async function main() {
  console.log('📤 Uploading Test Documents and Generating Embeddings\n');
  console.log('========================================\n');

  // Get first organization and user
  const org = await prisma.organization.findFirst();
  const user = await prisma.user.findFirst({ where: { organizationId: org?.id } });

  if (!org || !user) {
    console.error('❌ No organization or user found. Please seed the database first.');
    process.exit(1);
  }

  console.log(`Organization: ${org.name} (${org.id})`);
  console.log(`User: ${user.name} (${user.email})\n`);

  let successCount = 0;
  let failCount = 0;

  for (const doc of testDocuments) {
    try {
      console.log(`\n📄 Processing: ${doc.title}`);
      console.log(`   Type: ${doc.docType}`);

      // Read file content
      const filePath = join(process.cwd(), '..', 'test-documents', doc.filename);
      const content = readFileSync(filePath, 'utf-8');
      console.log(`   Content length: ${content.length} chars`);

      // Check if document already exists
      const existing = await prisma.document.findFirst({
        where: { id: doc.id },
      });

      if (existing) {
        console.log(`   ⚠️  Document already exists, skipping...`);
        continue;
      }

      // Upload document
      const document = await prisma.document.create({
        data: {
          id: doc.id,
          title: doc.title,
          category: doc.docType,
          subcategory: doc.description,
          fileName: doc.filename,
          fileSize: Buffer.byteLength(content),
          mimeType: 'text/plain',
          status: 'active',
          organizationId: org.id,
          uploadedBy: user.id,
        },
      });

      console.log(`   ✅ Document uploaded: ${document.id}`);

      // Extract entities
      const entities = extractEntities(content, doc.docType);
      console.log(`   Extracted entities:`);
      console.log(`     Vessels: ${entities.vesselNames.join(', ') || 'none'}`);
      console.log(`     Ports: ${entities.portNames.join(', ') || 'none'}`);
      console.log(`     Cargo: ${entities.cargoTypes.join(', ') || 'none'}`);

      // Generate embedding
      console.log(`   🔮 Generating embedding...`);
      const embeddingText = `${doc.title}\n\n${content}`;
      const embedding = await generateEmbedding(embeddingText);
      console.log(`   ✅ Generated ${embedding.length}-dim vector`);

      // Create maritime document with embedding
      const maritimeDoc = await prisma.$executeRaw`
        INSERT INTO maritime_documents (
          id, "documentId", title, content, "docType",
          embedding, "vesselNames", "portNames", "cargoTypes",
          "organizationId", "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(),
          ${doc.id},
          ${doc.title},
          ${content},
          ${doc.docType},
          ${JSON.stringify(embedding)}::vector,
          ${entities.vesselNames},
          ${entities.portNames},
          ${entities.cargoTypes},
          ${org.id},
          NOW(),
          NOW()
        )
      `;

      console.log(`   ✅ Indexed in RAG system`);
      successCount++;

    } catch (error: any) {
      console.error(`   ❌ Failed: ${error.message}`);
      failCount++;
    }
  }

  console.log('\n\n========================================');
  console.log('📊 Upload Complete');
  console.log('========================================');
  console.log(`✅ Success: ${successCount} documents`);
  console.log(`❌ Failed: ${failCount} documents`);
  console.log(`📈 Total: ${successCount + failCount} documents processed\n`);

  // Show summary
  const totalDocs = await prisma.maritimeDocument.count();
  const withEmbeddings = await prisma.$queryRaw<any[]>`
    SELECT COUNT(*) as count FROM maritime_documents WHERE embedding IS NOT NULL
  `;

  console.log('Database Summary:');
  console.log(`  Total indexed documents: ${totalDocs}`);
  console.log(`  Documents with embeddings: ${withEmbeddings[0].count}`);
  console.log('\n✅ Ready for search testing!\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
