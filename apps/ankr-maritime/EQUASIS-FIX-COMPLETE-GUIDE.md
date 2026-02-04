# Equasis Owner Extraction - Complete Fix Guide

## Problem Identified

The Equasis scraper has been **completely broken** - all vessels in cache have no owner data:

```
IMO 9348522: Only has { imo, scrapedAt } - NO OWNER DATA
IMO 9869667: Only has { imo, scrapedAt } - NO OWNER DATA
IMO 9696565: Only has { imo, scrapedAt } - NO OWNER DATA
```

## Root Cause

**WRONG NAVIGATION METHOD**: The scraper tries to navigate directly to ship info pages:
```typescript
// CURRENT (BROKEN):
await page.goto(`https://www.equasis.org/EquasisWeb/restricted/ShipInfo?fs=HomePage&P_IMO=${imo}`);
// Result: Redirects to homepage, no ship data loads
```

**CORRECT METHOD**: Must use the search form:
1. Navigate to search page
2. Fill search form
3. Submit search
4. Extract data from results

## Account Status

✅ **CONFIRMED WORKING**: Account `capt.anil.sharma@powerpbox.org` CAN access ship data
- User manually searched IMO 9348522 successfully
- Found: GOLDEN CURL, Chemical Tanker, 11254 GT, 2007, Singapore

## Complete Fix

### Step 1: Update equasis-scraper.ts scrapeVessel() method

**File**: `backend/src/services/equasis-scraper.ts`
**Lines to replace**: 167-177

**Old code** (lines 167-177):
```typescript
// Navigate to search page (reuse existing page with session)
const searchUrl = `https://www.equasis.org/EquasisWeb/restricted/ShipInfo?fs=HomePage&P_IMO=${imo}`;

await this.page.goto(searchUrl, {
  waitUntil: 'networkidle2',
  timeout: 30000,
});

// Wait a bit to appear human-like
await this.delay(2000);
```

**New code**:
```typescript
// Navigate to search page
await this.page.goto('https://www.equasis.org/EquasisWeb/restricted/Search?fs=ShipSubcription', {
  waitUntil: 'networkidle2',
  timeout: 30000,
});

await this.delay(1000);

// Fill IMO in search form
await this.page.evaluate((searchIMO: string) => {
  // Find IMO input (the main search box)
  const searchInput = document.querySelector('input[name="P_IMO"]') as HTMLInputElement ||
                     document.querySelector('input[placeholder*="IMO"]') as HTMLInputElement ||
                     Array.from(document.querySelectorAll('input[type="text"]'))
                       .find(inp => inp.placeholder?.includes('IMO')) as HTMLInputElement;

  if (searchInput) {
    searchInput.value = searchIMO;
    searchInput.focus();
  }

  // Ensure "Ship" checkbox is checked
  const shipCheckbox = document.querySelector('input[id*="ship"]') as HTMLInputElement ||
                      document.querySelector('input[value="Ship"]') as HTMLInputElement;
  if (shipCheckbox && !shipCheckbox.checked) {
    shipCheckbox.checked = true;
  }
}, imo);

await this.delay(500);

// Submit search (press Enter in search box)
await this.page.keyboard.press('Enter');

// Wait for results to load
await this.delay(3000);

// Check if we got results page or ship details page
const pageType = await this.page.evaluate(() => {
  const bodyText = document.body.textContent || '';
  const hasResultsList = bodyText.includes('Results list');
  const hasShipDetails = bodyText.includes('Registered owner') || bodyText.includes('Ship manager');

  return { hasResultsList, hasShipDetails };
});

// If results list, click the first result
if (pageType.hasResultsList && !pageType.hasShipDetails) {
  await this.page.evaluate(() => {
    // Click first ship result link
    const firstLink = document.querySelector('a[href*="ShipInfo"]') as HTMLElement;
    if (firstLink) firstLink.click();
  });

  await this.delay(2000);
}
```

### Step 2: Update Selectors for Data Extraction

The current selectors (lines 186-237) look for table rows with text content. This SHOULD still work once we're on the correct ship details page. But we may need to update them.

**Test after Step 1** to see if the selectors work. If not, update based on the actual page structure.

### Step 3: Clear Cache and Test

```bash
cd /root/apps/ankr-maritime/backend

# Clear existing broken cache
npx tsx -e "
import { prisma } from './src/lib/prisma.js';
await prisma.vesselOwnershipCache.deleteMany({});
console.log('Cache cleared');
await prisma.\$disconnect();
"

# Test with known good IMO
npx tsx scripts/test-equasis-fresh.ts
```

Expected result:
```json
{
  "imo": "9348522",
  "registeredOwner": "...",  // Should have data!
  "shipManager": "...",
  "operator": "...",
  "flag": "Singapore",
  "scrapedAt": "2026-02-01T..."
}
```

## Alternative Solution: Use Search Results Directly

If the ship details page still doesn't load properly, we can extract basic info from the search results page itself:

The search results show:
- IMO number
- Name of ship
- Gross tonnage
- Type of ship
- Year of build
- Flag

This is available WITHOUT clicking into ship details. We can extract this as a fallback.

## Implementation Priority

1. **High Priority**: Fix navigation to use search form (Step 1)
2. **Medium Priority**: Test and adjust selectors (Step 2)
3. **Low Priority**: Add search results fallback extraction

## Success Criteria

After fix:
- ✅ IMO 9348522 returns: registered owner, ship manager, flag
- ✅ Cache entries have complete data, not just {imo, scrapedAt}
- ✅ All 3,599 vessels can be enriched with owner data via AIS workflow

## Timeline

- **Fix implementation**: 15 minutes
- **Testing**: 10 minutes
- **Cache rebuild** (50 vessels): ~10 minutes
- **Total**: ~35 minutes

---

**Status**: Ready to implement
**Blocker**: None
**Dependencies**: None (account confirmed working)

