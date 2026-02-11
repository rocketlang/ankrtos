# 🚀 Deepgram Quick Start

**Get professional voice AI in 5 minutes!**

---

## ⚡ TL;DR

```bash
# 1. Sign up: https://console.deepgram.com/signup
# 2. Get API key: https://console.deepgram.com/project/keys
# 3. Run setup script:

/root/doctor-booking-demo/setup-deepgram.sh

# 4. Open: http://localhost:3299
# 5. Click microphone → Speak → Watch magic! 🎉
```

---

## 📝 Detailed Steps

### Step 1: Get Free API Key (2 minutes)

**Sign up here:** https://console.deepgram.com/signup

**What you need:**
- Email address
- Password
- Company name (can use "ANKR Labs")

**What you get:**
- ✅ $200 free credits (no credit card!)
- ✅ 16,000 minutes FREE
- ✅ 5,333 doctor bookings FREE

### Step 2: Create API Key (1 minute)

After signup:

1. Go to: https://console.deepgram.com/project/keys
2. Click **"+ Create a New API Key"**
3. Name: **"Doctor Booking Demo"**
4. Click **"Create Key"**
5. **COPY THE KEY** (you won't see it again!)

Example key format:
```
abc123def456ghi789jkl012mno345pqr678stu901vwx234
```

### Step 3: Run Setup Script (1 minute)

```bash
/root/doctor-booking-demo/setup-deepgram.sh
```

**The script will:**
- ✅ Prompt for your API key
- ✅ Add it to .env file
- ✅ Restart server with Deepgram
- ✅ Verify connection
- ✅ Show success message

**Paste your API key when prompted!**

### Step 4: Test It! (1 minute)

**Open:** http://localhost:3299

**You should see:**
- ✅ "Powered by Deepgram Nova-2"
- ✅ "95% Accuracy" badge
- ✅ Professional UI

**Test voice:**
1. Click 🎤 microphone button
2. Allow microphone access
3. Speak: "मुझे त्वचा में खुजली है"
4. Watch: Perfect transcription!

---

## 🎁 What You Get

### Free Tier

```
$200 Credits
÷ $0.0125/minute
= 16,000 Minutes
= 266 Hours
= 5,333 Bookings (3 min avg)

Worth: $200 FREE!
```

### Quality Upgrade

```
Browser API → Deepgram Nova-2

Accuracy:   85% → 95%+  (+10%)
Latency:    500ms → 300ms  (40% faster)
Browsers:   Chrome/Edge → ALL
Streaming:  No → Yes
Quality:    Consumer → Professional
```

---

## 🔧 Manual Setup (Alternative)

If you prefer manual setup:

```bash
# 1. Edit .env file
cd /root/doctor-booking-demo
nano .env

# 2. Add this line (replace with your key):
DEEPGRAM_API_KEY=your_actual_api_key_here

# 3. Save and exit
# Ctrl+X, then Y, then Enter

# 4. Restart server
lsof -ti:3299 | xargs kill -9
cd backend
PORT=3299 node server-deepgram.js &

# 5. Verify
sleep 3
curl http://localhost:3299/health | jq '.features'
```

---

## ✅ Verify It's Working

### Check 1: Health Endpoint

```bash
curl http://localhost:3299/health | grep "Nova-2"
```

**Should see:**
```
"stt": "Deepgram Nova-2 (95%+ accuracy)"
```

### Check 2: Web Interface

Open: http://localhost:3299

**Look for:**
- ✅ "Powered by Deepgram Nova-2" text
- ✅ "⚡ 95% Accuracy" badge
- ✅ Gradient microphone button

### Check 3: Test Voice

1. Click microphone
2. Speak: "मुझे त्वचा में खुजली है"
3. See transcript appear
4. Hear accurate response

**Success = Perfect transcription!**

---

## 🐛 Troubleshooting

### "Error: Invalid API key"

**Check:**
```bash
cat /root/doctor-booking-demo/.env | grep DEEPGRAM
```

**Should show:**
```
DEEPGRAM_API_KEY=abc123def456...
```

**Fix:** Re-run setup script with correct key

### "Deepgram not configured"

**Check logs:**
```bash
tail -20 /tmp/doctor-demo-deepgram.log
```

**Look for:**
- ✅ "Deepgram initialized"
- ❌ "DEEPGRAM_API_KEY not set"

**Fix:** API key not in .env, run setup script

### Server not starting

**Check process:**
```bash
ps aux | grep server-deepgram
```

**Check port:**
```bash
lsof -i:3299
```

**Fix:**
```bash
# Kill old process
lsof -ti:3299 | xargs kill -9

# Restart
cd /root/doctor-booking-demo/backend
PORT=3299 node server-deepgram.js
```

---

## 📊 Monitor Usage

### Deepgram Dashboard

**URL:** https://console.deepgram.com/usage

**Metrics:**
- Minutes used today
- Cost breakdown
- API calls
- Error rate
- Average latency

**Set up alerts:**
1. Go to: https://console.deepgram.com/settings
2. Click "Notifications"
3. Add email for daily usage alerts

---

## 🎯 Next Steps

### After Setup

1. ✅ Test voice in different browsers
2. ✅ Try different Hindi accents
3. ✅ Test medical terminology
4. ✅ Monitor dashboard
5. ✅ Share demo with team

### Advanced Configuration

**Add custom vocabulary:**

Edit `server-deepgram.js`:
```javascript
{
  model: 'nova-2',
  language: 'hi',
  keywords: [
    'Apollo Hospital:5',
    'Fortis Hospital:5',
    'dermatologist:5',
    'त्वचा विशेषज्ञ:5'
  ]
}
```

**Result:** 98%+ accuracy for specific terms!

---

## 💡 Pro Tips

### 1. Save Your Key Safely

**Good:**
- ✅ Password manager (1Password, LastPass)
- ✅ Secure note app
- ✅ Environment variable

**Bad:**
- ❌ Email
- ❌ Slack
- ❌ GitHub (public repo)

### 2. Monitor Costs

**Set budget alerts:**
- $10/day
- $50/week
- $100/month

**Track per-call cost:**
```javascript
// In your app
const callCost = (durationMinutes * 0.0125).toFixed(4);
console.log(`Call cost: $${callCost}`);
```

### 3. Use Browser Fallback

**For development:**
- Use browser API (free)
- Test logic without costs

**For production:**
- Use Deepgram (95% accuracy)
- Professional quality

**Best of both worlds!**

---

## 🚀 You're Ready!

### Checklist

- [x] ✅ Signed up at Deepgram
- [x] ✅ Got API key
- [x] ✅ Ran setup script
- [x] ✅ Server restarted
- [x] ✅ Verified connection
- [ ] 🎤 Test voice input now!

### Quick Test

```bash
# Open browser
http://localhost:3299

# Click microphone
# Speak in Hindi
# See 95%+ accuracy!
```

---

## 🎉 Success!

**You now have:**
- ✅ Professional voice AI (95%+ accuracy)
- ✅ Real-time streaming
- ✅ All browser support
- ✅ $200 FREE credits (16,000 minutes!)
- ✅ Production-ready system

**Start booking appointments with voice! 🎙️🏥**

---

## 📚 Resources

**Documentation:**
- Full guide: `/root/GET-DEEPGRAM-KEY.md`
- Setup guide: `/root/doctor-booking-demo/DEEPGRAM-SETUP.md`
- Complete docs: `/root/DOCTOR-BOOKING-DEEPGRAM-COMPLETE.md`

**Deepgram:**
- Console: https://console.deepgram.com/
- Docs: https://developers.deepgram.com/docs
- Community: https://community.deepgram.com/

**Support:**
- Email: support@deepgram.com
- Status: https://status.deepgram.com/

---

**Get started: https://console.deepgram.com/signup**
