/**
 * Complymitra Integration Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComplymitraClient } from '../integrations/complymitra';

// Mock fetch
global.fetch = vi.fn();

describe('ComplymitraClient', () => {
  let client: ComplymitraClient;

  beforeEach(() => {
    client = new ComplymitraClient('http://localhost:4015', 'test-api-key');
    vi.resetAllMocks();
  });

  describe('verifyPAN', () => {
    it('should validate PAN format', async () => {
      // Mock API failure to test fallback validation
      (global.fetch as any).mockRejectedValue(new Error('API unavailable'));

      const validPan = 'ABCDE1234F';
      const result = await client.verifyPAN(validPan);

      expect(result.pan).toBe(validPan);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid PAN format', async () => {
      (global.fetch as any).mockRejectedValue(new Error('API unavailable'));

      const invalidPan = '12345ABCD';
      const result = await client.verifyPAN(invalidPan);

      expect(result.valid).toBe(false);
    });

    it('should identify PAN category', async () => {
      (global.fetch as any).mockRejectedValue(new Error('API unavailable'));

      const individualPan = 'ABCPE1234F'; // P = Individual
      const result = await client.verifyPAN(individualPan);

      expect(result.category).toBe('Individual');
    });
  });

  describe('verifyGSTIN', () => {
    it('should validate GSTIN format', async () => {
      (global.fetch as any).mockRejectedValue(new Error('API unavailable'));

      const validGstin = '27AAPFU0939F1ZV';
      const result = await client.verifyGSTIN(validGstin);

      expect(result.gstin).toBe(validGstin);
      expect(result.stateCode).toBe('27'); // Maharashtra
    });

    it('should extract state code from GSTIN', async () => {
      (global.fetch as any).mockRejectedValue(new Error('API unavailable'));

      const gstin = '29AAPFU0939F1ZV'; // Karnataka
      const result = await client.verifyGSTIN(gstin);

      expect(result.stateCode).toBe('29');
    });
  });

  describe('calculateTDS', () => {
    it('should calculate TDS for section 194J', () => {
      const result = client.calculateTDS(100000, '194J', { panProvided: true });

      expect(result.section).toBe('194J');
      expect(result.rate).toBe(10);
      expect(result.tdsAmount).toBe(10000);
      expect(result.netAmount).toBeLessThan(100000);
    });

    it('should apply higher rate without PAN', () => {
      const withPan = client.calculateTDS(100000, '194J', { panProvided: true });
      const withoutPan = client.calculateTDS(100000, '194J', { panProvided: false });

      expect(withoutPan.rate).toBeGreaterThanOrEqual(withPan.rate);
      expect(withoutPan.higherRateApplicable).toBe(true);
    });

    it('should include surcharge for high amounts', () => {
      const result = client.calculateTDS(10000000, '194J', { panProvided: true }); // 1 crore

      expect(result.surcharge).toBeGreaterThan(0);
    });

    it('should include cess', () => {
      const result = client.calculateTDS(100000, '194J');

      expect(result.cess).toBeGreaterThan(0);
    });
  });

  describe('calculateGST', () => {
    it('should calculate intra-state GST', () => {
      const result = client.calculateGST(10000, 18, { isInterState: false });

      expect(result.cgst).toBe(900); // 9%
      expect(result.sgst).toBe(900); // 9%
      expect(result.igst).toBe(0);
      expect(result.totalGst).toBe(1800);
      expect(result.totalAmount).toBe(11800);
    });

    it('should calculate inter-state GST', () => {
      const result = client.calculateGST(10000, 18, { isInterState: true });

      expect(result.cgst).toBe(0);
      expect(result.sgst).toBe(0);
      expect(result.igst).toBe(1800); // 18%
      expect(result.totalGst).toBe(1800);
    });

    it('should include cess when applicable', () => {
      const result = client.calculateGST(10000, 28, {
        isInterState: false,
        includeCess: true,
        cessRate: 12,
      });

      expect(result.cess).toBe(1200); // 12%
      expect(result.totalGst).toBe(2800 + 1200);
    });

    it('should include HSN/SAC codes', () => {
      const result = client.calculateGST(10000, 18, {
        hsnCode: '8471',
        sacCode: '998314',
      });

      expect(result.hsnCode).toBe('8471');
      expect(result.sacCode).toBe('998314');
    });
  });

  describe('runAMLCheck', () => {
    it('should return review recommendation on API failure', async () => {
      (global.fetch as any).mockRejectedValue(new Error('API unavailable'));

      const result = await client.runAMLCheck({
        name: 'John Doe',
        dateOfBirth: '1990-01-01',
        pan: 'ABCDE1234F',
      });

      expect(result.recommendation).toBe('REVIEW');
      expect(result.riskLevel).toBe('MEDIUM');
    });

    it('should handle successful API response', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            riskLevel: 'LOW',
            riskScore: 20,
            flags: [],
            watchlistMatches: [],
            pep: false,
            sanctioned: false,
            adverseMedia: false,
            recommendation: 'APPROVE',
          }),
      });

      const result = await client.runAMLCheck({
        name: 'John Doe',
      });

      expect(result.riskLevel).toBe('LOW');
      expect(result.recommendation).toBe('APPROVE');
    });
  });

  describe('screenTransaction', () => {
    it('should flag large cash transactions', async () => {
      (global.fetch as any).mockRejectedValue(new Error('API unavailable'));

      const result = await client.screenTransaction({
        amount: 1500000, // 15 lakh
        customerId: 'CUST-001',
        channel: 'CASH',
      });

      expect(result.flagged).toBe(true);
      expect(result.flags).toContain('CTR_THRESHOLD');
      expect(result.requiresReporting).toBe(true);
      expect(result.reportType).toBe('CTR');
    });

    it('should flag very large transactions', async () => {
      (global.fetch as any).mockRejectedValue(new Error('API unavailable'));

      const result = await client.screenTransaction({
        amount: 5000000, // 50 lakh
        customerId: 'CUST-001',
        channel: 'NEFT',
      });

      expect(result.flagged).toBe(true);
      expect(result.flags).toContain('LARGE_TRANSACTION');
    });

    it('should not flag normal transactions', async () => {
      (global.fetch as any).mockRejectedValue(new Error('API unavailable'));

      const result = await client.screenTransaction({
        amount: 50000, // 50k
        customerId: 'CUST-001',
        channel: 'UPI',
      });

      expect(result.flagged).toBe(false);
      expect(result.flags.length).toBe(0);
    });
  });
});
