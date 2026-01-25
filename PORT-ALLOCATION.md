# ANKR Services Port Allocation

## Running Services (PM2 Managed)

| Service | Port | Status | PM2 Name | Notes |
|---------|------|--------|----------|-------|
| ai-proxy | 4444 | Running | ai-proxy | Central AI gateway for all products |
| ankr-compliance-api | 4001 | Running | ankr-compliance-api | Cluster mode x2 |
| erpbharat-api | 3002 | Running | erpbharat-api | ERPBharat backend |
| swayam-bani | 7777 | Running | swayam-bani | BANI voice AI service |
| swayam-dashboard | 7780 | Running | swayam-dashboard | Swayam web dashboard |
| wowtruck-backend | 4000 | Running | wowtruck-backend | TMS backend |

## Nginx Domain Mappings

| Domain | Backend Port | Service |
|--------|--------------|---------|
| compliance.ankr.digital | 4001, 4444 | ankr-compliance-api, ai-proxy |
| app.compliance.ankr.digital | 4001, 4444 | ankr-compliance-api, ai-proxy |
| app.complymitra.in | 4001, 4444 | ankr-compliance-api, ai-proxy |
| baniai.io | 7777 | swayam-bani |
| bani.ankr.in | 7777 | swayam-bani |
| swayam.digimitra.guru | 7780, 7777, 4002 | swayam-dashboard, swayam-bani |
| swayam.ankr.in | 7780, 7777 | swayam-dashboard, swayam-bani |
| wowtruck.ankr.in | 4000 | wowtruck-backend |
| saathi.ankr.in | 4001, 4444 | ankr-compliance-api, ai-proxy |
| crm.ankr.in | 3000/3001 | CRM frontend/BFF |

## Reserved Port Ranges

| Range | Purpose |
|-------|---------|
| 3000-3099 | Frontend apps |
| 4000-4099 | Backend APIs |
| 4400-4499 | AI/Gateway services |
| 5432-5434 | PostgreSQL (local, docker, docker-2) |
| 6379-6381 | Redis (local, docker, docker-2) |
| 7700-7799 | Voice/Swayam services |

## Database Connections

| Database | Port | Host | Purpose |
|----------|------|------|---------|
| PostgreSQL (local) | 5432 | localhost | General development |
| PostgreSQL (Docker - ankr_eon) | 5433 | localhost | WowTruck, Swayam |
| PostgreSQL (Docker - compliance) | 5434 | localhost | Ankr Compliance |
| Redis (local) | 6379 | localhost:6379 | General cache |
| Redis (Docker - eon) | 6380 | localhost:6380 | WowTruck cache |
| Redis (Docker - compliance) | 6381 | localhost:6381 | Compliance cache |

## Project Locations

| Service | Path |
|---------|------|
| ai-proxy | /root/ankr-labs-nx/apps/ai-proxy |
| ankr-compliance-api | /root/ankr-compliance |
| erpbharat-api | /root/erpbharat |
| swayam-bani | /root/swayam/api-bani |
| swayam-dashboard | /root/ankr-labs-nx/apps/swayam-dashboard |
| wowtruck-backend | /root/ankr-labs-nx/apps/wowtruck/backend |

## PM2 Commands

```bash
# Start all saved services
pm2 resurrect

# Save current configuration
pm2 save

# Check status
pm2 list

# View logs
pm2 logs [service-name]

# Restart service
pm2 restart [service-name]
```
