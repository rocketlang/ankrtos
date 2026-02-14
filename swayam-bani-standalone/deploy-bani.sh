#!/bin/bash
# =================================================================
# SWAYAM API v2.0 with Full BANI Integration - Deployment Script
# =================================================================
#
# Features:
# ✅ 21 Languages (11 Indian + 10 European)
# ✅ 30 TTS Voices (Sarvam Bulbul v2)
# ✅ STT (Sarvam Saarika / Whisper)
# ✅ Translation (Sarvam Mayura / IndicTrans2)
# ✅ Voice Cloning (XTTS)
# ✅ FREE-FIRST AI Routing
#
# Usage: ./deploy-bani.sh
# =================================================================

set -e

echo "🎙️ Deploying Swayam API v2.0 with Full BANI Integration..."
echo ""

# Configuration
SWAYAM_DIR="/root/swayam"
API_DIR="$SWAYAM_DIR/api-bani"
PORT=4002
BANI_PORT=7777

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Step 1: Check BANI is running
echo ""
log_info "Step 1: Checking BANI service..."
if curl -s http://localhost:$BANI_PORT/health > /dev/null 2>&1; then
    log_success "BANI is running on port $BANI_PORT"
else
    log_warn "BANI not responding on port $BANI_PORT - TTS/STT will use fallbacks"
fi

# Step 2: Create directory
echo ""
log_info "Step 2: Setting up directory..."
mkdir -p $API_DIR
cd $API_DIR

# Step 3: Copy files (these will be in the zip)
log_info "Copying source files..."
# Files should already be extracted here

# Step 4: Install dependencies
echo ""
log_info "Step 3: Installing dependencies..."
npm install

# Step 5: Build TypeScript
echo ""
log_info "Step 4: Building TypeScript..."
npm run build

# Step 6: Create systemd service
echo ""
log_info "Step 5: Creating systemd service..."
cat > /etc/systemd/system/swayam-api.service << EOF
[Unit]
Description=Swayam API v2.0 with BANI Integration
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$API_DIR
Environment=NODE_ENV=production
Environment=PORT=$PORT
Environment=BANI_URL=http://localhost:$BANI_PORT
Environment=AI_PROXY_URL=http://localhost:4444
Environment=SARVAM_API_KEY=
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Step 7: Reload and restart service
echo ""
log_info "Step 6: Starting service..."
systemctl daemon-reload
systemctl enable swayam-api
systemctl restart swayam-api

# Wait for startup
sleep 3

# Step 8: Verify
echo ""
log_info "Step 7: Verifying deployment..."
if curl -s http://localhost:$PORT/health | grep -q "ok"; then
    log_success "Swayam API v2.0 is running!"
else
    log_error "API failed to start. Check: journalctl -u swayam-api -f"
    exit 1
fi

# Step 9: Update nginx (if needed)
echo ""
log_info "Step 8: Updating nginx configuration..."
cat > /etc/nginx/conf.d/swayam-api.conf << 'EOF'
# Swayam API v2.0 with BANI
upstream swayam_api {
    server 127.0.0.1:4002;
}

# API endpoint for swayam.digimitra.guru/graphql
location /graphql {
    proxy_pass http://swayam_api;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;
}

location /graphiql {
    proxy_pass http://swayam_api;
    proxy_set_header Host $host;
}
EOF

# Test and reload nginx
nginx -t && systemctl reload nginx
log_success "Nginx updated!"

# Final summary
echo ""
echo "=========================================="
echo "🎙️ SWAYAM API v2.0 DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "Endpoints:"
echo "  GraphQL:  https://swayam.digimitra.guru/graphql"
echo "  GraphiQL: https://swayam.digimitra.guru/graphiql"
echo "  Health:   http://localhost:$PORT/health"
echo ""
echo "Features:"
echo "  ✅ 21 Languages (11 Indian + 10 European)"
echo "  ✅ 30 TTS Voices (Sarvam Bulbul v2)"
echo "  ✅ STT: Sarvam Saarika + Whisper fallback"
echo "  ✅ Translation: Sarvam Mayura + IndicTrans2"
echo "  ✅ Voice Cloning: XTTS"
echo "  ✅ FREE-FIRST AI Routing"
echo ""
echo "Test with:"
echo '  curl -X POST https://swayam.digimitra.guru/graphql \'
echo '    -H "Content-Type: application/json" \'
echo '    -d '\''{"query": "{ health }"}'\'''
echo ""
echo "View logs:"
echo "  journalctl -u swayam-api -f"
echo ""
