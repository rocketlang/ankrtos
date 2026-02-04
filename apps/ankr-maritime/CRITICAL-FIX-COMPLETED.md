# ✅ COMPLETED: Database Connection Pooling Fixed

**Status**: ✅ FIXED - February 1, 2026
**Solution**: PgBouncer 1.25.1 installed and configured
**Result**: Connection pool reduced from 97+ to 20-25 connections
**See**: `PGBOUNCER-FIXED.md` for complete details

---

# Original Issue: Database Connection Pooling

**Priority**: HIGH (WAS)
**Impact**: Blocking background scrapers and multiple concurrent operations (RESOLVED)

---

## 🔴 Problem

PostgreSQL connection pool exhaustion occurs frequently:
```
FATAL: remaining connection slots are reserved for roles with the SUPERUSER attribute
```

**Affected Operations**:
- Background scrapers
- Multiple concurrent scripts
- High-traffic scenarios
- Statistics queries

---

## 🔍 Root Cause

Prisma Client is not properly releasing connections. Default PostgreSQL `max_connections = 100`, and the `ankr` user is creating 90+ idle connections that never get released.

---

## ✅ Permanent Solution

### 1. Configure Prisma Connection Pool

Edit `/backend/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")

  // Add connection pooling settings
  connectionLimit = 10
  poolTimeout     = 30
}
```

Or set in DATABASE_URL:
```
DATABASE_URL="postgresql://ankr:password@localhost:5432/mari8x?connection_limit=10&pool_timeout=30"
```

### 2. Use PgBouncer (Recommended)

Install PgBouncer as connection pooler:

```bash
sudo apt-get install pgbouncer
```

Configure `/etc/pgbouncer/pgbouncer.ini`:
```ini
[databases]
mari8x = host=localhost port=5432 dbname=mari8x

[pgbouncer]
listen_addr = 127.0.0.1
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
reserve_pool_size = 5
reserve_pool_timeout = 3
```

Create `/etc/pgbouncer/userlist.txt`:
```
"ankr" "md5<hashed_password>"
```

Update DATABASE_URL to use PgBouncer:
```
DATABASE_URL="postgresql://ankr:password@localhost:6432/mari8x"
```

Start PgBouncer:
```bash
sudo systemctl enable pgbouncer
sudo systemctl start pgbouncer
```

### 3. Increase PostgreSQL max_connections

Edit `/etc/postgresql/*/main/postgresql.conf`:
```
max_connections = 200  # Increase from 100
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

### 4. Proper Connection Management in Code

Always use single Prisma Client instance (already doing this):
```typescript
// Good: lib/prisma.ts exports singleton
export const prisma = new PrismaClient();

// Always disconnect in scripts:
await prisma.$disconnect();
```

For long-running processes, use transactions:
```typescript
await prisma.$transaction(async (tx) => {
  // All operations use same connection
  const port = await tx.port.findFirst(...);
  await tx.portTariff.create(...);
});
```

---

## 🚑 Quick Fix (Temporary)

When you hit connection errors, kill idle connections:

```bash
sudo -u postgres psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE usename = 'ankr' AND state = 'idle';"
```

Or create an alias:
```bash
alias kill-db-idle="sudo -u postgres psql -c \"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE usename = 'ankr' AND state = 'idle';\""
```

---

## 📊 Monitor Connections

Check current connections:
```bash
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity WHERE usename = 'ankr';"
```

View connection details:
```bash
sudo -u postgres psql -c "SELECT pid, usename, application_name, client_addr, state, state_change FROM pg_stat_activity WHERE usename = 'ankr';"
```

---

## 🎯 Implementation Priority

**Week 1**:
- [ ] Install and configure PgBouncer
- [ ] Update DATABASE_URL to use PgBouncer
- [ ] Test all scrapers with PgBouncer
- [ ] Monitor connection usage

**Optional** (if PgBouncer doesn't solve it):
- [ ] Increase max_connections to 200
- [ ] Add explicit connection limits in Prisma schema

---

## 📈 Expected Results

After implementing PgBouncer:
- ✅ No more connection exhaustion errors
- ✅ Background scrapers run smoothly
- ✅ Can run multiple scripts concurrently
- ✅ Better performance under load
- ✅ Connection reuse across requests

---

## 🔗 References

- [Prisma Connection Management](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
- [PgBouncer Documentation](https://www.pgbouncer.org/usage.html)
- [PostgreSQL Connection Pooling](https://www.postgresql.org/docs/current/runtime-config-connection.html)

---

**Status**: Documented
**Assigned To**: DevOps / Backend Team
**Estimated Time**: 2-3 hours for PgBouncer setup
