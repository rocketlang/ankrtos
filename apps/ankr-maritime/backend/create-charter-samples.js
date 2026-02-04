const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function generateCharterParty(type, vesselName, loadPort, dischargePort) {
  return `# ${type} CHARTER PARTY

## VESSEL DETAILS
Vessel: ${vesselName}, IMO: 9234567, DWT: 75,000 MT

## VOYAGE TERMS
Loading: ${loadPort} - Laytime: 72hrs SHINC
Discharge: ${dischargePort} - Laytime: 72hrs SHINC

## FREIGHT
Rate: USD 45.00/MT
Payment: 95% on B/L, 5% on discharge

## LAYTIME & DEMURRAGE

### Clause 3.1: Laytime Calculation
Laytime commences 6 hours after NOR.

### Clause 3.2: Exceptions
Weather, strikes, port congestion, inspections.

### Clause 3.3: Demurrage Rate
See Appendix C for details.
Rate: USD 5,000/day pro-rata.

## APPENDIX C: Demurrage Calculation
Formula: Excess time × USD 5,000/day
Example: 24hrs excess = USD 5,000

## ICE CLAUSE (Clause 28)
Reference: BIMCO Ice Clause 2006.
Per Clause 15 deviation rights.`;
}

async function createSamples() {
  console.log('\n🚀 Creating Charter Party Samples\n');

  const samples = [
    { id: 'charter-001', title: 'Baltic Voyage - MV Northern Star', vessel: 'MV Northern Star', from: 'Hamburg', to: 'Rotterdam' },
    { id: 'charter-002', title: 'Time Charter - MV Atlantic Wave', vessel: 'MV Atlantic Wave', from: 'Singapore', to: 'Tokyo' },
    { id: 'charter-003', title: 'Bareboat - MV Pacific Trader', vessel: 'MV Pacific Trader', from: 'Los Angeles', to: 'Shanghai' }
  ];

  for (const s of samples) {
    try {
      const content = generateCharterParty('Voyage', s.vessel, s.from, s.to);
      
      await prisma.maritimeDocument.upsert({
        where: { id: s.id },
        update: { title: s.title, content, docType: 'charter_party', vesselNames: [s.vessel] },
        create: { id: s.id, title: s.title, content, docType: 'charter_party', vesselNames: [s.vessel], organizationId: 'demo-org-001', createdAt: new Date() }
      });

      const index = {
        documentId: s.id,
        tree: { nodes: [{ id: 's1', title: 'Main', content }], crossReferences: [{ source: 'Clause 3.3', target: 'Appendix C' }] },
        metadata: { title: s.title, pageCount: 5 }
      };

      await prisma.documentIndex.upsert({
        where: { documentId: s.id },
        update: { indexData: index },
        create: { documentId: s.id, indexType: 'pageindex_tree', indexData: index, version: '1.0', createdAt: new Date() }
      });

      console.log(`✅ ${s.title}`);
    } catch (e) {
      console.error(`❌ ${s.title}: ${e.message}`);
    }
  }

  await prisma.$disconnect();
  console.log('\n✅ Done! 3 charter parties indexed.\n');
}

createSamples();
