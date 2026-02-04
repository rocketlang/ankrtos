#===============================================================================
# ANKR Aliases - Source this in .bashrc
# Add: source /root/.ankr/aliases.sh
#===============================================================================

# Help function
ankr-help() {
  echo ""
  echo "╔══════════════════════════════════════════════════════════════════════════════╗"
  echo "║                         ANKR ALIASES QUICK REFERENCE                          ║"
  echo "╚══════════════════════════════════════════════════════════════════════════════╝"
  echo ""
  echo "SERVICE MANAGEMENT:"
  echo "  ankr                    Full ankr-ctl access"
  echo "  ankr-status             Show all services status"
  echo "  ankr-start <service>    Start a service (or all if no arg)"
  echo "  ankr-stop <service>     Stop a service (or all if no arg)"
  echo "  ankr-restart <service>  Restart a service"
  echo "  ankr-health             Health check all services"
  echo "  ankr-logs <service>     Tail logs for a service"
  echo "  ankr-ports              Show port allocations"
  echo "  ankr-apps               Show apps with frontend/backend ports"
  echo "  ankr-env                Show injected env vars"
  echo ""
  echo "SYSTEMD (BOOT CONTROL):"
  echo "  ankr-up                 Start all services (systemd)"
  echo "  ankr-down               Stop all services (systemd)"
  echo "  ankr-boot-status        Check systemd service status"
  echo ""
  echo "QUICK LOGS:"
  echo "  ai-proxy-logs           AI Proxy logs"
  echo "  eon-logs                EON Memory logs"
  echo "  bani-logs               BANI Voice AI logs"
  echo "  wowtruck-logs           WowTruck backend logs"
  echo "  bfc-logs                BFC API logs"
  echo ""
  echo "DATABASE CONNECTIONS:"
  echo "  psql-eon                ankr_eon (port 5433, user: ankr)"
  echo "  psql-crm                ankr_crm (port 5432, user: postgres)"
  echo "  psql-compliance         compliance (port 5434, user: ankr)"
  echo "  psql-forge              ankrforge (port 5432, user: ankr)"
  echo ""
  echo "CONFIG FILES:"
  echo "  /root/.ankr/config/ports.json      Port assignments"
  echo "  /root/.ankr/config/services.json   Service definitions"
  echo ""
}
alias ankr-help='ankr-help'

# ankr-ctl shortcuts (absolute paths)
alias ankr='/root/ankr-ctl'
alias ankr-status='/root/ankr-ctl status'
alias ankr-start='/root/ankr-ctl start'
alias ankr-stop='/root/ankr-ctl stop'
alias ankr-restart='/root/ankr-ctl restart'
alias ankr-health='/root/ankr-ctl health'
alias ankr-logs='/root/ankr-ctl logs'
alias ankr-ports='/root/ankr-ctl ports'
alias ankr-apps='/root/ankr-ctl apps'
alias ankr-env='/root/ankr-ctl env'

# Quick views
alias apps='ankr-apps'
alias services='ankr-status'
alias ports='ankr-ports'

# systemd shortcuts
alias ankr-up='systemctl start ankr-services'
alias ankr-down='systemctl stop ankr-services'
alias ankr-boot-status='systemctl status ankr-services'

# Quick service shortcuts
alias ai-proxy-logs='/root/ankr-ctl logs ai-proxy'
alias eon-logs='/root/ankr-ctl logs ankr-eon'
alias bani-logs='/root/ankr-ctl logs swayam-bani'
alias wowtruck-logs='/root/ankr-ctl logs wowtruck-backend'
alias bfc-logs='/root/ankr-ctl logs bfc-api'

# Database shortcuts
alias psql-eon='psql -h localhost -p 5433 -U ankr -d ankr_eon'
alias psql-crm='psql -h localhost -p 5432 -U postgres -d ankr_crm'
alias psql-compliance='psql -h localhost -p 5434 -U ankr -d compliance'
alias psql-forge='psql -h localhost -p 5432 -U ankr -d ankrforge'

# PM2 disabled (use ankr-ctl)
alias pm2='echo "Use ankr-ctl instead of pm2. Run: ankr-status"'

echo "ANKR aliases loaded. Run 'ankr-status' to see services."
