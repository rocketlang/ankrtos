/**
 * Type Validation and Utility Function Tests
 */

import { describe, it, expect } from 'vitest';
import {
  validateContainerNumber,
  parseISOType,
  getContainerTEU,
} from '../types/container';

describe('Container Type Utilities', () => {
  describe('validateContainerNumber', () => {
    it('should accept valid ISO 6346 container numbers', () => {
      // MSCU100000X - need valid check digit
      // Using known valid: MSCU1234561 is invalid, but let's compute one
      // MSKU0012345 → compute check digit
      expect(validateContainerNumber('CSQU3054383')).toBe(true);
    });

    it('should reject empty input', () => {
      expect(validateContainerNumber('')).toBe(false);
    });

    it('should reject wrong length', () => {
      expect(validateContainerNumber('MSCU12345')).toBe(false);
      expect(validateContainerNumber('MSCU12345678')).toBe(false);
    });

    it('should reject lowercase owner code', () => {
      expect(validateContainerNumber('mscu1234567')).toBe(false);
    });

    it('should reject invalid category identifier (not U/J/Z)', () => {
      expect(validateContainerNumber('MSCA1234567')).toBe(false);
    });

    it('should reject non-digit serial', () => {
      expect(validateContainerNumber('MSCU12345A7')).toBe(false);
    });

    it('should reject wrong check digit', () => {
      // A valid number with wrong last digit
      expect(validateContainerNumber('CSQU3054380')).toBe(false);
    });
  });

  describe('parseISOType', () => {
    it('should parse 20ft GP standard', () => {
      const result = parseISOType('22G1');
      expect(result.size).toBe('20');
      expect(result.type).toBe('GP');
      expect(result.height).toBe('standard');
    });

    it('should parse 40ft GP standard', () => {
      const result = parseISOType('42G1');
      expect(result.size).toBe('40');
      expect(result.type).toBe('GP');
      expect(result.height).toBe('standard');
    });

    it('should parse 40ft HC (high cube)', () => {
      const result = parseISOType('45G1');
      expect(result.size).toBe('45');
      expect(result.type).toBe('GP');
      expect(result.height).toBe('high_cube');
    });

    it('should parse 20ft reefer', () => {
      const result = parseISOType('22R1');
      expect(result.size).toBe('20');
      expect(result.type).toBe('RF');
    });

    it('should parse 40ft reefer HC', () => {
      const result = parseISOType('45R1');
      expect(result.size).toBe('45');
      expect(result.type).toBe('RF');
      expect(result.height).toBe('high_cube');
    });

    it('should parse open top', () => {
      const result = parseISOType('22U1');
      expect(result.size).toBe('20');
      expect(result.type).toBe('OT');
    });

    it('should parse flat rack', () => {
      const result = parseISOType('42P1');
      expect(result.size).toBe('40');
      expect(result.type).toBe('PL');
    });

    it('should parse tank container', () => {
      const result = parseISOType('22T1');
      expect(result.size).toBe('20');
      expect(result.type).toBe('TK');
    });

    it('should parse 45ft high cube', () => {
      const result = parseISOType('L5G1');
      expect(result.size).toBe('45');
      expect(result.type).toBe('GP');
      expect(result.height).toBe('high_cube');
    });
  });

  describe('getContainerTEU', () => {
    it('should return 1 for 20ft', () => {
      expect(getContainerTEU('20')).toBe(1);
    });

    it('should return 2 for 40ft', () => {
      expect(getContainerTEU('40')).toBe(2);
    });

    it('should return 2.25 for 45ft', () => {
      expect(getContainerTEU('45')).toBe(2.25);
    });
  });
});
