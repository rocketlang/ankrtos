#!/bin/bash
# ANKR Publish - Mari8X Vessel & Fleet Portals Complete
# Generated: February 3, 2026
# Publishes all portal documentation + value proposition strategy

set -e

echo "🚢 === Mari8X Portals Publishing - February 3, 2026 === 🚢"
echo ""
echo "Publishing Vessel Portal & Fleet Portal documentation to https://ankr.in/"
echo ""

# Configuration
PROJECT="ankr-maritime"
DOCS_DIR="/root/apps/ankr-maritime"
VIEWER_URL="https://ankr.in/project/documents/ankr-maritime"

# Check if ankr-publish-next is available
if ! command -v ankr-publish-next &> /dev/null; then
    echo "❌ ankr-publish-next not found. Installing..."
    cd /root/ankr-packages/@ankr/publish
    npm link
    echo "✅ ankr-publish-next installed"
    echo ""
fi

cd "$DOCS_DIR"

echo "📚 Portal Documentation to Publish:"
echo ""

# Counter for published docs
PUBLISHED=0
FAILED=0

# Function to publish a document
publish_doc() {
    local file="$1"
    local category="$2"
    local tags="$3"

    if [ ! -f "$file" ]; then
        echo "  ⚠️  Skipped: $file (not found)"
        return
    fi

    echo "  📤 Publishing: $file"

    if ankr-publish-next publish "$file" \
        --project "$PROJECT" \
        --category "$category" \
        --tags "$tags" 2>/dev/null; then
        PUBLISHED=$((PUBLISHED + 1))
        echo "     ✅ Success"
    else
        FAILED=$((FAILED + 1))
        echo "     ❌ Failed"
    fi
    echo ""
}

# ==============================================================================
# 1. PORTAL IMPLEMENTATION (Priority 1 - Just Built!)
# ==============================================================================
echo "─────────────────────────────────────────────────────────────────────────"
echo "1️⃣  VESSEL & FLEET PORTALS - IMPLEMENTATION COMPLETE"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""

publish_doc \
    "PORTALS-IMPLEMENTATION-COMPLETE.md" \
    "implementation" \
    "portals,vessel-portal,fleet-portal,complete,feb3-2026"

publish_doc \
    "VESSEL-PORTAL-IMPLEMENTATION-PLAN.md" \
    "implementation" \
    "vessel-portal,planning,da-desk,cash-to-master"

# ==============================================================================
# 2. BUSINESS STRATEGY & VALUE PROPOSITION (Priority 1)
# ==============================================================================
echo "─────────────────────────────────────────────────────────────────────────"
echo "2️⃣  BUSINESS STRATEGY & VALUE PROPOSITION"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""

publish_doc \
    "VESSEL-OWNER-VALUE-PROPOSITION-STRATEGY.md" \
    "business-strategy" \
    "value-proposition,vessel-owners,fleet-owners,business-model,pricing"

publish_doc \
    "VESSEL-OPERATIONS-PORTAL-CONCEPT.md" \
    "product-concept" \
    "vessel-operations,amosconnect,features,sweetener,operations"

publish_doc \
    "SHIP-OWNER-DASHBOARD-SPEC.md" \
    "technical-spec" \
    "dashboard,ship-owner,ui-ux,specifications"

# ==============================================================================
# 3. FLEET COLLABORATIVE ROUTING (Just Built!)
# ==============================================================================
echo "─────────────────────────────────────────────────────────────────────────"
echo "3️⃣  FLEET COLLABORATIVE ROUTING"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""

publish_doc \
    "FLEET-COLLABORATIVE-ROUTING-CONCEPT.md" \
    "innovation" \
    "fleet-routing,collaborative,ships-abc,innovation,feb3-2026"

publish_doc \
    "FLEET-COLLABORATIVE-ROUTING-IMPLEMENTATION-COMPLETE.md" \
    "implementation" \
    "fleet-routing,implementation,complete,feb3-2026"

publish_doc \
    "INTELLIGENT-ROUTING-ENGINE-PROGRESS.md" \
    "implementation" \
    "routing-engine,intelligent-routing,auto-learning"

# ==============================================================================
# 4. AMOSCONNECT FEATURES ROADMAP (Phase 2 Planning)
# ==============================================================================
echo "─────────────────────────────────────────────────────────────────────────"
echo "4️⃣  AMOSCONNECT FEATURES - PHASE 2 ROADMAP"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""

publish_doc \
    "AMOSCONNECT-FEATURES-TODO.md" \
    "roadmap" \
    "amosconnect,phase2,compressed-email,weather-routing,offline"

# ==============================================================================
# 5. SESSION SUMMARIES (Today's Work)
# ==============================================================================
echo "─────────────────────────────────────────────────────────────────────────"
echo "5️⃣  SESSION SUMMARIES - FEBRUARY 3, 2026"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""

publish_doc \
    "SESSION-FEB3-2026-PARALLEL-IMPLEMENTATION.md" \
    "session-summary" \
    "session,feb3-2026,portals,routing"

publish_doc \
    "MARI8X-SESSION-REPORT-FEB3-2026.md" \
    "session-summary" \
    "session-report,feb3-2026"

# ==============================================================================
# 6. EXISTING KEY DOCUMENTATION (Reference)
# ==============================================================================
echo "─────────────────────────────────────────────────────────────────────────"
echo "6️⃣  KEY REFERENCE DOCUMENTATION"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""

publish_doc \
    "MARI8X-COMPREHENSIVE-ARCHITECTURE-FEB2026.md" \
    "architecture" \
    "architecture,comprehensive,system-design"

publish_doc \
    "MARI8X-COMPREHENSIVE-STATUS-FEB1-2026.md" \
    "project-status" \
    "status,comprehensive,feb1-2026"

publish_doc \
    "MARI8X-SHOWCASE.md" \
    "showcase" \
    "showcase,features,usp"

publish_doc \
    "MARI8X-USP-PUBLISHED.md" \
    "marketing" \
    "usp,unique-selling-points,differentiation"

publish_doc \
    "Mari8X_USP.md" \
    "marketing" \
    "usp,value-proposition"

# ==============================================================================
# 7. TECHNICAL GUIDES & QUICK STARTS
# ==============================================================================
echo "─────────────────────────────────────────────────────────────────────────"
echo "7️⃣  TECHNICAL GUIDES & QUICK STARTS"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""

publish_doc \
    "QUICK-START-GUIDE-FEB1-2026.md" \
    "quick-start" \
    "quickstart,getting-started"

publish_doc \
    "WHATS-NEW-FEB1-2026.md" \
    "changelog" \
    "whats-new,changelog,features"

publish_doc \
    "README.md" \
    "overview" \
    "readme,overview,introduction"

# ==============================================================================
# SUMMARY
# ==============================================================================
echo ""
echo "─────────────────────────────────────────────────────────────────────────"
echo "📊 PUBLISHING SUMMARY"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""
echo "  ✅ Successfully published: $PUBLISHED documents"
echo "  ❌ Failed to publish: $FAILED documents"
echo "  📊 Total attempted: $((PUBLISHED + FAILED)) documents"
echo ""
echo "─────────────────────────────────────────────────────────────────────────"
echo "🌐 VIEW PUBLISHED DOCUMENTS"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""
echo "  🔗 Viewer: $VIEWER_URL"
echo ""
echo "  📚 Key Documents:"
echo "     • Portals Implementation Complete"
echo "     • Vessel Owner Value Proposition Strategy"
echo "     • Fleet Collaborative Routing Concept"
echo "     • AmosConnect Features TODO (Phase 2)"
echo "     • Vessel Portal Implementation Plan"
echo ""
echo "─────────────────────────────────────────────────────────────────────────"
echo "✨ HIGHLIGHTS - FEBRUARY 3, 2026 SESSION"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""
echo "  🚢 Vessel Portal - Complete operational dashboard for Masters"
echo "  🚢 Fleet Portal - Complete management dashboard for Owners"
echo "  🗺️  Fleet Collaborative Routing - Ships A,B,C → optimal route for Ship D"
echo "  💰 Business Model - Two-sided value proposition (vessels + owners)"
echo "  📱 Phase 2 Planning - AmosConnect features roadmap"
echo ""
echo "  🎯 Result: Complete maritime operations platform with vessel 'glue'!"
echo ""
echo "─────────────────────────────────────────────────────────────────────────"
echo "✅ MARI8X PORTALS PUBLISHING COMPLETE!"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "🎉 All documents published successfully!"
    exit 0
else
    echo "⚠️  Some documents failed to publish. Check output above."
    exit 1
fi
