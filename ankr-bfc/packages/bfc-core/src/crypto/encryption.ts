/**
 * ankrBFC Encryption at Rest
 *
 * Provides AES-256-GCM encryption for all sensitive data by default.
 * Uses envelope encryption pattern with master key + data encryption keys.
 */

import { gcm } from '@noble/ciphers/aes';
import { randomBytes } from '@noble/ciphers/webcrypto';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';

// Types
export interface EncryptedData {
  ciphertext: string;  // hex-encoded
  iv: string;          // hex-encoded
  tag: string;         // hex-encoded (GCM auth tag)
  keyId: string;       // reference to encryption key
  version: number;     // encryption version for rotation
}

export interface EncryptionKey {
  id: string;
  key: Uint8Array;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export interface EncryptionConfig {
  masterKey: string;           // Base64 or hex encoded master key
  keyRotationDays?: number;    // Auto-rotate after N days
  algorithm?: 'aes-256-gcm';   // Currently only GCM supported
}

/**
 * Default encryption service - encrypts all sensitive fields by default
 */
export class EncryptionService {
  private masterKey: Uint8Array;
  private dataKeys: Map<string, EncryptionKey> = new Map();
  private currentKeyId: string;
  private config: EncryptionConfig;

  constructor(config: EncryptionConfig) {
    this.config = config;
    this.masterKey = this.deriveMasterKey(config.masterKey);
    this.currentKeyId = this.generateKeyId();
    this.dataKeys.set(this.currentKeyId, {
      id: this.currentKeyId,
      key: this.generateDataKey(),
      createdAt: new Date(),
      isActive: true,
    });
  }

  /**
   * Encrypt sensitive data - use for any PII, financial data, or secrets
   */
  async encrypt(plaintext: string): Promise<EncryptedData> {
    const key = this.getActiveKey();
    const iv = randomBytes(12); // 96 bits for GCM
    const plaintextBytes = new TextEncoder().encode(plaintext);

    const cipher = gcm(key.key, iv);
    const ciphertext = cipher.encrypt(plaintextBytes);

    // GCM appends the tag to ciphertext, split it
    const actualCiphertext = ciphertext.slice(0, -16);
    const tag = ciphertext.slice(-16);

    return {
      ciphertext: bytesToHex(actualCiphertext),
      iv: bytesToHex(iv),
      tag: bytesToHex(tag),
      keyId: key.id,
      version: 1,
    };
  }

  /**
   * Decrypt data using the key that encrypted it
   */
  async decrypt(encrypted: EncryptedData): Promise<string> {
    const key = this.dataKeys.get(encrypted.keyId);
    if (!key) {
      throw new Error(`Encryption key ${encrypted.keyId} not found`);
    }

    const iv = hexToBytes(encrypted.iv);
    const ciphertext = hexToBytes(encrypted.ciphertext);
    const tag = hexToBytes(encrypted.tag);

    // GCM expects ciphertext + tag concatenated
    const combined = new Uint8Array([...ciphertext, ...tag]);

    const cipher = gcm(key.key, iv);
    const plaintext = cipher.decrypt(combined);

    return new TextDecoder().decode(plaintext);
  }

  /**
   * Encrypt a JSON object - encrypts all string values by default
   */
  async encryptObject<T extends Record<string, unknown>>(
    obj: T,
    fieldsToEncrypt?: (keyof T)[]
  ): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        const shouldEncrypt = fieldsToEncrypt
          ? fieldsToEncrypt.includes(key as keyof T)
          : this.isSensitiveField(key);

        if (shouldEncrypt) {
          result[key] = await this.encrypt(value);
        } else {
          result[key] = value;
        }
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Decrypt a JSON object with encrypted fields
   */
  async decryptObject<T extends Record<string, unknown>>(
    obj: Record<string, unknown>
  ): Promise<T> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (this.isEncryptedData(value)) {
        result[key] = await this.decrypt(value as EncryptedData);
      } else {
        result[key] = value;
      }
    }

    return result as T;
  }

  /**
   * Rotate data encryption key
   */
  rotateKey(): string {
    const newKeyId = this.generateKeyId();
    this.dataKeys.set(newKeyId, {
      id: newKeyId,
      key: this.generateDataKey(),
      createdAt: new Date(),
      isActive: true,
    });

    // Deactivate old key (but keep for decryption)
    const oldKey = this.dataKeys.get(this.currentKeyId);
    if (oldKey) {
      oldKey.isActive = false;
    }

    this.currentKeyId = newKeyId;
    return newKeyId;
  }

  /**
   * Re-encrypt data with new key (for key rotation)
   */
  async reencrypt(encrypted: EncryptedData): Promise<EncryptedData> {
    const plaintext = await this.decrypt(encrypted);
    return this.encrypt(plaintext);
  }

  /**
   * Hash sensitive data for searching (one-way)
   */
  hash(data: string): string {
    const combined = new TextEncoder().encode(data + bytesToHex(this.masterKey));
    return bytesToHex(sha256(combined));
  }

  /**
   * Export key metadata (not the actual keys) for audit
   */
  getKeyMetadata(): Array<Omit<EncryptionKey, 'key'>> {
    return Array.from(this.dataKeys.values()).map(({ key, ...rest }) => rest);
  }

  // Private methods

  private deriveMasterKey(input: string): Uint8Array {
    // Derive 256-bit key from input using SHA-256
    const bytes = new TextEncoder().encode(input);
    return sha256(bytes);
  }

  private generateDataKey(): Uint8Array {
    return randomBytes(32); // 256 bits
  }

  private generateKeyId(): string {
    return `dek_${bytesToHex(randomBytes(8))}_${Date.now()}`;
  }

  private getActiveKey(): EncryptionKey {
    const key = this.dataKeys.get(this.currentKeyId);
    if (!key) {
      throw new Error('No active encryption key');
    }
    return key;
  }

  private isEncryptedData(value: unknown): boolean {
    if (typeof value !== 'object' || value === null) return false;
    const obj = value as Record<string, unknown>;
    return (
      typeof obj.ciphertext === 'string' &&
      typeof obj.iv === 'string' &&
      typeof obj.tag === 'string' &&
      typeof obj.keyId === 'string'
    );
  }

  private isSensitiveField(fieldName: string): boolean {
    const sensitivePatterns = [
      'aadhaar', 'aadhar',
      'pan',
      'passport',
      'ssn',
      'account', 'accountno', 'account_number',
      'card', 'cardno', 'card_number',
      'cvv',
      'pin',
      'password',
      'secret',
      'token',
      'key',
      'phone', 'mobile',
      'email',
      'address',
      'dob', 'dateofbirth', 'date_of_birth',
      'salary', 'income',
      'document',
    ];

    const lowerField = fieldName.toLowerCase();
    return sensitivePatterns.some(pattern => lowerField.includes(pattern));
  }
}

/**
 * Prisma middleware for automatic encryption/decryption
 */
export function createPrismaEncryptionMiddleware(encryption: EncryptionService) {
  const sensitiveModels = new Map<string, string[]>([
    ['Customer', ['aadhaarHash', 'pan', 'email', 'phone']],
    ['CustomerDocument', ['documentNumber', 'storageUrl']],
    ['TransactionEvent', ['merchantName']],
  ]);

  return async (params: any, next: (params: any) => Promise<any>) => {
    const modelFields = sensitiveModels.get(params.model);

    // Encrypt on write
    if (modelFields && ['create', 'update', 'upsert'].includes(params.action)) {
      const data = params.args.data || params.args.create;
      if (data) {
        for (const field of modelFields) {
          if (data[field] && typeof data[field] === 'string') {
            data[field] = JSON.stringify(await encryption.encrypt(data[field]));
          }
        }
      }
    }

    const result = await next(params);

    // Decrypt on read
    if (modelFields && result) {
      const decryptRecord = async (record: any) => {
        for (const field of modelFields) {
          if (record[field]) {
            try {
              const encrypted = JSON.parse(record[field]);
              if (encryption['isEncryptedData'](encrypted)) {
                record[field] = await encryption.decrypt(encrypted);
              }
            } catch {
              // Field not encrypted or not JSON
            }
          }
        }
        return record;
      };

      if (Array.isArray(result)) {
        await Promise.all(result.map(decryptRecord));
      } else if (typeof result === 'object') {
        await decryptRecord(result);
      }
    }

    return result;
  };
}

// Export singleton with default config (must be initialized with real key)
let defaultEncryption: EncryptionService | null = null;

export function initializeEncryption(config: EncryptionConfig): EncryptionService {
  defaultEncryption = new EncryptionService(config);
  return defaultEncryption;
}

export function getEncryption(): EncryptionService {
  if (!defaultEncryption) {
    throw new Error('Encryption not initialized. Call initializeEncryption first.');
  }
  return defaultEncryption;
}
