# GraphQL Schema Mismatches - Mari8x Maritime

**Status**: Active Issue Tracking
**Last Updated**: 2026-02-09

## Critical Issues (Blocking Multiple Pages)

###  1. Dashboard Queries (affects ALL authenticated pages)
**Impact**: Every page loads Dashboard component in Layout

| Query/Field | Error | Fix Required |
|-------------|-------|--------------|
| `vesselPositions` | Requires `vesselId` argument (String!) | Make optional OR provide default [] |
| `vesselCertificates` | Requires `vesselId` argument (String!) | Make optional OR provide default [] |
| `VesselCertificate.name` | Field doesn't exist | Add `name` field to type |
| `Voyage.reference` | Field doesn't exist | Add `reference` field (String) |
| `Voyage.revenue` | Field doesn't exist | Add `revenue` field (Float) |

### 2. Knowledge Base / Documents
**Pages affected**: `/knowledge-base`, `/documents`

| Query/Field | Error | Fix Required |
|-------------|-------|--------------|
| `getFolderTree` | Query doesn't exist | Rename to `emailFolderTree` OR add alias |
| `documents(folderId)` | Unknown argument | Add `folderId` argument (String) |
| `Document.folderId` | Field doesn't exist | Add `folderId` field |
| `Document.fileHash` | Field doesn't exist | Add `fileHash` field |
| ✅ `INGEST_DOCUMENT` | Missing mutation | **FIXED** - Added to frontend |

### 3. S&P (Ship Sale & Purchase)
**Pages affected**: `/sale-listings`, `/snp-desk`, `/snp-deals`

| Query/Field | Error | Fix Required |
|-------------|-------|--------------|
| `snpOffers` | Requires `saleListingId` argument (String!) | Make optional OR provide all offers |
| `SNPListing.priceRange` | Has selection on scalar JSON type | Remove subfield selection |
| `SNPTransaction.vessel` | Field doesn't exist | Add `vessel` field (relation) |

### 4. HR/Payroll
**Pages affected**: `/attendance`, `/hr`

| Query/Field | Error | Fix Required |
|-------------|-------|--------------|
| `payrollSummary` | Unknown argument `month` | Add `month` argument (Int, optional) |
| `attendanceLogs` | Unknown arguments `month`, `year` | Add `month`, `year` arguments (optional) |

### 5. Finance
**Pages affected**: `/cash-to-master`, `/fx-dashboard`

| Query/Field | Error | Fix Required |
|-------------|-------|--------------|
| `cashFlowSummary` | Requires `year` argument (Int!) | Make optional with default current year |

### 6. Contract of Affreightment (COA)
**Pages affected**: `/coa`

| Query/Field | Error | Fix Required |
|-------------|-------|--------------|
| `ContractOfAffreightment.tolerancePercent` | Field doesn't exist | Add alias to `tolerance` |
| `ContractOfAffreightment.completedShipments` | Field doesn't exist | Add computed field |
| `ContractOfAffreightment.nominatedQuantity` | Field doesn't exist | Add alias to `nominatedQty` |
| `ContractOfAffreightment.shippedQuantity` | Field doesn't exist | Add alias to `shippedQty` |

### 7. Fleet Routes
**Pages affected**: `/fleet-routes`

| Query/Field | Error | Fix Required |
|-------------|-------|--------------|
| `fleetOnRoute` | Query doesn't exist | Add query OR remove from frontend |
| `activeVesselsOnRoutes` | Query doesn't exist | Add query OR remove from frontend |

### 8. Voyages
**Pages affected**: `/voyages`, `/da-desk`

| Query/Field | Error | Fix Required |
|-------------|-------|--------------|
| `voyages(status)` | Unknown argument | Add `status` argument (String) |

## Rate Limiting Issues

**HTTP 429** errors observed on multiple GraphQL requests
- Too many simultaneous queries from Dashboard
- **Fix**: Implement query batching or request debouncing
- **Fix**: Add cache-first policy for static data

## Prioritized Fix Order

### Phase 1: Critical (Unblock pages immediately)
1. ✅ Knowledge Base - `INGEST_DOCUMENT` mutation
2. Dashboard queries - make `vesselId` optional
3. Add missing Voyage fields (`reference`, `revenue`)
4. Fix Document queries (`getFolderTree`, `folderId`)

### Phase 2: High Priority (Major features broken)
5. S&P queries - make `saleListingId` optional
6. COA field aliases
7. HR/Payroll arguments

### Phase 3: Medium Priority (Nice to have)
8. Fleet Routes queries
9. Rate limiting / query optimization

## Backend Files to Modify

```
/root/apps/ankr-maritime/backend/src/schema/
├── queries/
│   ├── dashboard.queries.ts      # vesselPositions, vesselCertificates
│   ├── documents.queries.ts      # getFolderTree → emailFolderTree
│   ├── snp.queries.ts            # snpOffers, make saleListingId optional
│   ├── hr.queries.ts             # payrollSummary, attendanceLogs args
│   └── fleet.queries.ts          # fleetOnRoute, activeVesselsOnRoutes
├── types/
│   ├── voyage.ts                 # add reference, revenue fields
│   ├── certificate.ts            # add name field
│   ├── document.ts               # add folderId, fileHash fields
│   ├── coa.ts                    # add field aliases
│   └── snp.ts                    # add vessel to SNPTransaction
└── mutations/
    └── knowledge-base.mutations.ts # ingestDocument (if missing)
```

## Testing After Fixes

```bash
# Test each fixed query
curl -X POST http://localhost:4051/graphql \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0" \
  -d '{"query": "{ vesselPositions { id } }"}'

# Run all pages test
npx playwright test e2e/comprehensive/all-pages-load.spec.ts
```
