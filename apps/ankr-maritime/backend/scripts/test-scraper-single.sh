#!/bin/bash
# Test single scraper run with monitoring

mkdir -p /root/logs/mari8x/single-test

cd /root/apps/ankr-maritime/backend

echo "🧪 Testing Port Scraper (single run - 10 ports)..."
npx tsx scripts/cron-port-scraper.ts 2>&1 | tee /root/logs/mari8x/single-test/port-scraper.log

echo ""
echo "✅ Port scraper test complete"
echo "Check: /root/logs/mari8x/single-test/port-scraper.log"
