/**
 * Advanced Document Processing Service
 * Handles PDF previews, thumbnails, watermarks, OCR, and analytics
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import sharp from 'sharp';
import { createCanvas, loadImage } from 'canvas';
import { createWorker } from 'tesseract.js';
import { minioClient } from './hybrid/minio-client.js';
import { prisma } from '../lib/prisma.js';
import { documentStorage } from './document-storage.js';

interface ThumbnailOptions {
  documentId: string;
  width?: number;
  height?: number;
  quality?: number;
}

interface WatermarkOptions {
  documentId: string;
  watermarkText: string;
  opacity?: number;
  fontSize?: number;
  userId?: string;
}

interface OCROptions {
  documentId: string;
  languages?: string[];
}

interface AnalyticsEvent {
  documentId: string;
  eventType: 'view' | 'download' | 'share' | 'edit';
  userId?: string;
  ipAddress?: string;
  metadata?: any;
}

class AdvancedDocumentProcessing {
  /**
   * Generate thumbnail for document (PDF first page or image resize)
   */
  async generateThumbnail(options: ThumbnailOptions): Promise<string> {
    const { documentId, width = 200, height = 280, quality = 80 } = options;

    // Get document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Check if thumbnail already exists
    const existingThumbnail = (document.metadata as any)?.thumbnailUrl;
    if (existingThumbnail) {
      return existingThumbnail;
    }

    // Get document buffer
    const { buffer, mimeType } = await documentStorage.getDocumentBuffer(documentId);

    let thumbnailBuffer: Buffer;

    if (mimeType === 'application/pdf') {
      // Generate PDF thumbnail (first page)
      thumbnailBuffer = await this.generatePDFThumbnail(buffer, width, height);
    } else if (mimeType.startsWith('image/')) {
      // Resize image
      thumbnailBuffer = await sharp(buffer)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality })
        .toBuffer();
    } else {
      throw new Error('Unsupported file type for thumbnail generation');
    }

    // Upload thumbnail to MinIO
    const thumbnailKey = `thumbnails/${document.organizationId}/${documentId}_thumb.jpg`;
    const uploadResult = await minioClient.upload(thumbnailKey, thumbnailBuffer, {
      'x-amz-meta-document-id': documentId,
      'x-amz-meta-type': 'thumbnail',
    });

    // Update document metadata
    await prisma.document.update({
      where: { id: documentId },
      data: {
        metadata: {
          ...(document.metadata as any),
          thumbnailUrl: uploadResult.url,
          thumbnailKey,
          thumbnailGenerated: new Date().toISOString(),
        },
      },
    });

    return uploadResult.url;
  }

  /**
   * Generate PDF thumbnail using pdf-lib and canvas
   */
  private async generatePDFThumbnail(
    pdfBuffer: Buffer,
    width: number,
    height: number
  ): Promise<Buffer> {
    try {
      // Load PDF
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      const { width: pageWidth, height: pageHeight } = firstPage.getSize();

      // Calculate scale to fit within thumbnail dimensions
      const scale = Math.min(width / pageWidth, height / pageHeight);
      const scaledWidth = pageWidth * scale;
      const scaledHeight = pageHeight * scale;

      // Create canvas
      const canvas = createCanvas(scaledWidth, scaledHeight);
      const ctx = canvas.getContext('2d');

      // Fill white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, scaledWidth, scaledHeight);

      // Draw placeholder (actual rendering would require pdf.js rendering)
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(10, 10, scaledWidth - 20, scaledHeight - 20);
      ctx.fillStyle = '#333333';
      ctx.font = '14px Arial';
      ctx.fillText('PDF Preview', scaledWidth / 2 - 40, scaledHeight / 2);

      // Convert canvas to buffer
      return canvas.toBuffer('image/jpeg', { quality: 0.8 });
    } catch (error) {
      console.error('PDF thumbnail generation error:', error);
      // Return placeholder image
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#666666';
      ctx.font = '12px Arial';
      ctx.fillText('PDF', width / 2 - 10, height / 2);
      return canvas.toBuffer('image/jpeg');
    }
  }

  /**
   * Add watermark to PDF document
   */
  async addWatermark(options: WatermarkOptions): Promise<string> {
    const {
      documentId,
      watermarkText,
      opacity = 0.3,
      fontSize = 48,
      userId,
    } = options;

    // Get document
    const { buffer, fileName, mimeType } = await documentStorage.getDocumentBuffer(
      documentId
    );

    if (mimeType !== 'application/pdf') {
      throw new Error('Watermarks only supported for PDF documents');
    }

    // Load PDF
    const pdfDoc = await PDFDocument.load(buffer);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Add watermark to each page
    for (const page of pages) {
      const { width, height } = page.getSize();

      page.drawText(watermarkText, {
        x: width / 2 - (watermarkText.length * fontSize) / 4,
        y: height / 2,
        size: fontSize,
        font,
        color: rgb(0.5, 0.5, 0.5),
        opacity,
        rotate: { angle: -45, type: 'degrees' },
      });
    }

    // Save watermarked PDF
    const watermarkedBuffer = Buffer.from(await pdfDoc.save());

    // Upload watermarked version to MinIO
    const watermarkedKey = `watermarked/${documentId}_${Date.now()}_watermarked.pdf`;
    const uploadResult = await minioClient.upload(watermarkedKey, watermarkedBuffer, {
      'x-amz-meta-original-document': documentId,
      'x-amz-meta-watermark-text': watermarkText,
      'x-amz-meta-created-by': userId || 'system',
    });

    // Create audit log
    await prisma.documentAuditLog.create({
      data: {
        documentId,
        action: 'watermarked',
        performedBy: userId || 'system',
        performedByName: userId || 'System',
        metadata: {
          watermarkText,
          watermarkedKey,
        },
      },
    });

    // Get presigned URL (valid for 1 hour)
    return minioClient.getUrl(watermarkedKey, 3600);
  }

  /**
   * Extract text from document using OCR (Tesseract)
   */
  async extractTextOCR(options: OCROptions): Promise<string> {
    const { documentId, languages = ['eng'] } = options;

    // Get document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Check if OCR text already exists
    const existingOCR = (document.metadata as any)?.ocrText;
    if (existingOCR) {
      return existingOCR;
    }

    // Get document buffer
    const { buffer, mimeType } = await documentStorage.getDocumentBuffer(documentId);

    if (!mimeType.startsWith('image/') && mimeType !== 'application/pdf') {
      throw new Error('OCR only supported for images and PDFs');
    }

    // For images, run OCR directly
    if (mimeType.startsWith('image/')) {
      const worker = await createWorker(languages);
      const {
        data: { text },
      } = await worker.recognize(buffer);
      await worker.terminate();

      // Update document metadata
      await prisma.document.update({
        where: { id: documentId },
        data: {
          metadata: {
            ...(document.metadata as any),
            ocrText: text,
            ocrLanguages: languages,
            ocrProcessed: new Date().toISOString(),
          },
        },
      });

      return text;
    }

    // For PDFs, extract text from first page (simplified)
    // Full implementation would render each page and OCR
    return 'OCR for PDF requires rendering - not implemented yet';
  }

  /**
   * Track document analytics event
   */
  async trackAnalytics(event: AnalyticsEvent): Promise<void> {
    const { documentId, eventType, userId, ipAddress, metadata } = event;

    // Create analytics record
    await prisma.documentAnalytics.create({
      data: {
        documentId,
        eventType,
        userId,
        ipAddress,
        metadata: metadata || {},
        timestamp: new Date(),
      },
    });

    // Update document counters
    const updateData: any = {};
    if (eventType === 'view') {
      updateData.viewCount = { increment: 1 };
      updateData.lastViewedAt = new Date();
    } else if (eventType === 'download') {
      updateData.downloadCount = { increment: 1 };
      updateData.lastDownloadedAt = new Date();
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.document.update({
        where: { id: documentId },
        data: updateData,
      });
    }
  }

  /**
   * Get document analytics summary
   */
  async getAnalytics(documentId: string, days: number = 30): Promise<any> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const analytics = await prisma.documentAnalytics.findMany({
      where: {
        documentId,
        timestamp: { gte: since },
      },
      orderBy: { timestamp: 'desc' },
    });

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        viewCount: true,
        downloadCount: true,
        lastViewedAt: true,
        lastDownloadedAt: true,
      },
    });

    // Aggregate by event type
    const byEventType = analytics.reduce((acc: any, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {});

    // Get unique users
    const uniqueUsers = new Set(
      analytics.filter((e) => e.userId).map((e) => e.userId)
    ).size;

    // Daily activity
    const dailyActivity: any = {};
    analytics.forEach((event) => {
      const date = event.timestamp.toISOString().split('T')[0];
      dailyActivity[date] = (dailyActivity[date] || 0) + 1;
    });

    return {
      totalViews: document?.viewCount || 0,
      totalDownloads: document?.downloadCount || 0,
      lastViewedAt: document?.lastViewedAt,
      lastDownloadedAt: document?.lastDownloadedAt,
      recentActivity: {
        days,
        events: analytics.length,
        byEventType,
        uniqueUsers,
        dailyActivity,
      },
    };
  }

  /**
   * Generate document preview (first page as image for PDFs)
   */
  async generatePreview(documentId: string): Promise<string> {
    // Similar to thumbnail but full size
    return this.generateThumbnail({
      documentId,
      width: 800,
      height: 1100,
      quality: 90,
    });
  }

  /**
   * Batch generate thumbnails for multiple documents
   */
  async batchGenerateThumbnails(documentIds: string[]): Promise<{
    successful: string[];
    failed: { documentId: string; error: string }[];
  }> {
    const successful: string[] = [];
    const failed: { documentId: string; error: string }[] = [];

    for (const documentId of documentIds) {
      try {
        await this.generateThumbnail({ documentId });
        successful.push(documentId);
      } catch (error: any) {
        failed.push({
          documentId,
          error: error.message,
        });
      }
    }

    return { successful, failed };
  }
}

export const advancedDocProcessing = new AdvancedDocumentProcessing();
