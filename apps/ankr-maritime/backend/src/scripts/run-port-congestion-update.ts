#!/usr/bin/env tsx
/**
 * Port Congestion Update Script
 * Updates port congestion snapshots from AIS data
 */

import { runCongestionSnapshotJob } from '../jobs/congestion-snapshot-cron.js';

console.log('🚀 Starting Port Congestion Update');
console.log('═'.repeat(80));
console.log();

runCongestionSnapshotJob()
  .then((result) => {
    console.log();
    console.log('═'.repeat(80));
    console.log('✅ Port Congestion Update Complete');
    console.log(`   Snapshots Created: ${result.snapshotsCreated}`);
    console.log(`   Errors: ${result.errors}`);
    console.log(`   Duration: ${result.duration}ms`);
    console.log('═'.repeat(80));
    process.exit(0);
  })
  .catch((error) => {
    console.error();
    console.error('═'.repeat(80));
    console.error('❌ Fatal Error:', error);
    console.error('═'.repeat(80));
    process.exit(1);
  });
