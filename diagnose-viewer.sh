#!/bin/bash

echo "============================================"
echo "  ANKR Document Viewer Diagnostic"
echo "============================================"
echo ""

echo "1. Checking PM2 Services..."
echo "--------------------------------------------"
pm2 list | grep -E "ankr-docs-portal|ankr-interact|ankr-auto-publisher"
echo ""

echo "2. Checking Ports..."
echo "--------------------------------------------"
echo "Port 3015 (Docs Portal Vite):"
lsof -ti:3015 && echo "✅ Active" || echo "❌ Not running"
echo ""
echo "Port 4444 (AI Proxy GraphQL):"
lsof -ti:4444 && echo "✅ Active" || echo "❌ Not running"
echo ""

echo "3. Checking Published Documents..."
echo "--------------------------------------------"
echo "Pratham Telehub documents:"
ls -lh /root/ankr-universe-docs/project/documents/pratham-telehub/*.md | wc -l
echo "Total documents published:"
find /root/ankr-universe-docs/project/documents -name "*.md" 2>/dev/null | wc -l
echo ""

echo "4. Checking New Transformation Documents..."
echo "--------------------------------------------"
ls -lh /root/ankr-universe-docs/project/documents/pratham-telehub/*TRANSFORMATION* 2>&1 | tail -5
echo ""

echo "5. Testing GraphQL Endpoint..."
echo "--------------------------------------------"
curl -s -X POST http://localhost:4444/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query { __typename }"}' | jq -r '.data // .errors // "No response"' 2>/dev/null || echo "❌ GraphQL not responding"
echo ""

echo "6. Testing Viewer URL..."
echo "--------------------------------------------"
curl -I -s https://ankr.in/project/documents/ | head -5
echo ""

echo "7. Checking Nginx Config..."
echo "--------------------------------------------"
grep -A 5 "location /project" /etc/nginx/sites-enabled/ankr.in | head -10
echo ""

echo "8. Testing Direct Vite Server..."
echo "--------------------------------------------"
curl -I -s http://localhost:3015 | head -3
echo ""

echo "9. Checking Build Files..."
echo "--------------------------------------------"
echo "Viewer dist exists:"
ls -la /var/www/ankr-interact/project/documents/ 2>&1 | grep -E "index.html|assets"
echo ""

echo "10. Auto-Publisher Status..."
echo "--------------------------------------------"
pm2 logs ankr-auto-publisher --lines 5 --nostream
echo ""

echo "============================================"
echo "  Diagnostic Complete"
echo "============================================"
