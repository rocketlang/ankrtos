# 📞 Pratham TeleHub - Plivo Integration Guide

## ✅ What's Been Set Up

Pratham TeleHub now has **full Plivo voice calling integration** - making it a real PBX provider!

### 🎯 Features Integrated

1. **Outbound Calling** - Telecallers can call leads with real phone numbers
2. **Call Recording** - All calls automatically recorded
3. **Call Status Tracking** - Real-time status updates (ringing → in-progress → completed)
4. **Webhook Integration** - Plivo callbacks for call events
5. **Mock Mode** - Works without Plivo credentials for testing

---

## 🚀 Quick Start

### Step 1: Sign Up for Plivo

1. Go to https://console.plivo.com/
2. Create account (free trial available)
3. Get your **Auth ID** and **Auth Token** from dashboard
4. Buy a phone number (India: ~₹500/month for DID)

### Step 2: Configure Credentials

Edit `/root/pratham-telehub-poc/backend/.env`:

```env
# Replace these with your actual Plivo credentials
PLIVO_AUTH_ID=MAMDJMODE2MWNJYZRLYZ          # From Plivo dashboard
PLIVO_AUTH_TOKEN=your_auth_token_here        # From Plivo dashboard
PLIVO_FROM_NUMBER=+919876543210              # Your Plivo phone number
BASE_URL=https://ankr.in/pratham             # Your public URL
```

### Step 3: Set Up Webhooks

In Plivo dashboard, configure these webhook URLs:

**Answer URL:**
```
https://ankr.in/pratham/api/plivo/answer
```

**Hang Up URL / Status Callback:**
```
https://ankr.in/pratham/api/plivo/status/{call_id}
```

**Recording Callback:**
```
https://ankr.in/pratham/api/plivo/recording
```

### Step 4: Restart Backend

```bash
cd /root/pratham-telehub-poc/backend
pkill -f "node.*index.js"
node index.js &
```

---

## 📊 How It Works

### Call Flow

```
1. Telecaller clicks "Call" button in UI
   ↓
2. Frontend → POST /api/calls/start
   ↓
3. Backend creates call record in database
   ↓
4. Backend → Plivo API: makeCall(telecaller_phone, lead_phone)
   ↓
5. Plivo calls telecaller first
   ↓
6. When telecaller picks up → Plivo webhook → /api/plivo/answer
   ↓
7. Answer webhook returns XML to connect to lead
   ↓
8. Plivo bridges the call (telecaller ↔ lead)
   ↓
9. Call happens! 🎉
   ↓
10. Status updates via webhook → /api/plivo/status/{id}
    ↓
11. Recording saved via webhook → /api/plivo/recording
```

### Database Schema

New columns added to `calls` table:

```sql
ALTER TABLE calls ADD COLUMN plivo_call_uuid VARCHAR(255);
ALTER TABLE calls ADD COLUMN recording_url TEXT;
CREATE INDEX idx_calls_plivo_uuid ON calls(plivo_call_uuid);
```

---

## 💰 Pricing

### Plivo Costs (India)

| Item | Cost |
|------|------|
| Phone Number (DID) | ₹500/month |
| Outbound calls | ₹0.35-0.50/min |
| Call recording | ₹0.01/min |
| SMS (bonus) | ₹0.15/SMS |

### Your Selling Price

Sell at: **₹0.80-1.20/min**

**Example Revenue:**
- 10,000 mins/month usage
- Cost: ₹4,000 (₹0.40/min)
- Revenue: ₹10,000 (₹1.00/min)
- **Profit: ₹6,000 (60% margin)**

---

## 🧪 Testing

### Mock Mode (No Plivo Required)

Without credentials, system runs in **mock mode**:
- Calls appear to work in UI
- Status updates happen
- No actual phone calls made
- Perfect for development

### Real Mode (With Plivo)

With credentials configured:
- Real phone calls
- Real recordings
- Real billing

### Test Checklist

```bash
# 1. Test call initiation
curl -X POST http://localhost:3100/api/calls/start \
  -H "Content-Type: application/json" \
  -d '{
    "lead_id": "lead-uuid",
    "telecaller_id": "telecaller-uuid",
    "campaign_id": "campaign-uuid"
  }'

# 2. Check Plivo balance
# (Add endpoint: GET /api/plivo/balance)

# 3. Test webhook
curl -X POST http://localhost:3100/api/plivo/status/call-123 \
  -H "Content-Type: application/json" \
  -d '{
    "CallStatus": "completed",
    "Duration": 180
  }'
```

---

## 📁 Files Modified

### New Files
- `/root/pratham-telehub-poc/backend/services/PlivoService.js` - Plivo API wrapper

### Modified Files
- `/root/pratham-telehub-poc/backend/index.js` - Added Plivo integration
- `/root/pratham-telehub-poc/backend/.env` - Added Plivo credentials
- `/root/pratham-telehub-poc/backend/package.json` - Added `plivo` dependency

### Database Changes
- Added `plivo_call_uuid` column to `calls` table
- Added `recording_url` column to `calls` table

---

## 🔧 API Endpoints

### New Endpoints

#### POST /api/calls/start
Start a new call (now uses real Plivo)

**Request:**
```json
{
  "lead_id": "uuid",
  "telecaller_id": "uuid",
  "campaign_id": "uuid"
}
```

**Response:**
```json
{
  "id": "call-uuid",
  "plivo_call_uuid": "mock-1707...",
  "status": "ringing",
  "plivo_status": "initiated"
}
```

#### POST /api/plivo/answer
Plivo webhook - called when telecaller picks up

**Query Params:**
- `lead=+919876543210`

**Returns:** Plivo XML to connect call

#### POST /api/plivo/status/:callId
Plivo webhook - call status updates

**Body:**
```json
{
  "CallStatus": "completed",
  "Duration": 180
}
```

#### POST /api/plivo/recording
Plivo webhook - recording available

**Body:**
```json
{
  "CallUUID": "plivo-uuid",
  "RecordingURL": "https://...",
  "Duration": "180"
}
```

---

## 🎓 Next Steps

### Immediate
1. ✅ Set up Plivo account
2. ✅ Configure credentials in `.env`
3. ✅ Buy a phone number
4. ✅ Test making a call

### Short Term
1. Add call recording playback in UI
2. Add Plivo balance checker
3. Implement click-to-call widget
4. Add call quality metrics

### Long Term
1. IVR (Interactive Voice Response) menu
2. Call queuing for busy agents
3. Call transfer between agents
4. Conference calling
5. Voicemail detection

---

## 🚨 Troubleshooting

### "Mock mode" message in logs
✅ Normal when credentials not configured
🔧 Add `PLIVO_AUTH_ID` and `PLIVO_AUTH_TOKEN` to `.env`

### "Failed to initiate call"
❌ Check Plivo credentials
❌ Check phone number format (+91XXXXXXXXXX)
❌ Check Plivo account balance

### Webhooks not working
❌ Ensure `BASE_URL` is publicly accessible
❌ Check nginx is forwarding to backend
❌ Verify webhook URLs in Plivo dashboard

### Database error on call start
❌ Run the ALTER TABLE commands to add Plivo columns
❌ Check database connection in `.env`

---

## 📞 Support

**Plivo Documentation:** https://www.plivo.com/docs/
**Plivo Console:** https://console.plivo.com/
**Support:** support@plivo.com

---

## ✨ Congratulations!

You now have a **real PBX provider** powered by Plivo! 🎉

**Cost:** ~₹0.40/min
**Sell at:** ₹1.00/min
**Margin:** 60%

Start making money with telecalling! 💰
