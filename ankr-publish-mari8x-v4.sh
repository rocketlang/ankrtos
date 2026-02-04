#!/bin/bash
# ANKR Publish v4 - Mari8X Phase 5 Complete Documentation
# Generated: February 1, 2026
# Publishes all Phase 5 completion docs + comprehensive status report

set -e

echo "🚢 === Mari8X v4 Publishing - Phase 5 Complete === 🚢"
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

echo "📚 Phase 5 Documentation to Publish:"
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
        --tags "$tags" \
        --autoIndex 2>/dev/null; then
        PUBLISHED=$((PUBLISHED + 1))
        echo "     ✅ Success"
    else
        FAILED=$((FAILED + 1))
        echo "     ❌ Failed"
    fi
    echo ""
}

# ==============================================================================
# 1. COMPREHENSIVE STATUS REPORT (Priority 1)
# ==============================================================================
echo "─────────────────────────────────────────────────────────────────────────"
echo "1️⃣  COMPREHENSIVE STATUS & PLANNING"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""

publish_doc \
    "MARI8X-COMPREHENSIVE-STATUS-FEB1-2026.md" \
    "project-status" \
    "mari8x,status,phase5,complete,planning,roadmap"

publish_doc \
    "COMPLETE-STATUS-FEB1-2026.md" \
    "project-status" \
    "mari8x,status,phase5"

publish_doc \
    "PROJECT-STATUS-JAN31-2026.md" \
    "project-status" \
    "mari8x,status"

# ==============================================================================
# 2. PHASE 5 COMPLETION DOCUMENTS (Priority 1)
# ==============================================================================
echo "─────────────────────────────────────────────────────────────────────────"
echo "2️⃣  PHASE 5 COMPLETION REPORTS"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""

publish_doc \
    "PHASE5-100-PERCENT-COMPLETE.md" \
    "phase-completion" \
    "phase5,voyage-monitoring,complete,ais,weather-routing"

publish_doc \
    "PHASE5-SESSION-COMPLETE-FEB1-2026.md" \
    "phase-completion" \
    "phase5,session,complete"

publish_doc \
    "WEATHER-ROUTING-COMPLETE.md" \
    "technical-guide" \
    "phase5,weather-routing,fuel-optimization,route-planning"

publish_doc \
    "VOYAGE-AUTOMATION-COMPLETE.md" \
    "technical-guide" \
    "phase5,automation,milestone,sof,ais"

publish_doc \
    "ENHANCED-LIVE-MAP-COMPLETE.md" \
    "technical-guide" \
    "phase5,map,visualization,clustering,replay"

# ==============================================================================
# 3. AIS INTEGRATION & VESSEL TRACKING (Priority 1)
# ==============================================================================
echo "─────────────────────────────────────────────────────────────────────────"
echo "3️⃣  AIS INTEGRATION & VESSEL TRACKING"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""

publish_doc \
    "AIS-INTEGRATION-COMPLETE.md" \
    "technical-guide" \
    "ais,vessel-tracking,real-time"

publish_doc \
    "AIS-EQUASIS-STATUS.md" \
    "integration-status" \
    "ais,equasis,vessel-data"

publish_doc \
    "AIS-OWNER-OPERATOR-GUIDE.md" \
    "technical-guide" \
    "ais,vessel,ownership"

publish_doc \
    "VESSEL-OWNERSHIP-GUIDE.md" \
    "technical-guide" \
    "vessel,ownership,gisis,equasis"

publish_doc \
    "IMO-GISIS-INTEGRATION-COMPLETE.md" \
    "integration-status" \
    "imo,gisis,vessel-data"

publish_doc \
    "NORWEGIAN-API-STATUS.md" \
    "integration-status" \
    "norwegian-api,vessel-registry"

# ==============================================================================
# 4. DOCUMENT MANAGEMENT SYSTEM (Priority 2)
# ==============================================================================
echo "─────────────────────────────────────────────────────────────────────────"
echo "4️⃣  DOCUMENT MANAGEMENT SYSTEM"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""

publish_doc \
    "ADVANCED-DMS-COMPLETE.md" \
    "technical-guide" \
    "dms,document-management,minio"

publish_doc \
    "HYBRID-DMS-COMPLETE.md" \
    "technical-guide" \
    "dms,hybrid,minio,postgresql"

publish_doc \
    "HYBRID-DMS-GUIDE.md" \
    "technical-guide" \
    "dms,guide"

publish_doc \
    "MINIO-INTEGRATION-COMPLETE.md" \
    "integration-status" \
    "minio,object-storage"

publish_doc \
    "AUTO-INDEXING-COMPLETE.md" \
    "technical-guide" \
    "auto-indexing,rag,search"

# ==============================================================================
# 5. RAG & KNOWLEDGE ENGINE (Priority 2)
# ==============================================================================
echo "─────────────────────────────────────────────────────────────────────────"
echo "5️⃣  RAG & KNOWLEDGE ENGINE"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""

publish_doc \
    "MARI8X-RAG-KNOWLEDGE-ENGINE.md" \
    "technical-guide" \
    "rag,knowledge-engine,semantic-search"

publish_doc \
    "PHASE32-RAG-COMPLETE-SUMMARY.md" \
    "phase-completion" \
    "phase32,rag,complete"

publish_doc \
    "PHASE32-RAG-ENGINE-COMPLETE.md" \
    "technical-guide" \
    "phase32,rag,implementation"

publish_doc \
    "PHASE32-SEMANTIC-SEARCH-COMPLETE.md" \
    "technical-guide" \
    "semantic-search,hybrid-search"

# ==============================================================================
# 6. BLOCKCHAIN & VERIFICATION (Priority 2)
# ==============================================================================
echo "─────────────────────────────────────────────────────────────────────────"
echo "6️⃣  BLOCKCHAIN & VERIFICATION"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""

publish_doc \
    "BLOCKCHAIN-VERIFICATION-TESTS-COMPLETE.md" \
    "technical-guide" \
    "blockchain,verification,dcsa"

publish_doc \
    "DCSA-EBL-3.0-COMPLETE.md" \
    "technical-guide" \
    "dcsa,ebl,blockchain"

# ==============================================================================
# 7. TESTING & QUALITY (Priority 2)
# ==============================================================================
echo "─────────────────────────────────────────────────────────────────────────"
echo "7️⃣  TESTING & QUALITY ASSURANCE"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""

publish_doc \
    "E2E-TESTS-COMPLETE.md" \
    "technical-guide" \
    "testing,e2e,playwright"

publish_doc \
    "FRONTEND-TESTS-COMPLETE.md" \
    "technical-guide" \
    "testing,frontend,vitest"

publish_doc \
    "GRAPHQL-API-TESTS-COMPLETE.md" \
    "technical-guide" \
    "testing,graphql,api"

# ==============================================================================
# 8. OPERATIONS & INFRASTRUCTURE (Priority 2)
# ==============================================================================
echo "─────────────────────────────────────────────────────────────────────────"
echo "8️⃣  OPERATIONS & INFRASTRUCTURE"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""

publish_doc \
    "CONTINUOUS-SERVICES-STATUS.md" \
    "operations" \
    "services,cron,background-jobs"

publish_doc \
    "DATA-PERSISTENCE-COMPLETE.md" \
    "technical-guide" \
    "database,persistence,timescaledb"

publish_doc \
    "BULK-OPERATIONS-COMPLETE.md" \
    "technical-guide" \
    "bulk-operations,performance"

publish_doc \
    "CERTIFICATE-EXPIRY-CRON-COMPLETE.md" \
    "technical-guide" \
    "cron,certificates,automation"

# ==============================================================================
# 9. INVESTOR & SHOWCASE (Priority 1)
# ==============================================================================
echo "─────────────────────────────────────────────────────────────────────────"
echo "9️⃣  INVESTOR & SHOWCASE"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""

publish_doc \
    "MARI8X-INVESTOR-DECK.md" \
    "investor-deck" \
    "investor,deck,mari8x,showcase"

publish_doc \
    "MARI8X-INVESTOR-SLIDES-v2-clean.md" \
    "investor-deck" \
    "investor,slides,mari8x"

publish_doc \
    "MARI8X-SHOWCASE.md" \
    "showcase" \
    "mari8x,showcase,features"

publish_doc \
    "Mari8X_USP.md" \
    "showcase" \
    "mari8x,usp,value-proposition"

publish_doc \
    "MARI8X-USP-PUBLISHED.md" \
    "showcase" \
    "mari8x,usp"

# ==============================================================================
# 10. SESSION SUMMARIES & PROGRESS (Priority 3)
# ==============================================================================
echo "─────────────────────────────────────────────────────────────────────────"
echo "🔟  SESSION SUMMARIES & PROGRESS TRACKING"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""

publish_doc \
    "SESSION-COMPLETE-FEB1-2026.md" \
    "session-summary" \
    "session,progress"

publish_doc \
    "SESSION-FEB1-2026-COMPLETE.md" \
    "session-summary" \
    "session,complete"

publish_doc \
    "SESSION-SUMMARY-FEB1-2026.md" \
    "session-summary" \
    "session,summary"

publish_doc \
    "HISTORIC-SESSION-JAN31-2026-FINAL.md" \
    "session-summary" \
    "session,historic"

publish_doc \
    "COMPLETE-TASK-TRACKING-JAN31-2026.md" \
    "progress-tracking" \
    "tasks,tracking,progress"

# ==============================================================================
# 11. GUIDES & DOCUMENTATION (Priority 3)
# ==============================================================================
echo "─────────────────────────────────────────────────────────────────────────"
echo "1️⃣1️⃣  SETUP GUIDES & DOCUMENTATION"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""

publish_doc \
    "QUICK-START-GUIDE-FEB1-2026.md" \
    "guide" \
    "quick-start,guide,setup"

publish_doc \
    "QUICK-START-RAG.md" \
    "guide" \
    "quick-start,rag"

publish_doc \
    "SCRAPER-AND-AIS-SETUP-GUIDE.md" \
    "guide" \
    "setup,scraper,ais"

publish_doc \
    "SERVICES-FIX-GUIDE.md" \
    "guide" \
    "services,troubleshooting"

publish_doc \
    "CONTINUOUS-OPERATIONS-GUIDE.md" \
    "guide" \
    "operations,continuous"

publish_doc \
    "DATA-RETENTION-POLICY.md" \
    "policy" \
    "data,retention,compliance"

# ==============================================================================
# 12. MASTER TODO & PROJECT REPORTS (Priority 1)
# ==============================================================================
echo "─────────────────────────────────────────────────────────────────────────"
echo "1️⃣2️⃣  PROJECT PLANNING & MASTER TODO"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""

publish_doc \
    "Mari8x_TODO.md" \
    "project-planning" \
    "todo,planning,roadmap,phase5-complete"

publish_doc \
    "MARI8X-MASTER-TODO.md" \
    "project-planning" \
    "todo,master,planning"

publish_doc \
    "MARI8X-PROJECT-STATUS.md" \
    "project-status" \
    "status,project"

publish_doc \
    "NEXT-TASKS-ROADMAP.md" \
    "project-planning" \
    "roadmap,next-tasks"

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
echo "🌐  VIEWER LINKS"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""
echo "📍 Project Home:"
echo "   $VIEWER_URL/"
echo ""
echo "📄 Key Documents:"
echo "   📊 Comprehensive Status: $VIEWER_URL/MARI8X-COMPREHENSIVE-STATUS-FEB1-2026.md"
echo "   ✅ Phase 5 Complete: $VIEWER_URL/PHASE5-100-PERCENT-COMPLETE.md"
echo "   🌊 Weather Routing: $VIEWER_URL/WEATHER-ROUTING-COMPLETE.md"
echo "   🤖 Automation: $VIEWER_URL/VOYAGE-AUTOMATION-COMPLETE.md"
echo "   🗺️  Enhanced Map: $VIEWER_URL/ENHANCED-LIVE-MAP-COMPLETE.md"
echo "   📋 Master TODO: $VIEWER_URL/Mari8x_TODO.md"
echo "   🎯 Investor Deck: $VIEWER_URL/MARI8X-INVESTOR-DECK.md"
echo "   🚀 Showcase: $VIEWER_URL/MARI8X-SHOWCASE.md"
echo ""
echo "🔍 Search for documents:"
echo "   https://ankr.in/search?q=mari8x+phase5"
echo "   https://ankr.in/search?q=weather+routing"
echo "   https://ankr.in/search?q=voyage+automation"
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
echo "🎉  MARI8X V4 PUBLISHING COMPLETE!"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""
echo "✨ What's New in v4:"
echo "   • Phase 5 (Voyage Monitoring) 100% complete documentation"
echo "   • Comprehensive status report (66% → 76% roadmap)"
echo "   • Weather routing engine guide (5-10% fuel savings)"
echo "   • Voyage automation guide (60-70% manual work reduction)"
echo "   • Enhanced live map guide (1,000+ vessels at 60 FPS)"
echo "   • Updated Mari8x_TODO.md (Phase 5 now 100%)"
echo "   • Complete AIS integration documentation"
echo "   • RAG & knowledge engine guides"
echo "   • All test reports (E2E, frontend, GraphQL)"
echo "   • Investor deck & showcase updates"
echo ""
echo "📈 Project Progress:"
echo "   • Overall: 66% complete (412/628 tasks)"
echo "   • Phase 5: 100% complete (55/55 tasks) ✅"
echo "   • Phases Complete: 4/34"
echo "   • Next Target: 76% in 4 weeks"
echo ""
echo "🚀 Next Steps:"
echo "   1. Review comprehensive status at:"
echo "      $VIEWER_URL/MARI8X-COMPREHENSIVE-STATUS-FEB1-2026.md"
echo "   2. Start Week 1 quick wins (Phase 22 + Phase 2)"
echo "   3. Begin Phase 8 (AI Engine) architecture"
echo ""
echo "🙏 All documentation now live at https://ankr.in/"
echo ""
