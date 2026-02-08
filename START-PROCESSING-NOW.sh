#!/bin/bash
# START PROCESSING - PROVEN WORKING APPROACH
# Run this script to process books immediately

set -e  # Exit on error

echo "🚀 Starting Book Processing (Proven Working Approach)"
echo "=================================================="
echo ""

# Navigate to app directory
cd /root/ankr-labs-nx/apps/ankr-curriculum-backend

# Build TypeScript to JavaScript
echo "📦 Building TypeScript..."
npm run build

echo ""
echo "✅ Build complete!"
echo ""
echo "📚 Processing books (this will take 2-3 hours)..."
echo ""

# Run the compiled JavaScript with correct DATABASE_URL
DATABASE_URL="postgresql://ankr:indrA@0612@localhost:5432/ankr_eon?schema=ankr_learning" \
node dist/scripts/process-batch-books.js 2>&1 | tee /tmp/processing-$(date +%Y%m%d-%H%M%S).log

echo ""
echo "=================================================="
echo "✅ Processing complete!"
echo ""
echo "📊 Check database:"
echo "bash /tmp/verify-database.sh"
echo ""
