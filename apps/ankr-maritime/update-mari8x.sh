#!/bin/bash

# Mari8X Quick Update Script
# Run this to deploy new changes after initial setup

set -e

APP_DIR="/var/www/mari8x"
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "🔄 Updating Mari8X..."

# Pull latest code
echo -e "${BLUE}Pulling latest code...${NC}"
cd $APP_DIR
git pull origin master

# Update backend
echo -e "${BLUE}Updating backend...${NC}"
cd $APP_DIR/apps/ankr-maritime/backend
npm install --legacy-peer-deps
npx prisma generate
npx prisma migrate deploy
npm run build

# Update frontend
echo -e "${BLUE}Updating frontend...${NC}"
cd $APP_DIR/apps/ankr-maritime/frontend
npm install --legacy-peer-deps
npm run build

# Restart backend
echo -e "${BLUE}Restarting backend...${NC}"
pm2 restart mari8x-backend

# Reload nginx (in case static files changed)
sudo systemctl reload nginx

echo -e "${GREEN}✅ Update complete!${NC}"
echo ""
echo "Check status: pm2 status"
echo "View logs: pm2 logs mari8x-backend"
