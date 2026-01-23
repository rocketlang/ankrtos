# ankrshield Deployment at ankr.digital

**Date**: January 23, 2026
**Domain**: https://ankr.digital
**Status**: ✅ Configured and Ready

---

## Deployment Summary

ankrshield web application has been successfully configured and is ready to serve at **ankr.digital**.

### Services Status

| Service | Port | Status | URL |
|---------|------|--------|-----|
| **Web App** | 443 (HTTPS) | ✅ Running | https://ankr.digital |
| **API** | 4250 | ✅ Running | https://ankr.digital/api/ |
| **WebSocket** | 4250 | ✅ Configured | wss://ankr.digital/ws/ |

---

## Configuration Details

### Nginx Configuration
- **File**: `/etc/nginx/sites-available/ankr.digital`
- **Enabled**: `/etc/nginx/sites-enabled/ankr.digital` → symlink
- **Document Root**: `/root/ankrshield/apps/web/dist`

### SSL/TLS
- **Certificate**: Cloudflare Origin Certificate
  - `/etc/ssl/cloudflare/ankr-origin.crt`
  - `/etc/ssl/cloudflare/ankr-origin.key`
- **HTTP → HTTPS**: Automatic redirect (301)
- **HTTP/2**: Enabled

### Features Configured

1. **SPA Routing** ✅
   - All routes serve `index.html`
   - Client-side routing handled by React Router

2. **API Proxy** ✅
   - Backend API: `http://localhost:4250`
   - Public endpoint: `https://ankr.digital/api/`
   - CORS headers configured

3. **WebSocket Support** ✅
   - Real-time features enabled
   - Long-lived connections supported
   - Endpoint: `wss://ankr.digital/ws/`

4. **Static Asset Caching** ✅
   - 1-year cache for `/assets/`
   - Immutable cache headers
   - Gzip compression enabled

5. **Security Headers** ✅
   - X-Frame-Options: SAMEORIGIN
   - X-Content-Type-Options: nosniff
   - X-XSS-Protection: enabled
   - Referrer-Policy: no-referrer-when-downgrade

---

## Frontend Build

### Production Bundle
```
/root/ankrshield/apps/web/dist/
├── index.html (495 bytes)
└── assets/
    ├── index-Cl_oxWEq.css (5.7K)
    └── index-WfP2F-6J.js (190K)
```

### Build Information
- **Framework**: React 18.2.0
- **Build Tool**: Vite 5.0.10
- **Total Size**: ~196K (minified + gzipped: ~50K)
- **Title**: "ankrshield - Your Personal Shield for the AI Era"

---

## API Status

### Health Check
```bash
curl https://ankr.digital/api/health
```

**Current Response**:
```json
{
  "status": "error",
  "timestamp": "2026-01-23T05:00:56.169Z",
  "database": "disconnected"
}
```

⚠️ **Note**: API is running but database connection needs to be fixed.

### API Process
- **PID**: 292052
- **Port**: 4250
- **Command**: `node`
- **User**: root

---

## DNS Configuration

### Required DNS Records

To make ankr.digital accessible publicly, add these DNS records:

#### Option 1: Direct (No Cloudflare)
```
Type: A
Name: ankr.digital
Value: <SERVER_IP>
TTL: Auto

Type: A
Name: www
Value: <SERVER_IP>
TTL: Auto
```

#### Option 2: Cloudflare (Recommended)
```
Type: A
Name: ankr.digital
Value: <SERVER_IP>
Proxy: ✅ Proxied (Orange Cloud)

Type: CNAME
Name: www
Value: ankr.digital
Proxy: ✅ Proxied (Orange Cloud)
```

**Cloudflare Settings**:
- SSL/TLS Mode: **Full (strict)**
- Always Use HTTPS: **Enabled**
- Automatic HTTPS Rewrites: **Enabled**

---

## Testing

### Local Testing (Server)
```bash
# Test HTTP redirect
curl -I http://localhost:80 -H "Host: ankr.digital"
# Should return: 301 Moved Permanently → https://ankr.digital/

# Test HTTPS
curl -k https://localhost:443 -H "Host: ankr.digital"
# Should return: HTML with ankrshield content

# Test API proxy
curl -k https://localhost:443/api/health -H "Host: ankr.digital"
# Should return: API health status
```

### After DNS Propagation
```bash
# Test from anywhere
curl -I https://ankr.digital
# Should return: 200 OK

# Test API
curl https://ankr.digital/api/health
```

---

## Access URLs

Once DNS is configured:

### Public URLs
- **Website**: https://ankr.digital
- **With www**: https://www.ankr.digital
- **API**: https://ankr.digital/api/
- **Health Check**: https://ankr.digital/api/health

### Development URLs (Server only)
- **Dev Server**: http://localhost:5250 (Vite hot-reload)
- **API Direct**: http://localhost:4250

---

## Monitoring

### Nginx Logs
```bash
# Access logs
tail -f /var/log/nginx/access.log | grep ankr.digital

# Error logs
tail -f /var/log/nginx/error.log | grep ankr.digital
```

### API Logs
```bash
# PM2 logs (if using PM2)
pm2 logs ankrshield-api

# Background process logs
cat /tmp/claude/-root/tasks/bdae836.output
```

### Service Status
```bash
# Nginx status
systemctl status nginx

# Check API process
lsof -i:4250

# Check all ankr processes
ps aux | grep ankr
```

---

## Features Available

### ankrshield Capabilities

Based on the application structure, ankrshield provides:

1. **Privacy Protection** 🛡️
   - DNS-level ad blocking
   - Tracker blocking
   - Privacy score monitoring

2. **Network Monitoring** 📊
   - Real-time network activity
   - Stats visualization
   - Recent activity feed

3. **Security Settings** ⚙️
   - Protection toggle
   - Privacy settings
   - Dashboard customization

4. **AI Era Security** 🤖
   - AI agent monitoring
   - Spyware detection (flagged)
   - Identity protection (flagged)

---

## File Permissions

### Nginx Access
```bash
# Ensure nginx can read the files
chmod 755 /root
chmod -R 755 /root/ankrshield/apps/web/dist
chown -R www-data:www-data /root/ankrshield/apps/web/dist
```

**Current Status**: ✅ Files are readable (755 permissions on /root)

---

## Updating the Deployment

### Update Frontend
```bash
cd /root/ankrshield/apps/web
pnpm build
# Files automatically updated in dist/
# Nginx serves from dist/ - no reload needed
```

### Update API
```bash
cd /root/ankrshield/apps/api
pnpm build
# Restart API process
kill 292052
pnpm dev &
```

### Update Nginx Config
```bash
nano /etc/nginx/sites-available/ankr.digital
nginx -t
systemctl reload nginx
```

---

## Troubleshooting

### Issue 1: "502 Bad Gateway"
**Cause**: API not running on port 4250

**Fix**:
```bash
# Check API status
lsof -i:4250

# Restart API
cd /root/ankrshield
pnpm --filter @ankrshield/api dev &
```

### Issue 2: "Database disconnected"
**Cause**: API can't connect to PostgreSQL

**Fix**:
```bash
# Check PostgreSQL
pg_isready -U ankrshield -h localhost

# Check connection string
cat /root/ankrshield/.env | grep DATABASE_URL

# Test connection
PGPASSWORD=ankrshield_dev_password psql -h localhost -U ankrshield -d ankrshield -c "SELECT 1;"
```

### Issue 3: "404 Not Found" on routes
**Cause**: SPA routing not working

**Fix**: Already configured with `try_files $uri $uri/ /index.html;`

### Issue 4: Can't access from browser
**Cause**: DNS not configured or Cloudflare issues

**Check**:
```bash
# Check DNS resolution
dig ankr.digital

# Check from server
curl -k https://localhost:443 -H "Host: ankr.digital"
```

---

## Next Steps

### Immediate (Required)
1. **Configure DNS** ☐
   - Add A record for ankr.digital pointing to server IP
   - Add CNAME for www.ankr.digital
   - Wait for propagation (1-48 hours)

2. **Fix Database Connection** ☐
   - Verify PostgreSQL is accessible
   - Check connection string in .env
   - Restart API with correct credentials

### Short Term (Recommended)
1. **Enable Cloudflare** ☐
   - Proxy through Cloudflare (orange cloud)
   - Configure SSL/TLS to Full (strict)
   - Enable security features

2. **Set Up PM2** ☐
   - Manage API as PM2 process
   - Auto-restart on crashes
   - Log management

3. **Add Monitoring** ☐
   - Uptime monitoring
   - Error tracking (Sentry)
   - Performance monitoring

### Long Term (Optional)
1. **CI/CD Pipeline** ☐
   - Automatic deployments on git push
   - Automated testing before deploy
   - Rollback capability

2. **Load Balancing** ☐
   - Multiple API instances
   - Horizontal scaling
   - Redis session storage

3. **CDN Integration** ☐
   - Cloudflare CDN for static assets
   - Edge caching
   - Global distribution

---

## Summary

✅ **Nginx configured** - ankr.digital serves ankrshield web app
✅ **SSL enabled** - Cloudflare origin certificate installed
✅ **API proxied** - /api/ routes to backend on port 4250
✅ **WebSocket ready** - /ws/ configured for real-time features
✅ **Production build** - Optimized and minified assets
✅ **Security headers** - Best practices implemented
✅ **Gzip compression** - Faster page loads
✅ **SPA routing** - All routes work correctly

⏳ **Pending**: DNS configuration for public access
⚠️ **Issue**: Database connection needs fixing

---

**Status**: Ready for DNS configuration and public access
**Last Updated**: January 23, 2026 10:50 IST
