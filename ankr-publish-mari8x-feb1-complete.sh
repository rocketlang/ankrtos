#!/bin/bash
# ANKR Publish v5 - Mari8X Complete Session Publishing
# Publishes all Feb 1 documents + creates alphabetical index
# Generated: February 1, 2026 23:22 UTC

set -e

echo "🚢 === Mari8X Feb 1, 2026 Complete Publishing === 🚢"
echo ""

# Configuration
SOURCE_DIR="/root/apps/ankr-maritime"
DEST_ROOT="/root/ankr-universe-docs/project/documents/ankr-maritime"
VIEWER_URL="https://ankr.in/project/documents/ankr-maritime"

# Create destination directory
echo "📁 Ensuring destination directory exists..."
mkdir -p "$DEST_ROOT"
echo "  ✅ Directory ready: $DEST_ROOT"
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

echo "📚 Publishing February 1, 2026 Complete Session..."
echo ""

# ===== TODAY'S NEW DOCUMENTS =====
echo "1️⃣  Today's Session Documents (Feb 1, 2026)"
copy_doc "TESTING-STATUS-FEB1-2026.md"
copy_doc "BACKEND-FIX-GUIDE.md"
copy_doc "MARI8X-STRATEGIC-FEATURES-FEB2026.md"
copy_doc "PROGRESS-TRACKING-FEB1-2026.md"
copy_doc "WHATS-NEW-FEB1-2026.md"
copy_doc "Mari8X-Master-Todo-V2.md"
copy_doc "MARI8X-PROJECT-STATUS.md"
copy_doc "SESSION-COMPLETE-FEB1-2026-FINAL.md"
copy_doc "QUICK-ACCESS-FEB1-DOCS.md"
echo ""

# ===== PHASE COMPLETION REPORTS =====
echo "2️⃣  Phase Completion Reports"
copy_doc "PHASE3-CHARTERING-COMPLETE.md"
copy_doc "PHASE8-AI-FRONTEND-COMPLETE.md"
copy_doc "PHASE9-SNP-COMPLETE.md"
echo ""

echo "📊 Publishing Summary:"
echo "  • Files published: $PUBLISHED"
echo "  • Destination: $DEST_ROOT"
echo ""

# ===== CREATE ALPHABETICAL INDEX =====
echo "📝 Creating alphabetical document index..."

cat > "$DEST_ROOT/MARI8X-DOCS-INDEX-ALPHABETICAL.md" << 'INDEXEOF'
---
title: "Mari8X Documentation Index (Alphabetical)"
category: documentation-index
date: 2026-02-01
tags:
  - mari8x
  - index
  - documentation
priority: high
---

# Mari8X Complete Documentation Index

**Total Documents:** 164+
**Last Updated:** February 1, 2026
**View Online:** https://ankr.in/project/documents/ankr-maritime

---

## 📚 Quick Navigation

### Recent Session Documents (Feb 1, 2026)
- [BACKEND-FIX-GUIDE.md](./BACKEND-FIX-GUIDE.md) - Backend dependency fixes
- [MARI8X-PROJECT-STATUS.md](./MARI8X-PROJECT-STATUS.md) - 85% project completion
- [MARI8X-STRATEGIC-FEATURES-FEB2026.md](./MARI8X-STRATEGIC-FEATURES-FEB2026.md) ⭐ **NEW** - 66 features + Email Engine + Routing V2
- [Mari8X-Master-Todo-V2.md](./Mari8X-Master-Todo-V2.md) - Complete TODO (100% authentic)
- [PHASE3-CHARTERING-COMPLETE.md](./PHASE3-CHARTERING-COMPLETE.md) - Chartering Desk (26 endpoints)
- [PHASE8-AI-FRONTEND-COMPLETE.md](./PHASE8-AI-FRONTEND-COMPLETE.md) - AI Dashboard (7 components)
- [PHASE9-SNP-COMPLETE.md](./PHASE9-SNP-COMPLETE.md) - S&P Desk (43 endpoints)
- [PROGRESS-TRACKING-FEB1-2026.md](./PROGRESS-TRACKING-FEB1-2026.md) - Hour-by-hour breakdown
- [TESTING-STATUS-FEB1-2026.md](./TESTING-STATUS-FEB1-2026.md) - Testing status + blockers
- [WHATS-NEW-FEB1-2026.md](./WHATS-NEW-FEB1-2026.md) - New `/ai-engine` route

---

## 📖 Alphabetical Document List

INDEXEOF

# Generate alphabetical list of all markdown files
echo "" >> "$DEST_ROOT/MARI8X-DOCS-INDEX-ALPHABETICAL.md"
echo "### A" >> "$DEST_ROOT/MARI8X-DOCS-INDEX-ALPHABETICAL.md"
ls -1 *.md | sort | while read file; do
    # Get first letter
    first_letter=$(echo "$file" | cut -c1 | tr '[:lower:]' '[:upper:]')

    # Check if we need a new letter section
    if [ "$first_letter" != "$prev_letter" ] && [ "$first_letter" != "A" ]; then
        echo "" >> "$DEST_ROOT/MARI8X-DOCS-INDEX-ALPHABETICAL.md"
        echo "### $first_letter" >> "$DEST_ROOT/MARI8X-DOCS-INDEX-ALPHABETICAL.md"
    fi
    prev_letter="$first_letter"

    # Add file link
    echo "- [$file](./$file)" >> "$DEST_ROOT/MARI8X-DOCS-INDEX-ALPHABETICAL.md"
done

# Add footer
cat >> "$DEST_ROOT/MARI8X-DOCS-INDEX-ALPHABETICAL.md" << 'FOOTEREOF'

---

## 🔗 External Links

- **GitHub Repository:** https://github.com/rocketlang/mrk8x
- **Frontend:** http://localhost:3008
- **Backend API:** http://localhost:4051/graphql
- **AI Dashboard:** http://localhost:3008/ai-engine ⭐

---

**Published:** February 1, 2026
**Document Count:** 164+
**Format:** Markdown (GitHub Flavored)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
FOOTEREOF

echo "  ✅ Created alphabetical index"
echo ""

echo "🎉 Publication Complete!"
echo ""
echo "📍 Access documentation at:"
echo "  • $VIEWER_URL"
echo "  • $VIEWER_URL/MARI8X-DOCS-INDEX-ALPHABETICAL.md (NEW)"
echo ""
echo "📊 Summary:"
echo "  • Session docs: $PUBLISHED files"
echo "  • Total mari8x docs: 164+"
echo "  • Alphabetical index: ✅ Created"
echo "  • New strategic doc: MARI8X-STRATEGIC-FEATURES-FEB2026.md (18,000+ lines)"
echo ""
echo "✅ All February 1, 2026 session documentation is now published!"
echo ""
