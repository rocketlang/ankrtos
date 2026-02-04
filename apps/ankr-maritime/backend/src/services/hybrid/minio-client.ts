/**
 * MinIO Client for Self-Hosted Object Storage
 *
 * S3-compatible, free alternative to AWS S3
 */

import * as Minio from 'minio';
import { hybridDMSConfig } from '../../config/hybrid-dms.js';
import { createHash } from 'crypto';

class MinIOClient {
  private client: Minio.Client;
  private bucket: string;

  constructor() {
    this.bucket = hybridDMSConfig.storage.bucket;

    this.client = new Minio.Client({
      endPoint: hybridDMSConfig.storage.endpoint,
      port: hybridDMSConfig.storage.port,
      useSSL: hybridDMSConfig.storage.useSSL,
      accessKey: hybridDMSConfig.storage.accessKey,
      secretKey: hybridDMSConfig.storage.secretKey,
    });

    // Initialize bucket
    this.initBucket();
  }

  /**
   * Initialize bucket with versioning
   */
  private async initBucket() {
    try {
      const exists = await this.client.bucketExists(this.bucket);

      if (!exists) {
        await this.client.makeBucket(this.bucket, hybridDMSConfig.storage.region);
        console.log(`Created MinIO bucket: ${this.bucket}`);

        // Enable versioning
        await this.client.setBucketVersioning(this.bucket, {
          Status: 'Enabled',
        });
        console.log(`Enabled versioning for bucket: ${this.bucket}`);
      }
    } catch (error) {
      console.error('MinIO bucket initialization error:', error);
    }
  }

  /**
   * Upload file
   */
  async upload(
    fileName: string,
    buffer: Buffer,
    metadata?: Record<string, string>
  ): Promise<{ url: string; etag: string; versionId?: string }> {
    try {
      const checksum = createHash('md5').update(buffer).digest('hex');

      const metaData = {
        'Content-Type': this.getContentType(fileName),
        'x-amz-meta-checksum': checksum,
        ...metadata,
      };

      const result = await this.client.putObject(
        this.bucket,
        fileName,
        buffer,
        buffer.length,
        metaData
      );

      const url = await this.getUrl(fileName);

      return {
        url,
        etag: result.etag,
        versionId: result.versionId,
      };
    } catch (error) {
      console.error('MinIO upload error:', error);
      throw new Error(`Failed to upload file: ${error}`);
    }
  }

  /**
   * Download file
   */
  async download(fileName: string, versionId?: string): Promise<Buffer> {
    try {
      const stream = await this.client.getObject(
        this.bucket,
        fileName,
        versionId ? { versionId } : undefined
      );

      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (error) {
      console.error('MinIO download error:', error);
      throw new Error(`Failed to download file: ${error}`);
    }
  }

  /**
   * Get presigned URL (temporary download link)
   */
  async getUrl(fileName: string, expirySeconds = 3600): Promise<string> {
    try {
      return await this.client.presignedGetObject(
        this.bucket,
        fileName,
        expirySeconds
      );
    } catch (error) {
      console.error('MinIO get URL error:', error);
      throw new Error(`Failed to get URL: ${error}`);
    }
  }

  /**
   * Delete file
   */
  async delete(fileName: string, versionId?: string): Promise<void> {
    try {
      await this.client.removeObject(
        this.bucket,
        fileName,
        versionId ? { versionId } : undefined
      );
    } catch (error) {
      console.error('MinIO delete error:', error);
      throw new Error(`Failed to delete file: ${error}`);
    }
  }

  /**
   * List files
   */
  async listFiles(prefix?: string): Promise<Array<{
    name: string;
    size: number;
    lastModified: Date;
    etag: string;
  }>> {
    const files: any[] = [];

    try {
      const stream = this.client.listObjects(this.bucket, prefix, true);

      for await (const obj of stream) {
        files.push({
          name: obj.name,
          size: obj.size,
          lastModified: obj.lastModified,
          etag: obj.etag,
        });
      }

      return files;
    } catch (error) {
      console.error('MinIO list files error:', error);
      return [];
    }
  }

  /**
   * List file versions
   */
  async listVersions(fileName: string): Promise<Array<{
    versionId: string;
    isLatest: boolean;
    lastModified: Date;
    size: number;
  }>> {
    const versions: any[] = [];

    try {
      const stream = this.client.listObjects(this.bucket, fileName, false, {
        IncludeVersion: true,
      });

      for await (const obj of stream) {
        versions.push({
          versionId: obj.versionId,
          isLatest: obj.isLatest || false,
          lastModified: obj.lastModified,
          size: obj.size,
        });
      }

      return versions;
    } catch (error) {
      console.error('MinIO list versions error:', error);
      return [];
    }
  }

  /**
   * Get file stats
   */
  async stat(fileName: string): Promise<{
    size: number;
    lastModified: Date;
    etag: string;
    metadata: Record<string, string>;
  }> {
    try {
      const stat = await this.client.statObject(this.bucket, fileName);

      return {
        size: stat.size,
        lastModified: stat.lastModified,
        etag: stat.etag,
        metadata: stat.metaData || {},
      };
    } catch (error) {
      console.error('MinIO stat error:', error);
      throw new Error(`Failed to get file stats: ${error}`);
    }
  }

  /**
   * Health check
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.client.bucketExists(this.bucket);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get content type from file extension
   */
  private getContentType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();

    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      txt: 'text/plain',
      csv: 'text/csv',
      json: 'application/json',
      zip: 'application/zip',
    };

    return mimeTypes[ext || ''] || 'application/octet-stream';
  }
}

export const minioClient = new MinIOClient();
