/**
 * @ankr-bfc/utils
 *
 * BFC Shared Utilities
 * Validation, formatting, and helper functions for Indian banking
 *
 * @example
 * ```typescript
 * import {
 *   isValidPAN,
 *   isValidAadhaar,
 *   formatINR,
 *   maskAccountNumber,
 *   calculateEMI
 * } from '@ankr-bfc/utils';
 *
 * // Validation
 * isValidPAN('ABCDE1234F'); // true
 * isValidAadhaar('1234 5678 9012'); // validates with Verhoeff
 *
 * // Formatting
 * formatINR(1500000); // '₹15,00,000'
 * formatINR(15000000, { compact: true }); // '₹1.50 Cr'
 *
 * // Masking
 * maskAccountNumber('1234567890123'); // '•••••••••0123'
 *
 * // Calculations
 * calculateEMI(1000000, 10.5, 60); // 21494
 * ```
 */

export * from './validation.js';
export * from './formatting.js';
