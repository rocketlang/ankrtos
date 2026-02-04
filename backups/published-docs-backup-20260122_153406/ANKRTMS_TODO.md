# WowTruck to ANKRTMS Migration - Action Plan

**Project:** Rename WowTruck TMS to ANKRTMS
**Date:** 2026-01-22
**Status:** Ready to Execute
**Backup:** `/root/backups/wowtruck-to-ankrtms-20260122_144935.tar.gz`

---

## Pre-Migration Checklist

- [x] **Backup Created**
  - Location: `/root/backups/wowtruck-to-ankrtms-20260122_144935/`
  - Archive: `wowtruck-to-ankrtms-20260122_144935.tar.gz` (16KB)
  - Contents: Config files, env files, critical code

- [ ] **Review Project Report**
  - File: `/root/WOWTRUCK-TO-ANKRTMS-MIGRATION-REPORT.md`
  - Understand scope: 6000+ file references
  - Review risks and mitigation strategies

- [ ] **Stop Services**
  ```bash
  ankr-ctl stop wowtruck-backend
  ankr-ctl status
  ```

- [ ] **Create Git Branch**
  ```bash
  cd /root/rocketlang/ankr-labs-nx
  git checkout -b feat/rename-wowtruck-to-ankrtms
  git add -A
  git commit -m "Pre-migration snapshot: WowTruck to ANKRTMS"
  ```

---

## Phase 1: Critical Infrastructure (Manual) - 45 mins

### Step 1.1: Update Port Configuration (5 mins)
- [ ] Edit `/root/.ankr/config/ports.json`
  ```json
  "frontend": {
    "wowtruck": 3000  →  "ankrtms": 3000
  },
  "backend": {
    "wowtruck": 4000  →  "ankrtms": 4000
  }
  ```

- [ ] Verify changes
  ```bash
  cat /root/.ankr/config/ports.json | grep -i ankrtms
  ```

### Step 1.2: Update Service Configuration (5 mins)
- [ ] Edit `/root/.ankr/config/services.json`
  - Change service name: `"wowtruck-backend"` → `"ankrtms-backend"`
  - Update path: `/apps/wowtruck/backend` → `/apps/ankrtms/backend`
  - Update description: `"WowTruck TMS Backend"` → `"ANKR TMS Backend"`

- [ ] Verify changes
  ```bash
  cat /root/.ankr/config/services.json | grep -i ankrtms
  ```

### Step 1.3: Update Environment Variables (10 mins)
- [ ] Edit `/root/.env`
  ```bash
  sed -i 's/WOWTRUCK_URL/ANKRTMS_URL/g' /root/.env
  sed -i 's/WOWTRUCK/ANKRTMS/g' /root/.env
  ```

- [ ] Edit `/root/.ankr/config/credentials.env`
  ```bash
  sed -i 's/WOWTRUCK/ANKRTMS/g' /root/.ankr/config/credentials.env
  ```

- [ ] Verify changes
  ```bash
  grep -i ankrtms /root/.env
  grep -i ankrtms /root/.ankr/config/credentials.env
  ```

### Step 1.4: Update Database Configuration (10 mins)
- [ ] Edit `/root/.ankr/config/databases.json`
  - Change database entry: `wowtruck` → `ankrtms`
  - Update connection string schema

- [ ] Backup database (if exists)
  ```bash
  pg_dump -U ankr wowtruck > /root/backups/wowtruck_db_backup_$(date +%Y%m%d_%H%M%S).sql
  ```

- [ ] Rename PostgreSQL schema
  ```bash
  psql -U ankr wowtruck -c "ALTER SCHEMA wowtruck RENAME TO ankrtms;"
  ```

- [ ] Verify schema rename
  ```bash
  psql -U ankr wowtruck -c "\dn" | grep ankrtms
  ```

### Step 1.5: Update ankr-ctl Script (5 mins)
- [ ] Edit `/root/ankr-ctl`
  - Update auto-injected environment variables
  - Change `WOWTRUCK_URL` → `ANKRTMS_URL`

- [ ] Verify changes
  ```bash
  grep -i ankrtms /root/ankr-ctl
  ```

### Step 1.6: Test Configuration (10 mins)
- [ ] Test ankr-ctl recognizes new service
  ```bash
  ankr-ctl ports | grep ankrtms
  ankr-ctl env | grep ANKRTMS
  ```

- [ ] Verify no "wowtruck" references in active config
  ```bash
  grep -i wowtruck /root/.ankr/config/*.json
  # Should return no results (or minimal)
  ```

---

## Phase 2: Source Code Migration (Automated) - 60 mins

### Step 2.1: Update Prisma Schemas (10 mins)
- [ ] Find all Prisma schema files
  ```bash
  find /root/rocketlang/ankr-labs-nx -name "schema.prisma" -not -path "*/node_modules/*"
  ```

- [ ] Update schema references
  ```bash
  find /root/rocketlang/ankr-labs-nx -name "schema.prisma" \
    -not -path "*/node_modules/*" \
    -exec sed -i 's/schema = "wowtruck"/schema = "ankrtms"/' {} +
  ```

- [ ] Regenerate Prisma client
  ```bash
  cd /root/rocketlang/ankr-labs-nx/apps/wowtruck/backend
  npx prisma generate
  ```

### Step 2.2: Update Package Names (15 mins)
- [ ] Update package.json files
  ```bash
  find /root/rocketlang/ankr-labs-nx -name "package.json" \
    -not -path "*/node_modules/*" \
    -not -path "*/backups/*" \
    -exec sed -i 's/"@wowtruck\//"@ankrtms\//g' {} +

  find /root/rocketlang/ankr-labs-nx -name "package.json" \
    -not -path "*/node_modules/*" \
    -not -path "*/backups/*" \
    -exec sed -i 's/"wowtruck"/"ankrtms"/g' {} +
  ```

- [ ] Verify package name changes
  ```bash
  grep -r "@ankrtms" /root/rocketlang/ankr-labs-nx --include="package.json" | head -10
  ```

### Step 2.3: Bulk TypeScript/JavaScript Rename (20 mins)
- [ ] Replace "wowtruck" (lowercase)
  ```bash
  find /root/rocketlang/ankr-labs-nx -type f \
    \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/dist/*" \
    -not -path "*/backups/*" \
    -exec sed -i 's/wowtruck/ankrtms/g' {} +
  ```

- [ ] Replace "WowTruck" (PascalCase)
  ```bash
  find /root/rocketlang/ankr-labs-nx -type f \
    \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/dist/*" \
    -not -path "*/backups/*" \
    -exec sed -i 's/WowTruck/AnkrTms/g' {} +
  ```

- [ ] Replace "WOWTRUCK" (UPPERCASE)
  ```bash
  find /root/rocketlang/ankr-labs-nx -type f \
    \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/dist/*" \
    -not -path "*/backups/*" \
    -exec sed -i 's/WOWTRUCK/ANKRTMS/g' {} +
  ```

- [ ] Verify changes
  ```bash
  grep -r "import.*ankrtms" /root/rocketlang/ankr-labs-nx --include="*.ts" | head -5
  ```

### Step 2.4: Update Configuration Files (10 mins)
- [ ] Update all .config.js and .config.ts files
  ```bash
  find /root/rocketlang/ankr-labs-nx -name "*.config.js" -o -name "*.config.ts" \
    -not -path "*/node_modules/*" | xargs sed -i 's/wowtruck/ankrtms/g'
  ```

- [ ] Update tsconfig.json files
  ```bash
  find /root/rocketlang/ankr-labs-nx -name "tsconfig.json" \
    -not -path "*/node_modules/*" \
    -exec sed -i 's/wowtruck/ankrtms/g' {} +
  ```

- [ ] Rename specific config file
  ```bash
  if [ -f "/root/ecosystem.wowtruck.config.js" ]; then
    mv /root/ecosystem.wowtruck.config.js /root/ecosystem.ankrtms.config.js
  fi
  ```

### Step 2.5: Update Documentation (5 mins)
- [ ] Update markdown files
  ```bash
  find /root/rocketlang/ankr-labs-nx -name "*.md" \
    -not -path "*/node_modules/*" \
    -not -path "*/backups/*" \
    -exec sed -i 's/WowTruck/ANKR TMS/g' {} +
  ```

- [ ] Update CLAUDE.md specifically
  ```bash
  sed -i 's/WowTruck/ANKR TMS/g' /root/rocketlang/ankr-labs-nx/CLAUDE.md
  sed -i 's/wowtruck/ankrtms/g' /root/rocketlang/ankr-labs-nx/CLAUDE.md
  ```

---

## Phase 3: Directory Structure Rename (Manual) - 30 mins

### Step 3.1: Rename Package Directories (15 mins)
- [ ] Rename theme package
  ```bash
  cd /root/rocketlang/ankr-labs-nx/packages
  mv wowtruck-theme ankrtms-theme
  ```

- [ ] Rename mobile app package
  ```bash
  mv wowtruck-mobile-app ankrtms-mobile-app
  ```

- [ ] Rename GPS standalone package
  ```bash
  mv wowtruck-gps-standalone ankrtms-gps-standalone
  ```

- [ ] Verify renames
  ```bash
  ls -la /root/rocketlang/ankr-labs-nx/packages | grep ankrtms
  ```

### Step 3.2: Rename Main App Directory (15 mins)
- [ ] Rename apps/wowtruck
  ```bash
  cd /root/rocketlang/ankr-labs-nx/apps
  mv wowtruck ankrtms
  ```

- [ ] Verify structure
  ```bash
  ls -la /root/rocketlang/ankr-labs-nx/apps/ankrtms
  ```

- [ ] Update nx.json references
  ```bash
  cd /root/rocketlang/ankr-labs-nx
  sed -i 's/apps\/wowtruck/apps\/ankrtms/g' nx.json
  sed -i 's/"wowtruck"/"ankrtms"/g' nx.json
  ```

- [ ] Update root package.json workspace references
  ```bash
  sed -i 's/apps\/wowtruck/apps\/ankrtms/g' package.json
  ```

---

## Phase 4: Rebuild & Verification - 60 mins

### Step 4.1: Clean Build Artifacts (10 mins)
- [ ] Remove cache directories
  ```bash
  cd /root/rocketlang/ankr-labs-nx
  rm -rf node_modules/.cache .nx/cache
  ```

- [ ] Remove dist directories
  ```bash
  find . -name "dist" -type d -not -path "*/node_modules/*" -exec rm -rf {} + 2>/dev/null || true
  ```

### Step 4.2: Reinstall Dependencies (15 mins)
- [ ] Remove node_modules and lockfile
  ```bash
  cd /root/rocketlang/ankr-labs-nx
  rm -rf node_modules pnpm-lock.yaml
  ```

- [ ] Reinstall (updates package references)
  ```bash
  pnpm install
  ```

- [ ] Verify @ankrtms packages are recognized
  ```bash
  pnpm list | grep @ankrtms
  ```

### Step 4.3: Regenerate Prisma Client (5 mins)
- [ ] Generate Prisma client with new schema
  ```bash
  cd /root/rocketlang/ankr-labs-nx/apps/ankrtms/backend
  npx prisma generate
  ```

- [ ] Verify generation
  ```bash
  ls -la node_modules/.prisma/client
  ```

### Step 4.4: Build Packages (20 mins)
- [ ] Build core packages
  ```bash
  cd /root/rocketlang/ankr-labs-nx
  npx nx build @ankrtms/core 2>&1 | tee /tmp/ankrtms-build.log
  ```

- [ ] Build backend
  ```bash
  npx nx build ankrtms-backend 2>&1 | tee -a /tmp/ankrtms-build.log
  ```

- [ ] Build frontend
  ```bash
  npx nx build ankrtms-frontend 2>&1 | tee -a /tmp/ankrtms-build.log
  ```

- [ ] Check for errors
  ```bash
  grep -i error /tmp/ankrtms-build.log
  ```

### Step 4.5: TypeScript Compilation Check (10 mins)
- [ ] Run TypeScript compiler
  ```bash
  cd /root/rocketlang/ankr-labs-nx
  npx tsc --noEmit 2>&1 | tee /tmp/ankrtms-tsc.log
  ```

- [ ] Review errors (if any)
  ```bash
  cat /tmp/ankrtms-tsc.log | grep "error TS"
  ```

---

## Phase 5: Service Restart & Testing - 45 mins

### Step 5.1: Start Services (10 mins)
- [ ] Start ANKRTMS backend
  ```bash
  ankr-ctl start ankrtms-backend
  ```

- [ ] Wait for startup
  ```bash
  sleep 10
  ```

- [ ] Check service status
  ```bash
  ankr-ctl status ankrtms-backend
  ```

### Step 5.2: Health Checks (15 mins)
- [ ] Test health endpoint
  ```bash
  curl -s http://localhost:4000/health
  ```

- [ ] Test GraphQL endpoint
  ```bash
  curl -s http://localhost:4000/graphql \
    -H "Content-Type: application/json" \
    -d '{"query": "{__typename}"}'
  ```

- [ ] Check logs for errors
  ```bash
  ankr-ctl logs ankrtms-backend | tail -50
  ```

### Step 5.3: Database Connectivity (10 mins)
- [ ] Test database connection
  ```bash
  psql -U ankr wowtruck -c "SELECT schemaname FROM pg_tables WHERE schemaname = 'ankrtms' LIMIT 5;"
  ```

- [ ] Verify row counts (should match pre-migration)
  ```bash
  psql -U ankr wowtruck -c "SELECT COUNT(*) FROM ankrtms.shipments;"
  # Compare with backup count
  ```

### Step 5.4: Frontend Testing (10 mins)
- [ ] Start frontend (if applicable)
  ```bash
  cd /root/rocketlang/ankr-labs-nx/apps/ankrtms/frontend
  npm run dev &
  ```

- [ ] Test frontend access
  ```bash
  curl -s http://localhost:3000/ | head -20
  ```

- [ ] Check browser console for errors
  - Open: http://localhost:3000
  - Check: DevTools console for import errors

---

## Phase 6: Post-Migration Verification - 30 mins

### Step 6.1: Code Quality Checks (10 mins)
- [ ] Search for remaining "wowtruck" references (should be minimal)
  ```bash
  grep -r "wowtruck" /root/rocketlang/ankr-labs-nx \
    --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
    --exclude-dir=node_modules --exclude-dir=backups --exclude-dir=dist \
    | wc -l
  # Should be 0 or very low
  ```

- [ ] Search for "WowTruck" references
  ```bash
  grep -r "WowTruck" /root/rocketlang/ankr-labs-nx \
    --include="*.ts" --include="*.tsx" \
    --exclude-dir=node_modules --exclude-dir=backups \
    | wc -l
  ```

- [ ] Check environment variable injection
  ```bash
  ankr-ctl env | grep -i truck
  # Should show ANKRTMS_URL, not WOWTRUCK_URL
  ```

### Step 6.2: Documentation Review (10 mins)
- [ ] Update CLAUDE.md
  - Replace WowTruck references with ANKR TMS
  - Update port configurations
  - Update example commands

- [ ] Update README files
  ```bash
  find /root/rocketlang/ankr-labs-nx/apps/ankrtms -name "README.md" \
    -exec sed -i 's/WowTruck/ANKR TMS/g' {} +
  ```

### Step 6.3: Git Commit (10 mins)
- [ ] Stage all changes
  ```bash
  cd /root/rocketlang/ankr-labs-nx
  git add -A
  ```

- [ ] Commit with detailed message
  ```bash
  git commit -m "feat: Rename WowTruck to ANKRTMS

  Major refactoring:
  - Renamed all wowtruck/WowTruck/WOWTRUCK references to ankrtms/AnkrTms/ANKRTMS
  - Updated database schema: wowtruck → ankrtms
  - Renamed directories: apps/wowtruck → apps/ankrtms
  - Updated package names: @wowtruck/* → @ankrtms/*
  - Updated configuration files (ports.json, services.json)
  - Updated environment variables: WOWTRUCK_URL → ANKRTMS_URL
  - Regenerated Prisma client
  - Rebuilt all packages

  Scope: 6000+ file references updated
  Backup: /root/backups/wowtruck-to-ankrtms-20260122_144935.tar.gz

  Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
  ```

- [ ] Verify commit
  ```bash
  git log -1 --stat
  ```

---

## Success Criteria

- [x] Backup created and verified
- [ ] All configuration files updated (ports, services, databases)
- [ ] Database schema renamed successfully
- [ ] Source code references updated (6000+ files)
- [ ] Directory structure renamed
- [ ] Packages rebuilt without errors
- [ ] Services start successfully
- [ ] Health endpoints respond
- [ ] GraphQL endpoints functional
- [ ] No TypeScript compilation errors
- [ ] No "wowtruck" references in active code (excluding backups)
- [ ] Git changes committed
- [ ] Documentation updated

---

## Rollback Instructions (If Needed)

### Quick Rollback
```bash
# 1. Stop services
ankr-ctl stop ankrtms-backend

# 2. Restore from backup
cd /root/backups
tar -xzf wowtruck-to-ankrtms-20260122_144935.tar.gz
cp -r wowtruck-to-ankrtms-20260122_144935/config/* /root/.ankr/config/

# 3. Revert Git changes
cd /root/rocketlang/ankr-labs-nx
git reset --hard HEAD~1

# 4. Restore database schema
psql -U ankr wowtruck -c "ALTER SCHEMA ankrtms RENAME TO wowtruck;"

# 5. Restart services
ankr-ctl restart wowtruck-backend
```

---

## Notes

- **Estimated Total Time:** 4-6 hours
- **Backup Location:** `/root/backups/wowtruck-to-ankrtms-20260122_144935/`
- **Archive:** `wowtruck-to-ankrtms-20260122_144935.tar.gz` (16KB)
- **Log Files:** `/tmp/ankrtms-*.log`
- **Branch:** `feat/rename-wowtruck-to-ankrtms`

---

## Next Actions After Completion

1. **Notify Team** - Inform team of successful migration
2. **Update External Docs** - API documentation, partner integrations
3. **Monitor Services** - Watch logs for 24-48 hours
4. **Update CI/CD** - If pipelines reference "wowtruck"
5. **Clean Up Backups** - Archive old wowtruck backups after 1 week
6. **Performance Testing** - Ensure no performance degradation

---

**Last Updated:** 2026-01-22
**Status:** Ready for Execution ✅
