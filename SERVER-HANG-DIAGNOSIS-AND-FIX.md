# Server Hang & Backup Issues - Complete Diagnosis

**Server:** e2e-102-29 (C3-8GB-127-216.48.185.29)
**Date:** 2026-02-13
**Issues:** Daily server hangs + R1Soft backup failures

---

## 🔴 CRITICAL ISSUE: Daily Server Hangs

### Root Cause

**Disk I/O Deadlock** caused by R1Soft CDP backup + PostgreSQL on same disk (/dev/vdc)

```
Timeline (from kernel logs - Feb 13, 01:52 AM):
01:52:05 - jbd2/vdc-8 blocked for 122 seconds (journal daemon)
01:52:05 - postgres processes blocked for 122-245 seconds
01:52:05 - hcp_io/1/0 blocked for 122 seconds (R1Soft backup driver)
→ System becomes unresponsive
→ Manual reboot required
```

### Problem Analysis

| Component | Location | Size | Issue |
|-----------|----------|------|-------|
| PostgreSQL Data | /dev/vdc (/mnt/ais-storage/postgresql) | 173GB | Database I/O operations |
| R1Soft Backup | /dev/vdc | Full disk | Backup driver saturates I/O |
| Disk Stats | vdc utilization | 54% avg, spikes to 100% | I/O contention |

**What Happens:**
1. R1Soft CDP backup starts (scheduled by backup server, not local cron)
2. HCP driver reads entire disk for backup snapshot
3. PostgreSQL tries to write/checkpoint → **blocks waiting for I/O**
4. Journal daemon (jbd2) blocks → **filesystem freezes**
5. All disk operations hang → **system becomes unresponsive**

### Current System Resources

```bash
Memory: 30GB total, 15GB used (50% usage - OK)
Disk:
  - /dev/vda (root): 187GB, 71% used, 8.61% I/O util
  - /dev/vdb (storage): 92GB, 82% used, 11.81% I/O util
  - /dev/vdc (ais-storage): 274GB, 67% used, 54.24% I/O util ⚠️
```

---

## 💡 SOLUTIONS (3 Options)

### Option 1: **DISABLE R1Soft Backup** (Immediate Fix) ⚡

**Impact:** Server will stop hanging, but you lose automated backups

```bash
# Stop CDP agent
systemctl stop cdp-agent
systemctl disable cdp-agent

# Unload HCP driver
rmmod hcpdriver

# Verify
systemctl status cdp-agent
lsmod | grep hcp
```

**Pros:**
- ✅ Immediate fix - server won't hang
- ✅ No configuration changes needed

**Cons:**
- ❌ Lose automated backups
- ❌ Need alternative backup solution

---

### Option 2: **I/O Throttling + PostgreSQL Tuning** (Recommended) 🎯

**Impact:** Reduce backup I/O impact on PostgreSQL

#### Step 1: Throttle R1Soft Backup I/O

Edit `/usr/sbin/r1soft/conf/agent_config`:

```bash
# Add these lines at the end
# Limit backup I/O to prevent system hang
IoNiceClass=3
IoNicePriority=7
ThrottleMaxBytesPerSecond=52428800  # 50MB/s limit
```

Restart CDP agent:
```bash
systemctl restart cdp-agent
```

#### Step 2: Optimize PostgreSQL for I/O

Edit `/etc/postgresql/16/main/postgresql.conf`:

```bash
# Reduce checkpoint frequency to avoid I/O spikes during backup
checkpoint_timeout = 30min           # (default: 5min)
checkpoint_completion_target = 0.9   # (default: 0.9)
max_wal_size = 4GB                   # (default: 1GB)
min_wal_size = 1GB                   # (default: 80MB)

# Reduce background writer activity during high I/O
bgwriter_delay = 200ms               # (default: 200ms)
bgwriter_lru_maxpages = 50           # (default: 100)
```

Reload PostgreSQL:
```bash
systemctl reload postgresql@16-main
```

#### Step 3: Set I/O Priority for PostgreSQL

Create systemd override:
```bash
mkdir -p /etc/systemd/system/postgresql@16-main.service.d/
cat > /etc/systemd/system/postgresql@16-main.service.d/override.conf <<'EOF'
[Service]
# Higher I/O priority than backup
IOSchedulingClass=best-effort
IOSchedulingPriority=0
EOF

systemctl daemon-reload
systemctl restart postgresql@16-main
```

**Pros:**
- ✅ Keep backups running
- ✅ Reduce I/O contention
- ✅ PostgreSQL gets priority

**Cons:**
- ⚠️ Backups will be slower (but won't hang system)
- ⚠️ May still experience some slowdown during backup

---

### Option 3: **MOVE PostgreSQL to Different Disk** (Best Long-term) 🏆

**Impact:** Complete isolation - backup won't affect PostgreSQL

#### Plan:
1. Move PostgreSQL data from `/dev/vdc` → `/dev/vdb` or `/dev/vda`
2. Backup only affects /dev/vdc (no PostgreSQL)
3. No I/O contention

#### Steps:

```bash
# 1. Stop services
systemctl stop postgresql@16-main
pm2 stop all

# 2. Backup current data (safety)
tar -czf /root/postgresql-16-backup-$(date +%Y%m%d).tar.gz \
  /mnt/ais-storage/postgresql

# 3. Move data to /mnt/storage (vdb)
mkdir -p /mnt/storage/postgresql
mv /mnt/ais-storage/postgresql/* /mnt/storage/postgresql/
chown -R postgres:postgres /mnt/storage/postgresql

# 4. Update PostgreSQL config
vim /etc/postgresql/16/main/postgresql.conf
# Change: data_directory = '/mnt/storage/postgresql/16/main'

# 5. Restart
systemctl start postgresql@16-main
pm2 start all

# 6. Verify
sudo -u postgres psql -c "SHOW data_directory;"
```

**Pros:**
- ✅ Complete isolation - no I/O contention
- ✅ Backup won't affect PostgreSQL at all
- ✅ Best performance

**Cons:**
- ⚠️ Requires downtime (30-60 minutes)
- ⚠️ /dev/vdb already 82% full (need to check space)
- ⚠️ More complex migration

---

## 🐛 SECONDARY ISSUE: SWAYAM BANI Service Down

### Error:
```
Error: Cannot find module '@powerpbox/mcp'
```

### Fix:

```bash
cd /root/swayam

# Install missing dependency
pnpm add @powerpbox/mcp

# Restart service
pm2 restart swayam-bani

# Monitor
pm2 logs swayam-bani --lines 20
```

---

## ✅ BACKUP ISSUE: Already Fixed

R1Soft HCP driver module was incompatible with kernel 6.8.0-90-generic.

**Fixed on:** 2026-01-18
**Solution:** Recompiled HCP driver module using `serverbackup-setup --get-module`

---

## 📊 RECOMMENDED ACTION PLAN

### Immediate (Today):

1. **Implement Option 2** (I/O Throttling)
   - Takes 5 minutes
   - Minimal risk
   - Should prevent hangs

2. **Fix SWAYAM BANI** service
   - Install missing dependency
   - Restart service

### Short-term (This Week):

3. **Monitor** for 3-5 nights
   - Check if hangs still occur
   - Review logs: `journalctl -p err -b --no-pager`

4. If hangs continue → **Implement Option 3** (Move PostgreSQL)

### Long-term:

5. **Contact E2E Networks** about backup schedule
   - Ask if backup can run during low-usage hours (3-5 AM)
   - Request backup I/O throttling on their end

6. **Consider cloud-native backup**
   - pg_dump + S3
   - Continuous WAL archiving
   - Less I/O intensive than block-level backup

---

## 🔍 MONITORING COMMANDS

```bash
# Check if system hung last night
journalctl -p err -b -1 --no-pager | grep -E "(blocked|hung)"

# Monitor current I/O
iostat -x 2 5

# Check PostgreSQL health
sudo -u postgres psql -c "SELECT pg_is_in_recovery();"

# Check CDP backup status
systemctl status cdp-agent
lsmod | grep hcp

# View service health
systemctl status swayam-health.service
cat /var/log/swayam-alerts.log | tail -20
```

---

## 📞 NEXT STEPS

**Choose one:**

- [ ] **Option 1**: Disable R1Soft (if backups not critical)
- [x] **Option 2**: I/O throttling (recommended - try this first)
- [ ] **Option 3**: Move PostgreSQL (if Option 2 doesn't work)

**Need help deciding?** Reply with:
- How critical are the R1Soft backups?
- Do you have alternative backup methods?
- Can you afford 30-60 min downtime for PostgreSQL migration?

---

**Contact:** Naveen Shaw | E2E Networks
**Ticket:** #1076800
**Report Generated:** 2026-02-13 09:15 IST
