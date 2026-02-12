# Feature Gating Implementation Guide
**Making Every Feature Tier-Configurable**

## 🎯 Goal
Make ALL features (past, present, future) configurable based on user subscription tier, so we can:
- Paywall valuable features
- Enable/disable features per customer
- A/B test feature availability
- Offer custom packages

---

## 🏗️ Architecture

### 1. Feature Flag System

**Database Schema:**
```sql
-- Subscription tiers
CREATE TABLE subscription_tiers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE,  -- 'free', 'freemium', 'pro', 'enterprise', 'custom'
  price_monthly DECIMAL(10,2),
  price_annual DECIMAL(10,2),
  features JSONB,  -- Feature configuration
  limits JSONB,    -- Usage limits
  created_at TIMESTAMP DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE user_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50) REFERENCES users(id),
  tier_id INT REFERENCES subscription_tiers(id),
  status VARCHAR(20),  -- 'active', 'expired', 'cancelled'
  started_at TIMESTAMP,
  expires_at TIMESTAMP,
  custom_features JSONB,  -- Override for custom clients
  created_at TIMESTAMP DEFAULT NOW()
);

-- Feature usage tracking
CREATE TABLE feature_usage (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50),
  feature_name VARCHAR(100),
  usage_count INT DEFAULT 0,
  last_used_at TIMESTAMP,
  reset_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### 2. Feature Configuration Format

```typescript
// Tier configuration example
const TIER_CONFIGS = {
  free: {
    features: {
      // Trading
      paperTrading: true,
      realBrokerIntegration: false,
      autoTrader: false,
      backtesting: false,
      riskAnalytics: 'basic',  // 'basic', 'advanced', 'enterprise'
      optionsTrading: false,
      indexDivergence: false,
      websocketStreaming: false,

      // BFC Integration
      bfcIntegration: false,
      tradingAccountRegistration: false,
      sessionSync: false,
      tradeEpisodeLogging: false,
      creditRequests: false,
      customer360: false,
      smartNotifications: false,
      riskScoreUpdates: false,

      // Advanced Features
      aiAssistant: false,
      smartContracts: false,
      unifiedSearch: false,
      customAlgorithms: false
    },
    limits: {
      aiRecommendations: 5,          // per day
      trades: 5,                     // per day
      sessions: 1,                   // concurrent
      brokerAccounts: 0,             // real brokers
      fundTransfers: 1,              // per day
      apiCalls: 0,                   // per day
      dataRetention: 30,             // days
      notificationChannels: ['email']
    }
  },

  freemium: {
    features: {
      paperTrading: true,
      realBrokerIntegration: true,
      autoTrader: false,
      backtesting: 'basic',          // 1 year history
      riskAnalytics: 'basic',
      optionsTrading: false,
      indexDivergence: false,
      websocketStreaming: false,

      // BFC Integration (LIMITED)
      bfcIntegration: true,
      tradingAccountRegistration: true,
      sessionSync: 'manual',         // manual vs auto
      tradeEpisodeLogging: false,
      creditRequests: false,
      customer360: 'limited',
      smartNotifications: false,
      riskScoreUpdates: false,

      aiAssistant: false,
      smartContracts: false,
      unifiedSearch: false,
      customAlgorithms: false
    },
    limits: {
      aiRecommendations: 20,
      trades: 50,
      sessions: 2,
      brokerAccounts: 1,
      fundTransfers: 5,
      apiCalls: 0,
      dataRetention: 365,
      notificationChannels: ['email', 'push']
    }
  },

  pro: {
    features: {
      paperTrading: true,
      realBrokerIntegration: true,
      autoTrader: true,
      backtesting: 'advanced',       // 5 years
      riskAnalytics: 'advanced',
      optionsTrading: true,
      indexDivergence: true,
      websocketStreaming: true,

      // BFC Integration (FULL)
      bfcIntegration: true,
      tradingAccountRegistration: true,
      sessionSync: 'realtime',       // real-time
      tradeEpisodeLogging: true,
      creditRequests: 'basic',       // up to ₹5L
      customer360: 'full',
      smartNotifications: true,
      riskScoreUpdates: true,

      aiAssistant: false,
      smartContracts: false,
      unifiedSearch: true,
      customAlgorithms: false
    },
    limits: {
      aiRecommendations: -1,         // unlimited (-1)
      trades: -1,
      sessions: 5,
      brokerAccounts: 5,
      fundTransfers: -1,
      apiCalls: 1000,
      dataRetention: -1,
      notificationChannels: ['email', 'push', 'sms']
    }
  },

  enterprise: {
    features: {
      // Everything enabled
      paperTrading: true,
      realBrokerIntegration: true,
      autoTrader: 'advanced',
      backtesting: 'enterprise',     // 10+ years
      riskAnalytics: 'enterprise',
      optionsTrading: true,
      indexDivergence: true,
      websocketStreaming: true,

      // BFC Integration (ENTERPRISE)
      bfcIntegration: true,
      tradingAccountRegistration: true,
      sessionSync: 'realtime',       // <100ms
      tradeEpisodeLogging: true,
      creditRequests: 'enterprise',  // up to ₹50L+
      customer360: 'enterprise',     // with AI insights
      smartNotifications: 'advanced',
      riskScoreUpdates: true,

      // Enterprise-only
      aiAssistant: true,
      smartContracts: true,
      unifiedSearch: 'advanced',
      customAlgorithms: true,
      multiAccountManagement: true,
      taxOptimization: true,
      dedicatedSupport: true
    },
    limits: {
      aiRecommendations: -1,
      trades: -1,
      sessions: -1,
      brokerAccounts: -1,
      fundTransfers: -1,
      apiCalls: -1,
      dataRetention: -1,
      notificationChannels: ['email', 'push', 'sms', 'whatsapp']
    }
  },

  custom: {
    features: {
      // All features + custom
      // Fully configurable per client
    },
    limits: {
      // No limits, fully customizable
    }
  }
}
```

---

## 💻 Implementation

### 3. Feature Gate Service

```typescript
/**
 * Feature Gate Service
 * Checks if user has access to a feature based on their subscription
 */

interface FeatureGateOptions {
  userId: string
  feature: string
  incrementUsage?: boolean
}

interface FeatureCheckResult {
  allowed: boolean
  reason?: string
  limit?: number
  used?: number
  tier?: string
}

class FeatureGateService {
  /**
   * Check if user can access a feature
   */
  async canAccess(options: FeatureGateOptions): Promise<FeatureCheckResult> {
    const { userId, feature, incrementUsage = false } = options

    // Get user subscription
    const subscription = await this.getUserSubscription(userId)

    if (!subscription) {
      return {
        allowed: false,
        reason: 'No active subscription',
        tier: 'none'
      }
    }

    // Get tier config
    const config = TIER_CONFIGS[subscription.tier]

    // Check if feature is enabled for tier
    const featureEnabled = config.features[feature]

    if (!featureEnabled || featureEnabled === false) {
      return {
        allowed: false,
        reason: `Feature not available in ${subscription.tier} tier`,
        tier: subscription.tier
      }
    }

    // Check usage limits (if feature has limits)
    const limitCheck = await this.checkLimits(userId, feature, config.limits)

    if (!limitCheck.allowed) {
      return limitCheck
    }

    // Increment usage if requested
    if (incrementUsage) {
      await this.incrementUsage(userId, feature)
    }

    return {
      allowed: true,
      tier: subscription.tier,
      limit: limitCheck.limit,
      used: limitCheck.used
    }
  }

  /**
   * Check usage limits
   */
  private async checkLimits(
    userId: string,
    feature: string,
    limits: any
  ): Promise<FeatureCheckResult> {
    // Map feature to limit key
    const limitKey = this.getFeatureLimitKey(feature)

    if (!limitKey || limits[limitKey] === -1) {
      // No limit or unlimited
      return { allowed: true }
    }

    const limit = limits[limitKey]
    const usage = await this.getUsage(userId, feature)

    if (usage >= limit) {
      return {
        allowed: false,
        reason: `Daily limit reached (${limit}/${limit})`,
        limit,
        used: usage
      }
    }

    return {
      allowed: true,
      limit,
      used: usage
    }
  }

  /**
   * Get feature limit key
   */
  private getFeatureLimitKey(feature: string): string | null {
    const mapping = {
      'ai_recommendation': 'aiRecommendations',
      'place_trade': 'trades',
      'fund_transfer': 'fundTransfers',
      'api_call': 'apiCalls'
    }
    return mapping[feature] || null
  }

  /**
   * Get current usage
   */
  private async getUsage(userId: string, feature: string): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const usage = await db.query(`
      SELECT usage_count
      FROM feature_usage
      WHERE user_id = $1
        AND feature_name = $2
        AND reset_at > $3
    `, [userId, feature, today])

    return usage.rows[0]?.usage_count || 0
  }

  /**
   * Increment usage counter
   */
  private async incrementUsage(userId: string, feature: string): Promise<void> {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    await db.query(`
      INSERT INTO feature_usage (user_id, feature_name, usage_count, reset_at)
      VALUES ($1, $2, 1, $3)
      ON CONFLICT (user_id, feature_name, reset_at)
      DO UPDATE SET
        usage_count = feature_usage.usage_count + 1,
        last_used_at = NOW()
    `, [userId, feature, tomorrow])
  }

  /**
   * Get user subscription
   */
  private async getUserSubscription(userId: string): Promise<any> {
    const result = await db.query(`
      SELECT s.*, t.name as tier, t.features, t.limits
      FROM user_subscriptions s
      JOIN subscription_tiers t ON s.tier_id = t.id
      WHERE s.user_id = $1
        AND s.status = 'active'
        AND s.expires_at > NOW()
      ORDER BY s.created_at DESC
      LIMIT 1
    `, [userId])

    return result.rows[0]
  }
}

export const featureGate = new FeatureGateService()
```

---

### 4. Middleware for API Routes

```typescript
/**
 * Feature gate middleware
 * Protects API routes based on subscription tier
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import { featureGate } from '../services/feature-gate.service'

export function requireFeature(feature: string, incrementUsage: boolean = false) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user?.id  // From auth middleware

    if (!userId) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
        message: 'Please log in to access this feature'
      })
    }

    const check = await featureGate.canAccess({
      userId,
      feature,
      incrementUsage
    })

    if (!check.allowed) {
      return reply.status(403).send({
        success: false,
        error: 'Feature not available',
        message: check.reason,
        upgrade: {
          currentTier: check.tier,
          requiredTier: getRequiredTier(feature),
          upgradeUrl: `/pricing?upgrade=${feature}`
        }
      })
    }

    // Store feature check in request for usage tracking
    request.featureAccess = check
  }
}

// Helper to get required tier
function getRequiredTier(feature: string): string {
  // Map features to minimum required tier
  const tierMap = {
    'autoTrader': 'pro',
    'aiAssistant': 'enterprise',
    'smartContracts': 'enterprise',
    'customAlgorithms': 'enterprise',
    // ... more mappings
  }
  return tierMap[feature] || 'freemium'
}
```

---

### 5. Usage in Routes

```typescript
/**
 * Example: Gating BFC Integration Endpoints
 */

import { requireFeature } from '../middleware/feature-gate'

// Register trading account (Freemium+)
app.post(
  '/api/bfc/customers/:customerId/register-trading',
  { preHandler: requireFeature('bfcIntegration') },
  async (request, reply) => {
    // This route only accessible to freemium+ users
    // Feature gate automatically checked
    // ...
  }
)

// Request credit (Pro+)
app.post(
  '/api/bfc/customers/:customerId/request-credit',
  { preHandler: requireFeature('creditRequests') },
  async (request, reply) => {
    // Check credit limit based on tier
    const { tier } = request.featureAccess

    const maxCredit = {
      'pro': 500000,          // ₹5L
      'enterprise': 5000000,  // ₹50L
      'custom': Infinity
    }[tier]

    if (request.body.requestedAmount > maxCredit) {
      return reply.status(403).send({
        success: false,
        error: 'Credit limit exceeded',
        message: `Your ${tier} plan allows up to ₹${maxCredit/100000}L`,
        upgrade: {
          requiredTier: 'enterprise',
          upgradeUrl: '/pricing?upgrade=credit'
        }
      })
    }

    // Process credit request
    // ...
  }
)

// AI recommendations (with usage tracking)
app.post(
  '/api/recommendations/generate',
  { preHandler: requireFeature('ai_recommendation', true) },  // increment usage
  async (request, reply) => {
    // Check remaining quota
    const { limit, used } = request.featureAccess
    const remaining = limit === -1 ? 'unlimited' : limit - used

    // Generate recommendation
    const recommendation = await generateAIRecommendation(request.body)

    return {
      success: true,
      recommendation,
      quota: {
        used: used + 1,
        limit,
        remaining
      }
    }
  }
)

// Auto-trader (Pro+ only)
app.post(
  '/api/auto-trader/sessions',
  { preHandler: requireFeature('autoTrader') },
  async (request, reply) => {
    // Only pro+ users can access
    // ...
  }
)

// AI Assistant (Enterprise only)
app.post(
  '/api/ai-assistant/chat',
  { preHandler: requireFeature('aiAssistant') },
  async (request, reply) => {
    // Only enterprise users can access
    // ...
  }
)
```

---

### 6. Frontend Feature Flags

```typescript
/**
 * React hook for feature gating in UI
 */

import { useQuery } from '@tanstack/react-query'

export function useFeatureAccess(feature: string) {
  return useQuery({
    queryKey: ['feature-access', feature],
    queryFn: async () => {
      const response = await fetch(`/api/feature-gate/check?feature=${feature}`)
      return response.json()
    },
    staleTime: 5 * 60 * 1000  // Cache for 5 minutes
  })
}

/**
 * Feature gate component
 */

interface FeatureGateProps {
  feature: string
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function FeatureGate({ feature, fallback, children }: FeatureGateProps) {
  const { data, isLoading } = useFeatureAccess(feature)

  if (isLoading) {
    return <Skeleton />
  }

  if (!data?.allowed) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <UpgradePrompt
        feature={feature}
        reason={data.reason}
        currentTier={data.tier}
        requiredTier={data.requiredTier}
      />
    )
  }

  return <>{children}</>
}

/**
 * Usage in components
 */

function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* Show auto-trader only to Pro+ users */}
      <FeatureGate feature="autoTrader">
        <AutoTraderWidget />
      </FeatureGate>

      {/* Show AI assistant only to Enterprise users */}
      <FeatureGate
        feature="aiAssistant"
        fallback={<UpgradeBanner tier="enterprise" />}
      >
        <AIAssistant />
      </FeatureGate>

      {/* BFC integration features */}
      <FeatureGate feature="customer360">
        <Customer360View />
      </FeatureGate>
    </div>
  )
}
```

---

### 7. Upgrade Prompts

```typescript
/**
 * Upgrade prompt component
 */

interface UpgradePromptProps {
  feature: string
  reason: string
  currentTier: string
  requiredTier: string
}

export function UpgradePrompt({
  feature,
  reason,
  currentTier,
  requiredTier
}: UpgradePromptProps) {
  const featureNames = {
    'autoTrader': 'Auto-Trading',
    'aiAssistant': 'AI Assistant',
    'smartContracts': 'Smart Contracts',
    'customer360': 'Customer 360 View',
    'creditRequests': 'Credit Requests'
  }

  return (
    <div className="upgrade-prompt">
      <Lock className="icon" />
      <h3>{featureNames[feature]} - {requiredTier} Feature</h3>
      <p>{reason}</p>
      <p className="current-plan">
        You're currently on the <strong>{currentTier}</strong> plan
      </p>
      <Button
        onClick={() => window.location.href = `/pricing?upgrade=${feature}`}
      >
        Upgrade to {requiredTier}
      </Button>
      <Link href="/pricing">View all plans</Link>
    </div>
  )
}
```

---

## 🔧 Configuration Management

### 8. Admin Panel for Feature Configuration

```typescript
/**
 * Admin API to update tier configurations
 */

app.post('/admin/tiers/:tierId/features', async (request, reply) => {
  const { tierId } = request.params
  const { features, limits } = request.body

  await db.query(`
    UPDATE subscription_tiers
    SET
      features = $1,
      limits = $2,
      updated_at = NOW()
    WHERE id = $3
  `, [JSON.stringify(features), JSON.stringify(limits), tierId])

  // Clear cache
  await redis.del(`tier:${tierId}`)

  return { success: true }
})

/**
 * Custom feature overrides for specific users
 */

app.post('/admin/users/:userId/features', async (request, reply) => {
  const { userId } = request.params
  const { customFeatures } = request.body

  await db.query(`
    UPDATE user_subscriptions
    SET custom_features = $1
    WHERE user_id = $2
      AND status = 'active'
  `, [JSON.stringify(customFeatures), userId])

  return { success: true }
})
```

---

## 📊 Analytics & Monitoring

### 9. Track Feature Usage

```typescript
/**
 * Analytics for feature usage
 */

app.get('/admin/analytics/features', async (request, reply) => {
  const stats = await db.query(`
    SELECT
      feature_name,
      COUNT(DISTINCT user_id) as unique_users,
      SUM(usage_count) as total_usage,
      AVG(usage_count) as avg_usage_per_user
    FROM feature_usage
    WHERE last_used_at > NOW() - INTERVAL '30 days'
    GROUP BY feature_name
    ORDER BY total_usage DESC
  `)

  return { features: stats.rows }
})

/**
 * Conversion funnel tracking
 */

app.get('/admin/analytics/conversions', async (request, reply) => {
  const funnel = await db.query(`
    SELECT
      u.tier,
      COUNT(*) as users,
      COUNT(CASE WHEN fu.user_id IS NOT NULL THEN 1 END) as active_users,
      AVG(fu.usage_count) as avg_feature_usage
    FROM user_subscriptions u
    LEFT JOIN feature_usage fu ON u.user_id = fu.user_id
      AND fu.last_used_at > NOW() - INTERVAL '30 days'
    GROUP BY u.tier
  `)

  return { funnel: funnel.rows }
})
```

---

## 🚀 Deployment Strategy

### 10. Feature Rollout Plan

**Week 1: Infrastructure**
- ✅ Create database tables
- ✅ Implement feature gate service
- ✅ Add middleware to existing routes
- ✅ Test with admin accounts

**Week 2: Gate Existing Features**
- ✅ Broker integration endpoints
- ✅ Auto-trader features
- ✅ Risk analytics
- ✅ BFC integration features

**Week 3: Frontend Integration**
- ✅ Feature gate components
- ✅ Upgrade prompts
- ✅ Usage quota displays
- ✅ Pricing page

**Week 4: Launch**
- ✅ Enable for all users
- ✅ Monitor conversions
- ✅ A/B test pricing
- ✅ Optimize based on data

---

## 🙏 श्री गणेशाय नमः | जय गुरुजी

**Every Feature is Now a Revenue Opportunity!**

From giving everything away for free to:
- ✅ Configurable feature access per tier
- ✅ Usage limits and tracking
- ✅ Smooth upgrade prompts
- ✅ Custom configurations per client
- ✅ Analytics-driven optimization

**Let's monetize effectively! 💰**

---

**Created:** 2026-02-12
**Status:** Ready for implementation
**Estimated Effort:** 2-3 weeks
**Expected Revenue Impact:** 5-10x increase

**Next Steps:**
1. Create database migrations
2. Implement feature gate service
3. Add middleware to existing routes
4. Build frontend components
5. Launch with existing users
