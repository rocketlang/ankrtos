#!/bin/bash
# Storage alert system

THRESHOLD=75
VOLUME_PERCENT=$(df -h /mnt/ais-storage | awk 'NR==2 {print $5}' | sed 's/%//')

if [ "$VOLUME_PERCENT" -gt "$THRESHOLD" ]; then
    MESSAGE="⚠️ ALERT: AIS storage at ${VOLUME_PERCENT}% (threshold: ${THRESHOLD}%)"

    # Log alert
    echo "$(date): $MESSAGE" >> /var/log/storage-alerts.log

    # You can add notifications here:
    # - Send email
    # - Slack webhook
    # - SMS via Twilio
    # - Telegram bot

    echo "$MESSAGE"

    # Auto-cleanup if > 85%
    if [ "$VOLUME_PERCENT" -gt 85 ]; then
        echo "Running emergency cleanup..."
        /root/disk-cleanup.sh >> /var/log/emergency-cleanup.log 2>&1
    fi
fi
