/**
 * ankrBFC Cryptography Module
 *
 * Provides encryption-at-rest and field-level encryption for all sensitive data.
 */

export {
  EncryptionService,
  initializeEncryption,
  getEncryption,
  createPrismaEncryptionMiddleware,
  type EncryptedData,
  type EncryptionKey,
  type EncryptionConfig,
} from './encryption.js';

export {
  Encrypted,
  isEncryptedField,
  getEncryptedFields,
  encryptionExtension,
  hashForSearch,
} from './field-encryption.js';
