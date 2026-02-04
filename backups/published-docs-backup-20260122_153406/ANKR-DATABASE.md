# ANKR Database Configuration Guide

> **Version:** 2.0.0 | **Updated:** 2026-01-20 | **Verified:** Yes

This document provides the authoritative database configuration for all ANKR Labs applications.

## Quick Reference

| Database | Port | Tables | Apps | Prisma |
|----------|------|--------|------|--------|
| wowtruck | 5432 | 182 | wowtruck-backend | Yes |
| freightbox | 5432 | 39 | freightbox-backend | Yes |
| fr8x | 5432 | 87 | fr8x-backend | Yes |
| bfc | 5432 | 71 | bfc-api | Yes |
| ankr_eon | 5432 | 46 | ankr-eon, devbrain, sidecar | Yes |
| ankr_crm | 5432 | 54 | ankr-crm | Yes |
| ankrforge | 5432 | 12 | ankr-forge | Yes |
| dodd | 5432 | 27 | dodd-backend | Yes |
| swayam | 5432 | 5 | swayam-api (bani) | Yes |
| vyomo | 5432 | 17 | vyomo-api | Yes |
| everpure | 5432 | 31 | everpure-backend | Yes |
| erpbharat | 5432 | 56 | erpbharat-backend | Yes |
| compliance | 5434 | 90 | ankr-compliance | Yes (TimescaleDB) |
| odoo_freightbox | 5433 | 640 | odoo-freightbox | No (Odoo managed) |
| sunosunao | 5433 | 11 | sunosunao-api | Yes |

**Total: 15 databases, 1,480+ tables**

## PostgreSQL Servers

### Port 5432 - Local PostgreSQL (Main)
- **12 databases** for most applications
- Default user: `ankr` / `indrA@0612`

### Port 5433 - Docker PostgreSQL
- **3 databases** for Odoo and SunoSunao
- Container: `sunosunao-db`

### Port 5434 - TimescaleDB
- **1 database** for compliance (time-series data)
- Container: `compliance-postgres`
- Password: `ankrSecure2025`

## App-to-Database Mapping

### Logistics (3 SEPARATE systems!)
```
freightbox-backend  → freightbox (5432)   - 39 tables
fr8x-backend        → fr8x (5432)         - 87 tables
odoo-freightbox     → odoo_freightbox (5433) - 640 tables
```

### Transport Management
```
wowtruck-backend    → wowtruck (5432, schema: wowtruck) - 182 tables
```

### AI Memory Systems
```
ankr-eon            → ankr_eon (5432) - 46 tables
ankr-devbrain       → ankr_eon (5432) - shared
sidecar-backend     → ankr_eon (5432) - shared
```

### Voice AI
```
swayam-api (bani)   → swayam (5432)    - 5 tables
sunosunao-api       → sunosunao (5433) - 11 tables
```

### Fintech
```
bfc-api             → bfc (5432)   - 71 tables
vyomo-api           → vyomo (5432) - 17 tables
```

### Business Apps
```
ankr-crm            → ankr_crm (5432)   - 54 tables
ankr-forge          → ankrforge (5432)  - 12 tables
everpure-backend    → everpure (5432)   - 31 tables
erpbharat-backend   → erpbharat (5432)  - 56 tables
dodd-backend        → dodd (5432)       - 27 tables
```

### Compliance
```
ankr-compliance     → compliance (5434, TimescaleDB) - 90 tables
```

## Connection Strings

### Standard Apps (ankr user)
```bash
# WowTruck
postgresql://ankr:indrA@0612@localhost:5432/wowtruck?schema=wowtruck

# FreightBox
postgresql://ankr:indrA@0612@localhost:5432/freightbox?schema=public

# Fr8X
postgresql://ankr:indrA@0612@localhost:5432/fr8x?schema=public

# BFC
postgresql://ankr:indrA@0612@localhost:5432/bfc

# EON/DevBrain
postgresql://ankr:indrA@0612@localhost:5432/ankr_eon?schema=public

# Swayam/BANI
postgresql://ankr:indrA@0612@localhost:5432/swayam

# AnkrForge
postgresql://ankr:indrA@0612@localhost:5432/ankrforge?schema=public
```

### Apps with Custom Users
```bash
# EverPure
postgresql://everpure:everpure2025@localhost:5432/everpure?schema=public

# ERP Bharat
postgresql://erpbharat:ErpBharat2026@localhost:5432/erpbharat?schema=public

# Vyomo
postgresql://postgres:postgres@localhost:5432/vyomo?schema=public

# CRM
postgresql://postgres:indrA@0612@localhost:5432/ankr_crm
```

### Docker PostgreSQL (5433)
```bash
# Odoo FreightBox
postgresql://ankr:indrA@0612@localhost:5433/odoo_freightbox

# SunoSunao
postgresql://ankr:indrA@0612@localhost:5433/sunosunao
```

### TimescaleDB (5434)
```bash
# Compliance (CompyMitra)
postgresql://ankr:ankrSecure2025@localhost:5434/compliance
```

## Prisma Schema Locations

| App | Prisma Schema Path |
|-----|-------------------|
| wowtruck | `/root/ankr-labs-nx/apps/wowtruck/backend/prisma/schema.prisma` |
| freightbox | `/root/ankr-labs-nx/apps/freightbox/backend/prisma/schema.prisma` |
| fr8x | `/root/ankr-labs-nx/apps/fr8x/backend/prisma/schema.prisma` |
| bfc | `/root/ankr-bfc/prisma/schema.prisma` |
| ankr-eon | `/root/ankr-labs-nx/packages/ankr-eon/prisma/schema.prisma` |
| ankr-crm | `/root/ankr-labs-nx/packages/ankr-crm-prisma/prisma/schema.prisma` |
| ankrforge | `/root/ankr-forge/prisma/schema.prisma` |
| dodd | `/root/ankr-labs-nx/apps/dodd-backend/prisma/schema.prisma` |
| swayam | `/root/swayam/prisma/schema.prisma` |
| vyomo | `/root/ankr-options-standalone/apps/vyomo-api/prisma/schema.prisma` |
| everpure | `/root/everpure-backend/prisma/schema.prisma` |
| erpbharat | `/root/power-erp/prisma/schema.prisma` |
| compliance | `/root/ankr-compliance/libs/database/prisma/schema.prisma` |
| sunosunao | `/root/ankr-labs-nx/packages/sunosunao/prisma/schema.prisma` |

## Backup & Recovery

### Daily Backup (Cron: 2 AM)
```bash
# Run backup manually
/root/.ankr/scripts/db-backup.sh

# Backup location
/root/ankr-backups/daily/

# Retention: 7 days
```

### Restore from Backup
```bash
# Restore specific database
/root/.ankr/scripts/db-restore.sh <database> [date]

# Example
/root/.ankr/scripts/db-restore.sh wowtruck 20260120
```

### Reinitialize via Prisma
```bash
# WARNING: Drops all data!
/root/.ankr/scripts/db-reinit.sh <app>

# Example
/root/.ankr/scripts/db-reinit.sh wowtruck

# Or manually:
cd /path/to/app
npx prisma db push --force-reset
npx prisma db seed  # if seed exists
```

## Configuration Files

| File | Purpose |
|------|---------|
| `/root/.ankr/config/databases.json` | Master database registry |
| `/root/.ankr/scripts/db-backup.sh` | Daily backup script |
| `/root/.ankr/scripts/db-restore.sh` | Restore from backup |
| `/root/.ankr/scripts/db-reinit.sh` | Reinitialize via Prisma |

## Important Notes

1. **NEVER create new databases** - Map to existing ones
2. **FreightBox, Fr8X, Odoo FreightBox are 3 SEPARATE apps** with separate databases
3. **WowTruck uses schema `wowtruck`** within the wowtruck database
4. **ankr_eon is shared** by EON, DevBrain, and Sidecar
5. **Compliance uses TimescaleDB** on port 5434 (not regular PostgreSQL)
6. **All Prisma apps can reinitialize** from schema if data is lost

## Aliases

Use these aliases with `ankr-ctl`:

```
wowtruck, tms          → wowtruck-backend
freightbox, freight-box → freightbox-backend
fr8x, fr8-x            → fr8x-backend
odoo, odoo-fb          → odoo-freightbox
bfc, banking           → bfc-api
eon, devbrain          → ankr-eon
crm                    → ankr-crm
compliance, complymitra → ankr-compliance
forge, ankrforge       → ankr-forge
everpure               → everpure-backend
erpbharat, power-erp   → erpbharat-backend
swayam, bani, baniai   → swayam-api
vyomo, options         → vyomo-api
```
