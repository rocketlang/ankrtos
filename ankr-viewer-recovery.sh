#!/bin/bash

# ANKR Viewer Emergency Recovery Script
# Use this if document viewer is broken

set -e

echo "🚨 ANKR Viewer Emergency Recovery"
echo "=================================="
echo ""

read -p "This will restart all viewer services. Continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

echo ""
echo "🛑 Step 1: Stopping services..."
pm2 stop ankr-interact ankr-interact-frontend 2>/dev/null || true
pkill -f ankr-viewer-server 2>/dev/null || true
echo "✅ Services stopped"
echo ""

echo "🔨 Step 2: Restarting docs server..."
cd /root
nohup bun ankr-viewer-server.js > /tmp/ankr-viewer.log 2>&1 &
sleep 2
if lsof -i:3080 > /dev/null 2>&1; then
    echo "✅ Docs server started (port 3080)"
else
    echo "❌ Failed to start docs server"
fi
echo ""

echo "🔄 Step 3: Restarting viewer..."
pm2 restart ankr-interact ankr-interact-frontend
sleep 3
echo "✅ Viewer restarted"
echo ""

echo "🔧 Step 4: Restarting nginx..."
sudo systemctl restart nginx
echo "✅ Nginx restarted"
echo ""

echo "🧪 Step 5: Testing..."
sleep 2

# Test API
if curl -s http://localhost:3080/api/health > /dev/null 2>&1; then
    echo "   ✅ API server responding"
else
    echo "   ❌ API server not responding"
fi

# Test frontend
if curl -s -I http://localhost:3199 2>&1 | grep -q "HTTP.*200"; then
    echo "   ✅ Frontend responding"
else
    echo "   ❌ Frontend not responding"
fi

# Test web
if curl -s -I https://ankr.in/project/documents/ 2>&1 | grep -q "HTTP.*200"; then
    echo "   ✅ Web access working"
else
    echo "   ⚠️  Web access may have issues (check firewall/DNS)"
fi

echo ""
echo "=================================="
echo "✅ Recovery Complete!"
echo "=================================="
echo ""
echo "🌐 Test at: https://ankr.in/project/documents/"
echo ""
echo "📊 Service Status:"
pm2 list | grep -E "ankr-interact|Name"
echo ""
echo "📝 Logs:"
echo "  Docs API: tail -f /tmp/ankr-viewer.log"
echo "  Viewer:   pm2 logs ankr-interact"
echo ""
