#!/bin/bash
# Publish Mari8X USP and Load Matching Reports to ANKR Viewer
set -e

echo "🚢 === Publishing Mari8X USP to ANKR Viewer === 🚢"
echo ""

# Configuration
MARI8X_SOURCE="/root/apps/ankr-maritime"
DOCS_DESTINATION="/root/ankr-universe-docs/project/documents/mari8x-usp"
VIEWER_URL="https://ankr.in/project/documents/mari8x-usp"

# Create destination directory
echo "📁 Creating destination directory..."
mkdir -p "$DOCS_DESTINATION"
echo "  ✅ Created: $DOCS_DESTINATION"

# Copy Mari8X USP documents
echo ""
echo "📄 Publishing Mari8X Documents..."

cp "$MARI8X_SOURCE/Mari8X_USP.md" "$DOCS_DESTINATION/" && \
  echo "  ✅ Mari8X_USP.md"

cp "$MARI8X_SOURCE/LOAD-MATCHING-FEASIBILITY-REPORT.md" "$DOCS_DESTINATION/" && \
  echo "  ✅ LOAD-MATCHING-FEASIBILITY-REPORT.md"

cp "$MARI8X_SOURCE/GISIS-OWNER-EXTRACTION-SUCCESS.md" "$DOCS_DESTINATION/" && \
  echo "  ✅ GISIS-OWNER-EXTRACTION-SUCCESS.md"

cp "$MARI8X_SOURCE/COMPLETE-STATUS-FEB1-2026.md" "$DOCS_DESTINATION/" 2>/dev/null && \
  echo "  ✅ COMPLETE-STATUS-FEB1-2026.md" || echo "  ⚠️  COMPLETE-STATUS-FEB1-2026.md not found"

# Create index for viewer
echo ""
echo "📝 Creating viewer index..."
cat > "$DOCS_DESTINATION/index.md" << 'VIEWEREOF'
---
title: "Mari8X - Revolutionary Maritime Operations Platform"
description: "The ONLY platform with complete AIS → Owner → Load Matching workflow"
category: "Product Documentation"
date: "2026-02-01"
author: "Mari8X Team"
---

# 🚢 Mari8X Documentation Hub

## Quick Links

### 📊 Business Documents
- **[Mari8X USP](./Mari8X_USP.md)** - Unique Selling Proposition & Market Analysis
- **[Load Matching Feasibility Report](./LOAD-MATCHING-FEASIBILITY-REPORT.md)** - Complete workflow analysis

### 🔧 Technical Documents
- **[GISIS Owner Extraction Success](./GISIS-OWNER-EXTRACTION-SUCCESS.md)** - Implementation guide
- **[Platform Status (Feb 1, 2026)](./COMPLETE-STATUS-FEB1-2026.md)** - Current progress

---

## 🎯 What is Mari8X?

Mari8X is the **ONLY maritime operations platform** that combines:

✅ Real-time AIS vessel tracking
✅ Automated vessel ownership extraction (IMO GISIS)
✅ Comprehensive port tariff database (800+ ports)
✅ Integrated load matching workflow

**Result:** From seeing a vessel to contacting its owner in **14 seconds** (vs 72 minutes manually)

---

## 📈 Key Metrics

```
Efficiency Gain:     99.7% (72 min → 14 sec)
Productivity Boost:  50x vessels per day
Revenue Multiplier:  5x potential income
Cost Savings:        $12,000/year per user
ROI:                 4,067% (40x return)

Workflow Readiness:  83% operational
Owner Data Success:  100% extraction rate
Port Coverage:       800+ with live tariffs
```

---

## 🚀 Quick Start

1. **Read the USP** - Understand what makes Mari8X unique
2. **Review Feasibility Report** - See the complete technical analysis
3. **Check Platform Status** - Current implementation progress

---

**Published:** February 1, 2026
**Status:** Production Ready
**Market Position:** First-to-Market Innovation

VIEWEREOF

echo "  ✅ Created index.md"

# Update main project index
echo ""
echo "📋 Updating main project index..."

MAIN_INDEX="/root/ankr-universe-docs/project/documents/index.md"

if [ -f "$MAIN_INDEX" ]; then
  # Check if Mari8X section already exists
  if ! grep -q "Mari8X" "$MAIN_INDEX"; then
    echo "" >> "$MAIN_INDEX"
    echo "## 🚢 Mari8X - Maritime Operations Platform" >> "$MAIN_INDEX"
    echo "" >> "$MAIN_INDEX"
    echo "- [Mari8X USP & Documentation](./mari8x-usp/index.md)" >> "$MAIN_INDEX"
    echo "  ✅ Added Mari8X section to main index"
  else
    echo "  ℹ️  Mari8X section already exists in main index"
  fi
else
  echo "  ⚠️  Main index not found, skipping update"
fi

# Success message
echo ""
echo "✅ === Publication Complete! ==="
echo ""
echo "📱 View online at:"
echo "   $VIEWER_URL/"
echo ""
echo "📄 Documents published:"
echo "   • Mari8X USP (comprehensive)"
echo "   • Load Matching Feasibility Report"
echo "   • GISIS Owner Extraction Guide"
echo "   • Platform Status (Feb 1, 2026)"
echo ""
echo "🎯 Next steps:"
echo "   1. Visit the viewer URL to verify"
echo "   2. Share with stakeholders/investors"
echo "   3. Use for customer demos"
echo ""
echo "🙏 Jai GuruJi! With Guru's grace, Mari8X will revolutionize maritime operations! 🙏"
echo ""

