# AnkrForge - API Specification

> REST & GraphQL API Reference for ankrforge.in

---

## Base URLs

| Environment | URL |
|-------------|-----|
| **Production** | `https://api.ankrforge.in/v1` |
| **Staging** | `https://api.staging.ankrforge.in/v1` |
| **Sandbox** | `https://api.sandbox.ankrforge.in/v1` |

---

## Authentication

### Bearer Token (JWT)
```http
Authorization: Bearer <access_token>
```

### API Key (Partners)
```http
X-Forge-API-Key: <api_key>
X-Forge-Secret: <api_secret>
```

### OAuth2 Flows
- **Authorization Code**: Web applications
- **PKCE**: Mobile applications
- **Client Credentials**: Server-to-server

---

## REST API Endpoints

### Authentication

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "phone": "+919876543210",
  "password": "securepassword",
  "name": "John Doe"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "userId": "usr_abc123",
    "email": "user@example.com",
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 3600
  }
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJ..."
}
```

#### Social Login
```http
POST /auth/social
Content-Type: application/json

{
  "provider": "google" | "apple",
  "token": "<provider_token>"
}
```

---

### Users

#### Get Current User
```http
GET /users/me
Authorization: Bearer <token>
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+919876543210",
    "scans": [
      {
        "id": "scn_xyz789",
        "bodyPart": "ear",
        "createdAt": "2026-01-15T10:30:00Z"
      }
    ],
    "orders": 5,
    "createdAt": "2025-06-01T00:00:00Z"
  }
}
```

#### Update User Profile
```http
PATCH /users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Smith",
  "phone": "+919876543211"
}
```

#### Delete Account
```http
DELETE /users/me
Authorization: Bearer <token>
```

---

### Scans

#### Upload Raw Scan
```http
POST /scans/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

body_part: ear
quality: high
scan_file: <binary PLY/OBJ file>
```

**Response**
```json
{
  "success": true,
  "data": {
    "scanId": "scn_xyz789",
    "status": "processing",
    "estimatedTime": 45,
    "webhookUrl": "wss://api.ankrforge.in/ws/scans/scn_xyz789"
  }
}
```

#### Get Scan Status
```http
GET /scans/{scanId}
Authorization: Bearer <token>
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": "scn_xyz789",
    "userId": "usr_abc123",
    "bodyPart": "ear",
    "status": "completed",
    "quality": {
      "score": 0.92,
      "issues": []
    },
    "measurements": {
      "canal_length": { "value": 22.5, "unit": "mm", "confidence": 0.95 },
      "canal_diameter": { "value": 6.8, "unit": "mm", "confidence": 0.93 },
      "concha_depth": { "value": 15.2, "unit": "mm", "confidence": 0.91 }
    },
    "meshUrl": "https://cdn.ankrforge.in/scans/scn_xyz789.glb",
    "previewUrl": "https://cdn.ankrforge.in/scans/scn_xyz789_preview.png",
    "createdAt": "2026-01-15T10:30:00Z",
    "processedAt": "2026-01-15T10:31:15Z"
  }
}
```

#### List User Scans
```http
GET /scans?bodyPart=ear&limit=10&offset=0
Authorization: Bearer <token>
```

#### Delete Scan
```http
DELETE /scans/{scanId}
Authorization: Bearer <token>
```

#### Get Scan Processing Guidance
```http
GET /scans/guidance/{bodyPart}
Authorization: Bearer <token>
```

**Response**
```json
{
  "success": true,
  "data": {
    "bodyPart": "ear",
    "instructions": [
      "Ensure good lighting",
      "Hold phone 15-20cm from ear",
      "Move slowly around the ear",
      "Capture full ear canal opening"
    ],
    "arOverlay": "https://cdn.ankrforge.in/ar/ear_guide.usdz",
    "estimatedDuration": 30,
    "tips": [
      "Remove earrings",
      "Pull hair back",
      "Use a mirror to guide"
    ]
  }
}
```

---

### Modules

#### List Available Modules
```http
GET /modules?bodyPart=ear&status=active
Authorization: Bearer <token>
```

**Response**
```json
{
  "success": true,
  "data": [
    {
      "id": "forge-audio",
      "name": "ForgeAudio",
      "description": "Custom-fit earbuds and audio devices",
      "bodyPart": "ear",
      "version": "1.0.0",
      "products": [
        {
          "id": "earbuds-pro",
          "name": "Custom Earbuds Pro",
          "description": "Premium custom-fit wireless earbuds",
          "basePrice": 4999,
          "currency": "INR",
          "previewImages": ["https://cdn.ankrforge.in/products/earbuds-pro-1.jpg"]
        },
        {
          "id": "ear-plugs",
          "name": "Sleep Ear Plugs",
          "description": "Perfect-fit noise blocking ear plugs",
          "basePrice": 1499,
          "currency": "INR"
        }
      ],
      "customizations": [
        {
          "id": "color",
          "type": "select",
          "options": ["black", "white", "navy", "coral"]
        },
        {
          "id": "material",
          "type": "select",
          "options": ["silicone-soft", "silicone-firm", "medical-grade"]
        }
      ]
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 10,
    "offset": 0
  }
}
```

#### Get Module Details
```http
GET /modules/{moduleId}
Authorization: Bearer <token>
```

#### Check Module Compatibility
```http
POST /modules/{moduleId}/compatibility
Authorization: Bearer <token>
Content-Type: application/json

{
  "scanId": "scn_xyz789"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "compatible": true,
    "score": 0.95,
    "warnings": [],
    "availableProducts": ["earbuds-pro", "ear-plugs", "hearing-aid-mold"]
  }
}
```

---

### Designs

#### Generate Design
```http
POST /designs/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "moduleId": "forge-audio",
  "productId": "earbuds-pro",
  "scanId": "scn_xyz789",
  "customizations": {
    "color": "navy",
    "material": "silicone-soft",
    "leftRight": "both"
  }
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "designId": "dsgn_abc456",
    "status": "generating",
    "estimatedTime": 25,
    "webhookUrl": "wss://api.ankrforge.in/ws/designs/dsgn_abc456"
  }
}
```

#### Get Design
```http
GET /designs/{designId}
Authorization: Bearer <token>
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": "dsgn_abc456",
    "moduleId": "forge-audio",
    "productId": "earbuds-pro",
    "scanId": "scn_xyz789",
    "status": "ready",
    "customizations": {
      "color": "navy",
      "material": "silicone-soft"
    },
    "preview": {
      "image2D": "https://cdn.ankrforge.in/designs/dsgn_abc456_preview.png",
      "model3D": "https://cdn.ankrforge.in/designs/dsgn_abc456_preview.glb"
    },
    "pricing": {
      "base": 4999,
      "customizations": 500,
      "shipping": 99,
      "total": 5598,
      "currency": "INR"
    },
    "manufacturingSpec": {
      "process": "sla",
      "material": "medical-silicone",
      "estimatedDays": 5
    },
    "createdAt": "2026-01-15T11:00:00Z",
    "expiresAt": "2026-01-22T11:00:00Z"
  }
}
```

#### Update Design Customizations
```http
PATCH /designs/{designId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "customizations": {
    "color": "coral"
  }
}
```

#### List User Designs
```http
GET /designs?status=ready&limit=10
Authorization: Bearer <token>
```

---

### Orders

#### Create Order
```http
POST /orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "designId": "dsgn_abc456",
  "shippingAddress": {
    "name": "John Doe",
    "line1": "123 Main Street",
    "line2": "Apt 4B",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postalCode": "400001",
    "country": "IN",
    "phone": "+919876543210"
  },
  "shippingMethod": "standard"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "orderId": "ord_def789",
    "status": "pending_payment",
    "total": 5598,
    "currency": "INR",
    "paymentOptions": {
      "upi": {
        "paymentLink": "upi://pay?pa=ankrforge@upi&pn=AnkrForge&am=5598",
        "qrCode": "https://api.ankrforge.in/payments/ord_def789/qr"
      },
      "razorpay": {
        "orderId": "order_razorpay_123",
        "key": "rzp_live_xxx"
      },
      "card": {
        "sessionUrl": "https://checkout.ankrforge.in/ord_def789"
      }
    },
    "expiresAt": "2026-01-15T12:00:00Z"
  }
}
```

#### Get Order
```http
GET /orders/{orderId}
Authorization: Bearer <token>
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": "ord_def789",
    "status": "manufacturing",
    "design": {
      "id": "dsgn_abc456",
      "productName": "Custom Earbuds Pro",
      "previewUrl": "https://cdn.ankrforge.in/designs/dsgn_abc456_preview.png"
    },
    "pricing": {
      "subtotal": 5499,
      "shipping": 99,
      "tax": 0,
      "total": 5598,
      "currency": "INR"
    },
    "payment": {
      "status": "completed",
      "method": "upi",
      "paidAt": "2026-01-15T11:30:00Z"
    },
    "manufacturing": {
      "status": "printing",
      "manufacturer": "Forge Manufacturing Mumbai",
      "startedAt": "2026-01-15T14:00:00Z",
      "estimatedCompletion": "2026-01-17T14:00:00Z",
      "progress": 45
    },
    "shipping": {
      "status": "pending",
      "address": {
        "name": "John Doe",
        "city": "Mumbai",
        "postalCode": "400001"
      },
      "method": "standard",
      "estimatedDelivery": "2026-01-20"
    },
    "timeline": [
      { "status": "created", "timestamp": "2026-01-15T11:15:00Z" },
      { "status": "paid", "timestamp": "2026-01-15T11:30:00Z" },
      { "status": "manufacturing_started", "timestamp": "2026-01-15T14:00:00Z" }
    ],
    "createdAt": "2026-01-15T11:15:00Z"
  }
}
```

#### List Orders
```http
GET /orders?status=active&limit=10
Authorization: Bearer <token>
```

#### Cancel Order
```http
POST /orders/{orderId}/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Changed my mind"
}
```

#### Request Return
```http
POST /orders/{orderId}/return
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "fit_issue",
  "description": "Too tight in left ear",
  "photos": ["https://..."]
}
```

---

### Payments

#### Create UPI Payment Link
```http
POST /payments/upi
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "ord_def789"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "paymentId": "pay_xyz123",
    "upiLink": "upi://pay?pa=ankrforge@icici&pn=AnkrForge&am=5598&tr=pay_xyz123",
    "qrCodeUrl": "https://api.ankrforge.in/payments/pay_xyz123/qr.png",
    "expiresAt": "2026-01-15T12:15:00Z"
  }
}
```

#### Check Payment Status
```http
GET /payments/{paymentId}
Authorization: Bearer <token>
```

#### Webhook: Payment Confirmation
```http
POST /webhooks/payment (Your server)
X-Forge-Signature: sha256=<signature>
Content-Type: application/json

{
  "event": "payment.completed",
  "paymentId": "pay_xyz123",
  "orderId": "ord_def789",
  "amount": 5598,
  "currency": "INR",
  "method": "upi",
  "timestamp": "2026-01-15T11:30:00Z"
}
```

---

### Manufacturing

#### Get Manufacturing Status
```http
GET /manufacturing/{orderId}
Authorization: Bearer <token>
```

**Response**
```json
{
  "success": true,
  "data": {
    "orderId": "ord_def789",
    "jobId": "job_mfg_456",
    "status": "printing",
    "manufacturer": {
      "id": "mfg_mumbai_01",
      "name": "Forge Manufacturing Mumbai",
      "location": "Mumbai, India"
    },
    "progress": {
      "percentage": 65,
      "currentStep": "printing",
      "steps": [
        { "name": "queued", "status": "completed", "completedAt": "2026-01-15T13:00:00Z" },
        { "name": "preparing", "status": "completed", "completedAt": "2026-01-15T13:30:00Z" },
        { "name": "printing", "status": "in_progress", "startedAt": "2026-01-15T14:00:00Z" },
        { "name": "curing", "status": "pending" },
        { "name": "finishing", "status": "pending" },
        { "name": "qc", "status": "pending" },
        { "name": "packaging", "status": "pending" }
      ]
    },
    "estimatedCompletion": "2026-01-17T14:00:00Z",
    "liveStream": "https://stream.ankrforge.in/jobs/job_mfg_456" // Optional live view
  }
}
```

---

### Shipping & Tracking

#### Get Tracking Info
```http
GET /shipping/{orderId}/tracking
Authorization: Bearer <token>
```

**Response**
```json
{
  "success": true,
  "data": {
    "orderId": "ord_def789",
    "carrier": "delhivery",
    "trackingNumber": "DEL123456789",
    "trackingUrl": "https://www.delhivery.com/track/DEL123456789",
    "status": "in_transit",
    "estimatedDelivery": "2026-01-20",
    "events": [
      {
        "status": "picked_up",
        "location": "Mumbai Hub",
        "timestamp": "2026-01-18T09:00:00Z"
      },
      {
        "status": "in_transit",
        "location": "Delhi Hub",
        "timestamp": "2026-01-19T06:00:00Z"
      }
    ]
  }
}
```

---

## GraphQL API

### Endpoint
```
POST https://api.ankrforge.in/graphql
Authorization: Bearer <token>
```

### Schema

```graphql
type Query {
  # User
  me: User!

  # Scans
  scan(id: ID!): Scan
  scans(bodyPart: BodyPart, limit: Int, offset: Int): ScanConnection!

  # Modules
  modules(bodyPart: BodyPart): [Module!]!
  module(id: ID!): Module

  # Designs
  design(id: ID!): Design
  designs(status: DesignStatus, limit: Int): [Design!]!

  # Orders
  order(id: ID!): Order
  orders(status: OrderStatus, limit: Int): [Order!]!
}

type Mutation {
  # Scans
  uploadScan(input: UploadScanInput!): ScanUploadResult!
  deleteScan(id: ID!): Boolean!

  # Designs
  generateDesign(input: GenerateDesignInput!): DesignGenerationResult!
  updateDesignCustomizations(id: ID!, customizations: JSON!): Design!

  # Orders
  createOrder(input: CreateOrderInput!): Order!
  cancelOrder(id: ID!, reason: String): Order!

  # Payments
  createPayment(orderId: ID!, method: PaymentMethod!): PaymentResult!
}

type Subscription {
  # Real-time scan processing
  scanProgress(scanId: ID!): ScanProgressEvent!

  # Real-time design generation
  designProgress(designId: ID!): DesignProgressEvent!

  # Order status updates
  orderUpdates(orderId: ID!): OrderUpdateEvent!

  # Manufacturing progress
  manufacturingProgress(orderId: ID!): ManufacturingEvent!
}

# Types
type User {
  id: ID!
  email: String!
  name: String
  phone: String
  scans: [Scan!]!
  orders: [Order!]!
  createdAt: DateTime!
}

type Scan {
  id: ID!
  bodyPart: BodyPart!
  status: ScanStatus!
  quality: QualityScore
  measurements: JSON
  meshUrl: String
  previewUrl: String
  compatibleModules: [Module!]!
  createdAt: DateTime!
}

type Module {
  id: ID!
  name: String!
  description: String
  bodyPart: BodyPart!
  version: String!
  products: [Product!]!
  customizations: [CustomizationOption!]!
}

type Product {
  id: ID!
  name: String!
  description: String
  basePrice: Float!
  currency: String!
  previewImages: [String!]!
}

type Design {
  id: ID!
  module: Module!
  product: Product!
  scan: Scan!
  status: DesignStatus!
  customizations: JSON!
  preview2D: String
  preview3D: String
  pricing: Pricing!
  createdAt: DateTime!
  expiresAt: DateTime
}

type Order {
  id: ID!
  design: Design!
  status: OrderStatus!
  pricing: Pricing!
  payment: Payment
  manufacturing: ManufacturingStatus
  shipping: ShippingInfo
  timeline: [TimelineEvent!]!
  createdAt: DateTime!
}

enum BodyPart {
  EAR
  FOOT
  TEETH
  HAND
  HEAD
  FULL_BODY
}

enum ScanStatus {
  UPLOADING
  PROCESSING
  COMPLETED
  FAILED
}

enum DesignStatus {
  GENERATING
  READY
  EXPIRED
  ORDERED
}

enum OrderStatus {
  PENDING_PAYMENT
  PAID
  MANUFACTURING
  SHIPPED
  DELIVERED
  CANCELLED
  RETURNED
}

enum PaymentMethod {
  UPI
  CARD
  NETBANKING
  WALLET
}

# Inputs
input UploadScanInput {
  bodyPart: BodyPart!
  quality: ScanQuality
  file: Upload!
}

input GenerateDesignInput {
  moduleId: ID!
  productId: ID!
  scanId: ID!
  customizations: JSON!
}

input CreateOrderInput {
  designId: ID!
  shippingAddress: AddressInput!
  shippingMethod: ShippingMethod!
}
```

### Example Queries

#### Get User with Scans and Orders
```graphql
query GetUserDashboard {
  me {
    id
    name
    email
    scans(limit: 5) {
      edges {
        node {
          id
          bodyPart
          status
          previewUrl
          createdAt
        }
      }
    }
    orders(limit: 5) {
      id
      status
      design {
        product {
          name
        }
        preview2D
      }
      pricing {
        total
        currency
      }
    }
  }
}
```

#### Generate Design
```graphql
mutation GenerateEarbudDesign {
  generateDesign(input: {
    moduleId: "forge-audio"
    productId: "earbuds-pro"
    scanId: "scn_xyz789"
    customizations: {
      color: "navy"
      material: "silicone-soft"
    }
  }) {
    designId
    status
    estimatedTime
  }
}
```

#### Subscribe to Order Updates
```graphql
subscription TrackOrder {
  orderUpdates(orderId: "ord_def789") {
    status
    timestamp
    details {
      ... on ManufacturingUpdate {
        progress
        currentStep
      }
      ... on ShippingUpdate {
        carrier
        trackingNumber
        location
      }
    }
  }
}
```

---

## WebSocket API

### Connection
```javascript
const ws = new WebSocket('wss://api.ankrforge.in/ws');
ws.send(JSON.stringify({
  type: 'auth',
  token: 'Bearer <access_token>'
}));
```

### Subscribe to Events
```javascript
// Subscribe to scan processing
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'scan:scn_xyz789'
}));

// Subscribe to order updates
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'order:ord_def789'
}));
```

### Event Messages
```javascript
// Scan progress
{
  "type": "scan.progress",
  "scanId": "scn_xyz789",
  "progress": 75,
  "step": "extracting_measurements"
}

// Design ready
{
  "type": "design.ready",
  "designId": "dsgn_abc456",
  "previewUrl": "https://..."
}

// Order status change
{
  "type": "order.status_changed",
  "orderId": "ord_def789",
  "status": "shipped",
  "trackingNumber": "DEL123456789"
}
```

---

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "SCAN_QUALITY_LOW",
    "message": "Scan quality is too low. Please rescan with better lighting.",
    "details": {
      "qualityScore": 0.35,
      "minimumRequired": 0.6,
      "suggestions": [
        "Improve lighting",
        "Hold phone steadier",
        "Move slower during capture"
      ]
    }
  }
}
```

### Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_INVALID_TOKEN` | 401 | Invalid or expired token |
| `AUTH_UNAUTHORIZED` | 403 | Insufficient permissions |
| `RESOURCE_NOT_FOUND` | 404 | Resource does not exist |
| `SCAN_QUALITY_LOW` | 400 | Scan quality below threshold |
| `SCAN_BODY_PART_MISMATCH` | 400 | Scan body part doesn't match module |
| `DESIGN_EXPIRED` | 400 | Design has expired |
| `ORDER_CANNOT_CANCEL` | 400 | Order cannot be cancelled |
| `PAYMENT_FAILED` | 402 | Payment processing failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |

---

## Rate Limits

| Tier | Requests/min | Scans/day | Designs/day |
|------|--------------|-----------|-------------|
| **Free** | 60 | 5 | 10 |
| **Pro** | 300 | 50 | 100 |
| **Partner** | 1000 | Unlimited | Unlimited |

Rate limit headers:
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1705312800
```

---

## SDK Downloads

- **JavaScript/TypeScript**: `npm install @ankrforge/sdk`
- **Python**: `pip install ankrforge`
- **Swift**: Swift Package Manager
- **Kotlin**: Maven Central

---

## Document References
- [Architecture](./ANKR-FORGE-ARCHITECTURE.md)
- [Module SDK](./ANKR-FORGE-MODULE-SDK.md)

---

*Last Updated: January 2026*
*Version: 1.0*
