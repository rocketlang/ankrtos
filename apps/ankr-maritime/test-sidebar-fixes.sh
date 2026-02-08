#!/bin/bash
# Test sidebar fixes and new routes

echo "🧪 Testing Mari8X Sidebar Fixes"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Check if frontend is running
echo "1️⃣  Checking frontend dev server..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3008 | grep -q "200"; then
    echo -e "${GREEN}✅ Frontend running on port 3008${NC}"
else
    echo -e "${RED}❌ Frontend not running${NC}"
    echo "   Start with: cd /root/apps/ankr-maritime/frontend && npm run dev"
fi
echo ""

# 2. Check if backend is running
echo "2️⃣  Checking backend GraphQL server..."
if curl -s http://localhost:4053/graphql \
    -H "Content-Type: application/json" \
    -d '{"query":"{ __typename }"}' | grep -q "data"; then
    echo -e "${GREEN}✅ Backend running on port 4053${NC}"
else
    echo -e "${RED}❌ Backend not running${NC}"
    echo "   Start with: cd /root/apps/ankr-maritime/backend && npm exec tsx src/main.ts"
fi
echo ""

# 3. Test AIS Live route
echo "3️⃣  Testing /ais/live route..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3008/ais/live)
if [ "$STATUS" = "200" ]; then
    echo -e "${GREEN}✅ /ais/live accessible (HTTP $STATUS)${NC}"
else
    echo -e "${RED}❌ /ais/live returned HTTP $STATUS${NC}"
fi
echo ""

# 4. Test Flow Canvas route
echo "4️⃣  Testing /flow-canvas route..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3008/flow-canvas)
if [ "$STATUS" = "200" ]; then
    echo -e "${GREEN}✅ /flow-canvas accessible (HTTP $STATUS)${NC}"
else
    echo -e "${RED}❌ /flow-canvas returned HTTP $STATUS${NC}"
fi
echo ""

# 5. Test AIS Live Dashboard query
echo "5️⃣  Testing AIS Live Dashboard GraphQL query..."
RESULT=$(curl -s http://localhost:4053/graphql \
    -H "Content-Type: application/json" \
    -d '{"query":"{ aisLiveDashboard { totalPositions uniqueVessels } }"}')

if echo "$RESULT" | grep -q "totalPositions"; then
    POSITIONS=$(echo "$RESULT" | jq -r '.data.aisLiveDashboard.totalPositions // "unknown"')
    VESSELS=$(echo "$RESULT" | jq -r '.data.aisLiveDashboard.uniqueVessels // "unknown"')
    echo -e "${GREEN}✅ Query successful${NC}"
    echo "   📊 Total Positions: $(echo $POSITIONS | awk '{printf "%\047d\n", $0}')"
    echo "   🚢 Unique Vessels: $(echo $VESSELS | awk '{printf "%\047d\n", $0}')"
else
    echo -e "${RED}❌ Query failed${NC}"
    echo "$RESULT" | jq -r '.errors[0].message // "Unknown error"'
fi
echo ""

# 6. Check sidebar nav file
echo "6️⃣  Checking sidebar navigation config..."
if grep -q "AIS & Tracking" /root/apps/ankr-maritime/frontend/src/lib/sidebar-nav.ts && \
   grep -q "UX & Workflows" /root/apps/ankr-maritime/frontend/src/lib/sidebar-nav.ts; then
    echo -e "${GREEN}✅ New sections added to sidebar-nav.ts${NC}"
    echo "   - AIS & Tracking (with AIS Live)"
    echo "   - UX & Workflows (with Flow Canvas)"
else
    echo -e "${RED}❌ Sidebar sections not found${NC}"
fi
echo ""

# 7. Check Layout debug logging
echo "7️⃣  Checking Layout component for debug logging..."
if grep -q "console.log.*Sidebar state" /root/apps/ankr-maritime/frontend/src/components/Layout.tsx; then
    echo -e "${GREEN}✅ Debug logging added to Layout.tsx${NC}"
    echo "   Open browser console (F12) to see sidebar state changes"
else
    echo -e "${YELLOW}⚠️  Debug logging not found${NC}"
fi
echo ""

# Summary
echo "📋 Summary"
echo "=========="
echo ""
echo "✅ New Routes Added:"
echo "   - /ais/live (AIS Live Dashboard)"
echo "   - /flow-canvas (Flow Canvas)"
echo ""
echo "✅ Sidebar Sections Added:"
echo "   - AIS & Tracking"
echo "   - UX & Workflows"
echo ""
echo "🔧 Debugging:"
echo "   - Console logging enabled"
echo "   - Open http://localhost:3008 with DevTools (F12)"
echo "   - Click sidebar toggle and check console"
echo ""
echo "📖 Full documentation:"
echo "   /root/apps/ankr-maritime/SIDEBAR-AND-AIS-FIXES.md"
echo ""

# Open browser helper
echo "🌐 Quick Access:"
echo "   Frontend: http://localhost:3008"
echo "   AIS Live: http://localhost:3008/ais/live"
echo "   Flow Canvas: http://localhost:3008/flow-canvas"
echo ""
