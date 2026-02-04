# Analytics & Performance Monitoring - Complete Observability

**Date**: February 4, 2026
**Status**: Planning Phase
**Goal**: Comprehensive analytics and monitoring for platform health, user behavior, and business metrics
**Scope**: User analytics, system monitoring, business intelligence, alerting

---

## 🎯 EXECUTIVE SUMMARY

Mari8X is now a complete maritime ecosystem serving 4 stakeholder types with potential ₹4.62 Cr ARR. We need **world-class analytics and monitoring** to:

- **Understand users**: What features do they use? Where do they drop off?
- **Monitor performance**: Is the platform fast? Any errors or downtime?
- **Track business metrics**: MRR, churn, conversion rates, CAC, LTV
- **Prevent issues**: Alert before problems become critical
- **Make data-driven decisions**: A/B testing, feature prioritization

**Three Pillars of Observability:**

1. **User Analytics**: Product usage, conversion funnels, user journeys
2. **System Monitoring**: Performance, errors, uptime, infrastructure
3. **Business Intelligence**: Revenue, growth, retention, unit economics

---

## 📊 PILLAR 1: USER ANALYTICS

### 1.1 Product Analytics Platform

**Tool**: Mixpanel + Amplitude (choose one)

**Why Mixpanel?**
- Event-based tracking (track every user action)
- Funnel analysis (where do users drop off?)
- Cohort analysis (retention by signup date)
- User profiles (complete user journey)
- A/B testing support

**Core Events to Track:**

#### Authentication Events
```javascript
// User signup
mixpanel.track('User Signed Up', {
  method: 'email', // or 'google', 'phone'
  tier: 'FREE',
  userType: 'port_agent', // or 'master', 'owner', 'broker'
  source: 'landing_page', // or 'referral', 'google_ads'
});

// User login
mixpanel.track('User Logged In', {
  method: 'email',
  device: 'web', // or 'mobile'
});
```

#### Feature Usage Events
```javascript
// Port Agent Events
mixpanel.track('Arrival Created', {
  vesselIMO: '9234567',
  port: 'Mumbai',
  eta: '2026-02-10',
});

mixpanel.track('Document Uploaded', {
  documentType: 'crew_list',
  fileSize: 2.5, // MB
  uploadMethod: 'camera', // or 'gallery', 'file'
});

mixpanel.track('PDA Generated', {
  automatic: true, // or false for manual
  port: 'Mumbai',
  daAmount: 125000, // INR
});

mixpanel.track('FDA Dispute Filed', {
  amount: 45000,
  category: 'overtime_charges',
});

// Master Events (Mobile)
mixpanel.track('Document Submitted', {
  documentType: 'cargo_manifest',
  source: 'mobile_camera',
});

mixpanel.track('Chat Message Sent', {
  recipient: 'agent',
  messageType: 'text', // or 'photo', 'video'
});

// Owner Events
mixpanel.track('Fleet Dashboard Viewed', {
  vesselCount: 45,
  alertCount: 3,
});

mixpanel.track('Cost Report Generated', {
  reportType: 'port_comparison',
  dateRange: '30_days',
});

// Broker Events
mixpanel.track('Vessel Search Performed', {
  filters: ['ballast', 'panamax', 'asia'],
  resultsCount: 147,
});

mixpanel.track('Freight Rate Checked', {
  route: 'Singapore-China',
  vesselType: 'panamax',
});
```

#### Subscription Events
```javascript
mixpanel.track('Subscription Upgraded', {
  fromTier: 'PRO',
  toTier: 'AGENCY',
  billingCycle: 'monthly',
  amount: 39999, // INR
});

mixpanel.track('Subscription Cancelled', {
  tier: 'PRO',
  reason: 'too_expensive', // or 'not_using', 'found_alternative'
  daysSinceSignup: 45,
});
```

#### Conversion Funnel Events
```javascript
// Free → Pro Conversion Funnel
mixpanel.track('Pricing Page Viewed');
mixpanel.track('Plan Selected', { tier: 'PRO' });
mixpanel.track('Payment Form Opened');
mixpanel.track('Payment Details Entered');
mixpanel.track('Payment Submitted');
mixpanel.track('Payment Success');
mixpanel.track('Subscription Activated');
```

### 1.2 Key Funnels to Monitor

**Port Agent Onboarding Funnel:**
```
Signup → Email Verify → Profile Complete → First Vessel Added → First Document Uploaded → First PDA Generated → Active User

Target Conversion: 60% (Signup → Active)
Current Baseline: Track for 30 days
```

**Free → Pro Conversion Funnel:**
```
Free Signup → Vessel Limit Reached → Pricing Page → Plan Selected → Payment → Subscription Active

Target Conversion: 40% (Limit Reached → Subscription)
Drop-off Points: Identify and optimize
```

**Master App Funnel:**
```
App Download → Registration → Dashboard View → First Document Upload → First Chat → Active User

Target Conversion: 50% (Download → Active)
Critical Step: First Document Upload (make it easy!)
```

### 1.3 User Behavior Analysis

**Cohort Analysis:**
```
Weekly Cohort Retention:
Week 0: 100% (signup)
Week 1: 70% (returned)
Week 2: 55%
Week 4: 45%
Week 8: 40% (stable retention)

Goal: 60%+ retention at Week 8
```

**Feature Adoption:**
```
Port Agents (PRO tier):
- Auto PDA: 85% use weekly ✅
- FDA Disputes: 45% use monthly
- Bank Reconciliation: 30% use monthly ⚠️
- Cost Optimization: 20% use monthly ⚠️

Action: Promote underused features via email campaigns
```

**User Segmentation:**
```javascript
// Segment: Power Users
mixpanel.createSegment('Power Users', {
  conditions: [
    { event: 'User Logged In', frequency: 'daily' },
    { event: 'Arrival Created', count: '>10', period: 'month' },
    { property: 'tier', value: ['PRO', 'AGENCY', 'ENTERPRISE'] }
  ]
});

// Segment: At-Risk Users (churn prediction)
mixpanel.createSegment('At-Risk Users', {
  conditions: [
    { event: 'User Logged In', lastSeen: '>14 days' },
    { event: 'Arrival Created', count: '<2', period: 'month' }
  ]
});
```

### 1.4 A/B Testing Framework

**Test Examples:**

**Test 1: Pricing Page CTA Button**
```javascript
// Variant A: "Start Free Trial"
// Variant B: "Get Started Free"
// Metric: Click-through rate
// Sample Size: 1,000 visitors per variant
// Duration: 7 days
```

**Test 2: Onboarding Flow**
```javascript
// Variant A: 6-step onboarding (current)
// Variant B: 3-step simplified onboarding
// Metric: Completion rate
// Sample Size: 500 new signups per variant
// Duration: 14 days
```

**Test 3: Upgrade Prompts**
```javascript
// Variant A: Modal popup when limit reached
// Variant B: Banner at top of dashboard
// Metric: Free → Pro conversion rate
// Sample Size: 300 free users per variant
// Duration: 30 days
```

---

## 🖥️ PILLAR 2: SYSTEM MONITORING

### 2.1 Application Performance Monitoring (APM)

**Tool**: Sentry + DataDog

**What to Monitor:**

#### Error Tracking (Sentry)
```javascript
// Automatic error capture
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: 'production',
  tracesSampleRate: 0.1, // 10% of transactions
  release: 'mari8x@1.0.0',
});

// Custom error context
Sentry.setUser({
  id: user.id,
  email: user.email,
  tier: user.subscription.tier,
});

Sentry.setContext('arrival', {
  vesselIMO: '9234567',
  port: 'Mumbai',
});
```

**Error Alerts:**
- Critical: Immediate PagerDuty (payment failures, auth errors)
- High: Slack notification within 15 minutes
- Medium: Email digest (daily summary)
- Low: Dashboard only

#### Performance Monitoring (DataDog)
```javascript
// Track API response times
DD.trace('graphql.query', {
  resource: 'arrivals',
  service: 'mari8x-backend',
  span: {
    startTime: Date.now(),
    endTime: Date.now() + responseTime,
  }
});

// Track database queries
DD.trace('postgres.query', {
  resource: 'SELECT * FROM arrivals',
  duration: queryTime,
});
```

**Performance Metrics:**
- API response time (p50, p95, p99)
- Database query time
- GraphQL resolver time
- Frontend page load time
- Mobile app startup time

**SLA Targets:**
```
API Response Time:
- p50: <100ms ✅
- p95: <500ms ✅
- p99: <1000ms ⚠️

Page Load Time:
- p50: <1s ✅
- p95: <3s ⚠️

Database Queries:
- p50: <50ms ✅
- p95: <200ms ⚠️
```

### 2.2 Infrastructure Monitoring

**Tool**: Grafana + Prometheus

**Metrics to Track:**

#### Server Metrics
```yaml
# CPU Usage
container_cpu_usage_seconds_total
# Target: <70% avg

# Memory Usage
container_memory_usage_bytes
# Target: <80% of limit

# Disk I/O
node_disk_io_time_seconds_total
# Target: <80% utilization

# Network Traffic
node_network_transmit_bytes_total
# Target: Monitor for anomalies
```

#### Application Metrics
```yaml
# HTTP Requests
http_requests_total{method="GET", status="200"}
http_request_duration_seconds

# GraphQL Operations
graphql_operations_total{operation="arrivals"}
graphql_operation_duration_seconds

# WebSocket Connections
websocket_connections_active
websocket_messages_sent_total

# Background Jobs
jobs_completed_total{queue="pdf_generation"}
jobs_failed_total
jobs_processing_duration_seconds
```

#### Database Metrics
```yaml
# Connection Pool
pg_pool_size
pg_pool_idle
pg_pool_waiting

# Query Performance
pg_query_duration_seconds
pg_slow_queries_total{threshold=">1s"}

# Replication Lag
pg_replication_lag_seconds
```

**Grafana Dashboards:**

**Dashboard 1: System Overview**
- CPU/Memory/Disk usage (last 24h)
- API request rate (req/sec)
- Error rate (%)
- Active WebSocket connections

**Dashboard 2: API Performance**
- Response time (p50, p95, p99)
- Requests by endpoint
- Error rate by endpoint
- GraphQL operation breakdown

**Dashboard 3: Database Health**
- Query duration
- Connection pool utilization
- Slow queries (>1s)
- Replication lag

**Dashboard 4: Background Jobs**
- Jobs processed/hour
- Job success rate
- Queue depth
- Failed job alerts

### 2.3 Uptime Monitoring

**Tool**: UptimeRobot + Pingdom

**Endpoints to Monitor:**
```yaml
# Public Endpoints (5-min intervals)
- https://mari8x.com (landing page)
- https://api.mari8x.com/health (API health)
- https://docs.mari8x.com (documentation)

# Critical Paths (1-min intervals)
- https://api.mari8x.com/graphql (GraphQL endpoint)
- https://api.mari8x.com/auth/login (authentication)
- https://api.mari8x.com/webhooks/razorpay (payment webhooks)

# Regional Checks (multi-location)
- India (Mumbai)
- US (Virginia)
- Europe (Frankfurt)
- Asia (Singapore)
```

**Uptime SLA:**
```
Target: 99.9% uptime (43 minutes downtime/month)
Penalty: Service credits if <99.5%

Status Page: https://status.mari8x.com
- Real-time status
- Incident history
- Scheduled maintenance
```

### 2.4 Log Aggregation

**Tool**: ELK Stack (Elasticsearch, Logstash, Kibana) or Loki

**Log Levels:**
```javascript
// Error: Something broke
logger.error('Payment failed', {
  userId: user.id,
  amount: 39999,
  error: err.message
});

// Warn: Potential issue
logger.warn('Slow query detected', {
  query: 'SELECT * FROM arrivals',
  duration: 1250 // ms
});

// Info: Normal operations
logger.info('User logged in', {
  userId: user.id,
  method: 'email'
});

// Debug: Detailed debugging (dev only)
logger.debug('GraphQL query', {
  operation: 'arrivals',
  variables: { limit: 20 }
});
```

**Log Retention:**
- Error logs: 90 days
- Warn logs: 30 days
- Info logs: 7 days
- Debug logs: 1 day (dev only)

---

## 💼 PILLAR 3: BUSINESS INTELLIGENCE

### 3.1 Revenue Metrics Dashboard

**Tool**: Custom dashboard (React + Recharts) + Metabase

**Key Metrics:**

#### Monthly Recurring Revenue (MRR)
```typescript
const calculateMRR = async () => {
  const subscriptions = await prisma.subscription.findMany({
    where: { status: 'ACTIVE' }
  });

  const mrr = subscriptions.reduce((total, sub) => {
    const monthlyAmount = sub.interval === 'annual'
      ? sub.amount / 12
      : sub.amount;
    return total + monthlyAmount;
  }, 0);

  return {
    total: mrr,
    byTier: {
      FREE: 0,
      PRO: /* sum of PRO */,
      AGENCY: /* sum of AGENCY */,
      ENTERPRISE: /* sum of ENTERPRISE */
    },
    byStakeholder: {
      agents: /* sum */,
      masters: /* sum */,
      owners: /* sum */,
      brokers: /* sum */
    }
  };
};
```

**MRR Growth:**
```
Month 0: ₹0
Month 1: ₹2.5L (10 PRO agents)
Month 3: ₹8L (40 PRO, 5 AGENCY agents)
Month 6: ₹16L (60 PRO, 10 AGENCY, 2 ENTERPRISE)
Month 12: ₹38.5L (full ecosystem)

MoM Growth Rate Target: 20%+
```

#### Customer Metrics
```typescript
// New Customers (Monthly)
const newCustomers = await prisma.subscription.count({
  where: {
    createdAt: { gte: startOfMonth, lte: endOfMonth },
    tier: { not: 'FREE' }
  }
});

// Churned Customers (Monthly)
const churnedCustomers = await prisma.subscription.count({
  where: {
    canceledAt: { gte: startOfMonth, lte: endOfMonth }
  }
});

// Churn Rate
const churnRate = (churnedCustomers / activeCustomers) * 100;
// Target: <5% monthly churn
```

#### Unit Economics
```typescript
// Customer Acquisition Cost (CAC)
const cac = totalMarketingSpend / newCustomers;
// Target: ₹20,000/customer

// Lifetime Value (LTV)
const averageMonthlyRevenue = mrr / activeCustomers;
const averageLifetimeMonths = 36; // 3 years
const ltv = averageMonthlyRevenue * averageLifetimeMonths;
// Target: ₹3,00,000+ (₹8,333/mo × 36 months)

// LTV/CAC Ratio
const ltvCacRatio = ltv / cac;
// Target: >3:1 (ideally 5:1+)
```

### 3.2 Growth Metrics Dashboard

**Signup Funnel:**
```
Landing Page Visitors: 10,000/month
↓ (10% conversion)
Signups: 1,000/month
↓ (70% activation)
Active Users: 700/month
↓ (40% paid conversion)
Paying Customers: 280/month
```

**Activation Metrics:**
```typescript
// Time to First Value (TTFV)
const ttfv = {
  portAgent: {
    firstVesselAdded: '5 minutes', // median
    firstDocumentUploaded: '10 minutes',
    firstPDAGenerated: '30 minutes' // Aha moment!
  },
  master: {
    appDownloaded: '0 minutes',
    firstLogin: '2 minutes',
    firstDocumentSubmitted: '15 minutes' // Aha moment!
  }
};

// Goal: Reduce TTFV to maximize activation
```

**Referral Metrics:**
```typescript
// Viral Coefficient (k)
const invitesSent = 500;
const newSignupsFromInvites = 150;
const viralCoefficient = newSignupsFromInvites / invitesSent;
// k = 0.3 (need k > 1 for true virality)

// Goal: Increase viral coefficient through:
// - Better invite flow
// - Incentives (1 month free)
// - Social proof
```

### 3.3 Product Metrics Dashboard

**Feature Usage Matrix:**
```
Feature                    | Adoption | Engagement | Retention Impact
---------------------------|----------|------------|------------------
Auto PDA                   | 85%      | Daily      | +30% retention ✅
FDA Disputes               | 45%      | Weekly     | +15% retention
Bank Reconciliation        | 30%      | Monthly    | +10% retention ⚠️
Cost Optimization          | 20%      | Monthly    | +5% retention ⚠️
Tariff Management          | 15%      | Quarterly  | Neutral ⚠️

Action: Improve onboarding for underused high-impact features
```

**Engagement Score:**
```typescript
const calculateEngagementScore = (userId: string) => {
  const loginFrequency = /* daily = 30, weekly = 20, monthly = 10 */;
  const featureUsage = /* 1 point per unique feature, max 30 */;
  const activeTime = /* minutes per session, max 20 */;
  const socialActivity = /* messages sent, max 20 */;

  return loginFrequency + featureUsage + activeTime + socialActivity;
  // Score: 0-100
  // <30 = At-risk, 30-60 = Average, >60 = Power User
};
```

### 3.4 Business Intelligence Reports

**Daily Report (Automated Email):**
```
Subject: Mari8X Daily Metrics - Feb 4, 2026

📊 Yesterday's Stats:
- New Signups: 35 (+12% vs avg)
- Active Users: 850 (DAU/MAU = 45%)
- MRR: ₹28.5L (+₹15K)
- Churn: 2 customers (0.3%)

🚨 Alerts:
- API p99 response time: 1.2s (above 1s threshold)
- 3 critical errors in payment flow

🎯 Weekly Goals:
- New Customers: 18/25 (72% complete)
- MRR Growth: ₹2.1L/₹5L (42% complete)
```

**Weekly Report (Stakeholder Review):**
```
Subject: Mari8X Weekly Review - Week of Feb 1-7, 2026

📈 Growth:
- New Signups: 245 (+18% WoW)
- New Paying Customers: 18
- MRR: ₹28.5L (+₹1.2L, 4.4% growth)
- Churn: 5 customers (1.8% monthly rate)

👥 Engagement:
- DAU: 850 avg (45% DAU/MAU)
- Sessions per user: 4.2
- Avg session time: 12 minutes
- Feature adoption: Auto PDA 85%, FDA 45%

💰 Revenue:
- CAC: ₹22K
- LTV: ₹3.2L
- LTV/CAC: 14.5:1 ✅
- Payback period: 2.8 months

🔥 Top Wins:
1. Launched broker intelligence (8 beta signups)
2. Reduced API p95 to 320ms (-40%)
3. Mobile app 4.8★ rating (50 reviews)

⚠️ Action Items:
1. Investigate payment flow errors (3 critical)
2. Improve bank reconciliation adoption (30%→50%)
3. Speed up owner portal onboarding (12→8 days)
```

**Monthly Business Review (Board/Investors):**
```
📊 Mari8X - January 2026 Business Review

🎯 Key Metrics:
- MRR: ₹28.5L (+22% MoM)
- ARR: ₹3.42 Cr (on track for ₹4.62Cr goal)
- Customers: 320 (+45 net new)
- Churn: 3.2% (below 5% target ✅)

📈 Growth:
- Signups: 1,050 (+25% MoM)
- Activation: 68% (target: 70%)
- Free→Pro: 38% (target: 40%)
- Expansion: ₹3.5L (PRO→AGENCY upgrades)

👥 User Base:
- Port Agents: 250 (200 FREE, 45 PRO, 5 AGENCY)
- Masters: 850 (820 FREE, 30 PRO)
- Owners: 8 (all ENTERPRISE)
- Brokers: 12 (8 PRO, 4 ENTERPRISE)

💰 Unit Economics:
- CAC: ₹21K
- LTV: ₹3.1L
- LTV/CAC: 14.8:1
- Payback: 2.9 months
- Gross Margin: 85%

🏆 Highlights:
- Launched owner portal (8 enterprise signups)
- Master mobile app: 2,500 downloads, 850 MAU
- API uptime: 99.97% (target: 99.9% ✅)

🚀 Next Month Focus:
- Launch broker public beta (target: 50 signups)
- Improve bank reconciliation adoption (30%→50%)
- Reduce owner onboarding time (12→8 days)
```

---

## 🚨 ALERTING & INCIDENT RESPONSE

### Alert Priorities

**P0 - Critical (Immediate Response):**
- API down (>1% error rate)
- Payment webhook failures
- Database connection failures
- Authentication errors spike

**Response:** PagerDuty → On-call engineer
**SLA:** 5-minute response time

**P1 - High (Urgent):**
- Slow API (p99 >2s)
- WebSocket disconnections spike
- Background job failures
- High memory usage (>90%)

**Response:** Slack #incidents channel
**SLA:** 15-minute response time

**P2 - Medium (Important):**
- Feature errors (e.g., PDA generation fails)
- Moderate performance degradation
- Security warnings (failed login attempts)

**Response:** Email + Slack
**SLA:** 1-hour response time

**P3 - Low (Monitor):**
- Minor UI errors
- Slow non-critical endpoints
- Low engagement metrics

**Response:** Dashboard + daily digest
**SLA:** Next business day

### Incident Response Playbook

**Step 1: Detect** (Automated alerts)
**Step 2: Acknowledge** (Engineer claims incident)
**Step 3: Investigate** (Logs, metrics, recent deploys)
**Step 4: Mitigate** (Fix or rollback)
**Step 5: Communicate** (Status page update)
**Step 6: Resolve** (Verify fix)
**Step 7: Post-mortem** (Root cause analysis)

---

## 🚀 IMPLEMENTATION PLAN (4 Weeks)

### Week 1: User Analytics Setup
**Deliverables:**
- [ ] Set up Mixpanel account
- [ ] Instrument frontend events (50+ events)
- [ ] Instrument backend events
- [ ] Create conversion funnels (5 funnels)
- [ ] Build user segments (10 segments)

### Week 2: System Monitoring Setup
**Deliverables:**
- [ ] Set up Sentry (error tracking)
- [ ] Set up DataDog APM
- [ ] Configure Grafana dashboards (4 dashboards)
- [ ] Set up UptimeRobot (5 endpoints)
- [ ] Configure ELK/Loki (log aggregation)

### Week 3: Business Intelligence
**Deliverables:**
- [ ] Build MRR dashboard (Metabase)
- [ ] Create growth metrics dashboard
- [ ] Build product metrics dashboard
- [ ] Set up automated reports (daily, weekly, monthly)
- [ ] Configure revenue alerts

### Week 4: Alerting & Polish
**Deliverables:**
- [ ] Configure PagerDuty integration
- [ ] Set up Slack alerts
- [ ] Create incident response playbook
- [ ] Build public status page
- [ ] Team training on monitoring tools

---

## 📊 SUCCESS METRICS

### Observability Coverage
- **User events tracked**: 50+ critical events
- **Error capture rate**: 99%+ (all errors logged)
- **Performance monitoring**: 100% API endpoints
- **Uptime monitoring**: 5 critical endpoints

### Response Times
- **P0 incidents**: <5 min acknowledgment
- **P1 incidents**: <15 min acknowledgment
- **Average MTTR**: <30 minutes
- **Uptime**: 99.9%+ monthly

### Business Insights
- **Daily reports**: Automated, 100% delivery
- **Weekly reviews**: On-time, actionable insights
- **Monthly reviews**: Board-ready, comprehensive
- **Data freshness**: <5 min lag for real-time metrics

---

## 🎓 NEXT ACTIONS

**This Week:**
1. Set up Mixpanel account
2. Instrument top 20 events
3. Create first conversion funnel
4. Set up Sentry error tracking
5. Configure basic Grafana dashboard

**Next Week:**
1. Complete event instrumentation (50+ events)
2. Set up DataDog APM
3. Build all Grafana dashboards
4. Configure UptimeRobot
5. Build MRR dashboard (Metabase)

**Month 1:**
1. Full observability coverage
2. All dashboards operational
3. Automated reporting live
4. Alert system configured
5. Team trained on tools

---

**Created**: February 4, 2026
**Owner**: Claude Sonnet 4.5
**Status**: Ready to implement
**Timeline**: 4 weeks to full observability
**Impact**: Data-driven decisions, proactive issue detection, business visibility

📊 **Let's build complete observability for Mari8X!**
