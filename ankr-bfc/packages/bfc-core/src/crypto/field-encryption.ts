/**
 * Field-level encryption decorators and utilities
 *
 * Provides automatic encryption for specific fields using decorators
 * and Prisma extension pattern.
 */

import { getEncryption, type EncryptedData } from './encryption.js';

// Decorator metadata storage
const encryptedFieldsMap = new Map<string, Set<string>>();

/**
 * Decorator to mark a field for automatic encryption
 *
 * @example
 * class Customer {
 *   @Encrypted()
 *   aadhaarNumber: string;
 *
 *   @Encrypted()
 *   panNumber: string;
 * }
 */
export function Encrypted(): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    const className = target.constructor.name;
    if (!encryptedFieldsMap.has(className)) {
      encryptedFieldsMap.set(className, new Set());
    }
    encryptedFieldsMap.get(className)!.add(String(propertyKey));
  };
}

/**
 * Check if a field should be encrypted
 */
export function isEncryptedField(className: string, fieldName: string): boolean {
  return encryptedFieldsMap.get(className)?.has(fieldName) ?? false;
}

/**
 * Get all encrypted fields for a class
 */
export function getEncryptedFields(className: string): string[] {
  return Array.from(encryptedFieldsMap.get(className) ?? []);
}

/**
 * Prisma extension for automatic field encryption
 *
 * @example
 * const prisma = new PrismaClient().$extends(encryptionExtension);
 */
export const encryptionExtension = {
  name: 'field-encryption',
  query: {
    $allModels: {
      async create({ model, operation, args, query }: any) {
        args.data = await encryptFields(model, args.data);
        const result = await query(args);
        return decryptFields(model, result);
      },

      async update({ model, operation, args, query }: any) {
        if (args.data) {
          args.data = await encryptFields(model, args.data);
        }
        const result = await query(args);
        return decryptFields(model, result);
      },

      async upsert({ model, operation, args, query }: any) {
        if (args.create) {
          args.create = await encryptFields(model, args.create);
        }
        if (args.update) {
          args.update = await encryptFields(model, args.update);
        }
        const result = await query(args);
        return decryptFields(model, result);
      },

      async findUnique({ model, operation, args, query }: any) {
        const result = await query(args);
        return result ? decryptFields(model, result) : result;
      },

      async findFirst({ model, operation, args, query }: any) {
        const result = await query(args);
        return result ? decryptFields(model, result) : result;
      },

      async findMany({ model, operation, args, query }: any) {
        const results = await query(args);
        return Promise.all(results.map((r: any) => decryptFields(model, r)));
      },
    },
  },
};

/**
 * Model-specific encryption field configuration
 */
const modelEncryptionConfig: Record<string, string[]> = {
  Customer: [
    'aadhaarHash',
    'pan',
    'email',
    'phone',
    'altPhone',
  ],
  CustomerDocument: [
    'documentNumber',
    'encryptionKey',
  ],
  TransactionEvent: [],
  Communication: [
    'body',
  ],
};

/**
 * Encrypt specified fields in a data object
 */
async function encryptFields(model: string, data: Record<string, any>): Promise<Record<string, any>> {
  const fieldsToEncrypt = modelEncryptionConfig[model] ?? [];
  const encryption = getEncryption();

  const result = { ...data };
  for (const field of fieldsToEncrypt) {
    if (result[field] && typeof result[field] === 'string') {
      const encrypted = await encryption.encrypt(result[field]);
      result[field] = JSON.stringify(encrypted);
    }
  }

  return result;
}

/**
 * Decrypt specified fields in a data object
 */
async function decryptFields(model: string, data: Record<string, any>): Promise<Record<string, any>> {
  const fieldsToDecrypt = modelEncryptionConfig[model] ?? [];
  const encryption = getEncryption();

  const result = { ...data };
  for (const field of fieldsToDecrypt) {
    if (result[field] && typeof result[field] === 'string') {
      try {
        const parsed = JSON.parse(result[field]);
        if (isEncryptedData(parsed)) {
          result[field] = await encryption.decrypt(parsed);
        }
      } catch {
        // Not encrypted or not JSON, leave as is
      }
    }
  }

  return result;
}

/**
 * Type guard for encrypted data
 */
function isEncryptedData(value: unknown): value is EncryptedData {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.ciphertext === 'string' &&
    typeof obj.iv === 'string' &&
    typeof obj.tag === 'string' &&
    typeof obj.keyId === 'string'
  );
}

/**
 * Hash a value for searching encrypted fields
 * Use this when you need to search by encrypted field values
 *
 * @example
 * const hashedPhone = hashForSearch('9876543210');
 * const customer = await prisma.customer.findFirst({
 *   where: { phoneHash: hashedPhone }
 * });
 */
export function hashForSearch(value: string): string {
  return getEncryption().hash(value);
}
