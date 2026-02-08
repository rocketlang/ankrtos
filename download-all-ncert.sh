#!/bin/bash
# Download ALL NCERT Books - Complete Archive
# This will take 2-3 hours

set -e

echo "📚 NCERT COMPLETE DOWNLOAD"
echo "=========================="
echo ""
echo "This will download:"
echo "  • ALL classes (6-12)"
echo "  • ALL subjects (Math, Science, Social, English, Hindi)"
echo "  • ALL languages (English, Hindi, Urdu, etc.)"
echo "  • ~40-50 books total"
echo ""
echo "⏱️  Estimated time: 2-3 hours"
echo "💾 Storage needed: ~2-3 GB"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

cd /root/ankr-labs-nx/apps/ankr-curriculum-backend

echo ""
echo "📦 Building TypeScript..."
npm run build 2>&1 | tail -5

echo ""
echo "🚀 Starting downloads..."
echo "   Check progress: tail -f /tmp/ncert-download.log"
echo ""

# Run in background
nohup node dist/scripts/download-all-ncert-complete.js > /tmp/ncert-download.log 2>&1 &

DOWNLOAD_PID=$!
echo "✅ Download started!"
echo "   PID: $DOWNLOAD_PID"
echo "   Log: /tmp/ncert-download.log"
echo ""
echo "Monitor progress:"
echo "   tail -f /tmp/ncert-download.log"
echo ""
echo "Check completion:"
echo "   ps -p $DOWNLOAD_PID > /dev/null && echo 'Running' || echo 'Complete'"
echo ""
echo "Stop if needed:"
echo "   kill $DOWNLOAD_PID"
echo ""
