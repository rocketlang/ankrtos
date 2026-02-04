# Port Scraping Guidelines: REAL DATA ONLY

**Date**: February 1, 2026
**Policy**: Zero Tolerance for Simulated/Fake Data in Port Scrapers

---

## 🎯 Core Principle

**ONLY REAL, VERIFIED TARIFF DATA WILL BE SCRAPED AND STORED AS REAL**

- ✅ Real tariffs from port authority websites → `dataSource: 'REAL_SCRAPED'`
- ✅ Real tariffs from official PDFs → `dataSource: 'REAL_SCRAPED'`
- ✅ Real tariffs from port APIs → `dataSource: 'REAL_SCRAPED'`
- ❌ NO estimated tariffs → Don't mark as REAL
- ❌ NO typical tariffs → Don't mark as REAL
- ❌ NO assumed tariffs → Don't mark as REAL

---

## 📋 Data Source Hierarchy

### Tier 1: REAL_SCRAPED (Highest Quality)

**Source**: Official port authority website, tariff book PDF, published rate card

**Requirements**:
1. Source URL must be documented
2. Scraping timestamp must be recorded
3. Data must be currently published by port authority
4. Tariff must have effective date

**Examples**:
```typescript
{
  chargeType: 'port_dues',
  amount: 2.60,
  currency: 'INR',
  unit: 'per_grt',
  notes: 'Port Dues - Container vessels (from JNPT Tariff Book 2024)',
  dataSource: 'REAL_SCRAPED',  // ✅ CORRECT
  sourceUrl: 'https://www.jnport.gov.in/tariff-book-2024.pdf',
  scrapedAt: new Date('2026-02-01'),
  effectiveFrom: new Date('2024-04-01')
}
```

### Tier 2: API (Third-party verified)

**Source**: Official port API, verified third-party data provider

**Requirements**:
1. API endpoint documented
2. API provider credibility verified
3. Data freshness < 30 days

**Examples**:
```typescript
{
  chargeType: 'pilotage',
  amount: 25000,
  currency: 'INR',
  unit: 'lumpsum',
  dataSource: 'API',  // Not REAL_SCRAPED, but acceptable
  sourceUrl: 'https://api.portauthority.in/tariffs',
  scrapedAt: new Date()
}
```

### Tier 3: MANUAL (Human verified)

**Source**: Manual entry by port operations team, verified invoice

**Requirements**:
1. Must be from actual invoice/SOF
2. Must have verification date
3. Should have approver name

**Examples**:
```typescript
{
  chargeType: 'berth_hire',
  amount: 3.80,
  currency: 'INR',
  unit: 'per_grt',
  dataSource: 'MANUAL',
  notes: 'Verified from actual SOF dated 2026-01-15',
  verifiedBy: 'Operations Team',
  verifiedAt: new Date('2026-01-15')
}
```

### Tier 4: SIMULATED (Lowest Quality)

**Source**: Estimated, typical, assumed

**Requirements**:
1. MUST be clearly marked as SIMULATED
2. Should have disclaimer
3. Should not be used for actual PDA/FDA

**Usage**: ONLY for ports where NO real data exists yet

```typescript
{
  chargeType: 'port_dues',
  amount: 2.00,  // Estimated
  currency: 'INR',
  unit: 'per_grt',
  dataSource: 'SIMULATED',  // ⚠️ MUST be marked
  notes: 'ESTIMATED - No official tariff available. Do not use for billing.',
  createdAt: new Date()
}
```

---

## 🚫 What NOT to Do

### ❌ DON'T: Create "Typical" Tariffs

```typescript
// ❌ WRONG - This is NOT real data
const tariffs = [
  {
    chargeType: 'port_dues',
    amount: 2.50,  // "Typical" amount - NO!
    currency: 'INR',
    unit: 'per_grt',
    notes: 'Typical port dues for Indian ports',  // ❌ RED FLAG
    dataSource: 'REAL_SCRAPED',  // ❌ LIE!
  }
];
```

**Problem**: This is made-up data marked as real. Completely unacceptable.

### ❌ DON'T: Estimate Based on Other Ports

```typescript
// ❌ WRONG - Copying from another port
const chennaitat Tariffs = mumbaiTariffs.map(t => ({
  ...t,
  amount: t.amount * 0.95,  // ❌ 5% less than Mumbai? NO!
  notes: 'Based on Mumbai tariffs',  // ❌ This is estimation!
  dataSource: 'REAL_SCRAPED'  // ❌ FALSE!
}));
```

**Problem**: Every port has different tariffs. Don't assume or estimate.

### ❌ DON'T: Use Old/Expired Tariffs as Current

```typescript
// ❌ WRONG - Using 2020 tariff as current
{
  chargeType: 'pilotage',
  amount: 15000,  // From 2020 tariff book
  dataSource: 'REAL_SCRAPED',  // Technically scraped, but...
  effectiveFrom: new Date('2020-01-01'),  // ❌ Expired!
  effectiveTo: new Date('2021-12-31'),  // Clearly expired
  notes: 'Using old tariff as no current one available'  // ❌ DON'T DO THIS
}
```

**Problem**: Tariffs change. Old tariffs are historical data, not current.

---

## ✅ What TO Do

### ✅ DO: Only Scrape What You Can Verify

```typescript
// ✅ CORRECT - Real data from official source
export class ChennaiPortScraper extends BasePortScraper {
  constructor() {
    super({
      portName: 'Chennai',
      unlocode: 'INMAA',
      sourceUrl: 'https://www.chennaiport.gov.in/tariff-book-2024.pdf',
      scraperType: 'pdf',
    });
  }

  async scrape(): Promise<ScrapeResult> {
    // If PDF is not accessible:
    if (!this.canAccessSource()) {
      return {
        success: false,
        error: 'Cannot access tariff source. Will not create fake data.',
        tariffs: []  // ✅ Empty array is better than fake data
      };
    }

    // Only return data you actually scraped
    const tariffs = await this.parsePDF();

    return {
      success: true,
      tariffs: tariffs,  // Real data only
      sourceUrl: this.config.sourceUrl,
      scrapedAt: new Date()
    };
  }
}
```

### ✅ DO: Document Data Source

Every scraped tariff must have:

1. **sourceUrl**: Exact URL where data was found
2. **scrapedAt**: When it was scraped
3. **effectiveFrom**: When tariff became valid
4. **notes**: Include source document name, page number if possible

```typescript
{
  chargeType: 'port_dues',
  amount: 2.65,
  currency: 'INR',
  unit: 'per_grt',
  vesselType: 'container',

  // ✅ Perfect documentation
  dataSource: 'REAL_SCRAPED',
  sourceUrl: 'https://www.chennaiport.gov.in/upload/tariff-book-2024.pdf',
  scrapedAt: new Date('2026-02-01T10:30:00Z'),
  effectiveFrom: new Date('2024-01-01'),
  notes: 'Chennai Port Trust Tariff Book 2024, Page 15, Item 3.1 - Container Vessels Port Dues'
}
```

### ✅ DO: Handle Missing Data Gracefully

If a port has no published tariffs:

```typescript
async scrape(): Promise<ScrapeResult> {
  try {
    const response = await fetch(this.config.sourceUrl);

    if (response.status === 404) {
      return {
        success: false,
        error: 'Port does not publish tariffs online. Manual data entry required.',
        tariffs: [],  // ✅ Don't make up data
        sourceUrl: this.config.sourceUrl,
        scrapedAt: new Date()
      };
    }

    // ... continue if successful
  } catch (error) {
    return {
      success: false,
      error: `Scraping failed: ${error.message}. No data imported.`,
      tariffs: []  // ✅ No fake data
    };
  }
}
```

### ✅ DO: Mark Uncertainty

If data quality is uncertain:

```typescript
{
  chargeType: 'towage',
  amount: 12000,
  currency: 'INR',
  unit: 'lumpsum',
  dataSource: 'REAL_SCRAPED',
  sourceUrl: 'https://port.example.com/rates',
  scrapedAt: new Date(),

  // ✅ Honest about uncertainty
  notes: 'WARNING: Scraped from general rate card. May vary by tugboat type/size. Verify with port agent before use.',
  dataQuality: 0.7  // 70% confidence
}
```

---

## 📊 Data Quality Checklist

Before marking tariff as `REAL_SCRAPED`, verify:

- [ ] Data scraped from official port authority source
- [ ] Source URL is accessible and valid
- [ ] Tariff has effective date
- [ ] Amount is reasonable (not zero, not absurdly high)
- [ ] Currency is correct for the port's country
- [ ] Unit is standard (per_grt, lumpsum, per_teu, etc.)
- [ ] Notes include source document reference
- [ ] Scraped timestamp is recorded

If ANY of the above fail → DO NOT mark as `REAL_SCRAPED`

---

## 🔍 Verification Process

### Automated Checks

```typescript
function validateRealScrapedTariff(tariff: ScrapedTariff): boolean {
  const checks = {
    hasSourceUrl: !!tariff.sourceUrl,
    hasScrapedAt: !!tariff.scrapedAt,
    hasEffectiveDate: !!tariff.effectiveFrom,
    reasonableAmount: tariff.amount > 0 && tariff.amount < 1000000,
    validCurrency: ['INR', 'USD', 'AED', 'SAR', 'LKR', 'SGD'].includes(tariff.currency),
    validUnit: ['per_grt', 'lumpsum', 'per_teu', 'per_ton'].includes(tariff.unit),
    hasNotes: !!tariff.notes && tariff.notes.length > 10,
  };

  const failedChecks = Object.entries(checks)
    .filter(([key, passed]) => !passed)
    .map(([key]) => key);

  if (failedChecks.length > 0) {
    console.error(`⚠️  Tariff failed validation:`, failedChecks);
    console.error(`   This should NOT be marked as REAL_SCRAPED`);
    return false;
  }

  return true;
}
```

### Manual Spot Checks

- **Monthly**: Random sample of 10% of REAL_SCRAPED tariffs
- **Verify**: Visit source URL, check if tariff still valid
- **Update**: Remove expired tariffs, update changed tariffs

---

## 📝 Scraper Templates

### Template 1: PDF Scraper (Most Common)

```typescript
import { BasePortScraper, ScrapeResult, ScrapedTariff } from './base-scraper.js';
import pdfParse from 'pdf-parse';
import axios from 'axios';

export class PortXScraper extends BasePortScraper {
  constructor() {
    super({
      portName: 'Port X',
      unlocode: 'INXXX',
      country: 'IN',
      scraperType: 'pdf',
      sourceUrl: 'https://portx.gov.in/tariff-2024.pdf',
      rateLimit: 5000,
    });
  }

  async scrape(): Promise<ScrapeResult> {
    const result: ScrapeResult = {
      success: false,
      port: this.config.portName,
      unlocode: this.config.unlocode,
      tariffs: [],
      sourceUrl: this.config.sourceUrl,
      scrapedAt: new Date(),
    };

    try {
      // Download PDF
      const response = await axios.get(this.config.sourceUrl, {
        responseType: 'arraybuffer'
      });

      // Parse PDF
      const pdf = await pdfParse(response.data);
      const text = pdf.text;

      // Extract tariffs (THIS IS WHERE REAL WORK HAPPENS)
      // You must actually parse the PDF content
      const tariffs = this.extractTariffsFromText(text);

      // Validate each tariff
      const validTariffs = tariffs.filter(t => this.validateTariff(t));

      result.success = true;
      result.tariffs = validTariffs;

      console.log(`✅ ${this.config.portName}: Scraped ${validTariffs.length} REAL tariffs`);

    } catch (error) {
      result.success = false;
      result.error = error.message;
      console.error(`❌ ${this.config.portName}: Failed to scrape`, error);
    }

    return result;
  }

  private extractTariffsFromText(text: string): ScrapedTariff[] {
    const tariffs: ScrapedTariff[] = [];

    // IMPORTANT: This is where you do REAL scraping
    // Parse the PDF text to extract actual tariff data
    // Don't just return hardcoded values!

    // Example: Look for patterns like "Port Dues: Rs. 2.50 per GRT"
    const portDuesMatch = text.match(/Port Dues:\s*Rs\.\s*([\d.]+)\s*per\s*GRT/i);
    if (portDuesMatch) {
      tariffs.push({
        chargeType: 'port_dues',
        amount: parseFloat(portDuesMatch[1]),
        currency: 'INR',
        unit: 'per_grt',
        notes: `Extracted from PDF page content`,
        effectiveFrom: new Date('2024-01-01'),  // Extract from PDF if possible
      });
    }

    // ... continue parsing for other charge types

    return tariffs;
  }
}
```

### Template 2: HTML Scraper

```typescript
import { BasePortScraper, ScrapeResult, ScrapedTariff } from './base-scraper.js';
import axios from 'axios';
import * as cheerio from 'cheerio';

export class PortYScraper extends BasePortScraper {
  constructor() {
    super({
      portName: 'Port Y',
      unlocode: 'INYYY',
      country: 'IN',
      scraperType: 'html',
      sourceUrl: 'https://porty.gov.in/tariffs',
      rateLimit: 5000,
    });
  }

  async scrape(): Promise<ScrapeResult> {
    // ... result setup ...

    try {
      const response = await axios.get(this.config.sourceUrl);
      const $ = cheerio.load(response.data);

      // Extract from HTML tables
      $('table.tariff-table tr').each((i, row) => {
        const cells = $(row).find('td');

        if (cells.length >= 3) {
          const chargeType = $(cells[0]).text().trim();
          const amount = parseFloat($(cells[1]).text().replace(/[^\d.]/g, ''));
          const unit = $(cells[2]).text().trim();

          if (chargeType && !isNaN(amount)) {
            tariffs.push({
              chargeType: this.normalizeChargeType(chargeType),
              amount: amount,
              currency: 'INR',
              unit: this.normalizeUnit(unit),
              notes: `Scraped from ${this.config.sourceUrl} on ${new Date().toISOString()}`,
              effectiveFrom: new Date('2024-01-01'),  // Try to extract from page
            });
          }
        }
      });

      // ... return ...
    } catch (error) {
      // ...
    }
  }
}
```

---

## 🎯 Success Criteria

A scraper is successful when:

1. **Zero fake data**: All tariffs are from real sources
2. **High coverage**: Captures 80%+ of published tariffs
3. **Accurate parsing**: <5% error rate in amounts/units
4. **Up-to-date**: Data is current (effective date recent)
5. **Well-documented**: Every tariff has source URL and notes

---

## 📊 Monitoring & Auditing

### Daily Checks

```sql
-- Verify all REAL_SCRAPED tariffs have source URLs
SELECT COUNT(*)
FROM port_tariffs
WHERE "dataSource" = 'REAL_SCRAPED'
  AND "sourceUrl" IS NULL;
-- Should be 0

-- Check for suspicious amounts (too low or too high)
SELECT id, "portId", "chargeType", amount, currency
FROM port_tariffs
WHERE "dataSource" = 'REAL_SCRAPED'
  AND (amount < 0.01 OR amount > 100000);
-- Investigate any results
```

### Weekly Audit

- Review 10 random REAL_SCRAPED tariffs
- Visit source URL, verify data still matches
- Check for expired tariffs (effectiveTo < NOW())

---

## 🚨 Red Flags

If you see these, data is likely FAKE:

- ❌ No source URL
- ❌ Notes like "typical" or "estimated"
- ❌ Round numbers everywhere (2.00, 5.00, 10.00)
- ❌ All tariffs have same effective date
- ❌ Scraped date is missing
- ❌ Suspiciously similar to another port

---

## ✅ Conclusion

**Remember**: It's better to have NO data than WRONG data.

- Empty tariff list → User knows to call port agent
- Fake tariff list → User makes wrong cost estimate → Lost money/credibility

**When in doubt, leave it out.**

---

**Policy Effective**: February 1, 2026
**Applies To**: All port scrapers, all developers
**Violations**: Subject to code review rejection
