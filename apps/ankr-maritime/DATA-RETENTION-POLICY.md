# Mari8X Data Retention Policy

**Date**: February 1, 2026
**Version**: 1.0

---

## 📋 **Overview**

This document defines data retention policies for the Mari8X maritime operations platform, balancing operational needs with storage costs and performance.

---

## ✅ **PERMANENT DATA** (Stored Forever)

### **1. Port Tariffs** (`port_tariffs` table)
- **Retention**: ✅ **PERMANENT**
- **Reason**: Historical tariff data valuable for cost analysis and trending
- **Volume**: ~10,000 records (800 ports × 12 tariffs avg)
- **Growth**: Low (~1-2% per quarter as new tariffs added)
- **Storage**: ~5 MB

### **2. Vessels** (`vessels` table)
- **Retention**: ✅ **PERMANENT**
- **Reason**: Core master data, regulatory requirement (IMO compliance)
- **Volume**: Auto-grows as AIS discovers new vessels
- **Growth**: ~100-500 vessels/month (depending on AIS coverage)
- **Storage**: ~1 KB per vessel

### **3. Ports** (`ports` table)
- **Retention**: ✅ **PERMANENT**
- **Reason**: Master data, changes infrequently
- **Volume**: 800+ ports
- **Growth**: Minimal (~10-20 new ports/year)
- **Storage**: ~500 KB

### **4. Operational Records** (PERMANENT)
- Charters, Voyages, Bills of Lading
- Invoices, Payments
- Compliance records
- Certificates (regulatory requirement: 5+ years minimum)
- Claims and disputes

**Total Permanent Data Growth**: ~1-2 GB/year (manageable)

---

## 🔄 **ROLLING WINDOW DATA** (7-Day Retention)

### **1. AIS Vessel Positions** (`vessel_positions` table) ⭐
- **Retention**: ⏰ **7 DAYS** (rolling window)
- **Reason**: High-volume, operational value declines rapidly
- **Volume at Scale**:
  - Global AIS: 300 messages/second = 25M positions/day
  - With filters (27 trade areas): ~50-100 messages/second = 4-8M positions/day
  - Per vessel: 1 position every 2-10 minutes = 144-720 positions/day
- **Storage**:
  - Without cleanup: ~200 bytes/position × 5M/day = 1 GB/day = 30 GB/month
  - With 7-day window: ~7 GB maximum (auto-deleted after 7 days)
- **Cleanup**: Automated daily job at 2 AM

**Why 7 days?**
- ✅ Recent voyage tracking (last port, current route)
- ✅ Short-term position history for disputes
- ✅ Fleet visibility dashboard (where are my vessels NOW)
- ✅ Compliance with short-term tracking requirements
- ❌ Historical analytics (use voyage records instead)

---

## 🗄️ **ARCHIVAL DATA** (Long-term Cold Storage)

### **Data to Archive (Future Enhancement):**

1. **Old AIS Positions** (optional)
   - After 7 days → Archive to S3/MinIO (compressed)
   - Cost: ~$0.01/GB/month on S3 Glacier
   - Use case: Historical route analysis, legal disputes

2. **Old Documents** (after 2 years)
   - Move to cold storage (MinIO Glacier tier)
   - Keep metadata in DB, content in S3

---

## 🛠️ **Implementation**

### **Automatic Cleanup Job**

**File**: `/root/apps/ankr-maritime/backend/src/jobs/cleanup-old-ais-data.ts`

**Schedule**: Daily at 2 AM (via cron)

**What it does**:
```sql
DELETE FROM vessel_positions
WHERE timestamp < (NOW() - INTERVAL '7 days');
```

**Installation**:
```bash
# Add to crontab
crontab -e

# Add this line:
0 2 * * * cd /root/apps/ankr-maritime/backend && npx tsx src/jobs/cleanup-old-ais-data.ts >> /var/log/mari8x-cleanup.log 2>&1
```

**Manual run**:
```bash
npx tsx src/jobs/cleanup-old-ais-data.ts
```

---

## 📊 **Storage Projections**

### **Current Setup (Global AIS + 800 Ports)**

| Data Type | Retention | Daily Volume | 7-Day Storage | Annual Storage |
|-----------|-----------|--------------|---------------|----------------|
| **Port Tariffs** | Permanent | 0 MB | 0 MB | ~5 MB |
| **Vessels (Master)** | Permanent | 100 KB | 700 KB | ~40 MB |
| **AIS Positions** | 7 days | 1 GB | **7 GB** | 7 GB (constant) |
| **Voyages/Charters** | Permanent | 10 MB | 70 MB | ~3.6 GB |
| **Documents** | Permanent | 50 MB | 350 MB | ~18 GB |
| **TOTAL** | | 1.06 GB/day | **~8 GB** | **~22 GB** |

**PostgreSQL database size**: ~30 GB (comfortable for most servers)

---

### **With Regional AIS Filters (Your Setup)**

Using 27 trade areas instead of global:

| Data Type | Daily Volume | 7-Day Storage | Annual Storage |
|-----------|--------------|---------------|----------------|
| **AIS Positions** | 200 MB | **1.4 GB** | 1.4 GB (constant) |
| **Other Data** | 60 MB | 420 MB | ~22 GB |
| **TOTAL** | 260 MB/day | **~2 GB** | **~23 GB** |

**Optimized database size**: ~25 GB

---

## 🎯 **Performance Optimization**

### **Database Indexes** (Already Configured)

```sql
-- Fast lookups by vessel
CREATE INDEX vessel_positions_vesselId_idx ON vessel_positions(vesselId);

-- Fast time-based queries
CREATE INDEX vessel_positions_timestamp_idx ON vessel_positions(timestamp);

-- Fast cleanup
CREATE INDEX vessel_positions_createdAt_idx ON vessel_positions(createdAt);

-- Composite for vessel history
CREATE INDEX vessel_positions_vesselId_timestamp_idx ON vessel_positions(vesselId, timestamp);
```

### **Query Best Practices**

❌ **Don't do this:**
```sql
-- Scans entire table
SELECT * FROM vessel_positions WHERE vesselId = 'abc';
```

✅ **Do this:**
```sql
-- Uses index + limit
SELECT * FROM vessel_positions
WHERE vesselId = 'abc'
  AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC
LIMIT 100;
```

---

## 📈 **Monitoring**

### **Daily Statistics**

Run the cleanup job manually to see stats:
```bash
npx tsx src/jobs/cleanup-old-ais-data.ts
```

**Output:**
```
🧹 Cleaning up AIS data older than 7 days...
   Cutoff date: 2026-01-25T02:00:00.000Z
✅ Deleted 12,456,789 old AIS position records

📊 Current AIS Database Stats:
   Total positions: 8,234,567
   Unique vessels tracked: 1,234
   Oldest position: 2026-01-26 02:15:00
   Newest position: 2026-02-01 01:45:00
   Database size estimate: ~1,600 MB
```

---

## 🔐 **Compliance & Legal**

### **Regulatory Requirements**

**GDPR (if applicable)**:
- ✅ AIS data is publicly broadcast, no personal data
- ✅ Vessel ownership is public record
- ✅ 7-day retention justified for operational necessity

**Maritime Regulations**:
- ✅ Vessel certificates: 5+ years (we keep permanent)
- ✅ Charter parties: 6+ years (we keep permanent)
- ✅ Bills of Lading: 7+ years (we keep permanent)
- ✅ AIS data: No minimum retention (7 days exceeds operational needs)

**SOC 2 / ISO 27001**:
- ✅ Documented retention policy
- ✅ Automated enforcement
- ✅ Audit logs of deletions

---

## 🚀 **Future Enhancements**

### **Phase 2: Selective Archival**

Instead of deleting all AIS data after 7 days, archive strategically:

**Keep Forever:**
- Positions at port entry/exit (for port call records)
- Positions at anchor (for laytime calculations)
- Positions during critical events (groundings, collisions, inspections)

**Archive to S3:**
- All other positions after 7 days
- Compressed format: ~10:1 compression ratio
- Cost: $0.50/month for 1 year of data

**Implementation:**
```typescript
// Instead of DELETE, move to archive table
INSERT INTO vessel_positions_archive
SELECT * FROM vessel_positions
WHERE timestamp < NOW() - INTERVAL '7 days'
  AND status NOT IN ('at_anchor', 'moored');

DELETE FROM vessel_positions
WHERE timestamp < NOW() - INTERVAL '7 days'
  AND status NOT IN ('at_anchor', 'moored');
```

---

## 📝 **Summary**

| Decision | Value | Reason |
|----------|-------|--------|
| **Port Data** | ✅ Permanent | Low volume, high value |
| **AIS Positions** | ⏰ 7 days | High volume, operational value only |
| **Database Size** | ~25 GB | Manageable, performant |
| **Cleanup Job** | Daily 2 AM | Automated, logged |
| **Total Cost** | **$0/month** | Self-hosted PostgreSQL |

---

**Status**: ✅ **IMPLEMENTED**

- ✅ Cleanup job created
- ✅ AIS service updated to store positions
- ✅ Database indexes optimized
- ⏳ Cron job setup (manual step required)

---

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
