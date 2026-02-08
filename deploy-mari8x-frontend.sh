#!/bin/bash
##############################################################################
# Mari8X Frontend Deployment Script
##############################################################################

echo "════════════════════════════════════════════════════════════════════════"
echo "  🚀 DEPLOYING MARI8X FRONTEND TO mari8x.com"
echo "════════════════════════════════════════════════════════════════════════"
echo ""

BUILD_DIR="/root/apps/ankr-maritime/frontend/dist"
DEPLOY_PACKAGE="/tmp/mari8x-frontend-$(date +%Y%m%d-%H%M%S).tar.gz"

# Create deployment package
echo "📦 Creating deployment package..."
cd /root/apps/ankr-maritime/frontend
tar -czf "$DEPLOY_PACKAGE" -C dist .

echo "✅ Package created: $DEPLOY_PACKAGE"
echo "   Size: $(du -h $DEPLOY_PACKAGE | cut -f1)"
echo ""

# Show package contents
echo "📋 Package contents:"
tar -tzf "$DEPLOY_PACKAGE" | head -10
echo "   ... (total $(tar -tzf $DEPLOY_PACKAGE | wc -l) files)"
echo ""

echo "════════════════════════════════════════════════════════════════════════"
echo "  📤 DEPLOYMENT OPTIONS"
echo "════════════════════════════════════════════════════════════════════════"
echo ""
echo "Option 1: Cloudflare Pages (if using)"
echo "   wrangler pages deploy $BUILD_DIR --project-name mari8x"
echo ""
echo "Option 2: SSH to Server"
echo "   scp -i ~/.ssh/gitankr $DEPLOY_PACKAGE user@server:/path/"
echo "   ssh -i ~/.ssh/gitankr user@server"
echo "   tar -xzf $(basename $DEPLOY_PACKAGE) -C /var/www/mari8x"
echo ""
echo "Option 3: AWS S3 / CloudFront"
echo "   aws s3 sync $BUILD_DIR s3://mari8x-frontend/"
echo "   aws cloudfront create-invalidation --distribution-id ID --paths '/*'"
echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo ""
echo "Deployment package ready at: $DEPLOY_PACKAGE"
echo ""

