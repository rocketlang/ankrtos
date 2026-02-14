# 🔐 ComplyMitra Demo Login - SIMPLE GUIDE

## 🚀 NEW: Instant Demo Login (No OTP!)

**EASIEST WAY:**
```bash
curl -X POST http://localhost:4001/auth/demo-login -H "Content-Type: application/json" -d '{}'
```
Get instant access token - no OTP needed!

---

## TL;DR - Quick Demo

**There is NO demo username/password!**
ComplyMitra uses **passwordless OTP authentication**.

---

## 🎯 Easiest Way to Test Login

### ⚡ Method 1: Demo Accounts (Fixed OTP)

**Use these emails with OTP: 123456**
- `demo@complymitra.in` → OTP: **123456**
- `test@complymitra.in` → OTP: **123456**
- `admin@complymitra.in` → OTP: **123456**

**No need to check logs - OTP is always 123456!**

### 📧 Method 2: Any Email (Random OTP)

### Step 1: Open the Login Page
Visit: **https://app.complymitra.in**

You'll see a clean login page asking for email.

### Step 2: Enter ANY Email
Type any email address, for example:
- `demo@test.com`
- `admin@example.com`
- `your@email.com`

**It doesn't matter what email you use in development mode!**

### Step 3: Get the OTP

**METHOD 1: Browser Console (Recommended)**
1. Before clicking "Send OTP", press **F12** to open DevTools
2. Click on **Console** tab
3. Now click **"Send OTP"** button
4. Look in the console - you'll see the API response
5. Find the **6-digit OTP code** in the response

**METHOD 2: Backend Logs**
Open a terminal and run:
```bash
pm2 logs ankr-compliance-api --lines 0
```
Then send OTP from browser - the code will appear in the logs.

### Step 4: Enter OTP
- Copy the 6-digit code
- Paste it in the OTP field
- Click **"Verify & Sign In"**

### Step 5: You're In! ✅
You'll be redirected to the dashboard.

---

## 📸 Visual Guide

```
┌─────────────────────────────────────┐
│  Sign in to ComplyMitra             │
│                                     │
│  Enter your email to receive a      │
│  one-time password                  │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ you@example.com              │   │
│  └─────────────────────────────┘   │
│                                     │
│  [    Send OTP    ]                 │
│                                     │
└─────────────────────────────────────┘

         ↓ (Check Console/Logs for OTP)

┌─────────────────────────────────────┐
│  Enter OTP                          │
│                                     │
│  We've sent a 6-digit code to       │
│  you@example.com                    │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   1  2  3  4  5  6           │   │
│  └─────────────────────────────┘   │
│                                     │
│  [  Verify & Sign In  ]             │
│                                     │
│  ← Change email    Resend OTP       │
└─────────────────────────────────────┘

         ↓ (Authenticated!)

┌─────────────────────────────────────┐
│  Dashboard                          │
│  Welcome to ComplyMitra!            │
│  ...                                │
└─────────────────────────────────────┘
```

---

## 🎮 Try It Right Now

1. **Open two windows:**
   - Window 1: https://app.complymitra.in
   - Window 2: Terminal with `pm2 logs ankr-compliance-api --lines 0`

2. **In Window 1:**
   - Enter email: `demo@complymitra.in`
   - Click "Send OTP"

3. **In Window 2:**
   - You'll see a log like: `📧 OTP sent (dev mode - check logs)`
   - The OTP will be displayed: `otp: "123456"`

4. **Back to Window 1:**
   - Enter the OTP: `123456`
   - Click "Verify & Sign In"

5. **✅ Done!** You're logged in!

---

## ❓ FAQ

### Q: What's the demo username?
**A:** There is no username! Use any email address.

### Q: What's the demo password?
**A:** There is no password! The system sends a one-time code (OTP).

### Q: Which email should I use?
**A:** Any email works in development mode. Try:
- `demo@complymitra.in`
- `test@example.com`
- `admin@test.com`

### Q: Where do I get the OTP?
**A:** In development mode, the OTP appears in:
1. **Browser Console** (F12 → Console tab)
2. **Backend logs** (`pm2 logs ankr-compliance-api`)
3. **Network tab** (F12 → Network → Look for GraphQL response)

### Q: OTP not working?
**A:**
- OTPs expire after 5 minutes
- You have 3 attempts max
- Request a new OTP using "Resend OTP" button

### Q: Can I use a real email?
**A:** Yes! But in development mode, the OTP is only logged, not actually emailed.

### Q: For production, how will this work?
**A:** Configure an email provider (SendGrid/Mailgun), and OTPs will be sent to real emails.

---

## 🔧 Troubleshooting

### Can't see login page?
```bash
# Clear browser cache
# F12 → Application → Storage → Clear site data
# Then refresh
```

### Backend not running?
```bash
pm2 list  # Check if ankr-compliance-api is online
pm2 restart ankr-compliance-api  # Restart if needed
```

### Still stuck?
```bash
# Run all tests
node /root/final-verification-test.js

# Check detailed logs
pm2 logs ankr-compliance-api --lines 100
```

---

## 📝 Summary

| What | Answer |
|------|--------|
| Demo Email | Any email (e.g., `demo@test.com`) |
| Demo Password | No password! Uses OTP |
| Get OTP | Browser console or backend logs |
| OTP Expires | 5 minutes |
| Login URL | https://app.complymitra.in |

---

**No username, no password - just email + OTP! 🚀**

**Jai Guru Ji! 🙏**
