#!/bin/bash

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║   ✅ ANKR SYSTEM MAINTENANCE & AUTOMATION COMPLETE             ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# System Status
echo "📊 SYSTEM STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
df -h / | awk 'NR==2 {printf "   Disk:   %s used of %s (%s)\n", $3, $2, $5}'
free -h | awk 'NR==2 {printf "   Memory: %s used of %s\n", $3, $2}'
free -h | awk 'NR==3 {printf "   Swap:   %s used of %s\n", $3, $2}'
echo "   Active Services: $(ps aux | grep -E '(node|postgres|redis)' | grep -v grep | wc -l) processes"
echo ""

# Storage Cleanup Summary
echo "🧹 CLEANUP SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   ✅ Freed 4GB disk space (94% → 92%)"
echo "   ✅ NPM cache: 3.9GB → 243MB"
echo "   ✅ Bun cache: 30MB → 0MB"
echo "   ✅ Removed backup files and logs"
echo "   ✅ Organized archives"
echo ""

# Cron Jobs Summary
echo "⏰ AUTOMATED JOBS INSTALLED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Daily Jobs:"
echo "   • 1:00 AM - Disk usage monitor"
echo "   • 2:00 AM - Temp files cleanup"
echo "   • 3:00 AM - Log rotation"
echo ""
echo "   Weekly Jobs (Sunday):"
echo "   • 4:00 AM - NPM cache cleanup (2-4 GB)"
echo "   • 5:00 AM - Git repos cleanup (100-300 MB)"
echo "   • 6:00 AM - Docker cleanup (1-5 GB)"
echo ""
echo "   Expected Weekly Savings: 3-10 GB"
echo ""

# Active Alerts
echo "⚠️  ACTIVE ALERTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "/root/.ankr/alerts/disk-usage.alert" ]; then
    echo "   ⚠️  Disk usage at 92% (threshold: 90%)"
    echo "   📊 Top directories:"
    du -sh /root/* 2>/dev/null | sort -rh | head -5 | sed 's/^/      /'
else
    echo "   ✅ No active alerts"
fi
echo ""

# Quick Commands
echo "🎯 QUICK COMMANDS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   View cron jobs:      crontab -l | grep ANKR-CLEANUP"
echo "   Check disk alerts:   cat /root/.ankr/alerts/disk-usage.alert"
echo "   View cleanup logs:   tail -f /var/log/ankr-*.log"
echo "   Test cleanup:        /root/.ankr/scripts/cleanup-npm-cache.sh"
echo ""

# Documentation
echo "📚 DOCUMENTATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   System Report:       /root/SYSTEM-STATUS-REPORT.md"
echo "   Cron Jobs:           /root/.ankr/docs/CRON-JOBS.md"
echo "   Installation:        /root/CRON-JOBS-INSTALLED.md"
echo "   Cleanup Summary:     /root/CLEANUP-SUMMARY.sh"
echo ""

# Next Steps
echo "⚡ RECOMMENDED NEXT STEPS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   1. Monitor disk usage: df -h /"
echo "   2. Consider rebooting to clear swap (9GB/11GB used)"
echo "   3. Review ankr-labs-nx (12GB) for cleanup opportunities"
echo "   4. Archive old projects to external storage"
echo ""

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║   🎉 Your system will now maintain itself automatically!       ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
