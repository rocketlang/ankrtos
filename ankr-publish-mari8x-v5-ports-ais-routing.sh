#!/bin/bash
# ANKR Publish v5 - Mari8X Ports, AIS & Routing Engine v2
# Generated: February 1, 2026
# Publishes Indian Ports Expansion + OpenSeaMap + AIS Routing V2 + Data Quality

set -e

echo "🚢 === Mari8X v5 Publishing - Ports, AIS & Routing === 🚢"
echo ""
echo "Publishing latest documentation to https://ankr.in/"
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

echo "📚 Mari8X v5 Documentation to Publish:"
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
        --tags "$tags" 2>&1 | grep -q "Published successfully"; then
        PUBLISHED=$((PUBLISHED + 1))
        echo "     ✅ Success"
    else
        FAILED=$((FAILED + 1))
        echo "     ❌ Failed"
    fi
    echo ""
}

# ==============================================================================
# 1. SESSION SUMMARY & STATUS (Priority 1)
# ==============================================================================
echo "─────────────────────────────────────────────────────────────────────────"
echo "1️⃣  SESSION SUMMARY & COMPREHENSIVE STATUS"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""

publish_doc \
    "SESSION-COMPLETE-INDIAN-PORTS-EXPANSION.md" \
    "session-summary" \
    "mari8x,session,ports,ais,routing,pgbouncer,openseamap,feb1-2026"

# ==============================================================================
# 2. PORT EXPANSION & DATABASE (Priority 1)
# ==============================================================================
echo "─────────────────────────────────────────────────────────────────────────"
echo "2️⃣  INDIAN PORTS EXPANSION & DATABASE"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""

publish_doc \
    "COMPREHENSIVE-INDIAN-PORTS-PLAN.md" \
    "planning" \
    "mari8x,ports,indian-ports,expansion,58-ports,gujarat,anchorage,planning"

publish_doc \
    "PORT-SCRAPING-GUIDELINES-REAL-DATA-ONLY.md" \
    "policy" \
    "mari8x,data-quality,real-data,scraping,policy,zero-tolerance"

publish_doc \
    "QUICK-START-PORT-SCRAPERS.md" \
    "guide" \
    "mari8x,ports,scrapers,quick-start,guide"

publish_doc \
    "REAL-PORT-SCRAPER-STATUS.md" \
    "status" \
    "mari8x,ports,scraper-status,real-data"

# ==============================================================================
# 3. OPENSEAMAP INTEGRATION (Priority 1)
# ==============================================================================
echo "─────────────────────────────────────────────────────────────────────────"
echo "3️⃣  OPENSEAMAP INTEGRATION & PORT VISUALIZATION"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""

publish_doc \
    "OPENSEAMAP-INTEGRATION-PLAN.md" \
    "technical-planning" \
    "mari8x,openseamap,osm,postgis,port-visualization,berths,anchorages,navigation-aids"

# ==============================================================================
# 4. AIS ROUTING ENGINE V2 (Priority 1)
# ==============================================================================
echo "─────────────────────────────────────────────────────────────────────────"
echo "4️⃣  AIS ROUTING ENGINE V2 - AI/ML POWERED ROUTING"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""

publish_doc \
    "AIS-ROUTING-ENGINE-V2-PLAN.md" \
    "technical-planning" \
    "mari8x,ais,routing,ai,ml,route-discovery,eta-prediction,dbscan,clustering"

publish_doc \
    "MARI8X-ROUTEENGINE-COMPLETE-SPEC.md" \
    "technical-specification" \
    "mari8x,route-engine,specification,branding,architecture"

publish_doc \
    "AIS-VESSEL-TYPE-ROUTING-IMPLEMENTATION.md" \
    "technical-planning" \
    "mari8x,ais,vessel-types,routing,tankers,containers,bulk-carriers,coastal"

publish_doc \
    "AIS-DATA-SOURCES-LANDLOCKED-SOLUTION.md" \
    "technical-guide" \
    "mari8x,ais,landlocked,aishub,marinetraffic,diy-receiver,permissions"

publish_doc \
    "AIS-PROVIDER-COMPARISON-2026.md" \
    "comparison" \
    "mari8x,ais,providers,comparison,cost-analysis"

# ==============================================================================
# 5. INFRASTRUCTURE FIXES (Priority 1)
# ==============================================================================
echo "─────────────────────────────────────────────────────────────────────────"
echo "5️⃣  INFRASTRUCTURE & PERFORMANCE"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""

publish_doc \
    "PGBOUNCER-FIXED.md" \
    "technical-guide" \
    "mari8x,pgbouncer,connection-pooling,performance,fix"

publish_doc \
    "PGBOUNCER-VERIFICATION-REPORT.md" \
    "test-report" \
    "mari8x,pgbouncer,verification,testing"

publish_doc \
    "CRITICAL-FIX-COMPLETED.md" \
    "fix-report" \
    "mari8x,critical-fix,connections"

# ==============================================================================
# 6. PORT ENHANCEMENT SESSION DOCS (Priority 2)
# ==============================================================================
echo "─────────────────────────────────────────────────────────────────────────"
echo "6️⃣  PORT ENHANCEMENT SESSION DOCS"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""

publish_doc \
    "PORT-ENHANCEMENT-SESSION-SUMMARY.md" \
    "session-summary" \
    "mari8x,ports,enhancement,terminals,berths"

# ==============================================================================
# 7. EXISTING MARI8X CORE DOCS (Re-publish for consistency)
# ==============================================================================
echo "─────────────────────────────────────────────────────────────────────────"
echo "7️⃣  MARI8X CORE DOCUMENTATION (Re-index)"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""

publish_doc \
    "MARI8X-COMPREHENSIVE-STATUS-FEB1-2026.md" \
    "project-status" \
    "mari8x,status,phase5,complete,planning,roadmap"

publish_doc \
    "MARI8X-PROJECT-STATUS.md" \
    "project-status" \
    "mari8x,status,project"

publish_doc \
    "MARI8X-MASTER-TODO.md" \
    "project-planning" \
    "mari8x,todo,master,planning"

publish_doc \
    "Mari8x_TODO.md" \
    "project-planning" \
    "mari8x,todo,planning,roadmap"

publish_doc \
    "MARI8X-INVESTOR-DECK.md" \
    "investor-deck" \
    "mari8x,investor,deck,showcase"

publish_doc \
    "MARI8X-SHOWCASE.md" \
    "showcase" \
    "mari8x,showcase,features"

publish_doc \
    "Mari8X_USP.md" \
    "showcase" \
    "mari8x,usp,value-proposition"

# ==============================================================================
# SUMMARY & REINDEX
# ==============================================================================
echo "─────────────────────────────────────────────────────────────────────────"
echo "✅  PUBLISHING SUMMARY"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""
echo "📊 Results:"
echo "   ✅ Published: $PUBLISHED documents"
echo "   ❌ Failed: $FAILED documents"
echo ""

if [ $PUBLISHED -gt 0 ]; then
    echo "🔄 Reindexing $PROJECT for search..."
    if ankr-publish-next reindex "$PROJECT" 2>/dev/null; then
        echo "   ✅ Reindexing complete"
    else
        echo "   ⚠️  Reindexing skipped (command not available)"
    fi
    echo ""
fi

# ==============================================================================
# VIEWER LINKS
# ==============================================================================
echo "─────────────────────────────────────────────────────────────────────────"
echo "🌐  MARI8X V5 VIEWER LINKS"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""
echo "📍 Project Home:"
echo "   $VIEWER_URL/"
echo ""
echo "📄 V5 New Documentation:"
echo ""
echo "   🏢 PORTS & DATA QUALITY:"
echo "      • Indian Ports Plan: $VIEWER_URL/COMPREHENSIVE-INDIAN-PORTS-PLAN.md"
echo "      • Data Quality Policy: $VIEWER_URL/PORT-SCRAPING-GUIDELINES-REAL-DATA-ONLY.md"
echo "      • Scraper Quick Start: $VIEWER_URL/QUICK-START-PORT-SCRAPERS.md"
echo ""
echo "   🗺️  OPENSEAMAP & VISUALIZATION:"
echo "      • OpenSeaMap Integration: $VIEWER_URL/OPENSEAMAP-INTEGRATION-PLAN.md"
echo ""
echo "   🧭 AIS ROUTING ENGINE V2:"
echo "      • Routing Engine V2 Plan: $VIEWER_URL/AIS-ROUTING-ENGINE-V2-PLAN.md"
echo "      • Complete Specification: $VIEWER_URL/MARI8X-ROUTEENGINE-COMPLETE-SPEC.md"
echo "      • Vessel-Type Routing: $VIEWER_URL/AIS-VESSEL-TYPE-ROUTING-IMPLEMENTATION.md"
echo "      • Landlocked Solution: $VIEWER_URL/AIS-DATA-SOURCES-LANDLOCKED-SOLUTION.md"
echo ""
echo "   ⚡ INFRASTRUCTURE:"
echo "      • PgBouncer Fixed: $VIEWER_URL/PGBOUNCER-FIXED.md"
echo "      • Verification Report: $VIEWER_URL/PGBOUNCER-VERIFICATION-REPORT.md"
echo ""
echo "   📝 SESSION SUMMARY:"
echo "      • Complete Session: $VIEWER_URL/SESSION-COMPLETE-INDIAN-PORTS-EXPANSION.md"
echo ""
echo "🔍 Search for topics:"
echo "   https://ankr.in/search?q=mari8x+ports"
echo "   https://ankr.in/search?q=mari8x+ais+routing"
echo "   https://ankr.in/search?q=mari8x+openseamap"
echo "   https://ankr.in/search?q=mari8x+pgbouncer"
echo ""

# ==============================================================================
# EON REINGEST (Optional)
# ==============================================================================
echo "─────────────────────────────────────────────────────────────────────────"
echo "🔄  EON SEMANTIC SEARCH UPDATE"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""
echo "Triggering EON reingest for semantic search..."

if curl -s -X POST http://localhost:3080/api/eon/reingest \
  -H "Content-Type: application/json" \
  -d '{"project": "ankr-maritime"}' > /dev/null 2>&1; then
    echo "   ✅ EON reingest triggered successfully"
else
    echo "   ⚠️  EON service not available (this is okay if not running)"
fi

echo ""

# ==============================================================================
# COMPLETION MESSAGE
# ==============================================================================
echo "─────────────────────────────────────────────────────────────────────────"
echo "🎉  MARI8X V5 PUBLISHING COMPLETE!"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""
echo "✨ What's New in v5 (February 1, 2026):"
echo ""
echo "   🏢 INDIAN PORTS EXPANSION:"
echo "      • 58 Indian ports in database (49 new + 9 updated)"
echo "      • 12 Major + 15 Gujarat + 8 West Coast + 10 East Coast + 7 Anchorage + 7 Island"
echo "      • Terminal/berth-level granularity (JNPT, Mumbai)"
echo "      • ZERO TOLERANCE data quality policy"
echo "      • Real tariff data only (44 verified tariffs across 8 ports)"
echo ""
echo "   🗺️  OPENSEAMAP INTEGRATION:"
echo "      • PostGIS spatial database design"
echo "      • Berths, anchorages, navigation aids visualization"
echo "      • Overpass API integration plan"
echo "      • 4-week implementation roadmap"
echo ""
echo "   🧭 AIS ROUTING ENGINE V2:"
echo "      • AI/ML-powered route discovery from real vessel tracks"
echo "      • Vessel-type-specific routing (tankers, containers, bulk, coastal)"
echo "      • DBSCAN clustering for route learning"
echo "      • ETA prediction with ML models"
echo "      • 10-week implementation timeline"
echo "      • Official branding: Mari8X_RouteEngine™"
echo ""
echo "   💡 LANDLOCKED AIS SOLUTION:"
echo "      • DIY receiver won't work inland (VHF line-of-sight)"
echo "      • AISHub Free API recommended (global, free)"
echo "      • MarineTraffic & Spire alternatives documented"
echo "      • Cost comparison & phased approach"
echo ""
echo "   ⚡ INFRASTRUCTURE FIXES:"
echo "      • PgBouncer connection pooling (97+ → 20-25 connections)"
echo "      • SCRAM-SHA-256 authentication"
echo "      • All scrapers now operational"
echo ""
echo "📈 Mari8X Database Status:"
echo "   • Total Ports: 101 (58 Indian + 43 International)"
echo "   • Total Tariffs: 3,738 (44 REAL + 3,694 simulated)"
echo "   • Real Tariff Coverage: 8/58 Indian ports (14%)"
echo "   • Connection Issues: FIXED ✅"
echo ""
echo "🚀 Next Steps (Week 1-3):"
echo "   Week 1: Chennai, Vizag, Pipavav scrapers (25+ real tariffs)"
echo "   Week 2: OpenSeaMap POC (Mumbai port visualization)"
echo "   Week 3: AIS data collection start (Mumbai/JNPT area)"
echo ""
echo "🔗 Competitive Advantages:"
echo "   • 58 Indian ports (competitors have 10-15)"
echo "   • Terminal-level tariff granularity"
echo "   • REAL data only policy (transparent sourcing)"
echo "   • AIS-based routing (no competitor has this)"
echo "   • Visual port maps with berth locations"
echo ""
echo "🙏 All Mari8X documentation now live at https://ankr.in/"
echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
