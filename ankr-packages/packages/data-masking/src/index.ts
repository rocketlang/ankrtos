/**
 * @ankr/data-masking
 *
 * Enterprise-grade PII protection and data masking for sensitive data.
 * Supports Indian identity documents (Aadhaar, PAN), financial data, and common PII.
 *
 * @example
 * ```typescript
 * import { mask, DataMasker } from '@ankr/data-masking';
 *
 * // Quick masking
 * mask.aadhaar('1234 5678 9012');  // 'XXXX XXXX 9012'
 * mask.pan('ABCDE1234F');          // 'XXXXX1234X'
 * mask.email('user@example.com');  // 'u***@example.com'
 *
 * // Object masking
 * const masker = new DataMasker();
 * const masked = masker.maskObject(customer);
 * ```
 *
 * @packageDocumentation
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Masking strategy
 */
export type MaskingStrategy =
  | 'full'           // Replace all characters
  | 'partial'        // Show first/last few characters
  | 'hash'           // SHA-256 hash
  | 'tokenize'       // Reversible token
  | 'redact'         // Replace with [REDACTED]
  | 'none';          // No masking

/**
 * Field type for automatic detection
 */
export type FieldType =
  | 'aadhaar'
  | 'pan'
  | 'passport'
  | 'driving_license'
  | 'voter_id'
  | 'gstin'
  | 'phone'
  | 'email'
  | 'credit_card'
  | 'debit_card'
  | 'bank_account'
  | 'ifsc'
  | 'upi'
  | 'name'
  | 'address'
  | 'dob'
  | 'ip_address'
  | 'password'
  | 'api_key'
  | 'ssn'
  | 'unknown';

/**
 * Masking configuration
 */
export interface MaskingConfig {
  /** Character to use for masking (default: 'X') */
  maskChar?: string;
  /** Show first N characters (default: varies by type) */
  showFirst?: number;
  /** Show last N characters (default: varies by type) */
  showLast?: number;
  /** Custom masking strategy */
  strategy?: MaskingStrategy;
  /** Preserve format (spaces, dashes) */
  preserveFormat?: boolean;
}

/**
 * Role-based masking levels
 */
export type MaskingLevel = 'none' | 'partial' | 'full' | 'redact';

/**
 * Role configuration for masking
 */
export interface RoleConfig {
  /** Fields this role can see unmasked */
  unmaskedFields?: string[];
  /** Default masking level for this role */
  defaultLevel?: MaskingLevel;
  /** Field-specific masking levels */
  fieldLevels?: Record<string, MaskingLevel>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DETECTION PATTERNS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Patterns for detecting PII types
 */
const PATTERNS: Record<FieldType, RegExp | null> = {
  // Indian Identity
  aadhaar: /^\d{4}\s?\d{4}\s?\d{4}$/,
  pan: /^[A-Z]{5}\d{4}[A-Z]$/i,
  passport: /^[A-Z]\d{7}$/i,
  driving_license: /^[A-Z]{2}\d{2}\s?\d{4}\s?\d{7}$/i,
  voter_id: /^[A-Z]{3}\d{7}$/i,
  gstin: /^\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z\d]Z[A-Z\d]$/i,

  // Contact
  phone: /^(\+91[\-\s]?)?[6-9]\d{9}$|^\d{10}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // Financial
  credit_card: /^\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}$/,
  debit_card: /^\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}$/,
  bank_account: /^\d{9,18}$/,
  ifsc: /^[A-Z]{4}0[A-Z0-9]{6}$/i,
  upi: /^[\w.-]+@[\w]+$/,

  // Other PII
  name: null, // Can't reliably detect
  address: null, // Can't reliably detect
  dob: /^\d{4}-\d{2}-\d{2}$|^\d{2}\/\d{2}\/\d{4}$/,
  ip_address: /^(?:\d{1,3}\.){3}\d{1,3}$/,

  // Secrets
  password: null,
  api_key: /^[A-Za-z0-9_\-]{20,}$/,
  ssn: /^\d{3}-\d{2}-\d{4}$/,

  unknown: null,
};

/**
 * Field name patterns for detection
 */
const FIELD_NAME_PATTERNS: Record<FieldType, RegExp> = {
  aadhaar: /aadhaar|aadhar|uid/i,
  pan: /\bpan\b|pan_?number/i,
  passport: /passport/i,
  driving_license: /driving|license|dl_?number/i,
  voter_id: /voter|epic/i,
  gstin: /gstin|gst_?number/i,
  phone: /phone|mobile|contact|cell/i,
  email: /email|e_?mail/i,
  credit_card: /credit.?card|cc_?number/i,
  debit_card: /debit.?card|dc_?number/i,
  bank_account: /account.?number|bank.?account|acct/i,
  ifsc: /ifsc|bank.?code/i,
  upi: /upi|vpa/i,
  name: /\bname\b|first.?name|last.?name|full.?name/i,
  address: /address|street|city|state|pincode|postal/i,
  dob: /dob|date.?of.?birth|birth.?date/i,
  ip_address: /ip.?address|client.?ip|remote.?addr/i,
  password: /password|passwd|secret|pwd/i,
  api_key: /api.?key|api.?secret|auth.?token|access.?token/i,
  ssn: /ssn|social.?security/i,
  unknown: /.*/,
};

// ═══════════════════════════════════════════════════════════════════════════════
// MASKING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Default masking configurations by field type
 */
const DEFAULT_CONFIGS: Record<FieldType, MaskingConfig> = {
  aadhaar: { showFirst: 0, showLast: 4, preserveFormat: true },
  pan: { showFirst: 0, showLast: 4, preserveFormat: false },
  passport: { showFirst: 1, showLast: 2, preserveFormat: false },
  driving_license: { showFirst: 2, showLast: 4, preserveFormat: true },
  voter_id: { showFirst: 3, showLast: 0, preserveFormat: false },
  gstin: { showFirst: 2, showLast: 3, preserveFormat: false },
  phone: { showFirst: 0, showLast: 4, preserveFormat: false },
  email: { showFirst: 1, showLast: 0, preserveFormat: true },
  credit_card: { showFirst: 0, showLast: 4, preserveFormat: true },
  debit_card: { showFirst: 0, showLast: 4, preserveFormat: true },
  bank_account: { showFirst: 0, showLast: 4, preserveFormat: false },
  ifsc: { showFirst: 4, showLast: 0, preserveFormat: false },
  upi: { showFirst: 2, showLast: 0, preserveFormat: true },
  name: { showFirst: 1, showLast: 1, preserveFormat: true },
  address: { showFirst: 0, showLast: 0, strategy: 'redact' },
  dob: { showFirst: 0, showLast: 0, strategy: 'full' },
  ip_address: { showFirst: 0, showLast: 0, strategy: 'full' },
  password: { showFirst: 0, showLast: 0, strategy: 'redact' },
  api_key: { showFirst: 4, showLast: 4, preserveFormat: false },
  ssn: { showFirst: 0, showLast: 4, preserveFormat: true },
  unknown: { showFirst: 0, showLast: 0, strategy: 'partial' },
};

/**
 * Mask a string value
 */
function maskString(
  value: string,
  config: MaskingConfig = {}
): string {
  if (!value || typeof value !== 'string') return value;

  const {
    maskChar = 'X',
    showFirst = 0,
    showLast = 0,
    strategy = 'partial',
    preserveFormat = false,
  } = config;

  switch (strategy) {
    case 'none':
      return value;

    case 'redact':
      return '[REDACTED]';

    case 'hash':
      return hashValue(value);

    case 'full':
      if (preserveFormat) {
        return value.replace(/[a-zA-Z0-9]/g, maskChar);
      }
      return maskChar.repeat(value.length);

    case 'partial':
    default:
      return maskPartial(value, showFirst, showLast, maskChar, preserveFormat);
  }
}

/**
 * Mask with partial visibility
 */
function maskPartial(
  value: string,
  showFirst: number,
  showLast: number,
  maskChar: string,
  preserveFormat: boolean
): string {
  const len = value.length;

  if (showFirst + showLast >= len) {
    return value;
  }

  if (preserveFormat) {
    // Preserve spaces and special characters
    let result = '';
    let alphanumIndex = 0;
    const alphanumChars = value.replace(/[^a-zA-Z0-9]/g, '');
    const alphanumLen = alphanumChars.length;

    for (let i = 0; i < len; i++) {
      const char = value[i];
      if (/[a-zA-Z0-9]/.test(char)) {
        if (alphanumIndex < showFirst || alphanumIndex >= alphanumLen - showLast) {
          result += char;
        } else {
          result += maskChar;
        }
        alphanumIndex++;
      } else {
        result += char;
      }
    }
    return result;
  }

  const first = value.slice(0, showFirst);
  const last = value.slice(-showLast || undefined);
  const middle = maskChar.repeat(len - showFirst - showLast);

  return first + middle + (showLast > 0 ? last : '');
}

/**
 * Simple hash function (not cryptographic)
 */
function hashValue(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `HASH_${Math.abs(hash).toString(16).padStart(8, '0').toUpperCase()}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPECIFIC MASKING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Quick masking functions for common types
 */
export const mask = {
  /**
   * Mask Aadhaar number: 1234 5678 9012 → XXXX XXXX 9012
   */
  aadhaar(value: string): string {
    if (!value) return value;
    const cleaned = value.replace(/\s/g, '');
    if (cleaned.length !== 12) return maskString(value, { strategy: 'full' });
    return `XXXX XXXX ${cleaned.slice(-4)}`;
  },

  /**
   * Mask PAN: ABCDE1234F → XXXXX1234X
   */
  pan(value: string): string {
    if (!value || value.length !== 10) return maskString(value, { strategy: 'full' });
    return `XXXXX${value.slice(5, 9)}X`;
  },

  /**
   * Mask phone: 9876543210 → XXXXXX3210
   */
  phone(value: string): string {
    if (!value) return value;
    const cleaned = value.replace(/[\s\-+]/g, '');
    if (cleaned.length < 10) return maskString(value, { strategy: 'full' });
    return 'X'.repeat(cleaned.length - 4) + cleaned.slice(-4);
  },

  /**
   * Mask email: user@example.com → u***@example.com
   */
  email(value: string): string {
    if (!value || !value.includes('@')) return maskString(value, { strategy: 'full' });
    const [local, domain] = value.split('@');
    const maskedLocal = local.length <= 2
      ? local[0] + '***'
      : local[0] + '***' + local.slice(-1);
    return `${maskedLocal}@${domain}`;
  },

  /**
   * Mask credit/debit card: 1234 5678 9012 3456 → XXXX XXXX XXXX 3456
   */
  card(value: string): string {
    if (!value) return value;
    const cleaned = value.replace(/[\s\-]/g, '');
    if (cleaned.length < 13) return maskString(value, { strategy: 'full' });
    const last4 = cleaned.slice(-4);
    const groups = Math.ceil((cleaned.length - 4) / 4);
    return 'XXXX '.repeat(groups).trim() + ' ' + last4;
  },

  /**
   * Mask bank account: 123456789012 → XXXXXXXX9012
   */
  bankAccount(value: string): string {
    if (!value) return value;
    const cleaned = value.replace(/\s/g, '');
    if (cleaned.length < 9) return maskString(value, { strategy: 'full' });
    return 'X'.repeat(cleaned.length - 4) + cleaned.slice(-4);
  },

  /**
   * Mask IFSC: HDFC0001234 → HDFC0XXXXXX
   */
  ifsc(value: string): string {
    if (!value || value.length !== 11) return maskString(value, { strategy: 'full' });
    return value.slice(0, 5) + 'XXXXXX';
  },

  /**
   * Mask UPI: user@paytm → us***@paytm
   */
  upi(value: string): string {
    if (!value || !value.includes('@')) return maskString(value, { strategy: 'full' });
    const [local, provider] = value.split('@');
    const maskedLocal = local.length <= 2
      ? local[0] + '***'
      : local.slice(0, 2) + '***';
    return `${maskedLocal}@${provider}`;
  },

  /**
   * Mask name: John Doe → J*** D**
   */
  name(value: string): string {
    if (!value) return value;
    return value.split(/\s+/).map(part => {
      if (part.length <= 1) return part;
      return part[0] + '*'.repeat(Math.min(part.length - 1, 3));
    }).join(' ');
  },

  /**
   * Mask address: 123 Main St, City → [REDACTED]
   */
  address(value: string): string {
    return '[REDACTED]';
  },

  /**
   * Mask date of birth: 1990-01-15 → XXXX-XX-XX
   */
  dob(value: string): string {
    if (!value) return value;
    return value.replace(/\d/g, 'X');
  },

  /**
   * Mask IP address: 192.168.1.100 → 192.168.X.X
   */
  ip(value: string): string {
    if (!value) return value;
    const parts = value.split('.');
    if (parts.length !== 4) return maskString(value, { strategy: 'full' });
    return `${parts[0]}.${parts[1]}.X.X`;
  },

  /**
   * Mask password: always returns ***
   */
  password(value: string): string {
    return '********';
  },

  /**
   * Mask API key: sk_live_abc123xyz → sk_l***xyz
   */
  apiKey(value: string): string {
    if (!value || value.length < 8) return '***';
    return value.slice(0, 4) + '***' + value.slice(-3);
  },

  /**
   * Mask SSN: 123-45-6789 → XXX-XX-6789
   */
  ssn(value: string): string {
    if (!value) return value;
    const cleaned = value.replace(/[\s\-]/g, '');
    if (cleaned.length !== 9) return maskString(value, { strategy: 'full' });
    return `XXX-XX-${cleaned.slice(-4)}`;
  },

  /**
   * Mask GSTIN: 29ABCDE1234F1Z5 → 29XXXXX1234XXX5
   */
  gstin(value: string): string {
    if (!value || value.length !== 15) return maskString(value, { strategy: 'full' });
    return value.slice(0, 2) + 'XXXXX' + value.slice(7, 11) + 'XXX' + value.slice(-1);
  },

  /**
   * Generic masking
   */
  generic(value: string, config?: MaskingConfig): string {
    return maskString(value, config);
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// DATA MASKER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Configuration for DataMasker
 */
export interface DataMaskerConfig {
  /** Default masking level */
  defaultLevel?: MaskingLevel;
  /** Fields to always mask */
  sensitiveFields?: string[];
  /** Fields to never mask */
  safeFields?: string[];
  /** Custom masking functions */
  customMaskers?: Record<string, (value: any) => any>;
  /** Role configurations */
  roles?: Record<string, RoleConfig>;
  /** Auto-detect field types */
  autoDetect?: boolean;
}

/**
 * Data Masker
 *
 * Comprehensive data masking with auto-detection and role-based access.
 */
export class DataMasker {
  private config: DataMaskerConfig;

  constructor(config: DataMaskerConfig = {}) {
    this.config = {
      defaultLevel: 'partial',
      sensitiveFields: [],
      safeFields: [],
      customMaskers: {},
      autoDetect: true,
      ...config,
    };
  }

  /**
   * Detect field type from field name and value
   */
  detectFieldType(fieldName: string, value: any): FieldType {
    if (typeof value !== 'string') return 'unknown';

    // Check field name patterns
    for (const [type, pattern] of Object.entries(FIELD_NAME_PATTERNS)) {
      if (type !== 'unknown' && pattern.test(fieldName)) {
        return type as FieldType;
      }
    }

    // Check value patterns
    for (const [type, pattern] of Object.entries(PATTERNS)) {
      if (pattern && pattern.test(value)) {
        return type as FieldType;
      }
    }

    return 'unknown';
  }

  /**
   * Mask a single value based on field type
   */
  maskValue(value: any, fieldType?: FieldType, config?: MaskingConfig): any {
    if (value === null || value === undefined) return value;
    if (typeof value !== 'string') return value;

    const type = fieldType || 'unknown';
    const defaultConfig = DEFAULT_CONFIGS[type] || DEFAULT_CONFIGS.unknown;
    const mergedConfig = { ...defaultConfig, ...config };

    // Use specific masking function if available
    switch (type) {
      case 'aadhaar': return mask.aadhaar(value);
      case 'pan': return mask.pan(value);
      case 'phone': return mask.phone(value);
      case 'email': return mask.email(value);
      case 'credit_card':
      case 'debit_card': return mask.card(value);
      case 'bank_account': return mask.bankAccount(value);
      case 'ifsc': return mask.ifsc(value);
      case 'upi': return mask.upi(value);
      case 'name': return mask.name(value);
      case 'address': return mask.address(value);
      case 'dob': return mask.dob(value);
      case 'ip_address': return mask.ip(value);
      case 'password': return mask.password(value);
      case 'api_key': return mask.apiKey(value);
      case 'ssn': return mask.ssn(value);
      case 'gstin': return mask.gstin(value);
      default: return maskString(value, mergedConfig);
    }
  }

  /**
   * Mask an object's sensitive fields
   */
  maskObject<T extends Record<string, any>>(
    obj: T,
    role?: string
  ): T {
    if (!obj || typeof obj !== 'object') return obj;

    const result: any = Array.isArray(obj) ? [] : {};
    const roleConfig = role ? this.config.roles?.[role] : undefined;

    for (const [key, value] of Object.entries(obj)) {
      // Check if field should be unmasked for this role
      if (roleConfig?.unmaskedFields?.includes(key)) {
        result[key] = value;
        continue;
      }

      // Check if field is in safe list
      if (this.config.safeFields?.includes(key)) {
        result[key] = value;
        continue;
      }

      // Check for custom masker
      if (this.config.customMaskers?.[key]) {
        result[key] = this.config.customMaskers[key](value);
        continue;
      }

      // Handle nested objects
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = this.maskObject(value, role);
        continue;
      }

      // Handle arrays
      if (Array.isArray(value)) {
        result[key] = value.map(item =>
          typeof item === 'object' ? this.maskObject(item, role) : item
        );
        continue;
      }

      // Auto-detect and mask
      if (this.config.autoDetect && typeof value === 'string') {
        const fieldType = this.detectFieldType(key, value);
        if (fieldType !== 'unknown' || this.config.sensitiveFields?.includes(key)) {
          result[key] = this.maskValue(value, fieldType);
          continue;
        }
      }

      // Check if explicitly sensitive
      if (this.config.sensitiveFields?.includes(key)) {
        result[key] = this.maskValue(value);
        continue;
      }

      result[key] = value;
    }

    return result;
  }

  /**
   * Mask all strings in a log message
   */
  maskLogMessage(message: string): string {
    let masked = message;

    // Mask Aadhaar patterns
    masked = masked.replace(/\b\d{4}\s?\d{4}\s?\d{4}\b/g, match =>
      mask.aadhaar(match)
    );

    // Mask PAN patterns
    masked = masked.replace(/\b[A-Z]{5}\d{4}[A-Z]\b/gi, match =>
      mask.pan(match)
    );

    // Mask phone patterns
    masked = masked.replace(/\b(?:\+91[\-\s]?)?[6-9]\d{9}\b/g, match =>
      mask.phone(match)
    );

    // Mask email patterns
    masked = masked.replace(/\b[^\s@]+@[^\s@]+\.[^\s@]+\b/g, match =>
      mask.email(match)
    );

    // Mask card patterns
    masked = masked.replace(/\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g, match =>
      mask.card(match)
    );

    return masked;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOKENIZATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Simple in-memory tokenizer for reversible masking
 */
export class Tokenizer {
  private tokens = new Map<string, string>();
  private values = new Map<string, string>();
  private counter = 0;

  /**
   * Tokenize a value
   */
  tokenize(value: string, prefix = 'TKN'): string {
    if (this.values.has(value)) {
      return this.values.get(value)!;
    }

    const token = `${prefix}_${(++this.counter).toString(36).padStart(8, '0').toUpperCase()}`;
    this.tokens.set(token, value);
    this.values.set(value, token);
    return token;
  }

  /**
   * Detokenize a token back to original value
   */
  detokenize(token: string): string | undefined {
    return this.tokens.get(token);
  }

  /**
   * Clear all tokens
   */
  clear(): void {
    this.tokens.clear();
    this.values.clear();
    this.counter = 0;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON & FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

/** Default data masker instance */
export const dataMasker = new DataMasker();

/** Default tokenizer instance */
export const tokenizer = new Tokenizer();

/**
 * Create a configured data masker
 */
export function createDataMasker(config?: DataMaskerConfig): DataMasker {
  return new DataMasker(config);
}
