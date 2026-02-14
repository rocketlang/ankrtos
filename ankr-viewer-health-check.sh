#!/bin/bash

# ANKR Document Viewer Health Check

echo "=== ANKR Document Viewer Health Check ==="
echo ""

# 1. Check docs server
echo "1. Docs API Server (port 3080):"
if curl -s http://localhost:3080/api/health > /dev/null 2>&1; then
    echo "   ✅ RUNNING"
    curl -s http://localhost:3080/api/health | jq -r '.status, .searchMode' | sed 's/^/      /'
else
    echo "   ❌ NOT RUNNING"
fi
echo ""

# 2. Check viewer frontend
echo "2. Viewer Frontend (port 3199):"
if curl -s -I http://localhost:3199 2>&1 | grep -q "HTTP.*200"; then
    echo "   ✅ RUNNING"
else
    echo "   ❌ NOT RUNNING"
fi
echo ""

# 3. Check nginx
echo "3. Nginx:"
if sudo systemctl is-active nginx > /dev/null 2>&1; then
    echo "   ✅ ACTIVE"
else
    echo "   ❌ NOT RUNNING"
fi
echo ""

# 4. Check auto-publisher
echo "4. Auto-Publisher:"
if pm2 list 2>/dev/null | grep -q "ankr-auto-publisher.*online"; then
    echo "   ✅ RUNNING"
    pm2 list | grep ankr-auto-publisher | awk '{print "      Published:", $10, "• Uptime:", $8}'
else
    echo "   ⚠️  NOT INSTALLED (optional)"
fi
echo ""

# 5. Check file counts
echo "5. Published Documents:"
DOC_COUNT=$(find /root/ankr-universe-docs/project/documents/ -name "*.md" 2>/dev/null | wc -l)
echo "   📄 Total: $DOC_COUNT markdown files"
echo ""

# 6. Test API
echo "6. API Test (pratham-telehub):"
PRATHAM_COUNT=$(curl -s "http://localhost:3080/api/files?path=project/documents/pratham-telehub" 2>/dev/null | jq 'length' 2>/dev/null)
if [ ! -z "$PRATHAM_COUNT" ]; then
    echo "   ✅ $PRATHAM_COUNT files accessible"
else
    echo "   ⚠️  Could not query API"
fi
echo ""

# 7. Check web access
echo "7. Web Access:"
if curl -s -I https://ankr.in/project/documents/ 2>&1 | grep -q "HTTP.*200"; then
    echo "   ✅ https://ankr.in/project/documents/ (accessible)"
else
    echo "   ⚠️  Web access may have issues"
fi
echo ""

echo "=== Health Check Complete ==="
echo ""

# Summary
ISSUES=0
if ! curl -s http://localhost:3080/api/health > /dev/null 2>&1; then ((ISSUES++)); fi
if ! curl -s -I http://localhost:3199 2>&1 | grep -q "HTTP.*200"; then ((ISSUES++)); fi
if ! sudo systemctl is-active nginx > /dev/null 2>&1; then ((ISSUES++)); fi

if [ $ISSUES -eq 0 ]; then
    echo "✅ All systems operational!"
    echo "   View docs at: https://ankr.in/project/documents/"
else
    echo "⚠️  Found $ISSUES issue(s)"
    echo "   Run: /root/ankr-viewer-recovery.sh"
fi
echo ""
