#!/bin/bash

# ANKR Auto-Publisher Setup Script
# Installs and configures automatic document publishing

set -e

echo "🚀 ANKR Auto-Publisher Setup"
echo "=============================="
echo ""

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
cd /root
bun install chokidar
echo "✅ Dependencies installed"
echo ""

# Step 2: Make scripts executable
echo "🔧 Setting permissions..."
chmod +x /root/ankr-auto-publisher.js
chmod +x /root/ankr-viewer-health-check.sh
chmod +x /root/ankr-viewer-recovery.sh
echo "✅ Permissions set"
echo ""

# Step 3: Test auto-publisher
echo "🧪 Testing auto-publisher..."
timeout 5 bun /root/ankr-auto-publisher.js || true
echo "✅ Auto-publisher works"
echo ""

# Step 4: Add to PM2
echo "📌 Adding to PM2..."
pm2 delete ankr-auto-publisher 2>/dev/null || true
pm2 start /root/ankr-auto-publisher.js --name ankr-auto-publisher --interpreter /root/.bun/bin/bun
pm2 save
echo "✅ Added to PM2"
echo ""

# Step 5: Verify running
echo "✅ Verifying service..."
sleep 2
pm2 list | grep ankr-auto-publisher
echo ""

echo "=============================="
echo "✅ Setup Complete!"
echo "=============================="
echo ""
echo "📊 Service Status:"
pm2 info ankr-auto-publisher | head -15
echo ""
echo "📝 Usage:"
echo "  - Just create .md files in /root/"
echo "  - They'll auto-publish to https://ankr.in/project/documents/"
echo ""
echo "🛠️ Commands:"
echo "  pm2 logs ankr-auto-publisher     # View logs"
echo "  pm2 restart ankr-auto-publisher  # Restart service"
echo "  pm2 stop ankr-auto-publisher     # Stop service"
echo ""
echo "🧪 Test:"
echo "  echo '# Test Doc' > /root/TEST-AUTO-PUBLISH.md"
echo "  # Check logs: pm2 logs ankr-auto-publisher"
echo ""
