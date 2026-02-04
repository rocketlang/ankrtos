#!/bin/bash

# Safe Swap Increase Script
# Increases swap from 4GB to 12GB total (adds 8GB)

set -e  # Exit on error

echo "=========================================="
echo "Swap Space Increase Script"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "ERROR: This script must be run as root"
    exit 1
fi

# Show current status
echo "Current memory status:"
free -h
echo ""
echo "Current swap devices:"
swapon --show
echo ""

# Check available disk space
AVAILABLE_SPACE=$(df / | tail -1 | awk '{print $4}')
REQUIRED_SPACE=$((8 * 1024 * 1024))  # 8GB in KB

if [ "$AVAILABLE_SPACE" -lt "$REQUIRED_SPACE" ]; then
    echo "ERROR: Not enough disk space. Need 8GB, have $(($AVAILABLE_SPACE / 1024 / 1024))GB available"
    exit 1
fi

echo "Available disk space: $(($AVAILABLE_SPACE / 1024 / 1024))GB"
echo ""

# Confirm action
read -p "This will create an 8GB swap file (/swapfile2). Continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted by user"
    exit 0
fi

echo ""
echo "Step 1: Creating 8GB swap file (this may take a few minutes)..."
dd if=/dev/zero of=/swapfile2 bs=1M count=8192 status=progress

echo ""
echo "Step 2: Setting proper permissions..."
chmod 600 /swapfile2

echo ""
echo "Step 3: Setting up swap area..."
mkswap /swapfile2

echo ""
echo "Step 4: Enabling new swap file..."
swapon /swapfile2

echo ""
echo "Step 5: Making swap persistent (adding to /etc/fstab)..."
# Check if already in fstab
if ! grep -q "/swapfile2" /etc/fstab; then
    echo '/swapfile2 none swap sw 0 0' >> /etc/fstab
    echo "Added to /etc/fstab"
else
    echo "/swapfile2 already in /etc/fstab"
fi

echo ""
echo "Step 6: Optimizing swappiness (60 -> 10)..."
sysctl vm.swappiness=10

# Make swappiness persistent
if ! grep -q "vm.swappiness" /etc/sysctl.conf; then
    echo 'vm.swappiness=10' >> /etc/sysctl.conf
    echo "Added swappiness setting to /etc/sysctl.conf"
else
    sed -i 's/^vm.swappiness=.*/vm.swappiness=10/' /etc/sysctl.conf
    echo "Updated swappiness in /etc/sysctl.conf"
fi

echo ""
echo "Step 7: Optimizing cache pressure..."
sysctl vm.vfs_cache_pressure=50
if ! grep -q "vm.vfs_cache_pressure" /etc/sysctl.conf; then
    echo 'vm.vfs_cache_pressure=50' >> /etc/sysctl.conf
fi

echo ""
echo "=========================================="
echo "SUCCESS! Swap increase complete"
echo "=========================================="
echo ""
echo "New memory status:"
free -h
echo ""
echo "New swap devices:"
swapon --show
echo ""
echo "Settings applied:"
echo "  - Swappiness: $(cat /proc/sys/vm/swappiness)"
echo "  - VFS Cache Pressure: $(cat /proc/sys/vm/vfs_cache_pressure)"
echo ""
echo "These settings will persist across reboots."
echo ""
echo "To monitor swap usage: watch -n 2 free -h"
echo "=========================================="
