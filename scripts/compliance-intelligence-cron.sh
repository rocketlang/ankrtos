#!/bin/bash
# Compliance Intelligence Daily Cron
# Jai Guru Ji!

LOG_FILE="/var/log/compliance-intelligence.log"
API_BASE="https://compliance.ankr.digital"

echo "[$(date)] Starting compliance intelligence processing..." >> $LOG_FILE

# Process CA suggestions (auto-apply where 3+ agree)
echo "[$(date)] Processing CA suggestions..." >> $LOG_FILE
curl -s -X POST "$API_BASE/api/v2/admin/suggestions/process" >> $LOG_FILE

# Get daily summary
echo "" >> $LOG_FILE
echo "[$(date)] Daily Summary:" >> $LOG_FILE
curl -s "$API_BASE/api/v2/admin/summary/daily" >> $LOG_FILE

echo "" >> $LOG_FILE
echo "[$(date)] Processing complete." >> $LOG_FILE
