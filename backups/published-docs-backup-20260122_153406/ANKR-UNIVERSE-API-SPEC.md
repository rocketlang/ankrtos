# ANKR Universe - API Specification

> **Complete API Reference for the Unified Showcase Platform**

**Version:** 1.0.0
**Base URL:** `https://api.universe.ankr.ai`
**WebSocket:** `wss://api.universe.ankr.ai/ws`

---

## Table of Contents

1. [Authentication](#authentication)
2. [GraphQL API](#graphql-api)
3. [REST Endpoints](#rest-endpoints)
4. [WebSocket Protocol](#websocket-protocol)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)

---

## Authentication

### Methods

| Method | Header | Use Case |
|--------|--------|----------|
| JWT Token | `Authorization: Bearer <token>` | User sessions |
| API Key | `X-API-Key: ak_<key>` | Programmatic access |
| WebSocket | Token in connection payload | Real-time |

### JWT Token Structure

```json
{
  "sub": "user_cuid123",
  "email": "user@example.com",
  "phone": "+919876543210",
  "name": "User Name",
  "role": "user",
  "language": "hi",
  "iat": 1737331200,
  "exp": 1737360000
}
```

### Authentication Endpoints

#### Phone OTP Login

```http
POST /api/v1/auth/otp/request
Content-Type: application/json

{
  "phone": "+919876543210"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent",
  "expiresIn": 300
}
```

#### Verify OTP

```http
POST /api/v1/auth/otp/verify
Content-Type: application/json

{
  "phone": "+919876543210",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_cuid123",
    "phone": "+919876543210",
    "name": null,
    "language": "en"
  }
}
```

---

## GraphQL API

**Endpoint:** `POST /graphql`

### Conversations

#### Start Conversation

```graphql
mutation StartConversation($input: StartConversationInput!) {
  startConversation(input: $input) {
    id
    persona
    language
    status
    startedAt
  }
}
```

**Variables:**
```json
{
  "input": {
    "persona": "SWAYAM",
    "language": "HI",
    "initialMessage": "नमस्ते"
  }
}
```

**Response:**
```json
{
  "data": {
    "startConversation": {
      "id": "conv_abc123",
      "persona": "SWAYAM",
      "language": "HI",
      "status": "ACTIVE",
      "startedAt": "2026-01-19T10:00:00Z"
    }
  }
}
```

#### Send Message

```graphql
mutation SendMessage($input: SendMessageInput!) {
  sendMessage(input: $input) {
    userMessage {
      id
      role
      content
      intent {
        primary
        domain
        confidence
      }
      entities {
        type
        value
        normalized
      }
    }
    assistantMessage {
      id
      role
      content
      tier
      model
      latencyMs
      costUsd
      toolsUsed
    }
    toolExecutions {
      id
      toolId
      toolName
      status
      output
      latencyMs
    }
    routing {
      tier
      reason
      confidence
      latencyMs
      costUsd
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "conversationId": "conv_abc123",
    "content": "Calculate GST on ₹50,000",
    "contentType": "TEXT"
  }
}
```

**Response:**
```json
{
  "data": {
    "sendMessage": {
      "userMessage": {
        "id": "msg_user_001",
        "role": "USER",
        "content": "Calculate GST on ₹50,000",
        "intent": {
          "primary": "gst_calculate",
          "domain": "COMPLIANCE",
          "confidence": 0.95
        },
        "entities": [
          {
            "type": "AMOUNT",
            "value": "₹50,000",
            "normalized": "50000"
          }
        ]
      },
      "assistantMessage": {
        "id": "msg_asst_001",
        "role": "ASSISTANT",
        "content": "₹50,000 पर GST (18%):\n\n• CGST (9%): ₹4,500\n• SGST (9%): ₹4,500\n• **Total GST: ₹9,000**\n• **Grand Total: ₹59,000**",
        "tier": "SLM",
        "model": "qwen2.5:1.5b",
        "latencyMs": 127,
        "costUsd": 0.0001,
        "toolsUsed": ["gst_calculate"]
      },
      "toolExecutions": [
        {
          "id": "exec_001",
          "toolId": "gst_calculate",
          "toolName": "GST Calculator",
          "status": "COMPLETED",
          "output": {
            "baseAmount": 50000,
            "gstRate": 18,
            "cgst": 4500,
            "sgst": 4500,
            "totalGst": 9000,
            "grandTotal": 59000
          },
          "latencyMs": 45
        }
      ],
      "routing": {
        "tier": "SLM",
        "reason": "High confidence intent match, entities extracted",
        "confidence": 0.95,
        "latencyMs": 127,
        "costUsd": 0.0001
      }
    }
  }
}
```

#### Get Conversation History

```graphql
query GetConversation($id: ID!, $first: Int, $after: String) {
  conversation(id: $id) {
    id
    title
    persona
    language
    status
    turnCount
    totalLatencyMs
    totalCostUsd
    messages(first: $first, after: $after) {
      edges {
        node {
          id
          role
          content
          intent { primary domain }
          tier
          latencyMs
          createdAt
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
    startedAt
    endedAt
  }
}
```

### Tools

#### List Tools

```graphql
query ListTools($category: String, $search: String, $featured: Boolean) {
  tools(category: $category, search: $search, featured: $featured) {
    id
    name
    description
    category
    inputSchema
    examples {
      description
      input
      output
    }
    languages
    isFeatured
    usageCount
    avgLatencyMs
    successRate
  }
}
```

#### Get Tool Categories

```graphql
query GetToolCategories {
  toolCategories {
    id
    name
    icon
    description
    count
  }
}
```

**Response:**
```json
{
  "data": {
    "toolCategories": [
      {
        "id": "compliance",
        "name": "GST & Compliance",
        "icon": "FileText",
        "description": "GST, TDS, ITR, E-Way Bill, E-Invoice tools",
        "count": 54
      },
      {
        "id": "banking",
        "name": "Banking & Finance",
        "icon": "CreditCard",
        "description": "UPI, EMI, Loans, Credit, Insurance tools",
        "count": 28
      }
      // ... 8 more categories
    ]
  }
}
```

#### Execute Tool Directly

```graphql
mutation ExecuteTool($input: ExecuteToolInput!) {
  executeTool(input: $input) {
    execution {
      id
      toolId
      toolName
      status
      tier
      routingReason
      startedAt
      completedAt
      latencyMs
      costUsd
    }
    output
  }
}
```

**Variables:**
```json
{
  "input": {
    "toolId": "gst_calculate",
    "parameters": {
      "amount": 100000,
      "hsnCode": "8471",
      "isInterstate": false
    }
  }
}
```

### Packages

#### List Packages

```graphql
query ListPackages($category: String, $search: String) {
  packages(category: $category, search: $search) {
    id
    name
    version
    description
    category
    downloads
    stars
    repository
    keywords
  }
}
```

#### Get Package Details

```graphql
query GetPackage($id: ID!) {
  package(id: $id) {
    id
    name
    version
    description
    category
    readme
    changelog
    apiDocs
    downloads
    stars
    repository
    homepage
    keywords
    dependencies
    peerDependencies
  }
}
```

### Memory (EON)

#### Search Memories

```graphql
query SearchMemories($type: MemoryType, $search: String, $limit: Int) {
  memories(type: $type, search: $search, limit: $limit) {
    id
    type
    scope
    content
    source
    confidence
    accessCount
    createdAt
  }
}
```

#### Add Memory

```graphql
mutation AddMemory($input: AddMemoryInput!) {
  addMemory(input: $input) {
    id
    type
    content
    confidence
    createdAt
  }
}
```

**Variables:**
```json
{
  "input": {
    "type": "SEMANTIC",
    "content": "User prefers responses in Hindi",
    "scope": "USER"
  }
}
```

#### Get Memory Stats

```graphql
query GetMemoryStats {
  memoryStats {
    totalMemories
    byType {
      episodic
      semantic
      procedural
    }
    recentActivity {
      stored
      recalled
      forgotten
    }
  }
}
```

### System Status (Pulse)

#### Get System Status

```graphql
query GetSystemStatus {
  systemStatus {
    overall
    services {
      name
      status
      latencyMs
      uptime
      port
    }
    metrics {
      totalQueriesToday
      avgLatencyMs
      slmPercentage
      costSavingsPercent
      activeUsers
      activeConversations
    }
  }
}
```

**Response:**
```json
{
  "data": {
    "systemStatus": {
      "overall": "HEALTHY",
      "services": [
        { "name": "Gateway", "status": "HEALTHY", "latencyMs": 12, "uptime": 99.99, "port": 4500 },
        { "name": "AI Proxy", "status": "HEALTHY", "latencyMs": 45, "uptime": 99.95, "port": 4444 },
        { "name": "EON Memory", "status": "HEALTHY", "latencyMs": 8, "uptime": 99.99, "port": 4005 },
        { "name": "Ollama SLM", "status": "HEALTHY", "latencyMs": 120, "uptime": 99.9, "port": 11434 },
        { "name": "PostgreSQL", "status": "HEALTHY", "latencyMs": 3, "uptime": 99.99, "port": 5432 },
        { "name": "Redis", "status": "HEALTHY", "latencyMs": 1, "uptime": 99.99, "port": 6379 }
      ],
      "metrics": {
        "totalQueriesToday": 52341,
        "avgLatencyMs": 187,
        "slmPercentage": 72.5,
        "costSavingsPercent": 93.2,
        "activeUsers": 1247,
        "activeConversations": 328
      }
    }
  }
}
```

#### Get Tier Distribution

```graphql
query GetTierDistribution {
  tierDistribution {
    eon { count percentage avgLatencyMs }
    deterministic { count percentage avgLatencyMs }
    slm { count percentage avgLatencyMs }
    llm { count percentage avgLatencyMs }
  }
}
```

### Subscriptions

#### Message Added

```graphql
subscription OnMessageAdded($conversationId: ID!) {
  messageAdded(conversationId: $conversationId) {
    id
    role
    content
    tier
    latencyMs
    createdAt
  }
}
```

#### Tool Execution Updated

```graphql
subscription OnToolExecutionUpdated($conversationId: ID!) {
  toolExecutionUpdated(conversationId: $conversationId) {
    id
    toolId
    toolName
    status
    progress
    output
    latencyMs
  }
}
```

#### System Metrics

```graphql
subscription OnSystemMetrics {
  systemMetrics {
    timestamp
    queriesPerMinute
    avgLatencyMs
    tierBreakdown {
      tier
      count
    }
    costUsd
  }
}
```

#### Activity Stream

```graphql
subscription OnActivityStream {
  activityStream {
    id
    type
    data
    timestamp
  }
}
```

---

## REST Endpoints

### Health Checks

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-19T10:00:00Z",
  "version": "1.0.0"
}
```

```http
GET /ready
```

**Response:**
```json
{
  "status": "ready",
  "checks": [
    { "name": "database", "healthy": true, "latencyMs": 3 },
    { "name": "redis", "healthy": true, "latencyMs": 1 },
    { "name": "ollama", "healthy": true, "latencyMs": 50 }
  ]
}
```

### Metrics

```http
GET /metrics
```

**Response (Prometheus format):**
```
# HELP ankr_requests_total Total requests
# TYPE ankr_requests_total counter
ankr_requests_total{tier="slm"} 38234
ankr_requests_total{tier="llm"} 2341

# HELP ankr_latency_ms Request latency in milliseconds
# TYPE ankr_latency_ms histogram
ankr_latency_ms_bucket{le="50"} 12345
ankr_latency_ms_bucket{le="100"} 28456
ankr_latency_ms_bucket{le="200"} 35678
```

### Tool Execution (REST Alternative)

```http
POST /api/v1/tools/execute
Authorization: Bearer <token>
Content-Type: application/json

{
  "toolId": "gst_calculate",
  "parameters": {
    "amount": 50000
  }
}
```

**Response:**
```json
{
  "success": true,
  "executionId": "exec_abc123",
  "toolId": "gst_calculate",
  "output": {
    "baseAmount": 50000,
    "gstRate": 18,
    "cgst": 4500,
    "sgst": 4500,
    "totalGst": 9000,
    "grandTotal": 59000
  },
  "latencyMs": 45,
  "tier": "deterministic"
}
```

---

## WebSocket Protocol

### Connection

```javascript
const ws = new WebSocket('wss://api.universe.ankr.ai/ws');

// Connect with auth
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'connect',
    payload: {
      token: 'eyJhbGciOiJIUzI1NiIs...',
      language: 'hi',
      persona: 'swayam'
    }
  }));
};
```

### Message Types

| Type | Direction | Description |
|------|-----------|-------------|
| `connect` | Client → Server | Initial authentication |
| `connected` | Server → Client | Connection confirmed |
| `ping` | Client → Server | Heartbeat |
| `pong` | Server → Client | Heartbeat response |
| `conversation:start` | Client → Server | Start new conversation |
| `conversation:started` | Server → Client | Conversation created |
| `message:send` | Client → Server | Send user message |
| `message:typing` | Server → Client | AI is typing |
| `message:received` | Server → Client | Message response |
| `voice:start` | Client → Server | Start voice input |
| `voice:audio` | Client → Server | Audio chunk |
| `voice:end` | Client → Server | End voice input |
| `voice:transcript` | Server → Client | Speech-to-text result |
| `voice:response` | Server → Client | TTS audio URL |
| `tool:executing` | Server → Client | Tool started |
| `tool:progress` | Server → Client | Tool progress (0-100%) |
| `tool:completed` | Server → Client | Tool finished |
| `tool:failed` | Server → Client | Tool error |
| `memory:stored` | Server → Client | Memory saved |
| `memory:recalled` | Server → Client | Memories retrieved |
| `routing:decision` | Server → Client | SLM tier decision |
| `metrics:update` | Server → Client | System metrics |
| `activity` | Server → Client | Activity event |
| `error` | Server → Client | Error message |

### Example: Full Conversation Flow

```javascript
// 1. Connect
ws.send({
  type: 'connect',
  payload: { token: 'jwt...' }
});

// 2. Receive connected
// { type: 'connected', payload: { sessionId: 'sess_123', userId: 'user_456' } }

// 3. Start conversation
ws.send({
  type: 'conversation:start',
  payload: { persona: 'SWAYAM', language: 'HI' }
});

// 4. Receive conversation:started
// { type: 'conversation:started', payload: { conversationId: 'conv_789' } }

// 5. Send message
ws.send({
  type: 'message:send',
  payload: {
    conversationId: 'conv_789',
    content: 'Calculate GST on 50000',
    contentType: 'text'
  }
});

// 6. Receive events (in order):

// a) Typing indicator
// { type: 'message:typing', payload: { conversationId: 'conv_789' } }

// b) Routing decision
// { type: 'routing:decision', payload: { tier: 'SLM', confidence: 0.95 } }

// c) Tool executing
// { type: 'tool:executing', payload: { toolId: 'gst_calculate', executionId: 'exec_001' } }

// d) Tool progress
// { type: 'tool:progress', payload: { executionId: 'exec_001', progress: 50 } }

// e) Tool completed
// { type: 'tool:completed', payload: { executionId: 'exec_001', output: {...} } }

// f) Message received
// { type: 'message:received', payload: { message: {...}, routing: {...} } }

// g) Memory stored
// { type: 'memory:stored', payload: { memoryId: 'mem_001', type: 'episodic' } }
```

### Voice Flow

```javascript
// 1. Start voice
ws.send({
  type: 'voice:start',
  payload: {
    conversationId: 'conv_789',
    language: 'hi'
  }
});

// 2. Send audio chunks
ws.send({
  type: 'voice:audio',
  payload: {
    conversationId: 'conv_789',
    chunk: 'base64EncodedAudioData...',
    isFinal: false
  }
});

// 3. End voice
ws.send({
  type: 'voice:end',
  payload: { conversationId: 'conv_789' }
});

// 4. Receive transcript
// { type: 'voice:transcript', payload: { transcript: 'GST कैलकुलेट करो...', language: 'hi', confidence: 0.92 } }

// 5. Receive response (same as text flow)

// 6. Receive TTS
// { type: 'voice:response', payload: { audioUrl: 'https://...', text: '...', language: 'hi' } }
```

---

## Error Handling

### Error Response Format

```json
{
  "errors": [
    {
      "message": "Error description",
      "extensions": {
        "code": "ERROR_CODE",
        "requestId": "req_abc123",
        "details": {}
      }
    }
  ]
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHENTICATED` | 401 | Invalid or missing auth |
| `UNAUTHORIZED` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input |
| `RATE_LIMITED` | 429 | Too many requests |
| `TOOL_NOT_FOUND` | 404 | Tool doesn't exist |
| `TOOL_EXECUTION_FAILED` | 500 | Tool execution error |
| `SLM_UNAVAILABLE` | 503 | SLM service down |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Rate Limiting

| Tier | Limit | Window |
|------|-------|--------|
| Free | 100 requests | 1 minute |
| Pro | 1000 requests | 1 minute |
| Enterprise | Custom | Custom |

**Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1737331260
```

---

*API Version: 1.0.0 | Last Updated: 19 Jan 2026*
