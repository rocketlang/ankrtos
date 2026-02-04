#!/bin/bash
echo "Rolling back to PM2..."
/root/ankr-ctl stop
pm2 resurrect
pm2 status
echo "Rollback complete!"
