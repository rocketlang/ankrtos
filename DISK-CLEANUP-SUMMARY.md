# Disk Cleanup Summary
**Date:** 2026-02-12

## Results

| Metric | Before | After | Freed |
|--------|--------|-------|-------|
| Disk Used | 172GB (93%) | 123GB (66%) | **49GB** |
| Disk Free | 15GB | 65GB | +50GB |
| ankr logs | 50GB | 59MB | 49.9GB |

## What Was Done

1. **Identified Problem:** ankr-maritime-backend had 44GB error log!
2. **Truncated Large Logs:** Kept last 1000 lines of each log
   - ankr-maritime-backend.err: 44GB → 30KB
   - ankr-maritime-backend.log: 4.1GB → 25KB
   - fr8x-frontend.err: 2.1GB → 20KB
3. **Removed Old Logs:** Deleted logs >7 days and >100MB
4. **Restarted Services:** Released file handles to freed space
   - ankr-maritime-backend (restarted)
   - fr8x-frontend (restarted)
5. **Cleaned System:**
   - APT cache cleaned
   - Journal logs vacuumed

## Root Cause

**ankr-maritime-backend** was generating excessive error logs:
- 44GB in .err file (errors)
- 4.1GB in .log file (normal logs)
- Likely infinite loop or repeated error

**Recommendation:** Monitor maritime backend logs to identify the error pattern.

## Prevention - Log Rotation Setup

Created logrotate configuration to prevent this in future:
- Location: `/etc/logrotate.d/ankr-services`
- Rotation: Daily, keep 7 days
- Max size: 100MB per log file
- Compression: Enabled

## Monitoring Commands

```bash
# Check disk space
df -h /

# Check ankr logs size
du -sh /root/.ankr/logs/

# Find largest logs
du -sh /root/.ankr/logs/* | sort -h | tail -10

# Monitor maritime backend (the culprit)
tail -f /root/.ankr/logs/ankr-maritime-backend.err
```

## Next Steps

1. ✅ Monitor maritime backend for error patterns
2. ✅ Set up log rotation (done)
3. ✅ Weekly check: `du -sh /root/.ankr/logs/`
4. Consider fixing maritime backend error source

---

**Disk Space Freed:** 49GB  
**New Disk Usage:** 66% (safe level)  
**Status:** ✅ HEALTHY
