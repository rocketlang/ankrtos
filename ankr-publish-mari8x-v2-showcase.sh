#!/bin/bash
# ANKR Publish v4 - Mari8X V2 Showcase (February 6, 2026)
# Direct file copy to ankr-universe-docs viewer
# Generated: February 6, 2026

set -e

echo "🚢 === Mari8X V2 Showcase Publishing === 🚢"
echo ""

# Configuration
SOURCE_DIR="/root/apps/ankr-maritime"
DEST_ROOT="/root/ankr-universe-docs/project/documents/ankr-maritime"
VIEWER_URL="https://ankr.in/project/documents/ankr-maritime"

# Create destination directory
echo "📁 Creating destination directory..."
mkdir -p "$DEST_ROOT"
echo "  ✅ Created: $DEST_ROOT"
echo ""

# Change to source directory
cd "$SOURCE_DIR"

# Counter
PUBLISHED=0

# Function to copy document
copy_doc() {
    local file="$1"
    if [ -f "$file" ]; then
        cp "$file" "$DEST_ROOT/" && \
        echo "  ✅ $file" && \
        PUBLISHED=$((PUBLISHED + 1))
    else
        echo "  ⚠️  Skipped: $file (not found)"
    fi
}

echo "📚 Publishing Mari8X V2 Showcase..."
echo ""

# Publish the showcase document
copy_doc "MARI8X-V2-SHOWCASE-FEB2026.md"
echo ""

# Update viewer metadata (.viewerrc)
echo "📝 Updating viewer metadata..."
cat > "$DEST_ROOT/.viewerrc" << 'VIEWEREOF'
{
  "category": "Maritime Platform",
  "title": "Mari8X V2 - Next-Generation Maritime Intelligence Platform",
  "description": "Production-ready maritime platform with AIS-based routing, AI-powered DMS with blockchain, intelligent auto-matching, and RAG-enhanced search. 137 pages, 1,000+ features, 41M+ AIS positions.",
  "featured": true,
  "priority": 1,
  "tags": [
    "mari8x",
    "maritime",
    "v2",
    "showcase",
    "ais-routing",
    "docchain-blockchain",
    "auto-matching",
    "rag-engine",
    "port-intelligence",
    "production-ready",
    "ai-powered"
  ],
  "stats": {
    "version": "2.0.0",
    "featurePages": "137",
    "uniqueFeatures": "1000+",
    "aisPositions": "41245246+",
    "activeVessels": "34788",
    "verifiedPorts": "12714",
    "countries": "103",
    "portTariffs": "800+",
    "apiResponseTime": "<100ms",
    "uptime": "99.9%",
    "vesselLookupSpeed": "14 seconds",
    "timeSavings": "99.7%",
    "speedup": "308x",
    "dataAccuracy": "100%"
  },
  "highlights": [
    "AIS-Based Intelligent Routing (ML-powered with 41M+ positions)",
    "DocChain - AI-Powered DMS with Blockchain Verification",
    "Intelligent Auto-Matching Engine (AI-powered vessel-cargo pairing)",
    "RAG Engine with PageIndex Enhancement",
    "Intelligent Port Intelligence (Predictive ML)",
    "14-Second Vessel→Owner Workflow (308x faster)",
    "100% Data Accuracy (Proprietary Verified Sources)",
    "137 Mobile-Responsive Pages",
    "1,000+ Unique Features",
    "Production Ready with 99.9% Uptime"
  ],
  "version": "v2.0.0",
  "lastUpdated": "2026-02-06"
}
VIEWEREOF

echo "  ✅ .viewerrc created"
echo ""

# Update index.md to include the new showcase
echo "📝 Updating index.md..."
if [ -f "$DEST_ROOT/index.md" ]; then
    # Add showcase to existing index
    sed -i '/## 🎯 Showcase & Overview/a\- [Mari8X V2 Showcase (Feb 2026)](MARI8X-V2-SHOWCASE-FEB2026.md) - **NEW!** Production-ready platform overview with latest stats' "$DEST_ROOT/index.md" 2>/dev/null || \
    echo "- [Mari8X V2 Showcase (Feb 2026)](MARI8X-V2-SHOWCASE-FEB2026.md)" >> "$DEST_ROOT/index.md"
    echo "  ✅ Updated index.md"
else
    # Create new index if doesn't exist
    cat > "$DEST_ROOT/index.md" << 'INDEXEOF'
---
title: "Mari8X Maritime Platform - Complete Documentation"
description: "Production-ready maritime operations platform with AI-powered features"
category: "Maritime Platform"
featured: true
---

# 🚢 Mari8X Maritime Platform

## 🎯 Showcase & Overview

- [Mari8X V2 Showcase (Feb 2026)](MARI8X-V2-SHOWCASE-FEB2026.md) - **NEW!** Production-ready platform overview with latest stats

## Platform Highlights

- **137 Feature Pages** - All mobile-responsive
- **1,000+ Unique Features** - Comprehensive maritime operations
- **41M+ AIS Positions** - Real-time vessel tracking
- **12,714 Verified Ports** - 103 countries worldwide
- **14-Second Workflow** - Vessel→Owner→Cargo (308x faster)
- **100% Data Accuracy** - Proprietary verified sources

## Key Technologies

1. **AIS-Based Intelligent Routing** - ML-powered with 41M+ positions
2. **DocChain Blockchain DMS** - Immutable document verification
3. **Intelligent Auto-Matching** - AI-powered vessel-cargo pairing
4. **RAG Engine with PageIndex** - Enhanced semantic search
5. **Port Intelligence** - Predictive ML for congestion & DA forecasting

## Access

- **Production URL:** https://mari8x.com
- **API Endpoint:** https://api.mari8x.com/graphql
- **Documentation:** https://docs.mari8x.com

---

*Last Updated: February 6, 2026*
INDEXEOF
    echo "  ✅ Created new index.md"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Publishing Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  ✅ Documents Published: $PUBLISHED"
echo "  📁 Destination: $DEST_ROOT"
echo "  🌐 Viewer URL: $VIEWER_URL"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 Publishing Complete!"
echo ""
echo "📖 View your documentation at:"
echo "   $VIEWER_URL"
echo ""
echo "🔍 Specific document:"
echo "   $VIEWER_URL/MARI8X-V2-SHOWCASE-FEB2026.md"
echo ""
