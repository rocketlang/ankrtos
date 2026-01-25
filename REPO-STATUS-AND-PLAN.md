# ANKR Repositories - Status & Update Plan 📦

**Date:** January 25, 2026
**Purpose:** Manage all ANKR-related git repositories

---

## 📊 Current Repository Status

### ✅ Clean Repositories (Up to Date)

| Repository | Status | Remote |
|------------|--------|--------|
| **ankr-sandbox-repo** | ✅ Clean, up to date | git@github.com:rocketlang/ankr-sandbox.git |
| **ankr-skill-loader** | ✅ Clean, up to date | git@github.com:rocketlang/ankr-skill-loader.git |
| **bani-repo** | ✅ Clean, up to date | git@github.com:rocketlang/bani.git |
| **everpure-whatsapp-bot** | ✅ Clean, up to date | git@github.com:rocketlang/everpure-whatsapp-bot.git |

---

### ⚠️ Repositories with Uncommitted Changes

| Repository | Changes | Notes |
|------------|---------|-------|
| **/root** | Modified: PRATHAM-MONDAY-PRESENTATION.md, TESTERBOT-TODO.md<br>Deleted: ankr-bfc/* (many files) | Main working directory |
| **ankr-ai-gateway** | Modified: package.json<br>Untracked: node_modules/, package-lock.json | Package updates |
| **ankrcode-project** | Modified: several core files<br>Untracked: 5+ new .md docs | Active development |
| **ankr-labs-nx** | Modified: ankr-knowledge/package.json<br>Untracked: services/ | On branch: fix/wowtruck-prisma-schema<br>**No upstream!** |
| **ankr-universe** | Modified: tool-executor, pnpm-lock.yaml<br>Untracked: .github workflows | **⬆️ AHEAD by 46 commits!** |
| **openclaude-ide** | Modified: package files<br>Untracked: many .md docs | **No remote configured!** |
| **power-erp** | Modified: 10+ files | On branch: claude/build-erp-system-dA17U |
| **swayam** | Modified: api files, package.json | Multiple API updates |

---

### 🚨 Critical Issues

1. **ankr-universe** - 46 commits ahead (needs to push!)
2. **openclaude-ide** - No remote configured
3. **ankr-labs-nx** - On branch without upstream

---

## 📋 Repositories to Clone/Check

### Currently Cloned (12 repositories):
1. ✅ /root (main)
2. ✅ ankr-ai-gateway
3. ✅ ankrcode-project
4. ✅ ankr-labs-nx
5. ✅ ankr-sandbox-repo
6. ✅ ankr-skill-loader
7. ✅ ankr-universe
8. ✅ bani-repo
9. ✅ everpure-whatsapp-bot
10. ✅ openclaude-ide
11. ✅ power-erp
12. ✅ swayam

### Missing/Potential Additional Repositories:

**Check if these exist and should be cloned:**
- ❓ ankr-mcp (MCP server)
- ❓ rocketlang (DSL project)
- ❓ ankr-landing (main website - may be in /var/www)
- ❓ testerbot (may be in packages/)
- ❓ ankrshield-central
- ❓ complymitra
- ❓ ankrtms (WowTruck TMS)

---

## 🛠️ Management Tools Created

### 1. **check-all-repos.sh**
**Location:** `/root/check-all-repos.sh`

**Usage:**
```bash
bash /root/check-all-repos.sh
```

**What it does:**
- Lists all repositories
- Shows remote URLs
- Shows current branch
- Checks for uncommitted changes
- Checks if ahead/behind remote

---

### 2. **repo-manager.sh** (NEW)
**Location:** `/root/repo-manager.sh`

**Usage:**
```bash
bash /root/repo-manager.sh
```

**What it does:**
- Clones missing repositories
- Updates existing repositories (if clean)
- Skips repos with uncommitted changes
- Shows final summary

**Repositories managed:**
```bash
# Core ANKR
- ankr-landing
- ankr-labs-nx
- ankr-ai-gateway
- ankr-universe
- ankr-sandbox-repo
- ankr-skill-loader

# Projects
- ankrcode-project
- openclaude-ide
- bani-repo
- swayam
- power-erp
- everpure-whatsapp-bot
```

---

## 📝 Recommended Actions

### **Phase 1: Git Commits (Do Later as User Requested)**

#### For /root:
```bash
cd /root
git add .
git commit -m "docs: Add ANKR Platform documentation and mobile responsive fixes

- Published 10 comprehensive documents for ANKR LMS platform
- Added Pratham-focused guides (English & Hindi)
- Added presentation slides and executive summary
- Fixed mobile responsive issues (search bar, overflow)
- Updated testerbot todos
- Removed ankr-bfc (old project)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

#### For ankr-universe (⚠️ Priority - 46 commits ahead!):
```bash
cd /root/ankr-universe
git add .
git commit -m "feat: Update orchestration and CI/CD workflows

- Updated tool executor
- Added comprehensive GitHub workflows
- Updated dependencies

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
git push origin main
```

#### For ankrcode-project:
```bash
cd /root/ankrcode-project
git add .
git commit -m "docs: Add comprehensive project documentation

- Added ANKRCODE-COMPLETE-SPEC.md
- Added ANKRCODE-ECOSYSTEM.md
- Added ALE-AGENT-PLAN.md
- Updated core tools

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

#### For ankr-labs-nx:
```bash
cd /root/ankr-labs-nx
# Set upstream first
git push -u origin fix/wowtruck-prisma-schema

# Then commit
git add .
git commit -m "feat: Add ankr-knowledge services

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

#### For openclaude-ide (fix remote first):
```bash
cd /root/openclaude-ide
git remote add origin git@github.com:rocketlang/openclaude-ide.git

git add .
git commit -m "docs: Add comprehensive documentation

- Added ANKR-PUBLISH-COMPLETE.md
- Added CODE-WIKI.md, DEPLOYMENT.md
- Added LAYMAN-GUIDE.md
- Updated package files

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
git push -u origin master
```

#### For other repos (ankr-ai-gateway, power-erp, swayam):
```bash
# Review changes first, then commit with appropriate messages
```

---

### **Phase 2: Clone/Update Repositories**

```bash
# Run the repo manager
bash /root/repo-manager.sh
```

This will:
1. Clone any missing repositories
2. Update clean repositories
3. Skip repositories with uncommitted changes

---

### **Phase 3: Check for Additional Repos**

**Check GitHub for any missing repos:**
```bash
# List all rocketlang repos on GitHub
gh repo list rocketlang --limit 100
```

**Or check manually:**
- Visit: https://github.com/rocketlang
- Identify any repos not yet cloned
- Add to `repo-manager.sh` if needed

---

## 🎯 Quick Commands

### Check Status:
```bash
bash /root/check-all-repos.sh
```

### Update All Repos:
```bash
bash /root/repo-manager.sh
```

### Commit All (when ready):
```bash
# Create a script to commit all at once
cat > /root/commit-all.sh << 'SCRIPT'
#!/bin/bash
# Commits to be run when user is ready

repos=(
    "/root"
    "/root/ankr-universe"
    "/root/ankrcode-project"
    "/root/ankr-labs-nx"
    "/root/openclaude-ide"
    "/root/ankr-ai-gateway"
    "/root/power-erp"
    "/root/swayam"
)

for repo in "${repos[@]}"; do
    echo "Committing: $repo"
    cd "$repo"
    # Add commit command here when messages are ready
done
SCRIPT
```

---

## 📊 Summary

**Total Repositories:** 12 cloned
**Clean & Updated:** 4 repos ✅
**Needs Commit:** 8 repos ⚠️
**Critical (ahead of remote):** 1 repo (ankr-universe) 🚨
**Missing Remote:** 1 repo (openclaude-ide) 🚨

---

## 🚀 Next Steps

1. **Now:** Run `bash /root/repo-manager.sh` to update/clone repos
2. **Later:** Commit all changes when ready (user requested to do this later)
3. **Check:** Verify if any GitHub repos are missing locally

---

*Created: January 25, 2026*
*ANKR Repository Management*
