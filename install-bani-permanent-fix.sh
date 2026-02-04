#!/bin/bash
# ============================================================================
# SWAYAM BANI - Permanent tsx Bypass Solution
# Run this on: root@216.48.185.29
# Date: December 29, 2025
# ============================================================================

set -e  # Exit on error

echo "🔧 SWAYAM BANI - Permanent tsx Bypass Installation"
echo "=================================================="
echo ""

# Step 1: Create startup script
echo "📝 Step 1: Creating startup script..."
mkdir -p /root/ankr-labs-nx/scripts

cat > /root/ankr-labs-nx/scripts/start-bani.sh << 'STARTUP'
#!/bin/bash
# BANI Startup Script - Bypasses tsx loader
cd /root/ankr-labs-nx/packages/bani
export NODE_ENV=production
export PORT=7777
exec /usr/bin/node dist/server.js
STARTUP

chmod +x /root/ankr-labs-nx/scripts/start-bani.sh
echo "   ✅ Created /root/ankr-labs-nx/scripts/start-bani.sh"

# Step 2: Create ecosystem config
echo "📝 Step 2: Creating pm2 ecosystem config..."

cat > /root/ankr-labs-nx/ecosystem.bani.config.js << 'ECOSYSTEM'
module.exports = {
  apps: [
    {
      name: 'bani-api',
      script: '/root/ankr-labs-nx/packages/bani/dist/server.js',
      interpreter: '/usr/bin/node',  // CRITICAL: Use system node, not tsx
      cwd: '/root/ankr-labs-nx/packages/bani',
      env: {
        NODE_ENV: 'production',
        PORT: 7777,
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/bani/error.log',
      out_file: '/var/log/bani/out.log',
      log_file: '/var/log/bani/combined.log',
      time: true,
    }
  ]
};
ECOSYSTEM

echo "   ✅ Created /root/ankr-labs-nx/ecosystem.bani.config.js"

# Step 3: Create log directory
echo "📁 Step 3: Creating log directory..."
mkdir -p /var/log/bani
echo "   ✅ Created /var/log/bani/"

# Step 4: Build latest code
echo "🔨 Step 4: Building latest code..."
cd /root/ankr-labs-nx/packages/bani
npm run build 2>&1 | tail -3
echo "   ✅ Build complete"

# Step 5: Delete old bani-api if exists
echo "🗑️  Step 5: Removing old pm2 process..."
pm2 delete bani-api 2>/dev/null || true
echo "   ✅ Cleaned up old process"

# Step 6: Start with new config
echo "🚀 Step 6: Starting with permanent configuration..."
pm2 start /root/ankr-labs-nx/ecosystem.bani.config.js
sleep 3
echo "   ✅ Started bani-api"

# Step 7: Save pm2 config
echo "💾 Step 7: Saving pm2 configuration..."
pm2 save
echo "   ✅ PM2 configuration saved"

# Step 8: Verify
echo "🧪 Step 8: Verifying..."
echo ""

# Check process
echo "Process check:"
pm2 show bani-api | grep -E "status|interpreter|script" | head -5
echo ""

# Health check
echo "Health check:"
HEALTH=$(curl -s http://localhost:7777/health | head -c 100)
if [[ $HEALTH == *"status"* ]]; then
    echo "   ✅ Health endpoint responding"
else
    echo "   ⚠️  Health check may have issues"
fi
echo ""

# WebSocket test hint
echo "=================================================="
echo "✅ INSTALLATION COMPLETE!"
echo ""
echo "📋 Next Steps:"
echo "   1. Test WebSocket: https://swayam.digimitra.guru"
echo "   2. View logs: pm2 logs bani-api"
echo "   3. Monitor: pm2 monit"
echo ""
echo "🔧 If issues occur:"
echo "   pm2 delete bani-api"
echo "   /usr/bin/node /root/ankr-labs-nx/packages/bani/dist/server.js &"
echo ""
echo "🙏 Jai Guru Ji | जो सोचो, वो हो जाए!"
echo "=================================================="
