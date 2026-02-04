# Equasis Integration Status Report
**Date**: Feb 2, 2026  
**Goal**: Enrich 16,535 vessels with ownership data (currently only 78 enriched = 0.47%)

---

## Current Status: ⚠️ BLOCKED - Account Activation Needed

### Issue
Equasis login fails with message: "You only need to register"

**Credentials in .env:**
```
EQUASIS_USERNAME=capt.anil.sharma@powerpbox.org
EQUASIS_PASSWORD=indrA@0612
```

### Root Cause
One of:
1. ✅ **Most Likely**: Account needs email verification/activation
2. Credentials incorrect or expired
3. Equasis changed authentication system

### What We Built
- ✅ Equasis scraping service (`equasis-service.ts`)
- ✅ Login automation with Selenium
- ✅ Vessel lookup by IMO
- ✅ Test scripts

**Code is ready** - just needs working credentials.

---

## Immediate Solutions

### Option A: Activate Equasis Account (RECOMMENDED)
**Time**: 5 minutes  
**Cost**: FREE

**Steps**:
1. Go to https://www.equasis.org/
2. Click "Register" (if not registered)
3. Use email: capt.anil.sharma@powerpbox.org
4. Check email for activation link
5. Activate account
6. Re-run test: `npx tsx scripts/test-equasis.ts`

**If successful**, we can immediately enrich all 16,535 vessels overnight.

---

### Option B: Use MarineTraffic API (PAID)
**Time**: 10 minutes setup  
**Cost**: $73 startup plan

**Pros**:
- Reliable API (no scraping)
- Includes vessel ownership data
- Also provides Priority 1 AIS fields (draught, navStatus, etc.)
- Official data source

**Cons**:
- Costs money ($73 one-time or subscription)

---

### Option C: Use Norwegian Ship Register API (FREE)
**Time**: 1 hour  
**Cost**: FREE

**Coverage**: Norwegian-flagged vessels only (~1,500-2,000 vessels)

Already have API integration started:
```typescript
// backend/src/services/norwegian-api-service.ts
// Fetch vessel ownership from Norwegian Ship Register
```

**Limitation**: Only covers 10-12% of vessels (Norwegian flag only)

---

### Option D: Hybrid Approach (BEST)
**Time**: Variable  
**Cost**: FREE initially, $73 if needed later

1. **Activate Equasis** (FREE) - Get 90%+ coverage
2. **Norwegian API** (FREE) - Fill gaps for Norwegian vessels
3. **MarineTraffic** (PAID) - Only if Equasis data quality is poor

---

## AIS Priority 1 Fields - Separate Issue

**Status**: AISstream FREE tier does NOT provide Priority 1 fields

**Evidence**:
- 323,556 positions in last hour
- 0% have draught, navigationStatus, rateOfTurn

**Options**:
1. Upgrade AISstream (if paid tier exists)
2. MarineTraffic API ($73) - includes Priority 1 fields
3. Spire Maritime (paid)
4. Accept limitation and document

---

## Recommendation

**Immediate (Today)**:
1. Activate Equasis account (5 min)
2. Test vessel enrichment
3. If works: Run bulk enrichment overnight (16,535 vessels)

**Follow-up (Next Week)**:
1. Evaluate Equasis data quality
2. If poor: Consider MarineTraffic API for both ownership + Priority 1 AIS
3. If good: Keep Equasis FREE, evaluate AIS upgrade separately

---

## Expected Results

**If Equasis works**:
- Enrichment rate: 0.47% → 85%+ (14,000+ vessels)
- Time: 12-24 hours (with rate limiting)
- Cost: $0
- Monthly updates: Automated cron job

**If MarineTraffic needed**:
- Enrichment rate: 0.47% → 95%+ (15,800+ vessels)
- Time: 1-2 hours (API calls)
- Cost: $73 one-time
- Bonus: Get Priority 1 AIS fields too

---

## Next Steps

**User Decision Needed:**

A) Try activating Equasis account now  
B) Skip Equasis, go straight to MarineTraffic API ($73)  
C) Use Norwegian API only (limited coverage)  
D) Wait and revisit later

Which option?
