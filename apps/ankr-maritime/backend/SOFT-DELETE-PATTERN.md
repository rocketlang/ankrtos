# Soft Delete Pattern - Implementation Guide

**Status:** Helper functions created, pattern documented
**Migration:** Phase 2 completion migration includes soft delete utilities
**Next Step:** Add `deletedAt` field to models as needed

---

## Overview

The soft delete pattern allows "deleting" records without permanently removing them from the database. Instead, records are marked with a `deletedAt` timestamp and excluded from normal queries.

**Benefits:**
- Data recovery capability
- Audit trail preservation
- Compliance with data retention regulations
- Cascade deletion without data loss

---

## Pattern Implementation

### 1. Add deletedAt Field to Models

```prisma
model Vessel {
  id        String    @id @default(cuid())
  name      String
  imo       String    @unique
  // ... other fields

  deletedAt DateTime? // Soft delete timestamp
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([deletedAt]) // For efficient filtering
  @@map("vessels")
}
```

### 2. Update Queries to Filter Deleted Records

```typescript
// Exclude soft-deleted records
const activeVessels = await prisma.vessel.findMany({
  where: {
    deletedAt: null, // Only active records
  },
});

// Include soft-deleted records (admin view)
const allVessels = await prisma.vessel.findMany({
  // No deletedAt filter
});

// Only deleted records (restore UI)
const deletedVessels = await prisma.vessel.findMany({
  where: {
    deletedAt: { not: null },
  },
});
```

### 3. Soft Delete Operation

```typescript
// Soft delete
await prisma.vessel.update({
  where: { id: vesselId },
  data: { deletedAt: new Date() },
});

// Or use helper function (created in migration)
await prisma.$executeRaw`SELECT soft_delete_cascade('vessels', ${vesselId})`;
```

### 4. Restore Operation

```typescript
// Restore soft-deleted record
await prisma.vessel.update({
  where: { id: vesselId },
  data: { deletedAt: null },
});

// Or use helper function
await prisma.$executeRaw`SELECT restore_deleted('vessels', ${vesselId})`;
```

### 5. Permanent Deletion (Purge)

```typescript
// Purge records deleted > 90 days ago
const purgedCount = await prisma.$executeRaw`
  SELECT purge_deleted_records('vessels', 90)
`;
```

---

## Helper Functions (Created in Migration)

### soft_delete_cascade(table_name, record_id)
Soft deletes a record by setting `deletedAt` to current timestamp.

```sql
SELECT soft_delete_cascade('vessels', 'vessel-id-123');
```

### restore_deleted(table_name, record_id)
Restores a soft-deleted record by setting `deletedAt` to NULL.

```sql
SELECT restore_deleted('vessels', 'vessel-id-123');
```

### purge_deleted_records(table_name, retention_days)
Permanently deletes soft-deleted records older than retention period.

```sql
-- Purge vessels deleted > 90 days ago
SELECT purge_deleted_records('vessels', 90);
```

**Returns:** Count of permanently deleted records

---

## GraphQL Integration

### Query Resolver with Soft Delete Filter

```typescript
builder.queryFields((t) => ({
  vessels: t.prismaField({
    type: ['Vessel'],
    args: {
      includeDeleted: t.arg.boolean({ defaultValue: false }),
    },
    resolve: async (query, root, args, ctx) => {
      return ctx.prisma.vessel.findMany({
        ...query,
        where: {
          organizationId: ctx.user.organizationId,
          deletedAt: args.includeDeleted ? undefined : null,
        },
      });
    },
  }),
}));
```

### Soft Delete Mutation

```typescript
builder.mutationFields((t) => ({
  deleteVessel: t.prismaField({
    type: 'Vessel',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, root, args, ctx) => {
      return ctx.prisma.vessel.update({
        ...query,
        where: { id: args.id },
        data: { deletedAt: new Date() },
      });
    },
  }),

  restoreVessel: t.prismaField({
    type: 'Vessel',
    args: {
      id: t.arg.string({ required: true }),
    },
    authScopes: { admin: true }, // Only admins can restore
    resolve: async (query, root, args, ctx) => {
      return ctx.prisma.vessel.update({
        ...query,
        where: { id: args.id },
        data: { deletedAt: null },
      });
    },
  }),
}));
```

---

## Prisma Middleware (Global Soft Delete)

For automatic soft delete filtering across all queries:

```typescript
// src/lib/prisma-middleware.ts
import { Prisma } from '@prisma/client';

export function softDeleteMiddleware(): Prisma.Middleware {
  return async (params, next) => {
    // Skip if includeDeleted is explicitly set
    if (params.args?.includeDeleted) {
      delete params.args.includeDeleted;
      return next(params);
    }

    // Add deletedAt: null filter to findMany, findFirst, count, etc.
    if (params.action === 'findMany' || params.action === 'findFirst') {
      params.args = params.args || {};
      params.args.where = params.args.where || {};

      if (!params.args.where.deletedAt) {
        params.args.where.deletedAt = null;
      }
    }

    // Convert delete to soft delete (update deletedAt)
    if (params.action === 'delete') {
      params.action = 'update';
      params.args.data = { deletedAt: new Date() };
    }

    // Convert deleteMany to soft delete many
    if (params.action === 'deleteMany') {
      params.action = 'updateMany';
      if (params.args.data) {
        params.args.data.deletedAt = new Date();
      } else {
        params.args.data = { deletedAt: new Date() };
      }
    }

    return next(params);
  };
}

// Apply middleware
prisma.$use(softDeleteMiddleware());
```

---

## Models to Add deletedAt Field

### High Priority (Core Entities)
- [x] Helper functions created
- [ ] Vessel
- [ ] Company
- [ ] Contact
- [ ] Charter
- [ ] Voyage
- [ ] CargoEnquiry
- [ ] Invoice
- [ ] Document

### Medium Priority (Operational Data)
- [ ] PortCall
- [ ] Milestone
- [ ] BunkerPurchase
- [ ] Crew
- [ ] Contract
- [ ] Claim

### Low Priority (Reference Data - Usually Not Deleted)
- Port (rarely deleted)
- Terminal (rarely deleted)
- CargoType (rarely deleted)

### Never Delete (Time-Series Data)
- ❌ VesselPosition (use retention policies instead)
- ❌ PortCongestion (use retention policies instead)
- ❌ MarketRate (use retention policies instead)

---

## Automated Purge Schedule

Create a cron job to purge old soft-deleted records:

```typescript
// src/jobs/purge-deleted-records.ts
import cron from 'node-cron';
import { prisma } from '../lib/prisma.js';

// Run daily at 3 AM
cron.schedule('0 3 * * *', async () => {
  console.log('Running soft delete purge...');

  const tables = [
    'vessels',
    'companies',
    'contacts',
    'charters',
    'voyages',
    'invoices',
    'documents',
  ];

  for (const table of tables) {
    const count = await prisma.$executeRawUnsafe(
      `SELECT purge_deleted_records('${table}', 90)`
    );
    console.log(`Purged ${count} records from ${table}`);
  }

  console.log('Purge complete');
});
```

---

## Testing Soft Delete

```typescript
// test/soft-delete.test.ts
import { describe, it, expect } from 'vitest';
import { prisma } from '../src/lib/prisma.js';

describe('Soft Delete Pattern', () => {
  it('should soft delete a vessel', async () => {
    const vessel = await prisma.vessel.create({
      data: { name: 'Test Vessel', imo: '9999999' },
    });

    // Soft delete
    await prisma.vessel.update({
      where: { id: vessel.id },
      data: { deletedAt: new Date() },
    });

    // Should not appear in normal queries
    const active = await prisma.vessel.findMany({
      where: { deletedAt: null },
    });
    expect(active.find(v => v.id === vessel.id)).toBeUndefined();

    // Should appear when including deleted
    const all = await prisma.vessel.findMany();
    expect(all.find(v => v.id === vessel.id)).toBeDefined();
  });

  it('should restore a soft-deleted vessel', async () => {
    const vessel = await prisma.vessel.create({
      data: { name: 'Test Vessel', imo: '9999999', deletedAt: new Date() },
    });

    // Restore
    await prisma.vessel.update({
      where: { id: vessel.id },
      data: { deletedAt: null },
    });

    // Should appear in normal queries
    const active = await prisma.vessel.findMany({
      where: { deletedAt: null },
    });
    expect(active.find(v => v.id === vessel.id)).toBeDefined();
  });
});
```

---

## Performance Considerations

### Index deletedAt Column
Always add an index on `deletedAt` for efficient filtering:

```prisma
@@index([deletedAt])
@@index([organizationId, deletedAt]) // Composite for tenant queries
```

### Query Performance
- Soft delete queries are slightly slower due to additional WHERE clause
- Index on `deletedAt` minimizes performance impact
- For very large tables (millions of records), consider partitioning

### Storage Considerations
- Soft-deleted records consume storage
- Implement purge schedule to remove old deleted records
- Monitor table sizes and adjust retention periods

---

## Compliance & Regulatory

### GDPR Right to be Forgotten
For GDPR compliance, implement **hard delete** for user data:

```typescript
async function gdprDelete(userId: string) {
  // First soft delete to preserve audit trail temporarily
  await prisma.user.update({
    where: { id: userId },
    data: { deletedAt: new Date() },
  });

  // After 30-day verification period, hard delete
  // (scheduled job)
  await prisma.user.delete({
    where: { id: userId },
  });
}
```

### SOX Compliance
For SOX compliance, **never hard delete** financial records:
- Invoices
- Payments
- Commission
- Charters (contracts)

Always use soft delete for financial audit trail.

---

## Implementation Checklist

- [x] Create soft delete helper functions (migration)
- [x] Document soft delete pattern
- [ ] Add deletedAt to core models (Vessel, Company, Contact, etc.)
- [ ] Update GraphQL resolvers to filter deleted records
- [ ] Implement Prisma middleware for automatic filtering
- [ ] Add restore mutation (admin only)
- [ ] Create purge cron job
- [ ] Add frontend UI for deleted records (admin)
- [ ] Add tests for soft delete operations
- [ ] Document retention policies by model type

---

## Summary

**Phase 2 Task 3 Status:** ✅ Complete
- Helper functions created in database
- Pattern documented and ready for implementation
- GraphQL integration examples provided
- Testing strategy defined

**Next Step:** Add `deletedAt` field to models as needed during feature development.

---

*Pattern implemented: February 1, 2026*
*Helper functions: soft_delete_cascade, restore_deleted, purge_deleted_records*
