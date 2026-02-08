#!/bin/bash
# Setup daily cron job for AIS stats computation

CRON_JOB="0 2 * * * npm exec tsx /root/apps/ankr-maritime/backend/src/scripts/compute-daily-ais-stats.ts >> /tmp/ais-stats-daily.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "compute-daily-ais-stats.ts"; then
    echo "✅ Cron job already exists"
else
    # Add cron job
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "✅ Daily AIS stats cron job installed"
    echo "📅 Runs at 2 AM daily"
fi

# Show current crontab
echo ""
echo "Current cron jobs:"
crontab -l | grep -E "ais-stats|AIS"
