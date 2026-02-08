#!/bin/bash
# Clear all caches - fix stale sidebar and 502 errors

echo "🧹 Clearing All Caches - Mari8X"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Kill servers
echo "1️⃣  Stopping servers..."
pkill -f "vite.*3008" 2>/dev/null && echo "   ✅ Vite stopped" || echo "   ⚠️  Vite not running"
# Note: Not killing backend to preserve database connections

echo ""

# 2. Clear frontend cache
echo "2️⃣  Clearing frontend cache..."
cd /root/apps/ankr-maritime/frontend
rm -rf node_modules/.vite 2>/dev/null && echo "   ✅ Vite cache cleared"
rm -rf .vite 2>/dev/null && echo "   ✅ .vite cleared"
rm -rf dist 2>/dev/null && echo "   ✅ dist cleared"

echo ""

# 3. Restart Vite
echo "3️⃣  Restarting frontend..."
cd /root/apps/ankr-maritime/frontend
nohup npm run dev > /tmp/vite.log 2>&1 &
VITE_PID=$!
echo "   ✅ Vite restarted (PID: $VITE_PID)"
echo "   📝 Logs: tail -f /tmp/vite.log"

echo ""

# 4. Wait for startup
echo "4️⃣  Waiting for frontend to start..."
sleep 5

if curl -s -o /dev/null -w "%{http_code}" http://localhost:3008 | grep -q "200"; then
    echo -e "   ${GREEN}✅ Frontend ready on http://localhost:3008${NC}"
else
    echo -e "   ${YELLOW}⚠️  Frontend starting... (check logs: tail -f /tmp/vite.log)${NC}"
fi

echo ""

# 5. Instructions for browser
echo "🌐 Browser Cache Clear Required!"
echo "================================"
echo ""
echo "Now do this in your browser:"
echo ""
echo "Option 1: Hard Refresh"
echo "   Windows/Linux: Ctrl + Shift + R"
echo "   Mac: Cmd + Shift + R"
echo ""
echo "Option 2: Clear Storage (Recommended)"
echo "   1. Open DevTools (F12)"
echo "   2. Paste this in console:"
echo ""
echo "      localStorage.clear();"
echo "      sessionStorage.clear();"
echo "      location.reload();"
echo ""
echo "Option 3: Incognito Window"
echo "   Open http://localhost:3008 in private/incognito window"
echo ""
echo "✅ After browser cache clear, sidebar toggle should work!"
echo ""
echo "🔧 Debug: Open console (F12) and look for:"
echo "   '🔧 Sidebar state: OPEN' or 'CLOSED'"
echo ""
