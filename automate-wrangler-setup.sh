#!/bin/bash
##############################################################################
# Automated Cloudflare Pages Setup via Wrangler
##############################################################################

set -e

echo "════════════════════════════════════════════════════════════════════════"
echo "  🤖 WRANGLER AUTOMATED SETUP"
echo "════════════════════════════════════════════════════════════════════════"
echo ""

cd /root/apps/ankr-maritime/frontend

# Create wrangler.toml for Pages
cat > wrangler.toml <<'EOF'
name = "mari8x"
compatibility_date = "2024-01-01"

[env.production]
name = "mari8x"
route = "mari8x.com/*"

[build]
command = "npm install && npx vite build"
cwd = ""
watch_dir = "src"

[build.upload]
format = "modules"
dir = "dist"
main = "./index.html"

[[env.production.routes]]
pattern = "mari8x.com/*"
zone_name = "mari8x.com"
EOF

echo "✅ Created wrangler.toml"
echo ""

# Create GitHub Actions workflow for auto-deploy
mkdir -p /root/.github/workflows

cat > /root/.github/workflows/deploy-mari8x.yml <<'EOF'
name: Deploy Mari8X to Cloudflare Pages

on:
  push:
    branches:
      - master
    paths:
      - 'apps/ankr-maritime/frontend/**'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy to Cloudflare Pages
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: 'apps/ankr-maritime/frontend/package-lock.json'

      - name: Install dependencies
        working-directory: apps/ankr-maritime/frontend
        run: npm install

      - name: Build
        working-directory: apps/ankr-maritime/frontend
        run: npx vite build

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: 1c452912df3eea9e8f1a2a973ff337f5
          projectName: mari8x
          directory: apps/ankr-maritime/frontend/dist
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
          branch: master
EOF

echo "✅ Created GitHub Actions workflow"
echo ""

echo "════════════════════════════════════════════════════════════════════════"
echo "  📋 SETUP COMPLETE - NEXT STEPS"
echo "════════════════════════════════════════════════════════════════════════"
echo ""
echo "1️⃣  COMMIT AND PUSH WORKFLOW"
echo ""
echo "    cd /root"
echo "    git add .github/workflows/deploy-mari8x.yml"
echo "    git add apps/ankr-maritime/frontend/wrangler.toml"
echo "    git commit -m 'feat: Add GitHub Actions auto-deploy for Mari8X'"
echo "    git push origin master"
echo ""
echo "2️⃣  ADD GITHUB SECRET"
echo ""
echo "    Go to: https://github.com/rocketlang/dodd-icd/settings/secrets/actions"
echo "    Click: 'New repository secret'"
echo "    Name: CLOUDFLARE_API_TOKEN"
echo "    Value: [your-cloudflare-api-token]"
echo "    Click: 'Add secret'"
echo ""
echo "3️⃣  TRIGGER DEPLOYMENT"
echo ""
echo "    Option A: Push any change to master branch"
echo "    Option B: Go to Actions tab and manually trigger 'Deploy Mari8X'"
echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo "  🎉 RESULT: FULLY AUTOMATED"
echo "════════════════════════════════════════════════════════════════════════"
echo ""
echo "Every git push to master will:"
echo "  1. Detect changes in apps/ankr-maritime/frontend/"
echo "  2. Build the frontend"
echo "  3. Deploy to Cloudflare Pages"
echo "  4. Update mari8x.com"
echo ""
echo "All automated via GitHub Actions! 🚀"
echo ""
