<!--
Published by ANKR COMPASS
Type: report
Source: /root/COMPASS_TRAINING_GUIDE.md
Published: 2026-02-12 15:07:43
Tool: compass publish report
-->

# ANKR COMPASS - Training & Usage Guide

**Audience**: ANKR Team Members, DevOps, Developers
**Version**: 1.0.0
**Last Updated**: 2026-02-12

---

## 📚 Table of Contents

1. [Getting Started](#getting-started)
2. [Basic Usage](#basic-usage)
3. [Common Workflows](#common-workflows)
4. [Advanced Features](#advanced-features)
5. [Extending COMPASS](#extending-compass)
6. [Training Your Team](#training-your-team)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## 🚀 Getting Started

### Installation (Already Done)

COMPASS is already installed and globally linked:

```bash
# Verify installation
compass --version
# Output: 1.0.0

# Get help
compass --help

# Quick start guide
compass quickstart
```

### Your First Commands

```bash
# 1. Check system health
compass diagnose system

# 2. Check service status
compass service status

# 3. Check for port conflicts
compass port conflicts

# 4. View provider status
compass provider status
```

**Expected Output**:
- Green ✓ means healthy
- Yellow ⚠ means warning
- Red ✗ means issue needs attention

---

## 📖 Basic Usage

### 1. Service Management

#### Safe Service Restart
```bash
# Safe restart with automatic port cleanup
compass service restart ai-proxy --safe

# What it does:
# ✓ Checks if service exists
# ✓ Kills old process on port 4444
# ✓ Waits for port release
# ✓ Starts service via ankr-ctl
# ✓ Verifies health
# ✓ Rolls back if failed
```

#### Check Service Status
```bash
# All services
compass service status

# Specific service
compass service status ai-proxy
```

#### View Service Logs
```bash
# Last 50 lines (default)
compass service logs ai-proxy

# Last 100 lines
compass service logs ai-proxy -n 100
```

### 2. Provider Management (Cost Optimization)

#### Check Current Provider
```bash
compass provider status

# Shows:
# - Current provider (Jina, Nomic, or Voyage)
# - MTEB quality score
# - Cost (FREE or $/month)
# - API key status
```

#### List All Providers
```bash
compass provider list

# Shows comparison:
# - Jina AI: FREE, 88% MTEB, 1024 dims
# - Nomic AI: FREE, 86% MTEB, 768 dims
# - Voyage AI: $120/mo, 85% MTEB (DEPRECATED)
```

#### Switch Provider (Save $1,440/year!)
```bash
# Validate before switching
compass provider validate jina

# Switch with validation
compass provider switch jina --validate

# Full migration from Voyage to Jina
compass provider migrate voyage jina

# What it does:
# ✓ Tests API key
# ✓ Backs up config
# ✓ Updates server.ts
# ✓ Safe restarts ai-proxy
# ✓ Verifies health
# ✓ Shows cost savings
```

### 3. Database Operations

#### Check Database Status
```bash
# All databases
compass db status

# Specific database
compass db status wowtruck
```

#### Backup Database
```bash
# Simple backup
compass db backup wowtruck

# Compressed backup (recommended)
compass db backup wowtruck --compress

# Custom output location
compass db backup wowtruck --compress -o /backup/wowtruck.sql.gz
```

#### Restore Database
```bash
# Restore from backup
compass db restore wowtruck_backup.sql.gz wowtruck

# With verification
compass db restore wowtruck_backup.sql.gz wowtruck --verify

# Force restore even if errors
compass db restore wowtruck_backup.sql.gz wowtruck --force
```

#### List Available Backups
```bash
# All backups
compass db list-backups

# Backups for specific database
compass db list-backups wowtruck
```

### 4. Port Management

#### Check Port Status
```bash
# Check if port is in use
compass port check 4444

# Shows:
# - Port status (in use / available)
# - Process ID (PID)
# - Command name
# - User
```

#### Kill Process on Port
```bash
# Graceful kill
compass port kill 4444

# Force kill (SIGKILL)
compass port kill 4444 --force
```

#### Check for Conflicts
```bash
# Check all ANKR service ports
compass port conflicts

# Auto-resolve conflicts
compass port conflicts --auto-fix

# What auto-fix does:
# ✓ Identifies conflicts
# ✓ Kills conflicting processes
# ✓ Waits for port release
# ✓ Reports results
```

#### List All Ports in Use
```bash
compass port list

# Shows table of:
# Port | PID | Command | User
```

### 5. Diagnostics

#### Full System Diagnostics
```bash
compass diagnose system

# Runs:
# - Service health checks
# - Port conflict scan
# - Database status checks
# - Comprehensive report
```

#### Service-Specific Diagnostics
```bash
compass diagnose service ai-proxy

# Shows:
# - Service status
# - Recent logs
# - Port status
# - Suggestions
```

#### Port Conflict Diagnostics
```bash
# Detect and report
compass diagnose port-conflict

# Detect and auto-fix
compass diagnose port-conflict --auto-fix
```

#### Database Diagnostics
```bash
# All databases
compass diagnose database

# Specific database
compass diagnose database wowtruck
```

#### Provider Diagnostics
```bash
compass diagnose embedding-provider

# Shows:
# - Current provider status
# - Available providers
# - API key status
# - Recommendations
```

### 6. Publishing

#### Publish a Report
```bash
compass publish report PROJECT_REPORT.md

# Published to:
# - /root/ankr-reports/PROJECT_REPORT_2026-02-12.md
# - /root/ankr-reports/report_latest.md (symlink)
```

#### Publish a TODO List
```bash
compass publish todo TODO.md

# Published to:
# - /root/ankr-todos/TODO_2026-02-12.md
# - /root/ankr-todos/todo_latest.md (symlink)
```

#### Auto-Publish All Documents
```bash
# Detect and publish all
compass publish auto /root

# With HTML versions
compass publish auto /root --html

# With PDF versions (via ankr-publish)
compass publish auto /root --pdf
```

#### Generate Changelog
```bash
compass publish changelog

# Auto-generates from git history
# Output: /root/CHANGELOG.md
```

#### Show Published Documents
```bash
compass publish summary

# Lists all published:
# - Reports
# - TODOs
# - Changelogs
```

---

## 🔄 Common Workflows

### Workflow 1: Service Won't Start (Port Conflict)

**Problem**: `ai-proxy` won't start, port 4444 already in use

**Solution**:
```bash
# 1. Check what's using the port
compass port check 4444

# 2. Kill the process
compass port kill 4444 --force

# 3. Restart service safely
compass service restart ai-proxy --safe

# 4. Verify it's running
compass service status ai-proxy
```

**One-liner Alternative**:
```bash
compass diagnose port-conflict --auto-fix && compass service restart ai-proxy --safe
```

### Workflow 2: Optimize Costs (Voyage → Jina)

**Scenario**: Currently using Voyage ($120/month), want to switch to free Jina

**Steps**:
```bash
# 1. Check current status
compass provider status
# Shows: Voyage AI, $120/month, 85% MTEB

# 2. Validate Jina is working
compass provider validate jina

# 3. Migrate (automatic)
compass provider migrate voyage jina

# Result:
# ✓ Switched to Jina (FREE)
# ✓ Better quality (88% vs 85% MTEB)
# ✓ Savings: $1,440/year
# ✓ Zero downtime
```

### Workflow 3: Database Backup Before Migration

**Scenario**: Running database migration, need safety backup

**Steps**:
```bash
# 1. Check database health
compass db status wowtruck

# 2. Create compressed backup
compass db backup wowtruck --compress

# 3. Note backup location
# Output: /root/ankr-backups/daily/wowtruck_2026-02-12.sql.gz

# 4. Run migration (your code)
npx prisma migrate deploy

# 5. If migration fails, restore:
compass db restore wowtruck_2026-02-12.sql.gz wowtruck --verify

# 6. Verify data integrity
compass diagnose database wowtruck
```

### Workflow 4: Morning System Check

**Routine**: Daily system health verification

```bash
# Single command
compass diagnose system

# Or detailed:
compass service health          # Check all services
compass port conflicts          # Check for conflicts
compass db status              # Check databases
compass provider status        # Check embedding provider
```

### Workflow 5: Pre-Deployment Checklist

**Before deploying changes**:
```bash
# 1. Check system health
compass diagnose system

# 2. Backup critical databases
compass db backup wowtruck --compress
compass db backup ankr_eon --compress

# 3. Ensure no port conflicts
compass port conflicts --auto-fix

# 4. Verify services are healthy
compass service health

# 5. Document current state
compass publish auto /root
```

### Workflow 6: Troubleshooting Slow Service

**Problem**: `ai-proxy` is slow or not responding

**Steps**:
```bash
# 1. Run diagnostics
compass diagnose service ai-proxy

# 2. Check logs for errors
compass service logs ai-proxy -n 100

# 3. Check provider health
compass diagnose embedding-provider

# 4. Safe restart if needed
compass service restart ai-proxy --safe

# 5. Verify recovery
compass diagnose service ai-proxy
```

---

## 🎓 Advanced Features

### Programmatic Usage (TypeScript/JavaScript)

COMPASS can be used as a library in your code:

```typescript
import { ServiceEngine, ProviderEngine, PortEngine } from '@ankr/compass';

// Service management
const serviceEngine = new ServiceEngine();
await serviceEngine.safeRestart('ai-proxy', { safe: true });

// Provider switching
const providerEngine = new ProviderEngine();
await providerEngine.switchProvider('jina', { validate: true });

// Port management
const portEngine = new PortEngine();
const portInfo = await portEngine.checkPort(4444);
if (portInfo.inUse) {
  await portEngine.killPortProcess(4444, true);
}
```

### Automation with Scripts

**Create a daily health check script**:

```bash
#!/bin/bash
# File: /root/daily-health-check.sh

echo "🏥 ANKR Daily Health Check - $(date)"
echo "========================================"

# Run diagnostics
compass diagnose system

# Check for issues
if [ $? -ne 0 ]; then
  echo "❌ Issues detected!"
  # Send alert (integrate with your alerting system)
else
  echo "✅ All systems healthy"
fi

# Backup critical databases
compass db backup wowtruck --compress
compass db backup ankr_eon --compress

echo "========================================"
echo "✓ Daily health check complete"
```

**Schedule with cron**:
```bash
# Run daily at 2 AM
0 2 * * * /root/daily-health-check.sh >> /var/log/ankr-health.log 2>&1
```

### CI/CD Integration

**In your deployment pipeline**:

```yaml
# .github/workflows/deploy.yml
- name: Pre-deployment health check
  run: compass diagnose system

- name: Backup databases
  run: |
    compass db backup wowtruck --compress
    compass db backup ankr_eon --compress

- name: Deploy application
  run: ./deploy.sh

- name: Post-deployment verification
  run: |
    compass service restart ai-proxy --safe
    compass diagnose system
```

---

## 🔧 Extending COMPASS

### Adding New Commands

**1. Create a new command file**:

```typescript
// File: /root/ankr-labs-nx/packages/@ankr/compass/src/commands/custom.ts

import { Command } from 'commander';
import chalk from 'chalk';

export function createCustomCommand(): Command {
  const custom = new Command('custom');
  custom.description('Your custom commands');

  custom
    .command('hello <name>')
    .description('Say hello')
    .action(async (name) => {
      console.log(chalk.green(`Hello, ${name}!`));
    });

  return custom;
}
```

**2. Register in CLI**:

```typescript
// File: /root/ankr-labs-nx/packages/@ankr/compass/src/cli.ts

import { createCustomCommand } from './commands/custom.js';

// Add to program
program.addCommand(createCustomCommand());
```

**3. Rebuild**:

```bash
cd /root/ankr-labs-nx/packages/@ankr/compass
npm run build
```

**4. Test**:

```bash
compass custom hello World
# Output: Hello, World!
```

### Adding New Engines

**1. Create engine file**:

```typescript
// File: /root/ankr-labs-nx/packages/@ankr/compass/src/engines/custom.engine.ts

import ora from 'ora';
import chalk from 'chalk';

export class CustomEngine {
  async doSomething(): Promise<void> {
    const spinner = ora('Doing something').start();

    try {
      // Your logic here
      await new Promise(resolve => setTimeout(resolve, 1000));

      spinner.succeed(chalk.green('✓ Done!'));
    } catch (error) {
      spinner.fail(chalk.red('✗ Failed!'));
      throw error;
    }
  }
}
```

**2. Use in commands**:

```typescript
import { CustomEngine } from '../engines/custom.engine.js';

const engine = new CustomEngine();
await engine.doSomething();
```

### Customizing for Your Workflow

**Example: Add monitoring command**:

```typescript
// File: src/commands/monitor.ts

export function createMonitorCommand(): Command {
  const monitor = new Command('monitor');

  monitor
    .command('start')
    .description('Start continuous monitoring')
    .option('--interval <seconds>', 'Check interval', '60')
    .action(async (options) => {
      console.log(chalk.blue('Starting monitor...'));

      setInterval(async () => {
        // Run health checks
        const serviceEngine = new ServiceEngine();
        await serviceEngine.health();

        // Check for issues
        const portEngine = new PortEngine();
        await portEngine.checkConflicts();

        // Log to file
        const timestamp = new Date().toISOString();
        fs.appendFileSync(
          '/var/log/compass-monitor.log',
          `${timestamp} - Health check complete\n`
        );
      }, parseInt(options.interval) * 1000);
    });

  return monitor;
}
```

---

## 👥 Training Your Team

### Training Plan (3 Levels)

#### Level 1: Basic Users (1 hour)

**Objective**: Use COMPASS for daily tasks

**Topics**:
1. What is COMPASS and why use it
2. Running `compass quickstart`
3. Common commands:
   - `compass service status`
   - `compass service restart <name> --safe`
   - `compass port conflicts --auto-fix`
   - `compass diagnose system`

**Hands-on Exercise**:
```bash
# Exercise 1: Check system health
compass diagnose system

# Exercise 2: Restart a service
compass service restart ai-proxy --safe

# Exercise 3: Fix port conflict
compass port conflicts --auto-fix
```

**Assessment**: Can independently check health and restart services

#### Level 2: Power Users (2 hours)

**Objective**: Handle common operational issues

**Topics**:
1. All Level 1 topics
2. Provider management and cost optimization
3. Database backup/restore
4. Troubleshooting workflows
5. Publishing documentation

**Hands-on Exercises**:
```bash
# Exercise 1: Provider migration
compass provider migrate voyage jina

# Exercise 2: Database backup/restore cycle
compass db backup wowtruck --compress
compass db restore backup.sql.gz wowtruck --verify

# Exercise 3: Troubleshoot slow service
compass diagnose service ai-proxy
compass service logs ai-proxy -n 100
compass service restart ai-proxy --safe
```

**Assessment**: Can handle 80% of operational issues independently

#### Level 3: Advanced Users / Contributors (4 hours)

**Objective**: Extend and customize COMPASS

**Topics**:
1. All Level 1 & 2 topics
2. COMPASS architecture
3. Adding new commands
4. Creating custom engines
5. CI/CD integration
6. Contributing to codebase

**Hands-on Project**:
- Add a custom command for your team's specific workflow
- Integrate COMPASS into deployment pipeline
- Create a custom monitoring dashboard

**Assessment**: Can add features and train others

### Training Resources

**1. Documentation**:
- `/root/COMPASS_INDEX.md` - Master index
- `/root/ankr-labs-nx/packages/@ankr/compass/README.md` - User guide
- `/root/COMPASS_IMPLEMENTATION_SUMMARY.md` - Technical details

**2. Interactive Learning**:
```bash
# Built-in guide
compass quickstart

# Help system
compass --help
compass service --help
compass provider --help

# Examples
compass examples
```

**3. Video Walkthrough** (Create this):
- 5-minute quick start
- 15-minute common workflows
- 30-minute deep dive

**4. Cheat Sheet** (Create one-pager):
```
┌─────────────────────────────────────────┐
│     COMPASS QUICK REFERENCE             │
├─────────────────────────────────────────┤
│ Check Health:                           │
│   compass diagnose system               │
│                                         │
│ Restart Service:                        │
│   compass service restart X --safe      │
│                                         │
│ Fix Port Conflict:                      │
│   compass port conflicts --auto-fix     │
│                                         │
│ Switch Provider:                        │
│   compass provider migrate voyage jina  │
│                                         │
│ Backup Database:                        │
│   compass db backup X --compress        │
└─────────────────────────────────────────┘
```

---

## ✅ Best Practices

### DO's

1. ✅ **Always use `--safe` flag for restarts** in production
   ```bash
   compass service restart ai-proxy --safe
   ```

2. ✅ **Run diagnostics before major changes**
   ```bash
   compass diagnose system
   ```

3. ✅ **Backup databases before migrations**
   ```bash
   compass db backup wowtruck --compress
   ```

4. ✅ **Use `--validate` when switching providers**
   ```bash
   compass provider switch jina --validate
   ```

5. ✅ **Check logs when troubleshooting**
   ```bash
   compass service logs ai-proxy -n 100
   ```

6. ✅ **Auto-fix port conflicts before restarts**
   ```bash
   compass port conflicts --auto-fix
   ```

7. ✅ **Publish documentation regularly**
   ```bash
   compass publish auto /root
   ```

### DON'Ts

1. ❌ **Don't skip health checks after restarts**
   - COMPASS does this automatically with `--safe`

2. ❌ **Don't force operations without understanding**
   - Use `--force` only when you know what you're doing

3. ❌ **Don't ignore warnings**
   - Yellow warnings indicate potential issues

4. ❌ **Don't restart multiple services simultaneously**
   - Restart one at a time to avoid cascading failures

5. ❌ **Don't bypass ankr-ctl**
   - COMPASS wraps ankr-ctl properly - use it

6. ❌ **Don't delete backups manually**
   - COMPASS manages 7-day retention automatically

---

## 🔍 Troubleshooting

### Common Issues

#### Issue 1: Command Not Found

**Error**: `compass: command not found`

**Solution**:
```bash
# Re-link globally
cd /root/ankr-labs-nx/packages/@ankr/compass
npm link

# Verify
which compass
compass --version
```

#### Issue 2: Service Won't Restart

**Error**: Service fails health check after restart

**Diagnosis**:
```bash
# Check service logs
compass service logs ai-proxy -n 50

# Check port status
compass port check 4444

# Run diagnostics
compass diagnose service ai-proxy
```

**Solutions**:
- If port conflict: `compass port kill 4444 --force`
- If config error: Check service configuration
- If dependency issue: Check database/other services

#### Issue 3: Provider Switch Fails

**Error**: Provider validation fails

**Diagnosis**:
```bash
# Check API key
echo $JINA_API_KEY

# Validate manually
compass provider validate jina
```

**Solutions**:
```bash
# Set API key if missing
export JINA_API_KEY="your-key-here"

# Or add to credentials file
echo "JINA_API_KEY=your-key" >> /root/.ankr/config/credentials.env

# Retry
compass provider switch jina --validate
```

#### Issue 4: Database Backup Fails

**Error**: Permission denied or connection refused

**Diagnosis**:
```bash
# Check database status
compass db status wowtruck

# Check PostgreSQL is running
systemctl status postgresql
```

**Solutions**:
- Start PostgreSQL if stopped
- Check credentials in `/root/.ankr/config/databases.json`
- Ensure backup directory has write permissions

#### Issue 5: Slow Performance

**Symptoms**: Commands take long time to execute

**Diagnosis**:
```bash
# Check system resources
htop

# Check database connections
compass db status
```

**Solutions**:
- Close unnecessary database connections
- Restart slow services
- Check for resource exhaustion

---

## 📊 Monitoring & Metrics

### Track COMPASS Usage

**Create usage log**:
```bash
# Add to your .bashrc or .zshrc
alias compass='compass "$@" && echo "$(date) - compass $@" >> /var/log/compass-usage.log'
```

**Analyze usage**:
```bash
# Most used commands
cat /var/log/compass-usage.log | awk '{print $4}' | sort | uniq -c | sort -rn

# Usage over time
cat /var/log/compass-usage.log | cut -d'-' -f1 | uniq -c
```

### Success Metrics

**Track these KPIs**:
1. **Time to resolve port conflicts**: Before vs After COMPASS
2. **Service restart success rate**: Should be >95% with `--safe`
3. **Cost savings**: $1,440/year if migrating from Voyage
4. **Mean time to recovery (MTTR)**: Reduce by 40-50%
5. **Manual intervention rate**: Should decrease over time

---

## 🎯 Next Steps

### For New Users
1. ✅ Run `compass quickstart`
2. ✅ Try common workflows above
3. ✅ Join training session (Level 1)
4. ✅ Use COMPASS for 1 week
5. ✅ Share feedback

### For Power Users
1. ✅ Complete Level 2 training
2. ✅ Add COMPASS to daily routine
3. ✅ Create custom commands for your workflow
4. ✅ Train 2-3 team members
5. ✅ Contribute improvements

### For Contributors
1. ✅ Complete Level 3 training
2. ✅ Review source code
3. ✅ Add features for Phase 2
4. ✅ Improve documentation
5. ✅ Help maintain codebase

---

## 📞 Support

**Get Help**:
- `compass --help` - Built-in help
- `/root/COMPASS_INDEX.md` - Documentation index
- GitHub Issues - Report bugs

**Ask Questions**:
- Team chat/Slack
- Weekly COMPASS office hours (TBD)
- Documentation contributions welcome

---

**Remember**: COMPASS is a tool to reduce cognitive load and enable self-service. Don't be afraid to use it - it has safety guardrails built in!

**Jai Guru Ji** 🙏

---

*This guide is continuously updated. Last update: 2026-02-12*
*Feedback: Create issues or submit PRs to improve this guide*
