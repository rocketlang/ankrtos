# Storage Migration Plan - Move Data to /mnt/storage

**Mounted Storage:** `/mnt/storage` (vdb)
- **Total:** 92GB
- **Used:** 62GB
- **Free:** 26GB available

**Main Disk:** `/` (vda2)
- **Total:** 187GB
- **Used:** 171GB (92%)
- **Free:** 16GB

## 🎯 Migration Targets (Recommended)

### High Priority - Large Space Savings

| Directory | Size | Savings | Safe to Move? |
|-----------|------|---------|---------------|
| `/root/ankr-labs-nx/node_modules` | 6.3GB | ✅ Yes | ✅ Yes - Can rebuild |
| `/root/packages` | 758MB | ✅ Yes | ⚠️  Check if active |
| `/root/swayam` | 497MB | ✅ Yes | ⚠️  Check if active |
| `/root/backups` | 248MB | ✅ Yes | ✅ Yes - Archive data |

**Subtotal: ~7.8 GB**

### Medium Priority - Inactive Projects

| Directory | Size | Notes |
|-----------|------|-------|
| `/root/vibe-react-app` | 105MB | Old project |
| `/root/vibe-api-server` | 103MB | Old project |
| `/root/ankrshield-central-api` | 73MB | Inactive |
| `/root/ankr-viewer-wrapper` | 47MB | Inactive |
| `/root/ankr-labs-nx/backups` | 824KB | Backups |

**Subtotal: ~328 MB**

### Low Priority - Build Artifacts

| Directory | Size | Notes |
|-----------|------|-------|
| `/root/ankr-labs-nx/forge-results` | 6.8MB | Build results |
| `/root/ankr-labs-nx/ankr-shell-current.zip` | 6.2MB | Archive |

**Subtotal: ~13 MB**

## 📊 Total Expected Savings

**Total Space to Free:** ~8.2 GB
**Post-Migration Disk Usage:** 92% → ~87% (171GB → 163GB)

## 🚀 Migration Strategy

### Phase 1: Safe Moves (Backups & Archives)
- Move `/root/backups` → `/mnt/storage/ankr-data/backups`
- Move `/root/ankr-labs-nx/backups` → `/mnt/storage/ankr-data/backups/labs`
- Create symlinks for compatibility

### Phase 2: Inactive Projects
- Move old Vibe projects to `/mnt/storage/ankr-data/old-projects`
- Move ankrshield-central-api
- Move ankr-viewer-wrapper

### Phase 3: Large node_modules (Biggest Win!)
- Move `/root/ankr-labs-nx/node_modules` → `/mnt/storage/ankr-data/node_modules/labs`
- Create symlink: `/root/ankr-labs-nx/node_modules` → mounted storage
- Can rebuild anytime with `pnpm install` if issues arise

### Phase 4: Optional - Entire Projects
- Consider moving `/root/swayam` if inactive
- Consider moving `/root/packages` if not in active use

## ⚠️ Safety Considerations

1. **node_modules** - Safe to move, can rebuild with `pnpm install`
2. **Symlinks** - All moves will create symlinks for transparency
3. **Backups** - Keep crontab backup before migration
4. **Testing** - Verify builds work after migration

## 🔧 Migration Commands

### Option A: Interactive Migration (Recommended)
```bash
# Run in dry-run mode first
/root/.ankr/scripts/migrate-to-storage.sh --dry-run

# Execute migration
/root/.ankr/scripts/migrate-to-storage.sh --execute
```

### Option B: Manual Step-by-Step
See detailed commands below...

## 📋 Pre-Migration Checklist

- [ ] Verify mounted storage is accessible: `df -h /mnt/storage`
- [ ] Backup current crontab: `crontab -l > ~/crontab-backup.txt`
- [ ] Stop running services (optional): `ankr-ctl stop all`
- [ ] Verify free space on target: `df -h /mnt/storage`

## 📋 Post-Migration Verification

- [ ] Check symlinks: `ls -la /root/ankr-labs-nx/node_modules`
- [ ] Test builds: `cd /root/ankr-labs-nx && pnpm install`
- [ ] Verify disk usage: `df -h /`
- [ ] Check services: `ankr-ctl status`
