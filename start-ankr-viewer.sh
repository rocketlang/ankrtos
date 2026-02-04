#!/bin/bash
# Start ANKR Viewer Server
# Serves documentation from /root/ankr-universe-docs/ on port 3080

echo "🚀 Starting ANKR Viewer Server..."

# Check if already running
if pgrep -f "ankr-viewer-server.js" > /dev/null; then
    echo "⚠️  Server already running. Stopping first..."
    pkill -f "ankr-viewer-server.js"
    sleep 2
fi

# Start server
nohup node /root/ankr-viewer-server.js > /root/.ankr/logs/ankr-viewer-server.log 2>&1 &
PID=$!

echo "✅ Server started (PID: $PID)"
sleep 2

# Test health
if curl -s http://localhost:3080/api/health > /dev/null; then
    echo "✅ Health check passed"
    echo ""
    echo "📍 Server Details:"
    echo "   Port: 3080"
    echo "   API: http://localhost:3080/api"
    echo "   Docs: http://localhost:3080/docs"
    echo ""
    echo "🔗 GuruJi Reports:"
    echo "   http://localhost:3080/api/files?path=project/documents/guruji-reports"
    echo ""
    echo "📱 For external access, configure nginx/cloudflare to proxy:"
    echo "   https://ankr.in → http://localhost:3080"
    echo ""
else
    echo "❌ Health check failed"
    tail -20 /root/.ankr/logs/ankr-viewer-server.log
fi
