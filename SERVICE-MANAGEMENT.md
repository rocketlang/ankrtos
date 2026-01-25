# Server Service Management Plan
# e2e-102-29.ankr.digital

## Current Analysis (2026-01-08)

### NGINX Sites Active (19 total)
Many nginx configs point to services that aren't running.

---

## RECOMMENDATION: Services to RUN

### Tier 1 - PRODUCTION (Must Run)
| Service | Port | Project | Command |
|---------|------|---------|---------|
| ankr-compliance-api | 4001 | /root/ankr-compliance | PM2 (running) |
| ai-proxy | 4444 | /root/ankr-ai-gateway | Need to fix |

### Tier 2 - ACTIVE DEVELOPMENT (Run on demand)
| Service | Port | Project | Status |
|---------|------|---------|--------|
| wowtruck-backend | 4100 | /root/ankr-labs-nx | Not needed now |
| freightbox-bff | 4110 | /root/ankr-labs-nx | Not needed now |

### Tier 3 - INACTIVE (DO NOT RUN)
| Service | Port | Reason |
|---------|------|--------|
| power-erp vite | 3000-3001 | Dev only, killed |
| erpbharat-api | 3002 | Was orphan |
| everpure | 3005 | Not active |
| swayam backends | 4002, 7780 | Not active |
| bani/baniai | 7777 | Not active |
| sunosunao | 7070 | Not active |
| verdaccio | 4873 | Local npm, not needed |

---

## NGINX CLEANUP RECOMMENDATION

### KEEP (Production)
- `complymitra` -> 4001, 4444
- `ankr-compliance` -> 4001, 4444
- `ankr-compliance-web` -> 4001, 4444

### DISABLE (No backend running)
```bash
# These nginx sites point to services that aren't running:
sudo rm /etc/nginx/sites-enabled/baniai
sudo rm /etc/nginx/sites-enabled/bani.ankr.in
sudo rm /etc/nginx/sites-enabled/everpure
sudo rm /etc/nginx/sites-enabled/freightbox
sudo rm /etc/nginx/sites-enabled/powerpbox
sudo rm /etc/nginx/sites-enabled/swayam
sudo rm /etc/nginx/sites-enabled/swayam.ankr.in
sudo rm /etc/nginx/sites-enabled/swayam.backup
sudo rm /etc/nginx/sites-enabled/wowtruck
sudo rm /etc/nginx/sites-enabled/wowtruck.backup_20251214_173621
sudo rm /etc/nginx/sites-enabled/sunosunao
sudo rm /etc/nginx/sites-enabled/erpbharat
```

### KEEP BUT NOT CRITICAL
- `ankr-crm*` (CRM panels - static or light)

---

## FIREWALL RECOMMENDATION

Since UFW is inactive, consider enabling it:

```bash
# Enable UFW with essential ports
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Essential
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS

# DO NOT OPEN (internal only)
# 4001 - API (behind nginx)
# 4444 - AI Proxy (behind nginx)
# 5432-5434 - PostgreSQL
# 6379-6381 - Redis

sudo ufw enable
```

---

## DOCKER CONTAINERS (KEEP)
| Container | Port | Purpose |
|-----------|------|---------|
| compliance-postgres | 5434 | ankr-compliance DB |
| compliance-redis | 6381 | ankr-compliance cache |
| sunosunao-db | 5433 | sunosunao DB (keep for data) |
| sunosunao-redis | 6380 | sunosunao cache (keep) |

---

## QUICK COMMANDS

### Start Only Essential Services
```bash
# 1. ankr-compliance API (already running)
cd /root/ankr-compliance && pm2 start ecosystem.config.js

# 2. AI Proxy - needs npm install first
cd /root/ankr-ai-gateway && npm install && pm2 start "npx tsx src/index.ts" --name ai-proxy
```

### Stop All Non-Essential
```bash
# Kill any orphan node processes
pkill -f "vite"
pkill -f "tsx.*400[2-9]"
pkill -f "tsx.*401[0-9]"
pkill -f "tsx.*777"
```

### Clean nginx
```bash
# Disable unused sites
cd /etc/nginx/sites-enabled
sudo rm baniai bani.ankr.in everpure freightbox powerpbox swayam swayam.ankr.in swayam.backup wowtruck wowtruck.backup* sunosunao erpbharat 2>/dev/null
sudo nginx -t && sudo systemctl reload nginx
```

---

## FINAL STATE (Target)

```
PORTS OPEN TO INTERNET (via nginx):
  80  - HTTP (redirects to HTTPS)
  443 - HTTPS (nginx reverse proxy)

INTERNAL ONLY (localhost):
  4001 - ankr-compliance-api
  4444 - ai-proxy
  5432 - PostgreSQL (host)
  5433 - PostgreSQL (sunosunao Docker)
  5434 - PostgreSQL (compliance Docker)
  6379 - Redis (host)
  6380 - Redis (sunosunao Docker)
  6381 - Redis (compliance Docker)
```
