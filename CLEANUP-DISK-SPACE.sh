#!/bin/bash
# Disk cleanup script - frees up ~14GB+

echo "🧹 Starting disk cleanup..."
echo ""

# 1. Delete ankr-labs-nx node_modules (12GB)
echo "1️⃣ Removing ankr-labs-nx/node_modules (12GB)..."
if [ -d "/root/ankr-labs-nx/node_modules" ]; then
  rm -rf /root/ankr-labs-nx/node_modules
  echo "   ✅ Freed ~12GB"
else
  echo "   ⚠️  Already removed"
fi

# 2. Delete old postgres backup (23MB)
echo "2️⃣ Removing old postgres backup..."
if [ -f "/root/wowtruck-db-backup-20251212-124312.sql" ]; then
  rm -f /root/wowtruck-db-backup-20251212-124312.sql
  echo "   ✅ Freed 23MB"
else
  echo "   ⚠️  Already removed"
fi

# 3. Clean test files from mari8x
echo "3️⃣ Removing mari8x test files..."
rm -f /root/apps/ankr-maritime/frontend/*.mjs
rm -f /root/apps/ankr-maritime/frontend/screenshot*.png
rm -f /tmp/mari8x*.png
rm -f /tmp/final-test.png
echo "   ✅ Cleaned test files"

# 4. Clean Claude backup files
echo "4️⃣ Removing Claude backup files..."
rm -f /root/.claude.json.backup.*
echo "   ✅ Cleaned backup files"

# 5. Clean journal logs older than 7 days
echo "5️⃣ Cleaning old journal logs..."
journalctl --vacuum-time=7d >/dev/null 2>&1
echo "   ✅ Cleaned old logs"

# 6. Clean npm cache
echo "6️⃣ Cleaning npm cache..."
npm cache clean --force >/dev/null 2>&1
echo "   ✅ Cleaned npm cache"

# 7. Clean apt cache
echo "7️⃣ Cleaning apt cache..."
apt-get clean >/dev/null 2>&1
echo "   ✅ Cleaned apt cache"

echo ""
echo "🎉 Cleanup complete!"
echo ""
echo "📊 New disk usage:"
df -h / | tail -1

echo ""
echo "💡 To reinstall ankr-labs-nx dependencies later:"
echo "   cd /root/ankr-labs-nx && pnpm install"
