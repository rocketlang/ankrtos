#!/bin/bash
###############################################################################
# OpenSeaMap Coverage Status Check
# Quick script to check current status of OpenSeaMap coverage
###############################################################################

PGPASSWORD='indrA@0612' psql -h localhost -p 6432 -U ankr -d ankr_maritime <<'SQL'
\timing off
\pset border 2

SELECT
  '🌍 OpenSeaMap Coverage Status' as title;

SELECT
  COUNT(*) as "Total Ports",
  COUNT(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL) as "Ports with Coordinates",
  COUNT(*) FILTER (WHERE "openSeaMapCheckedAt" IS NOT NULL) as "Checked",
  COUNT(*) FILTER (WHERE "openSeaMapCheckedAt" IS NULL AND latitude IS NOT NULL) as "Unchecked",
  ROUND(100.0 * COUNT(*) FILTER (WHERE "openSeaMapCheckedAt" IS NOT NULL) / COUNT(*), 1) || '%' as "Progress"
FROM ports;

SELECT
  '📊 Coverage Quality' as metric;

SELECT
  COUNT(*) FILTER (WHERE "hasOpenSeaMap" = true) as "Ports with Data",
  COUNT(*) FILTER (WHERE "hasOpenSeaMap" = false) as "No Data",
  ROUND(100.0 * COUNT(*) FILTER (WHERE "hasOpenSeaMap" = true) / COUNT(*), 1) || '%' as "Coverage %",
  AVG("openSeaMapFeatureCount")::int as "Avg Features per Port"
FROM ports
WHERE "openSeaMapCheckedAt" IS NOT NULL;

SELECT
  '🏆 Top Ports by OSM Features' as title;

SELECT
  name as "Port Name",
  unlocode as "UN/LOCODE",
  "openSeaMapFeatureCount" as "Features",
  CASE
    WHEN ("openSeaMapCoverage"->>'hasBerths')::boolean THEN '🛳️ ' ELSE ''
  END ||
  CASE
    WHEN ("openSeaMapCoverage"->>'hasAnchorages')::boolean THEN '⚓ ' ELSE ''
  END ||
  CASE
    WHEN ("openSeaMapCoverage"->>'hasHarbor')::boolean THEN '🏢 ' ELSE ''
  END ||
  CASE
    WHEN ("openSeaMapCoverage"->>'hasTerminals')::boolean THEN '🏗️ ' ELSE ''
  END ||
  CASE
    WHEN ("openSeaMapCoverage"->>'hasNavAids')::boolean THEN '💡' ELSE ''
  END as "Features Present"
FROM ports
WHERE "openSeaMapCheckedAt" IS NOT NULL
  AND "hasOpenSeaMap" = true
ORDER BY "openSeaMapFeatureCount" DESC
LIMIT 10;

SELECT
  '⏰ Last Check' as info;

SELECT
  MAX("openSeaMapCheckedAt") as "Latest Check Time",
  COUNT(*) FILTER (WHERE "openSeaMapCheckedAt" > NOW() - INTERVAL '24 hours') as "Checked in Last 24h",
  COUNT(*) FILTER (WHERE "openSeaMapCheckedAt" > NOW() - INTERVAL '1 hour') as "Checked in Last Hour"
FROM ports;

SQL

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "💡 Quick Stats:"
echo ""
PGPASSWORD='indrA@0612' psql -h localhost -p 6432 -U ankr -d ankr_maritime -t -c "
SELECT
  '   Total: ' || COUNT(*) || ' ports' ||
  ' | Checked: ' || COUNT(*) FILTER (WHERE \"openSeaMapCheckedAt\" IS NOT NULL) ||
  ' (' || ROUND(100.0 * COUNT(*) FILTER (WHERE \"openSeaMapCheckedAt\" IS NOT NULL) / COUNT(*), 1) || '%)' ||
  ' | With Data: ' || COUNT(*) FILTER (WHERE \"hasOpenSeaMap\" = true) ||
  ' (' || ROUND(100.0 * COUNT(*) FILTER (WHERE \"hasOpenSeaMap\" = true) / NULLIF(COUNT(*) FILTER (WHERE \"openSeaMapCheckedAt\" IS NOT NULL), 0), 1) || '% of checked)'
FROM ports
WHERE latitude IS NOT NULL;
" | sed 's/^[[:space:]]*//'
echo "═══════════════════════════════════════════════════════════"
