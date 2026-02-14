#!/bin/bash

#############################################
# Setup Vyomo Secure Download API
# Run on vyomo.in server
#############################################

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo -e "${BLUE}🔐 Setting up Vyomo Secure Download API${NC}"
echo ""

# Check if running on correct server
read -p "Is this the vyomo.in server? [y/N]: " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Please run this on your vyomo.in server"
    exit 1
fi

# Install dependencies if needed
echo -e "${GREEN}📦 Installing dependencies...${NC}"
cd /root
bun add fastify @fastify/jwt @fastify/cors || {
    echo "Installing bun dependencies globally..."
    mkdir -p /root/node_modules
    cd /root && bun add fastify @fastify/jwt @fastify/cors
}

# Generate JWT secret
echo -e "${GREEN}🔑 Generating JWT secret...${NC}"
JWT_SECRET=$(openssl rand -hex 32)
echo "JWT_SECRET=$JWT_SECRET" > /root/vyomo-download-api.env
echo "ADMIN_TOKEN=$(openssl rand -hex 16)" >> /root/vyomo-download-api.env
echo "BASE_URL=https://vyomo.in" >> /root/vyomo-download-api.env
echo "PORT=5000" >> /root/vyomo-download-api.env

echo ""
echo -e "${GREEN}✅ Environment configured${NC}"
echo "JWT_SECRET saved to /root/vyomo-download-api.env"
echo ""

# Start with PM2
echo -e "${GREEN}🚀 Starting service with PM2...${NC}"

pm2 delete vyomo-download 2>/dev/null || true
pm2 start /root/vyomo-download-api.js \
  --name vyomo-download \
  --interpreter bun \
  --env-file /root/vyomo-download-api.env

pm2 save

echo ""
echo -e "${GREEN}✅ Service started!${NC}"
echo ""

# Show status
pm2 status vyomo-download

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}Next Steps:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Configure nginx reverse proxy:"
echo ""
echo "   Add to /etc/nginx/sites-available/vyomo.in:"
echo ""
echo "   location /api/ {"
echo "       proxy_pass http://localhost:5000;"
echo "       proxy_http_version 1.1;"
echo "       proxy_set_header Host \$host;"
echo "   }"
echo ""
echo "   location /install/ {"
echo "       proxy_pass http://localhost:5000;"
echo "   }"
echo ""
echo "2. Reload nginx:"
echo "   sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "3. Test the API:"
echo "   curl https://vyomo.in/health"
echo ""
echo "4. Test one-liner install:"
echo "   curl -fsSL https://vyomo.in/install/vyomo-demo | bash"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "API Keys configured:"
echo "  - vyomo-demo (Demo Access)"
echo "  - vyomo-client-alpha (Alpha Client)"
echo "  - vyomo-client-beta (Beta Client)"
echo ""
echo "Edit /root/vyomo-download-api.js to add more clients"
echo ""
