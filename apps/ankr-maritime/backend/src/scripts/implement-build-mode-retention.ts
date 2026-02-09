#!/usr/bin/env tsx
/**
 * AIS Build Mode Retention - Safe Initial Setup
 *
 * Philosophy: Liberal retention during build phase
 * - Keep all data for 30+ days
 * - Create aggregates in parallel (don't delete raw)
 * - Remove only exact duplicates
 * - Tag zones for future optimization
 *
 * Run: tsx implement-build-mode-retention.ts
 */

import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

async function main() {
  console.log('🚧 AIS Build Mode Retention - Safe Implementation');
  console.log('================================================\n');

  // Step 1: Add zone_type column
  console.log('Step 1: Adding zone_type column...');
  try {
    await prisma.$executeRaw`
      ALTER TABLE vessel_positions
      ADD COLUMN IF NOT EXISTS zone_type TEXT;
    `;
    console.log('✅ zone_type column added\n');
  } catch (error) {
    console.log('ℹ️  zone_type column already exists\n');
  }

  // Step 2: Remove exact duplicates (safe - no information loss)
  console.log('Step 2: Removing exact duplicates...');
  const duplicateResult = await prisma.$executeRaw`
    DELETE FROM vessel_positions a
    USING vessel_positions b
    WHERE a.id > b.id
      AND a."vesselId" = b."vesselId"
      AND a.timestamp = b.timestamp
      AND a.latitude = b.latitude
      AND a.longitude = b.longitude
      AND COALESCE(a.speed, -1) = COALESCE(b.speed, -1);
  `;
  console.log(`✅ Removed ${duplicateResult} exact duplicate positions\n`);

  // Step 3: Tag port zones (20km radius)
  console.log('Step 3: Tagging port zones (this may take a few minutes)...');

  // First, check if PostGIS is available
  try {
    await prisma.$executeRaw`SELECT PostGIS_Version();`;
    console.log('✅ PostGIS is available');

    // Tag port zones
    const portZoneResult = await prisma.$executeRaw`
      UPDATE vessel_positions vp
      SET zone_type = 'port'
      WHERE zone_type IS NULL
        AND EXISTS (
          SELECT 1 FROM ports p
          WHERE p.latitude IS NOT NULL
            AND p.longitude IS NOT NULL
            AND ST_DWithin(
              ST_MakePoint(p.longitude, p.latitude)::geography,
              ST_MakePoint(vp.longitude, vp.latitude)::geography,
              20000
            )
        );
    `;
    console.log(`✅ Tagged ${portZoneResult} positions as 'port' zone\n`);
  } catch (error) {
    console.log('⚠️  PostGIS not available, using simple distance calculation instead');

    // Fallback: Simple distance calculation (less accurate but works)
    const portZoneResult = await prisma.$executeRaw`
      UPDATE vessel_positions vp
      SET zone_type = 'port'
      WHERE zone_type IS NULL
        AND EXISTS (
          SELECT 1 FROM ports p
          WHERE p.latitude IS NOT NULL
            AND p.longitude IS NOT NULL
            AND (
              -- Simple distance formula (rough approximation)
              POWER(p.latitude - vp.latitude, 2) +
              POWER(p.longitude - vp.longitude, 2)
            ) < 0.03  -- ~20km at equator
        );
    `;
    console.log(`✅ Tagged ${portZoneResult} positions as 'port' zone (fallback method)\n`);
  }

  // Step 4: Tag remaining as open sea
  console.log('Step 4: Tagging open sea positions...');
  const openSeaResult = await prisma.$executeRaw`
    UPDATE vessel_positions
    SET zone_type = 'open_sea'
    WHERE zone_type IS NULL;
  `;
  console.log(`✅ Tagged ${openSeaResult} positions as 'open_sea'\n`);

  // Step 5: Create index on zone_type
  console.log('Step 5: Creating index on zone_type...');
  try {
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_vessel_positions_zone_type
        ON vessel_positions(zone_type);
    `;
    console.log('✅ Index created\n');
  } catch (error) {
    console.log('ℹ️  Index already exists\n');
  }

  // Step 6: Create daily summaries table
  console.log('Step 6: Creating daily summaries table...');
  try {
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS ais_daily_summaries (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "vesselId" TEXT NOT NULL,
        date DATE NOT NULL,
        zone_type TEXT,
        position_count INT,
        avg_lat DECIMAL(10, 7),
        avg_lng DECIMAL(10, 7),
        avg_speed DECIMAL(5, 2),
        min_speed DECIMAL(5, 2),
        max_speed DECIMAL(5, 2),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE("vesselId", date, zone_type)
      );
    `;
    console.log('✅ ais_daily_summaries table created\n');
  } catch (error) {
    console.log('ℹ️  ais_daily_summaries table already exists\n');
  }

  // Step 7: Generate initial daily summaries (last 7 days)
  console.log('Step 7: Generating daily summaries for last 7 days...');
  const summaryResult = await prisma.$executeRaw`
    INSERT INTO ais_daily_summaries (
      "vesselId", date, zone_type,
      position_count, avg_lat, avg_lng,
      avg_speed, min_speed, max_speed
    )
    SELECT
      "vesselId",
      DATE(timestamp) as date,
      zone_type,
      COUNT(*) as position_count,
      AVG(latitude) as avg_lat,
      AVG(longitude) as avg_lng,
      AVG(speed) as avg_speed,
      MIN(speed) as min_speed,
      MAX(speed) as max_speed
    FROM vessel_positions
    WHERE DATE(timestamp) < CURRENT_DATE
      AND DATE(timestamp) >= CURRENT_DATE - INTERVAL '7 days'
      AND zone_type IS NOT NULL
    GROUP BY "vesselId", DATE(timestamp), zone_type
    ON CONFLICT ("vesselId", date, zone_type) DO UPDATE SET
      position_count = EXCLUDED.position_count,
      avg_lat = EXCLUDED.avg_lat,
      avg_lng = EXCLUDED.avg_lng,
      avg_speed = EXCLUDED.avg_speed,
      min_speed = EXCLUDED.min_speed,
      max_speed = EXCLUDED.max_speed,
      updated_at = NOW();
  `;
  console.log(`✅ Generated ${summaryResult} daily summary records\n`);

  // Step 8: Show statistics
  console.log('📊 Current AIS Data Statistics');
  console.log('==============================\n');

  const stats = await prisma.$queryRaw<Array<{
    zone_type: string;
    position_count: bigint;
    vessel_count: bigint;
    earliest: Date;
    latest: Date;
    avg_positions_per_vessel: number;
  }>>`
    SELECT
      zone_type,
      COUNT(*) as position_count,
      COUNT(DISTINCT "vesselId") as vessel_count,
      MIN(timestamp) as earliest,
      MAX(timestamp) as latest,
      ROUND(COUNT(*)::numeric / COUNT(DISTINCT "vesselId")::numeric, 2) as avg_positions_per_vessel
    FROM vessel_positions
    WHERE zone_type IS NOT NULL
    GROUP BY zone_type
    ORDER BY position_count DESC;
  `;

  stats.forEach(stat => {
    console.log(`Zone: ${stat.zone_type}`);
    console.log(`  Positions: ${Number(stat.position_count).toLocaleString()}`);
    console.log(`  Vessels: ${Number(stat.vessel_count).toLocaleString()}`);
    console.log(`  Avg positions/vessel: ${stat.avg_positions_per_vessel}`);
    console.log(`  Time range: ${stat.earliest.toISOString().split('T')[0]} → ${stat.latest.toISOString().split('T')[0]}`);
    console.log();
  });

  // Step 9: Storage estimation
  console.log('💾 Storage Estimation');
  console.log('=====================\n');

  const totalPositions = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM vessel_positions;
  `;

  const totalSummaries = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM ais_daily_summaries;
  `;

  const posCount = Number(totalPositions[0].count);
  const summaryCount = Number(totalSummaries[0].count);

  const rawStorageGB = (posCount * 200) / (1024 * 1024 * 1024);
  const summaryStorageGB = (summaryCount * 150) / (1024 * 1024 * 1024);

  console.log(`Raw positions: ${posCount.toLocaleString()} (~${rawStorageGB.toFixed(2)} GB)`);
  console.log(`Daily summaries: ${summaryCount.toLocaleString()} (~${summaryStorageGB.toFixed(2)} GB)`);
  console.log(`Total: ~${(rawStorageGB + summaryStorageGB).toFixed(2)} GB`);
  console.log();

  // Calculate when to transition
  const growthPerDay = 25_000_000; // 25M positions/day
  const bytesPerPosition = 200;
  const daysUntil100GB = Math.floor(
    (100 * 1024 * 1024 * 1024 - posCount * bytesPerPosition) /
    (growthPerDay * bytesPerPosition)
  );

  console.log('📅 Transition Planning');
  console.log('=====================\n');
  console.log(`Current storage: ${rawStorageGB.toFixed(2)} GB`);
  console.log(`Growing at: ~${(growthPerDay * bytesPerPosition / 1024 / 1024 / 1024).toFixed(2)} GB/day`);
  console.log(`Days until 100GB: ~${daysUntil100GB} days`);
  console.log(`Estimated transition date: ${new Date(Date.now() + daysUntil100GB * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`);
  console.log();

  console.log('✅ Build Mode Setup Complete!');
  console.log('=============================\n');
  console.log('Next steps:');
  console.log('1. ✅ Duplicate removal - DONE');
  console.log('2. ✅ Zone classification - DONE');
  console.log('3. ✅ Daily summaries - DONE');
  console.log('4. ⏭️  Build algorithms using both raw + summary data');
  console.log('5. ⏭️  Monitor storage growth (~check weekly)');
  console.log('6. ⏭️  Transition to aggressive retention when storage > 100GB');
  console.log();
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
