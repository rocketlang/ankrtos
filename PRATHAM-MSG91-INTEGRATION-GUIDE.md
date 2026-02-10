# 📱 Pratham TeleHub - MSG91 Integration Guide

## 🎯 What MSG91 Provides

MSG91 **complements** Plivo by adding **multi-channel communication** beyond voice calls:

### MSG91 Services in Pratham TeleHub:

| Service | Use Case | Pricing |
|---------|----------|---------|
| **SMS** | Send OTP, notifications, follow-ups | ₹0.15-0.25/SMS |
| **WhatsApp** | Rich messaging, templates, automated responses | ₹0.35/message |
| **OBD (Outbound Dialing)** | Automated voice campaigns (pre-recorded) | ₹0.20-0.30/min |
| **Click-to-Call** | Bridge calling (backup for Plivo) | ₹0.30-0.40/min |
| **Bulk Campaigns** | Send 1000s of SMS/OBD messages | Same rates |

---

## 🔄 Plivo vs MSG91 - When to Use What

### **Use Plivo For:**
✅ **Live telecalling** - Agent talking to customer
✅ **Call recording** for quality assurance
✅ **Real-time conversations**
✅ **Inbound calls** (if needed)

**Example:** Telecaller calling a lead to pitch Pratham

---

### **Use MSG91 For:**
✅ **SMS notifications** - "Your demo is scheduled for tomorrow"
✅ **WhatsApp messaging** - Rich media, templates, automated flows
✅ **OBD campaigns** - Play pre-recorded message to 1000s of leads
✅ **Follow-ups** - Automated SMS after call ends
✅ **OTP verification** - Secure login/verification

**Example:** Send WhatsApp message with pricing brochure after call

---

## 📊 Complete Communication Workflow

Here's how Plivo + MSG91 work together in Pratham TeleHub:

```
1. Lead enters system
   ↓
2. SMS via MSG91: "Hi! We'll call you soon about Pratham"
   ↓
3. Telecaller makes call via Plivo (live conversation)
   ↓
4. Call ends → Auto-send WhatsApp via MSG91 with:
   - Product brochure
   - Pricing sheet
   - Next steps
   ↓
5. If interested → SMS via MSG91: "Your demo is scheduled"
   ↓
6. If not interested → OBD campaign later via MSG91
```

---

## 🚀 Quick Start

### Step 1: Sign Up for MSG91

1. Go to https://control.msg91.com/
2. Create account (free trial: ₹50 credit)
3. Get **Auth Key** from dashboard
4. Configure sender ID (6 chars max, e.g., "TELEHB")

### Step 2: Configure Credentials

Edit `/root/pratham-telehub-poc/backend/.env`:

```env
# MSG91 Configuration
MSG91_AUTH_KEY=your_auth_key_here          # From MSG91 dashboard
MSG91_SENDER_ID=TELEHB                      # 6 chars max
MSG91_WA_NUMBER=your_whatsapp_number        # WhatsApp Business number
MSG91_CALLER_ID=your_caller_id              # For voice calls
```

### Step 3: Restart Backend

```bash
cd /root/pratham-telehub-poc/backend
pkill -f "node.*index.js"
node index.js &
```

---

## 📡 API Endpoints

### 1. Send SMS

```bash
POST /api/msg91/sms

{
  "to": "919876543210",
  "message": "Hi! Your demo is scheduled for 3 PM tomorrow.",
  "lead_id": "lead-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message_id": "msg91-123456",
  "to": "919876543210",
  "provider": "msg91",
  "type": "sms"
}
```

---

### 2. Send WhatsApp Message

```bash
POST /api/msg91/whatsapp

{
  "to": "919876543210",
  "templateName": "pratham_demo_scheduled",
  "components": [
    {
      "type": "body",
      "parameters": [
        { "type": "text", "text": "John Doe" },
        { "type": "text", "text": "3 PM tomorrow" }
      ]
    }
  ],
  "lead_id": "lead-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message_id": "wa-msg91-123",
  "to": "919876543210",
  "provider": "msg91",
  "type": "whatsapp"
}
```

---

### 3. Send OBD Call (Automated Message)

```bash
POST /api/msg91/obd

{
  "to": "919876543210",
  "audioUrl": "https://yourdomain.com/audio/demo-invite.mp3",
  "lead_id": "lead-uuid"
}
```

**Use Case:** Play pre-recorded message to 100 leads announcing new feature

---

### 4. Click-to-Call (Backup for Plivo)

```bash
POST /api/msg91/click-to-call

{
  "from": "919876543210",  // Telecaller
  "to": "919123456789",    // Lead
  "lead_id": "lead-uuid",
  "telecaller_id": "user-uuid"
}
```

**How it works:**
1. MSG91 calls telecaller first
2. When telecaller picks up → connects to lead
3. Both are now on call (bridge)

---

### 5. Bulk SMS Campaign

```bash
POST /api/msg91/campaign/sms

{
  "recipients": [
    "919876543210",
    "919123456789",
    "919555555555"
  ],
  "message": "Pratham TeleHub - New AI features launched! Book a demo: https://ankr.in",
  "campaign_name": "Q1 Product Launch"
}
```

**Cost Example:**
- 1000 recipients × ₹0.20/SMS = **₹200**

---

### 6. Bulk OBD Campaign

```bash
POST /api/msg91/campaign/obd

{
  "recipients": [
    "919876543210",
    "919123456789"
  ],
  "audioUrl": "https://yourdomain.com/audio/survey.mp3",
  "campaign_name": "Customer Satisfaction Survey"
}
```

**Use Case:** Customer feedback survey to 500 recent customers

---

### 7. Check MSG91 Balance

```bash
GET /api/msg91/balance
```

**Response:**
```json
{
  "balance": 1250.50,
  "currency": "INR",
  "sms_balance": 800,
  "voice_balance": 450.50
}
```

---

## 💡 Smart Automation Examples

### Example 1: Auto-Follow-Up After Call

```javascript
// In /api/calls/:id/update endpoint
if (status === 'completed' && outcome === 'interested') {
  // Send WhatsApp with brochure
  await msg91Service.sendWhatsApp(
    lead.phone,
    null,
    {
      templateName: 'pratham_brochure',
      components: [
        {
          type: 'header',
          parameters: [
            {
              type: 'document',
              document: {
                link: 'https://ankr.in/pratham-brochure.pdf'
              }
            }
          ]
        }
      ]
    }
  );
}
```

### Example 2: Send SMS Before Call

```javascript
// In /api/calls/start endpoint (before Plivo call)
await msg91Service.sendSMS(
  lead.phone,
  `Hi ${lead.name}, our telecaller will call you in 2 minutes regarding Pratham. Please stay available!`
);
```

### Example 3: Daily Digest to Manager

```javascript
// Cron job: Daily at 6 PM
const stats = await getTeamStats();
await msg91Service.sendWhatsApp(
  manager.phone,
  null,
  {
    templateName: 'daily_digest',
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: stats.calls_today },
          { type: 'text', text: stats.conversions },
          { type: 'text', text: stats.avg_call_time }
        ]
      }
    ]
  }
);
```

---

## 🎓 Advanced Features

### 1. WhatsApp Templates

Create templates in MSG91 dashboard:

**Template Name:** `pratham_demo_scheduled`
**Content:**
```
Hi {{1}}!

Your Pratham demo is scheduled for {{2}}.

🎯 What to expect:
- Live AI tutor demonstration
- Personalized learning paths
- 14-day free trial

See you soon!
```

### 2. IVR for OBD

Create interactive voice menu:

```javascript
await msg91Service.makeOBDCall(
  lead.phone,
  'https://yourdomain.com/ivr-menu.xml',
  {
    record: true
  }
);
```

**ivr-menu.xml:**
```xml
<Response>
  <Say>Welcome to Pratham. Press 1 to book a demo. Press 2 to speak to sales.</Say>
  <GetDigits numDigits="1" action="/ivr-response" />
</Response>
```

### 3. Bulk Upload via CSV

```javascript
const csv = require('csv-parser');
const fs = require('fs');

const recipients = [];
fs.createReadStream('leads.csv')
  .pipe(csv())
  .on('data', (row) => recipients.push(row.phone))
  .on('end', async () => {
    await msg91Service.sendBulkSMS(
      recipients,
      'Pratham TeleHub - Book your free demo today!'
    );
  });
```

---

## 💰 Cost Comparison

### Scenario: 1000 Leads in a Month

| Channel | Use Case | Quantity | Cost/Unit | Total |
|---------|----------|----------|-----------|-------|
| **Plivo** | Live calling (avg 5 min) | 500 calls | ₹2.00 | ₹1,000 |
| **MSG91 SMS** | Pre-call notification | 500 SMS | ₹0.20 | ₹100 |
| **MSG91 WhatsApp** | Post-call brochure | 300 msgs | ₹0.35 | ₹105 |
| **MSG91 OBD** | Follow-up campaign | 200 calls | ₹0.50 | ₹100 |
| **TOTAL** | | | | **₹1,305** |

**Revenue:** 50 conversions × ₹10,000 = **₹5,00,000**
**ROI:** 383x 🚀

---

## 🔧 Mock Mode (Testing)

Without credentials, both services run in **mock mode**:

- API calls succeed
- No actual SMS/calls sent
- Perfect for development
- No billing

**To enable real mode:** Add credentials to `.env` file

---

## 🚨 Troubleshooting

### "Mock mode" message in logs
✅ Normal when credentials not configured
🔧 Add `MSG91_AUTH_KEY` to `.env`

### SMS not delivered
❌ Check phone number format (919876543210, no + or -)
❌ Verify sender ID is approved by MSG91
❌ Check MSG91 account balance

### WhatsApp messages failing
❌ Ensure template is approved in MSG91 dashboard
❌ Verify WhatsApp Business number is configured
❌ Check template variable names match

### OBD not working
❌ Audio file must be publicly accessible URL
❌ Format: MP3 or WAV, max 2MB
❌ Check caller ID is configured

---

## 📊 Best Practices

### 1. **Use Right Channel for Right Message**

| Channel | Best For | Avoid For |
|---------|----------|-----------|
| **Plivo Voice** | Urgent discussions, complex sales | Simple notifications |
| **MSG91 SMS** | OTP, reminders, confirmations | Long messages, media |
| **MSG91 WhatsApp** | Rich content, brochures, FAQs | Spam, too frequent |
| **MSG91 OBD** | Mass announcements, surveys | Individual conversations |

### 2. **Timing Matters**

- SMS: Anytime (instant delivery)
- Voice calls: 10 AM - 7 PM
- WhatsApp: 9 AM - 9 PM (respect Do Not Disturb)
- OBD: 11 AM - 6 PM only

### 3. **Compliance**

- Get consent before SMS/WhatsApp
- Honor DND (Do Not Disturb) registry
- Provide opt-out option
- Follow TRAI regulations

---

## 🎯 Next Steps

### Immediate
1. ✅ Sign up for MSG91
2. ✅ Configure credentials
3. ✅ Test SMS sending
4. ✅ Test WhatsApp templates

### Short Term
1. Create WhatsApp templates for common scenarios
2. Set up auto-follow-up workflows
3. Design OBD campaigns for cold leads
4. Build SMS notification system

### Long Term
1. A/B test messaging templates
2. Build analytics dashboard for multi-channel
3. Integrate with CRM for automated journeys
4. Set up chatbot on WhatsApp

---

## 📞 Support

**MSG91 Documentation:** https://docs.msg91.com/
**MSG91 Console:** https://control.msg91.com/
**Support:** support@msg91.com

---

## ✨ Summary

**Plivo + MSG91 = Complete Communication Platform**

- **Plivo:** Real voice calling (₹0.40/min)
- **MSG91:** SMS (₹0.20), WhatsApp (₹0.35), OBD (₹0.30/min)

**Total Cost:** ~₹1.00-1.50 per lead engagement
**Sell at:** ₹5-10 per lead
**Margin:** 70-85% 💰

You're now a **full-stack communication provider**! 🎉
