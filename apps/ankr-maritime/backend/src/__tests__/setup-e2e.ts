/**
 * E2E Test Setup
 * Global setup and teardown for end-to-end tests
 */

import { beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';

beforeAll(async () => {
  console.log('🔧 Setting up E2E test environment...');

  // Ensure test database is ready
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/mari8x_test';
  process.env.REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6379/1';
  process.env.MINIO_ENDPOINT = process.env.TEST_MINIO_ENDPOINT || 'localhost';
  process.env.MINIO_PORT = process.env.TEST_MINIO_PORT || '9000';
  process.env.MINIO_ACCESS_KEY = process.env.TEST_MINIO_ACCESS_KEY || 'minioadmin';
  process.env.MINIO_SECRET_KEY = process.env.TEST_MINIO_SECRET_KEY || 'minioadmin';
  process.env.MINIO_BUCKET = process.env.TEST_MINIO_BUCKET || 'mari8x-test';
  process.env.JWT_SECRET = 'test-jwt-secret-e2e';
  process.env.NODE_ENV = 'test';

  // Run migrations
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('✅ Database migrations applied');
  } catch (error) {
    console.error('❌ Failed to apply migrations:', error);
    throw error;
  }

  // Generate Prisma Client
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma Client generated');
  } catch (error) {
    console.error('❌ Failed to generate Prisma Client:', error);
    throw error;
  }

  console.log('✅ E2E test environment ready');
});

afterAll(async () => {
  console.log('🧹 Cleaning up E2E test environment...');

  // Clean up test data
  // Note: Individual test suites handle their own cleanup

  console.log('✅ E2E test environment cleaned up');
});
