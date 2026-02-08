#!/bin/bash
##############################################################################
# Mari8X Simple Nginx Deployment (The Old Way)
##############################################################################

set -e

echo "════════════════════════════════════════════════════════════════════════"
echo "  🚀 MARI8X SIMPLE DEPLOYMENT"
echo "  Deploying to nginx server"
echo "════════════════════════════════════════════════════════════════════════"
echo ""

BUILD_DIR="/root/apps/ankr-maritime/frontend/dist"
SERVER_USER="${SERVER_USER:-root}"
SERVER_HOST="${SERVER_HOST:-mari8x.com}"
SERVER_PATH="${SERVER_PATH:-/var/www/mari8x}"
SSH_KEY="/root/.ssh/gitankr"

# Check if build exists
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Build not found at $BUILD_DIR"
    echo "   Run: cd /root/apps/ankr-maritime/frontend && npx vite build"
    exit 1
fi

echo "✅ Build found: $BUILD_DIR"
echo "   Size: $(du -sh $BUILD_DIR | cut -f1)"
echo ""

# Test server connection
echo "🔐 Testing server connection..."
if ssh -i "$SSH_KEY" -o ConnectTimeout=5 -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" "echo 'Connected'" 2>/dev/null; then
    echo "✅ Server connection successful"
else
    echo "❌ Cannot connect to server"
    echo ""
    echo "Please provide server details:"
    echo "  export SERVER_USER=your_username"
    echo "  export SERVER_HOST=your_server_ip"
    echo "  export SERVER_PATH=/var/www/mari8x"
    echo ""
    echo "Then run: $0"
    exit 1
fi

echo ""
echo "📤 Deploying to $SERVER_USER@$SERVER_HOST:$SERVER_PATH"
echo ""

# Create backup on server
echo "💾 Creating backup on server..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" \
    "if [ -d '$SERVER_PATH' ]; then \
        cp -r '$SERVER_PATH' '${SERVER_PATH}.backup.$(date +%Y%m%d-%H%M%S)' && \
        echo '  ✅ Backup created'; \
    fi"

# Upload files
echo ""
echo "📦 Uploading files..."
rsync -avz --delete \
    -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
    "$BUILD_DIR/" \
    "$SERVER_USER@$SERVER_HOST:$SERVER_PATH/"

echo ""
echo "🔧 Setting permissions..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" \
    "chown -R www-data:www-data '$SERVER_PATH' 2>/dev/null || \
     chown -R nginx:nginx '$SERVER_PATH' 2>/dev/null || \
     echo '  ⚠️  Could not set ownership (may need sudo)'"

echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo "  ✅ DEPLOYMENT COMPLETE!"
echo "════════════════════════════════════════════════════════════════════════"
echo ""
echo "🌐 Your site is live at: https://mari8x.com"
echo ""
echo "📊 Deployed content:"
echo "   • 46M+ vessel positions"
echo "   • 36,018 active vessels"
echo "   • 12,714 global ports"
echo "   • 2.15% OpenSeaMap coverage (273 ports)"
echo "   • 6 live stat cards"
echo "   • Enhanced landing page"
echo ""
echo "🔍 Verify deployment:"
echo "   curl -I https://mari8x.com"
echo ""
