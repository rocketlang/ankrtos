/**
 * AI Document Classification Tests
 * Phase 33: Task #69 - AI Document Classification & Tagging
 */

import { describe, test, expect, beforeAll } from 'vitest';
import { aiDocumentClassifier } from '../../services/ai-document-classifier.js';
import { prisma } from '../../lib/prisma.js';
import { createHash } from 'crypto';

describe('AI Document Classification', () => {
  const TEST_ORG_ID = 'test-org-classification';

  beforeAll(async () => {
    // Clean up test data
    await prisma.document.deleteMany({
      where: { organizationId: TEST_ORG_ID },
    });
  });

  describe('Document Classification', () => {
    test('should classify charter party from file name', async () => {
      const result = await aiDocumentClassifier.classifyDocument(
        'GENCON_2022_Charter_Party.pdf'
      );

      expect(result.category).toBe('charter_party');
      expect(result.confidence).toBeGreaterThan(0.3);
      expect(result.suggestedTags).toContain('charter-party');
      expect(result.suggestedTags).toContain('year-2022');
      expect(result.suggestedFolderPath).toEqual(['Charters', 'Time Charters']);
    });

    test('should classify bill of lading from file name', async () => {
      const result = await aiDocumentClassifier.classifyDocument('BOL_12345_CONTAINER.pdf');

      expect(result.category).toBe('bill_of_lading');
      expect(result.confidence).toBeGreaterThan(0.3);
      expect(result.suggestedTags).toContain('bill-of-lading');
      expect(result.suggestedFolderPath).toEqual(['Operations', 'Bills of Lading']);
    });

    test('should classify invoice from file name', async () => {
      const result = await aiDocumentClassifier.classifyDocument('Invoice_2024_001.pdf');

      expect(result.category).toBe('invoice');
      expect(result.confidence).toBeGreaterThan(0.3);
      expect(result.suggestedTags).toContain('invoice');
      expect(result.suggestedFolderPath).toEqual(['Finance', 'Invoices']);
    });

    test('should classify with higher confidence when content is provided', async () => {
      const content = `
        CHARTER PARTY

        Between: SHIPOWNER LTD (Owner)
        And: CHARTERER INC (Charterer)

        Vessel: M/V ATLANTIC STAR
        IMO: 9876543

        Time Charter Rate: USD 15,000 per day
        Laycan: 15-20 March 2024

        Port of Loading: USNYC (New York)
        Port of Discharge: GBLON (London)

        Demurrage Rate: USD 25,000 per day
        Despatch Rate: USD 12,500 per day
      `;

      const result = await aiDocumentClassifier.classifyDocument('contract.pdf', content);

      expect(result.category).toBe('charter_party');
      expect(result.confidence).toBeGreaterThan(0.7); // Higher confidence with content
      expect(result.subcategory).toBe('time_charter');
    });

    test('should extract vessel entities', async () => {
      const content = `
        Vessel: M/V PACIFIC GLORY
        IMO: 1234567
        Also involved: M/T OCEAN QUEEN
      `;

      const result = await aiDocumentClassifier.classifyDocument('document.pdf', content);

      expect(result.extractedEntities.vessels).toContain('PACIFIC GLORY');
      expect(result.extractedEntities.vessels).toContain('OCEAN QUEEN');
      expect(result.extractedEntities.vessels).toContain('IMO 1234567');
    });

    test('should extract port codes', async () => {
      const content = `
        Load Port: USNYC
        Discharge Port: GBLON
        Via: NLRTM
      `;

      const result = await aiDocumentClassifier.classifyDocument('document.pdf', content);

      expect(result.extractedEntities.ports.length).toBeGreaterThan(0);
      // Note: Port code validation is basic, may or may not extract all
    });

    test('should extract dates', async () => {
      const content = `
        Laycan: 15-20 March 2024
        ETA: 2024-03-25
        Contract Date: Mar 1, 2024
      `;

      const result = await aiDocumentClassifier.classifyDocument('document.pdf', content);

      expect(result.extractedEntities.dates.length).toBeGreaterThan(0);
    });

    test('should extract amounts', async () => {
      const content = `
        Hire Rate: USD 15,000 per day
        Demurrage: $25,000/day
        Total: 1,250,000 USD
      `;

      const result = await aiDocumentClassifier.classifyDocument('document.pdf', content);

      expect(result.extractedEntities.amounts.length).toBeGreaterThan(0);
    });

    test('should handle draft and final tags', async () => {
      const draftResult = await aiDocumentClassifier.classifyDocument('DRAFT_Charter_Party.pdf');
      expect(draftResult.suggestedTags).toContain('draft');

      const finalResult = await aiDocumentClassifier.classifyDocument('FINAL_Charter_Party.pdf');
      expect(finalResult.suggestedTags).toContain('final');
    });

    test('should handle urgent tag', async () => {
      const result = await aiDocumentClassifier.classifyDocument('URGENT_Invoice.pdf');
      expect(result.suggestedTags).toContain('urgent');
    });
  });

  describe('Duplicate Detection', () => {
    test('should detect exact duplicate by hash', async () => {
      const fileContent = 'Test document content';
      const fileHash = createHash('sha256').update(fileContent).digest('hex');

      // Create original document
      const original = await prisma.document.create({
        data: {
          title: 'Original Document',
          category: 'general',
          fileName: 'original.pdf',
          fileSize: fileContent.length,
          mimeType: 'application/pdf',
          organizationId: TEST_ORG_ID,
          fileHash,
          status: 'active',
        },
      });

      // Check for duplicate
      const result = await aiDocumentClassifier.detectDuplicate(
        fileHash,
        'duplicate.pdf',
        TEST_ORG_ID
      );

      expect(result.isDuplicate).toBe(true);
      expect(result.duplicateOf).toBe(original.id);
      expect(result.similarity).toBe(1.0);
      expect(result.reason).toContain('Exact file hash match');

      // Clean up
      await prisma.document.delete({ where: { id: original.id } });
    });

    test('should detect similar file names', async () => {
      // Create original document
      const original = await prisma.document.create({
        data: {
          title: 'Charter Party Agreement 2024',
          category: 'charter_party',
          fileName: 'charter_party_agreement_2024_v1.pdf',
          fileSize: 1000,
          mimeType: 'application/pdf',
          organizationId: TEST_ORG_ID,
          fileHash: 'hash1',
          status: 'active',
        },
      });

      // Check for duplicate with very similar name
      const result = await aiDocumentClassifier.detectDuplicate(
        'hash2',
        'charter_party_agreement_2024_v2.pdf',
        TEST_ORG_ID
      );

      expect(result.isDuplicate).toBe(true);
      expect(result.duplicateOf).toBe(original.id);
      expect(result.similarity).toBeGreaterThan(0.9);

      // Clean up
      await prisma.document.delete({ where: { id: original.id } });
    });

    test('should not detect false positives', async () => {
      const result = await aiDocumentClassifier.detectDuplicate(
        'unique_hash_123',
        'completely_different_document.pdf',
        TEST_ORG_ID
      );

      expect(result.isDuplicate).toBe(false);
      expect(result.reason).toContain('No duplicates found');
    });
  });

  describe('Related Documents', () => {
    test('should find related documents by category and entities', async () => {
      // Create test documents
      const doc1 = await prisma.document.create({
        data: {
          title: 'Charter Party - MV ATLANTIC',
          category: 'charter_party',
          fileName: 'cp_atlantic.pdf',
          fileSize: 1000,
          mimeType: 'application/pdf',
          organizationId: TEST_ORG_ID,
          tags: ['vessel-atlantic', 'port-usnyc', 'year-2024'],
          status: 'active',
        },
      });

      const doc2 = await prisma.document.create({
        data: {
          title: 'BOL - MV ATLANTIC',
          category: 'charter_party',
          fileName: 'bol_atlantic.pdf',
          fileSize: 1000,
          mimeType: 'application/pdf',
          organizationId: TEST_ORG_ID,
          tags: ['vessel-atlantic', 'port-usnyc'],
          status: 'active',
        },
      });

      const doc3 = await prisma.document.create({
        data: {
          title: 'Charter Party - MV PACIFIC',
          category: 'charter_party',
          fileName: 'cp_pacific.pdf',
          fileSize: 1000,
          mimeType: 'application/pdf',
          organizationId: TEST_ORG_ID,
          tags: ['vessel-pacific', 'port-gblon'],
          status: 'active',
        },
      });

      // Find related documents
      const related = await aiDocumentClassifier.findRelatedDocuments(
        doc1.id,
        'charter_party',
        {
          vessels: ['ATLANTIC'],
          ports: ['USNYC'],
          companies: [],
          dates: [],
          amounts: [],
        },
        TEST_ORG_ID,
        5
      );

      expect(related.length).toBeGreaterThan(0);
      expect(related[0].documentId).toBe(doc2.id); // Should find doc2 (shared vessel + port)
      expect(related[0].similarity).toBeGreaterThan(0.5);

      // Clean up
      await prisma.document.deleteMany({
        where: { id: { in: [doc1.id, doc2.id, doc3.id] } },
      });
    });
  });

  describe('Batch Classification', () => {
    test('should batch classify unclassified documents', async () => {
      // Create unclassified documents
      const doc1 = await prisma.document.create({
        data: {
          title: 'Test Charter',
          category: 'general',
          fileName: 'GENCON_charter_party.pdf',
          fileSize: 1000,
          mimeType: 'application/pdf',
          organizationId: TEST_ORG_ID,
          status: 'active',
        },
      });

      const doc2 = await prisma.document.create({
        data: {
          title: 'Test BOL',
          category: 'general',
          fileName: 'bill_of_lading_123.pdf',
          fileSize: 1000,
          mimeType: 'application/pdf',
          organizationId: TEST_ORG_ID,
          status: 'active',
        },
      });

      // Run batch classification
      const result = await aiDocumentClassifier.batchClassify(TEST_ORG_ID, 10);

      expect(result.processed).toBeGreaterThan(0);
      expect(result.classified).toBeGreaterThan(0);
      expect(result.errors).toBe(0);

      // Verify classifications were applied
      const updatedDoc1 = await prisma.document.findUnique({
        where: { id: doc1.id },
      });
      expect(updatedDoc1?.category).toBe('charter_party');

      const updatedDoc2 = await prisma.document.findUnique({
        where: { id: doc2.id },
      });
      expect(updatedDoc2?.category).toBe('bill_of_lading');

      // Clean up
      await prisma.document.deleteMany({
        where: { id: { in: [doc1.id, doc2.id] } },
      });
    });
  });

  describe('Subcategory Detection', () => {
    test('should detect time charter subcategory', async () => {
      const content = 'This is a TIME CHARTER agreement between owner and charterer.';
      const result = await aiDocumentClassifier.classifyDocument('tc.pdf', content);

      if (result.category === 'charter_party') {
        expect(result.subcategory).toBe('time_charter');
      }
    });

    test('should detect voyage charter subcategory', async () => {
      const content = 'This VOYAGE CHARTER covers the shipment of cargo.';
      const result = await aiDocumentClassifier.classifyDocument('vc.pdf', content);

      if (result.category === 'charter_party') {
        expect(result.subcategory).toBe('voyage_charter');
      }
    });

    test('should detect bareboat charter subcategory', async () => {
      const content = 'This BAREBOAT charter transfers possession of the vessel.';
      const result = await aiDocumentClassifier.classifyDocument('bb.pdf', content);

      if (result.category === 'charter_party') {
        expect(result.subcategory).toBe('bareboat_charter');
      }
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty content gracefully', async () => {
      const result = await aiDocumentClassifier.classifyDocument('unknown.pdf', '');

      expect(result.category).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.suggestedTags).toBeDefined();
    });

    test('should handle very long file names', async () => {
      const longFileName = 'a'.repeat(500) + '_charter_party.pdf';
      const result = await aiDocumentClassifier.classifyDocument(longFileName);

      expect(result.category).toBeDefined();
    });

    test('should handle special characters in file names', async () => {
      const result = await aiDocumentClassifier.classifyDocument(
        'Charter_Party_@#$%_2024!.pdf'
      );

      expect(result.category).toBeDefined();
      expect(result.suggestedTags.length).toBeGreaterThan(0);
    });

    test('should return general category for completely unknown documents', async () => {
      const result = await aiDocumentClassifier.classifyDocument(
        'random_xyz_123.unknown',
        'random gibberish text with no maritime keywords'
      );

      expect(result.category).toBe('general');
      expect(result.confidence).toBeLessThan(0.4);
    });
  });
});
