#!/bin/bash
# Setup AIS Data Cleanup Cron Job
# Run this once to enable automatic 7-day data cleanup

echo "🔧 Setting up AIS data cleanup cron job..."

# Create log directory
mkdir -p /var/log/mari8x
touch /var/log/mari8x-cleanup.log
chmod 666 /var/log/mari8x-cleanup.log

# Add cron job (runs daily at 2 AM)
CRON_JOB="0 2 * * * cd /root/apps/ankr-maritime/backend && npx tsx src/jobs/cleanup-old-ais-data.ts >> /var/log/mari8x-cleanup.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "cleanup-old-ais-data"; then
    echo "⚠️  Cron job already exists"
else
    # Add to crontab
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "✅ Cron job added"
fi

# Show current crontab
echo ""
echo "📋 Current crontab:"
crontab -l | grep mari8x

echo ""
echo "✅ Setup complete!"
echo ""
echo "📊 Test the cleanup job manually:"
echo "   npx tsx src/jobs/cleanup-old-ais-data.ts"
echo ""
echo "📝 View cleanup logs:"
echo "   tail -f /var/log/mari8x-cleanup.log"
echo ""
echo "🔍 List all cron jobs:"
echo "   crontab -l"
echo ""
echo "❌ Remove cron job:"
echo "   crontab -e  # Then delete the line"
