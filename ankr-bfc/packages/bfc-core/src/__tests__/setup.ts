/**
 * Test Setup
 */

import { vi } from 'vitest';

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-secret';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars!!!';
process.env.AI_PROXY_URL = 'http://localhost:4444';
process.env.EON_URL = 'http://localhost:4005';
process.env.COMPLYMITRA_URL = 'http://localhost:4015';

// Global mocks
vi.mock('redis', () => ({
  createClient: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    keys: vi.fn(() => []),
  })),
}));

// Console suppression for cleaner test output
const originalConsole = { ...console };

beforeAll(() => {
  console.log = vi.fn();
  console.info = vi.fn();
  console.debug = vi.fn();
  // Keep error and warn visible
});

afterAll(() => {
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.debug = originalConsole.debug;
});
