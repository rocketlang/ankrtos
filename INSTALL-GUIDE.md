# 📦 SWAYAM Permanent Fix - Installation Guide
## For Server: root@216.48.185.29

---

## 🚀 Quick Install (One Command)

SSH to server and run:

```bash
ssh root@216.48.185.29

# Download and run the fix (from your Downloads)
# Or copy-paste the script content directly
```

---

## 📋 Step-by-Step Installation

### Step 1: Upload Files to Server

From your WSL terminal (C:/Users/Hp/Downloads):

```bash
# Copy fix script to server
scp install-bani-permanent-fix.sh root@216.48.185.29:/root/

# Copy aliases to server
scp swayam-aliases.sh root@216.48.185.29:/root/
```

### Step 2: SSH to Server

```bash
ssh root@216.48.185.29
```

### Step 3: Run the Permanent Fix

```bash
chmod +x /root/install-bani-permanent-fix.sh
/root/install-bani-permanent-fix.sh
```

### Step 4: Install Aliases

```bash
# Add aliases to bashrc
cat /root/swayam-aliases.sh >> ~/.bashrc

# Reload bashrc
source ~/.bashrc

# Verify
swayam-help
```

---

## ⚠️ Impact on Other PM2 Services

### What Gets Affected:
- **ONLY bani-api** is modified
- Other pm2 services continue running normally

### What Happens:
1. Old `bani-api` process is deleted
2. New `bani-api` starts with explicit `/usr/bin/node` interpreter
3. Configuration saved to pm2

### Other Services (UNCHANGED):
| Service | Port | Status |
|---------|------|--------|
| ai-proxy | 4444 | ✅ Unaffected |
| ankr-sandbox | 4220 | ✅ Unaffected |
| wowtruck-frontend | - | ✅ Unaffected |
| wowtruck-backend | - | ✅ Unaffected |
| ankr-evolution-* | - | ✅ Unaffected |
| devbrain-api | - | ✅ Unaffected |
| pdf-service | - | ✅ Unaffected |
| sunosunao-api | - | ✅ Unaffected |

### To Verify Other Services:
```bash
pm2 list
# All other services should show 'online' status
```

---

## 🔧 Alias Quick Reference

After installation, use these commands:

| Command | Description |
|---------|-------------|
| `swayam-start` | Start Swayam (direct node) |
| `swayam-stop` | Stop Swayam |
| `swayam-restart` | Rebuild & restart |
| `swayam-logs` | View logs |
| `swayam-health` | Check health |
| `swayam-help` | Show all commands |

---

## 🧪 Verification

After installation, test:

```bash
# 1. Check health
swayam-health

# 2. Test WebSocket
swayam-test-ws

# 3. Check all services
pm2 list

# 4. Visit production
# https://swayam.digimitra.guru
```

---

## 🔄 Rollback (If Needed)

If something goes wrong:

```bash
# Stop the new process
pm2 delete bani-api

# Start with old method (tsx)
cd /root/ankr-labs-nx/packages/bani
pm2 start npm --name "bani-api" -- run dev

# Note: This may bring back the tsx issue
```

---

## 📁 Files Created

| File | Purpose |
|------|---------|
| `/root/ankr-labs-nx/scripts/start-bani.sh` | Startup script |
| `/root/ankr-labs-nx/ecosystem.bani.config.js` | PM2 config |
| `/var/log/bani/` | Log directory |
| `~/.bashrc` additions | Aliases |

---

*Installation Guide v1.0*
*December 29, 2025*
*🙏 Jai Guru Ji | ANKR Labs*
