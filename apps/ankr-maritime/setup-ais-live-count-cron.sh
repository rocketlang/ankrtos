#!/bin/bash
# Setup cron job to update AIS live count every 15 minutes

CRON_JOB="*/15 * * * * cd /root/apps/ankr-maritime/backend && /usr/bin/npx tsx src/scripts/update-ais-live-count.ts >> /var/log/ankr-maritime/ais-live-count.log 2>&1"

# Create log directory
sudo mkdir -p /var/log/ankr-maritime
sudo chown root:root /var/log/ankr-maritime

# Add to crontab if not already present
(crontab -l 2>/dev/null | grep -F "update-ais-live-count.ts") && {
    echo "✅ Cron job already exists"
} || {
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "✅ Cron job added: Update AIS live count every 15 minutes"
}

# Show current cron jobs
echo ""
echo "Current AIS-related cron jobs:"
crontab -l | grep -E "ais|maritime" || echo "  (none)"
