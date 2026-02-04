# GISIS Issue Resolution - February 2, 2026

## 🔴 Problem Summary

**GISIS Bulk Enrichment Failed**: 0% success rate (40/7,349 vessels skipped)

**Root Cause**: IMO GISIS website now requires authentication (login)

---

## 🎯 Immediate Solution: Switch to Equasis

### Step 1: Register for Equasis (5 minutes)

1. **Go to**: http://www.equasis.org/EquasisWeb/public/Registration
2. **Fill form**:
   - Email address
   - Password
   - First name, Last name
   - Company name
   - Accept terms
3. **Verify email**: Check inbox for verification link
4. **Login**: Test at http://www.equasis.org/EquasisWeb/public/HomePage

### Step 2: Add Credentials to Backend (1 minute)

```bash
cd /root/apps/ankr-maritime/backend

# Add to .env file
echo "EQUASIS_USERNAME=your-email@example.com" >> .env
echo "EQUASIS_PASSWORD=your-password" >> .env
```

### Step 3: Update Auto-Enrichment to Use Equasis (2 minutes)

**File**: `/backend/src/services/auto-enrichment.service.ts`

**Change** (line ~50):
```typescript
// OLD: Use IMO GISIS
import { imoGisisEnrichmentService } from './imo-gisis-enrichment.service.js';

// NEW: Use Equasis
import { EquasisScraper } from './equasis-scraper.js';
const equasisScraper = new EquasisScraper();
```

**Change** (line ~80):
```typescript
// OLD: GISIS enrichment
const result = await imoGisisEnrichmentService.enrichVessel(item.imoNumber);

// NEW: Equasis enrichment
await equasisScraper.init();
const equasisData = await equasisScraper.getVesselOwnership(item.imoNumber);
const result = { success: !!equasisData, data: equasisData };
```

### Step 4: Restart Bulk Enrichment (1 minute)

```bash
# Stop current GISIS job (failing)
kill 615308 615309 615329

# Start new Equasis job
nohup npm run enrich:equasis > /tmp/equasis-enrichment.log 2>&1 &
echo $! > /tmp/equasis.pid
```

### Step 5: Monitor Progress

```bash
# Watch live log
tail -f /tmp/equasis-enrichment.log

# Check statistics
npx tsx scripts/check-ais-gisis-status.ts
```

---

## 📊 Expected Results

### With Equasis
- **Coverage**: 7,349 vessels
- **Time**: ~20 hours (10s per vessel)
- **Success Rate**: 60-70% (vessels in Equasis database)
- **Cost**: $0 (free)

### Data Retrieved
- ✅ Registered Owner
- ✅ Ship Manager
- ✅ Operator
- ✅ Flag State
- ✅ Company addresses

---

## 🚀 Alternative: MarineTraffic API (Paid, Fast)

### If You Need Faster/More Reliable Enrichment

**Pricing**: ~$0.01 per vessel lookup
**Total Cost**: ~$73 for 7,349 vessels
**Time**: ~2 hours (100 vessels/minute with rate limits)

**Setup**:
1. Sign up: https://www.marinetraffic.com/en/ais-api-services
2. Get API key
3. Add to `.env`:
   ```bash
   MARINETRAFFIC_API_KEY=your-api-key-here
   ```
4. Use API instead of scraping (much faster, more reliable)

---

## 🔄 Long-Term Fix: Hybrid Strategy

**Best Practice**: Use multiple sources with fallback

```typescript
// Priority order:
1. Cache (7-day TTL) → Instant
2. Equasis (free) → 10s per vessel
3. MarineTraffic API (paid) → 1s per vessel, high-value only

// Example flow:
async enrichVessel(imo: string) {
  // 1. Check cache
  const cached = await getFromCache(imo);
  if (cached && isRecent(cached)) return cached;

  // 2. Try Equasis (free)
  const equasis = await equasisScraper.getVesselOwnership(imo);
  if (equasis) {
    await saveToCache(imo, equasis);
    return equasis;
  }

  // 3. Fallback to API (paid, high-priority only)
  if (isPriorityVessel(imo)) {
    const api = await marineTrafficAPI.getVessel(imo);
    if (api) {
      await saveToCache(imo, api);
      return api;
    }
  }

  return null;
}
```

---

## 🎯 Action Items

### Immediate (Today)
- [ ] Register for Equasis account
- [ ] Add credentials to `.env`
- [ ] Stop GISIS bulk job
- [ ] Start Equasis bulk job

### Tomorrow
- [ ] Verify Equasis enrichment working
- [ ] Check success rate (target: 60%+)
- [ ] Monitor for any blocking/rate limiting

### Next Week
- [ ] Evaluate MarineTraffic API for user queries
- [ ] Implement hybrid strategy (cache + Equasis + API)
- [ ] Add fallback logic

---

## 📞 Support

### Equasis
- **Registration**: http://www.equasis.org/EquasisWeb/public/Registration
- **Support**: support@equasis.org
- **Status**: Free, public database

### MarineTraffic
- **API Docs**: https://www.marinetraffic.com/en/ais-api-services
- **Pricing**: https://www.marinetraffic.com/en/ais-api-services/pricing
- **Support**: api-support@marinetraffic.com

---

## ✅ Success Criteria

After implementing Equasis fix:
- ✅ Bulk enrichment succeeds (60%+ vessels)
- ✅ Auto-enrichment system works (4 sources)
- ✅ User queries trigger enrichment
- ✅ Email parsing triggers enrichment
- ✅ Daily cron enriches top 100 vessels

---

**Created**: February 2, 2026
**Status**: READY TO IMPLEMENT
**Time to Fix**: 10 minutes
**Cost**: $0 (Equasis) or ~$73 (MarineTraffic API)
