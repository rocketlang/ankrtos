#!/bin/bash

# Mari8X February 1, 2026 Session Documentation Publisher
# Publishes all documentation files created in the Feb 1, 2026 development session

set -e

REPO_PATH="/root/apps/ankr-maritime"
BRANCH="master"
COMMIT_MSG="docs: Add February 1, 2026 session documentation - 3 phases completed

Session Achievements:
- Phase 9: S&P Desk (70% → 100%) - 43 endpoints
- Phase 3: Chartering Desk (0% → 100%) - 26 endpoints
- Phase 8: AI Engine Frontend (0% → 100%) - 7 components, 1,495 lines

Documentation files:
- PHASE3-CHARTERING-COMPLETE.md - Chartering desk API reference
- PHASE8-AI-FRONTEND-COMPLETE.md - AI components guide
- PHASE9-SNP-COMPLETE.md - S&P desk complete guide
- SESSION-COMPLETE-FEB1-2026-COMPREHENSIVE.md - Full session summary
- MARI8X-PROJECT-STATUS.md - Updated project status (85%)
- PROGRESS-TRACKING-FEB1-2026.md - Hour-by-hour breakdown
- WHATS-NEW-FEB1-2026.md - New features (especially /ai-engine route)
- Mari8X-Master-Todo-V2.md - Complete TODO with 100% authenticity

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

echo "============================================"
echo "Mari8X Feb 1 Session Docs Publisher"
echo "============================================"
echo ""

cd "$REPO_PATH" || exit 1

# Check if we're in a git repo
if [ ! -d ".git" ]; then
    echo "❌ Error: Not a git repository"
    exit 1
fi

echo "📁 Current directory: $(pwd)"
echo "🌿 Current branch: $(git branch --show-current)"
echo ""

# List files to be published
echo "📄 Files to publish (8 files):"
echo ""

FILES=(
    "PHASE3-CHARTERING-COMPLETE.md"
    "PHASE8-AI-FRONTEND-COMPLETE.md"
    "PHASE9-SNP-COMPLETE.md"
    "SESSION-COMPLETE-FEB1-2026-COMPREHENSIVE.md"
    "MARI8X-PROJECT-STATUS.md"
    "PROGRESS-TRACKING-FEB1-2026.md"
    "WHATS-NEW-FEB1-2026.md"
    "Mari8X-Master-Todo-V2.md"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        SIZE=$(du -h "$file" | cut -f1)
        echo "  ✅ $file ($SIZE)"
    else
        echo "  ⚠️  $file (not found, skipping)"
    fi
done

echo ""
read -p "📤 Publish these files? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Publication cancelled"
    exit 1
fi

echo ""
echo "🔄 Staging files..."

# Stage existing files
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        git add "$file"
        echo "  ✓ Staged: $file"
    fi
done

echo ""
echo "📊 Git status:"
git status --short

echo ""
echo "💾 Creating commit..."
git commit -m "$COMMIT_MSG"

echo ""
echo "✅ Commit created successfully!"
echo ""
echo "📤 Pushing to $BRANCH..."
git push origin "$BRANCH"

echo ""
echo "============================================"
echo "✅ Publication Complete!"
echo "============================================"
echo ""
echo "📊 Summary:"
echo "  • 8 documentation files published"
echo "  • Branch: $BRANCH"
echo "  • Remote: origin"
echo ""
echo "🔗 View changes:"
echo "  https://github.com/rocketlang/mrk8x/tree/$BRANCH"
echo ""
echo "📈 Project Status: 85% complete (15% remaining)"
echo ""
