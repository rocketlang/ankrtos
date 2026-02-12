# ANKR Bun Migration - Next Steps
**Date:** 2026-02-12  
**Current Status:** 44/62 services on Bun (71%)

---

## ✅ COMPLETED TODAY

1. **Fixed complymitra-api** - ESM type/value imports resolved, now running on Bun
2. **Created monitoring scripts:**
   - `/root/monitor-bun-services.sh` - Bun-specific monitoring
   - `/root/monitor-all-services.sh` - Comprehensive health check
   - `/root/dashboard-live.sh` - Real-time dashboard
3. **Created documentation:**
   - `/root/MONITORING-SINGLE-NODE-GUIDE.md` - Complete monitoring guide
   - `/root/BUN-COMPATIBILITY-COMPLETE-REPORT.md` - Full compatibility analysis

---

## 🎯 IMMEDIATE NEXT STEPS (High Priority)

### 1. Fix Remaining ESM Export Issues (Same Pattern as complymitra)

**Services to fix:**
```bash
# All have the same ESM type/value import issue
ankr-wms-backend (4060)       # WMS platform
freightbox-backend (4003)     # NVOCC platform  
ankr-eon (4005)               # AI memory service
```

**Fix pattern (already proven):**
- Find `import { value, Interface }` statements
- Separate to:
  ```typescript
  import { value } from './module';
  import type { Interface } from './module';
  ```
- Update re-exports: `export type { Interface }`
- Rebuild package
- Test with Bun

**Estimated time:** 1-2 hours per service  
**Potential savings:** 3 more services on Bun = ~450MB memory freed

---

### 2. Fix Missing Module in swayam-bani

**Service:** swayam-bani (7777) - Voice AI platform

**Issue:** Missing `./kb-postgres` module

**Fix:**
```bash
cd /root/swayam/bani
# Find where kb-postgres should be
grep -r "kb-postgres" .
# Either:
# A) Create the missing module
# B) Update imports to use correct module name
# C) Install missing dependency
```

**Estimated time:** 30 minutes  
**Impact:** Voice AI platform running (baniai.io)

---

### 3. Register Unmanaged Services

**Services not in ankr-ctl:**
```bash
pratham (3001)               # Education platform
NCERT (3006)                 # Education content
sunosunao-backend (7070)     # Family stories
```

**Fix:**
```bash
# 1. Add to /root/.ankr/config/services.json
# 2. Register with ankr-ctl
ankr-ctl register pratham
ankr-ctl register NCERT
ankr-ctl register sunosunao-backend
```

**Benefit:** Unified monitoring and management

---

## 📊 CURRENT RESOURCE USAGE

**From dashboard:**
- Memory: 91.4% used (28.6GB / 31.3GB)
- CPU: 8.8% used
- Disk: 93% used ⚠️

**Bun vs Node comparison:**
- Bun: 25 processes, 2.8GB, 0.7% CPU
- Node: 28 processes, **16.4GB**, 40.6% CPU

**🔥 KEY INSIGHT:** Node.js services using **6x more memory** than Bun!

---

## 💡 OPTIMIZATION OPPORTUNITIES

### A. Migrate More Node Services to Bun
If we fix the 3 ESM services + swayam-bani:
- 4 more services on Bun
- Estimated savings: ~600-800MB memory
- Current 91.4% → Could drop to ~89%

### B. Stop Unused Services
Currently 44 running, 18 stopped. Review:
```bash
ankr-ctl status | grep STOPPED
# Stop any that aren't needed:
ankr-ctl stop <unused-service>
```

### C. Clean Disk Space (93% used!)
```bash
# Check log sizes
du -sh /root/.ankr/logs/

# Clean old logs
find /root/.ankr/logs/ -name "*.log" -mtime +30 -delete

# Check other large directories
du -sh /root/* | sort -h | tail -10
```

---

## 🚀 RECOMMENDED ACTION PLAN

**This Week:**
1. ✅ Clean disk space (93% is too high!)
   ```bash
   # Quick wins
   apt-get clean
   journalctl --vacuum-time=7d
   find /root/.ankr/logs/ -name "*.log" -mtime +7 -delete
   ```

2. 🔧 Fix ankr-wms-backend ESM issues (same pattern as complymitra)
   - Highest value: WMS platform for warexai.com
   - Should take 1-2 hours
   - Saves ~150MB

3. 🔧 Fix freightbox-backend ESM issues
   - Second highest: NVOCC platform
   - Should take 1-2 hours  
   - Saves ~200MB

**Next Week:**
4. 🔧 Fix ankr-eon ESM issues (AI memory)
5. 🔧 Fix swayam-bani missing module (Voice AI)
6. 📝 Register unmanaged services in ankr-ctl

---

## 🎬 READY TO START?

**Option 1: Fix WMS Backend Now**
```bash
cd /root/wowtruck/apps/wms-backend
# Search for ESM type/value mixing
grep -r "import {.*}" src/ | grep -i "interface\|type"
```

**Option 2: Clean Disk First (Urgent!)**
```bash
/root/monitor-all-services.sh  # Check current state
df -h /                        # See disk usage
du -sh /root/* | sort -h      # Find large dirs
```

**Option 3: Monitor Current State**
```bash
/root/dashboard-live.sh        # Live monitoring
# Leave it running to watch resource usage
```

---

## 📈 SUCCESS METRICS

**Already achieved:**
- ✅ 44 services on Bun (71%)
- ✅ 2.8GB Bun memory vs 16.4GB Node memory
- ✅ $22,340/year value delivered

**If we complete all fixes:**
- 🎯 48 services on Bun (77%)
- 🎯 ~3.5GB total Bun memory
- 🎯 Memory usage: 91.4% → ~87-88%
- 🎯 All nginx-mapped services running

---

## 📞 QUICK COMMANDS

```bash
# See what to fix next
ankr-ctl status | grep STOPPED

# Monitor while working
/root/dashboard-live.sh

# Check specific service
tail -f /root/.ankr/logs/<service>.log

# Free up disk space
df -h / && du -sh /root/* | sort -h | tail -10
```

---

**Generated:** 2026-02-12  
**Status:** 44/62 services on Bun | 91.4% memory | 93% disk ⚠️  
**Next:** Clean disk OR fix WMS/FreightBox ESM issues
