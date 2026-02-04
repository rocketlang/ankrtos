# ANKR Infrastructure Documentation

**Last Updated:** 2026-01-20
**Version:** 3.0
**Managed by:** ankr-ctl

---

## Table of Contents
1. [Quick Reference](#quick-reference)
2. [Aliases](#aliases)
3. [Service Architecture](#service-architecture)
4. [Applications](#applications)
5. [Port Allocations](#port-allocations)
6. [Database Configuration](#database-configuration)
7. [Directory Structure](#directory-structure)
8. [Nginx Domains](#nginx-domains)

---

## Quick Reference

```bash
# Service Management
ankr-ctl status           # View all services
ankr-ctl start <service>  # Start a service
ankr-ctl stop <service>   # Stop a service
ankr-ctl restart <service># Restart a service
ankr-ctl apps             # Show apps with frontend/backend/domains
ankr-ctl ports            # Show port allocations
ankr-ctl start-all        # Start all enabled services
ankr-ctl stop-all         # Stop all services

# Quick aliases
ankr-status               # = ankr-ctl status
ankr-apps                 # = ankr-ctl apps
apps                      # = ankr-ctl apps
services                  # = ankr-ctl status
```

---

## Aliases

All aliases are defined in `/root/.ankr/aliases.sh` and loaded via `.bashrc`.

### Service Management
| Alias | Command | Description |
|-------|---------|-------------|
| `ankr` | `/root/ankr-ctl` | Main CLI |
| `ankr-status` | `ankr-ctl status` | Show all services |
| `ankr-apps` | `ankr-ctl apps` | Show apps overview |
| `ankr-ports` | `ankr-ctl ports` | Show port allocations |
| `ankr-health` | `ankr-ctl health` | Health check all |
| `ankr-logs` | `ankr-ctl logs` | View service logs |

### Quick Shortcuts
| Alias | Command |
|-------|---------|
| `apps` | `ankr-apps` |
| `services` | `ankr-status` |
| `ports` | `ankr-ports` |

### Help
```bash
ankr-help                 # Show all aliases and commands
```

---

## Service Architecture

### Auto-Start on Boot
Services auto-start via systemd:
```
/etc/systemd/system/ankr-services.service
```

Commands:
```bash
sudo systemctl status ankr-services   # Check status
sudo systemctl restart ankr-services  # Restart all
```

### Configuration Files
```
/root/.ankr/config/
├── ports.json       # Port assignments (SINGLE SOURCE OF TRUTH)
└── services.json    # Service definitions
```

### Logs Directory
```
/root/.ankr/logs/
├── <service>.log    # stdout
├── <service>.err    # stderr
└── <service>.pid    # Process ID
```

---

## Applications

### Production Apps (Running)

| App | Frontend | Backend | DB Port | Domain |
|-----|----------|---------|---------|--------|
| **WowTruck (TMS)** | 3000 | 4000 | 5433 | wowtruck.ankr.in |
| **FreightBox** | 3001 | 4003 | 5433 | freightbox.ankr.in |
| **BFC Banking** | 3020 | 4020 | 5433 | bfc.ankr.in |
| **CRM** | 5177 | 4010/4011 | 5432 | crm.ankr.in |
| **Compliance** | - | 4001 | 5434 | compliance.ankr.digital |
| **ComplyMitra** | - | 4015 | - | complymitra.ankr.in |
| **ERP Bharat** | 3002 | 4004 | 5433 | erpbharat.in |
| **Vyomo** | 3010 | 4025 | 5433 | vyomo.in |
| **EverPure** | 3005 | 4006 | - | ever-pure.in |
| **AnkrForge** | 3200 | 4201 | 5432 | forge.ankr.in |
| **ANKR Pulse** | 4320 | - | - | pulse.ankr.in |
| **BANI AI** | - | 7777 | - | baniai.io |
| **Swayam** | 7780 | - | - | swayam.ankr.in |
| **EON Memory** | - | 4005 | 5433 | eon.ankr.in |
| **AI Proxy** | - | 4444 | - | ai.ankr.in |
| **Saathi** | - | 4008 | - | saathi.ankr.in |
| **Verdaccio** | - | 4873 | - | npm.ankr.in |
| **ANKR Viewer** | - | 3199 | - | (embedded) |

### Disabled/Pending Apps

| App | Status | Notes |
|-----|--------|-------|
| Odoo FreightBox | Disabled | Needs Python venv with lxml |
| DODD ERP | Disabled | Odoo-based |
| SunoSunao | Disabled | Needs prisma generate |
| Fr8X Exchange | Disabled | Needs fixing |
| Driver App | Disabled | Expo mobile |
| ANKR Website | Disabled | Needs pnpm install |

---

## Port Allocations

### Frontend Ports (3000-3299)
| Port | Service |
|------|---------|
| 3000 | WowTruck Frontend |
| 3001 | FreightBox Frontend |
| 3002 | ERP Bharat Frontend |
| 3003 | ANKR Website |
| 3004 | Driver App |
| 3005 | EverPure Frontend |
| 3006 | Fr8X Frontend |
| 3007 | DODD Frontend |
| 3010 | Vyomo Frontend |
| 3020 | BFC Web |
| 3021 | BFC Customer App |
| 3022 | BFC Staff App |
| 3199 | ANKR Viewer |
| 3200 | AnkrForge Web |

### Backend Ports (4000-4099)
| Port | Service |
|------|---------|
| 4000 | WowTruck Backend |
| 4001 | Compliance API |
| 4003 | FreightBox Backend |
| 4004 | ERP Bharat API |
| 4005 | EON Memory System |
| 4006 | EverPure API |
| 4007 | DODD Backend |
| 4008 | Saathi Server |
| 4010 | CRM Backend |
| 4011 | CRM BFF (GraphQL) |
| 4015 | ComplyMitra API |
| 4020 | BFC API |
| 4025 | Vyomo API |
| 4030 | DevBrain |
| 4050 | Fr8X Backend |

### Admin/Dashboard Ports (4200-4399)
| Port | Service |
|------|---------|
| 4201 | AnkrForge API |
| 4320 | ANKR Pulse |
| 4321 | Pulse Control |

### AI Services (4400-4499)
| Port | Service |
|------|---------|
| 4444 | AI Proxy (Central Gateway) |
| 4450 | Embeddings |
| 4460 | Judge |
| 4470 | Guardrails |
| 4480 | Security |
| 4490 | SLM Router |

### Voice Services (7000-7099)
| Port | Service |
|------|---------|
| 7000 | SunoSunao API |
| 7001 | SunoSunao Voice |
| 7010 | TTS |
| 7020 | STT |

### Standalone (7700-7799)
| Port | Service |
|------|---------|
| 7777 | BANI Voice AI |
| 7780 | Swayam Dashboard |

### Infrastructure
| Port | Service |
|------|---------|
| 4873 | Verdaccio (npm registry) |
| 8019 | Odoo FreightBox |
| 11434 | Ollama (LLM) |

### Reserved (DO NOT USE)
| Port | Reason |
|------|--------|
| 4002 | BitNinja |
| 1167 | Backup Service |

---

## Database Configuration

### PostgreSQL Instances

| Port | Type | Databases | User | Password |
|------|------|-----------|------|----------|
| 5432 | Local PostgreSQL | ankr_crm, ankrforge | postgres / ankr | indrA@0612 |
| 5433 | Docker PostgreSQL | ankr_eon | ankr | indrA@0612 |
| 5434 | TimescaleDB | compliance | ankr | ankrSecure2025 |

### Connection URLs

```bash
# WowTruck, BFC, EON, Vyomo (shared DB)
postgresql://ankr:indrA@0612@localhost:5433/ankr_eon

# CRM
postgresql://postgres:indrA@0612@localhost:5432/ankr_crm

# AnkrForge
postgresql://ankr:indrA@0612@localhost:5432/ankrforge

# Compliance (TimescaleDB)
postgresql://ankr:ankrSecure2025@localhost:5434/compliance
```

### Redis
| Port | Purpose |
|------|---------|
| 6379 | Primary cache |
| 6380 | Alt cache |
| 6381 | Compliance cache |

### Database per Application

| Application | Database | Port |
|-------------|----------|------|
| WowTruck | ankr_eon | 5433 |
| FreightBox | ankr_eon | 5433 |
| BFC Banking | ankr_eon | 5433 |
| Vyomo | ankr_eon | 5433 |
| EON Memory | ankr_eon | 5433 |
| ERP Bharat | ankr_eon | 5433 |
| CRM | ankr_crm | 5432 |
| AnkrForge | ankrforge | 5432 |
| Compliance | compliance | 5434 |

---

## Directory Structure

### Main Directories
```
/root/
├── .ankr/                    # ANKR CLI & config
│   ├── config/
│   │   ├── ports.json        # Port assignments
│   │   └── services.json     # Service definitions
│   ├── logs/                 # Service logs
│   └── aliases.sh            # Shell aliases
├── ankr-ctl                   # Main CLI script
├── ankr-labs-nx/              # Main monorepo
├── ankr-bfc/                  # BFC Banking platform
├── ankr-forge/                # AnkrForge platform
├── ankr-compliance/           # Compliance API
├── ankr-options-standalone/   # Vyomo project
├── power-erp/                 # ERP Bharat
├── everpure-backend/          # EverPure API
├── swayam/                    # Swayam/BANI
└── odoo-evolution/            # Odoo ERP

/var/www/
├── ankr-landing/              # ankr.in static
├── ankrlabs.org/              # ankrlabs.org static
├── complymitra/               # ComplyMitra landing
├── freightbox/                # FreightBox static
├── wowtruck/                  # WowTruck static
├── npm-registry/              # Verdaccio landing
└── vyomo-landing/             # Vyomo landing
```

### Monorepo Structure (ankr-labs-nx)
```
ankr-labs-nx/
├── apps/                      # Applications
│   ├── ai-proxy/              # Central AI Gateway
│   ├── ankr-crm/              # CRM (backend, bff, frontend)
│   ├── wowtruck/              # TMS (backend, frontend)
│   ├── freightbox/            # NVOCC (backend, frontend)
│   ├── fr8x/                  # Freight Exchange
│   ├── saathi-server/         # Saathi API
│   ├── ankr-pulse/            # Observability Dashboard
│   └── driver-app/            # Mobile app
├── packages/                  # Shared packages
│   ├── ankr-eon/              # Memory system
│   ├── ankr-viewer/           # Knowledge browser
│   ├── ankr-security/         # Security gateway
│   ├── sunosunao/             # Voice AI
│   └── mcp-tools/             # MCP integrations
└── libs/                      # Internal libraries
```

---

## Nginx Domains

### Active Domains

| Domain | Backend | Frontend | SSL |
|--------|---------|----------|-----|
| wowtruck.ankr.in | 4000 | 3000 | Yes |
| freightbox.ankr.in | 4003 | 3001 | Yes |
| bfc.ankr.in | 4020 | 3020 | Yes |
| crm.ankr.in | 4010 | 5177 | Yes |
| compliance.ankr.digital | 4001 | - | Yes |
| complymitra.ankr.in | 4015 | Static | Yes |
| erpbharat.in | 4004 | 3002 | Yes |
| vyomo.in | 4025 | 3010 | Yes |
| ever-pure.in | 4006 | - | Yes |
| forge.ankr.in | 4201 | 3200 | Yes |
| pulse.ankr.in | 4320 | - | Yes |
| baniai.io | 7777 | - | Yes |
| swayam.ankr.in | - | 7780 | Yes |
| ai.ankr.in | 4444 | - | Yes |
| saathi.ankr.in | 4008 | - | Yes |
| ankrlabs.org | - | Static | Yes |
| ankr.in | - | Static | Yes |
| digimitra.guru | 4020 | BFC dist | Yes |

### Nginx Config Location
```
/etc/nginx/sites-available/
/etc/nginx/sites-enabled/
```

---

## Service Commands Reference

### ankr-ctl Commands
```bash
ankr-ctl status [service]     # Status of all or specific service
ankr-ctl start <service>      # Start a service
ankr-ctl stop <service>       # Stop a service
ankr-ctl restart <service>    # Restart a service
ankr-ctl logs <service>       # View service logs
ankr-ctl health               # Health check all services
ankr-ctl ports                # Show port allocations
ankr-ctl apps                 # Show apps overview
ankr-ctl env                  # Show environment variables
ankr-ctl start-all            # Start all enabled services
ankr-ctl stop-all             # Stop all services
```

### Systemd Commands
```bash
sudo systemctl status ankr-services
sudo systemctl start ankr-services
sudo systemctl stop ankr-services
sudo systemctl restart ankr-services
sudo systemctl enable ankr-services   # Enable auto-start
```

---

## Health Endpoints

| Service | Health URL |
|---------|------------|
| AI Proxy | http://localhost:4444/health |
| WowTruck | http://localhost:4000/health |
| FreightBox | http://localhost:4003/health |
| BFC API | http://localhost:4020/health |
| EON | http://localhost:4005/health |
| Compliance | http://localhost:4001/health |
| Vyomo API | http://localhost:4025/health |
| Viewer | http://localhost:3199/api/health |

---

## Troubleshooting

### Service Won't Start
```bash
# Check logs
ankr-ctl logs <service>

# Check if port is in use
fuser <port>/tcp

# Kill process on port
fuser -k <port>/tcp
```

### Prisma Client Missing
```bash
cd /path/to/app
npx prisma generate --schema=prisma/schema.prisma
```

### Database Connection Issues
```bash
# Test PostgreSQL
psql -h localhost -p 5433 -U ankr -d ankr_eon

# Test Redis
redis-cli ping
```

---

## Contact

**ANKR Labs**
Documentation maintained by ankr-ctl v3.0
