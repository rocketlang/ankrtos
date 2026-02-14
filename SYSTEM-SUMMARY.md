# ANKR System Summary - e2e-102-29

**Last Updated:** 2026-02-13 10:34 IST
**Status:** ✅ Healthy & Optimized

---

## 📊 Hardware Specs

| Component | Specification |
|-----------|---------------|
| **CPU** | AMD EPYC 9555 64-Core |
| **vCPUs** | 16 cores |
| **Architecture** | x86_64 |
| **RAM** | 30 GB |
| **Disk 1 (vda)** | 186 GB (Main System) |
| **Disk 2 (vdb)** | 93 GB (Storage) |
| **Disk 3 (vdc)** | 279 GB (AIS Storage) |
| **Total Storage** | 558 GB |

---

## 💻 Current Performance

### CPU
- **Load Average:** 0.75 (1m), 1.27 (5m), 2.97 (15m)
- **Usage:** 7.9% user, 6.2% system, 86.0% idle
- **Status:** ✅ Healthy (low load)

### Memory
- **Total:** 30 GB
- **Used:** 18 GB (60%)
- **Available:** 11 GB (37%)
- **Swap:** 3.6 GB / 11 GB (33% used)
- **Status:** ✅ Normal usage

### Disks (3 Total)

#### Disk 1: /dev/vda (Main System - XFS)
```
Mount:     /
Total:     187 GB
Used:      132 GB (71%)
Free:      55 GB
Purpose:   OS, applications, services
Status:    ✅ Normal
```

#### Disk 2: /dev/vdb (Storage - EXT4)
```
Mount:     /mnt/storage
Total:     92 GB
Used:      71 GB (82%)
Free:      16 GB
Purpose:   Application data, Docker volumes
Status:    ⚠️ High usage (82%)
```

#### Disk 3: /dev/vdc (AIS Storage - EXT4)
```
Mount:     /mnt/ais-storage
Total:     274 GB
Used:      16 GB (6%) ⬅️ OPTIMIZED!
Free:      245 GB
Purpose:   PostgreSQL (ankr_maritime), AIS data
Status:    ✅ Excellent (was 177 GB → now 16 GB)
```

---

## 🗄️ Database Status

| Database | Size | Purpose | Location |
|----------|------|---------|----------|
| **ankr_eon** | 4.9 GB | AI Memory System | /var/lib/postgresql |
| **ankr_maritime** | 3.4 GB | AIS Vessel Tracking | /mnt/ais-storage |
| **ankrshield** | 85 MB | Security | /var/lib/postgresql |
| **odoo19_e2e** | 80 MB | ERP System | /var/lib/postgresql |
| **freightbox_e2e** | 75 MB | Freight Management | /var/lib/postgresql |
| **fr8x** | 65 MB | Freight Exchange | /var/lib/postgresql |
| **wowtruck** | 62 MB | TMS System | /var/lib/postgresql |
| **vyomo** | 18 MB | Multi-Tenancy | /var/lib/postgresql |

**Total Database Size:** ~9 GB

---

## 🚢 Maritime System (MARI8X)

| Metric | Value |
|--------|-------|
| Database Size | 3.4 GB (was 177 GB) |
| Optimization | **98% reduction** |
| Total Vessels | 54,962 |
| Active Vessels | 26,299 (last 24h) |
| Raw Positions | 2.25 million |
| Hourly Data | 48,691 vessels |
| Daily Data | 48,272 vessels |
| Latest Data | 2026-02-13 05:00:02 |

---

## 🚀 Services Running

**Total:** 33 services via ankr-ctl

### Key Backend Services
- **ankr-maritime-backend** (4051) - Maritime/AIS system
- **ankr-wms-backend** (4060) - Warehouse Management
- **ankrtms-backend** (4000) - Transport Management
- **ankr-crm-backend** (4010) - CRM system
- **fr8x-backend** (4050) - Freight exchange
- **bfc-api** (4020) - BFC platform
- **devbrain** (4030) - AI DevBrain

### Frontend Services
- **ankr-maritime-frontend** (3008)
- **ankr-wms-frontend** (3060)
- **freightbox-frontend** (3001)
- **fr8x-frontend** (3006)
- **ankr-crm-frontend** (5177)

**Status:** All services running normally ✅

---

## 🌐 Network Configuration

| Interface | IP Address | Purpose |
|-----------|------------|---------|
| ens3 | 10.13.178.6/23 | Private network |
| ens4 | 216.48.185.29/20 | Public IP |
| docker0 | 172.17.0.1/16 | Docker default |
| br-* | Various 172.x.x.x | Docker networks |

---

## 📈 Recent Optimizations (2026-02-13)

### 1. AIS Database Cleanup
- **Before:** 177 GB (66M rows, 6 months raw data)
- **After:** 3.4 GB (2.25M rows, 24h raw data)
- **Freed:** 173.6 GB (98% reduction)
- **Status:** ✅ Complete

### 2. Data Retention Strategy
- **Raw data:** 24 hours (real-time)
- **Minute aggregates:** 7 days
- **Hourly aggregates:** 90 days (48,691 vessels)
- **Daily aggregates:** 5 years (48,272 vessels)

### 3. I/O Optimization
- **R1Soft backup:** 50 MB/s throttle
- **PostgreSQL:** Higher I/O priority
- **Checkpoints:** 30-minute intervals
- **Result:** System stable, no hangs ✅

### 4. Service Cleanup
- Removed duplicate PM2 process (ankr-wms-backend)
- All services now managed via ankr-ctl
- Port conflicts resolved ✅

---

## 📊 Performance Baselines

### Normal Operating Ranges
- **CPU Load:** 0.5 - 3.0 (1-min average)
- **Memory Usage:** 50-70%
- **Disk I/O (vdc):** 50-80% during AIS writes
- **Swap Usage:** < 40%

### Alert Thresholds
- **CPU Load:** > 10.0 sustained
- **Memory Available:** < 2 GB
- **Disk Usage:** > 90%
- **Swap Usage:** > 80%

---

## 🔧 Quick Reference Commands

### System Monitoring
```bash
# Complete performance report
/root/system-performance-full.sh

# Quick stats
htop
iostat -x 5
free -h
df -h
```

### Services
```bash
# ANKR services
ankr-ctl status
ankr-ctl health

# PM2 services
pm2 list
pm2 monit
```

### Maritime/AIS
```bash
# Check active vessels (30 min)
/root/check-active-vessels.sh 30

# Database size
sudo -u postgres psql -d ankr_maritime -c "SELECT pg_size_pretty(pg_database_size('ankr_maritime'));"

# Latest data
sudo -u postgres psql -d ankr_maritime -c "SELECT MAX(timestamp), COUNT(DISTINCT \"vesselId\") FROM vessel_positions WHERE timestamp > NOW() - INTERVAL '24 hours';"
```

### Databases
```bash
# List all databases
sudo -u postgres psql -l

# Database sizes
sudo -u postgres psql -c "SELECT datname, pg_size_pretty(pg_database_size(datname)) FROM pg_database ORDER BY pg_database_size(datname) DESC;"
```

---

## 🎯 Maintenance Schedule

### Daily
- [x] Monitor vessel activity every 30 minutes (automated)
- [x] Check system load and memory
- [x] Verify services are running

### Weekly
- [ ] Review database growth rates
- [ ] Check disk space trends
- [ ] Analyze backup logs

### Monthly
- [ ] Database optimization (VACUUM, REINDEX)
- [ ] Review retention policies
- [ ] System updates

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `/root/system-performance-full.sh` | Complete system report |
| `/root/check-active-vessels.sh` | Maritime vessel monitor |
| `/root/VESSEL-MONITORING-GUIDE.md` | Maritime monitoring guide |
| `/root/AIS-OPTIMIZATION-SUCCESS-REPORT.md` | Optimization details |
| `/root/SERVER-HANG-DIAGNOSIS-AND-FIX.md` | Original issue diagnosis |
| `/root/.ankr/config/services.json` | Service configurations |
| `/root/.ankr/config/ports.json` | Port allocations |

---

## 🆘 Emergency Contacts

**E2E Networks Support:**
- Email: cloud-platform@e2enetworks.com
- Phone: +91-11-4117-1818

**Server Details:**
- Hostname: e2e-102-29
- Public IP: 216.48.185.29
- Backup Ticket: #1076800

---

**Generated:** 2026-02-13 10:34 IST
**Next Review:** 2026-02-14 (Monitor backup success)
**Status:** ✅ All systems operational
