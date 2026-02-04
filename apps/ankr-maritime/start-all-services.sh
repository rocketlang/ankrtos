#!/bin/bash
#
# Mari8X Services Startup Script
# Starts backend, enables AIS, runs port scraper test
#

set -e

echo "========================================="
echo "Mari8X Services Startup"
echo "========================================="
echo ""

# Change to backend directory
cd /root/apps/ankr-maritime/backend

# Step 1: Check .env exists
echo "📋 Step 1: Checking environment..."
if [ ! -f .env ]; then
  echo "❌ .env file not found!"
  exit 1
fi

# Check for required vars
if ! grep -q "DATABASE_URL" .env; then
  echo "⚠️  DATABASE_URL not found in .env"
fi

echo "✅ Environment file exists"
echo ""

# Step 2: Enable AIS if not already
echo "📡 Step 2: Enabling AIS tracking..."
if ! grep -q "ENABLE_AIS=true" .env; then
  echo "Adding ENABLE_AIS=true to .env"
  cat >> .env << 'EOF'

# AIS Tracking
ENABLE_AIS=true
AISSTREAM_API_KEY=a41cdb7961c35208fa4adfda7bf70702308968bd

EOF
  echo "✅ AIS enabled"
else
  echo "✅ AIS already enabled"
fi
echo ""

# Step 3: Start backend
echo "🚀 Step 3: Starting backend..."
if pm2 describe ankr-maritime-backend > /dev/null 2>&1; then
  echo "Backend already exists, restarting..."
  pm2 restart ankr-maritime-backend
else
  echo "Starting new backend instance..."
  pm2 start npm --name "ankr-maritime-backend" -- run dev
fi

echo "⏳ Waiting 5 seconds for startup..."
sleep 5
echo ""

# Step 4: Check backend health
echo "🏥 Step 4: Health check..."
if pm2 describe ankr-maritime-backend | grep -q "online"; then
  echo "✅ Backend is ONLINE"
else
  echo "❌ Backend failed to start!"
  echo ""
  echo "Logs:"
  pm2 logs ankr-maritime-backend --lines 20 --nostream
  exit 1
fi
echo ""

# Step 5: Verify AIS started
echo "📡 Step 5: Verifying AIS..."
sleep 3
AIS_CHECK=$(pm2 logs ankr-maritime-backend --lines 100 --nostream 2>&1 | grep -i "AIS tracking started" || echo "")
if [ -n "$AIS_CHECK" ]; then
  echo "✅ AIS tracking confirmed!"
  echo "$AIS_CHECK"
else
  echo "⚠️  AIS not detected in logs (may still be starting)"
fi
echo ""

# Step 6: Test port scraper (5 ports)
echo "🌍 Step 6: Testing port scraper (5 ports)..."
echo "This may take 1-2 minutes..."
npx tsx scripts/scrape-ports-daily.ts --target 5 || echo "⚠️  Scraper test failed (check logs)"
echo ""

# Step 7: Show status
echo "========================================="
echo "🎉 Startup Complete!"
echo "========================================="
echo ""
echo "Services Status:"
pm2 list | grep -E "ankr-maritime|id"
echo ""
echo "Next Steps:"
echo "1. Check logs: pm2 logs ankr-maritime-backend"
echo "2. Verify AIS: pm2 logs ankr-maritime-backend | grep AIS"
echo "3. Set up cron: crontab -e"
echo "   Add: 0 2 * * * cd /root/apps/ankr-maritime/backend && npx tsx scripts/scrape-ports-daily.ts"
echo ""
echo "GraphQL Playground: http://localhost:4008/graphql"
echo "Frontend: http://localhost:3008"
echo ""
