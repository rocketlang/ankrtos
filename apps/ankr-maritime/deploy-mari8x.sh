#!/bin/bash

# Mari8X Deployment Script for E2E Network
# Run this on your E2E Network server

set -e

echo "🚀 Mari8X Deployment Script"
echo "============================"

# Configuration
APP_DIR="/var/www/mari8x"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
REPO_URL="https://github.com/rocketlang/dodd-icd.git"
BRANCH="master"
NODE_VERSION="20"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Installing dependencies...${NC}"

# Update system
sudo apt-get update

# Install Node.js 20 (if not already installed)
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'.' -f1 | cut -d'v' -f2) -lt 20 ]]; then
    echo "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 globally (if not installed)
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

# Install PostgreSQL (if not installed)
if ! command -v psql &> /dev/null; then
    echo "Installing PostgreSQL..."
    sudo apt-get install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# Install nginx (if not installed)
if ! command -v nginx &> /dev/null; then
    echo "Installing nginx..."
    sudo apt-get install -y nginx
fi

echo -e "${BLUE}Step 2: Setting up PostgreSQL database...${NC}"

# Create database and user (modify password as needed)
sudo -u postgres psql -c "CREATE DATABASE mari8x;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "CREATE USER mari8x WITH PASSWORD 'mari8x_password_change_me';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE mari8x TO mari8x;" 2>/dev/null || true

echo -e "${BLUE}Step 3: Cloning/updating repository...${NC}"

# Create app directory
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Clone or update repository
if [ -d "$APP_DIR/.git" ]; then
    echo "Repository exists, pulling latest changes..."
    cd $APP_DIR
    git fetch origin
    git reset --hard origin/$BRANCH
else
    echo "Cloning repository..."
    git clone -b $BRANCH $REPO_URL $APP_DIR
fi

echo -e "${BLUE}Step 4: Building backend...${NC}"

cd $APP_DIR/apps/ankr-maritime/backend

# Install dependencies
npm install --legacy-peer-deps

# Generate Prisma client
npx prisma generate

# Build TypeScript
npm run build

echo -e "${BLUE}Step 5: Setting up environment variables...${NC}"

# Create .env file (user should edit this)
if [ ! -f .env ]; then
    cat > .env <<EOF
NODE_ENV=production
PORT=4051
DATABASE_URL=postgresql://mari8x:mari8x_password_change_me@localhost:5432/mari8x
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
FRONTEND_URL=https://mari8x.com
ENABLE_AIS=false
EOF
    echo "⚠️  Created .env file - PLEASE EDIT DATABASE PASSWORD!"
else
    echo ".env file already exists"
fi

echo -e "${BLUE}Step 6: Running database migrations...${NC}"
npx prisma migrate deploy

echo -e "${BLUE}Step 7: Building frontend...${NC}"

cd $APP_DIR/apps/ankr-maritime/frontend

# Install dependencies
npm install --legacy-peer-deps

# Create production .env
cat > .env.production <<EOF
VITE_API_URL=https://mari8x.com
EOF

# Build frontend
npm run build

echo -e "${BLUE}Step 8: Setting up PM2...${NC}"

cd $APP_DIR/apps/ankr-maritime/backend

# Create PM2 ecosystem file
cat > ecosystem.config.cjs <<EOF
module.exports = {
  apps: [{
    name: 'mari8x-backend',
    script: './dist/main.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 4051
    },
    error_file: '/var/log/mari8x-error.log',
    out_file: '/var/log/mari8x-out.log',
    time: true
  }]
};
EOF

# Stop existing process (if any)
pm2 delete mari8x-backend 2>/dev/null || true

# Start backend with PM2
pm2 start ecosystem.config.cjs

# Save PM2 process list
pm2 save

# Setup PM2 startup script
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

echo -e "${BLUE}Step 9: Configuring nginx...${NC}"

# Create nginx config
sudo tee /etc/nginx/sites-available/mari8x.com > /dev/null <<'EOF'
server {
    listen 80;
    server_name mari8x.com www.mari8x.com;

    # Frontend static files
    root /var/www/mari8x/apps/ankr-maritime/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Frontend - serve static files with fallback to index.html (SPA)
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "public, max-age=3600";
    }

    # Backend API - reverse proxy to Node.js
    location /api/ {
        proxy_pass http://localhost:4051;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # GraphQL endpoint
    location /graphql {
        proxy_pass http://localhost:4051;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # GraphiQL IDE
    location /graphiql {
        proxy_pass http://localhost:4051;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:4051;
        access_log off;
    }

    # Static assets caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/mari8x.com /etc/nginx/sites-enabled/

# Remove default nginx site
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Edit /var/www/mari8x/apps/ankr-maritime/backend/.env and update DATABASE_URL password"
echo "2. Configure Cloudflare DNS to point mari8x.com to this server's IP"
echo "3. Enable Cloudflare SSL (Full mode)"
echo "4. Restart backend: pm2 restart mari8x-backend"
echo ""
echo "Useful commands:"
echo "  - View backend logs: pm2 logs mari8x-backend"
echo "  - Restart backend: pm2 restart mari8x-backend"
echo "  - Check nginx: sudo nginx -t"
echo "  - Reload nginx: sudo systemctl reload nginx"
echo "  - Check backend status: pm2 status"
