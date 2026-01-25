# E2E Network - Add Block Storage Volume

## Quick Reference
**Current Disk:** 140GB (95% full - 7.9GB free)
**Recommended:** Add 100GB-200GB block volume
**Cost:** ~₹600-1200/month for SSD

---

## Step 1: Login to E2E Console

1. Go to: https://myaccount.e2enetworks.com
2. Login with your credentials
3. Navigate to **Compute** section

---

## Step 2: Create New Volume

### In E2E Console:

1. **Click:** Compute → Block Storage → **Create Volume**

2. **Fill Details:**
   ```
   Volume Name:     ankr-storage-01
   Size:           100 GB (or 200 GB)
   Volume Type:    SSD
   Availability Zone: Same as your server (check server details)
   ```

3. **Click:** Create Volume

4. **Wait:** ~1-2 minutes for volume creation

---

## Step 3: Attach Volume to Server

1. **Find Volume:** In Block Storage list, find `ankr-storage-01`

2. **Click:** Actions → **Attach to Instance**

3. **Select Server:** Choose your server (e102-29 or similar)

4. **Click:** Attach

5. **Note:** Volume will appear as `/dev/vdb` (or `/dev/vdc` if vdb exists)

---

## Step 4: Format and Mount (SSH into server)

### A. Check New Disk Appeared

```bash
# List all disks
lsblk

# You should see something like:
# vdb    253:16   0  100G  0 disk
```

### B. Format the Disk

```bash
# Format as ext4 filesystem
sudo mkfs.ext4 /dev/vdb

# Output should show:
# Creating filesystem with ... blocks
# Done!
```

### C. Create Mount Point

```bash
# Create directory for mount
sudo mkdir -p /mnt/storage

# Verify it was created
ls -la /mnt/
```

### D. Mount the Volume

```bash
# Mount the new volume
sudo mount /dev/vdb /mnt/storage

# Verify it's mounted
df -h /mnt/storage

# Should show 100GB available
```

### E. Auto-Mount on Boot

```bash
# Get UUID of the volume
sudo blkid /dev/vdb

# Example output:
# /dev/vdb: UUID="abc123-def456..." TYPE="ext4"

# Add to fstab (replace UUID with yours)
echo "UUID=abc123-def456-... /mnt/storage ext4 defaults 0 2" | sudo tee -a /etc/fstab

# OR use device name (simpler but less reliable)
echo "/dev/vdb /mnt/storage ext4 defaults 0 2" | sudo tee -a /etc/fstab

# Test fstab works
sudo umount /mnt/storage
sudo mount -a

# Verify
df -h /mnt/storage
```

---

## Step 5: Move Data to New Volume

### Option A: Move Docker (Frees 11GB on root)

```bash
# Stop Docker
sudo systemctl stop docker

# Move Docker data
sudo mv /var/lib/docker /mnt/storage/docker

# Create symlink
sudo ln -s /mnt/storage/docker /var/lib/docker

# Start Docker
sudo systemctl start docker

# Verify Docker works
docker ps
```

### Option B: Move Verdaccio (Frees 4.2GB)

```bash
# Stop Verdaccio first
pkill -f verdaccio

# Move storage
sudo mv /root/verdaccio-storage /mnt/storage/verdaccio-storage

# Create symlink
ln -s /mnt/storage/verdaccio-storage /root/verdaccio-storage

# Restart Verdaccio
npm exec verdaccio --config /root/.config/verdaccio/config.yaml &
```

### Option C: Move Project Files

```bash
# Move ankr-labs-nx to new volume
sudo mv /root/ankr-labs-nx /mnt/storage/ankr-labs-nx

# Create symlink
ln -s /mnt/storage/ankr-labs-nx /root/ankr-labs-nx

# Verify projects still work
cd /root/ankr-labs-nx
ls -la
```

### Option D: Use for New Data Only

```bash
# Set permissions
sudo chown -R $USER:$USER /mnt/storage

# Create directories
mkdir -p /mnt/storage/uploads
mkdir -p /mnt/storage/backups
mkdir -p /mnt/storage/logs

# Update app configs to use /mnt/storage/uploads
```

---

## Step 6: Verify Everything Works

```bash
# Check disk space
df -h

# Should see:
# /dev/vda2   140G  132G  7.9G  95% /
# /dev/vdb    100G  1.0G   94G   2% /mnt/storage

# Check mount persists after reboot
sudo reboot

# After reboot, check again
df -h /mnt/storage
```

---

## Troubleshooting

### Volume Not Showing After Attach

```bash
# Rescan SCSI bus
echo "- - -" | sudo tee /sys/class/scsi_host/host*/scan

# Check dmesg
dmesg | tail -20

# List all block devices
lsblk -f
```

### Wrong Permissions

```bash
# Fix ownership
sudo chown -R $USER:$USER /mnt/storage

# Fix permissions
sudo chmod -R 755 /mnt/storage
```

### Symlink Not Working

```bash
# Check if symlink exists
ls -la /root/verdaccio-storage

# Should show: verdaccio-storage -> /mnt/storage/verdaccio-storage

# Recreate if broken
rm /root/verdaccio-storage
ln -s /mnt/storage/verdaccio-storage /root/verdaccio-storage
```

### Mount Fails After Reboot

```bash
# Check fstab syntax
cat /etc/fstab | grep storage

# Test mounting
sudo mount -a

# If error, fix fstab and try again
sudo nano /etc/fstab
```

---

## Quick Commands Reference

```bash
# Check disk space
df -h

# List all disks
lsblk

# Check what's using space
du -sh /mnt/storage/*

# Check mount points
mount | grep storage

# Unmount (if needed)
sudo umount /mnt/storage

# Remount
sudo mount /mnt/storage
```

---

## Cost Estimate (E2E Network)

| Size | Type | Monthly Cost |
|------|------|--------------|
| 50 GB | SSD | ~₹300 |
| 100 GB | SSD | ~₹600 |
| 200 GB | SSD | ~₹1200 |
| 500 GB | SSD | ~₹3000 |

**Note:** Prices approximate, check E2E console for exact pricing

---

## What to Move First

**Priority 1 (Immediate relief):**
- Docker data: 11GB freed

**Priority 2 (Nice to have):**
- Verdaccio: 4.2GB freed
- Old project archives

**Priority 3 (Future growth):**
- Use for new uploads
- Database backups
- Log files

---

## Security Notes

- ✅ Volume is encrypted at rest
- ✅ Only accessible from attached server
- ✅ Snapshots available for backups
- ✅ Can be detached and reattached
- ⚠️ Not automatically backed up (enable snapshots!)

---

## Backup Strategy

```bash
# Take snapshot in E2E console
# Compute → Block Storage → Select Volume → Create Snapshot

# Or backup via rsync
rsync -av /mnt/storage/ /backup/storage-$(date +%Y%m%d)/
```

---

## Summary

1. ✅ Create volume in E2E console
2. ✅ Attach to server
3. ✅ Format as ext4
4. ✅ Mount to /mnt/storage
5. ✅ Add to fstab for auto-mount
6. ✅ Move Docker/Verdaccio/Projects
7. ✅ Verify after reboot

**Result:** 100GB+ free space, room to grow! 🚀

---

**Generated:** 2026-01-23
**Server:** e2e-102-29
**Current Usage:** 95% (7.9GB free)
**After Volume:** <50% (107GB+ free)
