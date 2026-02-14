# Vyomo Anomaly Detection - GraphQL API Complete Guide

## 🚀 Quick Start

### Server URLs
- **GraphQL Endpoint:** `http://localhost:4100/graphql`
- **WebSocket Subscriptions:** `ws://localhost:4100/subscriptions`
- **GraphQL Playground:** `http://localhost:4100/graphql` (interactive UI)

### Starting the Server

```bash
cd /root/ankr-labs-nx/packages/vyomo-anomaly-agent
npm install
npm run start:server

# Server starts on port 4100
# 🚀 GraphQL endpoint: http://localhost:4100/graphql
# 🔌 Subscriptions: ws://localhost:4100/subscriptions
```

---

## 📊 Complete GraphQL Schema

### 1. ANOMALY DETECTION

#### Detect Anomalies (Mutation)

```graphql
mutation DetectAnomalies($data: MarketDataInput!) {
  detectAnomalies(data: $data) {
    id
    symbol
    type
    severity
    detectedAt
    observedValue
    expectedValue
    deviationSigma
    metadata {
      windowSize
      threshold
      percentile
    }
  }
}

# Variables:
{
  "data": {
    "symbol": "NIFTY",
    "price": 23000,
    "volume": 150000,
    "timestamp": "2026-02-13T10:00:00Z",
    "optionData": {
      "strike": 22500,
      "impliedVolatility": 25.5,
      "openInterest": 150000,
      "bidAskSpread": 0.5
    }
  }
}

# Response:
{
  "data": {
    "detectAnomalies": [
      {
        "id": "anom-123",
        "symbol": "NIFTY",
        "type": "PRICE_SPIKE",
        "severity": "CRITICAL",
        "detectedAt": "2026-02-13T10:00:00Z",
        "observedValue": 23000,
        "expectedValue": 22500,
        "deviationSigma": 4.5,
        "metadata": {
          "windowSize": 50,
          "threshold": 3.0,
          "percentile": 99
        }
      }
    ]
  }
}
```

#### Query Anomalies

```graphql
# Get recent anomalies
query GetRecentAnomalies {
  recentAnomalies(limit: 10) {
    id
    symbol
    type
    severity
    observedValue
    expectedValue
    detectedAt
  }
}

# Get anomalies with filters
query GetAnomalies($filters: AnomalyFilters) {
  anomalies(filters: $filters) {
    id
    symbol
    type
    severity
    detectedAt
  }
}

# Variables:
{
  "filters": {
    "symbol": "NIFTY",
    "severity": "CRITICAL",
    "since": "2026-02-13T00:00:00Z",
    "limit": 50
  }
}
```

---

### 2. AI DECISIONS

#### Make Decision (Mutation)

```graphql
mutation MakeDecision(
  $anomalyId: String!
  $context: MarketContextInput!
) {
  makeDecision(anomalyId: $anomalyId, context: $context) {
    decision
    confidence
    reasoning
    suggestedActions
    estimatedImpact
    requiresHumanReview
    aiProvider
    modelUsed
    latencyMs
    timestamp
  }
}

# Variables:
{
  "anomalyId": "anom-123",
  "context": {
    "phase": "MIDDAY",
    "vix": 18.5,
    "marketSentiment": "NEUTRAL",
    "liquidityLevel": "HIGH",
    "recentNews": [
      "RBI maintains repo rate",
      "FII buying surge"
    ],
    "timestamp": "2026-02-13T10:00:00Z"
  }
}

# Response:
{
  "data": {
    "makeDecision": {
      "decision": "FIX_ANOMALY",
      "confidence": 95.2,
      "reasoning": [
        "Clear data error detected",
        "Price spike inconsistent with market conditions",
        "No corroborating news or events"
      ],
      "suggestedActions": [
        "Replace with rolling mean",
        "Alert data team",
        "Review data feed"
      ],
      "estimatedImpact": "LOW",
      "requiresHumanReview": false,
      "aiProvider": "claude-ai",
      "modelUsed": "claude-3.5-sonnet",
      "latencyMs": 45.2,
      "timestamp": "2026-02-13T10:00:01Z"
    }
  }
}
```

#### Override Decision (Mutation)

```graphql
mutation OverrideDecision(
  $anomalyId: String!
  $decision: DecisionType!
  $reason: String!
) {
  overrideDecision(
    anomalyId: $anomalyId
    decision: $decision
    reason: $reason
  ) {
    success
    message
    error
  }
}

# Variables:
{
  "anomalyId": "anom-123",
  "decision": "KEEP_ANOMALY",
  "reason": "Real market movement confirmed by multiple sources"
}
```

---

### 3. ACTIONS

#### Execute Action (Mutation)

```graphql
mutation ExecuteAction(
  $anomalyId: String!
  $decisionId: String!
) {
  executeAction(
    anomalyId: $anomalyId
    decisionId: $decisionId
  ) {
    success
    actionType
    actionsTaken
    originalValue
    correctedValue
    reviewId
    rollbackId
    timestamp
    executionTimeMs
  }
}

# Variables:
{
  "anomalyId": "anom-123",
  "decisionId": "decision-456"
}

# Response:
{
  "data": {
    "executeAction": {
      "success": true,
      "actionType": "FIX",
      "actionsTaken": [
        "Corrected value from 23000 to 22500 (rolling mean)",
        "Original value stored for rollback",
        "Fix action logged to audit trail"
      ],
      "originalValue": 23000,
      "correctedValue": 22500,
      "rollbackId": "rollback-789",
      "timestamp": "2026-02-13T10:00:02Z",
      "executionTimeMs": 4.8
    }
  }
}
```

#### Rollback Action (Mutation)

```graphql
mutation RollbackAction($actionId: String!) {
  rollbackAction(actionId: $actionId) {
    success
    message
    error
  }
}

# Variables:
{
  "actionId": "action-789"
}
```

#### Get Action History (Query)

```graphql
query GetActionHistory($limit: Int) {
  actionHistory(limit: $limit) {
    id
    timestamp
    result {
      success
      actionType
      actionsTaken
    }
    canRollback
    rolledBack
  }
}

# Variables:
{
  "limit": 20
}
```

---

### 4. BLOCKCHAIN

#### Query Blockchain

```graphql
# Get recent blocks
query GetBlockchain($limit: Int) {
  blockchain(limit: $limit) {
    id
    blockNumber
    blockType
    timestamp
    blockHash
    previousBlockHash
    verified
    data {
      anomalyId
      decisionId
      actionId
    }
  }
}

# Get block by number
query GetBlock($blockNumber: Int!) {
  blockByNumber(blockNumber: $blockNumber) {
    id
    blockNumber
    blockType
    blockHash
    timestamp
    verified
  }
}

# Get blocks by type
query GetBlocksByType($type: BlockType!) {
  blocksByType(type: $type) {
    id
    blockNumber
    blockType
    timestamp
  }
}

# Variables:
{
  "type": "ANOMALY_DETECTED"
}
```

#### Verify Blockchain (Query)

```graphql
query VerifyBlockchain {
  verifyBlockchain {
    isValid
    totalBlocks
    verifiedBlocks
    lastVerifiedBlock
    issues {
      blockNumber
      blockId
      issue
    }
  }
}

# Response:
{
  "data": {
    "verifyBlockchain": {
      "isValid": true,
      "totalBlocks": 1523,
      "verifiedBlocks": 1523,
      "lastVerifiedBlock": 1522,
      "issues": []
    }
  }
}
```

#### Get Blockchain Stats (Query)

```graphql
query GetBlockchainStats {
  blockchainStats {
    totalBlocks
    genesisBlocks
    anomalyBlocks
    decisionBlocks
    actionBlocks
    chainStartDate
    chainEndDate
    isValid
  }
}
```

#### Export Blockchain (Mutation)

```graphql
mutation ExportBlockchain($format: String!) {
  exportBlockchain(format: $format)
}

# Variables:
{
  "format": "json"  # or "csv"
}
```

---

### 5. NOTIFICATIONS

#### Send Notification (Mutation)

```graphql
mutation SendNotification(
  $anomalyId: String!
  $recipients: [NotificationRecipientInput!]!
) {
  sendNotification(
    anomalyId: $anomalyId
    recipients: $recipients
  ) {
    id
    type
    priority
    title
    message
    status
    sentAt
    deliveredAt
  }
}

# Variables:
{
  "anomalyId": "anom-123",
  "recipients": [
    {
      "userId": "admin",
      "email": "admin@example.com",
      "channels": ["EMAIL", "IN_APP"]
    }
  ]
}
```

#### Register Recipient (Mutation)

```graphql
mutation RegisterRecipient(
  $recipient: NotificationRecipientInput!
) {
  registerRecipient(recipient: $recipient) {
    success
    message
    error
  }
}

# Variables:
{
  "recipient": {
    "userId": "trader-001",
    "email": "trader@example.com",
    "phone": "+1234567890",
    "channels": ["EMAIL", "SMS", "PUSH"],
    "minPriority": "HIGH"
  }
}
```

#### Query Notifications

```graphql
query GetNotifications($filters: NotificationFilters) {
  notifications(filters: $filters) {
    id
    type
    priority
    title
    message
    status
    createdAt
    sentAt
    recipients {
      userId
      email
    }
  }
}

# Variables:
{
  "filters": {
    "priority": "URGENT",
    "status": "DELIVERED",
    "limit": 20
  }
}
```

#### Get Notification Stats (Query)

```graphql
query GetNotificationStats {
  notificationStats {
    totalSent
    totalDelivered
    totalFailed
    totalGrouped
    urgentCount
    highCount
    normalCount
    lowCount
    avgDeliveryTimeMs
  }
}
```

---

### 6. DASHBOARD

#### Get Dashboard Metrics (Query)

```graphql
query GetDashboard {
  dashboard {
    totalAnomalies
    criticalAnomalies
    warningAnomalies
    minorAnomalies

    totalDecisions
    fixDecisions
    keepDecisions
    reviewDecisions

    totalActions
    successfulActions
    failedActions

    totalNotifications
    blockchainBlocks
    blockchainValid

    avgDecisionLatencyMs
    avgActionLatencyMs

    last24Hours {
      anomalies {
        timestamp
        value
        label
      }
      decisions {
        timestamp
        value
      }
      actions {
        timestamp
        value
      }
    }
  }
}

# Response: Complete real-time dashboard metrics
```

---

### 7. SUBSCRIPTIONS (Real-time WebSocket)

#### Subscribe to Anomalies

```graphql
subscription OnAnomalyDetected {
  anomalyDetected {
    id
    symbol
    type
    severity
    observedValue
    expectedValue
    detectedAt
  }
}

# Client receives real-time updates:
{
  "data": {
    "anomalyDetected": {
      "id": "anom-124",
      "symbol": "NIFTY",
      "type": "VOLUME_SURGE",
      "severity": "WARNING",
      "observedValue": 250000,
      "expectedValue": 100000,
      "detectedAt": "2026-02-13T10:15:00Z"
    }
  }
}
```

#### Subscribe to AI Decisions

```graphql
subscription OnDecisionMade {
  decisionMade {
    decision
    confidence
    reasoning
    requiresHumanReview
  }
}
```

#### Subscribe to Actions

```graphql
subscription OnActionExecuted {
  actionExecuted {
    success
    actionType
    actionsTaken
    executionTimeMs
  }
}
```

#### Subscribe to Notifications

```graphql
subscription OnNotificationSent {
  notificationSent {
    id
    title
    priority
    recipients {
      userId
    }
  }
}
```

#### Subscribe to Blockchain Updates

```graphql
subscription OnBlockAdded {
  blockAdded {
    blockNumber
    blockType
    blockHash
    timestamp
  }
}
```

#### Subscribe to Dashboard Updates

```graphql
subscription OnDashboardUpdated {
  dashboardUpdated {
    totalAnomalies
    totalDecisions
    totalActions
  }
}
```

---

## 🔧 Client Examples

### JavaScript/TypeScript (Apollo Client)

```typescript
import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

// HTTP connection for queries and mutations
const httpLink = new HttpLink({
  uri: 'http://localhost:4100/graphql'
});

// WebSocket connection for subscriptions
const wsLink = new GraphQLWsLink(
  createClient({
    url: 'ws://localhost:4100/subscriptions'
  })
);

// Split based on operation type
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);

// Create Apollo Client
const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache()
});

// Use in React component
function AnomalyFeed() {
  const { data, loading } = useSubscription(ANOMALY_SUBSCRIPTION);

  return (
    <div>
      {data?.anomalyDetected && (
        <Alert severity={data.anomalyDetected.severity.toLowerCase()}>
          {data.anomalyDetected.symbol}: {data.anomalyDetected.type}
        </Alert>
      )}
    </div>
  );
}
```

### Python (GQL Client)

```python
from gql import gql, Client
from gql.transport.requests import RequestsHTTPTransport

# Create transport
transport = RequestsHTTPTransport(
    url='http://localhost:4100/graphql'
)

# Create client
client = Client(transport=transport, fetch_schema_from_transport=True)

# Query
query = gql('''
query GetRecentAnomalies {
  recentAnomalies(limit: 10) {
    id
    symbol
    type
    severity
  }
}
''')

# Execute
result = client.execute(query)
print(result)
```

### curl

```bash
# Query
curl -X POST http://localhost:4100/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { recentAnomalies(limit: 5) { id symbol type severity } }"
  }'

# Mutation with variables
curl -X POST http://localhost:4100/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation($data: MarketDataInput!) { detectAnomalies(data: $data) { id type } }",
    "variables": {
      "data": {
        "symbol": "NIFTY",
        "price": 23000,
        "volume": 150000,
        "timestamp": "2026-02-13T10:00:00Z"
      }
    }
  }'
```

---

## 📈 Complete Workflow Example

```graphql
# 1. Detect anomaly
mutation DetectAnomalies {
  detectAnomalies(data: {
    symbol: "NIFTY"
    price: 23000
    volume: 150000
    timestamp: "2026-02-13T10:00:00Z"
  }) {
    id
    type
    severity
  }
}
# Returns: { id: "anom-123", type: "PRICE_SPIKE", severity: "CRITICAL" }

# 2. Make AI decision
mutation MakeDecision {
  makeDecision(
    anomalyId: "anom-123"
    context: {
      phase: "MIDDAY"
      vix: 18
      timestamp: "2026-02-13T10:00:00Z"
    }
  ) {
    decision
    confidence
  }
}
# Returns: { decision: "FIX_ANOMALY", confidence: 95.2 }

# 3. Execute action
mutation ExecuteAction {
  executeAction(
    anomalyId: "anom-123"
    decisionId: "decision-456"
  ) {
    success
    actionType
    rollbackId
  }
}
# Returns: { success: true, actionType: "FIX", rollbackId: "rollback-789" }

# 4. Send notification
mutation SendNotification {
  sendNotification(
    anomalyId: "anom-123"
    recipients: [{
      userId: "admin"
      email: "admin@example.com"
    }]
  ) {
    id
    status
  }
}
# Returns: { id: "notif-012", status: "DELIVERED" }

# 5. Verify blockchain
query VerifyBlockchain {
  verifyBlockchain {
    isValid
    totalBlocks
  }
}
# Returns: { isValid: true, totalBlocks: 1523 }

# 6. Get dashboard
query GetDashboard {
  dashboard {
    totalAnomalies
    totalDecisions
    totalActions
  }
}
# Returns: { totalAnomalies: 2340, totalDecisions: 2340, totalActions: 2340 }
```

---

## 🎯 Best Practices

1. **Use Subscriptions for Real-time Updates:**
   - Subscribe to `anomalyDetected` for live anomaly feed
   - Subscribe to `dashboardUpdated` for metrics

2. **Use Mutations for Actions:**
   - Always use `detectAnomalies` mutation for new data
   - Use `executeAction` after getting AI decision

3. **Query for Historical Data:**
   - Use `anomalies(filters)` for filtered results
   - Use `actionHistory` for past actions

4. **Error Handling:**
   - All mutations return `OperationResult` with `success` and `error`
   - Check `success` field before proceeding

5. **Pagination:**
   - Use `limit` and `offset` parameters
   - Default limit is usually 100

---

**Full Documentation:** `/root/ankr-reports/VYOMO-ANOMALY-AGENT-WEEK4-PROGRESS_2026-02-13.md`
**GraphQL Endpoint:** `http://localhost:4100/graphql`
**WebSocket:** `ws://localhost:4100/subscriptions`
