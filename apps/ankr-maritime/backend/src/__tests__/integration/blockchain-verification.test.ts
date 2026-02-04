/**
 * Blockchain Verification Integration Tests
 * Phase 33: Document Management System
 *
 * Tests blockchain-based document verification:
 * - Hash generation and storage
 * - Blockchain submission
 * - Verification status tracking
 * - Proof retrieval
 * - Tampering detection
 */

import { test, expect, describe, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
let testOrgId: string;
let testUserId: string;
let testDocumentId: string;

beforeAll(async () => {
  // Create test organization
  const org = await prisma.organization.create({
    data: {
      name: 'Test Org - Blockchain',
      slug: 'test-org-blockchain',
      status: 'active',
    },
  });
  testOrgId = org.id;

  // Create test user
  const user = await prisma.user.create({
    data: {
      email: 'user@blockchain-test.com',
      name: 'Test User',
      organizationId: testOrgId,
      role: 'user',
    },
  });
  testUserId = user.id;

  // Create test document
  const doc = await prisma.document.create({
    data: {
      title: 'Blockchain Test Document',
      category: 'charter_party',
      fileName: 'blockchain-test.pdf',
      fileSize: 1000000,
      mimeType: 'application/pdf',
      organizationId: testOrgId,
      createdById: testUserId,
      filePath: 'test/blockchain-test.pdf',
      fileHash: 'initial-hash-123',
      status: 'active',
    },
  });
  testDocumentId = doc.id;
});

afterAll(async () => {
  // Cleanup
  await prisma.blockchainVerification.deleteMany({ where: { documentId: testDocumentId } });
  await prisma.document.deleteMany({ where: { organizationId: testOrgId } });
  await prisma.user.deleteMany({ where: { organizationId: testOrgId } });
  await prisma.organization.deleteMany({ where: { id: testOrgId } });

  await prisma.$disconnect();
});

describe('Hash Generation', () => {
  test('should generate SHA-256 hash from buffer', () => {
    const buffer = Buffer.from('test document content');
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    expect(hash).toBeTruthy();
    expect(hash).toHaveLength(64); // SHA-256 produces 64-char hex string
    expect(hash).toMatch(/^[a-f0-9]{64}$/); // Only hex characters
  });

  test('should generate consistent hash for same content', () => {
    const content = 'test document content';
    const hash1 = crypto.createHash('sha256').update(content).digest('hex');
    const hash2 = crypto.createHash('sha256').update(content).digest('hex');

    expect(hash1).toBe(hash2);
  });

  test('should generate different hashes for different content', () => {
    const hash1 = crypto.createHash('sha256').update('content1').digest('hex');
    const hash2 = crypto.createHash('sha256').update('content2').digest('hex');

    expect(hash1).not.toBe(hash2);
  });
});

describe('Blockchain Verification Record Creation', () => {
  let verificationId: string;

  test('should create blockchain verification record', async () => {
    const fileHash = crypto.createHash('sha256')
      .update('test document content')
      .digest('hex');

    const verification = await prisma.blockchainVerification.create({
      data: {
        documentId: testDocumentId,
        fileHash,
        blockchainType: 'ethereum',
        status: 'pending',
        createdById: testUserId,
      },
    });

    expect(verification).toBeTruthy();
    expect(verification.id).toBeTruthy();
    expect(verification.fileHash).toBe(fileHash);
    expect(verification.status).toBe('pending');
    expect(verification.blockchainType).toBe('ethereum');

    verificationId = verification.id;
  });

  test('should retrieve verification by document ID', async () => {
    const verifications = await prisma.blockchainVerification.findMany({
      where: { documentId: testDocumentId },
    });

    expect(verifications.length).toBeGreaterThan(0);
    expect(verifications[0].documentId).toBe(testDocumentId);
  });

  test('should update verification status', async () => {
    await prisma.blockchainVerification.update({
      where: { id: verificationId },
      data: {
        status: 'submitted',
        transactionHash: '0x1234567890abcdef',
        submittedAt: new Date(),
      },
    });

    const verification = await prisma.blockchainVerification.findUnique({
      where: { id: verificationId },
    });

    expect(verification?.status).toBe('submitted');
    expect(verification?.transactionHash).toBe('0x1234567890abcdef');
    expect(verification?.submittedAt).toBeTruthy();
  });
});

describe('Blockchain Submission Flow', () => {
  let documentId: string;

  beforeEach(async () => {
    const doc = await prisma.document.create({
      data: {
        title: 'Submission Test Document',
        category: 'bol',
        fileName: 'submission-test.pdf',
        fileSize: 500000,
        mimeType: 'application/pdf',
        organizationId: testOrgId,
        createdById: testUserId,
        filePath: 'test/submission-test.pdf',
        fileHash: 'submission-hash-456',
        status: 'active',
      },
    });
    documentId = doc.id;
  });

  test('should create verification with pending status', async () => {
    const verification = await prisma.blockchainVerification.create({
      data: {
        documentId,
        fileHash: 'submission-hash-456',
        blockchainType: 'ethereum',
        status: 'pending',
        createdById: testUserId,
      },
    });

    expect(verification.status).toBe('pending');
    expect(verification.transactionHash).toBeNull();
    expect(verification.blockHash).toBeNull();
    expect(verification.submittedAt).toBeNull();
  });

  test('should update to submitted status after blockchain submission', async () => {
    const verification = await prisma.blockchainVerification.findFirst({
      where: { documentId },
    });

    const updated = await prisma.blockchainVerification.update({
      where: { id: verification!.id },
      data: {
        status: 'submitted',
        transactionHash: '0xabcdef1234567890',
        submittedAt: new Date(),
      },
    });

    expect(updated.status).toBe('submitted');
    expect(updated.transactionHash).toBe('0xabcdef1234567890');
    expect(updated.submittedAt).toBeTruthy();
  });

  test('should update to verified status after confirmation', async () => {
    const verification = await prisma.blockchainVerification.findFirst({
      where: { documentId },
    });

    const updated = await prisma.blockchainVerification.update({
      where: { id: verification!.id },
      data: {
        status: 'verified',
        blockHash: '0x9876543210fedcba',
        blockNumber: 12345678,
        verifiedAt: new Date(),
      },
    });

    expect(updated.status).toBe('verified');
    expect(updated.blockHash).toBe('0x9876543210fedcba');
    expect(updated.blockNumber).toBe(12345678);
    expect(updated.verifiedAt).toBeTruthy();
  });

  test('should handle failed submission', async () => {
    const verification = await prisma.blockchainVerification.findFirst({
      where: { documentId },
    });

    const updated = await prisma.blockchainVerification.update({
      where: { id: verification!.id },
      data: {
        status: 'failed',
        errorMessage: 'Insufficient gas',
        errorCode: 'GAS_TOO_LOW',
      },
    });

    expect(updated.status).toBe('failed');
    expect(updated.errorMessage).toBe('Insufficient gas');
    expect(updated.errorCode).toBe('GAS_TOO_LOW');
  });
});

describe('Verification Proof', () => {
  let documentId: string;
  let verificationId: string;

  beforeEach(async () => {
    const doc = await prisma.document.create({
      data: {
        title: 'Proof Test Document',
        category: 'compliance',
        fileName: 'proof-test.pdf',
        fileSize: 750000,
        mimeType: 'application/pdf',
        organizationId: testOrgId,
        createdById: testUserId,
        filePath: 'test/proof-test.pdf',
        fileHash: 'proof-hash-789',
        status: 'active',
      },
    });
    documentId = doc.id;

    const verification = await prisma.blockchainVerification.create({
      data: {
        documentId,
        fileHash: 'proof-hash-789',
        blockchainType: 'ethereum',
        status: 'verified',
        transactionHash: '0xproof123',
        blockHash: '0xblock456',
        blockNumber: 99999999,
        createdById: testUserId,
        submittedAt: new Date(),
        verifiedAt: new Date(),
        proof: {
          merkleRoot: '0xmerkle789',
          merkleProof: ['0xleaf1', '0xleaf2', '0xleaf3'],
          timestamp: new Date().toISOString(),
        },
      },
    });
    verificationId = verification.id;
  });

  test('should store verification proof', async () => {
    const verification = await prisma.blockchainVerification.findUnique({
      where: { id: verificationId },
    });

    expect(verification?.proof).toBeTruthy();
    expect(verification?.proof).toHaveProperty('merkleRoot', '0xmerkle789');
    expect(verification?.proof).toHaveProperty('merkleProof');
    expect((verification?.proof as any).merkleProof).toHaveLength(3);
  });

  test('should generate verification proof URL', () => {
    const transactionHash = '0xproof123';
    const blockchainType = 'ethereum';
    const network = 'mainnet';

    let explorerUrl: string;
    if (blockchainType === 'ethereum') {
      explorerUrl = `https://etherscan.io/tx/${transactionHash}`;
    } else if (blockchainType === 'polygon') {
      explorerUrl = `https://polygonscan.com/tx/${transactionHash}`;
    } else {
      explorerUrl = transactionHash;
    }

    expect(explorerUrl).toBe(`https://etherscan.io/tx/${transactionHash}`);
  });

  test('should include metadata in proof', async () => {
    const verification = await prisma.blockchainVerification.findUnique({
      where: { id: verificationId },
    });

    expect(verification?.proof).toBeTruthy();
    expect(verification?.proof).toHaveProperty('timestamp');
  });
});

describe('Tampering Detection', () => {
  test('should detect tampered document via hash mismatch', async () => {
    // Original document hash
    const originalHash = crypto.createHash('sha256')
      .update('original content')
      .digest('hex');

    // Create verification
    const doc = await prisma.document.create({
      data: {
        title: 'Tampering Test',
        category: 'charter_party',
        fileName: 'tampering-test.pdf',
        fileSize: 100000,
        mimeType: 'application/pdf',
        organizationId: testOrgId,
        createdById: testUserId,
        filePath: 'test/tampering-test.pdf',
        fileHash: originalHash,
        status: 'active',
      },
    });

    const verification = await prisma.blockchainVerification.create({
      data: {
        documentId: doc.id,
        fileHash: originalHash,
        blockchainType: 'ethereum',
        status: 'verified',
        createdById: testUserId,
      },
    });

    // Simulate document modification (new hash)
    const tamperedHash = crypto.createHash('sha256')
      .update('tampered content')
      .digest('hex');

    // Verify: hashes should not match
    expect(tamperedHash).not.toBe(originalHash);

    // In real implementation, this would trigger a tampering alert
    const isTampered = tamperedHash !== verification.fileHash;
    expect(isTampered).toBe(true);
  });

  test('should verify document integrity via hash match', async () => {
    const content = 'verified content';
    const hash = crypto.createHash('sha256').update(content).digest('hex');

    const doc = await prisma.document.create({
      data: {
        title: 'Integrity Test',
        category: 'bol',
        fileName: 'integrity-test.pdf',
        fileSize: 200000,
        mimeType: 'application/pdf',
        organizationId: testOrgId,
        createdById: testUserId,
        filePath: 'test/integrity-test.pdf',
        fileHash: hash,
        status: 'active',
      },
    });

    const verification = await prisma.blockchainVerification.create({
      data: {
        documentId: doc.id,
        fileHash: hash,
        blockchainType: 'ethereum',
        status: 'verified',
        createdById: testUserId,
      },
    });

    // Re-calculate hash from same content
    const recalculatedHash = crypto.createHash('sha256').update(content).digest('hex');

    // Verify: hashes should match
    expect(recalculatedHash).toBe(verification.fileHash);
    const isIntact = recalculatedHash === verification.fileHash;
    expect(isIntact).toBe(true);
  });
});

describe('Multiple Blockchain Support', () => {
  let documentId: string;

  beforeEach(async () => {
    const doc = await prisma.document.create({
      data: {
        title: 'Multi-Chain Test',
        category: 'compliance',
        fileName: 'multi-chain.pdf',
        fileSize: 300000,
        mimeType: 'application/pdf',
        organizationId: testOrgId,
        createdById: testUserId,
        filePath: 'test/multi-chain.pdf',
        fileHash: 'multi-chain-hash',
        status: 'active',
      },
    });
    documentId = doc.id;
  });

  test('should support Ethereum blockchain', async () => {
    const verification = await prisma.blockchainVerification.create({
      data: {
        documentId,
        fileHash: 'multi-chain-hash',
        blockchainType: 'ethereum',
        status: 'verified',
        createdById: testUserId,
        network: 'mainnet',
      },
    });

    expect(verification.blockchainType).toBe('ethereum');
    expect(verification.network).toBe('mainnet');
  });

  test('should support Polygon blockchain', async () => {
    const verification = await prisma.blockchainVerification.create({
      data: {
        documentId,
        fileHash: 'multi-chain-hash',
        blockchainType: 'polygon',
        status: 'verified',
        createdById: testUserId,
        network: 'mainnet',
      },
    });

    expect(verification.blockchainType).toBe('polygon');
  });

  test('should support IPFS storage', async () => {
    const verification = await prisma.blockchainVerification.create({
      data: {
        documentId,
        fileHash: 'multi-chain-hash',
        blockchainType: 'ipfs',
        status: 'verified',
        createdById: testUserId,
        ipfsHash: 'Qm123abc456def',
      },
    });

    expect(verification.blockchainType).toBe('ipfs');
    expect(verification.ipfsHash).toBe('Qm123abc456def');
  });
});

describe('Verification Query Operations', () => {
  beforeEach(async () => {
    // Create multiple verifications with different statuses
    const doc1 = await prisma.document.create({
      data: {
        title: 'Query Test 1',
        category: 'charter_party',
        fileName: 'query-1.pdf',
        fileSize: 100000,
        mimeType: 'application/pdf',
        organizationId: testOrgId,
        createdById: testUserId,
        filePath: 'test/query-1.pdf',
        fileHash: 'query-hash-1',
        status: 'active',
      },
    });

    const doc2 = await prisma.document.create({
      data: {
        title: 'Query Test 2',
        category: 'bol',
        fileName: 'query-2.pdf',
        fileSize: 200000,
        mimeType: 'application/pdf',
        organizationId: testOrgId,
        createdById: testUserId,
        filePath: 'test/query-2.pdf',
        fileHash: 'query-hash-2',
        status: 'active',
      },
    });

    await prisma.blockchainVerification.createMany({
      data: [
        {
          documentId: doc1.id,
          fileHash: 'query-hash-1',
          blockchainType: 'ethereum',
          status: 'verified',
          createdById: testUserId,
        },
        {
          documentId: doc2.id,
          fileHash: 'query-hash-2',
          blockchainType: 'polygon',
          status: 'pending',
          createdById: testUserId,
        },
      ],
    });
  });

  test('should query verifications by status', async () => {
    const verifiedRecords = await prisma.blockchainVerification.findMany({
      where: { status: 'verified' },
    });

    expect(verifiedRecords.length).toBeGreaterThan(0);
    verifiedRecords.forEach((record) => {
      expect(record.status).toBe('verified');
    });
  });

  test('should query verifications by blockchain type', async () => {
    const ethereumRecords = await prisma.blockchainVerification.findMany({
      where: { blockchainType: 'ethereum' },
    });

    expect(ethereumRecords.length).toBeGreaterThan(0);
    ethereumRecords.forEach((record) => {
      expect(record.blockchainType).toBe('ethereum');
    });
  });

  test('should query verifications with document details', async () => {
    const verifications = await prisma.blockchainVerification.findMany({
      where: {
        document: {
          organizationId: testOrgId,
        },
      },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
    });

    expect(verifications.length).toBeGreaterThan(0);
    verifications.forEach((verification) => {
      expect(verification.document).toBeTruthy();
      expect(verification.document.title).toBeTruthy();
    });
  });

  test('should count verifications by status', async () => {
    const pendingCount = await prisma.blockchainVerification.count({
      where: { status: 'pending' },
    });

    const verifiedCount = await prisma.blockchainVerification.count({
      where: { status: 'verified' },
    });

    expect(pendingCount + verifiedCount).toBeGreaterThan(0);
  });
});

describe('Audit Trail', () => {
  test('should track creation timestamp', async () => {
    const beforeCreate = new Date();

    const verification = await prisma.blockchainVerification.create({
      data: {
        documentId: testDocumentId,
        fileHash: 'audit-hash',
        blockchainType: 'ethereum',
        status: 'pending',
        createdById: testUserId,
      },
    });

    const afterCreate = new Date();

    expect(verification.createdAt).toBeTruthy();
    expect(verification.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(verification.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
  });

  test('should track submission timestamp', async () => {
    const verification = await prisma.blockchainVerification.create({
      data: {
        documentId: testDocumentId,
        fileHash: 'audit-hash-2',
        blockchainType: 'ethereum',
        status: 'pending',
        createdById: testUserId,
      },
    });

    const beforeSubmit = new Date();

    const updated = await prisma.blockchainVerification.update({
      where: { id: verification.id },
      data: {
        status: 'submitted',
        submittedAt: new Date(),
      },
    });

    expect(updated.submittedAt).toBeTruthy();
    expect(updated.submittedAt!.getTime()).toBeGreaterThanOrEqual(beforeSubmit.getTime());
  });

  test('should track verification timestamp', async () => {
    const verification = await prisma.blockchainVerification.create({
      data: {
        documentId: testDocumentId,
        fileHash: 'audit-hash-3',
        blockchainType: 'ethereum',
        status: 'submitted',
        createdById: testUserId,
        submittedAt: new Date(),
      },
    });

    const beforeVerify = new Date();

    const updated = await prisma.blockchainVerification.update({
      where: { id: verification.id },
      data: {
        status: 'verified',
        verifiedAt: new Date(),
      },
    });

    expect(updated.verifiedAt).toBeTruthy();
    expect(updated.verifiedAt!.getTime()).toBeGreaterThanOrEqual(beforeVerify.getTime());
  });
});
