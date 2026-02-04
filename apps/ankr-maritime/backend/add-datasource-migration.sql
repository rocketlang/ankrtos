-- Add dataSource tracking to port_tariffs
ALTER TABLE port_tariffs ADD COLUMN IF NOT EXISTS "dataSource" VARCHAR(50) DEFAULT 'SIMULATED';
ALTER TABLE port_tariffs ADD COLUMN IF NOT EXISTS "sourceUrl" TEXT;
ALTER TABLE port_tariffs ADD COLUMN IF NOT EXISTS "scrapedAt" TIMESTAMP;

-- Create index on dataSource
CREATE INDEX IF NOT EXISTS "port_tariffs_dataSource_idx" ON port_tariffs("dataSource");

-- Mark all existing tariffs as SIMULATED
UPDATE port_tariffs SET "dataSource" = 'SIMULATED' WHERE "dataSource" IS NULL OR "dataSource" = 'SIMULATED';

-- Show results
SELECT
  "dataSource",
  COUNT(*) as count
FROM port_tariffs
GROUP BY "dataSource";
