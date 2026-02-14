#!/bin/bash
# Active Vessel Monitor - Check vessels transmitting in last 30 minutes
# Usage: ./check-active-vessels.sh [interval_minutes]

INTERVAL=${1:-30}  # Default 30 minutes

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚢 Active Vessel Monitor - Last $INTERVAL Minutes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

sudo -u postgres psql -d ankr_maritime -t <<EOF
-- Active vessels in last N minutes
SELECT
    '📊 Summary:' as metric,
    '' as value
UNION ALL
SELECT
    '  Active Vessels',
    COUNT(DISTINCT "vesselId")::text
FROM vessel_positions
WHERE timestamp > NOW() - INTERVAL '$INTERVAL minutes'
UNION ALL
SELECT
    '  Total Positions',
    COUNT(*)::text
FROM vessel_positions
WHERE timestamp > NOW() - INTERVAL '$INTERVAL minutes'
UNION ALL
SELECT
    '  Latest Update',
    MAX(timestamp)::text
FROM vessel_positions
UNION ALL
SELECT
    '  Data Age',
    (NOW() - MAX(timestamp))::text
FROM vessel_positions;

-- Activity breakdown
\echo ''
\echo '📈 Activity Breakdown:'
SELECT
    activity_period,
    vessels::text as vessels
FROM (
    SELECT
        CASE
            WHEN timestamp > NOW() - INTERVAL '5 minutes' THEN '  0-5 min ago  '
            WHEN timestamp > NOW() - INTERVAL '10 minutes' THEN '  5-10 min ago '
            WHEN timestamp > NOW() - INTERVAL '15 minutes' THEN '  10-15 min ago'
            WHEN timestamp > NOW() - INTERVAL '30 minutes' THEN '  15-30 min ago'
            ELSE '  30+ min ago  '
        END as activity_period,
        COUNT(DISTINCT "vesselId") as vessels,
        CASE
            WHEN timestamp > NOW() - INTERVAL '5 minutes' THEN 1
            WHEN timestamp > NOW() - INTERVAL '10 minutes' THEN 2
            WHEN timestamp > NOW() - INTERVAL '15 minutes' THEN 3
            WHEN timestamp > NOW() - INTERVAL '30 minutes' THEN 4
            ELSE 5
        END as sort_order
    FROM vessel_positions
    WHERE timestamp > NOW() - INTERVAL '$INTERVAL minutes'
    GROUP BY activity_period, sort_order
) sub
ORDER BY sort_order;

-- Most active vessels
\echo ''
\echo '🔝 Top 10 Most Active Vessels:'
SELECT
    COALESCE(v.name, 'Unknown') as vessel_name,
    COALESCE(v.imo, 'N/A') as imo,
    COUNT(*) as positions,
    TO_CHAR(MAX(vp.timestamp), 'HH24:MI:SS') as last_update
FROM vessel_positions vp
LEFT JOIN vessels v ON v.id = vp."vesselId"
WHERE vp.timestamp > NOW() - INTERVAL '$INTERVAL minutes'
GROUP BY v.id, v.name, v.imo
ORDER BY positions DESC
LIMIT 10;
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Tip: Run with different intervals:"
echo "   ./check-active-vessels.sh 15   # Last 15 minutes"
echo "   ./check-active-vessels.sh 60   # Last hour"
echo "   ./check-active-vessels.sh 1440 # Last 24 hours"
