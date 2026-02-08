# New AIS Storage Volume - Setup Guide

## 📋 What to Buy

**Recommended Specification:**
```
Volume Type:  SSD (General Purpose / GP3)
Size:         500GB (minimum 200GB)
Performance:  3000 IOPS, 125 MB/s throughput
```

**Why 500GB?**
- PostgreSQL: 34GB
- AIS Data (3 months, compressed): ~225GB
- Buffer: 240GB
- **Total after 3 months:** ~260GB (52% usage) ✅ Perfect!

## 💰 Cost

| Size | Monthly Cost | 3-Month Total |
|------|-------------|---------------|
| 200GB | $20-30 | $60-90 |
| 500GB | $50-75 | $150-225 |

**Recommendation:** 500GB for peace of mind

---

## 🚀 Setup Process

### Step 1: Order Volume from Cloud Provider

**Attach to your current server**
- Same region/availability zone
- Auto-attach on boot
- Format: Don't format (we'll do it)

### Step 2: After Volume is Attached

```bash
# Run the setup script
sudo /root/.ankr/scripts/setup-new-ais-volume.sh
```

**This will:**
1. Detect the new volume (e.g., /dev/vdc)
2. Format it with ext4
3. Mount at /mnt/ais-storage
4. Add to /etc/fstab for auto-mount
5. Set permissions

**Time:** 5 minutes
**Downtime:** None

### Step 3: Migrate PostgreSQL

```bash
# Move PostgreSQL to new volume
sudo /root/.ankr/scripts/migrate-postgres-to-new-volume.sh
```

**This will:**
1. Stop PostgreSQL (~2 min downtime)
2. Backup current data to /mnt/storage
3. Move 34GB to /mnt/ais-storage
4. Create symlink for transparency
5. Restart PostgreSQL
6. Verify everything works

**Time:** 10-15 minutes
**Downtime:** 5 minutes

---

## 📊 Expected Results

### Before:
```
Main Disk:       170GB/187GB (92%) - 17GB free ⚠️
/mnt/storage:    69GB/92GB (79%) - 19GB free
PostgreSQL:      34GB on main disk
AIS Data:        Growing, nowhere to go!
```

### After:
```
Main Disk:       136GB/187GB (73%) - 51GB free ✅ +34GB!
/mnt/storage:    69GB/92GB (79%) - 19GB free (unchanged)
/mnt/ais-storage: 34GB/500GB (7%) - 466GB free ✅ NEW!
PostgreSQL:      34GB on /mnt/ais-storage
AIS Data:        Has 466GB to grow into!
```

---

## 🎯 3-Month Projection

With 500GB volume:

```
Week 1:  PostgreSQL 34GB + AIS 10GB = 44GB (9% usage)
Month 1: PostgreSQL 34GB + AIS 75GB = 109GB (22% usage)
Month 2: PostgreSQL 34GB + AIS 150GB = 184GB (37% usage)
Month 3: PostgreSQL 34GB + AIS 225GB = 259GB (52% usage) ✅ Perfect!
```

After 3 months, you still have 240GB free for selective retention!

---

## 🔧 Alternative: 200GB Volume (Budget Option)

If you get 200GB instead:

```
Month 1: 109GB (55% usage) ✅ Good
Month 2: 184GB (92% usage) ⚠️ Tight
Month 3: 259GB (130%) ❌ Need to archive/compress aggressively
```

**With 200GB you MUST:**
- Enable compression (saves 50%)
- Archive data >60 days to S3
- Delete duplicates weekly

**Then:**
```
Month 3: 34GB (PG) + 112GB (AIS compressed) = 146GB (73% usage) ✅
```

---

## ✅ Benefits of New Volume

1. **Dedicated Storage:** No competition with other apps
2. **Easily Expandable:** Can grow to 1TB+ later
3. **Better Performance:** Can optimize mount options
4. **Clean Separation:** AIS data isolated
5. **Simple Management:** One place for all maritime data

---

## 📝 Post-Setup Tasks

After migration completes:

### 1. Verify Everything Works (Day 1)
```bash
# Check PostgreSQL
sudo systemctl status postgresql
sudo -u postgres psql -c "\l"

# Check AIS data collection
cd /root/apps/ankr-maritime/backend
npm run dev
```

### 2. Monitor Growth (Weekly)
```bash
# Add to weekly routine
df -h /mnt/ais-storage

# Or use
ankr-status
```

### 3. Cleanup Old Files (After 7 Days)
```bash
# If everything is stable, remove old PostgreSQL directory
sudo rm -rf /var/lib/postgresql.OLD

# Remove backup
sudo rm -rf /mnt/storage/postgres-backup-*
```

---

## 🆘 Troubleshooting

### Volume Not Showing Up
```bash
# List all block devices
lsblk

# Rescan for new volumes
sudo partprobe
```

### PostgreSQL Won't Start After Migration
```bash
# Check logs
sudo journalctl -u postgresql -n 100

# Common fix: permissions
sudo chown -R postgres:postgres /mnt/ais-storage/postgresql
sudo chmod 700 /mnt/ais-storage/postgresql/16/main
```

### Need to Rollback
```bash
# Stop PostgreSQL
sudo systemctl stop postgresql

# Remove symlink
sudo rm /var/lib/postgresql

# Restore old directory
sudo mv /var/lib/postgresql.OLD /var/lib/postgresql

# Start PostgreSQL
sudo systemctl start postgresql
```

---

## 💡 Pro Tips

1. **Take Snapshot Before Migration**
   - Most cloud providers offer volume snapshots
   - Take one before running migration

2. **Test During Low Traffic**
   - Run migration during off-hours
   - 5 min downtime for PostgreSQL

3. **Monitor After Migration**
   - Watch disk I/O for 24 hours
   - Ensure performance is good

4. **Plan for Growth**
   - Set up alerts at 80% usage
   - Review monthly with `ankr-status`

---

## 🎬 Ready to Proceed?

1. **Order Volume:** Contact cloud provider for 500GB SSD
2. **Wait for Attachment:** Usually 1-30 minutes
3. **Run Setup:** `/root/.ankr/scripts/setup-new-ais-volume.sh`
4. **Migrate PostgreSQL:** `/root/.ankr/scripts/migrate-postgres-to-new-volume.sh`
5. **Verify:** Test AIS data collection
6. **Celebrate:** You now have 466GB for growth! 🎉

---

**Questions? Issues?**
- Check logs: `/var/log/postgres-migration.log`
- Documentation: `/root/AIS-STORAGE-STRATEGY.md`
- Status: `ankr-status`
