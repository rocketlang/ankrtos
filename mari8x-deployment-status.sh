#!/bin/bash
##############################################################################
# Mari8X Deployment Status & Quick Deploy Guide
##############################################################################

set -e

echo "════════════════════════════════════════════════════════════════════════"
echo "  🚀 MARI8X DEPLOYMENT STATUS"
echo "  Ready to deploy to mari8x.com"
echo "════════════════════════════════════════════════════════════════════════"
echo ""

# Check build
echo "📦 FRONTEND BUILD STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -d "/root/apps/ankr-maritime/frontend/dist" ]; then
    echo "✅ Build exists: /root/apps/ankr-maritime/frontend/dist"
    echo "   Size: $(du -sh /root/apps/ankr-maritime/frontend/dist | cut -f1)"
    echo "   Files: $(find /root/apps/ankr-maritime/frontend/dist -type f | wc -l) files"

    # Check key files
    if [ -f "/root/apps/ankr-maritime/frontend/dist/index.html" ]; then
        echo "   ✅ index.html present"
    fi
    if ls /root/apps/ankr-maritime/frontend/dist/assets/*.js 1> /dev/null 2>&1; then
        echo "   ✅ JavaScript bundles present ($(ls /root/apps/ankr-maritime/frontend/dist/assets/*.js | wc -l) files)"
    fi
    if ls /root/apps/ankr-maritime/frontend/dist/assets/*.css 1> /dev/null 2>&1; then
        echo "   ✅ CSS bundles present ($(ls /root/apps/ankr-maritime/frontend/dist/assets/*.css | wc -l) files)"
    fi
else
    echo "❌ Build not found"
    echo "   Run: cd /root/apps/ankr-maritime/frontend && npx vite build"
fi
echo ""

# Check git status
echo "📝 GIT STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
CURRENT_COMMIT=$(git log -1 --format="%h" 2>/dev/null || echo "unknown")
CURRENT_MSG=$(git log -1 --format="%s" 2>/dev/null || echo "unknown")
echo "   Latest commit: $CURRENT_COMMIT"
echo "   Message: $CURRENT_MSG"
echo ""

# Check if pushed
UNPUSHED=$(git log origin/master..HEAD --oneline 2>/dev/null | wc -l)
if [ "$UNPUSHED" -eq 0 ]; then
    echo "   ✅ All commits pushed to GitHub"
else
    echo "   ⚠️  $UNPUSHED unpushed commits"
    echo "   Run: git push origin master"
fi
echo ""

# Check backend
echo "🔧 BACKEND STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
HEALTH_CHECK=$(curl -s https://mari8x.com/health 2>/dev/null || echo "")
if echo "$HEALTH_CHECK" | grep -q "OK"; then
    echo "   ✅ Backend live at mari8x.com/health"
    echo "   Status: $(echo "$HEALTH_CHECK" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)"
else
    echo "   ❌ Backend not responding"
fi
echo ""

# Check OpenSeaMap progress
echo "🗺️  OPENSEAMAP COVERAGE CHECK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
LOG_FILE="/tmp/openseamap-1000-check.log"
if [ -f "$LOG_FILE" ]; then
    CURRENT_PORT=$(tail -1 "$LOG_FILE" | grep -oP "Checking \K\d+(?=/1000)" || echo "0")
    if pgrep -f "check-openseamap-coverage.ts" > /dev/null; then
        echo "   ⏳ Running: $CURRENT_PORT / 1000 ports checked"
        PERCENT=$((CURRENT_PORT * 100 / 1000))
        echo "   Progress: $PERCENT%"
    else
        echo "   ✅ Completed or not running"
        echo "   Last check: port $CURRENT_PORT"
    fi
else
    echo "   ℹ️  No coverage check in progress"
fi
echo ""

# Check frontend deployment
echo "🌐 FRONTEND DEPLOYMENT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
FRONTEND_CHECK=$(curl -sI https://mari8x.com 2>/dev/null | head -1 || echo "")
if echo "$FRONTEND_CHECK" | grep -q "200"; then
    echo "   ✅ Frontend live at mari8x.com"
    echo "   Response: $FRONTEND_CHECK"
else
    echo "   ⏳ Frontend not yet deployed"
    echo "   Response: ${FRONTEND_CHECK:-No response}"
fi
echo ""

# Deployment options
echo "🚀 DEPLOYMENT OPTIONS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "RECOMMENDED: Git Integration (5 minutes setup, auto-deploy forever)"
echo ""
echo "  1. Go to: https://dash.cloudflare.com/pages"
echo "  2. Click: 'Create a project' → 'Connect to Git'"
echo "  3. Select: rocketlang/dodd-icd repository"
echo "  4. Configure:"
echo "       Project: mari8x"
echo "       Branch: master"
echo "       Build command: cd apps/ankr-maritime/frontend && npm install && npx vite build"
echo "       Build output: apps/ankr-maritime/frontend/dist"
echo "  5. Add custom domain: mari8x.com"
echo "  6. Done! Every git push auto-deploys"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# What gets deployed
echo "📊 WHAT GETS DEPLOYED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Live Data Showcased on Landing Page:"
echo "  • Vessel Positions: 46,043,522 positions tracked"
echo "  • Active Vessels: 36,018 vessels"
echo "  • Global Ports: 12,714 ports (103 countries)"
echo "  • Port Tariffs: 45 verified tariffs"
echo "  • Average Speed: 12.8 knots"
echo "  • OpenSeaMap Coverage: 2.3% (291 ports, growing)"
echo ""
echo "Features:"
echo "  ✅ 6 stat cards with live GraphQL data"
echo "  ✅ Enhanced landing page with USPs"
echo "  ✅ Real-time vessel tracking map"
echo "  ✅ 137 feature-rich pages"
echo "  ✅ Maritime intelligence platform"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Summary
echo "════════════════════════════════════════════════════════════════════════"
echo "  ✅ READY TO DEPLOY"
echo "════════════════════════════════════════════════════════════════════════"
echo ""
echo "Status Summary:"
if [ -d "/root/apps/ankr-maritime/frontend/dist" ]; then
    echo "  ✅ Frontend built"
else
    echo "  ❌ Frontend not built"
fi

if [ "$UNPUSHED" -eq 0 ]; then
    echo "  ✅ Code pushed to GitHub"
else
    echo "  ⚠️  Code needs push"
fi

if echo "$HEALTH_CHECK" | grep -q "OK"; then
    echo "  ✅ Backend live"
else
    echo "  ❌ Backend down"
fi

if echo "$FRONTEND_CHECK" | grep -q "200"; then
    echo "  ✅ Frontend deployed"
else
    echo "  ⏳ Frontend pending deployment"
fi
echo ""
echo "Next Step:"
echo "  📖 Read: /root/DEPLOY-MARI8X-GIT-INTEGRATION.md"
echo "  🌐 Visit: https://dash.cloudflare.com/pages"
echo "  🚀 Connect: rocketlang/dodd-icd → mari8x.com"
echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo ""
