# Feature Gating - Quick Reference Guide

**🎯 Every Feature is Now Monetizable**

---

## 🚀 Quick Start (5 Minutes)

```bash
# 1. Run database migration
cd /mnt/storage/projects/ankr-options-standalone/apps/vyomo-api
export DATABASE_URL="postgresql://localhost:5432/vyomo"
./scripts/run-feature-gating-migration.sh

# 2. Restart API
pm2 restart vyomo-api

# 3. Test it
/root/test-feature-gating.sh

# Done! ✅
```

---

## 💰 Pricing Tiers at a Glance

| Feature | Free | Freemium | Pro | Enterprise |
|---------|------|----------|-----|------------|
| **Price** | ₹0 | ₹499/mo | ₹1,999/mo | ₹9,999/mo |
| **Real Brokers** | ❌ | ✅ (1) | ✅ (5) | ✅ Unlimited |
| **Auto-Trader** | ❌ | ❌ | ✅ | ✅ Advanced |
| **BFC Integration** | ❌ | ✅ Basic | ✅ Full | ✅ Enterprise |
| **Credit Requests** | ❌ | ❌ | ₹5L | ₹50L+ |
| **AI Recs/Day** | 5 | 20 | Unlimited | Unlimited |
| **AI Assistant** | ❌ | ❌ | ❌ | ✅ |
| **White-Label** | ❌ | ❌ | ❌ | ❌ (Custom) |

---

## 🔒 Protect a Feature (3 Lines)

```typescript
import { requireFeature } from '../middleware/feature-gate'

app.post('/api/my-endpoint',
  { preHandler: requireFeature('myFeature') },  // ← Add this line
  handler
)
```

**That's it!** Users without the feature get:
- HTTP 403
- Clear error message
- Upgrade prompt with pricing link

---

## 👤 Assign User to Tier

### Via API:
```bash
curl -X POST http://localhost:4025/api/subscription/subscribe \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user123" \
  -d '{
    "tierName": "pro",
    "paymentMethod": "razorpay",
    "billingCycle": "monthly"
  }'
```

### Via Code:
```typescript
import { featureGate } from '../services/feature-gate.service'

await featureGate.createSubscription(
  'user123',
  'pro',
  new Date('2027-02-12') // expires
)
```

### Via SQL:
```sql
INSERT INTO user_subscriptions (user_id, tier_id, status, started_at, expires_at)
SELECT 'user123', id, 'active', NOW(), NOW() + INTERVAL '1 year'
FROM subscription_tiers WHERE name = 'pro';
```

---

## ✅ Check Feature Access

### Backend:
```typescript
const check = await featureGate.canAccess({
  userId: 'user123',
  feature: 'autoTrader'
})

if (check.allowed) {
  // User has access
} else {
  // Show upgrade prompt: check.reason, check.requiresTier
}
```

### Frontend (React):
```typescript
import { useFeatureAccess } from '@/hooks/useFeatureAccess'

function MyComponent() {
  const { allowed, tier } = useFeatureAccess('autoTrader')

  if (!allowed) {
    return <UpgradePrompt requiredTier="pro" />
  }

  return <AutoTraderButton />
}
```

---

## 📊 Check Quota

```typescript
const quota = await featureGate.getRemainingQuota('user123', 'ai_recommendation')
// { limit: 20, used: 15, remaining: 5 }
```

---

## 🎨 Add New Feature

### Step 1: Update Tier Config

Edit `src/config/subscription-tiers.ts`:

```typescript
export const TIER_CONFIGS = {
  pro: {
    features: {
      // ... existing
      myNewFeature: true  // ← Add here
    }
  }
}
```

### Step 2: Protect Route

```typescript
app.post('/api/my-new-feature',
  { preHandler: requireFeature('myNewFeature') },
  handler
)
```

### Done! ✅

No database changes needed. Config is cached in memory.

---

## 🔧 Change Limits Live

```sql
-- Increase freemium AI recommendations to 30/day
UPDATE subscription_tiers
SET limits = jsonb_set(limits, '{aiRecommendations}', '30')
WHERE name = 'freemium';
```

Changes take effect immediately (after cache refresh).

---

## 🎭 A/B Testing (Feature Overrides)

Give specific user access to enterprise feature for 7 days:

```sql
INSERT INTO feature_overrides (user_id, feature_name, override_value, expires_at)
VALUES ('user123', 'aiAssistant', true, NOW() + INTERVAL '7 days');
```

Overrides beat subscription tier.

---

## 📈 View Usage Analytics

```typescript
const analytics = await featureGate.getUserAnalytics('user123', 30)
// [
//   { feature_name: 'ai_recommendation', total_usage: 145, days_active: 28 },
//   { feature_name: 'place_trade', total_usage: 87, days_active: 22 }
// ]
```

Perfect for showing users their activity and conversion funnels.

---

## 🐛 Troubleshooting

### Feature gate not working?

1. **Check user has subscription:**
   ```sql
   SELECT * FROM user_subscriptions WHERE user_id = 'user123' AND status = 'active';
   ```

2. **Check feature exists in tier:**
   ```sql
   SELECT features FROM subscription_tiers WHERE name = 'pro';
   ```

3. **Check auth middleware:**
   Feature gate needs `request.userId` or `request.user.id`

4. **Clear cache:**
   ```bash
   pm2 restart vyomo-api
   ```

### User can't access paid feature?

1. Check subscription status:
   ```sql
   SELECT s.status, s.expires_at, t.name
   FROM user_subscriptions s
   JOIN subscription_tiers t ON s.tier_id = t.id
   WHERE s.user_id = 'user123'
   ORDER BY s.created_at DESC LIMIT 1;
   ```

2. Check expires_at hasn't passed

3. Verify feature enabled in tier

---

## 📚 API Endpoints

### Subscription Management
```
GET  /api/subscription/tiers           - List all tiers
GET  /api/subscription/tier/:name      - Get tier details
GET  /api/subscription/current         - User's current subscription
POST /api/subscription/subscribe       - Create/update subscription

GET  /api/subscription/check-feature?feature=X  - Check access
POST /api/subscription/check-multiple  - Batch check
GET  /api/subscription/quota?feature=X - Get remaining quota
GET  /api/subscription/analytics?days=30 - Usage stats
```

### Protected BFC Endpoints
```
POST /api/bfc/customers/:id/register-trading  - Freemium+
POST /api/bfc/customers/:id/sync-trading      - Freemium+
POST /api/bfc/customers/:id/log-trade         - Pro+
POST /api/bfc/customers/:id/request-credit    - Pro+ (₹5L), Ent (₹50L+)
POST /api/bfc/customers/:id/notify            - Pro+
GET  /api/bfc/customers/:id/360               - Freemium+ (limited), Pro (full)
POST /api/bfc/customers/:id/update-risk       - Pro+
```

---

## 💡 Common Patterns

### Tiered Feature Values

```typescript
// Not just boolean, use strings for tiers
features: {
  riskAnalytics: 'basic'      // Freemium
  riskAnalytics: 'advanced'   // Pro
  riskAnalytics: 'enterprise' // Enterprise
}

// In handler:
const { tier } = request.featureAccess
const level = TIER_CONFIGS[tier].features.riskAnalytics
```

### Usage-Based Limits

```typescript
app.post('/api/generate-ai',
  { preHandler: checkQuota('ai_recommendation', true) },  // increment
  async (req, reply) => {
    const { limit, used } = req.featureAccess
    // ... generate AI ...
    return {
      result,
      quota: { used: used + 1, limit, remaining: limit - used - 1 }
    }
  }
)
```

### Conditional Features

```typescript
// Check without blocking
app.get('/api/dashboard',
  { preHandler: checkFeature('aiAssistant') },
  async (req, reply) => {
    const data = await getDashboard()

    // Show AI assistant widget only if user has access
    if (req.featureAccess?.allowed) {
      data.widgets.push({ type: 'ai-assistant' })
    }

    return data
  }
)
```

---

## 🎯 Best Practices

### ✅ DO:
- Use `requireFeature()` for paid features
- Return clear upgrade messages
- Track usage with `incrementUsage: true`
- Test with different tiers
- Update tier configs in database, not code

### ❌ DON'T:
- Don't hardcode feature checks
- Don't block without upgrade path
- Don't forget to increment usage
- Don't mix tiers and features
- Don't expose enterprise features in Free

---

## 🙏 श्री गणेशाय नमः | जय गुरुजी

**Quick, Simple, Powerful**

From free-for-all to tier-based monetization in minutes.

---

**Questions?** Read the full docs: `/root/FEATURE-GATING-COMPLETE.md`
