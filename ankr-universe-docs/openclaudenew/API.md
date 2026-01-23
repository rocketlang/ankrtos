# OpenCode IDE API Documentation

## GraphQL API

**Endpoint:** `http://localhost:4040/graphql`
**WebSocket:** `ws://localhost:4040/graphql`

### Authentication

All requests require authentication via JWT token:

```
Authorization: Bearer <token>
```

## Queries

### Tools

#### Get Tool Manifests

```graphql
query GetToolManifests($filter: ToolManifestFilterInput, $pagination: PaginationInput) {
  toolManifests(filter: $filter, pagination: $pagination) {
    id
    name
    description
    category
    stability
    cost {
      perCall
      currency
    }
  }
}
```

#### Search Tools

```graphql
query SearchTools($query: String!) {
  searchToolManifests(query: $query) {
    id
    name
    description
  }
}
```

### Sessions

#### Get IDE Sessions

```graphql
query GetSessions {
  ideSessions {
    id
    projectName
    status
    createdAt
    stats {
      totalExecutions
      totalCost
    }
  }
}
```

### Memories

#### Get Session Memories

```graphql
query GetMemories($sessionId: ID!, $type: MemoryType) {
  ideSessionMemories(sessionId: $sessionId, type: $type) {
    id
    content
    importance
    type
    createdAt
  }
}
```

## Mutations

### Sessions

#### Create IDE Session

```graphql
mutation CreateSession($input: CreateIDESessionInput!) {
  createIDESession(input: $input) {
    id
    projectName
    directory
    status
  }
}
```

### Tool Execution

#### Execute Tool

```graphql
mutation ExecuteTool($input: ExecuteIDEToolInput!) {
  executeIDETool(input: $input) {
    id
    toolName
    result
    status
    executionTime
    cost {
      perCall
      currency
    }
  }
}
```

### AI Assistant

#### Generate Code

```graphql
mutation GenerateCode($input: AICodeGenerationInput!) {
  generateCode(input: $input) {
    code
    explanation
    metadata {
      model
      tokensUsed
      latencyMs
      cost
    }
  }
}
```

#### Review Code

```graphql
mutation ReviewCode($input: AICodeReviewInput!) {
  reviewCode(input: $input) {
    score
    summary
    issues {
      severity
      message
      line
      suggestion
    }
  }
}
```

### Memory

#### Store Memory

```graphql
mutation StoreMemory($sessionId: ID!, $type: MemoryType!, $content: String!) {
  storeIDEMemory(sessionId: $sessionId, type: $type, content: $content) {
    id
    content
    importance
  }
}
```

## Subscriptions

### Tool Execution

```graphql
subscription OnToolCompleted($sessionId: ID) {
  toolExecutionCompleted(sessionId: $sessionId) {
    id
    toolName
    status
    result
  }
}
```

### Cost Updates

```graphql
subscription OnCostUpdate {
  ideCostUpdate {
    totalCost
    dailyCost
    timestamp
  }
}
```

## Error Handling

All errors follow this format:

```json
{
  "errors": [
    {
      "message": "Error description",
      "extensions": {
        "code": "ERROR_CODE"
      }
    }
  ]
}
```

## Rate Limiting

- 100 requests per 15 minutes per IP
- 1000 requests per hour per user

## Pagination

```typescript
{
  page: 1,
  limit: 20,
  sortBy: "createdAt",
  sortOrder: "desc"
}
```
