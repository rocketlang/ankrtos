/**
 * BFC Formatting Utilities
 */

import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

// ============================================================================
// CURRENCY FORMATTING
// ============================================================================

/**
 * Format as Indian Rupees
 */
export function formatINR(amount: number, options?: { compact?: boolean }): string {
  if (options?.compact) {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    }
    if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format number in Indian style (lakhs, crores)
 */
export function formatIndianNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

/**
 * Convert amount to words (Indian style)
 */
export function amountToWords(amount: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  if (amount === 0) return 'Zero Rupees Only';

  const convert = (n: number): string => {
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  };

  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let result = convert(rupees) + ' Rupees';
  if (paise > 0) {
    result += ' and ' + convert(paise) + ' Paise';
  }
  result += ' Only';

  return result;
}

// ============================================================================
// DATE FORMATTING
// ============================================================================

/**
 * Format date in Indian format (DD/MM/YYYY)
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return 'Invalid date';
  return format(d, 'dd/MM/yyyy');
}

/**
 * Format date and time
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return 'Invalid date';
  return format(d, 'dd/MM/yyyy hh:mm a');
}

/**
 * Format relative time
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return 'Invalid date';
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Format for API (ISO)
 */
export function formatForAPI(date: Date): string {
  return date.toISOString();
}

/**
 * Format financial year
 */
export function formatFinancialYear(date: Date): string {
  const month = date.getMonth();
  const year = date.getFullYear();
  if (month < 3) {
    return `FY ${year - 1}-${String(year).slice(-2)}`;
  }
  return `FY ${year}-${String(year + 1).slice(-2)}`;
}

// ============================================================================
// MASKING
// ============================================================================

/**
 * Mask account number
 */
export function maskAccountNumber(account: string): string {
  if (account.length <= 4) return account;
  return '•'.repeat(account.length - 4) + account.slice(-4);
}

/**
 * Mask PAN
 */
export function maskPAN(pan: string): string {
  if (pan.length !== 10) return pan;
  return pan.slice(0, 2) + '••••••' + pan.slice(-2);
}

/**
 * Mask Aadhaar
 */
export function maskAadhaar(aadhaar: string): string {
  const cleaned = aadhaar.replace(/\s/g, '');
  if (cleaned.length !== 12) return aadhaar;
  return '•••• •••• ' + cleaned.slice(-4);
}

/**
 * Mask mobile number
 */
export function maskMobile(mobile: string): string {
  const cleaned = mobile.replace(/\D/g, '');
  if (cleaned.length < 10) return mobile;
  return '••••••' + cleaned.slice(-4);
}

/**
 * Mask email
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const maskedLocal = local.slice(0, 2) + '•'.repeat(Math.max(0, local.length - 2));
  return maskedLocal + '@' + domain;
}

/**
 * Mask card number
 */
export function maskCardNumber(card: string): string {
  const cleaned = card.replace(/\s/g, '');
  if (cleaned.length < 16) return card;
  return '•••• •••• •••• ' + cleaned.slice(-4);
}

// ============================================================================
// TEXT FORMATTING
// ============================================================================

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Title case
 */
export function toTitleCase(str: string): string {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
  );
}

/**
 * Truncate text
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length - 3) + '...';
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format interest rate
 */
export function formatInterestRate(rate: number): string {
  return `${rate.toFixed(2)}% p.a.`;
}
