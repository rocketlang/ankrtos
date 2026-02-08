#!/bin/bash
# Setup AIS Materialized Views
# This creates 3 views for lightning-fast queries with your latest millions of positions

cd "$(dirname "$0")"

echo "🚀 Setting up AIS materialized views..."
echo ""
echo "This will create:"
echo "  1. ais_dashboard_stats - Main dashboard (total positions, vessels, speeds)"
echo "  2. ais_nav_status_breakdown - Navigation status distribution"
echo "  3. ais_fun_facts_cache - 23 fun facts computed from AIS data"
echo ""
echo "⏱️  This may take 5-10 minutes with 50M+ positions..."
echo ""

# Run the SQL file
PGPASSWORD='indrA@0612' psql -U ankr -d ankr_maritime -f create-ais-views.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ SUCCESS! Views created."
  echo ""
  echo "📊 Testing the views..."
  PGPASSWORD='indrA@0612' psql -U ankr -d ankr_maritime -c "SELECT total_positions, unique_vessels, computed_at FROM ais_dashboard_stats;"

  echo ""
  echo "🔄 Refreshing views with latest data..."
  npx tsx src/scripts/refresh-ais-views.ts

  echo ""
  echo "✅ ALL DONE!"
  echo ""
  echo "Your latest millions of positions are now in the materialized views!"
  echo "Landing page will show updated stats when you switch to aisLiveDashboard query."
else
  echo ""
  echo "❌ Error creating views. Check the output above."
  exit 1
fi
