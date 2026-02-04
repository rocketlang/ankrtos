# Kinara - API Specification

> Complete API documentation for the Kinara platform

---

## Tags
`API` `Backend` `Authentication` `Integration` `REST` `GraphQL` `WebSocket`

---

## Overview

| Attribute | Value |
|-----------|-------|
| Base URL (Production) | `https://api.kinara.health` |
| Base URL (Sandbox) | `https://sandbox.kinara.health` |
| API Version | v1 |
| Format | JSON |
| Authentication | JWT (users) / API Key (devices) |

---

## Authentication

### JWT Authentication (User/Admin)

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@tenant.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 900,
    "token_type": "Bearer"
  }
}
```

**Usage:**
```http
GET /api/v1/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### API Key Authentication (Devices/Services)

```http
POST /api/v1/ingest/readings
X-API-Key: kn_live_abc123xyz...
Content-Type: application/json
```

### API Key Scopes

| Scope | Description | Endpoints |
|-------|-------------|-----------|
| `read:readings` | Read sensor data | GET /readings/* |
| `write:readings` | Write sensor data | POST /ingest/* |
| `read:insights` | Access analytics | GET /insights/* |
| `read:predictions` | ML predictions | GET /predictions/* |
| `admin:devices` | Manage devices | /devices/* |
| `admin:users` | Manage users | /users/* |

---

## API Endpoints

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2025-01-19T10:30:00Z",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "ml": "healthy"
  }
}
```

---

### Tenants

#### Get Current Tenant

```http
GET /api/v1/tenant
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Cloudnine Hospital",
    "slug": "cloudnine",
    "plan": "growth",
    "settings": {
      "default_timezone": "Asia/Kolkata",
      "data_retention_days": 730,
      "features": ["predictions", "insights", "export"]
    },
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

#### Update Tenant Settings

```http
PATCH /api/v1/tenant/settings
Authorization: Bearer {token}
Content-Type: application/json

{
  "default_timezone": "Asia/Kolkata",
  "notification_email": "alerts@cloudnine.in"
}
```

---

### Users (End Users)

#### Create User

```http
POST /api/v1/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "external_id": "user_12345",
  "email": "patient@example.com",
  "profile": {
    "name": "Meena Sharma",
    "age": 48,
    "menopause_stage": "perimenopause"
  },
  "preferences": {
    "language": "hi",
    "notifications": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "external_id": "user_12345",
    "email": "patient@example.com",
    "profile": {...},
    "created_at": "2025-01-19T10:30:00Z"
  }
}
```

#### List Users

```http
GET /api/v1/users?page=1&limit=20&search=meena
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8
  }
}
```

#### Get User by ID

```http
GET /api/v1/users/{user_id}
Authorization: Bearer {token}
```

#### Update User

```http
PATCH /api/v1/users/{user_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "profile": {
    "menopause_stage": "menopause"
  }
}
```

#### Delete User (GDPR/DPDP)

```http
DELETE /api/v1/users/{user_id}
Authorization: Bearer {token}
```

**Note:** This permanently deletes all user data including readings, events, and predictions.

---

### Devices

#### Register Device

```http
POST /api/v1/devices
Authorization: Bearer {token}
Content-Type: application/json

{
  "device_type": "wristband",
  "hardware_id": "AA:BB:CC:DD:EE:FF",
  "name": "Meena's Band",
  "firmware_version": "1.2.3",
  "metadata": {
    "manufacturer": "Kinara",
    "model": "KB-100"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "device_type": "wristband",
    "hardware_id": "AA:BB:CC:DD:EE:FF",
    "api_key": "kn_device_xyz789...",
    "sync_config": {
      "batch_size": 100,
      "sync_interval_sec": 300,
      "endpoints": {
        "ingest": "https://api.kinara.health/api/v1/ingest"
      }
    },
    "created_at": "2025-01-19T10:30:00Z"
  }
}
```

#### Assign Device to User

```http
POST /api/v1/devices/{device_id}/assign
Authorization: Bearer {token}
Content-Type: application/json

{
  "user_id": "660e8400-e29b-41d4-a716-446655440001"
}
```

#### List Devices

```http
GET /api/v1/devices?user_id={user_id}&device_type=wristband
Authorization: Bearer {token}
```

#### Get Device Status

```http
GET /api/v1/devices/{device_id}/status
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "device_id": "770e8400-e29b-41d4-a716-446655440002",
    "online": true,
    "last_seen_at": "2025-01-19T10:25:00Z",
    "battery_level": 78,
    "firmware_version": "1.2.3",
    "readings_today": 1234,
    "sync_status": "synced"
  }
}
```

---

### Data Ingestion

#### Ingest Readings (Batch)

```http
POST /api/v1/ingest/readings
X-API-Key: kn_device_xyz789...
Content-Type: application/json

{
  "device_id": "770e8400-e29b-41d4-a716-446655440002",
  "readings": [
    {
      "timestamp": "2025-01-19T10:30:00Z",
      "type": "temperature",
      "value": 36.8,
      "unit": "celsius",
      "quality": 0.95
    },
    {
      "timestamp": "2025-01-19T10:30:00Z",
      "type": "heart_rate",
      "value": 72,
      "unit": "bpm",
      "quality": 0.98
    },
    {
      "timestamp": "2025-01-19T10:30:00Z",
      "type": "hrv_rmssd",
      "value": 45.2,
      "unit": "ms",
      "quality": 0.92
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accepted": 3,
    "rejected": 0,
    "batch_id": "batch_abc123"
  }
}
```

#### Supported Reading Types

| Type | Unit | Range | Description |
|------|------|-------|-------------|
| `temperature` | celsius | 30.0 - 45.0 | Skin temperature |
| `heart_rate` | bpm | 30 - 250 | Heart rate |
| `hrv_rmssd` | ms | 0 - 200 | HRV RMSSD |
| `hrv_sdnn` | ms | 0 - 300 | HRV SDNN |
| `spo2` | percent | 70 - 100 | Blood oxygen |
| `gsr` | microsiemens | 0 - 100 | Galvanic skin response |
| `steps` | count | 0 - 100000 | Step count |
| `sleep_stage` | enum | wake/light/deep/rem | Sleep stage |

#### Ingest Event (Single)

```http
POST /api/v1/ingest/events
X-API-Key: kn_device_xyz789...
Content-Type: application/json

{
  "device_id": "770e8400-e29b-41d4-a716-446655440002",
  "event_type": "hot_flash_reported",
  "timestamp": "2025-01-19T10:35:00Z",
  "severity": "moderate",
  "data": {
    "duration_seconds": 180,
    "triggered_cooling": true,
    "user_reported": true
  }
}
```

---

### Readings Query

#### Get Readings

```http
GET /api/v1/readings?user_id={user_id}&type=temperature&start=2025-01-19T00:00:00Z&end=2025-01-19T23:59:59Z&resolution=1h
Authorization: Bearer {token}
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| user_id | UUID | Yes | User ID |
| type | string | No | Reading type filter |
| start | ISO8601 | Yes | Start time |
| end | ISO8601 | Yes | End time |
| resolution | string | No | Aggregation: raw, 1m, 5m, 1h, 1d |
| limit | int | No | Max results (default 1000) |

**Response (raw):**
```json
{
  "success": true,
  "data": {
    "readings": [
      {
        "timestamp": "2025-01-19T10:30:00Z",
        "type": "temperature",
        "value": 36.8,
        "unit": "celsius",
        "quality": 0.95
      },
      ...
    ],
    "meta": {
      "count": 1440,
      "start": "2025-01-19T00:00:00Z",
      "end": "2025-01-19T23:59:59Z"
    }
  }
}
```

**Response (aggregated 1h):**
```json
{
  "success": true,
  "data": {
    "readings": [
      {
        "bucket": "2025-01-19T10:00:00Z",
        "type": "temperature",
        "avg": 36.75,
        "min": 36.2,
        "max": 37.1,
        "stddev": 0.15,
        "count": 60
      },
      ...
    ]
  }
}
```

#### Get Latest Readings

```http
GET /api/v1/readings/latest?user_id={user_id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "temperature": {
      "value": 36.8,
      "timestamp": "2025-01-19T10:30:00Z",
      "unit": "celsius"
    },
    "heart_rate": {
      "value": 72,
      "timestamp": "2025-01-19T10:30:00Z",
      "unit": "bpm"
    },
    "hrv_rmssd": {
      "value": 45.2,
      "timestamp": "2025-01-19T10:30:00Z",
      "unit": "ms"
    }
  }
}
```

---

### Predictions (ML)

#### Get Hot Flash Prediction

```http
POST /api/v1/predictions/hot-flash
Authorization: Bearer {token}
Content-Type: application/json

{
  "user_id": "660e8400-e29b-41d4-a716-446655440001",
  "current_readings": {
    "temperature": 36.8,
    "heart_rate": 72,
    "hrv_rmssd": 45.2,
    "gsr": 2.5
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "prediction": {
      "probability": 0.78,
      "confidence": 0.85,
      "eta_seconds": 90,
      "severity_estimate": "moderate"
    },
    "recommendations": [
      {
        "action": "start_breathing",
        "description": "Begin paced breathing exercise"
      },
      {
        "action": "activate_cooling",
        "description": "Activate cooling device"
      }
    ],
    "model": {
      "name": "hot_flash_predictor",
      "version": "1.2.0"
    }
  }
}
```

#### Get Sleep Analysis

```http
GET /api/v1/predictions/sleep?user_id={user_id}&date=2025-01-18
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2025-01-18",
    "summary": {
      "total_sleep_minutes": 420,
      "sleep_efficiency": 0.85,
      "sleep_score": 78
    },
    "stages": {
      "wake_minutes": 45,
      "light_minutes": 210,
      "deep_minutes": 90,
      "rem_minutes": 75
    },
    "events": {
      "hot_flashes": 2,
      "awakenings": 4
    },
    "trends": {
      "vs_last_week": "+5%",
      "vs_last_month": "-2%"
    }
  }
}
```

---

### Insights & Analytics

#### Get User Insights

```http
GET /api/v1/insights/{user_id}?period=30d
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2024-12-20",
      "end": "2025-01-19",
      "days": 30
    },
    "hot_flashes": {
      "total": 45,
      "daily_average": 1.5,
      "trend": "decreasing",
      "trend_percent": -15,
      "peak_hours": [14, 22, 3],
      "by_severity": {
        "mild": 20,
        "moderate": 18,
        "severe": 7
      }
    },
    "triggers_identified": [
      {
        "trigger": "coffee",
        "confidence": 0.82,
        "occurrences": 12,
        "recommendation": "Reduce caffeine after 2 PM"
      },
      {
        "trigger": "stress",
        "confidence": 0.75,
        "occurrences": 8,
        "recommendation": "Practice breathing exercises during work"
      },
      {
        "trigger": "spicy_food",
        "confidence": 0.68,
        "occurrences": 5,
        "recommendation": "Moderate spicy food intake"
      }
    ],
    "sleep": {
      "avg_duration_minutes": 385,
      "avg_efficiency": 0.78,
      "nights_with_hot_flash": 18,
      "trend": "stable"
    },
    "recommendations": [
      "Your hot flashes are most frequent at 2 PM and 10 PM. Consider preemptive cooling.",
      "Coffee appears to be a trigger. Try reducing intake after lunch.",
      "Your sleep efficiency improved 5% this week. Keep up the consistent bedtime."
    ]
  }
}
```

#### Get Trigger Analysis

```http
GET /api/v1/insights/{user_id}/triggers?period=90d
Authorization: Bearer {token}
```

#### Get Population Analytics (Admin)

```http
GET /api/v1/insights/population?period=30d
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "active_users": 1234,
    "total_readings": 15678900,
    "hot_flashes_detected": 4567,
    "prediction_accuracy": 0.82,
    "avg_symptom_reduction": 0.35,
    "top_triggers": [
      {"trigger": "stress", "percent": 45},
      {"trigger": "caffeine", "percent": 32},
      {"trigger": "alcohol", "percent": 28}
    ]
  }
}
```

---

### Events

#### List Events

```http
GET /api/v1/events?user_id={user_id}&type=hot_flash&start=2025-01-01&end=2025-01-19
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "evt_123",
        "timestamp": "2025-01-19T14:30:00Z",
        "type": "hot_flash_detected",
        "severity": "moderate",
        "confidence": 0.85,
        "data": {
          "duration_seconds": 180,
          "peak_temp_delta": 1.2,
          "triggered_action": "cooling_activated"
        }
      }
    ],
    "pagination": {...}
  }
}
```

#### Log Custom Event

```http
POST /api/v1/events
Authorization: Bearer {token}
Content-Type: application/json

{
  "user_id": "660e8400-e29b-41d4-a716-446655440001",
  "event_type": "symptom_logged",
  "timestamp": "2025-01-19T10:30:00Z",
  "data": {
    "symptom": "mood_swing",
    "severity": 3,
    "notes": "Feeling irritable after lunch meeting"
  }
}
```

---

### Reports

#### Generate Report

```http
POST /api/v1/reports
Authorization: Bearer {token}
Content-Type: application/json

{
  "user_id": "660e8400-e29b-41d4-a716-446655440001",
  "type": "monthly_summary",
  "period": {
    "start": "2025-01-01",
    "end": "2025-01-31"
  },
  "format": "pdf",
  "include": ["hot_flashes", "sleep", "triggers", "recommendations"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "report_id": "rpt_abc123",
    "status": "generating",
    "estimated_seconds": 30
  }
}
```

#### Get Report Status

```http
GET /api/v1/reports/{report_id}
Authorization: Bearer {token}
```

**Response (complete):**
```json
{
  "success": true,
  "data": {
    "report_id": "rpt_abc123",
    "status": "complete",
    "download_url": "https://cdn.kinara.health/reports/rpt_abc123.pdf",
    "expires_at": "2025-01-20T10:30:00Z"
  }
}
```

---

### Webhooks

#### Register Webhook

```http
POST /api/v1/webhooks
Authorization: Bearer {token}
Content-Type: application/json

{
  "url": "https://yourapp.com/kinara-webhook",
  "events": ["hot_flash.detected", "device.offline", "prediction.high_risk"],
  "secret": "your_webhook_secret"
}
```

#### Webhook Payload

```json
{
  "id": "evt_webhook_123",
  "type": "hot_flash.detected",
  "timestamp": "2025-01-19T10:30:00Z",
  "data": {
    "user_id": "660e8400-e29b-41d4-a716-446655440001",
    "severity": "moderate",
    "confidence": 0.85
  },
  "signature": "sha256=abc123..."
}
```

---

### WebSocket API

#### Connect

```javascript
const ws = new WebSocket('wss://api.kinara.health/ws');

ws.onopen = () => {
  // Authenticate
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'Bearer eyJhbGciOiJIUzI1NiIs...'
  }));
};
```

#### Subscribe to User Stream

```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'readings',
  user_id: '660e8400-e29b-41d4-a716-446655440001'
}));
```

#### Receive Real-time Data

```javascript
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  // Types: reading, prediction, alert, event
  if (data.type === 'reading') {
    console.log('New reading:', data.payload);
  }

  if (data.type === 'prediction') {
    console.log('Hot flash prediction:', data.payload);
  }
};
```

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ],
    "request_id": "req_abc123"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

---

## Rate Limits

| Plan | Requests/minute | Requests/day |
|------|-----------------|--------------|
| Starter | 100 | 10,000 |
| Growth | 500 | 100,000 |
| Enterprise | 2,000 | Unlimited |

Rate limit headers:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705661460
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import { KinaraClient } from '@kinara/sdk';

const client = new KinaraClient({
  apiKey: 'kn_live_abc123...',
  baseUrl: 'https://api.kinara.health'
});

// Ingest readings
await client.ingest.readings({
  deviceId: 'device_123',
  readings: [
    { type: 'temperature', value: 36.8, timestamp: new Date() }
  ]
});

// Get prediction
const prediction = await client.predictions.hotFlash({
  userId: 'user_123',
  currentReadings: { temperature: 36.8, heartRate: 72 }
});

console.log(`Hot flash probability: ${prediction.probability}`);
```

### Python

```python
from kinara import KinaraClient

client = KinaraClient(api_key='kn_live_abc123...')

# Ingest readings
client.ingest.readings(
    device_id='device_123',
    readings=[
        {'type': 'temperature', 'value': 36.8, 'timestamp': datetime.now()}
    ]
)

# Get insights
insights = client.insights.get(user_id='user_123', period='30d')
print(f"Hot flash trend: {insights.hot_flashes.trend}")
```

### cURL

```bash
# Get prediction
curl -X POST https://api.kinara.health/api/v1/predictions/hot-flash \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_123",
    "current_readings": {
      "temperature": 36.8,
      "heart_rate": 72
    }
  }'
```

---

## Changelog

### v1.0.0 (2025-01-19)
- Initial API release
- Core endpoints: auth, users, devices, readings, predictions, insights

---

## Support

- **Documentation**: https://docs.kinara.health
- **Status**: https://status.kinara.health
- **Email**: api-support@kinara.health
