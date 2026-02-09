#!/usr/bin/env tsx
/**
 * Database Connection Monitor
 * Real-time monitoring of PostgreSQL connections and health
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ConnectionStats {
  total: number;
  active: number;
  idle: number;
  idle_in_transaction: number;
  waiting: number;
  by_application: { name: string; count: number; idle: number }[];
  by_state: { state: string; count: number }[];
}

async function getConnectionStats(): Promise<ConnectionStats> {
  // Total connections
  const [total] = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint as count
    FROM pg_stat_activity
    WHERE datname = 'ankr_maritime'
  `;

  // By state
  const byState = await prisma.$queryRaw<
    Array<{ state: string | null; count: bigint }>
  >`
    SELECT state, COUNT(*)::bigint as count
    FROM pg_stat_activity
    WHERE datname = 'ankr_maritime'
    GROUP BY state
    ORDER BY count DESC
  `;

  // By application
  const byApp = await prisma.$queryRaw<
    Array<{ application_name: string; total: bigint; idle: bigint }>
  >`
    SELECT
      COALESCE(application_name, 'unnamed') as application_name,
      COUNT(*)::bigint as total,
      COUNT(*) FILTER (WHERE state = 'idle')::bigint as idle
    FROM pg_stat_activity
    WHERE datname = 'ankr_maritime'
    GROUP BY application_name
    ORDER BY total DESC
    LIMIT 10
  `;

  const states = byState.reduce(
    (acc, row) => {
      const state = row.state || 'null';
      acc[state] = Number(row.count);
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    total: Number(total.count),
    active: states.active || 0,
    idle: states.idle || 0,
    idle_in_transaction: states.idle_in_transaction || 0,
    waiting: states.waiting || 0,
    by_application: byApp.map(row => ({
      name: row.application_name,
      count: Number(row.total),
      idle: Number(row.idle),
    })),
    by_state: byState.map(row => ({
      state: row.state || 'null',
      count: Number(row.count),
    })),
  };
}

async function getOldestIdleConnections(): Promise<
  Array<{
    pid: number;
    application: string;
    duration: string;
    query: string;
  }>
> {
  const result = await prisma.$queryRaw<
    Array<{
      pid: number;
      application_name: string;
      idle_duration: string;
      last_query: string;
    }>
  >`
    SELECT
      pid,
      COALESCE(application_name, 'unnamed') as application_name,
      EXTRACT(EPOCH FROM (NOW() - state_change))::text as idle_duration,
      LEFT(query, 100) as last_query
    FROM pg_stat_activity
    WHERE datname = 'ankr_maritime'
      AND state = 'idle'
      AND state_change < NOW() - INTERVAL '5 minutes'
    ORDER BY state_change ASC
    LIMIT 5
  `;

  return result.map(row => ({
    pid: row.pid,
    application: row.application_name,
    duration: `${Math.floor(parseFloat(row.idle_duration) / 60)}m ${Math.floor(parseFloat(row.idle_duration) % 60)}s`,
    query: row.last_query,
  }));
}

async function getDatabaseSize(): Promise<string> {
  const [result] = await prisma.$queryRaw<Array<{ size: string }>>`
    SELECT pg_size_pretty(pg_database_size('ankr_maritime')) as size
  `;
  return result.size;
}

async function getLongRunningQueries(): Promise<
  Array<{
    pid: number;
    duration: string;
    state: string;
    query: string;
  }>
> {
  const result = await prisma.$queryRaw<
    Array<{
      pid: number;
      duration: string;
      state: string;
      query: string;
    }>
  >`
    SELECT
      pid,
      EXTRACT(EPOCH FROM (NOW() - query_start))::text as duration,
      state,
      LEFT(query, 100) as query
    FROM pg_stat_activity
    WHERE datname = 'ankr_maritime'
      AND query_start < NOW() - INTERVAL '10 seconds'
      AND state != 'idle'
    ORDER BY query_start ASC
    LIMIT 5
  `;

  return result.map(row => ({
    pid: row.pid,
    duration: `${Math.floor(parseFloat(row.duration))}s`,
    state: row.state,
    query: row.query,
  }));
}

function printSeparator(char = '=', length = 80) {
  console.log(char.repeat(length));
}

async function displayStats() {
  console.clear();

  const stats = await getConnectionStats();
  const dbSize = await getDatabaseSize();
  const longQueries = await getLongRunningQueries();
  const oldIdle = await getOldestIdleConnections();

  printSeparator();
  console.log('📊 ANKR MARITIME DATABASE MONITOR');
  console.log(`⏰ ${new Date().toLocaleString()}`);
  printSeparator();

  console.log('\n🔌 CONNECTION SUMMARY');
  console.log(`   Total Connections:      ${stats.total}`);
  console.log(`   ├─ Active:              ${stats.active}`);
  console.log(`   ├─ Idle:                ${stats.idle}`);
  console.log(`   ├─ Idle in Transaction: ${stats.idle_in_transaction}`);
  console.log(`   └─ Waiting:             ${stats.waiting}`);
  console.log(`\n💾 Database Size: ${dbSize}`);

  if (stats.by_application.length > 0) {
    console.log('\n📱 TOP APPLICATIONS');
    stats.by_application.slice(0, 5).forEach((app, i) => {
      console.log(
        `   ${i + 1}. ${app.name.padEnd(30)} ${app.count.toString().padStart(3)} connections (${app.idle} idle)`
      );
    });
  }

  if (longQueries.length > 0) {
    console.log('\n⏱️  LONG-RUNNING QUERIES');
    longQueries.forEach((query, i) => {
      console.log(`   ${i + 1}. PID ${query.pid} | ${query.duration} | ${query.state}`);
      console.log(`      ${query.query}...`);
    });
  }

  if (oldIdle.length > 0) {
    console.log('\n💤 OLD IDLE CONNECTIONS');
    oldIdle.forEach((conn, i) => {
      console.log(
        `   ${i + 1}. PID ${conn.pid} | ${conn.application} | Idle: ${conn.duration}`
      );
      console.log(`      ${conn.query}...`);
    });
  }

  // Health assessment
  console.log('\n🏥 HEALTH ASSESSMENT');
  const health = [];

  if (stats.total > 200) {
    health.push('⚠️  High connection count - consider reducing pool sizes');
  }
  if (stats.idle > stats.total * 0.5) {
    health.push('⚠️  Many idle connections - check connection cleanup');
  }
  if (stats.idle_in_transaction > 0) {
    health.push('⚠️  Idle transactions detected - may cause locks');
  }
  if (longQueries.length > 3) {
    health.push('⚠️  Multiple long-running queries detected');
  }

  if (health.length === 0) {
    console.log('   ✅ All systems nominal');
  } else {
    health.forEach(msg => console.log(`   ${msg}`));
  }

  printSeparator();
  console.log('Press Ctrl+C to exit | Refreshing every 5 seconds...\n');
}

async function main() {
  console.log('🚀 Starting database monitor...\n');

  // Display stats immediately
  await displayStats();

  // Then refresh every 5 seconds
  setInterval(displayStats, 5000);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n👋 Shutting down monitor...');
    await prisma.$disconnect();
    process.exit(0);
  });
}

main().catch(console.error);
