# ANKR TeleHub - Generic Telephony Platform

**Date:** February 14, 2026
**Status:** PLANNING
**Purpose:** Multi-provider telephony platform for voice, SMS, and WhatsApp

---

## 🎯 Vision

A **generic TeleHub** that can power:
- Educational voice delivery (like Pratham)
- Customer support IVR systems
- Marketing campaigns
- SMS/WhatsApp automation
- Any voice/messaging use case

---

## 🏗️ Architecture

### Multi-Provider Strategy

```
┌─────────────────────────────────────┐
│      ANKR TeleHub API               │
│  (Provider-Agnostic Interface)      │
└──────────┬──────────────────────────┘
           │
    ┌──────┴──────┬─────────┬─────────┐
    │             │         │         │
┌───▼───┐   ┌────▼────┐ ┌──▼──┐  ┌───▼────┐
│ MSG91 │   │ Twilio  │ │Plivo│  │ Future │
└───────┘   └─────────┘ └─────┘  └────────┘
```

### Core Components

1. **Provider Abstraction Layer**
   - Unified API across all providers
   - Automatic failover if one provider fails
   - Cost optimization (route to cheapest)

2. **Campaign Manager**
   - Schedule voice/SMS campaigns
   - Track delivery status
   - A/B testing support

3. **IVR Builder**
   - Visual flow designer
   - DTMF handling
   - Voice recording/TTS

4. **Analytics Dashboard**
   - Call duration, costs
   - Delivery rates
   - User engagement metrics

---

## 📦 Package Structure

```
packages/ankr-telehub/
├── src/
│   ├── server/
│   │   ├── index.ts              # Main server
│   │   ├── providers/
│   │   │   ├── base.ts           # Abstract provider
│   │   │   ├── msg91.ts          # MSG91 implementation
│   │   │   ├── twilio.ts         # Twilio implementation
│   │   │   ├── plivo.ts          # Plivo implementation
│   │   │   └── manager.ts        # Multi-provider routing
│   │   ├── routes/
│   │   │   ├── voice.ts          # Voice call endpoints
│   │   │   ├── sms.ts            # SMS endpoints
│   │   │   ├── whatsapp.ts       # WhatsApp endpoints
│   │   │   └── campaigns.ts      # Campaign management
│   │   ├── models/
│   │   │   ├── call.ts           # Call records
│   │   │   ├── message.ts        # SMS/WhatsApp messages
│   │   │   └── campaign.ts       # Campaign data
│   │   └── services/
│   │       ├── ivr.ts            # IVR flow engine
│   │       ├── scheduler.ts      # Campaign scheduler
│   │       └── analytics.ts      # Metrics tracking
│   ├── client/
│   │   ├── dashboard/            # Admin UI
│   │   ├── ivr-builder/          # Visual IVR designer
│   │   └── analytics/            # Reports & charts
│   └── shared/
│       └── types.ts              # Shared TypeScript types
├── prisma/
│   └── schema.prisma             # Database schema
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔌 Provider Integration

### MSG91
**Best for:** India-focused, cost-effective
**Features:**
- Voice OTP
- Transactional SMS
- WhatsApp Business API
- Competitive pricing for India

### Twilio
**Best for:** Global reach, reliability
**Features:**
- Programmable Voice
- SMS/MMS
- WhatsApp Business
- Most mature API

### Plivo
**Best for:** Voice quality, pricing
**Features:**
- Voice API
- SMS API
- Number management
- Good international rates

---

## 🎬 Features

### Phase 1: Foundation (MVP)
- [ ] Provider abstraction layer
- [ ] Basic voice call (outbound)
- [ ] Basic SMS sending
- [ ] Call/SMS logging
- [ ] Simple admin dashboard

### Phase 2: IVR & Automation
- [ ] IVR flow builder
- [ ] DTMF input handling
- [ ] Text-to-Speech (TTS)
- [ ] Voice recording
- [ ] Campaign scheduling

### Phase 3: Multi-Channel
- [ ] WhatsApp integration
- [ ] Multi-provider failover
- [ ] Cost optimization routing
- [ ] A/B testing
- [ ] Advanced analytics

### Phase 4: AI & Intelligence
- [ ] Voice AI (speech recognition)
- [ ] Sentiment analysis
- [ ] Auto-responses
- [ ] Predictive dialing
- [ ] Smart routing

---

## 🔐 API Design

### Unified Interface

```typescript
// Send SMS via any provider
await telehub.sms.send({
  to: '+919876543210',
  message: 'Hello from ANKR!',
  provider: 'auto' // Auto-selects best provider
});

// Make voice call
await telehub.voice.call({
  to: '+919876543210',
  flow: 'education-welcome', // Pre-defined IVR flow
  provider: 'twilio'
});

// Send WhatsApp message
await telehub.whatsapp.send({
  to: '+919876543210',
  template: 'course-reminder',
  params: { name: 'Raj', course: 'Math' }
});
```

### Failover Logic

```typescript
const providerPriority = [
  'msg91',    // Try MSG91 first (cheapest for India)
  'plivo',    // Fallback to Plivo
  'twilio'    // Last resort (most reliable but expensive)
];

// Automatic retry with next provider if one fails
```

---

## 💾 Database Schema

```prisma
model Call {
  id            String   @id @default(cuid())
  to            String
  from          String?
  provider      String   // msg91, twilio, plivo
  status        String   // queued, ringing, answered, completed, failed
  duration      Int?     // seconds
  cost          Float?   // in rupees
  flowId        String?
  recording     String?
  createdAt     DateTime @default(now())
  completedAt   DateTime?
}

model Message {
  id            String   @id @default(cuid())
  to            String
  from          String?
  type          String   // sms, whatsapp
  provider      String
  content       String
  status        String   // sent, delivered, failed
  cost          Float?
  createdAt     DateTime @default(now())
  deliveredAt   DateTime?
}

model Campaign {
  id            String   @id @default(cuid())
  name          String
  type          String   // voice, sms, whatsapp
  recipients    Json     // List of phone numbers
  message       String?
  flowId        String?
  scheduledFor  DateTime
  status        String   // scheduled, running, completed, paused
  stats         Json     // {sent: 100, delivered: 95, failed: 5}
  createdAt     DateTime @default(now())
}

model IVRFlow {
  id            String   @id @default(cuid())
  name          String
  description   String?
  nodes         Json     // Flow definition
  active        Boolean  @default(true)
  createdAt     DateTime @default(now())
}
```

---

## 🚀 Getting Started

### Step 1: Get API Keys

**MSG91:**
1. Visit: https://msg91.com/
2. Sign up
3. Get: Authkey, Sender ID, Route

**Twilio:**
1. Visit: https://www.twilio.com/
2. Sign up for free trial
3. Get: Account SID, Auth Token, Phone Number

**Plivo:**
1. Visit: https://www.plivo.com/
2. Sign up
3. Get: Auth ID, Auth Token

### Step 2: Environment Variables

```bash
# MSG91
MSG91_AUTH_KEY=your_key_here
MSG91_SENDER_ID=ANKRLB
MSG91_ROUTE=4

# Twilio
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890

# Plivo
PLIVO_AUTH_ID=MAxxxx
PLIVO_AUTH_TOKEN=your_token
PLIVO_PHONE_NUMBER=+1234567890
```

### Step 3: Run TeleHub

```bash
cd packages/ankr-telehub
npm install
npm run dev
```

---

## 📊 Use Cases

### 1. Pratham Education Voice Delivery
```typescript
// Daily lesson delivery via voice call
await telehub.campaigns.create({
  name: 'Daily Math Lesson',
  type: 'voice',
  recipients: studentPhoneNumbers,
  flow: 'math-lesson-intro',
  schedule: 'daily 9:00 AM IST'
});
```

### 2. Customer Support IVR
```typescript
// Build IVR flow
const supportFlow = await telehub.ivr.create({
  name: 'Customer Support',
  nodes: [
    { type: 'greeting', audio: 'welcome.mp3' },
    { type: 'menu', options: [
      '1 - Sales',
      '2 - Support',
      '3 - Billing'
    ]},
    { type: 'route', /* ... */ }
  ]
});
```

### 3. SMS Marketing Campaign
```typescript
// Send promotional SMS
await telehub.campaigns.create({
  name: 'Course Launch Promo',
  type: 'sms',
  recipients: subscriberNumbers,
  message: 'New course live! 50% off. Visit ankr.in/courses',
  schedule: 'Feb 15 10:00 AM'
});
```

---

## 💰 Cost Optimization

### Automatic Provider Selection

```typescript
const costTable = {
  'msg91': { sms_india: 0.15, voice_india: 0.30 },
  'twilio': { sms_india: 0.50, voice_india: 1.20 },
  'plivo': { sms_india: 0.35, voice_india: 0.80 }
};

// Auto-select cheapest for Indian numbers
// Fallback to most reliable for international
```

---

## 🎯 Next Steps

1. **Create package structure**
2. **Implement provider abstraction**
3. **Add MSG91 integration first** (best for India)
4. **Build basic voice + SMS**
5. **Create admin dashboard**
6. **Add Twilio + Plivo**
7. **Implement failover logic**
8. **Build IVR flow designer**

---

## 📚 Resources

- MSG91 Docs: https://docs.msg91.com/
- Twilio Docs: https://www.twilio.com/docs
- Plivo Docs: https://www.plivo.com/docs/
- IVR Best Practices: https://www.twilio.com/docs/voice/tutorials/ivr

---

**Ready to build! Should I create the package structure and start with MSG91 integration?**
