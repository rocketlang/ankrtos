# ComplyMitra Login Issue - Complete Diagnosis Report

**Date**: 2026-02-12
**Issue**: Login doesn't work or blanking
**Status**: ✅ ROOT CAUSE IDENTIFIED

---

## Executive Summary

The ComplyMitra application at **app.complymitra.in** is bypassing authentication entirely. The app loads directly to a role selection wizard or dashboard **without checking if the user is logged in**.

---

## Test Results

### Playwright Automated Tests

✅ **Landing Page** (complymitra.in)
- Status: 200 OK
- Title: "ComplyMitra - India's Smartest AI Compliance Platform"
- Working properly

✅ **App Page** (app.complymitra.in)
- Status: 200 OK
- Title: "Ankr Compliance"
- **PROBLEM**: No login form elements
  - Email inputs: 0
  - Password inputs: 0
  - Login buttons: 0
  - Shows role selection wizard instead

✅ **GraphQL API** (localhost:4001)
- Status: 200 OK
- Has auth plugin with OTP authentication
- Backend is working correctly

---

## Root Cause Analysis

### The Bug Chain

1. **User visits**: https://app.complymitra.in
2. **React Router loads**: `App.tsx` line 73
   ```tsx
   <Route path="/" element={<FirstTimeRedirect />} />
   ```
3. **FirstTimeRedirect executes**: `FirstTimeRedirect.tsx`
   ```tsx
   const hasSelectedRole = localStorage.getItem(ROLE_SELECTED_KEY) === 'true';

   if (hasSelectedRole) {
     navigate('/dashboard');  // ← Goes to dashboard WITHOUT auth check!
   } else {
     navigate('/select-role');  // ← Shows role selector WITHOUT auth check!
   }
   ```
4. **Result**: App never checks for:
   - Auth token
   - JWT
   - Login status
   - User session

### Missing Components

❌ **No login route** defined in `App.tsx`
❌ **No authentication guard** wrapping protected routes
❌ **No auth check** in FirstTimeRedirect
❌ **No redirect to login** if unauthenticated
❌ **LoginPage.tsx exists but is not used** (has mock auth only)

---

## Evidence

### Current App Flow
```
User → app.complymitra.in
  ↓
FirstTimeRedirect
  ↓
Check localStorage.complymitra_role_selected
  ├─ true  → /dashboard (NO AUTH CHECK)
  └─ false → /select-role (NO AUTH CHECK)
```

### Expected Flow
```
User → app.complymitra.in
  ↓
Check auth token
  ├─ Valid   → /dashboard
  ├─ Invalid → /login
  └─ None    → /login
```

### Backend Has Authentication (Not Used)

The GraphQL API at port 4001 has full OTP authentication:
- `/email/send-otp` - Send OTP to email
- `/email/verify-otp` - Verify OTP and get JWT
- `/phone/send-otp` - Send OTP to phone
- `/phone/verify-otp` - Verify phone OTP
- JWT tokens with 1-hour expiry
- Refresh tokens
- Session management

**BUT THE FRONTEND NEVER CALLS THESE!**

---

## Screenshots

All screenshots saved in `/root/`:
- `complymitra-landing.png` - Working landing page
- `complymitra-app-initial.png` - App showing role selector (should show login)
- `complymitra-app-filled.png` - No login form to fill
- `complymitra-app-after-login.png` - Already "logged in" without auth

---

## Impact

### Security
🔴 **CRITICAL**: Anyone can access the app without authentication
- No user verification
- No access control
- No audit trail

### User Experience
🟡 **HIGH**: Confusing UX
- Users expect login form
- Get role selection wizard instead
- "Blanking" effect when redirecting

### Data Privacy
🔴 **CRITICAL**: Potential GDPR/compliance issues
- No user consent flow
- No data protection
- Anyone can access compliance data

---

## Solution Options

### Option 1: Quick Fix (Recommended for immediate deployment)

Add authentication check to `FirstTimeRedirect.tsx`:

```tsx
export function FirstTimeRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication first
    const authToken = localStorage.getItem('auth_token');

    if (!authToken) {
      // Not authenticated - go to login
      navigate('/login', { replace: true });
      return;
    }

    // Authenticated - check role selection
    const hasSelectedRole = localStorage.getItem(ROLE_SELECTED_KEY) === 'true';

    if (hasSelectedRole) {
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/select-role', { replace: true });
    }
  }, [navigate]);

  return <LoadingScreen />;
}
```

Add login route to `App.tsx`:
```tsx
<Route path="/login" element={<LoginPage />} />
```

### Option 2: Proper Implementation (Recommended for production)

1. Create `ProtectedRoute` component:
```tsx
function ProtectedRoute({ children }) {
  const authToken = localStorage.getItem('auth_token');

  if (!authToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
```

2. Wrap all routes:
```tsx
<AppLayout>
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/" element={<ProtectedRoute><FirstTimeRedirect /></ProtectedRoute>} />
    <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
    {/* ... all other routes ... */}
  </Routes>
</AppLayout>
```

3. Connect LoginPage to backend OTP auth:
```tsx
// Replace mock login in LoginPage.tsx with:
const response = await fetch('https://app.complymitra.in/graphql', {
  method: 'POST',
  body: JSON.stringify({
    query: `mutation { sendOTP(email: "${email}") { success } }`
  })
});
```

### Option 3: Full Auth Overhaul (Long-term)

1. Implement proper auth context
2. Add token refresh logic
3. Add session timeout
4. Add multi-factor authentication
5. Add SSO integration (Google, Microsoft)

---

## Immediate Action Items

### Priority 1 (CRITICAL - Do Now)
1. Add `/login` route to App.tsx
2. Add auth check to FirstTimeRedirect
3. Redirect unauthenticated users to login
4. Test with Playwright

### Priority 2 (HIGH - This Week)
1. Connect LoginPage to backend OTP API
2. Implement proper JWT token handling
3. Add token refresh logic
4. Add logout functionality

### Priority 3 (MEDIUM - This Month)
1. Create ProtectedRoute component
2. Wrap all protected routes
3. Add auth context provider
4. Add session timeout

---

## Configuration Issues Found

### Nginx Config
File: `/etc/nginx/sites-enabled/complymitra`

**Issue**: Proxies to two different backends:
```nginx
# Line 49: Proxies /graphql to port 4001 (ankr-compliance-api) ✅
location /graphql {
    proxy_pass http://localhost:4001/graphql;
}

# Line 56: Proxies /ai to port 4444 (ai-proxy) ✅
location /ai {
    proxy_pass http://localhost:4444/api/ai;
}
```

**Note**: complymitra-api on port 4015 is NOT used by the frontend.
It's a separate REST API with 145 compliance tools.

### Services Running

1. **ankr-compliance-api** (port 4001)
   - GraphQL API with auth plugin
   - Used by app.complymitra.in ✅
   - Running correctly

2. **complymitra-api** (port 4015)
   - REST API with compliance tools
   - NOT connected to frontend
   - 46 restarts (unstable but not related to login issue)

---

## Testing Commands

### Run Automated Tests
```bash
node /root/test-complymitra.js
node /root/test-complymitra-detailed.js
```

### Manual Testing
1. Visit https://app.complymitra.in
2. Open DevTools → Application → Local Storage
3. Check for `auth_token` - Should exist but doesn't
4. Check for `complymitra_role_selected` - Exists when it shouldn't

### API Testing
```bash
# Test OTP send
curl -X POST http://localhost:4001/email/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Test GraphQL
curl -X POST http://localhost:4001/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'
```

---

## Files Analyzed

### Frontend (React)
- `/var/www/ankr-compliance/index.html` - Entry point ✅
- `/root/ankr-compliance/apps/web/src/App.tsx` - Main router ⚠️
- `/root/ankr-compliance/apps/web/src/components/FirstTimeRedirect.tsx` - **BUG HERE** 🔴
- `/root/ankr-compliance/apps/web/src/pages/LoginPage.tsx` - Not used ⚠️

### Backend (GraphQL)
- `/root/ankr-compliance/apps/api/src/plugins/auth.ts` - OTP auth ✅
- `/root/ankr-compliance/apps/api/src/main.ts` - API setup ✅

### Infrastructure
- `/etc/nginx/sites-enabled/complymitra` - Nginx config ✅
- `/root/.ankr/config/services.json` - Service registry ✅
- `/root/.ankr/config/ports.json` - Port mappings ✅

---

## Recommendations

### Immediate (Today)
1. ✅ Identify root cause - **DONE**
2. ⬜ Add login route
3. ⬜ Add auth check to FirstTimeRedirect
4. ⬜ Deploy and test

### Short-term (This Week)
1. ⬜ Connect frontend to backend OTP auth
2. ⬜ Implement proper JWT handling
3. ⬜ Add logout functionality
4. ⬜ Add session timeout

### Long-term (This Month)
1. ⬜ Create ProtectedRoute component
2. ⬜ Add auth context provider
3. ⬜ Implement token refresh
4. ⬜ Add SSO (Google/Microsoft)
5. ⬜ Add multi-factor auth
6. ⬜ Security audit

---

## Contact & Support

**Issue Type**: Authentication Bypass
**Severity**: 🔴 Critical
**Assigned To**: DevOps / Security Team
**Reporter**: Claude Code Agent
**Date**: 2026-02-12

**Files Generated**:
- This report: `/root/complymitra-diagnosis-report.md`
- Test results: `/root/complymitra-test-results.json`
- Detailed analysis: `/root/complymitra-detailed-report.json`
- Test scripts: `/root/test-complymitra.js`, `/root/test-complymitra-detailed.js`
- Screenshots: `/root/complymitra-*.png`

---

**Jai Guru Ji! 🙏**
