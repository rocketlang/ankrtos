#!/usr/bin/env node
/**
 * Create Sample Charter Party Data for PageIndex Testing
 * Runs directly in Maritime backend with proper Prisma client
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://ankr:indrA@0612@localhost:5432/ankr_maritime'
    }
  }
});

/**
 * Generate sample charter party content
 */
function generateCharterParty(type, vesselName, loadPort, dischargePort) {
  return `
# ${type} CHARTER PARTY

## VESSEL DETAILS
Vessel Name: ${vesselName}
IMO Number: 9234567
Flag: Liberia
Built: 2015
DWT: 75,000 MT

## PARTIES
Owners: Northern Shipping Lines AS
Charterers: Global Trading Company Ltd

## VOYAGE TERMS

### Loading Port: ${loadPort}
ETA: 15th March 2026
Laytime: 72 hours SHINC

### Discharge Port: ${dischargePort}
Expected: 25th March 2026
Laytime: 72 hours SHINC

## CARGO
Description: Steel coils in containers
Quantity: 15,000 MT (±5% MOLOO)

## FREIGHT RATE
Rate: USD 45.00 per metric ton
Payment: 95% on signing B/L, 5% on completion

## LAYTIME AND DEMURRAGE

### Clause 3.1: Laytime Calculation
Laytime commences 6 hours after Notice of Readiness.
Allowed: 72 hours at loading, 72 hours at discharge.

### Clause 3.2: Exceptions
Laytime does not count during:
- Adverse weather preventing cargo operations
- Strikes or labor disturbances
- Port congestion
- Customs inspections

### Clause 3.3: Demurrage Rate
See Appendix C for calculation details.
Rate: USD 5,000 per day or pro-rata
Payment: Within 30 days with documentation

## APPENDIX C: Demurrage Calculation
Calculation formula:
1. Total laytime: 72 hours
2. Time used: Actual time from NOR to completion
3. Excess time: Time used minus laytime allowed
4. Demurrage: Excess × USD 5,000/day

Example:
- Allowed: 72 hours (3 days)
- Used: 96 hours (4 days)
- Excess: 24 hours (1 day)
- Demurrage: USD 5,000

Exceptions per Clause 3.2 deducted from time used.

## ICE CLAUSE (Clause 28)
Vessel not ordered to ice-bound ports unless Master approves.
Ice-breaking: Charterer's responsibility.
Deviation rights: Per Clause 15.
Reference: BIMCO Ice Clause 2006.
`.trim();
}

/**
 * Parse structure into tree (simplified for testing)
 */
function parseStructure(content) {
  const lines = content.split('\n');
  const nodes = [];
  const crossRefs = [];
  let currentSection = '';
  let pageNum = 1;

  lines.forEach((line, i) => {
    line = line.trim();

    if (line.startsWith('## ')) {
      const title = line.replace('## ', '');
      currentSection = title;
      nodes.push({
        id: `section-${nodes.length}`,
        level: 1,
        title,
        pageNumber: pageNum,
        content: line
      });
    } else if (line.startsWith('### ')) {
      const title = line.replace('### ', '');
      nodes.push({
        id: `section-${nodes.length}`,
        level: 2,
        title,
        pageNumber: pageNum,
        content: line,
        parentSection: currentSection
      });
    }

    // Detect cross-references
    if (line.includes('See Appendix') || line.includes('per Clause') || line.includes('Reference:')) {
      const match = line.match(/(Appendix [A-Z]|Clause [\d.]+)/);
      crossRefs.push({
        sourceLocation: `Page ${pageNum}, ${currentSection}`,
        targetLocation: match ? match[0] : 'Unknown',
        referenceText: line
      });
    }

    // Page breaks (~50 lines per page)
    if (i % 50 === 0 && i > 0) pageNum++;
  });

  return {
    nodes,
    crossReferences: crossRefs,
    metadata: {
      totalPages: pageNum,
      totalSections: nodes.length,
      totalCrossRefs: crossRefs.length
    }
  };
}

/**
 * Create sample documents
 */
async function createSamples() {
  console.log('\n🚀 Creating Sample Charter Party Data for PageIndex\n');

  const samples = [
    {
      id: 'charter-baltic-001',
      title: 'Baltic Voyage Charter - MV Northern Star',
      docType: 'charter_party',
      vessels: 'MV Northern Star',
      content: generateCharterParty('Baltic Voyage', 'MV Northern Star', 'Hamburg', 'Rotterdam')
    },
    {
      id: 'charter-pacific-002',
      title: 'Time Charter - MV Atlantic Wave',
      docType: 'charter_party',
      vessels: 'MV Atlantic Wave',
      content: generateCharterParty('Time Charter', 'MV Atlantic Wave', 'Singapore', 'Tokyo')
    },
    {
      id: 'charter-trade-003',
      title: 'Bareboat Charter - MV Pacific Trader',
      docType: 'charter_party',
      vessels: 'MV Pacific Trader',
      content: generateCharterParty('Bareboat', 'MV Pacific Trader', 'Los Angeles', 'Shanghai')
    }
  ];

  const results = [];

  for (const sample of samples) {
    const start = Date.now();

    try {
      console.log(`📄 Creating: ${sample.title}`);

      // Parse structure
      const structure = parseStructure(sample.content);

      // Check if document already exists
      const existing = await prisma.maritimeDocument.findFirst({
        where: { documentId: sample.id }
      });

      let doc;
      if (existing) {
        console.log(`   Document already exists, skipping...`);
        doc = existing;
      } else {
        // Create document in maritimeDocument table
        doc = await prisma.maritimeDocument.create({
          data: {
            documentId: sample.id,
            title: sample.title,
            content: sample.content,
            docType: sample.docType,
            vesselNames: [sample.vessels],
            organizationId: 'demo-org-001'
          }
        });
      }

      // Create index structure
      const index = {
        documentId: sample.id,
        tree: structure,
        metadata: {
          title: sample.title,
          docType: sample.docType,
          pageCount: structure.metadata.totalPages
        }
      };

      // Check if index already exists
      const existingIndex = await prisma.documentIndex.findFirst({
        where: { documentId: sample.id }
      });

      if (existingIndex) {
        console.log(`   Index already exists, skipping...`);
      } else {
        // Store in documentIndex table
        await prisma.documentIndex.create({
          data: {
            documentId: sample.id,
            indexType: 'pageindex_tree',
            indexData: index,
            version: '1.0'
          }
        });
      }

      const duration = Date.now() - start;

      results.push({
        title: sample.title,
        documentId: sample.id,
        status: 'success',
        nodes: structure.nodes.length,
        crossRefs: structure.crossReferences.length,
        pages: structure.metadata.totalPages,
        duration
      });

      console.log(`✅ Success (${duration}ms)`);
      console.log(`   Document ID: ${sample.id}`);
      console.log(`   Nodes: ${structure.nodes.length}`);
      console.log(`   Cross-refs: ${structure.crossReferences.length}`);
      console.log(`   Pages: ${structure.metadata.totalPages}\n`);

    } catch (error) {
      console.error(`❌ Failed: ${error.message}\n`);
      results.push({
        title: sample.title,
        status: 'failed',
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Print summary
 */
function printSummary(results) {
  console.log('='.repeat(60));
  console.log('SAMPLE DATA CREATION SUMMARY');
  console.log('='.repeat(60) + '\n');

  const success = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status === 'failed');

  console.log(`Total: ${results.length}`);
  console.log(`✅ Success: ${success.length}`);
  console.log(`❌ Failed: ${failed.length}\n`);

  if (success.length > 0) {
    console.log('Successfully Created:');
    success.forEach(r => {
      console.log(`  • ${r.title}`);
      console.log(`    - Document ID: ${r.documentId}`);
      console.log(`    - Nodes: ${r.nodes} | Cross-refs: ${r.crossRefs} | Pages: ${r.pages}`);
      console.log(`    - Duration: ${r.duration}ms`);
    });

    const totalNodes = success.reduce((sum, r) => sum + (r.nodes || 0), 0);
    const totalCrossRefs = success.reduce((sum, r) => sum + (r.crossRefs || 0), 0);
    const avgDuration = success.reduce((sum, r) => sum + (r.duration || 0), 0) / success.length;

    console.log(`\nStatistics:`);
    console.log(`  Total Nodes: ${totalNodes}`);
    console.log(`  Total Cross-refs: ${totalCrossRefs}`);
    console.log(`  Avg Duration: ${avgDuration.toFixed(0)}ms`);
  }

  if (failed.length > 0) {
    console.log('\n❌ Failed:');
    failed.forEach(r => {
      console.log(`  • ${r.title}: ${r.error}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Sample charter parties ready for PageIndex testing!');
  console.log('\nNext steps:');
  console.log('1. Enable PageIndex router in .env (ENABLE_PAGEINDEX_ROUTER=true)');
  console.log('2. Publish @ankr/rag-router and @ankr/pageindex packages');
  console.log('3. Test queries via GraphQL:');
  console.log('   query { askMari8xRAG(question: "demurrage rate", method: PAGEINDEX) { answer } }');
  console.log('\n');
}

/**
 * Main execution
 */
async function main() {
  try {
    const results = await createSamples();
    printSummary(results);

    const successCount = results.filter(r => r.status === 'success').length;
    process.exit(successCount === results.length ? 0 : 1);
  } catch (error) {
    console.error(`\n❌ Fatal Error: ${error.message}\n`);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
