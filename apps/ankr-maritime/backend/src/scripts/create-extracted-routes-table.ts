#!/usr/bin/env tsx
/**
 * Mari8XOSRM - Create ExtractedAISRoute Table
 *
 * This script manually creates the extracted_ais_routes table
 * when Prisma migrations fail due to permission issues.
 */

import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

async function main() {
  console.log('🔧 Creating extracted_ais_routes table...\n');

  const createTableSQL = `
    -- Mari8XOSRM: Extracted AIS Routes Table
    CREATE TABLE IF NOT EXISTS extracted_ais_routes (
      id TEXT PRIMARY KEY,

      -- Vessel information
      vessel_id TEXT NOT NULL,
      vessel_type TEXT NOT NULL,

      -- Port pair
      origin_port_id TEXT NOT NULL,
      dest_port_id TEXT NOT NULL,

      -- Voyage timing
      departure_time TIMESTAMP(3) NOT NULL,
      arrival_time TIMESTAMP(3) NOT NULL,

      -- Distance metrics
      great_circle_nm DOUBLE PRECISION NOT NULL,
      actual_sailed_nm DOUBLE PRECISION NOT NULL,
      distance_factor DOUBLE PRECISION NOT NULL,
      duration_hours DOUBLE PRECISION NOT NULL,
      avg_speed_knots DOUBLE PRECISION NOT NULL,

      -- Quality metrics
      quality_score DOUBLE PRECISION NOT NULL,
      coverage_percent DOUBLE PRECISION NOT NULL,
      total_positions INTEGER NOT NULL,

      -- Route classification
      route_type TEXT NOT NULL,
      via_points TEXT[] NOT NULL DEFAULT '{}',

      -- Simplified position data (JSON)
      positions_data JSONB,

      -- Metadata
      extracted_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

      -- Foreign keys
      CONSTRAINT fk_vessel FOREIGN KEY (vessel_id) REFERENCES vessels(id) ON DELETE CASCADE,
      CONSTRAINT fk_origin_port FOREIGN KEY (origin_port_id) REFERENCES ports(id),
      CONSTRAINT fk_dest_port FOREIGN KEY (dest_port_id) REFERENCES ports(id)
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_extracted_ais_routes_vessel_id ON extracted_ais_routes(vessel_id);
    CREATE INDEX IF NOT EXISTS idx_extracted_ais_routes_origin_dest ON extracted_ais_routes(origin_port_id, dest_port_id);
    CREATE INDEX IF NOT EXISTS idx_extracted_ais_routes_vessel_type ON extracted_ais_routes(vessel_type);
    CREATE INDEX IF NOT EXISTS idx_extracted_ais_routes_quality_score ON extracted_ais_routes(quality_score);
    CREATE INDEX IF NOT EXISTS idx_extracted_ais_routes_route_type ON extracted_ais_routes(route_type);
  `;

  try {
    // Check if table exists
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'extracted_ais_routes'
      );
    `;

    const exists = (tableExists as any)[0]?.exists;

    if (exists) {
      console.log('✓ Table "extracted_ais_routes" already exists\n');

      // Show table stats
      const count = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM extracted_ais_routes;
      `;
      console.log(`Current routes in table: ${(count as any)[0]?.count || 0}\n`);

      return;
    }

    console.log('Creating table and indexes...');
    await prisma.$executeRawUnsafe(createTableSQL);

    console.log('\n✅ Table created successfully!\n');
    console.log('Table: extracted_ais_routes');
    console.log('Indexes:');
    console.log('  - idx_extracted_ais_routes_vessel_id');
    console.log('  - idx_extracted_ais_routes_origin_dest');
    console.log('  - idx_extracted_ais_routes_vessel_type');
    console.log('  - idx_extracted_ais_routes_quality_score');
    console.log('  - idx_extracted_ais_routes_route_type');
    console.log('\nYou can now run the route extraction test:\n');
    console.log('  npx tsx src/scripts/test-route-extraction.ts\n');

  } catch (error) {
    console.error('❌ Failed to create table:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
