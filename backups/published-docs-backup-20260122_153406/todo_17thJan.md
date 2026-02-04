# ankrBFC - TODO (17th January 2026)

## Summary

| Category | Done | Pending |
|----------|------|---------|
| Packages | 1/6 | 5 |
| Apps | 2/4 | 2 |
| Database | Schema ✅ | Seed Data ❌ |
| Integrations | 0/3 | 3 |
| Tests | 0 | All |

---

## Critical Issues (Blocking Production)

### 1. bfc-core Package Build Failures
**Status**: ❌ 30+ TypeScript errors
**Impact**: Encryption, EON, AI Proxy, Complymitra integrations disabled

**Errors to fix**:
- Missing module imports (`../observability/logger`)
- Type mismatches in retry decorators
- Missing exports (`AIProxyClient`, `EonClient`, `CircuitBreakerPresets`)
- `@ankr/eon` package not found
- Implicit `any` types

### 2. bfc-ui Package Build Failures
**Status**: ❌ 15+ TypeScript errors
**Impact**: Shared UI components can't be built

**Errors to fix**:
- Missing DOM types (`document`, `HTMLTableCellElement`)
- Unused React imports
- Event type mismatches

### 3. No Seed Data
**Status**: ❌ 0 records in database
**Impact**: Cannot demo the platform

**Tables to seed**:
- Customer (sample customers)
- Staff (admin users)
- Branch (bank branches)
- CustomerProduct (accounts, loans)
- CustomerEpisode (behavioral data)
- Campaign (sample campaigns)

---

## Package Build Status

| Package | Build | Notes |
|---------|-------|-------|
| @ankr-bfc/config | ✅ Success | Ports, URLs, bootstrap |
| @ankr-bfc/core | ❌ Failed | 30+ errors - main blocker |
| @ankr-bfc/ui | ❌ Failed | DOM types missing |
| @ankr-bfc/utils | ⚠️ Not tested | Needs verification |
| @ankr-bfc/api-client | ❌ Failed | tsconfig.node.json reference |
| @ankr-bfc/compliance | ⚠️ Not tested | Needs verification |

---

## Apps Status

| App | Port | Status | Notes |
|-----|------|--------|-------|
| bfc-api | 4020 | ✅ Running | Workaround: encryption disabled |
| bfc-web | 3020 | ✅ Running | Dev mode only |
| bfc-customer-app | 8081 | ⚠️ Not started | Expo app |
| bfc-staff-app | 8082 | ⚠️ Not started | Expo app |

---

## Integration Status

| Service | Port | Status | Notes |
|---------|------|--------|-------|
| EON Memory | 4005 | ⚠️ Not verified | Code exists in bfc-core |
| AI Proxy | 4444 | ⚠️ Not verified | Code exists in bfc-core |
| Complymitra | 4015 | ⚠️ Not verified | Code exists in bfc-core |
| CBS Adapter | - | ⚠️ Mock only | No real CBS integration |

---

## Database Status

**Connection**: `postgresql://ankr:***@localhost:5432/bfc`

| Metric | Value |
|--------|-------|
| Tables | 34 |
| Customers | 0 |
| Staff | 0 |
| Products | 0 |
| Episodes | 0 |

---

## Pending Tasks

### Priority 1: Fix Package Builds

- [ ] Fix bfc-core TypeScript errors
  - [ ] Add missing exports to observability/index.ts
  - [ ] Fix retry decorator signatures
  - [ ] Add @ankr/eon dependency or mock
  - [ ] Fix implicit any types

- [ ] Fix bfc-ui TypeScript errors
  - [ ] Add DOM lib to tsconfig
  - [ ] Fix React import issues
  - [ ] Fix HTMLTableCellElement types

- [ ] Verify bfc-utils builds

### Priority 2: Database & Data

- [ ] Create seed script (`prisma/seed.ts`)
- [ ] Add sample customers (10-20)
- [ ] Add staff users (admin, manager, officer)
- [ ] Add sample products and episodes
- [ ] Add sample campaigns and offers

### Priority 3: Restore Full Functionality

- [ ] Restore `initializeEncryption` import in bfc-api
- [ ] Test EON Memory integration
- [ ] Test AI Proxy integration
- [ ] Test Complymitra integration

### Priority 4: Mobile Apps

- [ ] Start bfc-customer-app (Expo)
- [ ] Start bfc-staff-app (Expo)
- [ ] Verify GraphQL connectivity

### Priority 5: Testing

- [ ] Run bfc-core unit tests
- [ ] Run bfc-web E2E tests
- [ ] Run integration tests

---

## Completed Today

- [x] Initialize git repository
- [x] Push to GitHub (https://github.com/rocketlang/ankr-bfc)
- [x] Create PostgreSQL database `bfc`
- [x] Enable pgvector and pgcrypto extensions
- [x] Sync Prisma schema (34 tables)
- [x] Build bfc-config package
- [x] Start bfc-api on port 4020
- [x] Start bfc-web on port 3020
- [x] Fix package dependency issues
- [x] Add KYC_VIEW permission

---

## Repository

**GitHub**: https://github.com/rocketlang/ankr-bfc

**Commits**:
1. `c29f81b` - Initial ankrBFC platform setup (221 files)
2. `cd21210` - Add prisma to workspace root
3. `ee6caca` - Fix package dependencies and TypeScript errors

**Lines of Code**: 43,560
- TypeScript: 28,019
- React TSX: 8,350
- Prisma: 1,183
- Documentation: 4,678

---

## Quick Start (Current State)

```bash
cd /root/ankr-bfc

# Start API (with workarounds)
cd apps/bfc-api && pnpm dev

# Start Web Dashboard
cd apps/bfc-web && pnpm dev

# Access
# API: http://localhost:4020/graphql
# Web: http://localhost:3020
```

---

*Generated: 17th January 2026*
