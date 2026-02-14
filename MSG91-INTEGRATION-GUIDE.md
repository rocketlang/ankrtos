# MSG91 Integration for ComplyMitra OTP

## 🇮🇳 Why MSG91?

MSG91 is perfect for Indian apps:
- ✅ SMS OTP delivery across India
- ✅ Email OTP delivery
- ✅ WhatsApp OTP
- ✅ Affordable pricing
- ✅ High delivery rates
- ✅ Built-in OTP templates
- ✅ DLT compliant

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Get MSG91 Credentials

1. Sign up at: https://msg91.com/
2. Get your **Auth Key** from dashboard
3. Get your **Template ID** for OTP
4. Note your **Sender ID**

### Step 2: Install MSG91 SDK

```bash
cd /root/ankr-compliance/apps/api
npm install msg91-sms --save
```

### Step 3: Configure Environment Variables

Add to `/root/ankr-compliance/apps/api/.env`:

```env
# MSG91 Configuration
MSG91_AUTH_KEY=your_auth_key_here
MSG91_SENDER_ID=CMITRA
MSG91_OTP_TEMPLATE_ID=your_template_id
MSG91_OTP_LENGTH=6
```

### Step 4: Update Auth Plugin

Edit: `/root/ankr-compliance/apps/api/src/plugins/auth.ts`

**Add imports at top:**
```typescript
import axios from 'axios';

// MSG91 Configuration
const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID || 'CMITRA';
const MSG91_OTP_TEMPLATE_ID = process.env.MSG91_OTP_TEMPLATE_ID;
```

**Add MSG91 helper functions (after line 58):**
```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// MSG91 OTP HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

async function sendOTPviaMSG91(mobile: string, otp: string): Promise<boolean> {
  try {
    const response = await axios.post('https://control.msg91.com/api/v5/otp', {
      template_id: MSG91_OTP_TEMPLATE_ID,
      mobile: mobile,
      otp: otp,
      authkey: MSG91_AUTH_KEY,
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    return response.data.type === 'success';
  } catch (error) {
    console.error('MSG91 OTP send error:', error);
    return false;
  }
}

async function sendOTPviaEmail(email: string, otp: string): Promise<boolean> {
  try {
    const response = await axios.post('https://control.msg91.com/api/v5/email/send', {
      to: [{ email, name: 'User' }],
      from: { email: 'noreply@complymitra.in', name: 'ComplyMitra' },
      subject: 'Your ComplyMitra Login Code',
      template_id: MSG91_OTP_TEMPLATE_ID,
      variables: {
        otp: otp,
        company: 'ComplyMitra',
        expiry: '5 minutes'
      }
    }, {
      headers: {
        'authkey': MSG91_AUTH_KEY,
        'Content-Type': 'application/json',
      }
    });

    return response.data.type === 'success';
  } catch (error) {
    console.error('MSG91 Email send error:', error);
    return false;
  }
}
```

**Update EMAIL OTP Send (replace line 100-106):**
```typescript
      // Send OTP via MSG91
      if (MSG91_AUTH_KEY) {
        const sent = await sendOTPviaEmail(email, otp);
        if (sent) {
          fastify.log.info({ email }, '📧 OTP sent via MSG91');
        } else {
          fastify.log.warn({ email }, '⚠️  MSG91 email failed, using dev mode');
        }
      }

      // DEV MODE: Also log OTP for testing
      if (process.env.NODE_ENV === 'development') {
        fastify.log.info({ email, otp }, '📧 OTP (dev mode - check logs)');
      }
```

### Step 5: Add SMS OTP Support (Optional)

Add after email OTP endpoints:

```typescript
    // ─────────────────────────────────────────────────────────────────────────
    // PHONE OTP: Send (via MSG91 SMS)
    // ─────────────────────────────────────────────────────────────────────────
    app.post('/phone/send-otp', async (request: FastifyRequest, reply: FastifyReply) => {
      const { phone } = request.body as { phone: string };

      if (!phone || phone.length < 10) {
        return reply.code(400).send({ error: 'Valid phone number required' });
      }

      const otp = generateOTP();
      const key = `phone:${phone}`;

      otpStore.set(key, {
        otp,
        expiresAt: Date.now() + 5 * 60 * 1000,
        attempts: 0,
      });

      // Send via MSG91 SMS
      if (MSG91_AUTH_KEY) {
        const sent = await sendOTPviaMSG91(phone, otp);
        if (!sent) {
          return reply.code(500).send({ error: 'Failed to send SMS' });
        }
      }

      // Dev mode: log OTP
      if (process.env.NODE_ENV === 'development') {
        fastify.log.info({ phone, otp }, '📱 SMS OTP sent (dev mode)');
      }

      return reply.send({
        success: true,
        message: 'OTP sent to phone',
        expiresIn: 300,
        ...(process.env.NODE_ENV === 'development' && { devOtp: otp }),
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // PHONE OTP: Verify
    // ─────────────────────────────────────────────────────────────────────────
    app.post('/phone/verify', async (request: FastifyRequest, reply: FastifyReply) => {
      const { phone, otp } = request.body as { phone: string; otp: string };

      if (!phone || !otp) {
        return reply.code(400).send({ error: 'Phone and OTP required' });
      }

      const key = `phone:${phone}`;
      const record = otpStore.get(key);

      if (!record) {
        return reply.code(404).send({ error: 'OTP not found or expired' });
      }

      if (Date.now() > record.expiresAt) {
        otpStore.delete(key);
        return reply.code(410).send({ error: 'OTP expired' });
      }

      if (record.attempts >= 3) {
        otpStore.delete(key);
        return reply.code(429).send({ error: 'Too many attempts' });
      }

      if (record.otp !== otp) {
        record.attempts++;
        return reply.code(401).send({ error: 'Invalid OTP', attemptsLeft: 3 - record.attempts });
      }

      // OTP verified - clean up
      otpStore.delete(key);

      // Create user session
      const user: UserPayload = {
        id: `user_${Date.now()}`,
        phone,
        role: 'user',
      };

      const token = fastify.jwt.sign(user);

      return reply.send({
        success: true,
        token,
        user,
      });
    });
```

---

## 📱 MSG91 OTP Templates

### SMS Template (DLT Approved)

**Template Name:** `COMPLYMITRA_OTP`

**Template Content:**
```
Your ComplyMitra login code is {#var#}. Valid for 5 minutes. Do not share this code with anyone. - COMPLYMITRA
```

**Variables:** `{#var#}` = OTP

### Email Template

**Subject:** `Your ComplyMitra Login Code`

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .otp { font-size: 48px; font-weight: bold; letter-spacing: 10px; text-align: center; color: #4F46E5; padding: 20px; background: white; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>ComplyMitra</h1>
        </div>
        <div class="content">
            <h2>Your Login Code</h2>
            <p>Hi there! 👋</p>
            <p>Your one-time password (OTP) for signing in to ComplyMitra is:</p>
            <div class="otp">##var1##</div>
            <p><strong>This code expires in ##var2##.</strong></p>
            <p>If you didn't request this code, please ignore this email.</p>
            <p>For security, never share this code with anyone.</p>
        </div>
        <div class="footer">
            <p>© 2026 ComplyMitra. All rights reserved.</p>
            <p>Powered by PowerBox IT Solutions Pvt Ltd</p>
        </div>
    </div>
</body>
</html>
```

**Variables:**
- `##var1##` = OTP code
- `##var2##` = "5 minutes"

---

## 💰 MSG91 Pricing (As of 2026)

### SMS Pricing (India)
- **Promotional SMS**: ₹0.18 per SMS
- **Transactional SMS**: ₹0.25 per SMS (Use this for OTP)
- **Minimum Recharge**: ₹500

### Email Pricing
- **First 10,000 emails**: FREE
- **After that**: ₹0.10 per email

### WhatsApp OTP (Optional)
- **Per message**: ₹0.35
- **Delivery rate**: 98%+

**Estimated Cost:**
- 1000 OTP SMS/month = ₹250
- 1000 OTP Emails/month = FREE (under 10k limit)

---

## 🔧 Testing MSG91 Integration

### Test SMS OTP:
```bash
curl -X POST http://localhost:4001/phone/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "919876543210"}'
```

### Test Email OTP:
```bash
curl -X POST http://localhost:4001/email/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### Verify OTP:
```bash
curl -X POST http://localhost:4001/phone/verify \
  -H "Content-Type: application/json" \
  -d '{"phone": "919876543210", "otp": "123456"}'
```

---

## 🎯 Frontend Integration (Optional)

Update LoginPage to support both email AND phone:

```typescript
const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
const [phone, setPhone] = useState('');

// Add phone input toggle
<div className="flex gap-2 mb-4">
  <button
    onClick={() => setLoginMethod('email')}
    className={loginMethod === 'email' ? 'active' : ''}
  >
    Email
  </button>
  <button
    onClick={() => setLoginMethod('phone')}
    className={loginMethod === 'phone' ? 'active' : ''}
  >
    Phone
  </button>
</div>

{loginMethod === 'phone' ? (
  <input
    type="tel"
    placeholder="+91 98765 43210"
    value={phone}
    onChange={(e) => setPhone(e.target.value)}
  />
) : (
  <input
    type="email"
    placeholder="you@example.com"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
)}
```

---

## ✅ Benefits of MSG91 Integration

1. **Production Ready** - Real OTP delivery to users
2. **Indian Compliance** - DLT approved templates
3. **High Delivery** - 98%+ delivery rates
4. **Multi-channel** - SMS + Email + WhatsApp
5. **Affordable** - Start at ₹500
6. **Analytics** - Track delivery, opens, clicks
7. **Fallback** - Automatic retry if primary fails
8. **Scalable** - Handles high volume

---

## 🚀 Next Steps

1. **Sign up**: https://msg91.com/
2. **Get credentials**: Auth Key + Template ID
3. **Add to .env**: MSG91_AUTH_KEY, MSG91_TEMPLATE_ID
4. **Update auth.ts**: Add MSG91 helper functions
5. **Create templates**: DLT approval for SMS
6. **Test**: Send test OTP
7. **Go live**: Deploy to production

---

**Jai Guru Ji! 🙏**

*MSG91 makes OTP delivery simple and affordable for Indian apps!*
