#!/bin/bash
##############################################################################
# Mari8X Cloudflare Pages Deployment Script
##############################################################################

echo "════════════════════════════════════════════════════════════════════"
echo "  🚀 MARI8X CLOUDFLARE PAGES DEPLOYMENT"
echo "════════════════════════════════════════════════════════════════════"
echo ""

# Step 1: Login to Wrangler (if not already)
echo "Step 1: Authenticate with Cloudflare"
echo "─────────────────────────────────────"
if ! wrangler whoami 2>/dev/null | grep -q "email"; then
  echo "⚠️  Not logged in. Running wrangler login..."
  wrangler login
else
  echo "✅ Already logged in to Wrangler"
fi
echo ""

# Step 2: Deploy to Cloudflare Pages
echo "Step 2: Deploy to Cloudflare Pages"
echo "───────────────────────────────────"
cd /root/apps/ankr-maritime/frontend

# Direct deployment
wrangler pages deploy dist \
  --project-name=mari8x \
  --branch=main \
  --commit-message="Deploy Mari8X $(date +%Y-%m-%d)" \
  --commit-dirty=true

echo ""
echo "════════════════════════════════════════════════════════════════════"
echo "  ✅ DEPLOYMENT COMPLETE!"
echo "════════════════════════════════════════════════════════════════════"
echo ""
echo "Your site should be live at:"
echo "  🌐 https://mari8x.pages.dev"
echo ""
echo "To set up custom domain (mari8x.com):"
echo "  1. Go to Cloudflare Pages dashboard"
echo "  2. Select 'mari8x' project"
echo "  3. Go to 'Custom domains'"
echo "  4. Add 'mari8x.com'"
echo ""
