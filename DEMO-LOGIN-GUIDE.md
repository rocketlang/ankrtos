# ComplyMitra - Demo Login Guide

## 🔐 Authentication Type: OTP-Based (No Password!)

ComplyMitra uses **passwordless authentication** with OTP (One-Time Password) sent to your email.

---

## 📧 How to Login

### Method 1: Test with ANY Email (Development Mode)

Since the app is in development mode, the OTP is logged and returned in the API response. **You can use any email address!**

**Steps:**
1. Visit: https://app.complymitra.in
2. You'll see the login page
3. Enter ANY email (e.g., `demo@test.com`, `admin@example.com`, etc.)
4. Click **"Send OTP"**
5. **Check the browser console** (F12 → Console tab)
   - The OTP will be in the API response!
6. OR check backend logs:
   ```bash
   pm2 logs ankr-compliance-api --lines 50
   ```
7. Enter the 6-digit OTP
8. Click **"Verify & Sign In"**
9. ✅ You're logged in!

---

## 🧪 Quick Test

### Option A: Browser Console Method

1. Open https://app.complymitra.in
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Enter email: `test@demo.com`
5. Click "Send OTP"
6. Look in Console - you'll see the API response with `devOtp` field
7. Copy the OTP and paste it

### Option B: Backend Logs Method

```bash
# Terminal 1: Watch logs
pm2 logs ankr-compliance-api --lines 0

# Then in browser:
# 1. Visit app.complymitra.in
# 2. Enter any email
# 3. Click "Send OTP"
# 4. Check Terminal 1 - you'll see the OTP logged
```

---

## 🎯 Recommended Demo Accounts

You can use any email, but here are some suggestions:

| Email | Purpose |
|-------|---------|
| `demo@complymitra.in` | General demo user |
| `admin@complymitra.in` | Admin testing |
| `ca@complymitra.in` | CA/Tax professional |
| `test@example.com` | Quick testing |

**Remember:** In dev mode, ALL emails work! The OTP is logged, not actually sent to email.

---

## 🔧 Testing Right Now

Let me generate an OTP for you to test immediately:

**Test User:** `demo@complymitra.in`

**To get OTP:**
```bash
# Run this command:
curl -X POST http://localhost:4001/email/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "demo@complymitra.in"}'
```

**Response will include:**
```json
{
  "success": true,
  "message": "OTP sent to email",
  "expiresIn": 300,
  "devOtp": "123456"  ← YOUR OTP HERE (in dev mode)
}
```

---

## 📱 Alternative: Use Postman/Insomnia

### Step 1: Send OTP
**POST** `http://localhost:4001/email/send-otp`
```json
{
  "email": "demo@complymitra.in"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to email",
  "expiresIn": 300,
  "devOtp": "654321"
}
```

### Step 2: Verify OTP
**POST** `http://localhost:4001/email/verify`
```json
{
  "email": "demo@complymitra.in",
  "otp": "654321"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "email": "demo@complymitra.in",
    "name": "Demo User",
    "role": "user"
  }
}
```

---

## 🚀 Production Setup (When Ready)

For production, you'll need to configure email sending:

**Edit:** `/root/ankr-compliance/apps/api/src/plugins/auth.ts` (line 101)

**Replace:**
```typescript
// DEV MODE: Log OTP
if (process.env.NODE_ENV === 'development') {
  fastify.log.info({ email, otp }, '📧 OTP sent (dev mode - check logs)');
}
```

**With:**
```typescript
// PRODUCTION: Send actual email
await sendEmail({
  to: email,
  from: 'noreply@complymitra.in',
  subject: 'Your ComplyMitra Login Code',
  html: `
    <h2>Your Login Code</h2>
    <p>Your one-time password is:</p>
    <h1 style="font-size: 48px; letter-spacing: 10px;">${otp}</h1>
    <p>This code expires in 5 minutes.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `
});
```

**Email Providers:**
- SendGrid (recommended)
- Mailgun
- AWS SES
- Postmark

---

## 🔐 Security Features

- ✅ OTP expires in 5 minutes
- ✅ Maximum 3 verification attempts
- ✅ JWT token expires in 1 hour
- ✅ Refresh tokens available
- ✅ Session management
- ✅ No password storage
- ✅ No password resets needed
- ✅ No password complexity rules

---

## 🐛 Troubleshooting

### "OTP not showing in console"
- Check if DevTools Console tab is open
- Look for the API response to `/graphql` with `sendEmailOTP`
- Check Network tab → Preview

### "Invalid OTP"
- OTPs expire after 5 minutes
- Check you copied the correct 6-digit code
- Try requesting a new OTP

### "Can't see OTP in logs"
```bash
# Check if API is running:
pm2 list

# Restart if needed:
pm2 restart ankr-compliance-api

# Watch live logs:
pm2 logs ankr-compliance-api --lines 0
```

### "Login page not showing"
```bash
# Clear browser cache and storage:
# 1. Open DevTools (F12)
# 2. Application tab → Storage → Clear site data
# 3. Refresh page
```

---

## 📊 Quick Reference

| Action | Method |
|--------|--------|
| Test login | Use ANY email + check console for OTP |
| Get OTP | Browser console OR backend logs |
| OTP expires | 5 minutes |
| Token expires | 1 hour |
| Max attempts | 3 |
| Resend OTP | Click "Resend OTP" button |

---

## ✅ Verification Checklist

- [ ] Login page loads at app.complymitra.in
- [ ] Email input accepts any email
- [ ] "Send OTP" button works
- [ ] OTP visible in console/logs
- [ ] OTP input accepts 6 digits
- [ ] "Verify & Sign In" authenticates
- [ ] Dashboard loads after login
- [ ] All routes require authentication

---

**Jai Guru Ji! 🙏**

*No username/password needed - just email + OTP!*
