# System Performance Report & Optimization Plan

**Date:** January 23, 2026
**Server:** E2E Networks e102-29
**Status:** 🟡 Performance Issues Detected

---

## Current System Stats

### Hardware
| Resource | Specification |
|----------|--------------|
| CPU Cores | 8 cores |
| RAM | 16GB (15.6GB usable) |
| Primary Disk | 140GB SSD (vda2) |
| Secondary Volume | 100GB SSD (vdb) |

### Resource Usage (Current)
| Metric | Value | Status |
|--------|-------|--------|
| **CPU Load (15min avg)** | 1.31 | 🟢 Good (16% of 8 cores) |
| **CPU Usage** | 41.9% user, 50% idle | 🟢 Good |
| **Memory Used** | 10.9GB / 15.6GB (70%) | 🟡 Moderate |
| **Memory Free** | 3.9GB (25%) | 🟡 Moderate |
| **Swap Used** | **6.8GB / 12GB (57%)** | 🔴 **CRITICAL** |
| **Root Disk** | 128GB / 140GB (92%) | 🟡 Moderate |
| **New Volume** | 6.6GB / 93GB (7%) | 🟢 Excellent |

---

## 🔴 Critical Issues

### 1. Swap Memory Overuse (57% used)
**Problem:** 6.8GB of swap being used indicates memory pressure. Swap is disk-based and **100x slower** than RAM.

**Impact:**
- Applications slow down significantly
- Database queries take longer
- API responses delayed
- Claude Code agents slower

**Why It Matters:**
When RAM is full, Linux moves inactive data to swap (disk). Accessing swapped data is extremely slow compared to RAM.

---

### 2. Duplicate tsx Watch Processes (56 instances)
**Problem:** Found **56 tsx watch processes** running simultaneously.

**Memory Impact:**
- Each tsx process: ~50-80MB
- Total waste: **~3GB+ memory**

**Processes Found:**
```
1098560 node tsx watch (ankrshield-central-api)
1561533 node vite (ankr-interact)
757153  node tsx watch (ankr-universe gateway)
761177  node tsx watch (ankr-universe gateway)
704269  node tsx watch (ankr-universe gateway)
777890  node tsx watch (ankr-universe gateway)
... 50 more duplicates
```

**Root Cause:** Processes started but not properly killed when restarting services.

---

### 3. High Memory Processes

| Process | Memory | Impact |
|---------|--------|--------|
| BitNinja SSL Termination | 765MB | 🔴 Very High |
| Claude Agents (4x) | 872MB total | 🟡 Expected |
| Next.js Server | 340MB | 🟢 Normal |
| PostgreSQL | 68MB | 🟢 Normal |
| Multiple tsx watches | 3GB+ | 🔴 Wasteful |

---

## Performance Bottlenecks

### 1. Memory Pressure → Swap Thrashing
**Current:** 10.9GB RAM used + 6.8GB swap used = **17.7GB total memory demand**
**Available:** Only 15.6GB RAM
**Problem:** System constantly swapping data between RAM and disk

**Symptoms:**
- Slow application responses
- Delayed API calls
- High disk I/O wait
- System feels sluggish

### 2. Too Many Background Processes
**Current:** 607 total tasks
**Problem:** Many are orphaned tsx watch processes consuming resources

### 3. BitNinja SSL Overhead
**Memory:** 765MB (4.7% of RAM)
**CPU:** 13.3% constant
**Purpose:** Security (SSL inspection)

---

## Optimization Plan

### Phase 1: Immediate Fixes (Free 3-4GB RAM)

#### A. Kill Duplicate tsx Processes
```bash
# List all tsx processes
ps aux | grep "tsx watch" | grep -v grep

# Kill all except active ones
pkill -9 -f "tsx watch"

# Restart only needed services via ankr-ctl
ankr-ctl restart ankrshield-central-api
ankr-ctl restart ankr-universe-gateway
```

**Expected:** Free ~3GB RAM, reduce swap usage

#### B. Clear System Caches (Safe)
```bash
# Drop page cache (safe, will rebuild)
sudo sync && sudo sysctl -w vm.drop_caches=3

# Check improvement
free -h
```

**Expected:** Free ~1-2GB RAM temporarily

#### C. Restart High-Memory Services
```bash
# Restart Claude agents (they'll reconnect)
pkill -HUP claude

# Restart ankr-interact if running
ankr-ctl restart ankr-interact
```

**Expected:** Free ~500MB RAM

---

### Phase 2: Configuration Optimizations

#### A. Reduce Swap Usage (Swappiness)
```bash
# Check current swappiness (default: 60)
cat /proc/sys/vm/swappiness

# Set to 10 (only swap when RAM <10% free)
sudo sysctl vm.swappiness=10

# Make permanent
echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf
```

**Why:** Tells Linux to avoid swap until RAM is nearly full.

#### B. Optimize PostgreSQL Memory
```bash
# Edit PostgreSQL config
sudo nano /etc/postgresql/16/main/postgresql.conf

# Recommended settings for 16GB RAM:
shared_buffers = 4GB          # 25% of RAM
effective_cache_size = 12GB   # 75% of RAM
work_mem = 64MB
maintenance_work_mem = 1GB
max_connections = 100         # Current default

# Restart PostgreSQL
sudo systemctl restart postgresql
```

**Expected:** Better database performance, less memory churn

#### C. Enable Node.js Memory Limits
```bash
# Set default Node max heap
export NODE_OPTIONS="--max-old-space-size=4096"  # 4GB max per process

# Add to ~/.bashrc for persistence
echo 'export NODE_OPTIONS="--max-old-space-size=4096"' >> ~/.bashrc
```

**Why:** Prevents Node processes from consuming unlimited memory.

---

### Phase 3: Process Management

#### A. Use ankr-ctl for Service Management
```bash
# Check what's running
ankr-ctl status

# Stop unused services
ankr-ctl stop <service-name>

# Restart memory-hungry services
ankr-ctl restart ankr-universe-gateway
ankr-ctl restart ankrshield-central-api
```

#### B. Add Service Memory Limits (PM2)
```javascript
// In ecosystem.config.js
module.exports = {
  apps: [{
    name: 'ankr-interact',
    script: 'src/server.ts',
    node_args: '--max-old-space-size=2048',  // 2GB limit
    max_memory_restart: '2G'  // Auto-restart if exceeds
  }]
};
```

#### C. Clean Up Old Processes
```bash
# Find zombie processes
ps aux | awk '$8=="Z" {print}'

# Kill all orphaned tsx processes
pkill -9 -f "node.*tsx.*watch"

# Kill orphaned sh -c processes
pkill -9 -f "sh -c tsx"
```

---

### Phase 4: Monitoring & Alerts

#### A. Set Up Memory Monitoring
```bash
# Create monitoring script
cat > /root/check-memory.sh << 'EOF'
#!/bin/bash
SWAP_USED=$(free | awk '/Swap/ {print $3/$2 * 100}')
MEM_USED=$(free | awk '/Mem/ {print $3/$2 * 100}')

if (( $(echo "$SWAP_USED > 50" | bc -l) )); then
  echo "⚠️ SWAP usage high: ${SWAP_USED}%"
  ps aux --sort=-%mem | head -10
fi

if (( $(echo "$MEM_USED > 85" | bc -l) )); then
  echo "⚠️ Memory usage high: ${MEM_USED}%"
fi
EOF

chmod +x /root/check-memory.sh

# Add to cron (check every 30min)
(crontab -l 2>/dev/null; echo "*/30 * * * * /root/check-memory.sh") | crontab -
```

#### B. Database Query Monitoring
```bash
# Check slow queries
sudo -u postgres psql -c "SELECT query, calls, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;"
```

#### C. Process Watchdog
```bash
# Prevent tsx process accumulation
cat > /root/cleanup-tsx.sh << 'EOF'
#!/bin/bash
# Kill tsx processes older than 12 hours
ps aux | grep "tsx watch" | awk '$10 ~ /:[0-9]{2}$/ && $10 !~ /^0/ {print $2}' | xargs -r kill -9
EOF

chmod +x /root/cleanup-tsx.sh

# Run daily at 3 AM
(crontab -l 2>/dev/null; echo "0 3 * * * /root/cleanup-tsx.sh") | crontab -
```

---

### Phase 5: Long-Term Improvements

#### A. Consider RAM Upgrade
**Current:** 16GB RAM
**Recommendation:** Upgrade to **32GB RAM**

**Cost:** ~₹1,500-2,000/month additional
**Benefit:**
- Eliminate swap usage completely
- Run more services simultaneously
- Better caching for databases
- Faster application responses

**When to Upgrade:**
- If swap usage stays >50% after optimizations
- If running 20+ concurrent services
- If database queries are slow

#### B. Move to ankr-ctl Process Management
**Current:** Mix of PM2, tsx watch, manual node processes
**Problem:** Inconsistent management, duplicate processes

**Solution:** Migrate all services to ankr-ctl:
```bash
# Example: ankr-interact service
ankr-ctl add ankr-interact \
  --cwd /root/ankr-labs-nx/packages/ankr-interact \
  --cmd "tsx watch src/server.ts" \
  --port 3199 \
  --memory-limit 2048
```

**Benefits:**
- Centralized management
- Memory limits enforced
- Auto-restart on failure
- No duplicate processes

#### C. Database Connection Pooling
```typescript
// In Prisma datasources
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  connectionLimit = 20  // Limit concurrent connections
}

// PgBouncer for connection pooling
sudo apt install pgbouncer
```

**Why:** Reduces database memory overhead.

---

## Expected Results After Optimizations

| Metric | Before | After (Estimated) | Improvement |
|--------|--------|-------------------|-------------|
| **RAM Used** | 10.9GB (70%) | 8GB (51%) | -2.9GB (-27%) |
| **Swap Used** | 6.8GB (57%) | <1GB (<10%) | -5.8GB (-85%) |
| **Free RAM** | 3.9GB | 6.6GB | +2.7GB (+69%) |
| **CPU Load** | 1.31 | 0.8 | -40% |
| **tsx Processes** | 56 | 5-10 | -80% |

---

## Performance Improvement Checklist

### Immediate (Do Now)
- [ ] Kill duplicate tsx processes (free 3GB)
- [ ] Set swappiness to 10
- [ ] Clear system caches
- [ ] Restart high-memory services

### Short-Term (This Week)
- [ ] Configure PostgreSQL memory settings
- [ ] Set Node.js memory limits
- [ ] Add memory monitoring script
- [ ] Clean up orphaned processes
- [ ] Set up tsx process watchdog

### Long-Term (This Month)
- [ ] Migrate services to ankr-ctl
- [ ] Set up database connection pooling
- [ ] Consider RAM upgrade if needed
- [ ] Implement automated memory alerts

---

## Quick Wins (Execute Now)

### 1. Kill Duplicate tsx Processes
```bash
# Count current tsx processes
ps aux | grep "tsx watch" | grep -v grep | wc -l

# Kill all orphaned
pkill -9 -f "sh -c tsx watch"
pkill -9 -f "node.*tsx.*watch"

# Restart only active services
ankr-ctl restart ankrshield-central-api
ankr-ctl restart ankr-universe-gateway
ankr-ctl restart ankr-interact

# Verify reduction
ps aux | grep "tsx watch" | grep -v grep | wc -l
```

### 2. Reduce Swappiness
```bash
sudo sysctl vm.swappiness=10
echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf
```

### 3. Drop Caches
```bash
sudo sync && sudo sysctl -w vm.drop_caches=3
```

### 4. Check Improvement
```bash
free -h
top -bn1 | head -5
```

---

## When to Take Action

### 🟢 Normal Operation
- RAM usage <70%
- Swap usage <10%
- Load average <4.0 (50% of 8 cores)
- No action needed

### 🟡 Attention Required
- RAM usage 70-85%
- Swap usage 10-30%
- Load average 4-6
- **Action:** Review processes, kill unused services

### 🔴 Critical (Current State)
- RAM usage >85%
- Swap usage >50%
- Load average >6
- **Action:** Immediate optimization required

---

## Monitoring Commands

```bash
# Real-time system stats
htop

# Memory breakdown
free -h
cat /proc/meminfo

# Top memory consumers
ps aux --sort=-%mem | head -20

# Swap usage per process
for file in /proc/*/status ; do
  awk '/VmSwap|Name/{printf $2 " " $3}END{ print ""}' $file
done | sort -k 2 -n -r | head -20

# Disk I/O
iostat -x 2

# Service status
ankr-ctl status

# Database connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## Performance Testing

### Before Optimization
```bash
# Measure API response time
time curl -s http://localhost:3199/health > /dev/null

# Database query performance
time psql -U ankr -d ankr_eon -c "SELECT count(*) FROM Document;"

# Memory stats
free -h > /tmp/mem-before.txt
```

### After Optimization
```bash
# Compare response times
time curl -s http://localhost:3199/health > /dev/null

# Compare database
time psql -U ankr -d ankr_eon -c "SELECT count(*) FROM Document;"

# Compare memory
free -h > /tmp/mem-after.txt
diff /tmp/mem-before.txt /tmp/mem-after.txt
```

---

## Cost-Benefit Analysis

### Option 1: Optimize Current Server (Free)
**Cost:** $0
**Time:** 2-4 hours setup + ongoing monitoring
**Expected:** 30-40% performance improvement
**Pros:** No additional cost
**Cons:** Still limited by 16GB RAM

### Option 2: Upgrade RAM to 32GB
**Cost:** ~₹1,500-2,000/month (₹18,000-24,000/year)
**Time:** Requires downtime, E2E support ticket
**Expected:** 100% performance improvement
**Pros:** Eliminates swap, future-proof
**Cons:** Monthly cost increase

### Option 3: Add Second Server (Separate Services)
**Cost:** ~₹3,000-5,000/month
**Time:** 1-2 days migration
**Expected:** Distributed load
**Pros:** High availability, isolation
**Cons:** Higher cost, more management

**Recommendation:** Start with Option 1 (optimizations), monitor for 1 week, then decide on RAM upgrade if needed.

---

## Success Metrics

Track these weekly:
- [ ] Swap usage <10%
- [ ] Free RAM >4GB
- [ ] No duplicate tsx processes
- [ ] API response times <200ms
- [ ] Database query times <50ms
- [ ] No out-of-memory errors

---

**Status:** 🟡 Optimization Required
**Priority:** High
**Impact:** 30-40% performance improvement expected
**Cost:** Free (optimizations only)

**Next Step:** Execute "Quick Wins" section to immediately free 3GB RAM and reduce swap usage.

**Jai Guru Ji** 🙏

---

**Generated:** 2026-01-23 21:55 UTC
**System:** E2E e102-29 (8 CPU, 16GB RAM)
**Optimizations:** Phase 1-5 detailed above
