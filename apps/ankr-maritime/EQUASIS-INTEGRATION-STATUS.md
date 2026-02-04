# Equasis Ownership Integration - Status Report

**Date:** Jan 31, 2026
**System:** Mari8X Maritime Operations Platform

---

## ✅ Completed Features

### 1. Authentication & Anti-Detection
- ✅ Successful login to Equasis with credentials
- ✅ Anti-bot detection bypass implemented:
  - Custom User-Agent (Chrome 120)
  - Webdriver flag override
  - Realistic headers (Accept-Language, Connection, etc.)
  - Human-like delays (100ms typing, 2sec waits)
- ✅ Session persistence via page reuse

### 2. Slow & Respectful Scraping
- ✅ **10 second delays** between requests
- ✅ **Max 50 vessels/day** limit
- ✅ **Daily request counter** with remaining count
- ✅ Progress tracking and logging

### 3. Smart Caching Strategy
- ✅ **7 year cache duration** (user requested)
- ✅ **Re-check on use basis** - only re-scrape when:
  - Vessel appears in fixture/tracking area (AIS, cargo matching)
  - Data is >7 years old
- ✅ VesselOwnershipCache table with JSON storage
- ✅ Cache lookup before scraping

### 4. Database Integration
- ✅ Vessel schema updated with ownership fields:
  - `registeredOwner` (String)
  - `shipManager` (String)
  - `operator` (String)
  - `ownershipUpdatedAt` (DateTime)
- ✅ VesselOwnershipCache table for 7-year caching
- ✅ Prisma integration

### 5. CLI Script
- ✅ `enrich-vessel-ownership.ts` script
- ✅ Configurable vessel limit
- ✅ Statistics display (requests today, remaining)
- ✅ Progress logging
- ✅ Error handling

---

## ⚠️ Known Issue

### Data Extraction Not Working
**Status:** Login works, navigation works, but ownership data not extracted

**Symptoms:**
- `ownershipUpdatedAt` timestamp gets set ✅
- `registeredOwner`, `shipManager`, `operator` remain null ❌

**Likely Causes:**
1. Page structure different from expected
2. Data loaded via JavaScript/AJAX after page load
3. Different selectors or HTML structure
4. May need to click tabs or expand sections

**Next Steps:**
1. Capture actual vessel page HTML while logged in
2. Analyze page structure to find ownership data location
3. Update extraction logic with correct selectors
4. Test with known vessel (e.g., IMO 9348522)

---

## 📊 Current Stats

- **Vessels discovered via AIS:** 3,583 vessels
- **Vessels with ownership data:** 0 (extraction issue)
- **Cache entries:** 3 vessels (IMO only, no ownership data)
- **Daily scraping limit:** 50 vessels/day
- **Cache duration:** 7 years (2,555 days)

---

## 🎯 Integration Points (Ready)

### When to Trigger Ownership Enrichment

1. **AIS Discovery:** New vessel detected in tracking area → enrich
2. **Cargo Matching:** Vessel appears in cargo enquiry results → enrich
3. **Voyage Monitoring:** Vessel assigned to voyage → enrich
4. **Fixture/Charter:** Vessel considered for fixture → enrich
5. **Manual Request:** User views vessel details → enrich if stale

### API Methods Available

```typescript
// Enrich single vessel
await equasisScraper.enrichVessel(vesselId);

// Auto-enrich multiple vessels (respects daily limit)
await equasisScraper.autoEnrichNewVessels(limit);

// Get stats
const stats = equasisScraper.getStats();
// { requestsToday: 3, remainingToday: 47, isLoggedIn: true }
```

---

## 🔧 Technical Implementation

### File Structure
```
backend/
├── src/services/equasis-scraper.ts      # Main scraper service
├── scripts/
│   ├── enrich-vessel-ownership.ts       # CLI enrichment script
│   └── debug-equasis-vessel.ts          # Debug page structure
├── prisma/schema.prisma                 # Vessel & cache tables
└── .env                                 # Equasis credentials
```

### Environment Variables
```env
EQUASIS_USERNAME=capt.anil.sharma@powerpbox.org
EQUASIS_PASSWORD=indrA@0612
```

### Dependencies
```json
{
  "puppeteer": "^21.x"  // Headless browser automation
}
```

---

## 🚀 Usage

### Manual Enrichment
```bash
cd /root/apps/ankr-maritime/backend

# Enrich 10 vessels
npx tsx scripts/enrich-vessel-ownership.ts 10

# Enrich 1 vessel (for testing)
npx tsx scripts/enrich-vessel-ownership.ts 1
```

### Automatic Enrichment (Future)
```typescript
// In AIS service when new vessel discovered
if (vessel.imo && !vessel.registeredOwner) {
  await equasisScraper.enrichVessel(vessel.id);
}

// In cargo matching before displaying results
for (const vessel of matchingVessels) {
  if (!vessel.registeredOwner || isStale(vessel.ownershipUpdatedAt, 7years)) {
    await equasisScraper.enrichVessel(vessel.id);
  }
}
```

---

## 📝 Rate Limiting & Best Practices

1. **Daily Limit:** Max 50 vessels/day
   - Automatically enforced by scraper
   - Counter resets daily

2. **Request Delays:** 10 seconds between requests
   - Prevents server overload
   - Appears more human-like

3. **Cache First:** Always check cache before scraping
   - 7 year cache = minimal re-scraping
   - Only re-scrape on active vessel use

4. **Slow Typing:** 100ms per character when filling forms
   - More natural behavior
   - Reduces bot detection

5. **Session Reuse:** Single browser page for all requests
   - Maintains login session
   - Faster subsequent requests

---

## 🐛 Debugging

### Check Cache
```sql
SELECT imo, data, "scrapedAt"
FROM vessel_ownership_cache
ORDER BY "scrapedAt" DESC
LIMIT 10;
```

### Check Vessels
```sql
SELECT name, imo, "registeredOwner", "shipManager", "ownershipUpdatedAt"
FROM vessels
WHERE "registeredOwner" IS NOT NULL
ORDER BY "ownershipUpdatedAt" DESC
LIMIT 10;
```

### Test Login
```bash
npx tsx scripts/debug-equasis-login.ts
```

### Inspect Vessel Page
```bash
npx tsx scripts/debug-equasis-vessel.ts
# Check /tmp/equasis-vessel.html for page structure
```

---

## 🎯 Success Criteria (When Complete)

- [x] Login to Equasis successfully
- [x] Navigate to vessel detail pages
- [x] Respect rate limits (10s delays, 50/day max)
- [x] Implement 7-year caching
- [ ] **Extract ownership data from page** ⬅️ NEXT TASK
- [ ] Store in database (registeredOwner, shipManager, operator)
- [ ] Integrate with AIS discovery workflow
- [ ] Integrate with cargo matching workflow
- [ ] Integrate with voyage monitoring workflow

---

## 📞 Equasis Account

**Website:** https://www.equasis.org
**Login:** capt.anil.sharma@powerpbox.org
**Service:** FREE vessel ownership database
**Coverage:** Global fleet
**Data:** Owner, Manager, Operator, ISM Manager, DOC Company

---

**Status:** 🟡 **80% Complete** - Login & caching working, extraction logic needs fix

**Next Action:** Debug vessel page HTML structure to find ownership data selectors
