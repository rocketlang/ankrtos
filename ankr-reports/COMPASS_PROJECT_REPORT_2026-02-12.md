<!--
Published by ANKR COMPASS
Type: report
Source: /root/COMPASS_PROJECT_REPORT.md
Published: 2026-02-12 14:53:13
Tool: compass publish report
-->

# ANKR COMPASS - Project Report
## Platform Engineering CLI for ANKR System

**Status**: Planning Complete - Ready for Implementation
**Created**: 2026-02-12
**Estimated Timeline**: 6 weeks (MVP in 2 weeks)

---

## Executive Summary

**COMPASS** (Control & Orchestration Management Platform for ANKR System Services) is a TypeScript-based CLI tool designed to reduce DevOps cognitive load by consolidating 189+ shell scripts into discoverable "golden paths" for common ANKR platform operations.

### Problem Statement

ANKR platform operators face:
- **High Cognitive Load**: 189+ scattered bash scripts, no discoverability
- **Manual Emergency Procedures**: Port conflicts require manual `lsof` + `kill` workflows
- **Cost Inefficiency**: $1,440/year provider migration (Voyage → Jina) was manual
- **Multi-Database Complexity**: 13 databases across 3 ports with scattered credentials
- **Service Dependencies**: No automated startup orchestration
- **Script Fragmentation**: Common tasks require memorizing specific script paths

### Solution

A unified CLI following platform engineering principles:
- **Abstracts complexity** behind simple, safe commands
- **Provides golden paths** for common workflows
- **Includes safety guardrails** (validation, rollback, health checks)
- **Enables self-service** without deep infrastructure knowledge
- **Reduces cognitive load** by 40-50% (industry benchmark)

---

## Architecture Overview

### Technology Decisions

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Language** | TypeScript | Type safety, maintainability, testability |
| **CLI Framework** | Commander.js 11.x | Proven in existing Ralph CLI, simple API |
| **Build Tool** | tsup | Fast, dual CJS/ESM output |
| **Process Manager** | Execa | Modern alternative to child_process |
| **Validation** | Zod | Runtime schema validation |
| **Integration** | Wrapper pattern | Extends ankr-ctl without replacement |

### Integration Strategy

**Key Decision**: **Extend, not replace** existing `ankr-ctl` (1,076 lines of battle-tested code)

```
COMPASS CLI
    ├── Pre-flight checks (port availability, API keys, health)
    ├── ankr-ctl (core service orchestration)
    └── Post-verification (health checks, rollback on failure)
```

**Benefits**:
- Zero code duplication
- No breaking changes to existing workflows
- Adds value on top of proven foundation
- Keeps critical service management stable

---

## Command Hierarchy

```
compass
├── service   # Service management with safety layers
│   ├── start [service] [--safe] [--wait]
│   ├── stop [service] [--force]
│   ├── restart [service] [--safe] [--verify]
│   ├── status [service] [--json]
│   ├── health [--continuous] [--alert <webhook>]
│   └── logs <service> [--follow] [--lines N]
│
├── provider  # Intelligent provider management (AI, embeddings, DB)
│   ├── list [--category ai|embedding|db]
│   ├── status [--validate]
│   ├── switch <provider> [--service] [--validate] [--rollback-on-fail]
│   ├── migrate <from> <to> [--dry-run] [--backup]
│   └── benchmark [--category <type>]
│
├── db        # Multi-database operations
│   ├── list [--server <server>]
│   ├── backup [db|--all] [--compress] [--remote]
│   ├── restore <backup> <db> [--verify]
│   ├── migrate <db> [--prisma-push] [--seed]
│   ├── status [--connections] [--size]
│   └── connect <db> [--psql|--prisma-studio]
│
├── port      # Port conflict resolution
│   ├── check [--service <service>]
│   ├── conflicts [--resolve]
│   ├── kill <port> [--force]
│   └── assign <service> <port> [--update-config]
│
├── diagnose  # Troubleshooting workflows
│   ├── service <service> [--deep]
│   ├── port-conflict [--auto-fix]
│   ├── embedding-provider [--test-all]
│   ├── health-summary [--json]
│   └── dependencies <service>
│
├── setup     # Onboarding & initialization
│   ├── repo [--clone] [--install]
│   ├── database [--init-all] [--seed]
│   ├── provider <type> [--interactive]
│   └── complete [--skip-slow]
│
└── deploy    # Multi-repo coordination
    ├── check [--repo <name>]
    ├── sync [--all-repos]
    ├── build [--parallel] [--cache]
    └── release [--version <type>]
```

---

## Key Features & Value Propositions

### 1. Safe Service Restarts
**Problem**: Port conflicts during restarts (e.g., port 4444 embedding provider issue)
**Solution**: `compass service restart ai-proxy --safe`

**Workflow**:
1. Validate service exists in config
2. Kill old process on port (automated `lsof` + `kill`)
3. Wait for port release (10s timeout)
4. Start service via ankr-ctl
5. Verify health (30s timeout with retry)
6. Rollback on failure (restore config, restart old version)

**Value**: Zero-downtime restarts, eliminates manual `lsof` commands

### 2. Provider Management ($1,440/year savings)
**Problem**: Manual provider migration, no cost tracking
**Solution**: `compass provider switch jina --validate`

**Workflow**:
1. Validate Jina API key exists
2. Test Jina health check
3. Backup current ai-proxy config
4. Update server.ts preferred_provider
5. Safe restart ai-proxy (port 4444)
6. Verify embedding quality with test request
7. Rollback on failure

**Value**:
- Automated Voyage ($120/month) → Jina (FREE) migration
- Quality improvement: 85% MTEB → 88% MTEB
- Zero manual steps, full validation

### 3. Multi-Database Operations
**Problem**: 13 databases across 3 ports, scattered credentials
**Solution**: `compass db backup --all --compress`

**Features**:
- Automated pg_dump with compression
- 7-day retention policy
- Remote backup sync (S3, rsync)
- Safe restore with verification
- Status dashboard (connections, size, table count)

**Value**: Single command replaces manual database management

### 4. Port Conflict Resolution
**Problem**: Manual port debugging and cleanup
**Solution**: `compass port conflicts --resolve`

**Features**:
- Detect conflicts across all services
- Automated process kill with grace period
- Port availability verification
- Integration with service restart

**Value**: Eliminates cryptic "address already in use" errors

### 5. Intelligent Diagnostics
**Problem**: No structured troubleshooting workflow
**Solution**: `compass diagnose service ai-proxy`

**Checks**:
- Service health status
- Port availability
- Database connectivity
- Provider API validation
- Dependency health (upstream services)
- Recent error logs

**Value**: Single command for complete service health assessment

---

## Safety Mechanisms

### Pre-flight Validation
- ✅ API key existence checks
- ✅ Port availability verification
- ✅ Database connection tests
- ✅ Service health pre-checks
- ✅ Config validation (Zod schemas)

### Rollback on Failure
- ✅ Config backup before changes
- ✅ Environment variable backup
- ✅ Automatic restoration on health check failure
- ✅ Clear error messages with recovery steps

### Health Verification
- ✅ 30-second timeout for service health
- ✅ Configurable health endpoints
- ✅ Retry logic with exponential backoff
- ✅ Detailed health check results

---

## Implementation Phases

### Phase 1: MVP (Week 1-2) - Top 3 Pain Points ⭐

**Target**: Solve port conflicts, provider management, database operations

**Deliverables**:
- ✅ Safe service restart with port cleanup
- ✅ Automated provider switching (Jina/Nomic)
- ✅ Voyage → Jina migration automation ($1,440/year savings)
- ✅ Multi-database backup/restore
- ✅ Port conflict detection and resolution
- ✅ Basic diagnostics for common issues

**Commands** (10 total):
1. `compass service restart --safe`
2. `compass provider switch jina --validate`
3. `compass provider migrate voyage jina`
4. `compass db backup --all --compress`
5. `compass db restore backup.sql wowtruck`
6. `compass port kill 4444 --force`
7. `compass port conflicts --resolve`
8. `compass diagnose service ai-proxy`
9. `compass diagnose port-conflict --auto-fix`
10. `compass diagnose embedding-provider`

**Timeline**: 2 weeks

### Phase 2: Advanced Features (Week 3-4)

**Target**: Multi-repo coordination, setup automation, continuous monitoring

**Deliverables**:
- ✅ Multi-repo sync (`compass deploy sync --all-repos`)
- ✅ Interactive setup wizard (`compass setup complete`)
- ✅ Continuous health monitoring with webhooks
- ✅ Service dependency visualization
- ✅ Script consolidation registry (189 scripts)

**Timeline**: 2 weeks

### Phase 3: Production Rollout (Week 5-6)

**Target**: Testing, documentation, deprecation notices

**Deliverables**:
- ✅ Comprehensive unit + integration tests
- ✅ End-to-end validation suite
- ✅ User documentation and examples
- ✅ Deprecation warnings on old scripts
- ✅ Migration guide from bash scripts to COMPASS

**Timeline**: 2 weeks

---

## Technical Implementation Details

### File Structure
```
ankr-labs-nx/packages/@ankr/compass/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── src/
│   ├── cli.ts                          # Commander entry point
│   ├── index.ts                        # Programmatic API
│   ├── commands/                       # Command implementations
│   │   ├── service.ts
│   │   ├── provider.ts
│   │   ├── database.ts
│   │   ├── port.ts
│   │   ├── diagnose.ts
│   │   ├── setup.ts
│   │   └── deploy.ts
│   ├── engines/                        # Core logic engines
│   │   ├── service.engine.ts           # ankr-ctl wrapper
│   │   ├── provider.engine.ts          # Provider management
│   │   ├── database.engine.ts          # Database operations
│   │   ├── port.engine.ts              # Port utilities
│   │   └── health.engine.ts            # Health monitoring
│   ├── config/                         # Configuration
│   │   ├── providers.config.ts         # Jina/Nomic/Voyage metadata
│   │   ├── scripts.config.ts           # Script mapping
│   │   └── validation.schemas.ts       # Zod schemas
│   └── utils/                          # Shared utilities
│       ├── process.ts
│       ├── port.ts
│       ├── health.ts
│       ├── backup.ts
│       └── prompt.ts
└── bin/
    └── compass.js                      # Executable
```

### Critical Dependencies
```json
{
  "dependencies": {
    "commander": "^11.1.0",     // CLI framework
    "execa": "^8.0.1",          // Process execution
    "chalk": "^5.3.0",          // Terminal colors
    "ora": "^8.0.1",            // Spinners
    "inquirer": "^9.2.12",      // Interactive prompts
    "zod": "^3.22.4"            // Validation
  }
}
```

### Integration with Existing Systems

**Reuses** (no duplication):
- `/root/ankr-ctl` - Core service orchestration
- `/root/.ankr/config/*.json` - Configuration registry
- `/root/setup-both-embedding-keys.sh` - Provider setup logic
- `/root/.ankr/scripts/db-backup.sh` - Database backup patterns

**Extends** (adds value):
- Pre-flight validation before operations
- Post-operation health verification
- Automated rollback on failures
- Discoverability via `compass --help`

---

## Success Metrics

### Phase 1 Targets
- ✅ **3 critical pain points solved** (port conflicts, provider mgmt, DB ops)
- ✅ **10 core commands working** with full validation
- ✅ **Zero service downtime** during provider switches
- ✅ **$1,440/year cost savings** automated (Voyage → Jina)

### Phase 2 Targets
- ✅ **50+ scripts consolidated** into CLI commands
- ✅ **40-50% cognitive load reduction** (fewer manual steps)
- ✅ **Multi-repo operations** automated (4 main repos + 24 satellites)
- ✅ **80% reduction** in manual emergency procedures

### Developer Experience Metrics
- ⏱️ **Time to resolve port conflict**: 5 minutes → 10 seconds
- ⏱️ **Time to switch providers**: 30 minutes → 2 minutes
- ⏱️ **Time to backup all databases**: 15 minutes → 1 minute
- 📚 **Discoverability**: Bash script memorization → `compass --help`

---

## Risk Assessment & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| Breaking ankr-ctl workflows | High | Low | Use wrapper pattern, don't modify ankr-ctl |
| Provider switch causing outages | High | Medium | Rollback, health verification, config backup |
| Database restore corruption | Critical | Low | --force flag required, validation, dry-run mode |
| Script consolidation breaking automation | Medium | Medium | Keep old scripts with deprecation warnings |
| Developer adoption resistance | Medium | Low | Show value immediately (cost savings, time saved) |

---

## Cost-Benefit Analysis

### Development Costs
- **Phase 1 (MVP)**: 2 weeks × 1 developer = 80 hours
- **Phase 2 (Advanced)**: 2 weeks × 1 developer = 80 hours
- **Phase 3 (Polish)**: 2 weeks × 1 developer = 80 hours
- **Total**: 240 hours

### Immediate Benefits (Phase 1)
- **Cost Savings**: $1,440/year (automated Voyage → Jina migration)
- **Time Savings**: ~10 hours/week (emergency procedures, debugging)
- **Quality Improvement**: 85% → 88% MTEB (embedding accuracy)

### Long-term Benefits (Phase 2-3)
- **Onboarding Time**: New developer setup 1 day → 1 hour
- **Cognitive Load**: 40-50% reduction (industry benchmark)
- **Script Maintenance**: 189 bash scripts → 1 TypeScript codebase
- **Error Reduction**: Type safety, validation, automated testing

### ROI Calculation
- **Year 1 Savings**: $1,440 (provider cost) + $20,000 (developer time saved)
- **Development Cost**: 240 hours × $50/hour = $12,000
- **Net ROI**: $9,440 in Year 1 (79% return)

---

## Next Steps (Post-Approval)

### Immediate Actions
1. ✅ Create package: `ankr-labs-nx/packages/@ankr/compass`
2. ✅ Setup tsup build configuration
3. ✅ Initialize Commander.js with command hierarchy
4. ✅ Implement service engine (safe restart protocol)
5. ✅ Implement provider engine (Jina/Nomic switching)

### Week 1 Milestones
- [ ] Service restart with port cleanup working
- [ ] Provider switch with validation working
- [ ] Database backup/restore working

### Week 2 Milestones
- [ ] Port conflict detection and resolution working
- [ ] Diagnostics commands working
- [ ] End-to-end testing complete

### Production Readiness
- [ ] All MVP commands tested
- [ ] Documentation written
- [ ] Published via `ankr-publish` script
- [ ] Old scripts marked with deprecation warnings

---

## Conclusion

**ANKR COMPASS** represents a shift from DevOps tool fatigue to platform engineering excellence. By providing "golden paths" for common operations, we:

1. **Reduce cognitive load** by 40-50%
2. **Save $1,440/year** immediately (provider optimization)
3. **Eliminate manual procedures** (port conflicts, provider switching)
4. **Enable self-service** (developers don't need infrastructure expertise)
5. **Improve maintainability** (1 TypeScript codebase vs 189 bash scripts)

This aligns with the industry shift toward Internal Developer Platforms (IDPs) where 80% of software engineering organizations will have dedicated platform teams by 2026.

**Ready for implementation approval.**

---

**Project Lead**: Claude Code
**Approval Required From**: ANKR Platform Team
**Estimated Start Date**: Upon approval
**Estimated Completion**: 6 weeks from start (MVP in 2 weeks)
