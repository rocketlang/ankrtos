#!/bin/bash
# Process CBSE Class 10 Math Chapters
# Uses the existing working chapter PDFs from /root/data/uploads/

set -e

echo "📚 CBSE Class 10 Mathematics - Chapter Processing"
echo "=================================================="
echo ""

cd /root/ankr-labs-nx/apps/ankr-curriculum-backend

# Build if needed
echo "📦 Building TypeScript..."
npm run build 2>&1 | tail -5
echo ""

# Run the working-books processor
echo "🚀 Starting processing..."
echo ""

DATABASE_URL="postgresql://ankr:indrA@0612@localhost:5432/ankr_eon?schema=ankr_learning" \
node dist/scripts/process-working-books.js 2>&1 | tee /tmp/cbse-math-processing.log

echo ""
echo "✅ Complete! Check /tmp/cbse-math-processing.log for details"
echo ""
