#!/bin/bash
# ANKR Publish v4 - Mari8X OSS Strategy
# Generated: February 8, 2026
# Publishes Mari8X OSS vs Enterprise Strategy Document

set -e

echo "🌊 === Mari8X OSS Strategy Publishing === 🌊"
echo ""
echo "Publishing OSS strategy documentation to https://ankr.in/"
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

echo "📚 Mari8X OSS Strategy Documentation to Publish:"
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
        --tags "$tags"; then
        echo "  ✅ Published: $file"
        ((PUBLISHED++))
    else
        echo "  ❌ Failed: $file"
        ((FAILED++))
    fi
    echo ""
}

# Publish Strategy Documents
echo "📋 Strategy & Planning:"
publish_doc "MARI8X-OSS-STRATEGY.md" "strategy" "oss,enterprise,business-model,roadmap,planning"
publish_doc "PORT-OPERATIONS-STRATEGY.md" "strategy" "port-operations,gate-in,bulk-cargo,tank-cargo"
publish_doc "ANKR-CTL-REGISTRATION.md" "infrastructure" "ankr-ctl,deployment,service-management"

# Publish Technical Documentation
echo "🛠️ Technical Documentation:"
publish_doc "MAPS-AND-DEPLOYMENT-FIXES.md" "technical" "maps,deployment,satellite-tiles,oss-stack"

# Publish Landing Page Documentation
echo "🎨 Landing Pages:"
publish_doc "MARI8X-V2-SHOWCASE-FEB2026.md" "showcase" "landing-page,features,commercial"

# Publish AIS Documentation
echo "🗺️ AIS & Data:"
publish_doc "AIS-DEEP-STUDY-ALGORITHMS-AND-RETENTION.md" "technical" "ais,timescaledb,algorithms,data-retention"
publish_doc "AIS-DATA-RETENTION-STRATEGY.md" "technical" "ais,timescaledb,retention,build-mode"

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Publishing Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Successfully Published: $PUBLISHED documents"
if [ $FAILED -gt 0 ]; then
    echo "  ❌ Failed: $FAILED documents"
fi
echo ""
echo "🌐 View at: $VIEWER_URL"
echo ""
echo "🎯 Featured Documents:"
echo "  • Mari8X OSS Strategy - OSS vs Enterprise split"
echo "  • Port Operations Strategy - Gate-in & cargo operations"
echo "  • Maps & Deployment - Satellite tiles & OSS stack"
echo "  • ANKR-CTL Registration - Service management"
echo ""
echo "✅ Publishing complete!"
