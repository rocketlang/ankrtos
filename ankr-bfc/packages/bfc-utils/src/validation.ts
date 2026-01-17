/**
 * BFC Validation Utilities
 * Indian banking and regulatory validations
 */

import { z } from 'zod';

// ============================================================================
// INDIAN DOCUMENT VALIDATIONS
// ============================================================================

/**
 * Validate PAN number (AAAAA9999A format)
 */
export function isValidPAN(pan: string): boolean {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan.toUpperCase());
}

/**
 * Validate Aadhaar number (12 digits with Verhoeff checksum)
 */
export function isValidAadhaar(aadhaar: string): boolean {
  const cleaned = aadhaar.replace(/\s/g, '');
  if (!/^\d{12}$/.test(cleaned)) return false;

  // Verhoeff checksum validation
  const d = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
  ];

  const p = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
  ];

  let c = 0;
  const digits = cleaned.split('').map(Number).reverse();

  for (let i = 0; i < digits.length; i++) {
    c = d[c][p[i % 8][digits[i]]];
  }

  return c === 0;
}

/**
 * Validate GSTIN (15 characters)
 */
export function isValidGSTIN(gstin: string): boolean {
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin.toUpperCase());
}

/**
 * Validate IFSC code (11 characters)
 */
export function isValidIFSC(ifsc: string): boolean {
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  return ifscRegex.test(ifsc.toUpperCase());
}

/**
 * Validate Indian mobile number
 */
export function isValidMobile(mobile: string): boolean {
  const cleaned = mobile.replace(/[\s-+]/g, '');
  // With or without country code
  const mobileRegex = /^(91)?[6-9]\d{9}$/;
  return mobileRegex.test(cleaned);
}

/**
 * Validate Indian PIN code
 */
export function isValidPincode(pincode: string): boolean {
  const pincodeRegex = /^[1-9][0-9]{5}$/;
  return pincodeRegex.test(pincode);
}

/**
 * Validate UPI ID
 */
export function isValidUPI(upi: string): boolean {
  const upiRegex = /^[\w.-]+@[\w]+$/;
  return upiRegex.test(upi);
}

/**
 * Validate Indian vehicle registration number
 */
export function isValidVehicleNumber(vehicle: string): boolean {
  const vehicleRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/;
  return vehicleRegex.test(vehicle.replace(/\s/g, '').toUpperCase());
}

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const PANSchema = z.string().refine(isValidPAN, 'Invalid PAN number');
export const AadhaarSchema = z.string().refine(isValidAadhaar, 'Invalid Aadhaar number');
export const GSTINSchema = z.string().refine(isValidGSTIN, 'Invalid GSTIN');
export const IFSCSchema = z.string().refine(isValidIFSC, 'Invalid IFSC code');
export const MobileSchema = z.string().refine(isValidMobile, 'Invalid mobile number');
export const PincodeSchema = z.string().refine(isValidPincode, 'Invalid PIN code');
export const UPISchema = z.string().refine(isValidUPI, 'Invalid UPI ID');

export const IndianAddressSchema = z.object({
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: PincodeSchema,
  country: z.literal('India').default('India'),
});

export const CustomerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: MobileSchema,
  pan: PANSchema.optional(),
  aadhaar: AadhaarSchema.optional(),
  address: IndianAddressSchema.optional(),
});

export const CreditApplicationSchema = z.object({
  customerId: z.string().uuid(),
  type: z.enum(['personal', 'home', 'vehicle', 'gold', 'business', 'education']),
  amount: z.number().positive().max(100000000), // 10 crore max
  tenure: z.number().int().min(3).max(360), // 3 months to 30 years
  purpose: z.string().min(10).max(500),
});

export const TransferSchema = z.object({
  fromAccount: z.string(),
  toAccount: z.string(),
  amount: z.number().positive(),
  mode: z.enum(['upi', 'neft', 'rtgs', 'imps']),
  remarks: z.string().max(100).optional(),
});

// ============================================================================
// BANKING VALIDATIONS
// ============================================================================

/**
 * Validate account number (9-18 digits)
 */
export function isValidAccountNumber(account: string): boolean {
  const accountRegex = /^\d{9,18}$/;
  return accountRegex.test(account.replace(/\s/g, ''));
}

/**
 * Calculate loan EMI
 */
export function calculateEMI(
  principal: number,
  annualRate: number,
  tenureMonths: number
): number {
  const monthlyRate = annualRate / 12 / 100;
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi);
}

/**
 * Get loan amortization schedule
 */
export function getAmortizationSchedule(
  principal: number,
  annualRate: number,
  tenureMonths: number
) {
  const emi = calculateEMI(principal, annualRate, tenureMonths);
  const monthlyRate = annualRate / 12 / 100;
  let balance = principal;
  const schedule = [];

  for (let month = 1; month <= tenureMonths; month++) {
    const interest = Math.round(balance * monthlyRate);
    const principalPaid = emi - interest;
    balance = Math.max(0, balance - principalPaid);

    schedule.push({
      month,
      emi,
      principal: principalPaid,
      interest,
      balance,
    });
  }

  return schedule;
}

/**
 * Check if amount is within RTGS range (2 lakh minimum)
 */
export function isRTGSEligible(amount: number): boolean {
  return amount >= 200000;
}

/**
 * Check if amount is within IMPS limit (5 lakh max)
 */
export function isIMPSEligible(amount: number): boolean {
  return amount <= 500000;
}

/**
 * Get recommended transfer mode based on amount
 */
export function getRecommendedTransferMode(amount: number): 'upi' | 'imps' | 'neft' | 'rtgs' {
  if (amount <= 100000) return 'upi';
  if (amount <= 500000) return 'imps';
  if (amount < 200000) return 'neft';
  return 'rtgs';
}
