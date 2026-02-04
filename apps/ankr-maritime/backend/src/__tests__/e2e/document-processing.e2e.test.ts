/**
 * End-to-End Document Processing Tests
 * Phase 33: Document Management System
 *
 * Tests the complete document workflow:
 * 1. Upload → MinIO storage
 * 2. Version creation
 * 3. Thumbnail generation
 * 4. Watermarking
 * 5. OCR extraction
 * 6. Analytics tracking
 * 7. Bulk operations
 * 8. Download/retrieval
 */

import { test, expect, describe, beforeAll, afterAll } from 'vitest';
import { createServer } from '../../main';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis();

let app: any;
let testOrganizationId: string;
let testUserId: string;
let authToken: string;

// Test file paths
const TEST_FILES_DIR = path.join(__dirname, '../../__fixtures__/documents');
const TEST_PDF = path.join(TEST_FILES_DIR, 'charter-party-test.pdf');
const TEST_IMAGE = path.join(TEST_FILES_DIR, 'vessel-photo.jpg');
const TEST_DOC = path.join(TEST_FILES_DIR, 'bill-of-lading.docx');

beforeAll(async () => {
  // Start server
  app = await createServer();
  await app.listen({ port: 0 });

  // Create test organization
  const org = await prisma.organization.create({
    data: {
      name: 'Test Maritime Org',
      slug: 'test-maritime-org',
      status: 'active',
    },
  });
  testOrganizationId = org.id;

  // Create test user
  const user = await prisma.user.create({
    data: {
      email: 'test@mari8x.com',
      name: 'Test User',
      organizationId: testOrganizationId,
      role: 'admin',
    },
  });
  testUserId = user.id;

  // Generate auth token (mock JWT)
  authToken = `Bearer test-token-${testUserId}`;

  // Create test files if they don't exist
  if (!fs.existsSync(TEST_FILES_DIR)) {
    fs.mkdirSync(TEST_FILES_DIR, { recursive: true });
  }

  // Create minimal test PDF
  if (!fs.existsSync(TEST_PDF)) {
    const pdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n%%EOF');
    fs.writeFileSync(TEST_PDF, pdfContent);
  }

  // Create minimal test image
  if (!fs.existsSync(TEST_IMAGE)) {
    const imageContent = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(TEST_IMAGE, imageContent);
  }
});

afterAll(async () => {
  // Cleanup test data
  await prisma.documentAnalytics.deleteMany({ where: { documentId: { contains: 'test' } } });
  await prisma.documentVersion.deleteMany({ where: { documentId: { contains: 'test' } } });
  await prisma.document.deleteMany({ where: { organizationId: testOrganizationId } });
  await prisma.user.deleteMany({ where: { id: testUserId } });
  await prisma.organization.deleteMany({ where: { id: testOrganizationId } });

  // Close connections
  await prisma.$disconnect();
  await redis.quit();
  await app.close();
});

describe('Document Upload & Storage', () => {
  let uploadedDocumentId: string;

  test('should upload PDF document via REST API', async () => {
    const form = new FormData();
    form.append('file', fs.createReadStream(TEST_PDF), {
      filename: 'charter-party-test.pdf',
      contentType: 'application/pdf',
    });
    form.append('category', 'charter_party');
    form.append('tags', JSON.stringify(['test', 'e2e']));

    const response = await fetch(`${app.server.address()}/api/documents/upload`, {
      method: 'POST',
      headers: {
        ...form.getHeaders(),
        'Authorization': authToken,
        'X-Organization-Id': testOrganizationId,
      },
      body: form,
    });

    expect(response.status).toBe(201);
    const result = await response.json();

    expect(result.success).toBe(true);
    expect(result.document).toHaveProperty('documentId');
    expect(result.document).toHaveProperty('fileUrl');
    expect(result.document).toHaveProperty('fileHash');
    expect(result.document.versionNumber).toBe(1);

    uploadedDocumentId = result.document.documentId;

    // Verify database record
    const doc = await prisma.document.findUnique({
      where: { id: uploadedDocumentId },
    });

    expect(doc).toBeTruthy();
    expect(doc!.fileName).toBe('charter-party-test.pdf');
    expect(doc!.mimeType).toBe('application/pdf');
    expect(doc!.category).toBe('charter_party');
    expect(doc!.organizationId).toBe(testOrganizationId);
    expect(doc!.fileHash).toBeTruthy();
    expect(doc!.filePath).toContain(testOrganizationId);
  });

  test('should retrieve document metadata via GraphQL', async () => {
    const query = `
      query GetDocument($id: String!) {
        document(id: $id) {
          id
          title
          fileName
          fileSize
          mimeType
          category
          tags
          status
          viewCount
          downloadCount
        }
      }
    `;

    const response = await fetch(`${app.server.address()}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
        'X-Organization-Id': testOrganizationId,
      },
      body: JSON.stringify({
        query,
        variables: { id: uploadedDocumentId },
      }),
    });

    const result = await response.json();

    expect(result.errors).toBeUndefined();
    expect(result.data.document).toBeTruthy();
    expect(result.data.document.fileName).toBe('charter-party-test.pdf');
    expect(result.data.document.tags).toContain('test');
    expect(result.data.document.status).toBe('active');
  });

  test('should download document via presigned URL', async () => {
    const response = await fetch(`${app.server.address()}/api/documents/${uploadedDocumentId}/download`, {
      method: 'GET',
      headers: {
        'Authorization': authToken,
        'X-Organization-Id': testOrganizationId,
      },
    });

    expect(response.status).toBe(200);
    const result = await response.json();

    expect(result.success).toBe(true);
    expect(result.downloadUrl).toContain('minio');
    expect(result.downloadUrl).toContain('X-Amz-Signature');
    expect(result.fileName).toBe('charter-party-test.pdf');
  });
});

describe('Document Versioning', () => {
  let documentId: string;
  let version1Id: string;
  let version2Id: string;

  test('should create initial version on upload', async () => {
    const form = new FormData();
    form.append('file', fs.createReadStream(TEST_PDF), {
      filename: 'versioned-doc.pdf',
      contentType: 'application/pdf',
    });

    const response = await fetch(`${app.server.address()}/api/documents/upload`, {
      method: 'POST',
      headers: {
        ...form.getHeaders(),
        'Authorization': authToken,
        'X-Organization-Id': testOrganizationId,
      },
      body: form,
    });

    const result = await response.json();
    documentId = result.document.documentId;
    version1Id = result.document.versionId;

    expect(result.document.versionNumber).toBe(1);

    // Verify version record
    const version = await prisma.documentVersion.findUnique({
      where: { id: version1Id },
    });

    expect(version).toBeTruthy();
    expect(version!.versionNumber).toBe(1);
    expect(version!.documentId).toBe(documentId);
  });

  test('should create new version on re-upload', async () => {
    const form = new FormData();
    form.append('file', fs.createReadStream(TEST_PDF), {
      filename: 'versioned-doc-v2.pdf',
      contentType: 'application/pdf',
    });

    const response = await fetch(`${app.server.address()}/api/documents/${documentId}/upload-version`, {
      method: 'POST',
      headers: {
        ...form.getHeaders(),
        'Authorization': authToken,
        'X-Organization-Id': testOrganizationId,
      },
      body: form,
    });

    expect(response.status).toBe(201);
    const result = await response.json();

    expect(result.success).toBe(true);
    expect(result.version.versionNumber).toBe(2);
    version2Id = result.version.versionId;

    // Verify both versions exist
    const versions = await prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: { versionNumber: 'asc' },
    });

    expect(versions).toHaveLength(2);
    expect(versions[0].versionNumber).toBe(1);
    expect(versions[1].versionNumber).toBe(2);
  });

  test('should retrieve version history via GraphQL', async () => {
    const query = `
      query GetVersionHistory($documentId: String!) {
        documentVersions(documentId: $documentId) {
          id
          versionNumber
          fileSize
          fileHash
          createdAt
          createdBy {
            id
            name
          }
        }
      }
    `;

    const response = await fetch(`${app.server.address()}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
        'X-Organization-Id': testOrganizationId,
      },
      body: JSON.stringify({
        query,
        variables: { documentId },
      }),
    });

    const result = await response.json();

    expect(result.errors).toBeUndefined();
    expect(result.data.documentVersions).toHaveLength(2);
    expect(result.data.documentVersions[0].versionNumber).toBe(1);
    expect(result.data.documentVersions[1].versionNumber).toBe(2);
  });
});

describe('Advanced Document Processing', () => {
  let documentId: string;

  beforeAll(async () => {
    // Upload test PDF
    const form = new FormData();
    form.append('file', fs.createReadStream(TEST_PDF), {
      filename: 'advanced-test.pdf',
      contentType: 'application/pdf',
    });

    const response = await fetch(`${app.server.address()}/api/documents/upload`, {
      method: 'POST',
      headers: {
        ...form.getHeaders(),
        'Authorization': authToken,
        'X-Organization-Id': testOrganizationId,
      },
      body: form,
    });

    const result = await response.json();
    documentId = result.document.documentId;
  });

  test('should generate thumbnail via GraphQL', async () => {
    const mutation = `
      mutation GenerateThumbnail($documentId: String!, $width: Int, $height: Int) {
        generateThumbnail(documentId: $documentId, width: $width, height: $height)
      }
    `;

    const response = await fetch(`${app.server.address()}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
        'X-Organization-Id': testOrganizationId,
      },
      body: JSON.stringify({
        query: mutation,
        variables: { documentId, width: 200, height: 280 },
      }),
    });

    const result = await response.json();

    expect(result.errors).toBeUndefined();
    expect(result.data.generateThumbnail).toBeTruthy();
    expect(result.data.generateThumbnail).toContain('minio');
    expect(result.data.generateThumbnail).toContain('thumbnails');

    // Verify metadata updated
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
    });

    expect(doc!.metadata).toHaveProperty('thumbnailUrl');
  });

  test('should generate preview via GraphQL', async () => {
    const mutation = `
      mutation GeneratePreview($documentId: String!) {
        generatePreview(documentId: $documentId)
      }
    `;

    const response = await fetch(`${app.server.address()}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
        'X-Organization-Id': testOrganizationId,
      },
      body: JSON.stringify({
        query: mutation,
        variables: { documentId },
      }),
    });

    const result = await response.json();

    expect(result.errors).toBeUndefined();
    expect(result.data.generatePreview).toBeTruthy();
    expect(result.data.generatePreview).toContain('minio');
  });

  test('should add watermark to PDF', async () => {
    const mutation = `
      mutation AddWatermark($documentId: String!, $watermarkText: String!, $opacity: Float) {
        addWatermark(documentId: $documentId, watermarkText: $watermarkText, opacity: $opacity)
      }
    `;

    const response = await fetch(`${app.server.address()}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
        'X-Organization-Id': testOrganizationId,
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          documentId,
          watermarkText: 'CONFIDENTIAL - E2E TEST',
          opacity: 0.5,
        },
      }),
    });

    const result = await response.json();

    expect(result.errors).toBeUndefined();
    expect(result.data.addWatermark).toBeTruthy();
    expect(result.data.addWatermark).toContain('watermarked');

    // Verify audit log created
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        entityType: 'document',
        entityId: documentId,
        action: 'watermark_added',
      },
    });

    expect(auditLog).toBeTruthy();
  });

  test('should extract OCR text from image', async () => {
    // Skip if tesseract not available
    if (!process.env.ENABLE_OCR) {
      test.skip('OCR disabled');
      return;
    }

    const mutation = `
      mutation ExtractOCR($documentId: String!, $languages: [String!]) {
        extractTextOCR(documentId: $documentId, languages: $languages)
      }
    `;

    const response = await fetch(`${app.server.address()}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
        'X-Organization-Id': testOrganizationId,
      },
      body: JSON.stringify({
        query: mutation,
        variables: { documentId, languages: ['eng'] },
      }),
    });

    const result = await response.json();

    expect(result.errors).toBeUndefined();
    expect(result.data.extractTextOCR).toBeTruthy();

    // Verify OCR text cached in metadata
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
    });

    expect(doc!.metadata).toHaveProperty('ocrText');
  });
});

describe('Document Analytics', () => {
  let documentId: string;

  beforeAll(async () => {
    // Upload test document
    const form = new FormData();
    form.append('file', fs.createReadStream(TEST_PDF), {
      filename: 'analytics-test.pdf',
      contentType: 'application/pdf',
    });

    const response = await fetch(`${app.server.address()}/api/documents/upload`, {
      method: 'POST',
      headers: {
        ...form.getHeaders(),
        'Authorization': authToken,
        'X-Organization-Id': testOrganizationId,
      },
      body: form,
    });

    const result = await response.json();
    documentId = result.document.documentId;
  });

  test('should track document view', async () => {
    const mutation = `
      mutation TrackView($documentId: String!, $metadata: JSON) {
        trackDocumentView(documentId: $documentId, metadata: $metadata)
      }
    `;

    const response = await fetch(`${app.server.address()}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
        'X-Organization-Id': testOrganizationId,
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          documentId,
          metadata: { source: 'e2e_test', browser: 'test' },
        },
      }),
    });

    const result = await response.json();

    expect(result.errors).toBeUndefined();
    expect(result.data.trackDocumentView).toBe(true);

    // Verify analytics event created
    const analyticsEvent = await prisma.documentAnalytics.findFirst({
      where: {
        documentId,
        eventType: 'view',
      },
    });

    expect(analyticsEvent).toBeTruthy();
    expect(analyticsEvent!.metadata).toHaveProperty('source', 'e2e_test');

    // Verify view count incremented
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
    });

    expect(doc!.viewCount).toBeGreaterThan(0);
    expect(doc!.lastViewedAt).toBeTruthy();
  });

  test('should track document download', async () => {
    const mutation = `
      mutation TrackDownload($documentId: String!) {
        trackDocumentDownload(documentId: $documentId)
      }
    `;

    const response = await fetch(`${app.server.address()}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
        'X-Organization-Id': testOrganizationId,
      },
      body: JSON.stringify({
        query: mutation,
        variables: { documentId },
      }),
    });

    const result = await response.json();

    expect(result.errors).toBeUndefined();
    expect(result.data.trackDocumentDownload).toBe(true);

    // Verify download count incremented
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
    });

    expect(doc!.downloadCount).toBeGreaterThan(0);
    expect(doc!.lastDownloadedAt).toBeTruthy();
  });

  test('should retrieve document analytics', async () => {
    const query = `
      query GetAnalytics($documentId: String!, $days: Int) {
        getDocumentAnalytics(documentId: $documentId, days: $days) {
          totalViews
          totalDownloads
          lastViewedAt
          lastDownloadedAt
          recentActivity {
            days
            events
            byEventType
            uniqueUsers
          }
        }
      }
    `;

    const response = await fetch(`${app.server.address()}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
        'X-Organization-Id': testOrganizationId,
      },
      body: JSON.stringify({
        query,
        variables: { documentId, days: 30 },
      }),
    });

    const result = await response.json();

    expect(result.errors).toBeUndefined();
    expect(result.data.getDocumentAnalytics).toBeTruthy();
    expect(result.data.getDocumentAnalytics.totalViews).toBeGreaterThan(0);
    expect(result.data.getDocumentAnalytics.totalDownloads).toBeGreaterThan(0);
    expect(result.data.getDocumentAnalytics.recentActivity).toBeTruthy();
    expect(result.data.getDocumentAnalytics.recentActivity.events).toBeGreaterThan(0);
  });
});

describe('Bulk Document Operations', () => {
  let documentIds: string[] = [];

  beforeAll(async () => {
    // Upload 5 test documents
    for (let i = 0; i < 5; i++) {
      const form = new FormData();
      form.append('file', fs.createReadStream(TEST_PDF), {
        filename: `bulk-test-${i}.pdf`,
        contentType: 'application/pdf',
      });

      const response = await fetch(`${app.server.address()}/api/documents/upload`, {
        method: 'POST',
        headers: {
          ...form.getHeaders(),
          'Authorization': authToken,
          'X-Organization-Id': testOrganizationId,
        },
        body: form,
      });

      const result = await response.json();
      documentIds.push(result.document.documentId);
    }
  });

  test('should initiate bulk download', async () => {
    const mutation = `
      mutation BulkDownload($documentIds: [String!]!, $zipFileName: String) {
        bulkDownload(documentIds: $documentIds, zipFileName: $zipFileName) {
          jobId
          totalDocuments
          status
        }
      }
    `;

    const response = await fetch(`${app.server.address()}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
        'X-Organization-Id': testOrganizationId,
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          documentIds,
          zipFileName: 'e2e-test-bulk.zip',
        },
      }),
    });

    const result = await response.json();

    expect(result.errors).toBeUndefined();
    expect(result.data.bulkDownload).toBeTruthy();
    expect(result.data.bulkDownload.jobId).toBeTruthy();
    expect(result.data.bulkDownload.totalDocuments).toBe(5);
    expect(result.data.bulkDownload.status).toBe('queued');
  });

  test('should track bulk job progress', async () => {
    // First, create a bulk download job
    const mutation = `
      mutation BulkDownload($documentIds: [String!]!) {
        bulkDownload(documentIds: $documentIds) {
          jobId
        }
      }
    `;

    const createResponse = await fetch(`${app.server.address()}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
        'X-Organization-Id': testOrganizationId,
      },
      body: JSON.stringify({
        query: mutation,
        variables: { documentIds: documentIds.slice(0, 3) },
      }),
    });

    const createResult = await createResponse.json();
    const jobId = createResult.data.bulkDownload.jobId;

    // Wait a bit for job to process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check progress
    const progressQuery = `
      query GetProgress($jobId: String!, $queueName: String!) {
        getBulkJobProgress(jobId: $jobId, queueName: $queueName) {
          jobId
          status
          progress {
            percentage
            processed
            successful
            failed
          }
        }
      }
    `;

    const progressResponse = await fetch(`${app.server.address()}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
        'X-Organization-Id': testOrganizationId,
      },
      body: JSON.stringify({
        query: progressQuery,
        variables: { jobId, queueName: 'bulk-download' },
      }),
    });

    const progressResult = await progressResponse.json();

    expect(progressResult.errors).toBeUndefined();
    expect(progressResult.data.getBulkJobProgress).toBeTruthy();
    expect(['queued', 'active', 'completed']).toContain(progressResult.data.getBulkJobProgress.status);
  });

  test('should perform bulk delete', async () => {
    const mutation = `
      mutation BulkDelete($documentIds: [String!]!, $permanentDelete: Boolean) {
        bulkDelete(documentIds: $documentIds, permanentDelete: $permanentDelete) {
          jobId
          totalDocuments
          status
        }
      }
    `;

    const response = await fetch(`${app.server.address()}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
        'X-Organization-Id': testOrganizationId,
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          documentIds: documentIds.slice(0, 2),
          permanentDelete: false, // Soft delete
        },
      }),
    });

    const result = await response.json();

    expect(result.errors).toBeUndefined();
    expect(result.data.bulkDelete).toBeTruthy();
    expect(result.data.bulkDelete.totalDocuments).toBe(2);

    // Wait for job to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify documents soft-deleted
    const deletedDocs = await prisma.document.findMany({
      where: {
        id: { in: documentIds.slice(0, 2) },
      },
    });

    deletedDocs.forEach(doc => {
      expect(doc.deletedAt).toBeTruthy();
      expect(doc.status).toBe('deleted');
    });
  });

  test('should generate batch thumbnails', async () => {
    const mutation = `
      mutation BatchThumbnails($documentIds: [String!]!) {
        batchGenerateThumbnails(documentIds: $documentIds) {
          total
          successful
          failed
          results {
            documentId
            success
            thumbnailUrl
            error
          }
        }
      }
    `;

    const response = await fetch(`${app.server.address()}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
        'X-Organization-Id': testOrganizationId,
      },
      body: JSON.stringify({
        query: mutation,
        variables: { documentIds: documentIds.slice(2, 5) },
      }),
    });

    const result = await response.json();

    expect(result.errors).toBeUndefined();
    expect(result.data.batchGenerateThumbnails).toBeTruthy();
    expect(result.data.batchGenerateThumbnails.total).toBe(3);
    expect(result.data.batchGenerateThumbnails.successful).toBeGreaterThan(0);
    expect(result.data.batchGenerateThumbnails.results).toHaveLength(3);
  });
});

describe('Multi-tenancy & Security', () => {
  let org1Id: string;
  let org2Id: string;
  let org1DocId: string;
  let org2DocId: string;
  let org1Token: string;
  let org2Token: string;

  beforeAll(async () => {
    // Create two organizations
    const org1 = await prisma.organization.create({
      data: { name: 'Org 1', slug: 'org-1', status: 'active' },
    });
    org1Id = org1.id;

    const org2 = await prisma.organization.create({
      data: { name: 'Org 2', slug: 'org-2', status: 'active' },
    });
    org2Id = org2.id;

    // Create users for each org
    const user1 = await prisma.user.create({
      data: { email: 'user1@org1.com', name: 'User 1', organizationId: org1Id, role: 'user' },
    });
    org1Token = `Bearer test-token-${user1.id}`;

    const user2 = await prisma.user.create({
      data: { email: 'user2@org2.com', name: 'User 2', organizationId: org2Id, role: 'user' },
    });
    org2Token = `Bearer test-token-${user2.id}`;

    // Upload document for each org
    for (const { orgId, token } of [
      { orgId: org1Id, token: org1Token },
      { orgId: org2Id, token: org2Token },
    ]) {
      const form = new FormData();
      form.append('file', fs.createReadStream(TEST_PDF), {
        filename: `org-${orgId}-doc.pdf`,
        contentType: 'application/pdf',
      });

      const response = await fetch(`${app.server.address()}/api/documents/upload`, {
        method: 'POST',
        headers: {
          ...form.getHeaders(),
          'Authorization': token,
          'X-Organization-Id': orgId,
        },
        body: form,
      });

      const result = await response.json();
      if (orgId === org1Id) org1DocId = result.document.documentId;
      if (orgId === org2Id) org2DocId = result.document.documentId;
    }
  });

  test('should not allow cross-organization document access', async () => {
    // Org 1 user tries to access Org 2 document
    const query = `
      query GetDocument($id: String!) {
        document(id: $id) {
          id
          title
        }
      }
    `;

    const response = await fetch(`${app.server.address()}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': org1Token,
        'X-Organization-Id': org1Id,
      },
      body: JSON.stringify({
        query,
        variables: { id: org2DocId },
      }),
    });

    const result = await response.json();

    expect(result.data.document).toBeNull();
    // Should return null or error due to organizationId filter
  });

  test('should isolate search results by organization', async () => {
    const query = `
      query SearchDocuments($query: String!) {
        searchDocuments(query: $query) {
          id
          title
        }
      }
    `;

    const response = await fetch(`${app.server.address()}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': org1Token,
        'X-Organization-Id': org1Id,
      },
      body: JSON.stringify({
        query,
        variables: { query: 'org' },
      }),
    });

    const result = await response.json();

    // Should only return Org 1 documents
    expect(result.data.searchDocuments).toBeTruthy();
    result.data.searchDocuments.forEach((doc: any) => {
      expect(doc.id).not.toBe(org2DocId);
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.document.deleteMany({ where: { organizationId: { in: [org1Id, org2Id] } } });
    await prisma.user.deleteMany({ where: { organizationId: { in: [org1Id, org2Id] } } });
    await prisma.organization.deleteMany({ where: { id: { in: [org1Id, org2Id] } } });
  });
});
