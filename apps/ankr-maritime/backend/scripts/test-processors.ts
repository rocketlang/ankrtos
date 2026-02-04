/**
 * Test Document Processors
 * Tests all document processors with sample content
 */

import { PrismaClient } from '@prisma/client';
import { processDocument, detectDocumentType } from '../src/services/processors/index.js';

const prisma = new PrismaClient();

// Sample documents
const samples = [
  {
    name: 'Charter Party',
    filename: 'gencon_charter.txt',
    content: `
VOYAGE CHARTER PARTY - GENCON 1994

Vessel: M/V PACIFIC TRADER
IMO: 9123456
DWT: 75,000 MT
Flag: Panama
Built: 2010

Owner: Pacific Shipping Ltd
Address: 123 Ocean Ave, Singapore

Charterer: Global Commodities Corp
Address: 456 Trade St, London

Broker: Maritime Solutions Inc

Loading Port: Singapore
Discharge Port: Rotterdam

Cargo: 70,000 MT of Iron Ore in bulk

Freight: USD 22.50 per MT

Laycan: 15-20 February 2026

Demurrage: USD 18,000 per day
Despatch: USD 9,000 per day

Laytime: 5 days total (3 loading + 2 discharge)
SHINC (Sundays and Holidays Included)

Ice Clause: Vessel not to be required to force ice
War Clause: Both-to-blame clause applies
`,
  },
  {
    name: 'Bill of Lading',
    filename: 'bol_sample.txt',
    content: `
BILL OF LADING

B/L Number: MAEU-2026-12345

Vessel: M/V CONTAINER EXPRESS
IMO: 9876543
Voyage: V024

SHIPPER: Electronics Manufacturing Co Ltd
Address: 789 Industrial Park, Shenzhen, China

CONSIGNEE: European Distributors AG
Address: 321 Commerce Blvd, Hamburg, Germany

PORT OF LOADING: Shenzhen, China
PORT OF DISCHARGE: Hamburg, Germany

Description of Goods: Consumer Electronics - Laptops and Tablets
Packaging: 50 containers (20ft)
Container Numbers: MAEU123456-7, MAEU123458-9, ...

Gross Weight: 1,250,000 KGS (1,250 MT)

Shipped on Board: January 15, 2026

Freight: PREPAID

Number of Original B/Ls: 3
`,
  },
  {
    name: 'Fixture Email',
    filename: 'fixture_email.txt',
    content: `
From: John Smith <john@pacificshipping.com>
To: Sarah Johnson <sarah@globalcommodities.com>
Date: January 31, 2026 14:30 GMT
Subject: URGENT - Firm Offer M/V ATLANTIC VOYAGER

Dear Sarah,

Following our conversation, please find our firm offer subjects below:

Vessel: M/V ATLANTIC VOYAGER
DWT: 82,000 MT
Built: 2015, Flag: Marshall Islands

Cargo: 75,000 MT (+/- 10%) Grain in bulk
Load: New Orleans
Discharge: Rotterdam

Laycan: March 10-15, 2026

Freight: USD 28.00 per MT FIOST

Demurrage: USD 22,000 per day
Despatch: 50% demurrage rate

Laytime: 4 WWD SHINC total

Subjects:
- Charterers approval
- Vessel's clean inspection
- Suitable berth both ends

Please confirm soonest. This offer valid until COB today.

Best regards,
John Smith
Pacific Shipping Ltd
`,
  },
  {
    name: 'Port Notice',
    filename: 'port_notice.txt',
    content: `
PORT OF SINGAPORE OPERATIONS NOTICE

Notice No: MPA-2026-0045
Date: January 31, 2026

SUBJECT: Temporary Berthing Restrictions - East Coast Terminals

Effective Date: February 5-10, 2026

Due to scheduled maintenance of Berth E12, the following restrictions apply:

- Maximum vessel LOA: 250 meters
- Maximum draft: 12 meters
- Bulk carriers only (no tankers)

Alternative Berthing: Berths E10, E11 available for larger vessels

Expected delays: 6-8 hours for vessels arriving during restriction period

For inquiries: ops@singaporeport.com

Maritime Port Authority of Singapore
`,
  },
];

async function testProcessors() {
  console.log('🧪 Testing Document Processors\n');
  console.log('='.repeat(80));

  for (const sample of samples) {
    console.log(`\n📄 Testing: ${sample.name}`);
    console.log('-'.repeat(80));

    // Detect type
    const detectedType = detectDocumentType(sample.content, sample.filename);
    console.log(`🔍 Detected Type: ${detectedType}`);

    // Process document
    const result = await processDocument(sample.content, sample.filename);

    console.log(`\n📊 Extracted Data:`);
    console.log(`   Title: ${result.title}`);
    console.log(`   Type: ${result.docType} (detected: ${result.detectedType})`);

    if (result.vessels && result.vessels.length > 0) {
      console.log(`   Vessels: ${result.vessels.length}`);
      result.vessels.forEach((v: any, i: number) => {
        console.log(`     ${i + 1}. ${v.name}${v.imo ? ` (IMO: ${v.imo})` : ''}`);
        if (v.dwt) console.log(`        DWT: ${v.dwt.toLocaleString()} MT`);
        if (v.flag) console.log(`        Flag: ${v.flag}`);
        if (v.built) console.log(`        Built: ${v.built}`);
      });
    }

    if (result.parties && result.parties.length > 0) {
      console.log(`   Parties: ${result.parties.length}`);
      result.parties.forEach((p: any, i: number) => {
        console.log(`     ${i + 1}. ${p.role}: ${p.name}`);
      });
    }

    if (result.ports && result.ports.length > 0) {
      console.log(`   Ports: ${result.ports.length}`);
      result.ports.forEach((p: any, i: number) => {
        console.log(`     ${i + 1}. ${p.name}${p.type ? ` (${p.type})` : ''}`);
      });
    }

    if (result.cargo && result.cargo.length > 0) {
      console.log(`   Cargo:`);
      result.cargo.forEach((c: any, i: number) => {
        console.log(`     ${i + 1}. ${c.description}`);
        if (c.quantity) console.log(`        Quantity: ${c.quantity.toLocaleString()} ${c.unit || ''}`);
        if (c.weight) console.log(`        Weight: ${c.weight.toLocaleString()} ${c.unit || ''}`);
      });
    }

    if (result.rates && result.rates.length > 0) {
      console.log(`   Rates:`);
      result.rates.forEach((r: any, i: number) => {
        console.log(`     ${i + 1}. ${r.type}: ${r.currency} ${r.amount.toLocaleString()}${r.unit ? ` ${r.unit}` : ''}`);
      });
    }

    if (result.metadata) {
      console.log(`   Metadata:`);
      Object.entries(result.metadata).forEach(([key, value]) => {
        if (value && typeof value === 'object') {
          console.log(`     ${key}:`, JSON.stringify(value, null, 2).replace(/\n/g, '\n       '));
        } else if (value) {
          console.log(`     ${key}: ${value}`);
        }
      });
    }

    console.log('');
  }

  console.log('='.repeat(80));
  console.log('✅ All processors tested successfully!\n');
}

// Run tests
testProcessors()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
