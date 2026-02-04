# ANKR Pulse - Public Access Setup

**Date**: 2026-01-22

## ✅ Published Documentation

The ANKR Status Integration documentation has been published and is accessible at:

**🔗 https://ankr.in/project/documents/**

Published file: `ANKR-STATUS-INTEGRATION.md`

## ✅ ANKR Pulse Dashboard - Public Access

ANKR Pulse is now publicly accessible via HTTPS:

**🔗 https://ankr.in/pulse**

### Configuration

**Service**: ankr-pulse
**Port**: 4320 (internal)
**Public URL**: https://ankr.in/pulse
**Mode**: Development (Vite HMR enabled)

### Nginx Configuration

**File**: `/etc/nginx/sites-enabled/ankr.in`

```nginx
# ANKR Pulse - System Monitoring Dashboard
location /pulse {
    rewrite ^/pulse(/.*)$ $1 break;
    rewrite ^/pulse$ / break;
    proxy_pass http://localhost:4320;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
}

# AI Proxy endpoints (for ankr-pulse to fetch status)
location /ai/api/ {
    proxy_pass http://localhost:4444/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

### Features Available Publicly

When you visit **https://ankr.in/pulse**, you can access:

1. **Services Tab** - Service health monitoring
2. **Status Tab** ⭐ - Enhanced service status (NEW)
   - Full table with: SERVICE | TYPE | PORT | STATUS | PID | CPU | MEMORY | UPTIME | DATABASE
   - Summary statistics
   - Type filters (Frontend, Backend, AI, etc.)
   - Search functionality
   - Auto-refresh every 10 seconds
3. **PM2 Tab** - PM2 process manager
4. **Ports Tab** - Port monitoring
5. **Packages Tab** - @ankr/* package registry
6. **Agents Tab** - PEER/Swarm agent dashboard
7. **Costs Tab** - Cost tracking
8. **System Tab** - System resources (CPU, Memory, Disk, Network)
9. **Security Tab** - Security alerts
10. **Logs Tab** - Service logs

### Backend APIs

The following APIs support ankr-pulse:

| API | Port | Endpoint | Purpose |
|-----|------|----------|---------|
| **ankr-status-api** | 4100 | `/api/status` | Enhanced service status |
| **ai-proxy** | 4444 | `/api/services/health-all` | Service health checks |
| **ai-proxy** | 4444 | `/api/system/metrics` | System metrics |
| **ai-proxy** | 4444 | `/api/packages/list` | Package registry |
| **ai-proxy** | 4444 | `/api/pm2` | PM2 process list |

All backend APIs are proxied through nginx:
- `/ai/api/*` → `http://localhost:4444/api/*`

### Status Check

```bash
# Check if ankr-pulse is running
ankr-ctl status ankr-pulse

# Check nginx proxy
curl -I https://ankr.in/pulse

# Check status API
curl http://localhost:4100/api/status | jq
```

## Services Status

```bash
# ankr-pulse
ankr-ctl status ankr-pulse
# ✅ RUNNING on port 4320

# ankr-status-api
ankr-ctl status ankr-status-api
# ✅ RUNNING on port 4100
```

## Access URLs

| Service | Local URL | Public URL |
|---------|-----------|------------|
| **ANKR Pulse** | http://localhost:4320 | https://ankr.in/pulse |
| **Status API** | http://localhost:4100 | - (internal) |
| **Docs Viewer** | http://localhost:3199 | https://ankr.in/project/documents/ |

## Published Documents

All documents published via `ankr-publish` are available at:
- **https://ankr.in/project/documents/**

Current published documents:
- ✅ ANKR-STATUS-INTEGRATION.md

## Notes

### Development Mode
ankr-pulse is currently running in development mode with:
- Hot Module Replacement (HMR)
- Source maps
- Vite dev server

### Production Build
To deploy as production static build:
```bash
cd /root/ankr-labs-nx/apps/ankr-pulse
pnpm build
```

This will create a `dist/` folder that can be served as static files. However, there are currently some TypeScript errors that need to be fixed before production build succeeds.

### Security
- HTTPS enabled via Cloudflare
- No authentication currently (internal admin tool)
- Consider adding auth if exposed to public internet

### Performance
- WebSocket connections for real-time updates
- Auto-refresh intervals configurable
- Responsive design for mobile/tablet

## Maintenance

### Restarting Services
```bash
# Restart ankr-pulse
ankr-ctl restart ankr-pulse

# Restart status API
ankr-ctl restart ankr-status-api

# Reload nginx
systemctl reload nginx
```

### Updating Configuration
```bash
# Edit nginx config
nano /etc/nginx/sites-enabled/ankr.in

# Test config
nginx -t

# Reload
systemctl reload nginx
```

### Logs
```bash
# ankr-pulse logs
pm2 logs ankr-pulse

# ankr-status-api logs
pm2 logs ankr-status-api

# nginx access logs
tail -f /var/log/nginx/access.log

# nginx error logs
tail -f /var/log/nginx/error.log
```

## Future Enhancements

### 1. Production Build
- Fix TypeScript errors
- Build static bundle
- Deploy to CDN or serve via nginx

### 2. Authentication
- Add basic auth for public access
- OAuth integration
- Role-based access control

### 3. Subdomain
Alternative to /pulse path:
- **pulse.ankr.in** → cleaner URLs
- Dedicated SSL cert
- Separate nginx config

### 4. Monitoring
- Uptime monitoring
- Error tracking
- Performance metrics

---

**Built**: 2026-01-22
**URLs**:
- Dashboard: https://ankr.in/pulse
- Docs: https://ankr.in/project/documents/
- Status API: http://localhost:4100/api/status
