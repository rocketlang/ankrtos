# 🔑 Get Your Free Deepgram API Key

**5-Minute Setup for Professional Voice AI**

---

## 🎯 Quick Start

### Step 1: Sign Up (2 minutes)

**Visit:** https://console.deepgram.com/signup

**What you'll need:**
- Email address
- Password
- Company name (can be personal/project name)

**What you'll get:**
- ✅ $200 free credits (no credit card required!)
- ✅ 16,000+ minutes of transcription
- ✅ Access to Nova-2 model (best accuracy)
- ✅ 5,333+ doctor bookings FREE

---

## 📝 Step-by-Step Process

### 1. Create Account

```
1. Open: https://console.deepgram.com/signup
2. Enter email: your-email@example.com
3. Create password: (strong password)
4. Company name: "ANKR Labs" or "Personal Project"
5. Click "Sign Up"
6. Verify email (check inbox)
```

### 2. Navigate to API Keys

After email verification:

```
1. Login: https://console.deepgram.com/login
2. Click "API Keys" in left sidebar
   OR go directly to: https://console.deepgram.com/project/keys
3. Click "+ Create a New API Key"
```

### 3. Create API Key

```
1. Key Name: "Doctor Booking Demo"
2. Permissions: Leave default (all permissions)
3. Expiration: Never (or set custom)
4. Click "Create Key"
```

### 4. Copy API Key

**IMPORTANT:** Copy the key NOW - you won't see it again!

```
Format: abc123def456ghi789jkl012mno345pqr678stu901vwx234
Length: ~40 characters
Starts with: Random letters/numbers
```

**Save it somewhere safe:**
- Password manager
- Secure note
- Temporary file (we'll add to .env next)

---

## ⚡ Quick Setup Commands

### Option 1: Automated (Recommended)

```bash
# Run this after you get your API key
cd /root/doctor-booking-demo

# Replace YOUR_KEY_HERE with actual key
export DEEPGRAM_KEY="YOUR_ACTUAL_API_KEY_HERE"

# Add to .env file
echo "DEEPGRAM_API_KEY=$DEEPGRAM_KEY" >> .env

# Restart server
lsof -ti:3299 | xargs kill -9
cd backend
PORT=3299 node server-deepgram.js &

# Check it worked
sleep 3
curl -s http://localhost:3299/health | grep -i deepgram
```

### Option 2: Manual

```bash
cd /root/doctor-booking-demo
nano .env
```

Add this line (replace with your actual key):
```
DEEPGRAM_API_KEY=abc123def456ghi789jkl012mno345pqr678stu901vwx234
```

Save: Ctrl+X, Y, Enter

Restart server:
```bash
lsof -ti:3299 | xargs kill -9
cd backend
PORT=3299 node server-deepgram.js
```

---

## ✅ Verify It's Working

### Test 1: Health Check

```bash
curl http://localhost:3299/health | jq '.'
```

**Look for:**
```json
{
  "features": {
    "stt": "Deepgram Nova-2 (95%+ accuracy)",
    "tts": "Deepgram Aura + Browser fallback"
  }
}
```

### Test 2: Web Interface

```
1. Open: http://localhost:3299
2. Look for: "Powered by Deepgram Nova-2"
3. Look for: "95% Accuracy" badge
4. Click microphone button
5. Speak in Hindi
6. See accurate transcription!
```

### Test 3: Check Logs

```bash
tail -f /tmp/doctor-demo-deepgram.log | grep -i deepgram
```

**Should see:**
```
✅ Deepgram initialized
✅ Deepgram connection opened
📝 Deepgram transcript: मुझे त्वचा में खुजली है
```

---

## 🎯 What You Get Free

### $200 Credits Breakdown

```
Speech-to-Text (STT):
- Cost: $0.0125 per minute
- Your credits: $200
- Minutes: 16,000
- Hours: 266
- Doctor bookings (3 min avg): 5,333

Text-to-Speech (TTS):
- Cost: $0.015 per 1,000 characters
- Your credits: Can cover ~13 million characters
- Or use Edge TTS (FREE unlimited)

Total value: 5,000+ bookings FREE!
```

### When Free Tier Expires

**You'll be notified:**
- Email alert at 50% usage
- Email alert at 80% usage
- Email alert at 95% usage
- Dashboard shows real-time usage

**Options:**
1. Add credit card for pay-as-you-go
2. Switch to monthly plan ($X/month for Y minutes)
3. Continue with browser API fallback (FREE forever)

---

## 🔐 Security Best Practices

### 1. Keep API Key Secret

**DO:**
- ✅ Store in .env file (not committed to git)
- ✅ Use environment variables
- ✅ Keep in password manager
- ✅ Rotate keys periodically

**DON'T:**
- ❌ Commit to GitHub
- ❌ Share in public
- ❌ Hardcode in source files
- ❌ Send via email/Slack

### 2. Use Project Keys

```
Production: One API key
Development: Different API key
Testing: Different API key
```

**Why:** Isolate usage, easier to track costs, revoke if compromised

### 3. Set Up Alerts

```
1. Go to: https://console.deepgram.com/settings
2. Click "Notifications"
3. Add email for alerts:
   - Daily usage > $10
   - Weekly usage > $50
   - Monthly usage > $100
```

---

## 🐛 Troubleshooting

### Error: "Invalid API key"

**Check:**
```bash
# Is key set?
cat .env | grep DEEPGRAM_API_KEY

# Is key correct format? (should be ~40 chars)
echo $DEEPGRAM_API_KEY | wc -c
```

**Fix:**
1. Copy key again from: https://console.deepgram.com/project/keys
2. Update .env file
3. Restart server

### Error: "API key expired"

**Fix:**
1. Go to: https://console.deepgram.com/project/keys
2. Check expiration date
3. Create new key if needed
4. Update .env
5. Restart server

### Error: "Insufficient credits"

**Check usage:**
```
https://console.deepgram.com/usage
```

**Options:**
1. Add credit card for pay-as-you-go
2. Upgrade to paid plan
3. Use browser API fallback

---

## 📊 Monitor Your Usage

### Deepgram Dashboard

**URL:** https://console.deepgram.com/usage

**Metrics Available:**
- Minutes used today/week/month
- Cost breakdown by feature (STT, TTS)
- API calls by endpoint
- Error rate
- Average latency

**Export:**
- CSV download
- API access
- Webhooks

### Custom Monitoring

Add to your app:
```javascript
// Track usage in your database
await pool.query(
  'INSERT INTO deepgram_usage (session_id, minutes, cost) VALUES ($1, $2, $3)',
  [sessionId, duration, cost]
);

// Daily summary
SELECT
  DATE(created_at) as date,
  SUM(minutes) as total_minutes,
  SUM(cost) as total_cost
FROM deepgram_usage
GROUP BY DATE(created_at);
```

---

## 💡 Tips & Tricks

### 1. Optimize Costs

**Use browser API for:**
- Internal testing
- Development
- Low-accuracy needs

**Use Deepgram for:**
- Production
- Customer-facing
- Critical transcription

### 2. Custom Vocabulary

Add hospital names, medical terms:
```javascript
{
  keywords: [
    'Apollo Hospital:5',
    'Fortis Hospital:5',
    'dermatologist:5',
    'त्वचा विशेषज्ञ:5'
  ]
}
```

**Benefit:** 98%+ accuracy for specific terms

### 3. Language Detection

Auto-detect Hindi/English:
```javascript
{
  language: 'hi',
  detect_language: true
}
```

**Use case:** Hinglish speakers (mix Hindi + English)

---

## 🚀 Ready to Test!

### After Adding API Key

**Test Immediately:**
```bash
# 1. Check health
curl http://localhost:3299/health | jq '.features'

# 2. Open web interface
# http://localhost:3299

# 3. Click microphone
# Speak: "मुझे त्वचा में खुजली है"

# 4. Watch magic happen!
# 95%+ accuracy transcription
```

**Expected Results:**
- ✅ Accurate Hindi transcription
- ✅ Fast response (~300ms)
- ✅ Works on all browsers
- ✅ Professional quality

---

## 📞 Need Help?

### Deepgram Support

- **Docs:** https://developers.deepgram.com/docs
- **Community:** https://community.deepgram.com/
- **Support:** support@deepgram.com
- **Status:** https://status.deepgram.com/

### Common Issues

**Problem:** Key not working
**Solution:** Check format, regenerate key

**Problem:** Usage not showing
**Solution:** Wait 5-10 minutes for dashboard update

**Problem:** Poor quality
**Solution:** Check microphone, use Nova-2 model

---

## 🎉 You're All Set!

**Checklist:**
- [ ] Signed up at https://console.deepgram.com/signup
- [ ] Created API key
- [ ] Added to .env file
- [ ] Restarted server
- [ ] Tested voice input
- [ ] Verified 95%+ accuracy!

**Next:** Start booking appointments with professional voice AI!

---

**Get started now: https://console.deepgram.com/signup**
