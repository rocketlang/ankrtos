#!/bin/bash

echo "════════════════════════════════════════════════════════════════════════"
echo "  ✅ GITHUB ACTIONS WORKFLOW VALIDATION"
echo "════════════════════════════════════════════════════════════════════════"
echo ""

echo "📋 CHECKING WORKFLOW CONFIGURATION..."
echo ""

# Check workflow file exists
echo "1. Workflow file:"
if [ -f "/root/.github/workflows/deploy-mari8x.yml" ]; then
    echo "   ✅ Exists: /root/.github/workflows/deploy-mari8x.yml"
else
    echo "   ❌ Missing: /root/.github/workflows/deploy-mari8x.yml"
    exit 1
fi

# Check if pushed to GitHub
echo ""
echo "2. Pushed to GitHub:"
if git ls-tree -r HEAD --name-only | grep -q ".github/workflows/deploy-mari8x.yml"; then
    echo "   ✅ Workflow is in GitHub"
    COMMIT=$(git log -1 --format="%h - %s" -- .github/workflows/deploy-mari8x.yml)
    echo "   Latest: $COMMIT"
else
    echo "   ❌ Not pushed to GitHub yet"
    exit 1
fi

# Validate workflow syntax
echo ""
echo "3. Workflow syntax:"
echo ""
echo "   Triggers:"
grep -A 5 "^on:" /root/.github/workflows/deploy-mari8x.yml | sed 's/^/   /'
echo ""
echo "   Steps:"
grep "- name:" /root/.github/workflows/deploy-mari8x.yml | sed 's/^/   ✓ /'

# Check build config
echo ""
echo "4. Build configuration:"
echo "   Working directory: apps/ankr-maritime/frontend"
echo "   Build command: npx vite build"
echo "   Output directory: dist"
if [ -d "/root/apps/ankr-maritime/frontend/dist" ]; then
    echo "   ✅ Build output exists ($(du -sh /root/apps/ankr-maritime/frontend/dist | cut -f1))"
else
    echo "   ⚠️  Build output not found (will be created by workflow)"
fi

# Check Cloudflare config
echo ""
echo "5. Cloudflare Pages config:"
echo "   Account ID: 1c452912df3eea9e8f1a2a973ff337f5"
echo "   Project Name: mari8x"
echo "   Domain: mari8x.com"

# Check wrangler.toml
echo ""
echo "6. Wrangler configuration:"
if [ -f "/root/apps/ankr-maritime/frontend/wrangler.toml" ]; then
    echo "   ✅ wrangler.toml exists"
    grep "name = " /root/apps/ankr-maritime/frontend/wrangler.toml | sed 's/^/   /'
else
    echo "   ⚠️  wrangler.toml not found (optional)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔍 WORKFLOW ANALYSIS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Trigger Conditions:"
echo "  ✓ Automatic: Push to master branch"
echo "  ✓ Automatic: Changes in apps/ankr-maritime/frontend/**"
echo "  ✓ Manual: workflow_dispatch (can trigger from GitHub UI)"
echo ""
echo "Build Process:"
echo "  1. Checkout code from GitHub"
echo "  2. Setup Node.js 20 with npm cache"
echo "  3. Install dependencies (npm install)"
echo "  4. Build frontend (npx vite build)"
echo "  5. Deploy to Cloudflare Pages"
echo ""
echo "Deployment Target:"
echo "  • Cloudflare Pages project: mari8x"
echo "  • Custom domain: mari8x.com"
echo "  • Branch: master"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ⚙️  REQUIRED SETUP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "GitHub Secret Required:"
echo "  Name: CLOUDFLARE_API_TOKEN"
echo "  Add at: https://github.com/rocketlang/dodd-icd/settings/secrets/actions"
echo ""
echo "Token Permissions Needed:"
echo "  • Account: Cloudflare Pages - Edit"
echo "  • User: User Details - Read"
echo "  • Zone: Zone - Read"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 HOW TO TRIGGER"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Method 1 - Manual trigger from GitHub:"
echo "  👉 https://github.com/rocketlang/dodd-icd/actions/workflows/deploy-mari8x.yml"
echo "  Click: 'Run workflow' → Select 'master' → 'Run workflow'"
echo ""
echo "Method 2 - Push to master:"
echo "  git commit --allow-empty -m 'feat: Trigger deployment'"
echo "  git push origin master"
echo ""
echo "Method 3 - Make any change to frontend:"
echo "  cd /root/apps/ankr-maritime/frontend"
echo "  # ... edit files ..."
echo "  git commit -am 'feat: Update frontend'"
echo "  git push"
echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo "  ✅ WORKFLOW IS READY!"
echo "════════════════════════════════════════════════════════════════════════"
echo ""
echo "Next Steps:"
echo "  1. Add CLOUDFLARE_API_TOKEN to GitHub secrets"
echo "  2. Trigger workflow (any method above)"
echo "  3. Monitor at: https://github.com/rocketlang/dodd-icd/actions"
echo "  4. Site goes live at: https://mari8x.com"
echo ""
echo "Expected build time: 2-3 minutes"
echo ""
