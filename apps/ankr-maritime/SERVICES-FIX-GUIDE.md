# Mari8X Services Fix Guide
**Date:** February 1, 2026
**Issues:** Backend not running, Port scraper stalled, AIS not activated, Equasis extraction broken

---

## 🔴 Current Issues

### Issue 1: Backend Not Running
- **Problem:** `ankr-maritime-backend` doesn't exist in PM2
- **Impact:** Port scraper, AIS, and Equasis can't run
- **Status:** Frontend is running, backend is NOT

### Issue 2: Port Scraper Stalled
- **Problem:** Still at 69 ports (no progress since last night)
- **Cause:** No cron job + backend not running
- **Target:** 800 ports at 10 ports/day

### Issue 3: AIS Not Activated
- **Problem:** Code is 100% complete but service not started
- **Cause:** `ENABLE_AIS=true` not set + backend not running
- **Impact:** No vessel position tracking

### Issue 4: Equasis Owner Extraction Broken
- **Problem:** Login works, but ownership fields stay NULL
- **Cause:** Page selectors need adjustment
- **Impact:** Can't get registered owner, ship manager, operator

---

## ✅ Complete Fix (10 minutes)

### Step 1: Start Backend (2 mins)

```bash
cd /root/apps/ankr-maritime/backend

# Check if .env exists
cat .env | grep -i "database\|port"

# Start backend with PM2
pm2 start npm --name "ankr-maritime-backend" -- run dev

# Verify it started
pm2 logs ankr-maritime-backend --lines 20
```

**Expected output:**
```
✅ Database connected: ankr_maritime
✅ GraphQL server ready at http://localhost:4008/graphql
✅ Server started on port 4008
```

### Step 2: Enable AIS Tracking (1 min)

```bash
cd /root/apps/ankr-maritime/backend

# Add AIS config to .env
cat >> .env << 'EOF'

# AIS Tracking
ENABLE_AIS=true
AISSTREAM_API_KEY=a41cdb7961c35208fa4adfda7bf70702308968bd

EOF

# Restart backend to pick up env
pm2 restart ankr-maritime-backend

# Verify AIS started
pm2 logs ankr-maritime-backend --lines 30 | grep -i "ais"
```

**Expected output:**
```
🌊 AIS tracking started (9 trade areas)
✅ AISstream connected!
📡 Monitoring: Singapore Strait, Suez, Panama, etc.
```

### Step 3: Run Port Scraper (2 mins)

```bash
cd /root/apps/ankr-maritime/backend

# Test run: scrape 5 ports
npx tsx scripts/scrape-ports-daily.ts --target 5

# Check progress
npx tsx -e "
import { portTariffScraperService } from './src/services/port-tariff-scraper.js';
const progress = await portTariffScraperService.getProgress();
console.log('Ports scraped:', progress.scrapedPorts);
console.log('Completion:', progress.percentComplete.toFixed(1) + '%');
"
```

**Expected output:**
```
Current Progress:
  Total Ports: 800
  Scraped: 74 (+5)
  Completion: 9.3%
```

### Step 4: Set Up Daily Cron (1 min)

```bash
# Add cron job for daily scraping
crontab -e

# Add this line (scrape 10 ports daily at 2 AM):
0 2 * * * cd /root/apps/ankr-maritime/backend && npx tsx scripts/scrape-ports-daily.ts >> /root/logs/port-scraper.log 2>&1
```

### Step 5: Fix Equasis Extraction (4 mins)

```bash
cd /root/apps/ankr-maritime/backend

# Test Equasis on known vessel
npx tsx -e "
import { equasisScraperService } from './src/services/equasis-scraper.js';

console.log('Testing Equasis scraper...');
const result = await equasisScraperService.scrapeVesselOwnership('9348522');
console.log('Result:', JSON.stringify(result, null, 2));

if (result.registeredOwner) {
  console.log('✅ Owner extraction working!');
} else {
  console.log('❌ Owner extraction still broken - needs selector fix');
}
"
```

**If broken, update selectors:**

```typescript
// File: backend/src/services/equasis-scraper.ts
// Line ~160-180

// Try alternative selectors:
const ownerSelectors = [
  'text=Registered owner',
  'text=Owner',
  'td:has-text("Registered owner") + td',
  '.company-name',
  '[data-test="owner-name"]'
];

for (const selector of ownerSelectors) {
  try {
    const owner = await page.locator(selector).textContent();
    if (owner && owner.trim()) {
      registeredOwner = owner.trim();
      break;
    }
  } catch (e) {
    continue;
  }
}
```

---

## 🎯 Verification Checklist

### Backend ✓
```bash
pm2 list | grep maritime
# Should show: ankr-maritime-backend | online

curl http://localhost:4008/graphql -H "Content-Type: application/json" -d '{"query":"{ __typename }"}'
# Should return: {"data":{"__typename":"Query"}}
```

### AIS ✓
```bash
pm2 logs ankr-maritime-backend --lines 50 | grep -i "ais\|vessel.*position"
# Should show: AIS tracking started, AISstream connected

# Check database for new positions
psql ankr_maritime -c "SELECT COUNT(*) FROM vessel_positions WHERE created_at > NOW() - INTERVAL '1 hour';"
```

### Port Scraper ✓
```bash
# Check current count
psql ankr_maritime -c "SELECT COUNT(DISTINCT port_id) FROM port_tariffs;"
# Should be > 69

# Check last scrape time
psql ankr_maritime -c "SELECT MAX(scraped_at) FROM port_tariffs;"
# Should be recent
```

### Equasis ✓
```bash
# Check for owner data
psql ankr_maritime -c "SELECT COUNT(*) FROM vessels WHERE registered_owner IS NOT NULL;"
# Should be > 0

# Check recent updates
psql ankr_maritime -c "SELECT name, registered_owner, ownership_updated_at FROM vessels WHERE ownership_updated_at > NOW() - INTERVAL '1 day';"
```

---

## 📊 Expected Status After Fix

| Service | Before | After | Status |
|---------|--------|-------|--------|
| **Backend** | ❌ Not running | ✅ Online (4008) | Fixed |
| **AIS Tracking** | ❌ Disabled | ✅ Active (9 areas) | Fixed |
| **Port Scraper** | ⚠️ 69 ports (stalled) | ✅ 74+ ports (running) | Fixed |
| **Equasis** | ⚠️ Login OK, no data | ✅ Owner data extracted | Needs testing |

---

## 🚀 Performance Expectations

### AIS Tracking
- **Vessels monitored:** 3,599+ with MMSI
- **Position updates:** Every 3-60 seconds (depends on vessel speed)
- **Database writes:** ~50-200 position records/hour
- **Cost:** $0/month (free tier)

### Port Scraper
- **Daily target:** 10 ports
- **Timeline to 800:** ~73 days (from 69 → 800)
- **Tariffs extracted:** ~10-15 per port
- **Database writes:** ~100-150 tariffs/day
- **Cost:** $0/month (self-scraped)

### Equasis
- **Daily limit:** 50 vessels (conservative)
- **Delay:** 10 seconds between requests
- **Cache:** 7 years
- **Use case:** On-demand enrichment (not bulk)
- **Cost:** $0/month (manual compliance)

---

## 🔧 Quick Commands Reference

```bash
# Start everything
pm2 start ankr-maritime-backend
pm2 logs ankr-maritime-backend

# Run port scraper manually
cd /root/apps/ankr-maritime/backend
npx tsx scripts/scrape-ports-daily.ts --target 10

# Check AIS status
pm2 logs ankr-maritime-backend | grep AIS

# Test Equasis
npx tsx scripts/test-equasis.ts 9348522

# Check database stats
psql ankr_maritime -c "
SELECT
  (SELECT COUNT(*) FROM vessels) as total_vessels,
  (SELECT COUNT(*) FROM vessel_positions) as total_positions,
  (SELECT COUNT(DISTINCT port_id) FROM port_tariffs) as ports_scraped,
  (SELECT COUNT(*) FROM vessels WHERE registered_owner IS NOT NULL) as vessels_with_owner;
"
```

---

## 📝 Next Steps (After Fix)

1. **Monitor for 24 hours:**
   - Check AIS position count increases
   - Verify port scraper runs at 2 AM
   - Confirm no Equasis blocks

2. **Tune if needed:**
   - Adjust scraper rate if too slow/fast
   - Modify AIS trade areas if needed
   - Update Equasis selectors if extraction fails

3. **Then proceed to Phase 5:**
   - Voyage Monitoring (31 tasks)
   - Real-time ETA calculation
   - Performance monitoring

---

**Ready to start fixes?** Run Step 1 first! 🚀
