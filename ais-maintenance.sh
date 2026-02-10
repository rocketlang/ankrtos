#!/bin/bash
# Daily AIS maintenance job

LOG_FILE="/var/log/ais-maintenance-$(date +%Y%m%d).log"

{
    echo "=== AIS Maintenance $(date) ==="

    # Run compression job
    psql -U postgres -d ankr_maritime -c "CALL run_job((SELECT job_id FROM timescaledb_information.jobs WHERE proc_name = 'policy_compression' AND hypertable_name = 'vessel_positions'));" 2>&1

    # Run retention job
    psql -U postgres -d ankr_maritime -c "CALL run_job((SELECT job_id FROM timescaledb_information.jobs WHERE proc_name = 'policy_retention' AND hypertable_name = 'vessel_positions'));" 2>&1

    # Analyze for query optimization
    psql -U postgres -d ankr_maritime -c "ANALYZE vessel_positions;" 2>&1

    echo "=== Maintenance complete ==="
} >> "$LOG_FILE" 2>&1
