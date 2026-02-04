# Email Assistant - Deployment Guide

**Version:** 1.0.0
**Status:** Production Ready ✅
**Target:** Staging Environment → Beta Agents

---

## 📋 Pre-Deployment Checklist

### Infrastructure Requirements

- [ ] PostgreSQL 14+ database
- [ ] Redis 6+ for caching (optional)
- [ ] Node.js 18+ runtime
- [ ] 2GB RAM minimum (4GB recommended)
- [ ] 10GB disk space
- [ ] SSL certificate for HTTPS

### Service Dependencies

- [ ] AI Proxy running (port 8000)
- [ ] PageIndex RAG service (port 8001) - optional
- [ ] SMTP server configured (Gmail/SendGrid/AWS SES)
- [ ] Environment variables configured

---

## 🚀 Deployment Steps

### 1. Environment Setup

Create `.env.production` file:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mari8x_prod"
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Backend Server
NODE_ENV=production
PORT=4000
HOST=0.0.0.0

# Authentication
JWT_SECRET="your-256-bit-secret-key-here"
JWT_EXPIRES_IN="7d"
SESSION_SECRET="your-session-secret-here"

# AI Services
AI_PROXY_ENDPOINT="http://localhost:8000/v1/chat/completions"
RAG_ENDPOINT="http://localhost:8001/search"

# SMTP Configuration (Gmail)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="noreply@mari8x.com"
SMTP_PASSWORD="your-app-specific-password"
SMTP_FROM_NAME="Mari8X Email Assistant"
SMTP_FROM_EMAIL="noreply@mari8x.com"

# Redis (optional)
REDIS_URL="redis://localhost:6379"

# Frontend
VITE_API_URL="http://localhost:4000/graphql"
VITE_WS_URL="ws://localhost:4000/graphql"

# Feature Flags
EMAIL_ASSISTANT_ENABLED=true
AI_RESPONSE_GENERATION_ENABLED=true
CONTEXT_RETRIEVAL_ENABLED=true

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=/var/log/mari8x/email-assistant.log

# Monitoring (optional)
SENTRY_DSN="https://your-sentry-dsn"
```

### 2. Database Migration

```bash
# Backup existing database
pg_dump mari8x_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migrations
cd apps/ankr-maritime/backend
npx prisma migrate deploy

# Verify migrations
npx prisma migrate status
```

### 3. Build Application

```bash
# Backend build
cd apps/ankr-maritime/backend
npm install --production
npm run build

# Frontend build
cd ../frontend
npm install --production
npm run build
```

### 4. Start Services

Using PM2 (recommended):

```bash
# Install PM2 globally
npm install -g pm2

# Start backend
cd apps/ankr-maritime/backend
pm2 start npm --name "mari8x-backend" -- start

# Start frontend (production server)
cd ../frontend
pm2 start npm --name "mari8x-frontend" -- run preview

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

Using systemd:

Create `/etc/systemd/system/mari8x-backend.service`:

```ini
[Unit]
Description=Mari8X Backend Server
After=network.target postgresql.service

[Service]
Type=simple
User=mari8x
WorkingDirectory=/opt/mari8x/apps/ankr-maritime/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Create `/etc/systemd/system/mari8x-frontend.service`:

```ini
[Unit]
Description=Mari8X Frontend Server
After=network.target

[Service]
Type=simple
User=mari8x
WorkingDirectory=/opt/mari8x/apps/ankr-maritime/frontend
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run preview
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable mari8x-backend
sudo systemctl enable mari8x-frontend
sudo systemctl start mari8x-backend
sudo systemctl start mari8x-frontend
```

### 5. Nginx Reverse Proxy

Create `/etc/nginx/sites-available/mari8x`:

```nginx
upstream mari8x_backend {
    server localhost:4000;
    keepalive 64;
}

upstream mari8x_frontend {
    server localhost:5173;
}

server {
    listen 80;
    server_name staging.mari8x.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name staging.mari8x.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/staging.mari8x.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/staging.mari8x.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend
    location / {
        proxy_pass http://mari8x_frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # GraphQL API
    location /graphql {
        proxy_pass http://mari8x_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS (if needed)
        add_header Access-Control-Allow-Origin "https://staging.mari8x.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;

        # WebSocket support
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://mari8x_frontend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Logs
    access_log /var/log/nginx/mari8x-access.log;
    error_log /var/log/nginx/mari8x-error.log;
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/mari8x /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d staging.mari8x.com
sudo certbot renew --dry-run  # Test auto-renewal
```

---

## 🧪 Post-Deployment Testing

### Health Checks

```bash
# Backend health
curl https://staging.mari8x.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { types { name } } }"}'

# Expected: JSON response with GraphQL schema

# Frontend health
curl https://staging.mari8x.com
# Expected: HTML page with status 200
```

### Smoke Tests

**1. Authentication:**
```bash
curl https://staging.mari8x.com/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { login(email: \"test@mari8x.com\", password: \"testpass\") { token user { id email } } }"
  }'
```

**2. Folder Creation:**
```bash
curl https://staging.mari8x.com/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "query": "mutation { createEmailFolder(name: \"Test\", type: \"custom\") { id name } }"
  }'
```

**3. AI Response Generation:**
```bash
curl https://staging.mari8x.com/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "query": "mutation { generateEmailResponse(context: { originalEmail: { subject: \"Test\", body: \"Test email\", from: \"test@example.com\", to: [\"agent@mari8x.com\"] } }, style: acknowledge) { id subject body confidence } }"
  }'
```

### Load Testing (Optional)

Using Apache Bench:

```bash
# Test GraphQL endpoint
ab -n 100 -c 10 -T 'application/json' \
  -p query.json \
  https://staging.mari8x.com/graphql

# query.json:
# {"query": "{ emailFolderTree { id name } }"}
```

Using k6:

```javascript
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 10 },
    { duration: '5m', target: 10 },
    { duration: '2m', target: 0 },
  ],
};

export default function () {
  let res = http.post(
    'https://staging.mari8x.com/graphql',
    JSON.stringify({
      query: '{ emailFolderTree { id name } }',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer YOUR_TOKEN',
      },
    }
  );

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

---

## 📊 Monitoring Setup

### Application Logs

**View logs with PM2:**
```bash
pm2 logs mari8x-backend --lines 100
pm2 logs mari8x-frontend --lines 100
```

**View logs with systemd:**
```bash
journalctl -u mari8x-backend -f
journalctl -u mari8x-frontend -f
```

### Log Rotation

Create `/etc/logrotate.d/mari8x`:

```
/var/log/mari8x/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 mari8x mari8x
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Performance Monitoring

**Database queries:**
```sql
-- Slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Active connections
SELECT count(*) FROM pg_stat_activity;
```

**Application metrics:**
```bash
# Memory usage
pm2 monit

# CPU usage
top -p $(pgrep -f mari8x)

# Disk usage
df -h /var/log/mari8x
```

### Alerting (Optional)

Using UptimeRobot:

1. Monitor `https://staging.mari8x.com/graphql`
2. Set check interval: 5 minutes
3. Alert contacts: ops@mari8x.com
4. Alert when: status != 200 for 2 consecutive checks

---

## 🔄 Rolling Updates

### Zero-Downtime Deployment

```bash
#!/bin/bash
# deploy-email-assistant.sh

set -e

echo "Starting deployment..."

# Pull latest code
cd /opt/mari8x
git pull origin main

# Backend update
echo "Updating backend..."
cd apps/ankr-maritime/backend
npm install --production
npm run build
pm2 reload mari8x-backend --wait-ready

# Frontend update
echo "Updating frontend..."
cd ../frontend
npm install --production
npm run build
pm2 reload mari8x-frontend

echo "Deployment complete!"
pm2 status
```

Make executable:
```bash
chmod +x deploy-email-assistant.sh
```

### Database Migration with Zero Downtime

```bash
#!/bin/bash
# migrate-with-backup.sh

set -e

BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"

echo "Creating backup: $BACKUP_FILE"
pg_dump mari8x_prod > "/var/backups/mari8x/$BACKUP_FILE"

echo "Running migrations..."
cd /opt/mari8x/apps/ankr-maritime/backend
npx prisma migrate deploy

echo "Migration complete!"
npx prisma migrate status
```

---

## 🐛 Troubleshooting

### Issue: Backend not starting

**Check logs:**
```bash
pm2 logs mari8x-backend --err --lines 50
```

**Common causes:**
- Database connection failed → Check DATABASE_URL
- Port already in use → `lsof -i :4000`
- Missing environment variables → Check .env.production

### Issue: AI responses failing

**Check AI Proxy:**
```bash
curl http://localhost:8000/health
```

**Check logs:**
```bash
grep "AI Proxy error" /var/log/mari8x/email-assistant.log
```

**Solutions:**
- Restart AI Proxy service
- Check AI_PROXY_ENDPOINT in .env
- Verify API keys if using external AI service

### Issue: Context retrieval slow

**Check RAG service:**
```bash
curl http://localhost:8001/health
```

**Check DocumentChunk table:**
```sql
SELECT COUNT(*) FROM "DocumentChunk";
SELECT organizationId, COUNT(*)
FROM "DocumentChunk"
GROUP BY organizationId;
```

**Solutions:**
- Add database indexes:
```sql
CREATE INDEX idx_document_chunk_content ON "DocumentChunk" USING gin(to_tsvector('english', content));
CREATE INDEX idx_document_chunk_org ON "DocumentChunk"(organizationId);
```

### Issue: High memory usage

**Check memory:**
```bash
pm2 monit
free -h
```

**Solutions:**
- Reduce database pool size in .env
- Restart services: `pm2 restart all`
- Check for memory leaks: `node --inspect`

---

## 🔐 Security Hardening

### Firewall Configuration

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Block direct access to backend
sudo ufw deny 4000/tcp

# Enable firewall
sudo ufw enable
```

### Database Security

```sql
-- Create read-only user for reporting
CREATE ROLE mari8x_readonly LOGIN PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE mari8x_prod TO mari8x_readonly;
GRANT USAGE ON SCHEMA public TO mari8x_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO mari8x_readonly;

-- Restrict network access in pg_hba.conf
# host  mari8x_prod  mari8x  127.0.0.1/32  scram-sha-256
```

### Environment Variable Protection

```bash
# Restrict .env file permissions
chmod 600 /opt/mari8x/apps/ankr-maritime/backend/.env.production

# Store secrets in vault (optional)
# Use AWS Secrets Manager, HashiCorp Vault, or similar
```

---

## 📈 Scaling Considerations

### Horizontal Scaling

**Load Balancer Configuration (Nginx):**

```nginx
upstream mari8x_backend_cluster {
    least_conn;
    server backend1:4000 weight=3;
    server backend2:4000 weight=3;
    server backend3:4000 weight=2;
    keepalive 32;
}

server {
    location /graphql {
        proxy_pass http://mari8x_backend_cluster;
        # ... other proxy settings
    }
}
```

### Database Connection Pooling

Update `.env.production`:

```bash
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20
DATABASE_POOL_IDLE_TIMEOUT=10000
```

### Redis Caching (Optional)

Install Redis:

```bash
sudo apt install redis-server
sudo systemctl enable redis-server
```

Configure in code:

```typescript
// backend/src/lib/redis.ts
import Redis from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL);

// Cache folder tree for 5 minutes
const cacheKey = `folder-tree:${userId}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const folders = await fetchFolders();
await redis.setex(cacheKey, 300, JSON.stringify(folders));
```

---

## ✅ Beta Agent Onboarding

### Create Beta Agent Accounts

```bash
# Run seed script
cd apps/ankr-maritime/backend
npm run seed:beta-agents
```

Or manually via GraphQL:

```graphql
mutation CreateBetaAgent {
  betaAgentSignup(
    email: "agent1@portauthority.com"
    agentName: "Singapore Port Agency"
    portsServed: ["SGSIN"]
    serviceTypes: ["port_agent", "surveyor"]
  ) {
    organizationId
    onboardingToken
  }
}
```

### Send Onboarding Emails

```bash
# Email template
subject: "Welcome to Mari8X Email Assistant Beta"
body: "
Hi {agentName},

You've been invited to join the Mari8X Email Assistant beta program!

Access your account:
URL: https://staging.mari8x.com/onboarding?token={onboardingToken}

Features you'll have access to:
✅ Smart email organization with folders
✅ AI-powered email summaries
✅ AI response generation (9 styles)
✅ Context-aware responses
✅ Real-time notifications

Need help? Email beta-support@mari8x.com

Welcome aboard!
Mari8X Team
"
```

### Beta Agent Dashboard Access

1. Agent completes onboarding
2. Logs in at `https://staging.mari8x.com/login`
3. Redirected to `/email-assistant` (default landing page)
4. Sees welcome tour modal with feature highlights

---

## 🎯 Success Metrics

Track these KPIs for beta launch:

**Adoption:**
- [ ] 10/10 beta agents complete onboarding (100%)
- [ ] 7/10 beta agents weekly active (70%)
- [ ] Average 5+ features used per agent

**Performance:**
- [ ] Email list load time < 100ms (p95)
- [ ] AI response generation < 5s (p95)
- [ ] Context retrieval < 500ms (p95)
- [ ] Uptime > 99.5%

**Quality:**
- [ ] AI response acceptance rate > 70%
- [ ] Average confidence score > 0.8
- [ ] Bug report rate < 5 per agent per week
- [ ] NPS score > 8/10

---

## 📞 Support Contacts

**Technical Issues:**
- Email: tech-support@mari8x.com
- Slack: #mari8x-ops-alerts
- On-call: +1-555-MARI-OPS

**Beta Program:**
- Email: beta-support@mari8x.com
- Slack: #mari8x-beta

**Emergency (Critical Production Issues):**
- Phone: +1-555-MARI-911
- Escalation: CTO on-call rotation

---

## 🚀 Ready for Launch!

**Pre-launch Checklist:**

- [ ] Database migrated successfully
- [ ] All services running and healthy
- [ ] SSL certificate configured
- [ ] Environment variables set
- [ ] Monitoring and alerting configured
- [ ] Backup system tested
- [ ] Load testing passed
- [ ] Security audit completed
- [ ] Beta agent accounts created
- [ ] Onboarding emails sent
- [ ] Support team briefed
- [ ] Rollback plan documented

**Launch Command:**

```bash
# Final check
./pre-launch-check.sh

# Deploy
./deploy-email-assistant.sh

# Verify
curl https://staging.mari8x.com/health

# Announce
echo "🚀 Email Assistant is LIVE on staging!"
```

---

**Next:** Monitor beta agent onboarding and collect feedback for first 48 hours.
