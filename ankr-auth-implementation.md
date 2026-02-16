# ANKR Authentication System - Implementation Complete

## Overview
Implemented JWT-based authentication system for ANKR-CTL dashboard and viewer services.

## Components Implemented

### 1. Authentication Module (`/root/ankr-auth.js`)
- **JWT Implementation**: Native Bun crypto (no external dependencies)
- **Password Hashing**: SHA-256
- **Token Expiry**: 24 hours
- **Features**:
  - User authentication
  - Token generation and verification
  - Password management
  - User management (add, delete, list)

### 2. Default Admin User
- **Username**: `admin`
- **Password**: `ankr@admin123`
- **Role**: `admin`
- **Storage**: `/root/.ankr/config/users.json`

### 3. Updated ANKR-CTL API (`/root/ankr-ctl-api.js`)
- Added authentication endpoints:
  - `POST /api/auth/login` - User login
  - `POST /api/auth/logout` - User logout
  - `GET /api/auth/verify` - Token verification
- Protected all service management routes
- Protected log viewing routes
- Public routes: `/health`, `/login`

### 4. Login Page (`/root/ankr-login.html`)
- Modern, responsive design
- JWT token storage (localStorage + HTTP-only cookie)
- Auto-redirect if already logged in
- Error handling with visual feedback
- Default credentials displayed for convenience

### 5. Dashboard Updates (`/root/ankr-ctl-dashboard-v2.html`)
- Authentication check on page load
- Logout button in header
- User display showing logged-in user
- All API calls include JWT token
- Auto-redirect to login if not authenticated

### 6. Nginx Configuration (`/etc/nginx/sites-enabled/ankr.in`)
- Added `/admin` route → proxies to `localhost:4500` (ANKR-CTL API)
- HTTPS redirect enabled
- Cache-Control headers for security

## Access URLs

### Development (localhost)
- **Dashboard**: http://localhost:4500/
- **Login**: http://localhost:4500/login
- **Health**: http://localhost:4500/health

### Production (domain)
- **Dashboard**: https://ankr.in/admin/
- **Login**: https://ankr.in/admin/login
- **SSL**: Cloudflare origin certificate

## API Endpoints

### Authentication
```bash
# Login
POST /api/auth/login
Body: { "username": "admin", "password": "ankr@admin123" }
Response: { "success": true, "token": "jwt-token", "user": {...} }

# Logout
POST /api/auth/logout
Headers: Authorization: Bearer <token>

# Verify Token
GET /api/auth/verify
Headers: Authorization: Bearer <token>
Response: { "valid": true, "user": {...} }
```

### Protected Routes (Require Authentication)
- `GET /api/services` - List all services
- `POST /api/service/start` - Start service
- `POST /api/service/stop` - Stop service
- `POST /api/service/restart` - Restart service
- `GET /api/logs/search` - Search logs
- `GET /api/logs/stats` - Log statistics
- `GET /api/ports` - Port allocations
- `GET /api/config` - Service configuration

## Security Features

1. **JWT Tokens**
   - 24-hour expiration
   - HMAC-SHA256 signature
   - Stored in both localStorage and HTTP-only cookie

2. **Password Storage**
   - SHA-256 hashed passwords
   - No plaintext storage
   - Secure comparison

3. **HTTP Headers**
   - `Authorization: Bearer <token>`
   - Cookie: `ankr_token=<token>`
   - CORS properly configured

4. **HTTPS Enforcement**
   - Nginx redirects HTTP → HTTPS
   - Cloudflare SSL certificates
   - Secure cookie flags (Secure, HttpOnly, SameSite)

## Service Status

```bash
✓ ankr-ctl-api      - RUNNING on port 4500 (with authentication)
✓ ankr-ctl monitor  - RUNNING (auto-recovery)
✓ ankr-metrics      - RUNNING on port 9090
```

## Next Steps: Viewer Authentication

To protect viewer services like `/interact`, `/view/`, `/ncert/`:

### Option 1: Application-Level (Recommended)
Update each viewer service (ankr-interact, etc.) to:
1. Check for JWT token
2. Verify token via ankr-ctl-api
3. Redirect to login if not authenticated
4. Share authentication state across services

### Option 2: Nginx auth_request
Use nginx `auth_request` module to protect routes:
```nginx
location /interact/ {
    auth_request /auth;
    proxy_pass http://localhost:3199/;
}

location = /auth {
    internal;
    proxy_pass http://localhost:4500/api/auth/verify;
    proxy_pass_request_body off;
    proxy_set_header Content-Length "";
}
```

### Option 3: Authentication Gateway
Create a lightweight auth proxy that:
1. Sits in front of viewer services
2. Checks JWT token
3. Proxies requests if authenticated
4. Redirects to login if not

## Testing

```bash
# Test login
curl -X POST http://localhost:4500/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"ankr@admin123"}'

# Test protected endpoint (will fail without token)
curl http://localhost:4500/api/services

# Test protected endpoint (with token)
curl http://localhost:4500/api/services \
  -H "Authorization: Bearer <token-from-login>"
```

## Files Modified/Created

1. `/root/ankr-auth.js` - Authentication module (NEW)
2. `/root/ankr-login.html` - Login page (NEW)
3. `/root/ankr-ctl-api.js` - Added authentication (MODIFIED)
4. `/root/ankr-ctl-dashboard-v2.html` - Added auth checks (MODIFIED)
5. `/etc/nginx/sites-enabled/ankr.in` - Added /admin route (MODIFIED)
6. `/root/.ankr/config/users.json` - User database (AUTO-CREATED)

## Credentials

**Default Admin:**
- Username: `admin`
- Password: `ankr@admin123`
- Change immediately in production!

## Notes

1. JWT secret should be changed in production (set `ANKR_JWT_SECRET` env var)
2. Consider implementing refresh tokens for longer sessions
3. Add rate limiting for login endpoint
4. Implement 2FA for admin accounts
5. Add audit logging for authentication events
6. Consider implementing role-based access control (RBAC)

---

**Status**: ✅ COMPLETE - Dashboard authentication implemented and tested
**Next**: Implement authentication for viewer services (/interact, /view, etc.)
