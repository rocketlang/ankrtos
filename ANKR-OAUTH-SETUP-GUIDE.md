# 🔐 OAuth Setup Guide - Google, GitHub, Microsoft

**ANKR LMS** is ready for OAuth authentication. Follow these steps to enable social login.

---

## ✅ Current Status

OAuth integration is **fully implemented** and ready to use. The system supports:
- ✅ Google OAuth 2.0
- ✅ GitHub OAuth
- ✅ Microsoft OAuth

**What's needed:** Just add your OAuth app credentials!

---

## 🔧 Setup Instructions

### 1. Google OAuth Setup

**Step 1:** Create OAuth App
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: "Web application"
6. Name: "ANKR LMS"

**Step 2:** Configure Redirect URIs
```
Development:
http://localhost:3199/api/auth/google/callback

Production:
https://your-domain.com/api/auth/google/callback
```

**Step 3:** Get Credentials
- Copy "Client ID"
- Copy "Client secret"

**Step 4:** Add to Environment
```bash
# Edit /root/ankr-labs-nx/packages/ankr-interact/.env
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:3199/api/auth/google/callback
```

**Step 5:** Restart Server
```bash
lsof -ti:3199 | xargs kill -9
npx tsx src/server/index.ts
```

---

### 2. GitHub OAuth Setup

**Step 1:** Create OAuth App
1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Click "OAuth Apps" → "New OAuth App"
3. Application name: "ANKR LMS"
4. Homepage URL: `http://localhost:3199` (dev) or `https://your-domain.com` (prod)

**Step 2:** Configure Callback URL
```
Development:
http://localhost:3199/api/auth/github/callback

Production:
https://your-domain.com/api/auth/github/callback
```

**Step 3:** Get Credentials
- Copy "Client ID"
- Generate "Client secret"

**Step 4:** Add to Environment
```bash
# Edit .env
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=http://localhost:3199/api/auth/github/callback
```

**Step 5:** Restart Server

---

### 3. Microsoft OAuth Setup

**Step 1:** Register Application
1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Name: "ANKR LMS"
5. Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"

**Step 2:** Configure Redirect URIs
1. Go to "Authentication"
2. Add platform: "Web"
3. Redirect URIs:
```
Development:
http://localhost:3199/api/auth/microsoft/callback

Production:
https://your-domain.com/api/auth/microsoft/callback
```

**Step 3:** Get Credentials
- Copy "Application (client) ID"
- Go to "Certificates & secrets" → "New client secret"
- Copy the secret value

**Step 4:** Add to Environment
```bash
# Edit .env
MICROSOFT_CLIENT_ID=your-app-id
MICROSOFT_CLIENT_SECRET=your-client-secret
MICROSOFT_REDIRECT_URI=http://localhost:3199/api/auth/microsoft/callback
```

**Step 5:** Restart Server

---

## ✅ Testing OAuth Login

### Test Google OAuth
```bash
# 1. Start server
npx tsx src/server/index.ts

# 2. Navigate to login page
http://localhost:3199

# 3. Click "continue with google"
# 4. Select Google account
# 5. Verify redirect to dashboard
# 6. Check user created in database:
PGPASSWORD='indrA@0612' psql -U ankr -h localhost -d ankr_eon -c "SELECT email, oauth_provider FROM users WHERE oauth_provider = 'google';"
```

### Test GitHub OAuth
```bash
# Same process, click "continue with github"
```

### Test Microsoft OAuth
```bash
# Same process, click "continue with microsoft"
```

---

## 🔍 Troubleshooting

### Error: "Redirect URI mismatch"

**Cause:** Configured callback URL doesn't match OAuth app settings

**Fix:**
1. Check OAuth app settings (Google/GitHub/Microsoft console)
2. Verify redirect URI matches exactly:
   - `http://localhost:3199/api/auth/google/callback` (dev)
   - `https://your-domain.com/api/auth/google/callback` (prod)
3. No trailing slashes
4. Protocol must match (http vs https)

### Error: "Invalid client"

**Cause:** Client ID or secret incorrect

**Fix:**
1. Verify credentials copied correctly
2. No extra spaces or newlines
3. Regenerate secret if needed
4. Restart server after changes

### Error: "Access denied"

**Cause:** User denied permissions or app not approved

**Fix:**
1. Try again and grant permissions
2. For Microsoft: Check app permissions in Azure
3. For Google: Check OAuth consent screen configuration

### OAuth button does nothing

**Cause:** Missing credentials or server not started

**Fix:**
1. Check `.env` file has all OAuth variables
2. Restart server to load new environment variables
3. Check browser console for errors
4. Check server logs: `tail -f /tmp/ankr-interact.log`

---

## 🔐 Production Configuration

### SSL/HTTPS Required

OAuth providers require HTTPS in production:

```bash
# Update redirect URIs in .env
GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/google/callback
GITHUB_REDIRECT_URI=https://your-domain.com/api/auth/github/callback
MICROSOFT_REDIRECT_URI=https://your-domain.com/api/auth/microsoft/callback

# Update OAuth app settings in provider consoles
# Set NODE_ENV=production
NODE_ENV=production
```

### Domain Verification

Some providers require domain verification:
1. **Google:** Add domain to Google Search Console
2. **Microsoft:** Add domain to Azure AD
3. **GitHub:** No verification needed

---

## 📊 OAuth Flow

```
User clicks "continue with google"
         ↓
Redirect to Google login
         ↓
User authenticates with Google
         ↓
Google redirects back with code
         ↓
Server exchanges code for access token
         ↓
Server fetches user profile
         ↓
Check if user exists in database
    /              \
  YES              NO
   ↓                ↓
Load user    Create new user
   ↓                ↓
    \              /
     Create session (30 days)
         ↓
    Set cookie
         ↓
Redirect to dashboard
```

---

## ✅ Verification Checklist

After configuring OAuth:

- [ ] OAuth app created in provider console
- [ ] Redirect URI configured correctly
- [ ] Client ID copied to .env
- [ ] Client secret copied to .env
- [ ] Server restarted
- [ ] Login button appears on login page
- [ ] Click button redirects to provider
- [ ] Can authenticate with provider
- [ ] Redirects back to app successfully
- [ ] User created in database
- [ ] Session persists after refresh
- [ ] Logout works correctly

---

## 📝 Current Configuration

**File:** `/root/ankr-labs-nx/packages/ankr-interact/.env`

```env
# OAuth Providers (Add your credentials)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3199/api/auth/google/callback

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_REDIRECT_URI=http://localhost:3199/api/auth/github/callback

MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_REDIRECT_URI=http://localhost:3199/api/auth/microsoft/callback
```

**Status:** ⏳ Waiting for credentials

---

## 🎓 User Experience

### Before OAuth Setup
```
Login page shows:
- Email/password form ✅
- Phone login ✅
- OAuth buttons (grayed out) ⏳
```

### After OAuth Setup
```
Login page shows:
- Email/password form ✅
- Phone login ✅
- OAuth buttons (active) ✅
  - "continue with google" → Google login
  - "continue with github" → GitHub login
  - "continue with microsoft" → Microsoft login
```

---

**OAuth is ready to use! Just add your credentials.** 🚀
