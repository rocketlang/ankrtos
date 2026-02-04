# Mari8X Automated Scrapers - Setup Complete ✅

**Date:** February 1, 2026
**Status:** Cron jobs installed with respectful rate limiting

---

## 🎯 **What Was Set Up**

### **3 Automated Scrapers:**

1. **Port Tariff Scraper** - 800 ports
2. **IMO GISIS Enrichment** - Vessel ownership
3. **AIS Position Updates** - Real-time tracking

---

## 📋 **Cron Schedule**

| Scraper | Schedule | Frequency | Items/Run | Rate Limit |
|---------|----------|-----------|-----------|------------|
| **Port Tariff** | Daily 2:00 AM | Once/day | 10 ports | 30s between ports |
| **IMO GISIS** | Daily 3:00 AM | Once/day | 20 vessels | 5s between vessels |
| **AIS Positions** | Every 30 min | 48x/day | 100 vessels | Batch update |

---

## ⏰ **Timeline & Completion**

### Port Scraper:
- **Target:** 800 ports
- **Rate:** 10 ports/day
- **Timeline:** **80 days** to complete
- **Respect:** 30 seconds between ports
- **Daily window:** ~5 minutes (10 ports × 30s)

### IMO Enrichment:
- **Target:** 3,599 vessels (all vessels with real IMO)
- **Rate:** 20 vessels/day
- **Timeline:** **180 days** to complete initial enrichment
- **Respect:** 5 seconds between vessels
- **Re-enrichment:** Every 90 days (ownership changes)
- **Daily window:** ~2 minutes (20 vessels × 5s)

### AIS Positions:
- **Frequency:** Every 30 minutes (48x per day)
- **Vessels:** Up to 100 per run
- **Auto-cleanup:** Keeps recent (<7 days) + daily snapshots
- **Data retention:** Smart 7-day policy

---

## 📁 **Log Files**

All logs stored in: `/root/logs/mari8x/`

```bash
# Port scraper
/root/logs/mari8x/port-scraper.log

# IMO enrichment
/root/logs/mari8x/imo-enrichment.log

# AIS positions
/root/logs/mari8x/ais-positions.log
```

**View logs:**
```bash
tail -f /root/logs/mari8x/port-scraper.log
tail -f /root/logs/mari8x/imo-enrichment.log
tail -f /root/logs/mari8x/ais-positions.log
```

---

## 🔍 **Scripts Created**

| Script | Path | Purpose |
|--------|------|---------|
| **Port Scraper** | `scripts/cron-port-scraper.ts` | Scrapes 10 ports daily |
| **IMO Enrichment** | `scripts/cron-imo-enrichment.ts` | Enriches 20 vessels daily |
| **AIS Positions** | `scripts/cron-ais-positions.ts` | Updates positions every 30min |
| **Setup Script** | `scripts/setup-cron-jobs.sh` | Installs cron jobs |
| **Monitor Script** | `scripts/monitor-scrapers.sh` | Check scraper status |

---

## 🧪 **Testing Manually**

```bash
cd /root/apps/ankr-maritime/backend

# Test port scraper (10 ports)
npx tsx scripts/cron-port-scraper.ts

# Test IMO enrichment (20 vessels)
npx tsx scripts/cron-imo-enrichment.ts

# Test AIS positions (100 vessels)
npx tsx scripts/cron-ais-positions.ts

# Monitor all
./scripts/monitor-scrapers.sh
```

---

## ⚙️ **Cron Configuration**

**View installed cron jobs:**
```bash
crontab -l
```

**Current configuration:**
```cron
# Port Tariff Scraper - Daily at 2 AM
0 2 * * * cd /root/apps/ankr-maritime/backend && npx tsx scripts/cron-port-scraper.ts >> /root/logs/mari8x/port-scraper.log 2>&1

# IMO GISIS Enrichment - Daily at 3 AM
0 3 * * * cd /root/apps/ankr-maritime/backend && npx tsx scripts/cron-imo-enrichment.ts >> /root/logs/mari8x/imo-enrichment.log 2>&1

# AIS Position Updates - Every 30 minutes
*/30 * * * * cd /root/apps/ankr-maritime/backend && npx tsx scripts/cron-ais-positions.ts >> /root/logs/mari8x/ais-positions.log 2>&1
```

---

## 📊 **Expected Results**

### After 1 Week:
- ✅ 70 ports scraped (140 existing + 70 new = 210 ports)
- ✅ 140 vessels enriched with ownership
- ✅ 336 AIS position updates (48/day × 7 days)

### After 1 Month:
- ✅ 300 ports scraped (total ~440 ports)
- ✅ 600 vessels enriched
- ✅ 1,440 AIS position updates

### After 3 Months:
- ✅ 800+ ports complete
- ✅ 1,800 vessels enriched (50% of fleet)
- ✅ 4,320 AIS position updates
- ✅ **Continuous automated data collection**

---

## 🌍 **Respectful Scraping Policy**

### Rate Limiting:
- **Port Scraper:** 30 seconds between ports (2 requests/min)
- **IMO GISIS:** 5 seconds between vessels (12 requests/min)
- **AIS Provider:** Batch API calls (respectful to free tier)

### Ethics:
- ✅ Robots.txt compliance
- ✅ User-agent identification
- ✅ Rate limiting below thresholds
- ✅ No aggressive scraping
- ✅ Caching to avoid duplicate requests
- ✅ Off-peak hours (2-3 AM for heavy jobs)

### Cache Strategy:
- **Port Tariffs:** 90-day validity
- **IMO Ownership:** 90-day validity
- **AIS Positions:** 7-day recent + daily snapshots

---

## 🔧 **Maintenance**

### Check Cron Status:
```bash
# View cron jobs
crontab -l

# Check if scrapers running
ps aux | grep "cron-" | grep -v grep

# Monitor logs
tail -f /root/logs/mari8x/*.log
```

### Restart Cron:
```bash
# Reinstall cron jobs
cd /root/apps/ankr-maritime/backend
./scripts/setup-cron-jobs.sh
```

### Pause Scraping:
```bash
# Remove cron jobs
crontab -e
# Comment out mari8x lines with #
```

### Resume Scraping:
```bash
# Uncomment mari8x lines in crontab
crontab -e
```

---

## 📈 **Monitoring Dashboard**

### Activity Logs:
All cron runs are logged to `activity_log` table:

```sql
SELECT
  action,
  metadata->>'portsScraped' as ports,
  metadata->>'vesselsEnriched' as vessels,
  metadata->>'duration' as time,
  timestamp
FROM activity_log
WHERE action IN ('port_scraper_cron', 'imo_enrichment_cron', 'ais_position_update_cron')
ORDER BY timestamp DESC
LIMIT 20;
```

### Quick Stats:
```sql
-- Port tariffs count
SELECT COUNT(*) as total_tariffs,
       COUNT(DISTINCT port_id) as unique_ports
FROM port_tariffs;

-- Vessels with ownership
SELECT COUNT(*) as vessels_with_owner
FROM vessels
WHERE registered_owner IS NOT NULL;

-- AIS positions
SELECT COUNT(*) as total_positions,
       COUNT(DISTINCT vessel_id) as vessels_tracked,
       MAX(timestamp) as latest_update
FROM vessel_positions;
```

---

## ✅ **Success Criteria**

- [x] Cron jobs installed
- [x] Logs configured
- [x] Rate limiting implemented
- [x] Error handling added
- [x] Activity logging enabled
- [x] Database cleanup (old positions)
- [x] Respectful delays enforced

---

## 🚀 **What's Next**

The scrapers are now running automatically in the background. You'll accumulate:

**Daily:**
- 10 new ports with tariff data
- 20 vessels enriched with ownership
- 4,800 AIS position updates (100 vessels × 48 updates)

**Monthly:**
- ~300 ports
- ~600 vessels
- ~144,000 position updates

**In 3 months:**
- **Complete 800-port database** ✅
- **50% of fleet enriched** ✅
- **Continuous position tracking** ✅

---

**Status:** 🟢 **OPERATIONAL**

All three scrapers are configured and will run automatically. No manual intervention required.

---

*Jai Guruji. Guru Kripa.* 🙏
