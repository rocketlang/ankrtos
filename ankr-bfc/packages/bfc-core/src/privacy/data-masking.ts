/**
 * BFC Data Masking & PII Protection
 *
 * Enterprise-grade data protection for:
 * - DPDP Act compliance
 * - GDPR compliance
 * - RBI data localization
 */

// ============================================================================
// TYPES
// ============================================================================

export type MaskingLevel = 'none' | 'partial' | 'full' | 'tokenized';

export interface MaskingConfig {
  // Default masking level
  defaultLevel: MaskingLevel;

  // Field-specific rules
  rules: Record<string, FieldMaskingRule>;

  // Token vault for reversible masking
  tokenVaultEnabled: boolean;
}

export interface FieldMaskingRule {
  level: MaskingLevel;
  pattern?: string;          // For partial masking
  preserveLength?: boolean;  // Keep original length
  replacement?: string;      // Character for masking
}

export interface MaskedValue {
  original?: string;         // Only if tokenized
  masked: string;
  token?: string;            // For token vault lookup
}

// ============================================================================
// DEFAULT MASKING RULES
// ============================================================================

export const DEFAULT_MASKING_RULES: Record<string, FieldMaskingRule> = {
  // Identity
  aadhaar: {
    level: 'partial',
    pattern: 'XXXX XXXX ####',   // Show last 4
    preserveLength: true,
  },
  pan: {
    level: 'partial',
    pattern: 'XXXXX####X',       // Show middle 4 + last
    preserveLength: true,
  },
  passport: {
    level: 'partial',
    pattern: 'XX######',
    preserveLength: true,
  },

  // Contact
  phone: {
    level: 'partial',
    pattern: 'XXXXXX####',       // Show last 4
    preserveLength: true,
  },
  email: {
    level: 'partial',
    pattern: 'partial_email',    // Special handling
  },

  // Financial
  accountNumber: {
    level: 'partial',
    pattern: 'XXXXXXXX####',     // Show last 4
    preserveLength: true,
  },
  cardNumber: {
    level: 'partial',
    pattern: 'XXXX XXXX XXXX ####',
    preserveLength: false,
  },
  cvv: {
    level: 'full',
    replacement: '***',
  },

  // Personal
  dateOfBirth: {
    level: 'partial',
    pattern: 'XX/XX/YYYY',       // Hide day/month
  },
  address: {
    level: 'partial',
    pattern: 'partial_address',  // Special handling
  },
  salary: {
    level: 'full',
    replacement: '****',
  },

  // Sensitive
  password: {
    level: 'full',
    replacement: '********',
  },
  pin: {
    level: 'full',
    replacement: '****',
  },
  otp: {
    level: 'full',
    replacement: '******',
  },
};

// ============================================================================
// DATA MASKER
// ============================================================================

export class DataMasker {
  private config: MaskingConfig;
  private tokenVault = new Map<string, string>();

  constructor(config?: Partial<MaskingConfig>) {
    this.config = {
      defaultLevel: 'partial',
      rules: { ...DEFAULT_MASKING_RULES, ...config?.rules },
      tokenVaultEnabled: config?.tokenVaultEnabled ?? false,
    };
  }

  /**
   * Mask a single value
   */
  mask(value: string, fieldName: string): string {
    if (!value) return value;

    const rule = this.config.rules[fieldName] || {
      level: this.config.defaultLevel,
    };

    switch (rule.level) {
      case 'none':
        return value;

      case 'full':
        return rule.replacement || '*'.repeat(value.length);

      case 'partial':
        return this.partialMask(value, rule);

      case 'tokenized':
        return this.tokenize(value, fieldName);

      default:
        return value;
    }
  }

  /**
   * Mask multiple fields in an object
   */
  maskObject<T extends Record<string, unknown>>(obj: T, fields?: string[]): T {
    const result = { ...obj };

    const fieldsToMask = fields || Object.keys(this.config.rules);

    for (const field of fieldsToMask) {
      if (field in result && typeof result[field] === 'string') {
        (result as any)[field] = this.mask(result[field] as string, field);
      }
    }

    return result;
  }

  /**
   * Unmask a tokenized value
   */
  unmask(token: string): string | null {
    if (!this.config.tokenVaultEnabled) {
      throw new Error('Token vault not enabled');
    }
    return this.tokenVault.get(token) || null;
  }

  /**
   * Check if a field should be masked for a given role
   */
  shouldMask(fieldName: string, userRole: string): boolean {
    // PII fields should always be masked for non-authorized roles
    const piiFields = ['aadhaar', 'pan', 'email', 'phone', 'accountNumber', 'cardNumber'];
    const authorizedRoles = ['SUPER_ADMIN', 'ADMIN', 'COMPLIANCE_OFFICER'];

    if (piiFields.includes(fieldName) && !authorizedRoles.includes(userRole)) {
      return true;
    }

    return false;
  }

  // ============================================================================
  // SPECIFIC MASKING METHODS
  // ============================================================================

  maskAadhaar(aadhaar: string): string {
    if (!aadhaar || aadhaar.length < 12) return aadhaar;
    const clean = aadhaar.replace(/\s/g, '');
    return `XXXX XXXX ${clean.slice(-4)}`;
  }

  maskPan(pan: string): string {
    if (!pan || pan.length !== 10) return pan;
    return `${pan.slice(0, 5)}XXXX${pan.slice(-1)}`;
  }

  maskPhone(phone: string): string {
    if (!phone || phone.length < 10) return phone;
    const clean = phone.replace(/\D/g, '');
    return `XXXXXX${clean.slice(-4)}`;
  }

  maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email;
    const [local, domain] = email.split('@');
    const maskedLocal =
      local.length <= 2
        ? '*'.repeat(local.length)
        : `${local[0]}${'*'.repeat(local.length - 2)}${local.slice(-1)}`;
    return `${maskedLocal}@${domain}`;
  }

  maskAccountNumber(accountNumber: string): string {
    if (!accountNumber || accountNumber.length < 4) return accountNumber;
    return `${'X'.repeat(accountNumber.length - 4)}${accountNumber.slice(-4)}`;
  }

  maskCardNumber(cardNumber: string): string {
    if (!cardNumber) return cardNumber;
    const clean = cardNumber.replace(/\D/g, '');
    if (clean.length < 16) return cardNumber;
    return `XXXX XXXX XXXX ${clean.slice(-4)}`;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private partialMask(value: string, rule: FieldMaskingRule): string {
    const pattern = rule.pattern || '';

    // Special patterns
    if (pattern === 'partial_email') {
      return this.maskEmail(value);
    }
    if (pattern === 'partial_address') {
      return this.maskAddress(value);
    }

    // Pattern-based masking
    let result = '';
    let valueIndex = 0;

    for (const char of pattern) {
      if (char === '#') {
        // Show original character
        result += value[valueIndex] || '';
        valueIndex++;
      } else if (char === 'X') {
        // Mask character
        result += rule.replacement || 'X';
        valueIndex++;
      } else {
        // Keep pattern character (space, dash, etc.)
        result += char;
      }
    }

    return result;
  }

  private maskAddress(address: string): string {
    // Show only city/pincode
    const parts = address.split(',').map(p => p.trim());
    if (parts.length <= 2) {
      return parts.map(p => 'XXXXX').join(', ');
    }
    return [
      ...parts.slice(0, -2).map(() => 'XXXXX'),
      ...parts.slice(-2),
    ].join(', ');
  }

  private tokenize(value: string, fieldName: string): string {
    if (!this.config.tokenVaultEnabled) {
      return this.mask(value, fieldName);
    }

    // Generate token
    const token = `TOK_${fieldName}_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    // Store in vault
    this.tokenVault.set(token, value);

    return token;
  }
}

// ============================================================================
// AUDIT LOG SANITIZER
// ============================================================================

export class AuditSanitizer {
  private masker: DataMasker;

  constructor(masker?: DataMasker) {
    this.masker = masker || new DataMasker();
  }

  /**
   * Sanitize data before writing to audit log
   */
  sanitize(data: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        result[key] = this.masker.mask(value, key);
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.sanitize(value as Record<string, unknown>);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Remove sensitive fields entirely
   */
  redact(data: Record<string, unknown>, fields: string[]): Record<string, unknown> {
    const result = { ...data };

    for (const field of fields) {
      if (field in result) {
        result[field] = '[REDACTED]';
      }
    }

    return result;
  }
}

// ============================================================================
// DEFAULT INSTANCES
// ============================================================================

export const dataMasker = new DataMasker();
export const auditSanitizer = new AuditSanitizer(dataMasker);
