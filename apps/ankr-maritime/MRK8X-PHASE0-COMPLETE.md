# ankrMrk8X Phase 0 — COMPLETE

**Date**: 2026-01-30
**Status**: Phase 0 scaffolding + basic features DONE
**ETA to Phase 1 (Full Chartering + DA Desk)**: Next session

---

## What's Built

### Backend (Fastify + Mercurius + Pothos + Prisma)
- **Port**: 4051
- **16 database tables**: Organization, User, Vessel, Port, Company, Cargo, Charter, CharterParty, Clause, CharterPartyClauses, Voyage, VoyageMilestone, DisbursementAccount, DaLineItem, VendorRating
- **GraphQL API**: Full schema with queries + mutations
  - Auth: `login`, `me`
  - Vessels: `vessels`, `vessel`, `vesselByImo`, `createVessel`, `updateVessel`, `deleteVessel`
  - Ports: `ports`, `port`, `portByUnlocode`, `createPort`
  - Companies: `companies`, `company`, `createCompany`
  - Charters: `charters`, `charter`, `createCharter`
  - Voyages: `voyages`, `voyage`, `createVoyage`, `updateVoyageStatus`
  - Features: `features`, `enabledFeatures`, `currentTier`, `isFeatureEnabled`
- **JWT Authentication**: Real token signing/verification
- **DataLoader**: Batch loading pattern for N+1 prevention
- **Feature Flags**: 25 features across Free/Pro/Enterprise tiers

### Frontend (Vite + React 19 + Apollo + Zustand + MapLibre)
- **Port**: 3008
- **8 Pages**:
  - Login (JWT auth with Zustand persist)
  - Dashboard (GraphQL health + module overview)
  - Vessels (searchable table, 7 vessels)
  - Ports (searchable table, 50 ports)
  - Port Map (MapLibre + OSM, interactive markers)
  - Companies (card grid, type filter, 10 companies)
  - Chartering (fixture table)
  - Voyages (voyage tracking table)
  - Features (tier config viewer)
- **Route guards**: Protected routes redirect to login
- **Collapsible sidebar** with NavLink active states

### Seed Data
- 1 Organization (ANKR Maritime Pvt Ltd)
- 2 Users (admin + operator)
- 50 World Ports (UNLOCODE, lat/lng, timezone)
- 7 Vessels (bulk carriers, tankers, container, general cargo)
- 10 Companies (charterers, brokers, agents)
- 8 Standard Clauses (BIMCO, GENCON)
- 5 Cargo types (iron ore, coal, wheat, crude, steel)

### Enterprise Feature Configuration
| Tier | Features Enabled |
|------|-----------------|
| **FREE** (default) | Vessel Registry, Port Directory, Company Directory, Basic Chartering, Voyage Tracking, Cargo Management, OSS Maps, Clause Library |
| **PRO** | + Milestones, Vendor Ratings, C/P Builder, Multi-User, OSRM Routing, Basic Analytics |
| **ENTERPRISE** | + DA Desk, Laytime Calculator, Claims, P&I Club, Weather Routing, Sea Routing Engine, Mrk8XLLM, Advanced Analytics, OpenSeaMap, EDI, API Access |

Set `MRK8X_TIER=pro` or `MRK8X_TIER=enterprise` in `backend/.env` to unlock tiers.

### Monorepo Config
- `.ankr/config/ports.json`: maritime → 3008/4051
- `ankr-services.config.js`: Both services registered
- `ecosystem.config.js`: Auto-picks up (no changes needed)

---

## Smoke Test Results
| Check | Result |
|-------|--------|
| `prisma generate` | PASS |
| `prisma db push` | PASS (16 tables) |
| Backend starts on :4051 | PASS |
| `/health` | `{"status":"ok"}` |
| `{ __typename }` | `"Query"` |
| `login(admin@ankr.in)` | JWT token returned |
| `{ vessels }` | 7 vessels |
| `{ ports }` | 50 ports |
| `{ features }` | 25 features, 8 enabled (free tier) |
| Frontend build | PASS (1.5MB / 422KB gzip) |

---

## Next: Phase 1 Targets
1. Full Chartering workflow (create → on_subs → fixed → executed)
2. DA Desk (PDA/FDA generation)
3. Laytime Calculator
4. Sea Routing Engine (great circle + waypoints)
5. Weather Routing plugin hooks (GFS/ECMWF)
6. Mrk8XLLM training data pipeline
7. OSRM land routing integration
8. OpenSeaMap chart overlay
