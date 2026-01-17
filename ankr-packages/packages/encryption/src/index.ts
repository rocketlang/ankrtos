/**
 * @ankr/encryption
 *
 * Enterprise encryption at rest with AES-256-GCM, field-level encryption,
 * and key rotation support.
 *
 * @example
 * ```typescript
 * import { Encryptor, FieldEncryptor } from '@ankr/encryption';
 *
 * // Simple encryption
 * const encryptor = new Encryptor({ key: process.env.ENCRYPTION_KEY! });
 * const encrypted = encryptor.encrypt('sensitive data');
 * const decrypted = encryptor.decrypt(encrypted);
 *
 * // Field-level encryption
 * const fieldEncryptor = new FieldEncryptor({ key: process.env.ENCRYPTION_KEY! });
 * const encryptedObj = fieldEncryptor.encryptFields(user, ['aadhaar', 'pan']);
 * ```
 *
 * @packageDocumentation
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash, scryptSync } from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Encryption algorithm
 */
export type Algorithm = 'aes-256-gcm' | 'aes-256-cbc';

/**
 * Encrypted data format
 */
export interface EncryptedData {
  /** Encrypted ciphertext (base64) */
  ciphertext: string;
  /** Initialization vector (base64) */
  iv: string;
  /** Authentication tag for GCM (base64) */
  tag?: string;
  /** Algorithm used */
  algorithm: Algorithm;
  /** Key version for rotation */
  keyVersion?: number;
}

/**
 * Encryptor configuration
 */
export interface EncryptorConfig {
  /** Encryption key (32 bytes for AES-256, or will be derived) */
  key: string | Buffer;
  /** Algorithm (default: aes-256-gcm) */
  algorithm?: Algorithm;
  /** Key version for rotation tracking */
  keyVersion?: number;
  /** Encoding for output (default: base64) */
  encoding?: BufferEncoding;
}

/**
 * Field encryption configuration
 */
export interface FieldEncryptorConfig extends EncryptorConfig {
  /** Fields that should always be encrypted */
  sensitiveFields?: string[];
  /** Prefix for encrypted field values */
  encryptedPrefix?: string;
  /** Enable searchable hashing */
  enableSearchHash?: boolean;
}

/**
 * Key derivation options
 */
export interface KeyDerivationOptions {
  /** Salt for key derivation */
  salt?: string | Buffer;
  /** Iterations for PBKDF2/scrypt */
  iterations?: number;
  /** Key length in bytes */
  keyLength?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENCRYPTOR
// ═══════════════════════════════════════════════════════════════════════════════

const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits for GCM
const KEY_LENGTH = 32; // 256 bits

/**
 * Encryptor
 *
 * AES-256-GCM encryption with authenticated encryption.
 */
export class Encryptor {
  private key: Buffer;
  private algorithm: Algorithm;
  private keyVersion: number;
  private encoding: BufferEncoding;

  constructor(config: EncryptorConfig) {
    this.algorithm = config.algorithm || 'aes-256-gcm';
    this.keyVersion = config.keyVersion || 1;
    this.encoding = config.encoding || 'base64';

    // Derive or use key directly
    if (typeof config.key === 'string') {
      this.key = this.deriveKey(config.key);
    } else if (config.key.length === KEY_LENGTH) {
      this.key = config.key;
    } else {
      this.key = this.deriveKey(config.key.toString('utf8'));
    }
  }

  /**
   * Derive a 256-bit key from a password/string
   */
  private deriveKey(password: string, salt?: Buffer): Buffer {
    const saltBuffer = salt || Buffer.from('ankr-encryption-salt-v1');
    return scryptSync(password, saltBuffer, KEY_LENGTH);
  }

  /**
   * Encrypt plaintext
   */
  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_LENGTH);

    if (this.algorithm === 'aes-256-gcm') {
      const cipher = createCipheriv(this.algorithm, this.key, iv, {
        authTagLength: TAG_LENGTH,
      });

      const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
      ]);

      const tag = cipher.getAuthTag();

      const data: EncryptedData = {
        ciphertext: encrypted.toString(this.encoding),
        iv: iv.toString(this.encoding),
        tag: tag.toString(this.encoding),
        algorithm: this.algorithm,
        keyVersion: this.keyVersion,
      };

      return Buffer.from(JSON.stringify(data)).toString(this.encoding);
    } else {
      // AES-256-CBC fallback
      const cipher = createCipheriv(this.algorithm, this.key, iv);

      const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
      ]);

      const data: EncryptedData = {
        ciphertext: encrypted.toString(this.encoding),
        iv: iv.toString(this.encoding),
        algorithm: this.algorithm,
        keyVersion: this.keyVersion,
      };

      return Buffer.from(JSON.stringify(data)).toString(this.encoding);
    }
  }

  /**
   * Decrypt ciphertext
   */
  decrypt(encryptedString: string): string {
    try {
      const data: EncryptedData = JSON.parse(
        Buffer.from(encryptedString, this.encoding).toString('utf8')
      );

      const iv = Buffer.from(data.iv, this.encoding);
      const ciphertext = Buffer.from(data.ciphertext, this.encoding);

      if (data.algorithm === 'aes-256-gcm') {
        if (!data.tag) {
          throw new Error('Missing authentication tag for GCM decryption');
        }

        const decipher = createDecipheriv(data.algorithm, this.key, iv, {
          authTagLength: TAG_LENGTH,
        });

        decipher.setAuthTag(Buffer.from(data.tag, this.encoding));

        const decrypted = Buffer.concat([
          decipher.update(ciphertext),
          decipher.final(),
        ]);

        return decrypted.toString('utf8');
      } else {
        // AES-256-CBC
        const decipher = createDecipheriv(data.algorithm, this.key, iv);

        const decrypted = Buffer.concat([
          decipher.update(ciphertext),
          decipher.final(),
        ]);

        return decrypted.toString('utf8');
      }
    } catch (error) {
      throw new Error(`Decryption failed: ${(error as Error).message}`);
    }
  }

  /**
   * Check if a string is encrypted
   */
  isEncrypted(value: string): boolean {
    try {
      const decoded = Buffer.from(value, this.encoding).toString('utf8');
      const data = JSON.parse(decoded);
      return data.algorithm && data.ciphertext && data.iv;
    } catch {
      return false;
    }
  }

  /**
   * Get key version
   */
  getKeyVersion(): number {
    return this.keyVersion;
  }

  /**
   * Re-encrypt with a new key (for key rotation)
   */
  reEncrypt(encryptedString: string, newEncryptor: Encryptor): string {
    const plaintext = this.decrypt(encryptedString);
    return newEncryptor.encrypt(plaintext);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FIELD ENCRYPTOR
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_SENSITIVE_FIELDS = [
  'aadhaar', 'aadhar', 'pan', 'passport', 'ssn',
  'creditCard', 'credit_card', 'cardNumber', 'card_number',
  'cvv', 'pin', 'password', 'secret', 'token',
  'bankAccount', 'bank_account', 'accountNumber', 'account_number',
];

/**
 * Field Encryptor
 *
 * Encrypt specific fields in objects with automatic detection.
 */
export class FieldEncryptor {
  private encryptor: Encryptor;
  private sensitiveFields: Set<string>;
  private encryptedPrefix: string;
  private enableSearchHash: boolean;

  constructor(config: FieldEncryptorConfig) {
    this.encryptor = new Encryptor(config);
    this.sensitiveFields = new Set([
      ...DEFAULT_SENSITIVE_FIELDS,
      ...(config.sensitiveFields || []),
    ].map(f => f.toLowerCase()));
    this.encryptedPrefix = config.encryptedPrefix || 'ENC:';
    this.enableSearchHash = config.enableSearchHash || false;
  }

  /**
   * Check if a field should be encrypted
   */
  private shouldEncrypt(fieldName: string): boolean {
    const lower = fieldName.toLowerCase();
    return this.sensitiveFields.has(lower) ||
      Array.from(this.sensitiveFields).some(sf => lower.includes(sf));
  }

  /**
   * Generate searchable hash for a value
   */
  private generateSearchHash(value: string): string {
    return createHash('sha256')
      .update(value.toLowerCase().trim())
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Encrypt specific fields in an object
   */
  encryptFields<T extends Record<string, any>>(
    obj: T,
    additionalFields?: string[]
  ): T & { _searchHashes?: Record<string, string> } {
    const result: any = { ...obj };
    const searchHashes: Record<string, string> = {};

    const fieldsToEncrypt = new Set([
      ...Array.from(this.sensitiveFields),
      ...(additionalFields || []).map(f => f.toLowerCase()),
    ]);

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue;

      if (typeof value === 'object' && !Array.isArray(value)) {
        // Recurse into nested objects
        result[key] = this.encryptFields(value, additionalFields);
      } else if (typeof value === 'string' && this.shouldEncrypt(key)) {
        // Encrypt the field
        if (!value.startsWith(this.encryptedPrefix)) {
          result[key] = this.encryptedPrefix + this.encryptor.encrypt(value);

          // Generate search hash if enabled
          if (this.enableSearchHash) {
            searchHashes[`${key}_hash`] = this.generateSearchHash(value);
          }
        }
      }
    }

    if (this.enableSearchHash && Object.keys(searchHashes).length > 0) {
      result._searchHashes = searchHashes;
    }

    return result;
  }

  /**
   * Decrypt specific fields in an object
   */
  decryptFields<T extends Record<string, any>>(obj: T): T {
    const result: any = { ...obj };

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue;

      if (typeof value === 'object' && !Array.isArray(value)) {
        // Recurse into nested objects
        result[key] = this.decryptFields(value);
      } else if (typeof value === 'string' && value.startsWith(this.encryptedPrefix)) {
        // Decrypt the field
        const encrypted = value.substring(this.encryptedPrefix.length);
        result[key] = this.encryptor.decrypt(encrypted);
      }
    }

    // Remove search hashes from output
    delete result._searchHashes;

    return result;
  }

  /**
   * Check if an object has encrypted fields
   */
  hasEncryptedFields(obj: Record<string, any>): boolean {
    for (const value of Object.values(obj)) {
      if (typeof value === 'string' && value.startsWith(this.encryptedPrefix)) {
        return true;
      }
      if (typeof value === 'object' && value !== null && this.hasEncryptedFields(value)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get the underlying encryptor
   */
  getEncryptor(): Encryptor {
    return this.encryptor;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// KEY MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Key Manager for rotation support
 */
export class KeyManager {
  private keys: Map<number, Encryptor> = new Map();
  private currentVersion: number = 1;

  constructor() {}

  /**
   * Add a key version
   */
  addKey(version: number, key: string | Buffer, algorithm?: Algorithm): void {
    this.keys.set(version, new Encryptor({ key, keyVersion: version, algorithm }));
    if (version > this.currentVersion) {
      this.currentVersion = version;
    }
  }

  /**
   * Get current encryptor
   */
  getCurrentEncryptor(): Encryptor {
    const encryptor = this.keys.get(this.currentVersion);
    if (!encryptor) {
      throw new Error('No current encryption key configured');
    }
    return encryptor;
  }

  /**
   * Get encryptor by version
   */
  getEncryptor(version: number): Encryptor | undefined {
    return this.keys.get(version);
  }

  /**
   * Decrypt using appropriate key version
   */
  decrypt(encryptedString: string): string {
    try {
      const decoded = Buffer.from(encryptedString, 'base64').toString('utf8');
      const data: EncryptedData = JSON.parse(decoded);
      const version = data.keyVersion || 1;

      const encryptor = this.keys.get(version);
      if (!encryptor) {
        throw new Error(`No key found for version ${version}`);
      }

      return encryptor.decrypt(encryptedString);
    } catch (error) {
      // Try current key as fallback
      return this.getCurrentEncryptor().decrypt(encryptedString);
    }
  }

  /**
   * Rotate encryption to current key
   */
  rotateToCurrentKey(encryptedString: string): string {
    const plaintext = this.decrypt(encryptedString);
    return this.getCurrentEncryptor().encrypt(plaintext);
  }

  /**
   * Get current key version
   */
  getCurrentVersion(): number {
    return this.currentVersion;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a random encryption key
 */
export function generateKey(length: number = KEY_LENGTH): string {
  return randomBytes(length).toString('base64');
}

/**
 * Hash a value (one-way, for comparison)
 */
export function hashValue(value: string, algorithm: 'sha256' | 'sha512' = 'sha256'): string {
  return createHash(algorithm).update(value).digest('hex');
}

/**
 * Generate a secure random token
 */
export function generateToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Constant-time string comparison (timing-attack safe)
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON & FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

let defaultEncryptor: Encryptor | undefined;
let defaultFieldEncryptor: FieldEncryptor | undefined;

/**
 * Initialize default encryptor
 */
export function initializeEncryption(config: EncryptorConfig): void {
  defaultEncryptor = new Encryptor(config);
  defaultFieldEncryptor = new FieldEncryptor(config);
}

/**
 * Get default encryptor
 */
export function getEncryptor(): Encryptor {
  if (!defaultEncryptor) {
    throw new Error('Encryption not initialized. Call initializeEncryption first.');
  }
  return defaultEncryptor;
}

/**
 * Get default field encryptor
 */
export function getFieldEncryptor(): FieldEncryptor {
  if (!defaultFieldEncryptor) {
    throw new Error('Encryption not initialized. Call initializeEncryption first.');
  }
  return defaultFieldEncryptor;
}

/**
 * Create a new encryptor
 */
export function createEncryptor(config: EncryptorConfig): Encryptor {
  return new Encryptor(config);
}

/**
 * Create a new field encryptor
 */
export function createFieldEncryptor(config: FieldEncryptorConfig): FieldEncryptor {
  return new FieldEncryptor(config);
}
