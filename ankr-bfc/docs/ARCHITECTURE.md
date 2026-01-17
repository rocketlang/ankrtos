# BFC Architecture

## System Overview

```
                                    ┌─────────────────────────┐
                                    │      Load Balancer      │
                                    │       (Nginx/ALB)       │
                                    └───────────┬─────────────┘
                                                │
                    ┌───────────────────────────┼───────────────────────────┐
                    │                           │                           │
            ┌───────▼───────┐          ┌────────▼────────┐         ┌───────▼───────┐
            │   bfc-web     │          │   bfc-api       │         │   WebSocket   │
            │   (React)     │          │   (GraphQL)     │         │   Server      │
            │   Port 3020   │          │   Port 4020     │         │   Port 4021   │
            └───────────────┘          └────────┬────────┘         └───────────────┘
                                                │
            ┌───────────────────────────────────┼───────────────────────────────────┐
            │                                   │                                   │
    ┌───────▼───────┐               ┌───────────▼───────────┐            ┌─────────▼─────────┐
    │   Services    │               │    Data Layer         │            │   External APIs   │
    │               │               │                       │            │                   │
    │ • Customer    │               │ • PostgreSQL + vector │            │ • AI Proxy (4444) │
    │ • Credit      │               │ • Redis Cache         │            │ • EON (4005)      │
    │ • Offer       │               │ • Prisma ORM          │            │ • Complymitra     │
    │ • Notification│               │                       │            │   (4015)          │
    └───────────────┘               └───────────────────────┘            └───────────────────┘
```

## Component Architecture

### bfc-api (Backend)

```
bfc-api/
├── src/
│   ├── main.ts              # Application entry
│   ├── app.ts               # Fastify + Mercurius setup
│   │
│   ├── plugins/
│   │   ├── auth.ts          # JWT authentication
│   │   ├── rbac.ts          # Role-based access
│   │   └── observability.ts # Logging, metrics
│   │
│   ├── resolvers/
│   │   ├── customer.ts      # Customer queries/mutations
│   │   ├── credit.ts        # Credit decisioning
│   │   ├── offer.ts         # Offer management
│   │   └── notification.ts  # Notification APIs
│   │
│   ├── services/
│   │   ├── customer.service.ts  # Customer 360
│   │   ├── credit.service.ts    # Credit engine
│   │   └── offer.service.ts     # Recommendations
│   │
│   └── schema/
│       └── schema.graphql   # GraphQL schema
│
└── prisma/
    └── schema.prisma        # Database schema
```

### bfc-core (Shared Library)

```
bfc-core/
├── src/
│   ├── types/               # TypeScript types
│   ├── crypto/              # Encryption utilities
│   ├── security/            # JWT, RBAC
│   ├── notifications/
│   │   ├── types.ts         # Notification types
│   │   ├── rbac.ts          # Role permissions
│   │   ├── abac.ts          # Attribute policies
│   │   ├── service.ts       # Notification service
│   │   └── handlers.ts      # Channel handlers
│   │
│   ├── integrations/
│   │   ├── eon.ts           # EON Memory client
│   │   ├── ai-proxy.ts      # AI Proxy client
│   │   ├── complymitra.ts   # Compliance client
│   │   ├── cbs-adapter.ts   # Core banking adapter
│   │   └── credit-engine.ts # Credit decisioning
│   │
│   ├── realtime/
│   │   └── websocket.ts     # WebSocket service
│   │
│   ├── reliability/
│   │   ├── circuit-breaker.ts
│   │   ├── retry.ts
│   │   └── graceful-shutdown.ts
│   │
│   ├── cache/
│   │   └── redis.ts         # Redis caching
│   │
│   └── observability/
│       ├── logger.ts
│       ├── metrics.ts
│       └── health.ts
```

## Data Flow

### Credit Decision Flow

```
1. Application Submitted
        │
        ▼
2. Policy Checks (RBAC/ABAC)
        │
        ▼
3. Risk Assessment
   ├── Bureau Score
   ├── Internal Score
   └── FOIR Calculation
        │
        ▼
4. Similar Cases (EON Memory)
        │
        ▼
5. AI Decision (AI Proxy)
   └── Claude-3-Sonnet
        │
        ▼
6. Final Decision
   ├── APPROVED
   ├── REJECTED
   ├── MANUAL_REVIEW
   └── CONDITIONAL_APPROVAL
        │
        ▼
7. Store Episode (EON)
        │
        ▼
8. Notify Customer
```

### Notification Flow

```
1. Create Notification
        │
        ▼
2. RBAC Check
   └── Does sender have permission?
        │
        ▼
3. ABAC Evaluation
   ├── Subject attributes
   ├── Resource attributes
   └── Environment attributes
        │
        ▼
4. Check if Approval Required
   ├── Yes → Queue for approval
   └── No → Continue
        │
        ▼
5. Check User Preferences
   ├── Channel enabled?
   └── Quiet hours?
        │
        ▼
6. Rate Limit Check
        │
        ▼
7. Send via Handler
   ├── Push (Firebase/APNS)
   ├── Email (SMTP/SES)
   ├── SMS (MSG91/Twilio)
   ├── WhatsApp (Business API)
   └── In-App (WebSocket)
        │
        ▼
8. Audit Log
```

## Database Schema

### Core Entities

```
┌─────────────────┐       ┌─────────────────┐
│    Customer     │       │ CustomerProduct │
├─────────────────┤       ├─────────────────┤
│ id              │──────<│ customerId      │
│ externalId      │       │ productType     │
│ name            │       │ accountNumber   │
│ phone           │       │ balance         │
│ kycStatus       │       │ status          │
│ riskScore       │       └─────────────────┘
│ trustScore      │
│ segment         │       ┌─────────────────┐
│ churnProbability│       │ CustomerEpisode │
└─────────────────┘       ├─────────────────┤
        │                 │ customerId      │
        │                 │ state           │
        └────────────────<│ action          │
                          │ outcome         │
                          │ success         │
                          │ module          │
                          │ embedding       │
                          └─────────────────┘
```

### Notification Entities

```
┌─────────────────┐       ┌─────────────────┐
│  Notification   │       │NotificationPref │
├─────────────────┤       ├─────────────────┤
│ id              │       │ userId          │
│ recipientId     │       │ channel         │
│ category        │       │ category        │
│ priority        │       │ enabled         │
│ title           │       │ quietHoursStart │
│ body            │       │ quietHoursEnd   │
│ channel         │       └─────────────────┘
│ status          │
│ sentAt          │       ┌─────────────────┐
│ readAt          │       │ AuditLog        │
└─────────────────┘       ├─────────────────┤
                          │ notificationId  │
                          │ action          │
                          │ actorId         │
                          │ actorRole       │
                          │ timestamp       │
                          └─────────────────┘
```

## Security Architecture

### Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────>│  Login   │────>│  Verify  │────>│  Issue   │
│          │     │  API     │     │  Creds   │     │  JWT     │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                        │
                                        ▼
                              ┌──────────────────┐
                              │  Store in Redis  │
                              │  (Session)       │
                              └──────────────────┘
```

### Authorization Layers

```
Layer 1: Authentication (JWT)
        │
        ▼
Layer 2: RBAC (Role Check)
        │
        ▼
Layer 3: ABAC (Policy Evaluation)
        │
        ▼
Layer 4: Resource-Level (Ownership)
```

### Encryption

```
┌─────────────────────────────────────────┐
│              Data at Rest               │
│                                         │
│  ┌──────────┐    ┌──────────────────┐  │
│  │ Sensitive │───>│ AES-256-GCM     │  │
│  │ Fields    │    │ (Field Level)   │  │
│  └──────────┘    └──────────────────┘  │
│                                         │
│  ┌──────────┐    ┌──────────────────┐  │
│  │ Passwords │───>│ PBKDF2 + Salt   │  │
│  └──────────┘    └──────────────────┘  │
│                                         │
│  ┌──────────┐    ┌──────────────────┐  │
│  │ PII      │───>│ Data Masking    │  │
│  │ (Display)│    │ (Runtime)       │  │
│  └──────────┘    └──────────────────┘  │
└─────────────────────────────────────────┘
```

## Scalability

### Horizontal Scaling

```
                    ┌─────────────────┐
                    │  Load Balancer  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼───────┐   ┌────────▼────────┐   ┌──────▼───────┐
│   API Node 1  │   │   API Node 2    │   │  API Node 3  │
└───────────────┘   └─────────────────┘   └──────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
      ┌───────▼───────┐            ┌────────▼────────┐
      │   PostgreSQL  │            │      Redis      │
      │   (Primary)   │            │    (Cluster)    │
      └───────┬───────┘            └─────────────────┘
              │
      ┌───────▼───────┐
      │   PostgreSQL  │
      │   (Replica)   │
      └───────────────┘
```

### Caching Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                     Cache Layers                            │
│                                                             │
│  L1: In-Memory (Node.js)                                   │
│      - Hot config, small lookups                           │
│      - TTL: 60 seconds                                     │
│                                                             │
│  L2: Redis                                                 │
│      - Customer data, offers, sessions                     │
│      - TTL: 5-30 minutes                                   │
│                                                             │
│  L3: CDN (Static Assets)                                   │
│      - Images, JS bundles, CSS                             │
│      - TTL: 1 day                                          │
└─────────────────────────────────────────────────────────────┘
```

## Monitoring

### Metrics Collected

```
┌─────────────────────────────────────────┐
│             Application Metrics         │
├─────────────────────────────────────────┤
│ • Request latency (p50, p95, p99)      │
│ • Request rate by endpoint             │
│ • Error rate by type                   │
│ • Credit decision time                 │
│ • Cache hit/miss ratio                 │
│ • Active connections                   │
│ • Queue depth (notifications)          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│             Business Metrics            │
├─────────────────────────────────────────┤
│ • Applications processed               │
│ • Approval rate                        │
│ • Notification delivery rate           │
│ • Customer engagement                  │
│ • Offer conversion rate                │
└─────────────────────────────────────────┘
```

### Health Checks

```
/health           - Overall health
/health/live      - Liveness probe
/health/ready     - Readiness probe
/health/db        - Database connectivity
/health/redis     - Redis connectivity
/health/external  - External service status
```

## Disaster Recovery

### Backup Strategy

| Data | Frequency | Retention |
|------|-----------|-----------|
| PostgreSQL | Hourly | 7 days |
| PostgreSQL (Full) | Daily | 30 days |
| Redis (RDB) | Hourly | 24 hours |
| Audit Logs | Real-time | 7 years |
| Document Storage | Real-time | 7 years |

### Recovery Objectives

| Metric | Target |
|--------|--------|
| RTO (Recovery Time) | < 1 hour |
| RPO (Data Loss) | < 5 minutes |
| SLA Uptime | 99.9% |
