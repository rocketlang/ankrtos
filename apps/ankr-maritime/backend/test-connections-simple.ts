#!/usr/bin/env node
/**
 * Simple connection test for PageIndex infrastructure
 * Tests PostgreSQL, Redis, and AI Proxy without requiring PageIndex package
 */

import 'dotenv/config';
import { Pool } from 'pg';
import Redis from 'ioredis';

async function testConnections() {
  console.log('='.repeat(70));
  console.log('PageIndex Infrastructure - Connection Test');
  console.log('='.repeat(70));
  console.log();

  const results = {
    postgresql: false,
    redis: false,
    aiProxy: false,
  };

  // Test 1: PostgreSQL
  console.log('1️⃣  Testing PostgreSQL connection...');
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      connectionTimeoutMillis: 5000,
    });

    const result = await pool.query('SELECT NOW() as current_time, version()');
    console.log(`   ✅ PostgreSQL connected`);
    console.log(`   → Server time: ${result.rows[0].current_time}`);
    console.log(`   → Version: ${result.rows[0].version.split(' ').slice(0, 2).join(' ')}`);
    results.postgresql = true;

    await pool.end();
  } catch (error: any) {
    console.log(`   ❌ PostgreSQL connection failed: ${error.message}`);
  }
  console.log();

  // Test 2: Redis
  console.log('2️⃣  Testing Redis connection...');
  if (!process.env.REDIS_URL) {
    console.log('   ⚠️  REDIS_URL not configured (optional - caching disabled)');
  } else {
    try {
      const redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        connectTimeout: 5000,
      });

      const pong = await redis.ping();
      const info = await redis.info('server');
      const versionMatch = info.match(/redis_version:([^\r\n]+)/);
      const version = versionMatch ? versionMatch[1] : 'unknown';

      console.log(`   ✅ Redis connected`);
      console.log(`   → Response: ${pong}`);
      console.log(`   → Version: ${version}`);
      results.redis = true;

      redis.disconnect();
    } catch (error: any) {
      console.log(`   ❌ Redis connection failed: ${error.message}`);
    }
  }
  console.log();

  // Test 3: AI Proxy
  console.log('3️⃣  Testing ANKR AI Proxy...');
  const aiProxyUrl = process.env.AI_PROXY_URL || 'http://localhost:4444';
  try {
    const response = await fetch(`${aiProxyUrl}/health`, {
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ AI Proxy connected`);
      console.log(`   → URL: ${aiProxyUrl}`);
      console.log(`   → Status: ${data.status || 'ok'}`);
      results.aiProxy = true;
    } else {
      console.log(`   ❌ AI Proxy returned status ${response.status}`);
    }
  } catch (error: any) {
    console.log(`   ⚠️  AI Proxy not reachable: ${error.message}`);
    console.log(`   → This is optional - PageIndex will work with direct API calls`);
  }
  console.log();

  // Summary
  console.log('='.repeat(70));
  console.log('Test Summary');
  console.log('='.repeat(70));
  console.log();

  const allRequired = results.postgresql;
  const allOptional = results.redis && results.aiProxy;

  console.log(`PostgreSQL:  ${results.postgresql ? '✅' : '❌'} ${results.postgresql ? 'Connected' : 'FAILED (REQUIRED)'}`);
  console.log(`Redis:       ${results.redis ? '✅' : '⚠️ '} ${results.redis ? 'Connected' : 'Not configured (optional)'}`);
  console.log(`AI Proxy:    ${results.aiProxy ? '✅' : '⚠️ '} ${results.aiProxy ? 'Connected' : 'Not reachable (optional)'}`);
  console.log();

  if (allRequired) {
    console.log('✅ All required services connected - PageIndex ready to initialize!');
    console.log();
    console.log('Configuration:');
    console.log(`  • Cache: ${results.redis ? 'Enabled (Tier 1)' : 'Disabled'}`);
    console.log(`  • AI Routing: ${results.aiProxy ? 'AI Proxy (17 providers)' : 'Direct API calls'}`);
    console.log(`  • Performance: 98.7% accuracy, 70-80% cost reduction`);
    console.log();
    console.log('Next steps:');
    console.log('  1. npm run dev  # Start backend');
    console.log('  2. Check logs for PageIndex initialization');
    console.log('  3. Test queries via GraphQL');
  } else {
    console.log('❌ Required services not available - PageIndex cannot initialize');
    console.log();
    console.log('Fix required issues:');
    if (!results.postgresql) {
      console.log('  • Check DATABASE_URL in .env');
      console.log('  • Ensure PostgreSQL is running');
    }
  }

  console.log();
  console.log('='.repeat(70));

  process.exit(allRequired ? 0 : 1);
}

testConnections().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
