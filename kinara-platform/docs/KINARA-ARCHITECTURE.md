# Kinara - Technical Architecture

> Complete system architecture for the Kinara platform

---

## Tags
`Architecture` `Backend` `Frontend` `Database` `API` `AI/ML` `Security` `Infrastructure` `IoT` `Sensors`

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              KINARA PLATFORM ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  CLIENT LAYER                                                                       │
│  ════════════════════════════════════════════════════════════════════════════════  │
│                                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Mobile     │  │    Web       │  │   Embedded   │  │   Third      │           │
│  │    Apps      │  │  Dashboard   │  │   Devices    │  │   Party      │           │
│  │              │  │              │  │              │  │              │           │
│  │ React Native │  │ React + Vite │  │ C / Zephyr   │  │ REST/GraphQL │           │
│  │ iOS/Android  │  │   SPA        │  │ nRF52/ESP32  │  │   Clients    │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
│         │                 │                 │                 │                    │
│         │     HTTPS       │     HTTPS       │    BLE/HTTPS    │     HTTPS         │
│         │                 │                 │                 │                    │
│  ════════════════════════════════════════════════════════════════════════════════  │
│  EDGE LAYER (Optional)                                                              │
│  ════════════════════════════════════════════════════════════════════════════════  │
│                                                                                     │
│         │                 │                 │                 │                    │
│         │                 │                 ▼                 │                    │
│         │                 │         ┌──────────────┐          │                    │
│         │                 │         │  Edge Device │          │                    │
│         │                 │         │  (Optional)  │          │                    │
│         │                 │         │              │          │                    │
│         │                 │         │ Local Buffer │          │                    │
│         │                 │         │ Edge ML      │          │                    │
│         │                 │         │ BLE Gateway  │          │                    │
│         │                 │         └──────┬───────┘          │                    │
│         │                 │                │                  │                    │
│  ════════════════════════════════════════════════════════════════════════════════  │
│  API GATEWAY LAYER                                                                  │
│  ════════════════════════════════════════════════════════════════════════════════  │
│                                                                                     │
│         └─────────────────┴────────────────┴──────────────────┘                    │
│                                            │                                        │
│                                            ▼                                        │
│                           ┌────────────────────────────────────┐                   │
│                           │          API GATEWAY               │                   │
│                           │         (Kong / Traefik)           │                   │
│                           │                                    │                   │
│                           │  • Rate Limiting                   │                   │
│                           │  • Authentication                  │                   │
│                           │  • Request Routing                 │                   │
│                           │  • SSL Termination                 │                   │
│                           │  • Usage Metering                  │                   │
│                           └────────────────┬───────────────────┘                   │
│                                            │                                        │
│  ════════════════════════════════════════════════════════════════════════════════  │
│  SERVICE LAYER                                                                      │
│  ════════════════════════════════════════════════════════════════════════════════  │
│                                            │                                        │
│         ┌──────────────────────────────────┼──────────────────────────────────┐    │
│         │                                  │                                  │    │
│         ▼                                  ▼                                  ▼    │
│  ┌─────────────────┐              ┌─────────────────┐              ┌─────────────┐│
│  │   API SERVICE   │              │ INGESTION SVC   │              │  ML SERVICE ││
│  │   (Fastify)     │              │   (Fastify)     │              │  (Python)   ││
│  │                 │              │                 │              │             ││
│  │  • REST API     │              │  • Batch Ingest │              │  • ONNX RT  ││
│  │  • GraphQL      │              │  • Validation   │              │  • Inference││
│  │  • WebSocket    │              │  • Normalize    │              │  • Training ││
│  │  • Auth/Authz   │              │  • Queue        │              │  • Batch    ││
│  └────────┬────────┘              └────────┬────────┘              └──────┬──────┘│
│           │                                │                              │       │
│           │                                ▼                              │       │
│           │                       ┌─────────────────┐                     │       │
│           │                       │   JOB QUEUE     │                     │       │
│           │                       │   (BullMQ)      │                     │       │
│           │                       │                 │                     │       │
│           │                       │  • Async Jobs   │                     │       │
│           │                       │  • Retries      │                     │       │
│           │                       │  • Scheduling   │                     │       │
│           │                       └────────┬────────┘                     │       │
│           │                                │                              │       │
│  ════════════════════════════════════════════════════════════════════════════════  │
│  DATA LAYER                                                                         │
│  ════════════════════════════════════════════════════════════════════════════════  │
│           │                                │                              │       │
│           └────────────────────────────────┼──────────────────────────────┘       │
│                                            │                                       │
│         ┌──────────────────────────────────┼──────────────────────────────────┐   │
│         │                                  │                                  │   │
│         ▼                                  ▼                                  ▼   │
│  ┌─────────────────┐              ┌─────────────────┐              ┌─────────────┐│
│  │   PostgreSQL    │              │  TimescaleDB    │              │    Redis    ││
│  │   (Primary DB)  │              │  (Time-Series)  │              │   (Cache)   ││
│  │                 │              │                 │              │             ││
│  │  • Users        │              │  • Readings     │              │  • Sessions ││
│  │  • Tenants      │              │  • Events       │              │  • Rate Lmt ││
│  │  • Devices      │              │  • Aggregates   │              │  • Pub/Sub  ││
│  │  • Configs      │              │  • Predictions  │              │  • Queues   ││
│  └─────────────────┘              └─────────────────┘              └─────────────┘│
│                                                                                    │
│         ┌──────────────────────────────────────────────────────────────────────┐  │
│         │                        OBJECT STORAGE                                │  │
│         │                       (S3 / Cloudflare R2)                           │  │
│         │                                                                      │  │
│         │  • ML Models          • Exports           • Backups                  │  │
│         │  • Content Assets     • Reports           • Logs                     │  │
│         └──────────────────────────────────────────────────────────────────────┘  │
│                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Layer Details

### 1. Client Layer

#### Mobile SDK (React Native)

```typescript
// @kinara/react-native-sdk architecture

┌─────────────────────────────────────────────────────────────┐
│                    KINARA MOBILE SDK                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 PUBLIC API                           │   │
│  │                                                      │   │
│  │  KinaraSDK.init(config)                              │   │
│  │  KinaraSDK.connect(device)                           │   │
│  │  KinaraSDK.startStreaming()                          │   │
│  │  KinaraSDK.getInsights()                             │   │
│  │  KinaraSDK.predict()                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│         ┌────────────────┼────────────────┐                │
│         ▼                ▼                ▼                │
│  ┌───────────┐    ┌───────────┐    ┌───────────┐          │
│  │    BLE    │    │   HTTP    │    │   LOCAL   │          │
│  │  Manager  │    │  Client   │    │  Storage  │          │
│  │           │    │           │    │           │          │
│  │ • Scan    │    │ • REST    │    │ • SQLite  │          │
│  │ • Pair    │    │ • WS      │    │ • Buffer  │          │
│  │ • Stream  │    │ • Upload  │    │ • Sync    │          │
│  └───────────┘    └───────────┘    └───────────┘          │
│         │                │                │                │
│         └────────────────┼────────────────┘                │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 SENSOR PLUGINS                       │   │
│  │                                                      │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │   │
│  │  │ BLE     │ │ Apple   │ │ Google  │ │ Custom  │   │   │
│  │  │ Sensors │ │ Health  │ │ Health  │ │ Sensors │   │   │
│  │  │         │ │ Kit     │ │ Connect │ │         │   │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Embedded SDK (C/Zephyr)

```c
// kinara-embedded-sdk architecture

┌─────────────────────────────────────────────────────────────┐
│                  KINARA EMBEDDED SDK                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 APPLICATION LAYER                    │   │
│  │                                                      │   │
│  │  kinara_init()                                       │   │
│  │  kinara_sensor_register()                            │   │
│  │  kinara_reading_push()                               │   │
│  │  kinara_predict()                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│         ┌────────────────┼────────────────┐                │
│         ▼                ▼                ▼                │
│  ┌───────────┐    ┌───────────┐    ┌───────────┐          │
│  │  SENSOR   │    │   COMM    │    │    ML     │          │
│  │  DRIVERS  │    │   LAYER   │    │  RUNTIME  │          │
│  │           │    │           │    │           │          │
│  │ • MAX302x │    │ • BLE     │    │ • TFLite  │          │
│  │ • LSM6DSO │    │ • GATT    │    │ • CMSIS   │          │
│  │ • Custom  │    │ • Advert  │    │ • Predict │          │
│  └───────────┘    └───────────┘    └───────────┘          │
│         │                │                │                │
│         └────────────────┼────────────────┘                │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  HAL / RTOS                          │   │
│  │                                                      │   │
│  │  Zephyr RTOS / FreeRTOS / Bare Metal                 │   │
│  │  nRF52840 / ESP32-C3 / STM32                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 2. API Gateway Layer

#### Gateway Configuration

```yaml
# Kong/Traefik configuration concept

services:
  kinara-api:
    url: http://api-service:3000
    routes:
      - paths: ["/api/v1"]
        plugins:
          - rate-limiting:
              minute: 100
              policy: local
          - jwt:
              secret_is_base64: false
          - request-transformer:
              add:
                headers:
                  - "X-Request-ID: $(uuid)"

  kinara-ingest:
    url: http://ingest-service:3001
    routes:
      - paths: ["/ingest"]
        plugins:
          - rate-limiting:
              minute: 1000
          - api-key: {}
          - request-size-limiting:
              allowed_payload_size: 5

  kinara-ml:
    url: http://ml-service:8000
    routes:
      - paths: ["/ml"]
        plugins:
          - rate-limiting:
              minute: 500
          - jwt: {}
```

#### Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  AUTHENTICATION FLOW                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TENANT/USER AUTH (JWT)                                     │
│  ══════════════════════                                     │
│                                                             │
│  Client                    Gateway              Auth Svc    │
│    │                          │                     │       │
│    │──── POST /auth/login ───▶│                     │       │
│    │     {email, password}    │                     │       │
│    │                          │──── Validate ──────▶│       │
│    │                          │                     │       │
│    │                          │◀─── JWT Token ─────│       │
│    │◀─── {token, refresh} ────│                     │       │
│    │                          │                     │       │
│    │──── GET /api/v1/... ────▶│                     │       │
│    │     Authorization: JWT   │──── Verify ────────▶│       │
│    │                          │◀─── Valid ─────────│       │
│    │                          │──── Forward ──────▶ API     │
│    │◀─── Response ────────────│                             │
│                                                             │
│  DEVICE AUTH (API Key)                                      │
│  ═════════════════════                                      │
│                                                             │
│  Device                   Gateway              Device Svc   │
│    │                          │                     │       │
│    │──── POST /ingest ───────▶│                     │       │
│    │     X-API-Key: xxx       │──── Lookup ────────▶│       │
│    │                          │◀─── Tenant ID ─────│       │
│    │                          │──── Forward ──────▶ Ingest  │
│    │◀─── 202 Accepted ────────│                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 3. Service Layer

#### API Service (Fastify)

```typescript
// Service structure

src/
├── index.ts                 // Entry point
├── app.ts                   // Fastify app setup
├── config/
│   ├── index.ts            // Config loader
│   └── env.ts              // Environment vars
├── plugins/
│   ├── auth.ts             // JWT + API key auth
│   ├── swagger.ts          // OpenAPI docs
│   ├── cors.ts             // CORS setup
│   └── rateLimit.ts        // Rate limiting
├── routes/
│   ├── v1/
│   │   ├── auth.ts         // Auth endpoints
│   │   ├── users.ts        // User management
│   │   ├── devices.ts      // Device registration
│   │   ├── readings.ts     // Reading queries
│   │   ├── insights.ts     // Analytics/insights
│   │   └── predictions.ts  // ML predictions
│   └── health.ts           // Health checks
├── services/
│   ├── user.service.ts
│   ├── device.service.ts
│   ├── reading.service.ts
│   ├── insight.service.ts
│   └── prediction.service.ts
├── repositories/
│   ├── user.repo.ts
│   ├── device.repo.ts
│   └── reading.repo.ts
├── schemas/
│   ├── user.schema.ts      // Zod schemas
│   ├── device.schema.ts
│   └── reading.schema.ts
├── utils/
│   ├── logger.ts
│   ├── errors.ts
│   └── helpers.ts
└── types/
    └── index.ts
```

#### Ingestion Service

```
┌─────────────────────────────────────────────────────────────┐
│                  INGESTION PIPELINE                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Input                                                      │
│    │                                                        │
│    ▼                                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  VALIDATION                                          │   │
│  │  • Schema validation (Zod)                           │   │
│  │  • Device authentication                             │   │
│  │  • Timestamp sanity check                            │   │
│  │  • Value range validation                            │   │
│  └─────────────────────────────────────────────────────┘   │
│    │                                                        │
│    ▼                                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  NORMALIZATION                                       │   │
│  │  • Unit conversion (°F→°C, etc.)                     │   │
│  │  • Timezone normalization (→UTC)                     │   │
│  │  • Quality scoring                                   │   │
│  │  • Gap detection                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│    │                                                        │
│    ▼                                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ENRICHMENT                                          │   │
│  │  • Add tenant_id, user_id                            │   │
│  │  • Compute derived metrics (HRV from RR)             │   │
│  │  • Tag with device metadata                          │   │
│  └─────────────────────────────────────────────────────┘   │
│    │                                                        │
│    ├─────────────────────┐                                  │
│    ▼                     ▼                                  │
│  ┌───────────┐    ┌───────────────────────────────────┐    │
│  │  WRITE    │    │  QUEUE FOR ASYNC PROCESSING       │    │
│  │  TimescaleDB    │  • Aggregation jobs               │    │
│  │           │    │  • ML inference triggers           │    │
│  │           │    │  • Alert evaluation                │    │
│  └───────────┘    └───────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### ML Service (Python)

```python
# ML Service structure

ml-service/
├── main.py                  # FastAPI entry
├── config.py                # Configuration
├── routers/
│   ├── predict.py          # Prediction endpoints
│   ├── train.py            # Training endpoints
│   └── health.py           # Health checks
├── models/
│   ├── hot_flash/
│   │   ├── model.onnx      # Trained model
│   │   ├── preprocessor.py # Feature engineering
│   │   └── inference.py    # Inference logic
│   ├── sleep/
│   │   ├── model.onnx
│   │   └── inference.py
│   └── registry.py         # Model registry
├── training/
│   ├── hot_flash/
│   │   ├── train.py        # Training script
│   │   ├── dataset.py      # Data loading
│   │   └── evaluate.py     # Evaluation
│   └── utils.py
├── preprocessing/
│   ├── features.py         # Feature engineering
│   ├── normalize.py        # Normalization
│   └── window.py           # Windowing
└── utils/
    ├── onnx_runtime.py     # ONNX utils
    └── metrics.py          # Custom metrics
```

---

### 4. Data Layer

#### Database Schema (PostgreSQL)

```sql
-- Core schema

-- Tenants (B2B customers)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan VARCHAR(50) DEFAULT 'starter',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Keys for tenants
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    key_hash VARCHAR(64) NOT NULL,
    name VARCHAR(255),
    scopes TEXT[] DEFAULT '{}',
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (end users of tenant apps)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    external_id VARCHAR(255),  -- Tenant's user ID
    email VARCHAR(255),
    profile JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, external_id)
);

-- Devices
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    device_type VARCHAR(50) NOT NULL,
    hardware_id VARCHAR(255),
    name VARCHAR(255),
    firmware_version VARCHAR(50),
    last_seen_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, hardware_id)
);

-- Indexes
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_devices_tenant ON devices(tenant_id);
CREATE INDEX idx_devices_user ON devices(user_id);
CREATE INDEX idx_api_keys_tenant ON api_keys(tenant_id);
```

#### Time-Series Schema (TimescaleDB)

```sql
-- Time-series readings (hypertable)
CREATE TABLE readings (
    time TIMESTAMPTZ NOT NULL,
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    device_id UUID NOT NULL,
    reading_type VARCHAR(50) NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    unit VARCHAR(20),
    quality REAL DEFAULT 1.0,
    metadata JSONB DEFAULT '{}'
);

-- Convert to hypertable
SELECT create_hypertable('readings', 'time');

-- Compression policy (compress after 7 days)
ALTER TABLE readings SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'tenant_id, user_id, reading_type'
);

SELECT add_compression_policy('readings', INTERVAL '7 days');

-- Retention policy (keep 2 years of raw data)
SELECT add_retention_policy('readings', INTERVAL '2 years');

-- Continuous aggregates for hourly stats
CREATE MATERIALIZED VIEW readings_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS bucket,
    tenant_id,
    user_id,
    reading_type,
    AVG(value) as avg_value,
    MIN(value) as min_value,
    MAX(value) as max_value,
    STDDEV(value) as stddev_value,
    COUNT(*) as count
FROM readings
GROUP BY bucket, tenant_id, user_id, reading_type;

-- Refresh policy
SELECT add_continuous_aggregate_policy('readings_hourly',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

-- Events/predictions table
CREATE TABLE events (
    time TIMESTAMPTZ NOT NULL,
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20),
    confidence REAL,
    data JSONB DEFAULT '{}',
    acknowledged_at TIMESTAMPTZ
);

SELECT create_hypertable('events', 'time');

-- Indexes
CREATE INDEX idx_readings_user_type ON readings (tenant_id, user_id, reading_type, time DESC);
CREATE INDEX idx_events_user ON events (tenant_id, user_id, time DESC);
```

#### Redis Schema

```
# Key patterns

# Session data
session:{session_id} -> JSON (user session data)
TTL: 24 hours

# Rate limiting
ratelimit:{tenant_id}:{endpoint} -> counter
TTL: 1 minute (sliding window)

# Device status
device:status:{device_id} -> JSON (last seen, battery, etc.)
TTL: 5 minutes

# Real-time readings buffer
readings:buffer:{user_id} -> List (recent readings for ML)
TTL: 10 minutes

# Prediction cache
prediction:{user_id}:{model} -> JSON (cached prediction)
TTL: 30 seconds

# Pub/Sub channels
channel:readings:{tenant_id} -> Pub/Sub (real-time streaming)
channel:alerts:{tenant_id} -> Pub/Sub (alert notifications)
```

---

### 5. Infrastructure

#### Container Architecture

```yaml
# docker-compose.yml (development)

version: '3.8'

services:
  api:
    build: ./services/api
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://kinara:kinara@postgres:5432/kinara
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  ingest:
    build: ./services/ingest
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://kinara:kinara@postgres:5432/kinara
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  ml:
    build: ./services/ml
    ports:
      - "8000:8000"
    environment:
      - MODEL_PATH=/models
    volumes:
      - ./models:/models

  worker:
    build: ./services/worker
    environment:
      - DATABASE_URL=postgresql://kinara:kinara@postgres:5432/kinara
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  postgres:
    image: timescale/timescaledb:latest-pg15
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=kinara
      - POSTGRES_PASSWORD=kinara
      - POSTGRES_DB=kinara
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

#### Production Deployment (Railway/Fly.io)

```
┌─────────────────────────────────────────────────────────────┐
│                 PRODUCTION ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   CLOUDFLARE                         │   │
│  │         (DNS, CDN, DDoS Protection, WAF)             │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              RAILWAY / FLY.IO                        │   │
│  │                                                      │   │
│  │   ┌───────────┐  ┌───────────┐  ┌───────────┐       │   │
│  │   │ API x2    │  │ Ingest x2 │  │ ML x1     │       │   │
│  │   │ (autoscl) │  │ (autoscl) │  │           │       │   │
│  │   └───────────┘  └───────────┘  └───────────┘       │   │
│  │                                                      │   │
│  │   ┌───────────┐                                      │   │
│  │   │ Worker x1 │                                      │   │
│  │   │           │                                      │   │
│  │   └───────────┘                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│         ┌────────────────┼────────────────┐                │
│         ▼                ▼                ▼                │
│  ┌───────────┐    ┌───────────┐    ┌───────────┐          │
│  │  Neon     │    │  Upstash  │    │ Cloudflare│          │
│  │ PostgreSQL│    │  Redis    │    │    R2     │          │
│  │ +Timescale│    │           │    │ (Storage) │          │
│  └───────────┘    └───────────┘    └───────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Architecture

### Multi-Tenant Isolation

```
┌─────────────────────────────────────────────────────────────┐
│                 MULTI-TENANT ISOLATION                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  REQUEST FLOW                                               │
│  ════════════                                               │
│                                                             │
│  Request → Gateway → Auth → Tenant Context → Service        │
│                                │                            │
│                                ▼                            │
│                    ┌──────────────────────┐                 │
│                    │  TENANT CONTEXT      │                 │
│                    │                      │                 │
│                    │  tenant_id: uuid     │                 │
│                    │  plan: string        │                 │
│                    │  permissions: []     │                 │
│                    └──────────────────────┘                 │
│                                │                            │
│              ┌─────────────────┼─────────────────┐          │
│              ▼                 ▼                 ▼          │
│       ┌───────────┐     ┌───────────┐     ┌───────────┐    │
│       │  Query    │     │   Cache   │     │   Queue   │    │
│       │  Filter   │     │  Prefix   │     │  Routing  │    │
│       │           │     │           │     │           │    │
│       │ WHERE     │     │ Key:      │     │ Queue:    │    │
│       │ tenant_id │     │ {tenant}: │     │ {tenant}: │    │
│       │ = ctx.id  │     │ {key}     │     │ jobs      │    │
│       └───────────┘     └───────────┘     └───────────┘    │
│                                                             │
│  ISOLATION GUARANTEES                                       │
│  ════════════════════                                       │
│  • Row-level security in PostgreSQL                         │
│  • Tenant-prefixed cache keys                               │
│  • Separate queue namespaces                                │
│  • Audit logging per tenant                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Data Security

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA SECURITY                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  AT REST                                                    │
│  ═══════                                                    │
│  • Database encryption (AES-256)                            │
│  • Encrypted backups                                        │
│  • PII fields additionally encrypted                        │
│                                                             │
│  IN TRANSIT                                                 │
│  ══════════                                                 │
│  • TLS 1.3 everywhere                                       │
│  • Certificate pinning in SDKs                              │
│  • mTLS for internal services (optional)                    │
│                                                             │
│  ACCESS CONTROL                                             │
│  ══════════════                                             │
│  • RBAC for tenant admins                                   │
│  • API key scopes                                           │
│  • Short-lived JWTs (15 min)                                │
│  • Refresh token rotation                                   │
│                                                             │
│  COMPLIANCE                                                 │
│  ══════════                                                 │
│  • DPDP Act compliance                                      │
│  • Data residency (India)                                   │
│  • Right to deletion                                        │
│  • Data export capability                                   │
│  • Audit logging                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Monitoring & Observability

```
┌─────────────────────────────────────────────────────────────┐
│                  OBSERVABILITY STACK                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   GRAFANA                            │   │
│  │            (Dashboards & Alerting)                   │   │
│  └─────────────────────────────────────────────────────┘   │
│         │                    │                    │        │
│         ▼                    ▼                    ▼        │
│  ┌───────────┐        ┌───────────┐        ┌───────────┐  │
│  │Prometheus │        │   Loki    │        │  Tempo    │  │
│  │ (Metrics) │        │  (Logs)   │        │ (Traces)  │  │
│  └───────────┘        └───────────┘        └───────────┘  │
│         ▲                    ▲                    ▲        │
│         │                    │                    │        │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                    SERVICES                          │  │
│  │                                                      │  │
│  │  • prom-client (metrics)                             │  │
│  │  • pino (structured logging)                         │  │
│  │  • OpenTelemetry (tracing)                           │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  KEY METRICS                                                │
│  ═══════════                                                │
│  • API latency (p50, p95, p99)                              │
│  • Request rate per endpoint                                │
│  • Error rate by type                                       │
│  • Ingestion throughput                                     │
│  • ML inference latency                                     │
│  • Database connection pool                                 │
│  • Queue depth and processing time                          │
│                                                             │
│  ALERTS                                                     │
│  ══════                                                     │
│  • Error rate > 1%                                          │
│  • Latency p95 > 500ms                                      │
│  • Database connections > 80%                               │
│  • Disk usage > 80%                                         │
│  • ML model accuracy drift                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Scalability Considerations

### Horizontal Scaling

| Component | Scaling Strategy | Trigger |
|-----------|------------------|---------|
| API Service | Auto-scale replicas | CPU > 70%, RPS > 1000 |
| Ingest Service | Auto-scale replicas | Queue depth > 10000 |
| ML Service | Manual scale | Latency > 200ms |
| Worker | Manual scale | Queue age > 5 min |
| PostgreSQL | Read replicas | Read latency > 50ms |
| Redis | Cluster mode | Memory > 80% |

### Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| API Latency (p95) | < 100ms | TBD |
| Ingestion Rate | 10K readings/sec | TBD |
| ML Inference | < 50ms | TBD |
| Concurrent Users | 10K per instance | TBD |
| Data Retention | 2 years raw, 5 years aggregate | TBD |

---

## Technology Decisions

### ADR-001: Fastify over Express

**Decision**: Use Fastify for API services

**Rationale**:
- 2-3x faster than Express
- Built-in schema validation
- Better TypeScript support
- Plugin architecture aligns with modular design

### ADR-002: TimescaleDB over InfluxDB

**Decision**: Use TimescaleDB for time-series data

**Rationale**:
- Full SQL support
- Single database for relational + time-series
- Continuous aggregates
- Better tooling ecosystem

### ADR-003: ONNX for ML Models

**Decision**: Use ONNX Runtime for inference

**Rationale**:
- Framework-agnostic (train in PyTorch/TF)
- Excellent performance
- Edge deployment ready
- Good Python and Node.js support

### ADR-004: Railway over AWS

**Decision**: Use Railway for initial deployment

**Rationale**:
- Simpler deployment model
- Cost-effective for MVP scale
- Easy migration path to AWS later
- Good DX for small team

---

## Next Steps

1. **Setup monorepo** with pnpm workspaces
2. **Initialize database** schemas
3. **Build API service** skeleton
4. **Create ingestion pipeline**
5. **Develop mobile SDK** MVP
6. **Train initial ML models**

See [KINARA-TODO.md](KINARA-TODO.md) for detailed task breakdown.
