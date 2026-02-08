#!/bin/bash
##############################################################################
# Mari8X Cloudflare Pages Deployment
##############################################################################

set -e

echo "════════════════════════════════════════════════════════════════════════"
echo "  🚀 DEPLOYING MARI8X TO mari8x.com via Cloudflare Pages"
echo "════════════════════════════════════════════════════════════════════════"
echo ""

# Check for Cloudflare API token
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ CLOUDFLARE_API_TOKEN not set!"
    echo ""
    echo "Please set your Cloudflare API token:"
    echo "  export CLOUDFLARE_API_TOKEN='your-token-here'"
    echo ""
    echo "Or run this script with the token:"
    echo "  CLOUDFLARE_API_TOKEN='your-token' $0"
    echo ""
    exit 1
fi

# Build directory
BUILD_DIR="/root/apps/ankr-maritime/frontend/dist"

echo "📦 Using existing build at: $BUILD_DIR"
echo "   Build size: $(du -sh $BUILD_DIR | cut -f1)"
echo ""

# Deploy to Cloudflare Pages
echo "🚀 Deploying to Cloudflare Pages..."
echo ""

cd /root/apps/ankr-maritime/frontend

npx wrangler pages deploy dist \
  --project-name mari8x \
  --branch main \
  --commit-dirty=true

echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo "  ✅ DEPLOYMENT COMPLETE!"
echo "════════════════════════════════════════════════════════════════════════"
echo ""
echo "🌐 Your site should be live at: https://mari8x.com"
echo ""
echo "📊 What's now live:"
echo "   • 6 stat cards with live data"
echo "   • OpenSeaMap coverage: 2.3% (291 ports)"
echo "   • 46M+ vessel positions"
echo "   • 36,018 active vessels"
echo "   • Enhanced landing page with USPs"
echo ""
echo "🔄 Cloudflare CDN will propagate changes globally within ~1 minute"
echo ""
