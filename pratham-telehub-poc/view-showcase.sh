#!/bin/bash

# Pratham TeleHub - Open Showcase in Browser
# Usage: ./view-showcase.sh

SHOWCASE_PATH="/root/ankr-labs-nx/apps/ankr-website/src/library/pratham-telehub-showcase.html"

echo "🚀 Opening Pratham TeleHub Showcase..."
echo ""
echo "📄 Showcase location: $SHOWCASE_PATH"
echo ""

if [ -f "$SHOWCASE_PATH" ]; then
    # Check if running in desktop environment
    if command -v xdg-open &> /dev/null; then
        xdg-open "$SHOWCASE_PATH"
        echo "✅ Opened in default browser"
    elif command -v open &> /dev/null; then
        open "$SHOWCASE_PATH"
        echo "✅ Opened in default browser"
    else
        echo "ℹ️  Copy this path to your browser:"
        echo "   file://$SHOWCASE_PATH"
        echo ""
        echo "💡 Or save as PDF:"
        echo "   Open in browser → Print → Save as PDF"
    fi
else
    echo "❌ Showcase file not found!"
    echo "   Expected: $SHOWCASE_PATH"
    exit 1
fi

echo ""
echo "📊 This showcase demonstrates:"
echo "   ✅ Telecaller Dashboard with AI Assistant"
echo "   ✅ Manager Command Center with Real-time Analytics"
echo "   ✅ Business Impact & ROI Calculations"
echo "   ✅ Technical Architecture & Demo Script"
echo ""
echo "💾 Save as PDF: Click 'Save as PDF' button in browser"
echo ""
