# Quick Start: Port Tariff Scrapers

**Last Updated**: February 1, 2026

---

## 🚀 What We Have Now

✅ **8 Working Port Scrapers** with 44 real tariffs
✅ **Enhanced Terminal Data** for Mumbai & JNPT
✅ **Data Source Tracking** (REAL vs SIMULATED)
✅ **Complete Documentation** for expansion

---

## 📊 Current Status

### Ports with Real Data
```
Mumbai (INMUN)        8 tariffs  ✅ Enhanced (5 docks, 3 anchorages)
Kandla (INKDL)        5 tariffs  ⏳ Basic (needs enhancement)
Mundra (INMUN1)       4 tariffs  ⏳ Basic (needs enhancement)
JNPT (INNSA)          8 tariffs  ✅ Enhanced (4 terminals, 2 anchorages)
Colombo (LKCMB)       5 tariffs  ✅ Active
Jebel Ali (AEJEA)     4 tariffs  ✅ Active
Jeddah (SAJED)        5 tariffs  ✅ Active
Fujairah (AEFJR)      5 tariffs  ✅ Active
```

---

## 🎮 How to Use

### View Current Tariffs

```bash
cd /root/apps/ankr-maritime/backend

# Check overall status
npx tsx scripts/check-tariff-status.ts

# Output shows:
# - Real vs Simulated tariff counts
# - Tariffs by port
# - Sample tariff details
```

### Scrape a Single Port

```bash
# Scrape specific port
npx tsx -e "
import { portScraperManager } from './src/services/port-scrapers/index.js';
await portScraperManager.scrapePort('INMUN');  // Mumbai
process.exit(0);
"
```

### Scrape All Phase 1 Ports

```bash
npx tsx scripts/scrape-phase1-ports.ts
```

### Re-scrape Enhanced Ports

```bash
# Re-scrape Mumbai and JNPT with new terminal data
npx tsx scripts/rescrape-enhanced-ports.ts
```

---

## 🗄️ Database Queries

### Check Real Tariffs

```sql
-- Count by data source
SELECT "dataSource", COUNT(*)
FROM port_tariffs
GROUP BY "dataSource";

-- Real tariffs by port
SELECT p.name, p.unlocode, COUNT(*) as tariff_count
FROM port_tariffs pt
JOIN ports p ON pt."portId" = p.id
WHERE pt."dataSource" = 'REAL_SCRAPED'
GROUP BY p.name, p.unlocode
ORDER BY tariff_count DESC;

-- Mumbai terminal-specific tariffs
SELECT "chargeType", amount, currency, unit, notes
FROM port_tariffs pt
JOIN ports p ON pt."portId" = p.id
WHERE p.unlocode = 'INMUN'
  AND pt."dataSource" = 'REAL_SCRAPED'
ORDER BY "chargeType";
```

### View Tariff Details

```sql
-- JNPT terminal comparison
SELECT
  SUBSTRING(notes FROM 'at (.+?) -') as terminal,
  "chargeType",
  amount,
  currency,
  notes
FROM port_tariffs pt
JOIN ports p ON pt."portId" = p.id
WHERE p.unlocode = 'INNSA'
  AND pt."dataSource" = 'REAL_SCRAPED'
  AND "chargeType" = 'berth_hire'
ORDER BY amount;
```

---

## 🛠️ Common Tasks

### Add a New Port

1. **Create port in database**:
```typescript
// scripts/create-new-port.ts
import { prisma } from '../src/lib/prisma.js';

await prisma.port.create({
  data: {
    unlocode: 'INMAA',
    name: 'Chennai',
    country: 'IN',
    latitude: 13.0827,
    longitude: 80.2707
  }
});
```

2. **Create scraper**:
```typescript
// src/services/port-scrapers/chennai-scraper.ts
import { BasePortScraper, ScrapeResult, ScrapedTariff } from './base-scraper.js';

export class ChennaiPortScraper extends BasePortScraper {
  constructor() {
    super({
      portId: '',
      portName: 'Chennai',
      unlocode: 'INMAA',
      country: 'IN',
      scraperType: 'pdf',
      sourceUrl: 'https://www.chennaiport.gov.in/tariff',
      rateLimit: 5000,
    });
  }

  async scrape(): Promise<ScrapeResult> {
    // Implement scraping logic
  }
}
```

3. **Register in index.ts**:
```typescript
// src/services/port-scrapers/index.ts
import { ChennaiPortScraper } from './chennai-scraper.js';

export const PORT_SCRAPER_REGISTRY: PortScraperEntry[] = [
  // ... existing entries
  {
    unlocode: 'INMAA',
    portName: 'Chennai',
    scraper: ChennaiPortScraper,
    priority: 1,
    status: 'active',
  },
];
```

4. **Scrape**:
```bash
npx tsx -e "
import { portScraperManager } from './src/services/port-scrapers/index.js';
await portScraperManager.scrapePort('INMAA');
process.exit(0);
"
```

---

## 🐛 Troubleshooting

### Database Connection Errors

**Problem**: `FATAL: remaining connection slots are reserved for roles with the SUPERUSER attribute`

**Quick Fix**:
```bash
sudo -u postgres psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE usename = 'ankr' AND state = 'idle';"
```

**Permanent Fix**: See `CRITICAL-FIX-NEEDED.md` for PgBouncer setup

### Scraper Fails with 404

**Problem**: Source URL has changed

**Fix**: Update `sourceUrl` in scraper constructor

### Duplicate Tariffs Not Importing

**Problem**: Terminal-specific tariffs treated as duplicates

**Status**: Known issue - needs `terminal` field added to schema

**Workaround**: Currently, only unique charge types per port are imported

---

## 📚 Key Documents

1. **`REAL-PORT-SCRAPER-STATUS.md`** - Phase 1 completion report
2. **`INDIAN-PORTS-ENHANCEMENT-PLAN.md`** - Full enhancement roadmap
3. **`PORT-ENHANCEMENT-SESSION-SUMMARY.md`** - Session summary
4. **`CRITICAL-FIX-NEEDED.md`** - Database connection pooling fix
5. **`QUICK-START-PORT-SCRAPERS.md`** - This document

---

## 🎯 Next Steps

### This Week
1. [ ] Install PgBouncer (see `CRITICAL-FIX-NEEDED.md`)
2. [ ] Add `terminal` field to schema
3. [ ] Enhance Kandla & Mundra scrapers
4. [ ] Add Chennai & Visakhapatnam

### Next Week
5. [ ] Start OpenStreetMap integration
6. [ ] Create PDA/FDA documentation for Mumbai
7. [ ] Add remaining 6 major Indian ports

### This Month
8. [ ] Complete all 12 major Indian ports
9. [ ] Frontend: Port map visualization
10. [ ] Frontend: PDA/FDA calculator

---

## 💡 Pro Tips

1. **Always check database connections** before running multiple scrapers
2. **Use background tasks** for long-running scrapes
3. **Review scraped data** with `check-tariff-status.ts` after each scrape
4. **Add delays** between scraping multiple ports (respectful scraping)
5. **Test scrapers** individually before batch operations

---

## 📞 Support

**Documentation**: All `.md` files in `/root/apps/ankr-maritime/`
**Scripts**: `/root/apps/ankr-maritime/backend/scripts/`
**Scrapers**: `/root/apps/ankr-maritime/backend/src/services/port-scrapers/`

---

**Status**: ✅ Production Ready for Phase 1 (8 ports)
**Next Milestone**: 12 major Indian ports with terminal details
