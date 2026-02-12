<!--
Published by ANKR COMPASS
Type: todo
Source: /root/COMPASS_TODO.md
Published: 2026-02-12 14:53:13
Tool: compass publish todo
-->

# ANKR COMPASS - Implementation TODO

**Project**: COMPASS (Control & Orchestration Management Platform for ANKR System Services)
**Status**: Planning Complete - Ready for Implementation
**Timeline**: 6 weeks (MVP in 2 weeks)

---

## Phase 1: MVP (Week 1-2) - Critical Pain Points

### Week 1: Setup + Service + Provider Management

#### Day 1-2: Project Setup ⚙️
- [ ] Create package directory: `ankr-labs-nx/packages/@ankr/compass/`
- [ ] Initialize package.json with dependencies (Commander, execa, chalk, ora, inquirer, zod)
- [ ] Setup tsconfig.json (ES modules, strict mode)
- [ ] Configure tsup build (dual CJS/ESM output)
- [ ] Create bin/compass.js shebang executable
- [ ] Setup git ignore for dist/ and node_modules/
- [ ] Create basic folder structure (src/commands, src/engines, src/config, src/utils)

#### Day 3-4: Service Management Engine 🔧
- [ ] Implement `src/engines/service.engine.ts`
  - [ ] ankr-ctl wrapper using execa
  - [ ] getServicePort() from services.json
  - [ ] Safe restart protocol:
    - [ ] killOldProcess() using lsof + kill
    - [ ] waitForPortRelease() with timeout
    - [ ] startService() delegating to ankr-ctl
    - [ ] waitForHealthy() with retry logic
    - [ ] Rollback mechanism on failure

- [ ] Implement `src/commands/service.ts`
  - [ ] `compass service start [service] [--safe] [--wait]`
  - [ ] `compass service stop [service] [--force]`
  - [ ] `compass service restart [service] [--safe] [--verify]`
  - [ ] `compass service status [service] [--json]`
  - [ ] `compass service health [--continuous]`
  - [ ] `compass service logs <service> [--follow] [--lines N]`

- [ ] Unit tests for service engine
  - [ ] Port detection
  - [ ] Process killing
  - [ ] Health check timeout handling

#### Day 5-7: Provider Management Engine 💰
- [ ] Create `src/config/providers.config.ts`
  - [ ] Jina metadata (FREE, 88% MTEB, 1024 dims, API endpoint)
  - [ ] Nomic metadata (FREE, 86% MTEB, 768 dims, API endpoint)
  - [ ] Voyage metadata (DEPRECATED, $120/month, 85% MTEB, migration path)
  - [ ] Health check functions for each provider

- [ ] Implement `src/engines/provider.engine.ts`
  - [ ] validateApiKey() - check env var exists
  - [ ] testProviderHealth() - API health check
  - [ ] backupConfig() - save server.ts state
  - [ ] updateServerTs() - modify preferred_provider
  - [ ] switchProvider() workflow:
    1. Validate API key
    2. Test new provider
    3. Backup config
    4. Update server.ts
    5. Safe restart ai-proxy (port 4444)
    6. Verify embedding quality
    7. Rollback on failure
  - [ ] migrateVoyageToJina() - automated migration

- [ ] Implement `src/commands/provider.ts`
  - [ ] `compass provider list [--category embedding]`
  - [ ] `compass provider status --validate`
  - [ ] `compass provider switch <provider> [--validate] [--rollback-on-fail]`
  - [ ] `compass provider migrate voyage jina [--dry-run]`

- [ ] Integration tests for provider switching
  - [ ] Test Jina switch with validation
  - [ ] Test rollback on health check failure

### Week 2: Database + Port + Diagnostics

#### Day 8-10: Database Operations Engine 🗄️
- [ ] Implement `src/engines/database.engine.ts`
  - [ ] loadDatabaseConfig() from databases.json
  - [ ] backupDatabase(db, options) using pg_dump
    - [ ] Support --compress (gzip)
    - [ ] Support --remote (S3/rsync)
    - [ ] 7-day retention cleanup
  - [ ] restoreDatabase(backup, db, options) using pg_restore
    - [ ] Verification step
    - [ ] Require --force for overwrite
  - [ ] getDatabaseStatus() - connections, size, table count
  - [ ] connectToDatabase() - psql/prisma-studio wrapper

- [ ] Implement `src/commands/database.ts`
  - [ ] `compass db list [--server postgres]`
  - [ ] `compass db backup [db|--all] [--compress] [--remote]`
  - [ ] `compass db restore <backup> <db> [--verify]`
  - [ ] `compass db status [--connections] [--size]`
  - [ ] `compass db connect <db> [--psql]`

- [ ] Database status dashboard formatting (table view)

#### Day 11-12: Port Conflict Resolution Engine 🔌
- [ ] Implement `src/engines/port.engine.ts`
  - [ ] checkPortAvailable(port) using lsof
  - [ ] getProcessOnPort(port) - return PID + command
  - [ ] killPort(port, options) - graceful then force kill
  - [ ] waitForPortRelease(port, timeout) - polling
  - [ ] detectConflicts() - check all services
  - [ ] resolveConflicts(autoFix) - automated resolution

- [ ] Implement `src/utils/port.ts` shared utilities
  - [ ] Port parsing from services.json
  - [ ] Port range validation

- [ ] Implement `src/commands/port.ts`
  - [ ] `compass port check [--service ai-proxy]`
  - [ ] `compass port conflicts [--resolve]`
  - [ ] `compass port kill <port> [--force]`

- [ ] Integration with service restart (auto port cleanup)

#### Day 13-14: Diagnostics + Polish 🔍
- [ ] Implement `src/engines/health.engine.ts`
  - [ ] checkServiceHealth(service) - HTTP health check
  - [ ] checkDatabaseHealth(db) - connection test
  - [ ] checkProviderHealth(provider) - API test
  - [ ] checkPortHealth(service) - availability check
  - [ ] getDependencies(service) - from config
  - [ ] generateHealthReport(service) - comprehensive check

- [ ] Implement `src/commands/diagnose.ts`
  - [ ] `compass diagnose service <service> [--deep]`
  - [ ] `compass diagnose port-conflict [--auto-fix]`
  - [ ] `compass diagnose embedding-provider [--test-all]`
  - [ ] `compass diagnose health-summary [--json]`

- [ ] Error handling and rollback polish
- [ ] Add spinners (ora) for long operations
- [ ] Add colored output (chalk) for status
- [ ] Write README.md with examples

### Week 2 Deliverables: MVP Testing ✅

- [ ] End-to-end test: Safe restart ai-proxy
  ```bash
  compass service restart ai-proxy --safe
  curl http://localhost:4444/health  # Should return 200
  ```

- [ ] End-to-end test: Provider migration
  ```bash
  compass provider migrate voyage jina --validate
  curl -X POST http://localhost:4444/api/embeddings -d '{"text":"test"}'
  # Verify provider: "jina" in response
  ```

- [ ] End-to-end test: Database backup/restore
  ```bash
  compass db backup wowtruck --compress
  compass db restore wowtruck_backup.sql.gz wowtruck --verify
  ```

- [ ] End-to-end test: Port conflict resolution
  ```bash
  compass diagnose port-conflict --auto-fix
  compass port check  # Should show no conflicts
  ```

---

## Phase 2: Advanced Features (Week 3-4)

### Week 3: Multi-Repo + Setup

#### Day 15-17: Multi-Repo Coordination 🔄
- [ ] Implement `src/engines/deploy.engine.ts`
  - [ ] REPO_REGISTRY with paths (ankr-labs-nx, swayam, awesome-ankr-skills, vercel-skills, 24 satellites)
  - [ ] syncRepo(repo) - git pull --rebase
  - [ ] syncAllRepos() - parallel execution
  - [ ] buildRepo(repo, options) - nx build with cache
  - [ ] checkRepoHealth(repo) - git status, dependencies

- [ ] Implement `src/commands/deploy.ts`
  - [ ] `compass deploy check [--repo ankr-labs-nx]`
  - [ ] `compass deploy sync --all-repos`
  - [ ] `compass deploy build [--parallel] [--cache]`

#### Day 18-21: Interactive Setup Wizard 🎯
- [ ] Implement `src/engines/setup.engine.ts`
  - [ ] cloneRepos() - clone 4 main repos
  - [ ] installDependencies() - pnpm install in parallel
  - [ ] initDatabases() - Prisma migrations + seeding
  - [ ] configureProviders() - interactive API key prompts
  - [ ] startServices() - ankr-ctl start with health checks

- [ ] Implement `src/commands/setup.ts`
  - [ ] `compass setup repo [--clone] [--install]`
  - [ ] `compass setup database [--init-all] [--seed]`
  - [ ] `compass setup provider embedding --interactive`
  - [ ] `compass setup complete [--skip-slow]`

- [ ] Interactive prompts with inquirer
  - [ ] API key input (masked)
  - [ ] Confirmation prompts
  - [ ] Multi-select options

### Week 4: Monitoring + Script Consolidation

#### Day 22-24: Continuous Health Monitoring 📊
- [ ] Extend `src/engines/health.engine.ts`
  - [ ] continuousHealthCheck(options) - polling loop
  - [ ] webhookAlert(url, status) - webhook integration
  - [ ] healthMetrics() - uptime, latency, memory
  - [ ] alertConditions() - configurable thresholds

- [ ] Extend `src/commands/service.ts`
  - [ ] `compass service health --continuous --alert webhook://url`
  - [ ] Integration with existing `/root/ankr-health-check.sh` logic

#### Day 25-28: Script Consolidation Registry 📜
- [ ] Create `src/config/scripts.config.ts`
  - [ ] SCRIPT_REGISTRY with 189 script mappings
  - [ ] Categories: provider, database, monitoring, deployment, emergency
  - [ ] Status: replaced, deprecated, keep
  - [ ] Replacement commands for each script

- [ ] Implement script discovery command
  - [ ] `compass scripts list [--category monitoring] [--status replaced]`
  - [ ] Show old script path → new command mapping
  - [ ] Add deprecation warnings to old scripts

- [ ] Documentation for migration
  - [ ] Top 50 most-used scripts → COMPASS commands
  - [ ] Migration guide for developers

---

## Phase 3: Production Rollout (Week 5-6)

### Week 5: Testing + Documentation

#### Day 29-31: Comprehensive Testing 🧪
- [ ] Unit tests for all engines (service, provider, database, port, health)
- [ ] Integration tests for workflows
  - [ ] Safe restart with rollback
  - [ ] Provider switch with validation
  - [ ] Database backup/restore
  - [ ] Port conflict auto-fix
- [ ] End-to-end test suite (automated)
- [ ] Error handling edge cases
- [ ] Performance benchmarks (command execution time)

#### Day 32-35: Documentation 📚
- [ ] Write comprehensive README.md
  - [ ] Installation instructions
  - [ ] Command reference with examples
  - [ ] Architecture overview
  - [ ] Troubleshooting guide
- [ ] Create CONTRIBUTING.md for future development
- [ ] Add inline code comments (TSDoc)
- [ ] Generate API documentation
- [ ] Create migration guide (bash scripts → COMPASS)

### Week 6: Production Deployment

#### Day 36-38: Deprecation Strategy 🚨
- [ ] Add deprecation warnings to top 50 scripts
  ```bash
  echo "⚠️  DEPRECATED: Use 'compass provider switch jina' instead"
  echo "   This script will be removed in 90 days"
  ```
- [ ] Update cron jobs to use COMPASS commands
- [ ] Create alias scripts for backwards compatibility

#### Day 39-42: Rollout + Monitoring 🚀
- [ ] Publish to npm (or internal registry)
- [ ] Global install on development servers
- [ ] Update ANKR platform documentation
- [ ] Monitor adoption metrics
  - [ ] Command usage statistics
  - [ ] Error rates
  - [ ] Execution time metrics
- [ ] Gather developer feedback
- [ ] Iterate on UX improvements

---

## Success Criteria

### Phase 1 (MVP) - Week 2 ✅
- [ ] 10 core commands working
- [ ] Zero service downtime during provider switches
- [ ] $1,440/year cost savings automated (Voyage → Jina)
- [ ] 3 critical pain points solved (port, provider, database)

### Phase 2 (Advanced) - Week 4 ✅
- [ ] Multi-repo sync working for 4 main repos
- [ ] Interactive setup wizard complete
- [ ] 50+ scripts consolidated into CLI
- [ ] Continuous health monitoring with webhooks

### Phase 3 (Production) - Week 6 ✅
- [ ] All tests passing (unit + integration + e2e)
- [ ] Documentation complete
- [ ] Deployed to production
- [ ] 80% reduction in manual emergency procedures
- [ ] 40-50% cognitive load reduction (developer survey)

---

## Dependencies & Blockers

### External Dependencies
- [ ] Access to `/root/ankr-ctl` (READ-ONLY, wrapper pattern)
- [ ] Access to `/root/.ankr/config/*.json` (READ-ONLY)
- [ ] Jina API key for testing
- [ ] Nomic API key for testing
- [ ] Production database credentials (for backup testing)

### Potential Blockers
- [ ] ankr-ctl refactoring (mitigated by wrapper pattern)
- [ ] Provider API rate limits (mitigated by caching)
- [ ] Database backup storage space (mitigated by retention policy)

---

## Post-Launch Improvements (Future)

### Advanced Diagnostics
- [ ] Service dependency graph visualization
- [ ] Performance profiling (latency, memory, CPU)
- [ ] Cost optimization recommendations

### Advanced Automation
- [ ] Auto-scaling based on load
- [ ] Intelligent service startup order (dependency resolution)
- [ ] Predictive health monitoring (ML-based anomaly detection)

### Developer Experience
- [ ] VS Code extension integration
- [ ] Shell completion (bash, zsh, fish)
- [ ] Web UI for health dashboard
- [ ] Slack/Discord bot integration

---

**Status**: Ready for implementation
**Next Action**: Create package structure and begin Day 1 tasks
**Blockers**: None - all dependencies available
**Timeline**: 6 weeks from approval (MVP in 2 weeks)
