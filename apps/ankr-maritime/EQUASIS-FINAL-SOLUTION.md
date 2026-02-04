# Equasis Final Solution - Use Advanced Search

## Problem Root Cause IDENTIFIED

The main search box at `/restricted/Search?fs=ShipSubcription` has **NO NAME ATTRIBUTE**:
```html
<input type="text" placeholder="IMO, Name, Company" name="">
```

When submitted, the IMO value isn't sent to the server → Results in error page.

## Solution: Use Advanced Ship Search

Equasis has an "Advanced Ship Search" page with a proper form that has named inputs.

### Implementation

**File**: `backend/src/services/equasis-scraper.ts`
**Method**: `scrapeVessel()`

**Replace lines 167-221 with**:

```typescript
// Use Advanced Ship Search (has proper form with named inputs)
await this.page.goto('https://www.equasis.org/EquasisWeb/restricted/ShipAdvanced?fs=HomePage', {
  waitUntil: 'networkidle2',
  timeout: 30000,
});

await this.delay(1000);

// Fill IMO field in advanced search form
await this.page.evaluate((searchIMO: string) => {
  // Advanced search has proper named inputs
  const imoInput = document.querySelector('input[name="P_IMO"]') as HTMLInputElement;
  if (imoInput) {
    imoInput.value = searchIMO;
  }
}, imo);

await this.delay(500);

// Submit the advanced search form
await this.page.evaluate(() => {
  const submitBtn = document.querySelector('input[type="submit"][value*="Search"]') as HTMLElement ||
                   document.querySelector('button[type="submit"]') as HTMLElement;
  if (submitBtn) submitBtn.click();
});

// Wait for results
await this.delay(3000);

// Check if we got results or went to ship details
const pageState = await this.page.evaluate(() => {
  const bodyText = document.body.textContent || '';
  return {
    hasResults: bodyText.includes('Results list') || bodyText.includes('result'),
    hasShipDetails: bodyText.includes('Registered owner'),
    pageTitle: document.title,
  };
});

console.log(`  📄 Page: ${pageState.pageTitle}`);

// If results page, click first result
if (pageState.hasResults && !pageState.hasShipDetails) {
  await this.page.evaluate(() => {
    const firstLink = document.querySelector('a[href*="ShipInfo"]') as HTMLElement;
    if (firstLink) firstLink.click();
  });

  await this.delay(2000);
}
```

### Alternative: Use Direct API Call

If Advanced Search also has issues, we can use Equasis' internal API directly:

```typescript
// Make POST request to search API
const searchResponse = await this.page.evaluate(async (imo: string) => {
  const formData = new FormData();
  formData.append('P_IMO', imo);
  formData.append('fs', 'HomePage');

  const response = await fetch('/EquasisWeb/restricted/ShipSearch', {
    method: 'POST',
    body: formData,
  });

  return response.text();
}, imo);
```

### Test After Implementation

```bash
npx tsx scripts/test-equasis-fresh.ts
```

Expected: Owner data extracted successfully.

## Status

**Current approach**: Using basic search (FAILING - no name attribute)
**Recommended**: Switch to Advanced Ship Search
**Timeline**: 10 minutes to implement and test

