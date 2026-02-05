# ⚡ RAZORPAY INTEGRATION - COMPLETE SETUP GUIDE

**Payment Gateway for CoralsAstrology Platform**
**Founded by Jyotish Acharya Rakesh Sharma**

---

## ✅ **WHAT'S IMPLEMENTED:**

1. ✅ Complete Razorpay integration module
2. ✅ Subscription plans (Monthly & Yearly)
3. ✅ One-time products (Reports, Q&A, Consultations)
4. ✅ Payment verification
5. ✅ Webhook handling
6. ✅ Refund system
7. ✅ Subscription management

---

## 🚀 **QUICK START:**

### **Step 1: Install Razorpay SDK**

```bash
cd /root/apps/corals-astrology/backend
npm install razorpay
npm install --save-dev @types/razorpay
```

### **Step 2: Get Razorpay Credentials**

1. Go to https://razorpay.com/
2. Sign up / Log in
3. Go to Settings → API Keys
4. Generate Test/Live keys

### **Step 3: Add Environment Variables**

Create/update `/backend/.env`:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here

# For Production (later)
# RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
# RAZORPAY_KEY_SECRET=your_live_secret_key_here
```

### **Step 4: Test Mode Setup**

For testing, use Razorpay Test Mode:
- Test Key ID: `rzp_test_xxxxxxxx`
- Test cards: https://razorpay.com/docs/payments/payments/test-card-details/

---

## 💳 **PAYMENT FLOWS:**

### **Flow 1: One-Time Payment (Reports, Q&A, etc.)**

```typescript
// 1. Create order on backend
const order = await createRazorpayOrder({
  amount: 99900, // ₹999 in paise
  currency: 'INR',
  itemType: 'report',
  itemId: 'vedic_report',
  userId: user.id,
  userEmail: user.email,
  userPhone: user.phone,
  userName: user.firstName
});

// 2. Frontend displays Razorpay checkout
const options = {
  key: 'rzp_test_xxxx', // Your Razorpay Key ID
  amount: order.amount,
  currency: order.currency,
  name: 'CoralsAstrology',
  description: 'Vedic Astrology Report',
  image: '/logo.png',
  order_id: order.orderId,
  handler: async function (response) {
    // 3. Payment success - verify on backend
    const result = await verifyPayment({
      orderId: response.razorpay_order_id,
      paymentId: response.razorpay_payment_id,
      signature: response.razorpay_signature
    });

    if (result.success) {
      // 4. Generate PDF and show download
      console.log('Payment successful!');
    }
  },
  prefill: {
    name: 'John Doe',
    email: 'john@example.com',
    contact: '9999999999'
  },
  theme: {
    color: '#6B46C1' // Your brand color
  }
};

const rzp = new Razorpay(options);
rzp.open();
```

### **Flow 2: Subscription Payment**

```typescript
// 1. User selects subscription plan
const plan = 'PRO_MONTHLY'; // ₹999/month

// 2. Create Razorpay subscription
const subscription = await createRazorpaySubscription(
  'plan_xxxxxxxxxxxx', // Razorpay plan ID
  user.id,
  user.email,
  user.phone
);

// 3. Frontend opens checkout
const options = {
  key: 'rzp_test_xxxx',
  subscription_id: subscription.subscriptionId,
  name: 'CoralsAstrology Pro',
  description: 'Monthly subscription to Pro tier',
  handler: function (response) {
    // Payment success
    // Activate subscription in database
  }
};
```

### **Flow 3: Marketplace Purchase**

```typescript
// 1. User buys gemstone from vendor
const order = await createRazorpayOrder({
  amount: 2500000, // ₹25,000
  currency: 'INR',
  itemType: 'product',
  itemId: 'ruby_ring_123',
  userId: user.id,
  // ... other details
});

// 2. After payment success
// - Create order in database
// - Notify vendor
// - Calculate platform commission (10%)
// - Update inventory
```

---

## 📋 **SUBSCRIPTION PLANS:**

### **Razorpay Dashboard Setup:**

1. Go to Razorpay Dashboard → Subscriptions → Plans
2. Create plans for each tier:

#### **Freemium Monthly**
- Name: Freemium Monthly
- Amount: ₹299
- Billing Interval: 1 month
- Plan ID: `plan_freemium_monthly`

#### **Freemium Yearly**
- Name: Freemium Yearly
- Amount: ₹2,999
- Billing Interval: 12 months
- Plan ID: `plan_freemium_yearly`

#### **Pro Monthly**
- Name: Pro Monthly
- Amount: ₹999
- Billing Interval: 1 month
- Plan ID: `plan_pro_monthly`

#### **Pro Yearly**
- Name: Pro Yearly
- Amount: ₹9,999
- Billing Interval: 12 months
- Plan ID: `plan_pro_yearly`

#### **Enterprise Monthly**
- Name: Enterprise Monthly
- Amount: ₹4,999
- Billing Interval: 1 month
- Plan ID: `plan_enterprise_monthly`

#### **Enterprise Yearly**
- Name: Enterprise Yearly
- Amount: ₹49,999
- Billing Interval: 12 months
- Plan ID: `plan_enterprise_yearly`

---

## 🔔 **WEBHOOK SETUP:**

### **Configure Webhooks in Razorpay:**

1. Go to Settings → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/razorpay`
3. Select events to track:
   - ✅ payment.captured
   - ✅ payment.failed
   - ✅ subscription.activated
   - ✅ subscription.charged
   - ✅ subscription.cancelled
   - ✅ subscription.completed
   - ✅ refund.created

4. Copy webhook secret and add to `.env`

### **Webhook Handler (Backend):**

```typescript
// /api/webhooks/razorpay
app.post('/api/webhooks/razorpay', async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const body = req.body;

  // Verify webhook signature
  const isValid = handleWebhook(body, signature);

  if (!isValid) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Process event
  await processWebhookEvent(body);

  res.json({ success: true });
});
```

---

## 🧪 **TESTING:**

### **Test Cards:**

```
Card Number: 4111 1111 1111 1111
CVV: Any 3 digits
Expiry: Any future date
OTP: 1234 (for 3DS)
```

### **Test Scenarios:**

1. **Successful Payment:**
   - Use test card above
   - Enter OTP 1234
   - Payment should succeed

2. **Failed Payment:**
   - Card: 4111 1111 1111 1234
   - Should fail

3. **Subscription:**
   - Create subscription
   - Use test card
   - Check auto-renewal (next billing cycle)

---

## 💰 **PRICING STRUCTURE:**

### **Platform Revenue:**

```
User Pays: ₹999 (Vedic Report)
├─ Platform: ₹999 (100%)
└─ Razorpay Fee: ~₹20 (2%)

User Pays: ₹25,000 (Gemstone from vendor)
├─ Vendor: ₹22,250 (89%)
├─ Platform Commission: ₹2,500 (10%)
├─ Razorpay Fee: ₹250 (1%)
└─ GST: As applicable

Subscription: ₹999/month
├─ Platform: ₹979
└─ Razorpay Fee: ₹20 (2%)
```

### **Razorpay Fees:**
- **Domestic Cards**: 2% + GST
- **International Cards**: 3% + GST
- **UPI**: 0% (free promotional period)
- **Net Banking**: 2% + GST
- **Wallets**: 2% + GST

---

## 📊 **PAYMENT ANALYTICS:**

### **Track in Razorpay Dashboard:**

1. **Revenue**
   - Daily/monthly revenue
   - Payment methods breakdown
   - Success rate

2. **Subscriptions**
   - Active subscriptions
   - Churn rate
   - MRR (Monthly Recurring Revenue)

3. **Settlements**
   - T+3 days (default)
   - Instant settlements (paid feature)

---

## 🔒 **SECURITY BEST PRACTICES:**

### **DO:**
- ✅ Always verify payment signature
- ✅ Use HTTPS for webhooks
- ✅ Store API keys in environment variables
- ✅ Log all transactions
- ✅ Implement idempotency for webhooks

### **DON'T:**
- ❌ Expose API secret in frontend
- ❌ Trust client-side payment status
- ❌ Skip signature verification
- ❌ Store card details
- ❌ Process payments without webhook confirmation

---

## 🚨 **ERROR HANDLING:**

### **Common Errors:**

1. **Invalid API Key**
   ```
   Error: Authentication failed
   Solution: Check RAZORPAY_KEY_ID in .env
   ```

2. **Payment Failed**
   ```
   Error: Payment processing failed
   Solution: Check user's card/account balance
   ```

3. **Signature Mismatch**
   ```
   Error: Invalid signature
   Solution: Verify RAZORPAY_KEY_SECRET
   ```

---

## 📱 **MOBILE INTEGRATION:**

### **React Native (Future):**

```bash
npm install react-native-razorpay
```

```javascript
import RazorpayCheckout from 'react-native-razorpay';

const options = {
  key: 'rzp_test_xxxx',
  amount: '99900',
  currency: 'INR',
  name: 'CoralsAstrology',
  // ... other options
};

RazorpayCheckout.open(options)
  .then((data) => {
    // Payment success
    console.log(data.razorpay_payment_id);
  })
  .catch((error) => {
    // Payment failed
    console.error(error);
  });
```

---

## 🎯 **GO LIVE CHECKLIST:**

### **Before Production:**

- [ ] Complete KYC with Razorpay
- [ ] Activate live account
- [ ] Get live API keys
- [ ] Test in production mode
- [ ] Set up webhook URL (HTTPS)
- [ ] Configure payment methods
- [ ] Set up settlement account
- [ ] Test refund flow
- [ ] Implement logging and monitoring
- [ ] Prepare customer support for payment issues

### **Legal & Compliance:**
- [ ] Terms & Conditions
- [ ] Refund Policy
- [ ] Privacy Policy
- [ ] GST registration (if applicable)
- [ ] Business entity verification

---

## 📞 **SUPPORT:**

### **Razorpay Support:**
- Email: support@razorpay.com
- Phone: 1800-102-5711
- Docs: https://razorpay.com/docs/

### **Test Environment:**
- Dashboard: https://dashboard.razorpay.com/
- Test Mode: Use test keys for development

---

## 🎊 **READY TO USE:**

The Razorpay integration is **100% implemented** and ready to use!

### **Next Steps:**
1. Get Razorpay account
2. Add API keys to `.env`
3. Test with test cards
4. Complete KYC for production
5. Go live! 🚀

---

**Founded by Jyotish Acharya Rakesh Sharma**
**CoralsAstrology - Payment Integration Complete** ✅

**Status: Razorpay 100% Implemented, Ready for Testing** 💳
