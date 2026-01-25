# WowTruck to ANKRTMS Migration Project Report

**Date:** 2026-01-22
**Author:** ANKR Labs
**Status:** Planning Phase
**Estimated Scope:** 6000+ file references

---

## Executive Summary

This project involves renaming the "WowTruck" TMS (Transport Management System) to "ANKRTMS" across the entire ANKR Labs ecosystem. This is a large-scale refactoring affecting configuration files, source code, databases, package names, and documentation.

**Impact Level:** HIGH
**Risk Level:** MEDIUM
**Estimated Effort:** 4-6 hours with automation

---

## Current State Analysis

### Discovery Results
- **Total Files with "wowtruck":** 674 files (case-insensitive)
- **Total Files with "WowTruck":** 463 files
- **Total Files with "WOWTRUCK":** 75 files
- **Source Code References:** ~6026 occurrences in TypeScript/JavaScript files

### Key Affected Areas

#### 1. Configuration Files
```
/root/.ankr/config/ports.json
  - frontend.wowtruck: 3000
  - backend.wowtruck: 4000

/root/.ankr/config/services.json
  - Service: "wowtruck-backend"
  - Database: "wowtruck" schema
```

#### 2. Directory Structure
```
/root/rocketlang/ankr-labs-nx/apps/wowtruck/
  ├── backend/
  ├── frontend/
  └── driver-app/

/root/rocketlang/ankr-labs-nx/packages/
  ├── wowtruck-theme/
  ├── wowtruck-mobile-app/
  └── wowtruck-gps-standalone/
```

#### 3. Database Schema
- **Database Name:** `wowtruck` (port 5432)
- **Schema Name:** `wowtruck`
- **Tables:** 182 tables
- **Connection String:** `postgresql://ankr:indrA@0612@localhost:5432/wowtruck?schema=wowtruck`

#### 4. Package Ecosystem
- Package names: `@wowtruck/*` packages
- Import statements across 100+ packages
- Dependencies in package.json files

#### 5. Environment Variables
- `WOWTRUCK_URL=http://localhost:4000`
- Auto-injected via ankr-ctl to all services
- Referenced in ~75 files

#### 6. Branding & UI
- Company name: "WowTruck"
- Product name: "Saathi"
- Theme packages
- Logo and asset references

---

## Scope of Changes

### Phase 1: Critical Infrastructure (Manual)

#### A. Configuration Files
**Priority: CRITICAL**

1. `/root/.ankr/config/ports.json`
   ```json
   "frontend": {
     "wowtruck": 3000 → "ankrtms": 3000
   },
   "backend": {
     "wowtruck": 4000 → "ankrtms": 4000
   }
   ```

2. `/root/.ankr/config/services.json`
   ```json
   "wowtruck-backend" → "ankrtms-backend"
   "path": "/root/ankr-labs-nx/apps/wowtruck/backend" → "apps/ankrtms/backend"
   ```

3. `/root/.ankr/config/databases.json`
   ```json
   Database name: wowtruck → ankrtms
   Schema: wowtruck → ankrtms
   ```

#### B. Environment Variables
**Files to update:**
- `/root/.env`
- `/root/.ankr/config/credentials.env`
- All service-specific `.env` files

**Changes:**
- `WOWTRUCK_URL` → `ANKRTMS_URL`
- `WOWTRUCK_BACKEND_PORT` → `ANKRTMS_BACKEND_PORT`
- `WOWTRUCK_DB` → `ANKRTMS_DB`

#### C. Database Migration
**Priority: CRITICAL**

**Option 1: Schema Rename (Recommended)**
```sql
-- Rename schema only (keeps data, fast)
ALTER SCHEMA wowtruck RENAME TO ankrtms;

-- Update connection strings
-- From: postgresql://localhost:5432/wowtruck?schema=wowtruck
-- To:   postgresql://localhost:5432/wowtruck?schema=ankrtms
```

**Option 2: Full Database Rename**
```sql
-- Create new database
CREATE DATABASE ankrtms;

-- Dump and restore
pg_dump -U ankr wowtruck > /tmp/wowtruck_backup.sql
psql -U ankr ankrtms < /tmp/wowtruck_backup.sql

-- Update all connection strings
-- From: postgresql://localhost:5432/wowtruck
-- To:   postgresql://localhost:5432/ankrtms
```

**Recommendation:** Option 1 (schema rename) for safety and speed

---

### Phase 2: Source Code (Automated)

#### A. Package Names
**Files:** All `package.json` files

**Pattern:**
```json
{
  "name": "@wowtruck/backend" → "@ankrtms/backend",
  "dependencies": {
    "@wowtruck/core" → "@ankrtms/core"
  }
}
```

**Count:** ~20 package.json files in main codebase

#### B. TypeScript/JavaScript Files
**Files:** ~6026 references across:
- `*.ts`, `*.tsx`
- `*.js`, `*.jsx`
- Excluding `node_modules/`, `dist/`, backups

**Patterns to Replace:**
1. `wowtruck` → `ankrtms`
2. `WowTruck` → `AnkrTms`
3. `WOWTRUCK` → `ANKRTMS`

**Key Files:**
- `/root/rocketlang/ankr-labs-nx/packages/ankr-interact/src/config/features.ts`
- `/root/rocketlang/ankr-labs-nx/packages/saathi-core/src/config/branding.ts`
- `/root/rocketlang/ankr-labs-nx/apps/ankr-crm/backend/src/integrations/wowtruck.client.ts`
- All import statements

#### C. Configuration Files
**Files:** `*.config.js`, `*.config.ts`, `tsconfig.json`

**Examples:**
- `ecosystem.wowtruck.config.js`
- Vite/Webpack configs with wowtruck references

#### D. Documentation
**Files:** `*.md` files

**Count:** ~150 markdown files

**Changes:**
- Product name: "WowTruck" → "ANKR TMS"
- References in architecture docs
- API documentation
- README files

---

### Phase 3: Directory Structure (Automated)

#### Directory Renames
**Priority: HIGH**

```bash
# Main app directory
/root/rocketlang/ankr-labs-nx/apps/wowtruck/
  → /root/rocketlang/ankr-labs-nx/apps/ankrtms/

# Package directories
/packages/wowtruck-theme/ → /packages/ankrtms-theme/
/packages/wowtruck-mobile-app/ → /packages/ankrtms-mobile-app/
/packages/wowtruck-gps-standalone/ → /packages/ankrtms-gps-standalone/
```

**Script Pattern:**
```bash
find . -depth -type d -name "*wowtruck*" \
  -execdir rename 's/wowtruck/ankrtms/' {} +
```

---

## Migration Strategy

### Pre-Migration Checklist

- [ ] **Backup Creation**
  - Full database dump: `pg_dump wowtruck > backup.sql`
  - Codebase archive: `tar -czf wowtruck-backup-$(date +%Y%m%d).tar.gz`
  - Config files: `/root/.ankr/config/`
  - Environment files: All `.env` files

- [ ] **Service Shutdown**
  - Stop all WowTruck services: `ankr-ctl stop wowtruck-backend`
  - Verify no active connections: `ankr-ctl status`
  - Close database connections

- [ ] **Git Preparation**
  - Create branch: `git checkout -b feat/rename-wowtruck-to-ankrtms`
  - Commit current state: `git add -A && git commit -m "Pre-migration snapshot"`

### Migration Execution Plan

#### Step 1: Manual Configuration (30 mins)
```bash
# 1. Update ports.json
vim /root/.ankr/config/ports.json
# Change: wowtruck → ankrtms

# 2. Update services.json
vim /root/.ankr/config/services.json
# Change: wowtruck-backend → ankrtms-backend

# 3. Update environment variables
sed -i 's/WOWTRUCK/ANKRTMS/g' /root/.env
sed -i 's/WOWTRUCK/ANKRTMS/g' /root/.ankr/config/credentials.env
```

#### Step 2: Database Migration (15 mins)
```bash
# 1. Backup database
pg_dump -U ankr wowtruck > /tmp/wowtruck_backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Rename schema
psql -U ankr wowtruck -c "ALTER SCHEMA wowtruck RENAME TO ankrtms;"

# 3. Update Prisma schema
find . -name "schema.prisma" -exec sed -i 's/schema = "wowtruck"/schema = "ankrtms"/' {} +

# 4. Regenerate Prisma client
npx prisma generate --schema=apps/ankrtms/backend/prisma/schema.prisma
```

#### Step 3: Bulk Source Code Rename (45 mins)
```bash
# 1. TypeScript/JavaScript files
find /root/rocketlang/ankr-labs-nx -type f \
  \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/dist/*" \
  -not -path "*/backups/*" \
  -exec sed -i 's/wowtruck/ankrtms/g' {} +

# 2. Case variations
find ... -exec sed -i 's/WowTruck/AnkrTms/g' {} +
find ... -exec sed -i 's/WOWTRUCK/ANKRTMS/g' {} +

# 3. JSON files (package.json, tsconfig.json, etc.)
find . -name "*.json" -not -path "*/node_modules/*" \
  -exec sed -i 's/wowtruck/ankrtms/g' {} +

# 4. Markdown documentation
find . -name "*.md" -exec sed -i 's/WowTruck/ANKR TMS/g' {} +
```

#### Step 4: Directory Renames (20 mins)
```bash
# Rename directories (bottom-up to avoid path issues)
cd /root/rocketlang/ankr-labs-nx

# Packages
mv packages/wowtruck-theme packages/ankrtms-theme
mv packages/wowtruck-mobile-app packages/ankrtms-mobile-app
mv packages/wowtruck-gps-standalone packages/ankrtms-gps-standalone

# Main app
mv apps/wowtruck apps/ankrtms

# Update nx.json and workspace references
sed -i 's/wowtruck/ankrtms/g' nx.json
sed -i 's/wowtruck/ankrtms/g' package.json
```

#### Step 5: Rebuild & Test (60 mins)
```bash
# 1. Clean build artifacts
rm -rf node_modules/.cache .nx/cache
find . -name "dist" -type d -not -path "*/node_modules/*" -exec rm -rf {} +

# 2. Reinstall dependencies (updates lockfile with new package names)
pnpm install

# 3. Regenerate Prisma client
npx prisma generate --schema=apps/ankrtms/backend/prisma/schema.prisma

# 4. Build packages
npx nx run-many --target=build --projects=@ankrtms/core,@ankrtms/api --parallel=3

# 5. Start services
ankr-ctl start ankrtms-backend

# 6. Health check
ankr-ctl health
curl http://localhost:4000/health
```

---

## Risk Analysis & Mitigation

### High Risk Areas

#### 1. Database Schema Rename
**Risk:** Active connections break, data corruption
**Mitigation:**
- Stop all services first
- Create full database backup
- Use transaction: `BEGIN; ALTER SCHEMA...; COMMIT;`
- Test connection before proceeding

#### 2. Package Name Changes
**Risk:** Import paths break, circular dependencies
**Mitigation:**
- Update all package.json files atomically
- Run `pnpm install` to update lockfile
- Use Nx graph to verify dependencies: `npx nx graph`

#### 3. Environment Variable Injection
**Risk:** Services fail to start with undefined variables
**Mitigation:**
- Update ankr-ctl's auto-inject list
- Verify with: `ankr-ctl env`
- Manual override in each service's .env if needed

#### 4. Import Statement Breakage
**Risk:** TypeScript compilation fails
**Mitigation:**
- Use regex pattern matching for bulk replace
- Run TypeScript compiler after: `npx tsc --noEmit`
- Fix remaining errors manually

### Medium Risk Areas

#### 5. Directory Renames
**Risk:** Git tracking issues, broken symlinks
**Mitigation:**
- Use `git mv` instead of `mv` where possible
- Update all path references in config files
- Verify with: `find . -type l -xtype l` (broken symlinks)

#### 6. Documentation Staleness
**Risk:** Docs reference old "WowTruck" name
**Mitigation:**
- Comprehensive grep for all variations
- Update README files
- Search for logo/brand asset references

### Low Risk Areas

#### 7. Third-party Integrations
**Risk:** External systems still reference "WowTruck"
**Mitigation:**
- Alias support: Keep WOWTRUCK_URL as fallback
- Update API documentation
- Notify external partners

---

## Rollback Plan

### If Migration Fails

#### Database Rollback
```bash
# 1. Drop new schema
psql -U ankr wowtruck -c "DROP SCHEMA IF EXISTS ankrtms CASCADE;"

# 2. Restore from backup
psql -U ankr wowtruck < /tmp/wowtruck_backup.sql

# 3. Verify data integrity
psql -U ankr wowtruck -c "SELECT COUNT(*) FROM wowtruck.shipments;"
```

#### Code Rollback
```bash
# 1. Revert Git changes
git reset --hard HEAD~1

# 2. Restore from backup
tar -xzf wowtruck-backup-20260122.tar.gz

# 3. Reinstall dependencies
pnpm install

# 4. Restart services
ankr-ctl restart wowtruck-backend
```

#### Config Rollback
```bash
# Restore config files
cp /root/backups/ankr-config-backup/* /root/.ankr/config/

# Restart ankr-ctl
pkill -f ankr-ctl
./ankr-ctl status
```

---

## Post-Migration Verification

### Checklist

- [ ] **Database**
  - [ ] Schema renamed: `\dn` shows `ankrtms`
  - [ ] All tables accessible
  - [ ] Row counts match pre-migration
  - [ ] Prisma client generates successfully

- [ ] **Services**
  - [ ] ankrtms-backend starts: `ankr-ctl status`
  - [ ] Health endpoint responds: `curl localhost:4000/health`
  - [ ] GraphQL playground accessible: `http://localhost:4000/graphql`
  - [ ] WebSocket connections work

- [ ] **Frontend**
  - [ ] ankrtms-frontend builds: `npx nx build ankrtms-frontend`
  - [ ] Connects to backend
  - [ ] API calls succeed
  - [ ] No console errors

- [ ] **Packages**
  - [ ] All @ankrtms/* packages build
  - [ ] No import errors
  - [ ] TypeScript compilation passes
  - [ ] Tests pass: `npx nx test ankrtms-backend`

- [ ] **Documentation**
  - [ ] No "WowTruck" references in docs
  - [ ] README updated
  - [ ] API docs updated
  - [ ] CLAUDE.md updated

- [ ] **Git**
  - [ ] Changes committed
  - [ ] Branch pushed
  - [ ] CI/CD passes (if applicable)

---

## Timeline Estimate

| Phase | Task | Time | Dependencies |
|-------|------|------|--------------|
| **Prep** | Create backups | 15 min | - |
| **Prep** | Stop services | 5 min | Backups complete |
| **Phase 1** | Update config files | 30 min | Services stopped |
| **Phase 1** | Database migration | 15 min | Config updated |
| **Phase 2** | Bulk code rename | 45 min | DB migrated |
| **Phase 3** | Directory renames | 20 min | Code renamed |
| **Phase 4** | Rebuild & install | 30 min | Directories renamed |
| **Phase 5** | Testing & verification | 60 min | Rebuild complete |
| **Total** | **End-to-end** | **3.5-4 hours** | - |

**Buffer for issues:** +2 hours
**Total estimated time:** 4-6 hours

---

## Success Criteria

1. ✅ All services start successfully with new names
2. ✅ Database schema renamed, data intact
3. ✅ Zero import errors in TypeScript compilation
4. ✅ All tests pass
5. ✅ Frontend connects to backend
6. ✅ No "wowtruck" references in active codebase (excluding backups/logs)
7. ✅ Documentation updated
8. ✅ ankr-ctl recognizes new service names

---

## Next Steps

1. **Review this report** - Stakeholder approval
2. **Schedule migration window** - Low-traffic period
3. **Create backup** - Full system backup
4. **Execute migration** - Follow step-by-step plan
5. **Verify & test** - Run post-migration checklist
6. **Update external docs** - API docs, partner notifications
7. **Monitor** - Watch logs for 24-48 hours

---

## Notes

- **Preserve Git History:** Use `git mv` for directory renames
- **Backup Everything:** Better safe than sorry
- **Test Incrementally:** Don't run all steps at once
- **Document Issues:** Keep log of problems encountered
- **Communication:** Notify team before, during, and after migration

---

## Contact

**Project Owner:** ANKR Labs
**Technical Lead:** ANKR Engineering
**Backup Location:** `/root/backups/wowtruck-to-ankrtms/`
**Report Generated:** 2026-01-22

---

**Status:** ✅ Ready for execution pending backup creation
