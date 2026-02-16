# ANKR Viewer Authentication - Implementation Complete

## Overview
All viewer services at ankr.in are now protected with JWT authentication using nginx's `auth_request` module.

## Protected Routes

### 🔒 Now Requiring Authentication:

1. **ANKR Interact** - `/interact/`
   - Full React app with documentation browser
   - Port: 3199
   - Features: Knowledge graph, search, document viewer

2. **Document Viewer** - `/view/`
   - Rendered markdown viewer
   - Port: 3199
   - API-driven document rendering

3. **Project Documents** - `/project/documents/`
   - Static file viewer with SPA routing
   - Port: 3199 / Static files
   - React-based document browser

4. **Standalone Viewer** - `/viewer/`
   - Original rich HTML viewer
   - Port: 3201
   - Standalone document viewer

5. **NCERT Viewer** - `/ncert/`
   - Intelligent educational content viewer
   - Port: 5174 (Vite dev server)
   - Interactive learning platform

6. **ANKR Pulse** - `/pulse/`
   - System monitoring dashboard
   - Port: 4320
   - Real-time service monitoring

7. **Pratham TeleHub** - `/pratham/`
   - Telecom management frontend
   - Port: 3101
   - Business management platform

8. **Admin Dashboard** - `/admin/`
   - ANKR-CTL control panel
   - Port: 4500
   - Service orchestration & logs

## How It Works

### Architecture

```
User Request → Nginx → auth_request → ankr-ctl-api (/api/auth/check)
                 ↓                            ↓
            401 Error                    Check JWT Cookie
                 ↓                            ↓
         Redirect to Login            200 OK or 401 Error
                                             ↓
                                    Proxy to Backend Service
```

### Authentication Flow

1. **User visits protected route** (e.g., https://ankr.in/interact/)
2. **Nginx calls auth_request** → `http://localhost:4500/api/auth/check`
3. **ankr-ctl-api checks JWT** from `ankr_token` cookie
4. **If valid (200)**: Request proxied to backend service
5. **If invalid (401)**: User redirected to `/admin/login?redirect=/interact/`
6. **After login**: User redirected back to original URL

### Nginx Configuration

```nginx
# Internal auth endpoint
location = /auth {
    internal;
    proxy_pass http://localhost:4500/api/auth/check;
    proxy_pass_request_body off;
    proxy_set_header Content-Length "";
    proxy_set_header Cookie $http_cookie;
}

# Error handling
error_page 401 = @error401;
location @error401 {
    return 302 https://$host/admin/login?redirect=$request_uri;
}

# Protected route example
location /interact/ {
    auth_request /auth;
    auth_request_set $auth_status $upstream_status;
    proxy_pass http://localhost:3199/;
}
```

## Endpoints

### Authentication API

**Auth Check** (Nginx internal use)
```bash
GET /api/auth/check
Headers: Cookie: ankr_token=<jwt>
Response: 200 OK or 401 Unauthorized
```

**Login** (Public)
```bash
POST /api/auth/login
Body: { "username": "admin", "password": "ankr@admin123" }
Response: { "success": true, "token": "...", "user": {...} }
Set-Cookie: ankr_token=<jwt>; HttpOnly; Secure; SameSite=Strict
```

**Verify Token** (Public)
```bash
GET /api/auth/verify
Headers: Authorization: Bearer <token> OR Cookie: ankr_token=<token>
Response: { "valid": true, "user": {...} }
```

## Security Features

### Cookie-Based Authentication
- **HttpOnly**: JavaScript cannot access (XSS protection)
- **Secure**: Only sent over HTTPS
- **SameSite=Strict**: CSRF protection
- **Max-Age**: 24 hours (86400 seconds)

### JWT Token
- **Algorithm**: HMAC-SHA256
- **Expiry**: 24 hours
- **Payload**: username, role, name, iat, exp
- **Secret**: Configurable via `ANKR_JWT_SECRET` env var

### Nginx Protection
- **auth_request**: Subrequest before proxying
- **Internal location**: `/auth` not publicly accessible
- **Cookie forwarding**: JWT token passed to auth check
- **Automatic redirect**: 401 → login with return URL

## User Experience

### First Visit (Unauthenticated)
1. User visits `https://ankr.in/interact/`
2. Nginx checks authentication (finds no cookie)
3. User redirected to `https://ankr.in/admin/login?redirect=/interact/`
4. User logs in with credentials
5. JWT cookie set by server
6. User redirected back to `https://ankr.in/interact/`
7. Page loads successfully

### Subsequent Visits (Authenticated)
1. User visits any protected route
2. Nginx validates JWT cookie (200 OK)
3. Request proxied to backend
4. Page loads instantly (no redirect)

### Session Expiry
1. JWT expires after 24 hours
2. Next request returns 401
3. User redirected to login
4. Original URL preserved in redirect parameter

## Testing

### Test Authentication Flow

```bash
# 1. Test without authentication (should get 401)
curl -v https://ankr.in/interact/ 2>&1 | grep -E "HTTP|Location"

# 2. Login and get cookie
curl -c cookies.txt -X POST https://ankr.in/admin/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"ankr@admin123"}'

# 3. Test with authentication (should get 200)
curl -b cookies.txt -v https://ankr.in/interact/ 2>&1 | grep "HTTP"

# 4. Test auth check directly
curl -b cookies.txt http://localhost:4500/api/auth/check
# Should return: OK
```

### Test Protected Routes

All these routes should redirect to login when unauthenticated:
- https://ankr.in/interact/
- https://ankr.in/view/
- https://ankr.in/ncert/
- https://ankr.in/viewer/
- https://ankr.in/pulse/
- https://ankr.in/project/documents/
- https://ankr.in/pratham/
- https://ankr.in/admin/

## Files Modified

1. **`/root/ankr-ctl-api.js`**
   - Added `/api/auth/check` endpoint for nginx auth_request
   - Returns 200/401 status codes (no JSON body)

2. **`/root/ankr-login.html`**
   - Added redirect URL parameter handling
   - Reads `?redirect=` from query string
   - Redirects user back after successful login

3. **`/etc/nginx/sites-enabled/ankr.in`**
   - Added internal `/auth` location
   - Added `auth_request /auth` to 8 viewer routes
   - Added `@error401` handler for login redirect
   - Protected: interact, view, ncert, viewer, pulse, pratham, project/documents, admin

## Configuration

### JWT Secret
Change the JWT secret in production:

```bash
# In /root/.ankr/config/credentials.env
ANKR_JWT_SECRET=your-secure-random-secret-here

# Restart ankr-ctl-api
/root/ankr-ctl restart ankr-ctl-api
```

### Session Duration
To change token expiry (default 24h):

```javascript
// In /root/ankr-auth.js
const JWT_EXPIRY = 24 * 60 * 60; // Change to desired seconds
```

### Add/Remove Protected Routes

To protect a new route:
```nginx
location /new-route/ {
    auth_request /auth;
    auth_request_set $auth_status $upstream_status;
    proxy_pass http://localhost:PORT/;
}
```

To make a route public (remove protection):
```nginx
location /public-route/ {
    # Remove auth_request line
    proxy_pass http://localhost:PORT/;
}
```

## User Management

### Add New User

```bash
# Via ankr-ctl-api (requires admin auth)
curl -X POST http://localhost:4500/api/users/add \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "viewer1",
    "password": "secure-password",
    "name": "Viewer User",
    "role": "viewer"
  }'
```

### Change Password

Directly edit `/root/.ankr/config/users.json` and update the SHA-256 hash:
```bash
echo -n "new-password" | sha256sum
# Copy the hash to users.json
```

### List Users

```bash
cat /root/.ankr/config/users.json | jq
```

## Monitoring

### Check Auth Logs

```bash
# ANKR-CTL API logs
tail -f /root/.ankr/logs/ankr-ctl-api.log

# Nginx access logs (shows auth failures)
tail -f /var/log/nginx/access.log | grep "401"

# Nginx error logs
tail -f /var/log/nginx/error.log
```

### Metrics

Authentication metrics available via:
- Prometheus: http://localhost:9090/metrics
- ANKR-CTL Dashboard: https://ankr.in/admin/

## Troubleshooting

### Issue: Redirect loop
**Cause**: `/admin/login` is also protected
**Fix**: Ensure `/admin/` location is BEFORE auth_request in nginx config

### Issue: 401 on all routes
**Cause**: ankr-ctl-api not running or auth endpoint failing
**Fix**: Check service status: `/root/ankr-ctl status ankr-ctl-api`

### Issue: Cookie not being set
**Cause**: Domain mismatch or insecure connection
**Fix**: Ensure using HTTPS and correct domain

### Issue: Token expired immediately
**Cause**: Server time mismatch
**Fix**: Sync server time: `ntpdate -s time.nist.gov`

## Summary

✅ **8 viewer routes protected** with JWT authentication
✅ **Cookie-based auth** for seamless user experience
✅ **Automatic redirects** with return URL preservation
✅ **Nginx-level protection** (no application changes needed)
✅ **Secure by default** (HttpOnly, Secure, SameSite cookies)
✅ **24-hour sessions** with automatic expiry

All viewer services at **ankr.in** are now behind authentication. Users must login at **https://ankr.in/admin/login** before accessing any protected content.

---

**Default Credentials:**
- Username: `admin`
- Password: `ankr@admin123`
- Change immediately in production!

**Status**: ✅ COMPLETE - All viewers protected with authentication
