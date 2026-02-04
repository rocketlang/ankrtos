#!/bin/bash
# =============================================================================
# ANKR Services Health Check Script
# =============================================================================
# Monitors all services and alerts on failures
# Usage: ./ankr-health-check.sh [--quiet] [--webhook URL] [--email EMAIL]
# Cron:  */5 * * * * /root/ankr-health-check.sh --quiet >> /var/log/ankr-health.log 2>&1
# =============================================================================

LOG_FILE="/var/log/ankr-health.log"
STATE_FILE="/tmp/ankr-health-state.json"
WEBHOOK_URL=""
EMAIL=""
QUIET=false
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --quiet) QUIET=true; shift ;;
    --webhook) WEBHOOK_URL="$2"; shift 2 ;;
    --email) EMAIL="$2"; shift 2 ;;
    *) shift ;;
  esac
done

# Service definitions (port:name:endpoint)
SERVICES=(
  "4444:ai-proxy:/health"
  "4001:ankr-compliance-api:/health"
  "4010:ankr-crm-backend:/health"
  "4011:ankr-crm-bff:/health"
  "5177:ankr-crm-frontend:/"
  "4000:wowtruck-backend:/health"
  "7777:swayam-bani:/health"
  "7780:swayam-dashboard:/"
  "4002:saathi-server:/health"
  "4873:verdaccio:/-/ping"
  "4005:ankr-eon-api:/health"
  "4100:ankr-voice-service:/health"
  "4200:ankr-omega:/health"
  "4300:ankr-pulse:/"
  "3001:freightbox-frontend:/"
  "3002:erpbharat-api:/health"
  "4030:devbrain:/health"
)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

# Results
FAILED_SERVICES=()
RECOVERED_SERVICES=()
TOTAL=0
HEALTHY=0

# Load previous state
declare -A PREV_STATE
if [[ -f "$STATE_FILE" ]]; then
  while IFS=: read -r name status; do
    PREV_STATE["$name"]="$status"
  done < "$STATE_FILE"
fi

# New state
declare -A NEW_STATE

# Check each service
check_service() {
  local port=$1
  local name=$2
  local endpoint=$3

  local code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 --max-time 5 "http://localhost:$port$endpoint" 2>/dev/null)

  TOTAL=$((TOTAL + 1))

  if [[ "$code" =~ ^(200|301|302|307|308)$ ]]; then
    HEALTHY=$((HEALTHY + 1))
    NEW_STATE["$name"]="healthy"

    # Check if recovered
    if [[ "${PREV_STATE[$name]}" == "failed" ]]; then
      RECOVERED_SERVICES+=("$name ($port)")
    fi

    if [[ "$QUIET" == false ]]; then
      echo -e "${GREEN}✅${NC} $name ($port) - HTTP $code"
    fi
    return 0
  else
    NEW_STATE["$name"]="failed"
    FAILED_SERVICES+=("$name ($port) - HTTP $code")

    if [[ "$QUIET" == false ]]; then
      echo -e "${RED}❌${NC} $name ($port) - HTTP $code"
    fi
    return 1
  fi
}

# Send alert
send_alert() {
  local message=$1
  local title=$2

  # Webhook (Slack/Discord/etc)
  if [[ -n "$WEBHOOK_URL" ]]; then
    curl -s -X POST "$WEBHOOK_URL" \
      -H "Content-Type: application/json" \
      -d "{\"text\": \"$title\n$message\"}" > /dev/null 2>&1
  fi

  # Email (if mail command available)
  if [[ -n "$EMAIL" ]] && command -v mail &> /dev/null; then
    echo "$message" | mail -s "$title" "$EMAIL" 2>/dev/null
  elif [[ -n "$EMAIL" ]]; then
    echo "[$TIMESTAMP] EMAIL ALERT (mail not installed): $title - $message" >> "$LOG_FILE"
  fi

  # Always log
  echo "[$TIMESTAMP] ALERT: $title - $message" >> "$LOG_FILE"
}

# Main
main() {
  if [[ "$QUIET" == false ]]; then
    echo "=============================================="
    echo "  ANKR Health Check - $TIMESTAMP"
    echo "=============================================="
    echo ""
  fi

  # Check all services
  for service in "${SERVICES[@]}"; do
    IFS=: read -r port name endpoint <<< "$service"
    check_service "$port" "$name" "$endpoint"
  done

  # Save new state
  > "$STATE_FILE"
  for name in "${!NEW_STATE[@]}"; do
    echo "$name:${NEW_STATE[$name]}" >> "$STATE_FILE"
  done

  # Summary
  if [[ "$QUIET" == false ]]; then
    echo ""
    echo "=============================================="
    echo "  Summary: $HEALTHY/$TOTAL services healthy"
    echo "=============================================="
  fi

  # Alert on failures
  if [[ ${#FAILED_SERVICES[@]} -gt 0 ]]; then
    local fail_msg=$(printf '%s\n' "${FAILED_SERVICES[@]}")

    if [[ "$QUIET" == false ]]; then
      echo ""
      echo -e "${RED}FAILED SERVICES:${NC}"
      printf '%s\n' "${FAILED_SERVICES[@]}"
    fi

    send_alert "$fail_msg" "🔴 ANKR Alert: ${#FAILED_SERVICES[@]} service(s) DOWN"

    # Try to restart failed services via PM2
    for failed in "${FAILED_SERVICES[@]}"; do
      local svc_name=$(echo "$failed" | cut -d'(' -f1 | xargs)
      pm2 restart "$svc_name" > /dev/null 2>&1
      echo "[$TIMESTAMP] Auto-restart attempted: $svc_name" >> "$LOG_FILE"
    done
  fi

  # Alert on recovery
  if [[ ${#RECOVERED_SERVICES[@]} -gt 0 ]]; then
    local recover_msg=$(printf '%s\n' "${RECOVERED_SERVICES[@]}")
    send_alert "$recover_msg" "🟢 ANKR Alert: ${#RECOVERED_SERVICES[@]} service(s) RECOVERED"

    if [[ "$QUIET" == false ]]; then
      echo ""
      echo -e "${GREEN}RECOVERED SERVICES:${NC}"
      printf '%s\n' "${RECOVERED_SERVICES[@]}"
    fi
  fi

  # Log summary (quiet mode)
  if [[ "$QUIET" == true ]]; then
    if [[ ${#FAILED_SERVICES[@]} -gt 0 ]]; then
      echo "[$TIMESTAMP] Health: $HEALTHY/$TOTAL - FAILED: ${FAILED_SERVICES[*]}"
    else
      echo "[$TIMESTAMP] Health: $HEALTHY/$TOTAL - All OK"
    fi
  fi

  # Exit code
  if [[ ${#FAILED_SERVICES[@]} -gt 0 ]]; then
    exit 1
  fi
  exit 0
}

main
