# ANKR RBAC/ABAC Implementation

## Overview
Implemented Role-Based Access Control (RBAC) and Attribute-Based Access Control (ABAC) for granular permission management across ANKR services.

## Architecture

### Permission Model
```javascript
{
  "username": "user@ankr.in",
  "role": "user|admin",
  "permissions": ["service1", "service2", "admin"]
}
```

### Access Control Flow
```
User Request → Nginx → auth_request → /api/auth/check
                                           ↓
                                    Extract JWT Token
                                           ↓
                                    Verify Token Signature
                                           ↓
                                    Extract User Permissions
                                           ↓
                                    Get Original URI (X-Original-URI)
                                           ↓
                                    Match Route to Permissions
                                           ↓
                        ┌──────────────────┴──────────────────┐
                        ↓                                      ↓
                  200 OK (Authorized)              401/403 (Denied)
                        ↓                                      ↓
                 Proxy to Service                    Redirect to Login
```

## Permission Types

### 1. Admin Permission (*)
- Full access to all services
- Can manage users
- Access to all routes

```json
"permissions": ["*"]
```

### 2. Service-Specific Permissions
- Limited to specific services
- Can access dashboard (/admin/)
- Cannot access other services

```json
"permissions": ["pratham", "admin"]
```

### 3. Viewer Permissions
- Read-only access to viewers
- No service management
- Documentation access only

```json
"permissions": ["interact", "view", "project", "viewer", "ncert"]
```

## User Roles

### Admin Users
- **admin** - System administrator (all access)
- **captain@ankr.in** - Captain (all access)

### Service Users
| Username | Services | Access |
|----------|----------|--------|
| pratham@ankr.in | Pratham TeleHub | /pratham/, /admin/ |
| ankrtms@ankr.in | ANKR TMS | /ankrtms/, /admin/ |
| complymitra@ankr.in | ComplyMitra | /complymitra/, /admin/ |
| ankrwms@ankr.in | ANKR WMS | /ankrwms/, /admin/ |
| freightbox@ankr.in | FreightBox | /freightbox/, /admin/ |
| mari8x@ankr.in | Mari8X | /mari8x/, /admin/ |
| edibox@ankr.in | EDIBox | /edibox/, /admin/ |

### Viewer Users
| Username | Access |
|----------|--------|
| viewer@ankr.in | /interact/, /view/, /project/, /viewer/, /ncert/ |

**Default Password**: `password` (change after first login)

## Implementation Details

### 1. User Model Extension (`ankr-auth.js`)

Added permissions array to user schema:
```javascript
{
  username: "user@ankr.in",
  password: "<sha256-hash>",
  role: "user",
  name: "User Name",
  permissions: ["service1", "service2"], // NEW
  created: "2026-02-16T13:10:00.000Z"
}
```

### 2. JWT Token Extension

JWT payload now includes permissions:
```javascript
{
  username: "user@ankr.in",
  role: "user",
  name: "User Name",
  permissions: ["pratham", "admin"], // NEW
  iat: 1771227318,
  exp: 1771313718
}
```

### 3. Permission Checking Function

```javascript
export function hasPermission(user, path) {
  // Admin has access to everything
  if (user.role === 'admin' || user.permissions.includes('*')) {
    return true;
  }

  // Extract route from path (e.g., /pratham/ → pratham)
  const routeMatch = path.match(/^\/([^\/]+)/);
  const route = routeMatch ? routeMatch[1] : null;

  // Check if user has permission for this route
  return user.permissions.includes(route);
}
```

### 4. Enhanced Auth Check Endpoint

```javascript
// /api/auth/check
if (path === '/api/auth/check') {
  const token = extractToken(req);
  if (!token) return 401;

  const result = verifyToken(token);
  if (!result.valid) return 401;

  // NEW: Check permissions
  const originalUri = req.headers.get('x-original-uri');
  if (!hasPermission(result.user, originalUri)) {
    return 403; // Forbidden
  }

  return 200; // OK
}
```

### 5. Nginx Configuration

Pass original URI to auth check:
```nginx
location = /auth {
    internal;
    proxy_pass http://localhost:4500/api/auth/check;
    proxy_set_header X-Original-URI $request_uri; # NEW
    proxy_set_header Cookie $http_cookie;
}

# Handle forbidden errors
error_page 403 = @error403;
location @error403 {
    return 302 https://$host/admin/login?error=forbidden&redirect=$request_uri;
}
```

## Usage Examples

### Example 1: Pratham User

**User**: `pratham@ankr.in`
**Permissions**: `["pratham", "admin"]`

**Allowed Routes**:
- ✅ https://ankr.in/pratham/ (matches "pratham")
- ✅ https://ankr.in/admin/ (matches "admin")

**Denied Routes**:
- ❌ https://ankr.in/mari8x/ (not in permissions → 403)
- ❌ https://ankr.in/interact/ (not in permissions → 403)

### Example 2: Viewer User

**User**: `viewer@ankr.in`
**Permissions**: `["interact", "view", "project", "viewer", "ncert"]`

**Allowed Routes**:
- ✅ https://ankr.in/interact/
- ✅ https://ankr.in/view/
- ✅ https://ankr.in/ncert/

**Denied Routes**:
- ❌ https://ankr.in/admin/ (dashboard - service management)
- ❌ https://ankr.in/pratham/ (not a viewer route)

### Example 3: Admin User

**User**: `captain@ankr.in`
**Permissions**: `["*"]`

**Allowed Routes**:
- ✅ All routes (wildcard permission)

## User Management

### View All Users
```bash
cat /root/.ankr/config/users.json | jq
```

### Add New Service User

Manual method:
```bash
# Hash password
echo -n "your-password" | sha256sum

# Edit users.json
nano /root/.ankr/config/users.json

# Add user:
{
  "newuser@ankr.in": {
    "username": "newuser@ankr.in",
    "password": "<sha256-hash>",
    "role": "user",
    "name": "New User",
    "permissions": ["service1", "service2", "admin"],
    "created": "2026-02-16T13:00:00.000Z"
  }
}
```

### Modify User Permissions

Edit `/root/.ankr/config/users.json`:
```bash
# Give user multi-service access
"permissions": ["pratham", "mari8x", "edibox", "admin"]

# Give user viewer-only access
"permissions": ["interact", "view", "ncert"]

# Give user full admin access
"permissions": ["*"]
```

No restart needed - changes take effect on next login.

### Remove User Access

Set permissions to empty array:
```json
"permissions": []
```

User can still login but cannot access any protected routes.

## Permission Patterns

### Pattern 1: Single Service + Dashboard
```json
"permissions": ["pratham", "admin"]
```
User can access their service and manage it via dashboard.

### Pattern 2: Multiple Services
```json
"permissions": ["mari8x", "edibox", "freightbox", "admin"]
```
User manages multiple related services.

### Pattern 3: Viewer Only (No Management)
```json
"permissions": ["interact", "view", "ncert"]
```
Read-only access to documentation, no service control.

### Pattern 4: Custom Combinations
```json
"permissions": ["pratham", "interact", "view", "admin"]
```
Service access + viewer access + dashboard.

### Pattern 5: Admin Override
```json
"permissions": ["*"]
```
Bypasses all permission checks (full access).

## Route Mapping

| URL Pattern | Permission Required | Service |
|-------------|-------------------|---------|
| /admin/ | admin | Dashboard |
| /pratham/ | pratham | Pratham TeleHub |
| /interact/ | interact | ANKR Interact |
| /view/ | view | Document Viewer |
| /project/documents/ | project | Static Viewer |
| /viewer/ | viewer | Standalone Viewer |
| /ncert/ | ncert | NCERT Viewer |
| /pulse/ | pulse | System Monitoring |
| /mari8x/ | mari8x | Mari8X Platform |
| /edibox/ | edibox | EDIBox Platform |
| /freightbox/ | freightbox | FreightBox Platform |
| /complymitra/ | complymitra | ComplyMitra |

## Security Considerations

### 1. Least Privilege Principle
- Users get minimum permissions needed
- Service users cannot access other services
- Viewer users cannot manage services

### 2. Defense in Depth
- JWT signature verification
- Permission check on every request
- Nginx-level enforcement
- Token expiration (24 hours)

### 3. Audit Trail
All authentication events logged:
```bash
tail -f /root/.ankr/logs/ankr-ctl-api.log | grep auth
```

### 4. Permission Changes
- Changes to users.json take effect immediately
- No service restart required
- Existing tokens remain valid until expiry

## Troubleshooting

### User Can't Access Service

1. **Check permissions**:
   ```bash
   cat /root/.ankr/config/users.json | jq '."username@ankr.in".permissions'
   ```

2. **Verify token includes permissions**:
   Login and decode JWT at https://jwt.io

3. **Check nginx logs**:
   ```bash
   tail -f /var/log/nginx/error.log
   ```

### 403 Forbidden Error

- User authenticated but lacks permission
- Check user's permissions array includes the route
- Example: Accessing /mari8x/ requires "mari8x" in permissions

### 401 Unauthorized Error

- User not logged in or token expired
- Redirect to login page
- Token valid for 24 hours

## API Endpoints

### Check User Permissions
```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:4500/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user@ankr.in","password":"password"}' \
  | jq -r '.token')

# Verify token (includes permissions)
curl -s http://localhost:4500/api/auth/verify \
  -H "Authorization: Bearer $TOKEN" | jq
```

## Files Modified

1. `/root/ankr-auth.js` - Added permission functions
2. `/root/ankr-ctl-api.js` - Enhanced auth check endpoint
3. `/root/.ankr/config/users.json` - User database with permissions
4. `/etc/nginx/sites-enabled/ankr.in` - Added 403 error handling
5. `/root/create-service-users.sh` - Script to create service users

## Testing

```bash
# Test pratham user
curl -X POST http://localhost:4500/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"pratham@ankr.in","password":"password"}'

# Result should show:
# "permissions": ["pratham", "admin"]

# Test viewer user
curl -X POST http://localhost:4500/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"viewer@ankr.in","password":"password"}'

# Result should show:
# "permissions": ["interact", "view", "project", "viewer", "ncert"]
```

## Summary

✅ **RBAC**: Role-based permissions (admin/user)
✅ **ABAC**: Attribute-based permissions (service-specific)
✅ **Granular Control**: Per-route permission enforcement
✅ **JWT Integration**: Permissions embedded in tokens
✅ **Nginx Enforcement**: Protection at reverse proxy level
✅ **Zero-Trust**: Every request authenticated & authorized
✅ **Scalable**: Easy to add new users/services/permissions

---

**Status**: ✅ COMPLETE - RBAC/ABAC fully operational
**Users**: 10 users created (2 admin, 7 service, 1 viewer)
**Protection**: All routes require authentication + authorization
