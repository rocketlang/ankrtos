#!/bin/bash
# ============================================================================
# SWAYAM Service Management - Aliases & Commands
# Add this to your ~/.bashrc on the server (root@216.48.185.29)
# ============================================================================

# =============================================================================
# SWAYAM ALIASES - Copy everything below to ~/.bashrc
# =============================================================================

# ----------------------------------------------------------------------------
# SWAYAM QUICK COMMANDS
# ----------------------------------------------------------------------------

# Start Swayam (safe method - bypasses tsx)
alias swayam-start='cd /root/ankr-labs-nx/packages/bani && /usr/bin/node dist/server.js &'

# Start with pm2 (production)
alias swayam-pm2='pm2 start /root/ankr-labs-nx/ecosystem.bani.config.js'

# Stop Swayam
alias swayam-stop='pm2 stop bani-api 2>/dev/null; pkill -f "node.*bani.*server" 2>/dev/null; echo "✅ Swayam stopped"'

# Restart Swayam (build + restart)
alias swayam-restart='cd /root/ankr-labs-nx/packages/bani && npm run build && pm2 restart bani-api'

# Quick restart (no rebuild)
alias swayam-reload='pm2 restart bani-api'

# View logs
alias swayam-logs='pm2 logs bani-api --lines 50'
alias swayam-logs-live='pm2 logs bani-api'

# Health check
alias swayam-health='curl -s http://localhost:7777/health | jq . 2>/dev/null || curl -s http://localhost:7777/health'

# Status
alias swayam-status='pm2 show bani-api | grep -E "status|uptime|memory|restarts"'

# Build
alias swayam-build='cd /root/ankr-labs-nx/packages/bani && npm run build'

# Go to directory
alias swayam-cd='cd /root/ankr-labs-nx/packages/bani'

# ----------------------------------------------------------------------------
# OTHER SERVICES (Won't affect Swayam)
# ----------------------------------------------------------------------------

# AI Proxy
alias aiproxy-start='pm2 start ai-proxy'
alias aiproxy-stop='pm2 stop ai-proxy'
alias aiproxy-logs='pm2 logs ai-proxy --lines 30'

# Ankr Sandbox (code execution)
alias sandbox-start='pm2 start ankr-sandbox'
alias sandbox-stop='pm2 stop ankr-sandbox'
alias sandbox-logs='pm2 logs ankr-sandbox --lines 30'

# ----------------------------------------------------------------------------
# FULL STACK COMMANDS
# ----------------------------------------------------------------------------

# Start all Swayam-related services
swayam-all-start() {
    echo "🚀 Starting Swayam Stack..."
    pm2 start ai-proxy 2>/dev/null || echo "   ai-proxy already running or not configured"
    pm2 start ankr-sandbox 2>/dev/null || echo "   ankr-sandbox already running or not configured"
    pm2 start /root/ankr-labs-nx/ecosystem.bani.config.js 2>/dev/null || echo "   bani-api starting..."
    sleep 2
    echo ""
    echo "📊 Status:"
    pm2 list | grep -E "bani|ai-proxy|sandbox"
    echo ""
    swayam-health
}

# Stop all Swayam services (keeps other pm2 apps running)
swayam-all-stop() {
    echo "🛑 Stopping Swayam Stack..."
    pm2 stop bani-api 2>/dev/null
    pm2 stop ai-proxy 2>/dev/null
    pm2 stop ankr-sandbox 2>/dev/null
    echo "✅ Swayam stack stopped"
    echo ""
    echo "📊 Remaining services:"
    pm2 list
}

# Full restart with build
swayam-full-restart() {
    echo "🔄 Full Swayam Restart..."
    swayam-stop
    swayam-build
    sleep 1
    swayam-pm2
    sleep 3
    swayam-health
}

# Test WebSocket connection
swayam-test-ws() {
    echo "🧪 Testing WebSocket..."
    node -e "
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:7777/swayam');
ws.on('open', () => {
  console.log('✅ WebSocket Connected!');
  ws.send(JSON.stringify({ type: 'join', sessionId: 'test', userId: 'test', language: 'en' }));
});
ws.on('message', (d) => console.log('📨 Received:', d.toString().substring(0,100)));
ws.on('error', (e) => console.log('❌ Error:', e.message));
setTimeout(() => { ws.close(); console.log('✅ Test complete'); process.exit(0); }, 3000);
" 2>&1
}

# Show all service health
swayam-stack-health() {
    echo "📊 Swayam Stack Health Check"
    echo "============================"
    echo ""
    echo "BANI (7777):"
    curl -s http://localhost:7777/health | head -c 100 && echo "..." || echo "❌ Not responding"
    echo ""
    echo "AI-Proxy (4444):"
    curl -s http://localhost:4444/health 2>/dev/null | head -c 100 || echo "❌ Not responding"
    echo ""
    echo "Sandbox (4220):"
    curl -s http://localhost:4220/health 2>/dev/null | head -c 100 || echo "❌ Not responding"
    echo ""
    echo "Redis:"
    redis-cli ping 2>/dev/null || echo "❌ Not responding"
    echo ""
    echo "PostgreSQL:"
    pg_isready -h localhost -p 5432 2>/dev/null || echo "❌ Not responding"
}

# ----------------------------------------------------------------------------
# HELP
# ----------------------------------------------------------------------------

swayam-help() {
    echo "
🎤 SWAYAM SERVICE COMMANDS
==========================

BASIC:
  swayam-start      Start Swayam (direct node)
  swayam-pm2        Start with pm2
  swayam-stop       Stop Swayam
  swayam-restart    Rebuild & restart
  swayam-reload     Quick restart (no rebuild)
  swayam-logs       View last 50 log lines
  swayam-logs-live  Live log stream
  swayam-health     Check health endpoint
  swayam-status     Show pm2 status
  swayam-build      Build TypeScript
  swayam-cd         Go to bani directory

FULL STACK:
  swayam-all-start     Start BANI + AI-Proxy + Sandbox
  swayam-all-stop      Stop all Swayam services
  swayam-full-restart  Full rebuild & restart
  swayam-test-ws       Test WebSocket connection
  swayam-stack-health  Check all services

OTHER SERVICES:
  aiproxy-start/stop/logs
  sandbox-start/stop/logs

📍 Production: https://swayam.digimitra.guru
📍 Server: 216.48.185.29
"
}

echo "✅ Swayam aliases loaded! Type 'swayam-help' for commands."

# =============================================================================
# END OF ALIASES
# =============================================================================
