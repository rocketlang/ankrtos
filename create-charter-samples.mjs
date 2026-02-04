import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://ankr:indrA@0612@localhost:5432/freightbox' }}});

const samples = [
  { id: 'charter-baltic-001', title: 'Baltic Voyage Charter - MV Northern Star', vessel: 'MV Northern Star' },
  { id: 'charter-pacific-002', title: 'Pacific Time Charter - MV Atlantic Wave', vessel: 'MV Atlantic Wave' },
  { id: 'charter-trade-003', title: 'Bareboat Charter - MV Pacific Trader', vessel: 'MV Pacific Trader' }
];

console.log('\n🚀 Creating 3 Charter Party Samples\n');

for (const s of samples) {
  try {
    const content = `# CHARTER PARTY\n\n## VESSEL: ${s.vessel}\n\n## LAYTIME & DEMURRAGE\n\n### Clause 3.3: Demurrage Rate\nSee Appendix C.\nRate: USD 5,000/day.\n\n## APPENDIX C\nDemurrage: Excess × USD 5,000/day`;
    
    await prisma.maritimeDocument.upsert({
      where: { id: s.id },
      update: { title: s.title, content, docType: 'charter_party', vesselNames: [s.vessel], organizationId: 'demo-org-001' },
      create: { id: s.id, title: s.title, content, docType: 'charter_party', vesselNames: [s.vessel], organizationId: 'demo-org-001', createdAt: new Date() }
    });

    await prisma.documentIndex.upsert({
      where: { documentId: s.id },
      update: { indexData: { tree: { nodes: 5, crossRefs: 1 }} },
      create: { documentId: s.id, indexType: 'pageindex_tree', indexData: { tree: { nodes: 5, crossRefs: 1 }}, version: '1.0', createdAt: new Date() }
    });

    console.log(`✅ ${s.title}`);
  } catch (e) {
    console.error(`❌ ${s.title}: ${e.message}`);
  }
}

await prisma.$disconnect();
console.log('\n✅ Complete! 3 charter parties indexed for PageIndex.\n');
