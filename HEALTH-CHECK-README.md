# System Health Check Scripts

Quick diagnostic tools to monitor your ANKR system health and performance.

## 🚀 Quick Start

```bash
# Full comprehensive health check
./health-check.sh
# OR
health

# Quick snapshot (< 1 second)
./health-quick.sh
# OR
hc
```

## 📋 Scripts Overview

### 1. **health-check.sh** - Comprehensive System Report
**Location:** `/root/health-check.sh`
**Runtime:** ~5-10 seconds
**Alias:** `health`

**What it checks:**
- ✅ System Information (OS, kernel, uptime, hostname)
- ✅ CPU Information (model, cores, load, usage %)
- ✅ Memory Usage (total, used, free with color-coded warnings)
- ✅ Disk Usage (all mounted partitions with alerts)
- ✅ PM2 Processes (all services with status, CPU, memory)
- ✅ Port Availability (4444, 5432, 6379, 3000, 8080)
- ✅ Database Connectivity (PostgreSQL, Redis with connection counts)
- ✅ Docker Containers (running containers with status)
- ✅ Network Status (internet connectivity, active connections)
- ✅ Recent Errors (PM2 logs and system journal)
- ✅ Environment Variables (critical API keys check)
- ✅ Overall Health Score (0-100 rating)

**When to use:**
- Daily health checks
- Before deploying new services
- Troubleshooting system issues
- Performance analysis
- Capacity planning

---

### 2. **health-quick.sh** - Rapid Snapshot
**Location:** `/root/health-quick.sh`
**Runtime:** < 1 second
**Alias:** `hc` or `health-quick`

**What it checks:**
- ⚡ CPU & Memory usage percentage
- ⚡ Root disk usage
- ⚡ PM2 process count (online/total/errors)
- ⚡ Critical ports (4444, 5432, 6379)
- ⚡ PostgreSQL connectivity

**When to use:**
- Quick status checks
- During active development
- In scripts/cron jobs
- SSH login monitoring

---

## 🎨 Health Score Interpretation

| Score | Status | Color | Meaning |
|-------|--------|-------|---------|
| 90-100 | EXCELLENT | 🟢 Green | All systems optimal |
| 70-89 | GOOD | 🟡 Yellow | Minor issues, monitoring needed |
| 50-69 | FAIR | 🟡 Yellow | Action required soon |
| 0-49 | POOR | 🔴 Red | Immediate attention needed |

**Score is reduced by:**
- CPU usage > 80%: -20 points
- Memory usage > 90%: -30 points
- 10+ errors in logs: -15 points

---

## 🔧 Common Issues & Solutions

### High Memory Usage (> 80%)
```bash
# Find top memory consumers
pm2 list | sort -k10 -hr | head -10

# Restart heavy processes
pm2 restart <process-name>

# Clear PM2 logs
pm2 flush
```

### High Disk Usage (> 80%)
```bash
# Find large files
du -sh /* | sort -hr | head -10

# Clear PM2 logs
pm2 flush

# Clear system logs
sudo journalctl --vacuum-time=7d
```

### PM2 Processes Down
```bash
# Check specific process logs
pm2 logs <process-name> --lines 50

# Restart errored processes
pm2 restart all

# Check for port conflicts
lsof -i :<port-number>
```

### Database Issues
```bash
# Check PostgreSQL status
pg_isready -h localhost

# View active connections
psql -U postgres -c "SELECT * FROM pg_stat_activity;"

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## 📊 Monitoring Best Practices

### 1. **Daily Checks**
```bash
# Add to cron for daily reports
0 9 * * * /root/health-check.sh > /var/log/health-check-$(date +\%Y\%m\%d).log
```

### 2. **Auto-restart on High Memory**
```bash
# Monitor and restart if memory > 90%
*/15 * * * * MEM=$(free | awk '/^Mem:/ {printf "%.0f", $3/$2*100}'); [ $MEM -gt 90 ] && pm2 restart all
```

### 3. **Alert on Critical Issues**
```bash
# Send alert if health score < 50
./health-check.sh | grep "POOR" && echo "System health critical!" | mail -s "ALERT: System Health" admin@ankr.com
```

---

## 🔍 What Each Check Means

### **CPU Load Average**
- **Format:** 1-min, 5-min, 15-min averages
- **Good:** < number of CPU cores
- **Warning:** > 2x CPU cores
- **Critical:** > 4x CPU cores

### **Memory Percentage**
- **Good:** < 75%
- **Warning:** 75-90%
- **Critical:** > 90%

### **Disk Usage**
- **Good:** < 75%
- **Warning:** 75-90%
- **Critical:** > 90%

### **PM2 Process Status**
- **online:** Process running normally ✅
- **errored:** Process crashed ❌
- **stopped:** Process manually stopped ⏸️
- **waiting restart:** Process restarting 🔄

### **Port Status**
- **4444:** AI Proxy (embedding service)
- **5432:** PostgreSQL database
- **6379:** Redis cache
- **3000:** Primary web server
- **8080:** API server

---

## 🛠️ Customization

### Add Custom Port Checks
Edit `/root/health-check.sh` around line 156:

```bash
PORTS=(
    "4444:AI Proxy"
    "5432:PostgreSQL"
    "6379:Redis"
    "3000:Web Server"
    "8080:API Server"
    "9000:MinIO"          # Add your port here
    "5000:OSRM Router"    # Add another
)
```

### Add Custom Environment Variables
Edit `/root/health-check.sh` around line 298:

```bash
CRITICAL_VARS=("JINA_API_KEY" "NOMIC_API_KEY" "DATABASE_URL" "YOUR_CUSTOM_VAR")
```

### Adjust Health Score Thresholds
Edit `/root/health-check.sh` around line 311:

```bash
[ $(echo "$CPU_USAGE > 80" | bc -l) ] && HEALTH_SCORE=$((HEALTH_SCORE - 20))
[ $(echo "$MEM_PERCENT > 90" | bc -l) ] && HEALTH_SCORE=$((HEALTH_SCORE - 30))
```

---

## 📝 Example Output Interpretation

```
Overall System Health: GOOD (75/100)
```

**This means:**
- System is functioning well
- Some optimization opportunities exist
- No immediate action required
- Review warnings to improve score

**Common reasons for 75/100:**
- Memory at 82% (warning level)
- 15 errors in recent logs
- One service down but non-critical

---

## 🚨 Emergency Commands

If health score is POOR:

```bash
# 1. Check what's consuming resources
top -bn1 | head -20

# 2. Restart all PM2 processes
pm2 restart all

# 3. Clear logs
pm2 flush && sudo journalctl --vacuum-time=1d

# 4. Check disk space
df -h

# 5. Kill zombie processes
ps aux | grep 'Z' | awk '{print $2}' | xargs kill -9 2>/dev/null

# 6. Restart databases if needed
sudo systemctl restart postgresql redis
```

---

## 📞 Support

For issues or improvements:
1. Check logs: `pm2 logs --lines 100`
2. Review system logs: `journalctl -xe`
3. Run full health check: `./health-check.sh`
4. Contact: ANKR System Admin

---

**Last Updated:** 2026-02-09
**Version:** 1.0.0
**Maintainer:** ANKR DevOps Team
