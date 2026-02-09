# ANKR AI Proxy - Quick Reference Guide

**Endpoint:** `http://localhost:4444/graphql`
**Status:** ✅ Live (17 providers)
**Primary Provider:** DeepSeek V3 (FREE, GPT-4 level)

---

## 📋 Basic Usage

### Simple Query
```bash
curl -X POST http://localhost:4444/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation {
      complete(input: {prompt: \"Your prompt here\"}) {
        content provider latencyMs cost
      }
    }"
  }'
```

### With Options
```bash
curl -X POST http://localhost:4444/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation {
      complete(input: {
        prompt: \"Your prompt\",
        temperature: 0.3,
        maxTokens: 500,
        systemPrompt: \"You are an expert TypeScript developer\"
      }) {
        content provider model cost latencyMs
      }
    }"
  }'
```

---

## 🎯 ANKR-Specific Examples

### 1. Prisma Model Generation
```graphql
mutation {
  complete(input: {
    prompt: """
    Create a Prisma model for Invoice with:
    - invoiceNumber (unique)
    - customerId, shipmentId
    - subtotal, gstAmount, totalAmount
    - status (DRAFT, SENT, PAID, OVERDUE)
    - Include relations to Customer and Shipment
    """
  }) {
    content
    provider
    latencyMs
  }
}
```

### 2. Fastify GraphQL Resolver
```graphql
mutation {
  complete(input: {
    prompt: """
    Create a Fastify GraphQL resolver:
    - Query: getShipment(id: ID!)
    - Returns: Shipment with tracking info
    - Use Prisma client
    - Include error handling
    """
  }) {
    content
    provider
  }
}
```

### 3. React Component (Shadcn UI)
```graphql
mutation {
  complete(input: {
    prompt: """
    Create React component ShipmentStatusBadge:
    - Props: status (PENDING, IN_TRANSIT, DELIVERED, CANCELLED)
    - Use Shadcn UI Badge component
    - Color coding: yellow, blue, green, red
    - TypeScript types
    """
  }) {
    content
    provider
  }
}
```

### 4. GST Calculation
```graphql
mutation {
  complete(input: {
    prompt: """
    Create function calculateGST(amount, rate):
    - Returns: { baseAmount, cgst, sgst, igst, totalAmount }
    - Support rates: 5%, 12%, 18%, 28%
    - Handle interstate vs intrastate
    - TypeScript with validation
    """
  }) {
    content
    provider
  }
}
```

### 5. E-way Bill Validation
```graphql
mutation {
  complete(input: {
    prompt: """
    Create function validateEwayBillRequired:
    - Check: value > ₹50,000
    - Check: distance > 10km (intrastate) or any (interstate)
    - Return: { required: boolean, reason: string }
    - TypeScript types
    """
  }) {
    content
    provider
  }
}
```

### 6. Hindi/Hinglish Query
```graphql
mutation {
  complete(input: {
    prompt: "Invoice generate karne ka function banao jo PDF return kare. Customer details aur items array input mein le."
  }) {
    content
    provider
  }
}
```

### 7. Zod Validation Schema
```graphql
mutation {
  complete(input: {
    prompt: """
    Create Zod schema for customer form:
    - name (min 2 chars)
    - email (valid format)
    - phone (Indian: 10 digits)
    - gstNumber (optional, 15 chars)
    - panNumber (optional, 10 chars)
    Include regex patterns and error messages
    """
  }) {
    content
    provider
  }
}
```

### 8. React Hook (Apollo Client)
```graphql
mutation {
  complete(input: {
    prompt: """
    Create custom hook useShipmentTracking(trackingNumber):
    - Use Apollo Client for GraphQL query
    - Poll every 30s when IN_TRANSIT
    - Return: { shipment, loading, error, refetch }
    - TypeScript types
    """
  }) {
    content
    provider
  }
}
```

### 9. Unit Tests (Jest)
```graphql
mutation {
  complete(input: {
    prompt: """
    Write Jest tests for validateGSTNumber function:
    - Valid format
    - Invalid length, checksum, state code
    - Null/undefined, whitespace, lowercase
    Use describe/it blocks
    """
  }) {
    content
    provider
  }
}
```

### 10. GraphQL Schema
```graphql
mutation {
  complete(input: {
    prompt: """
    Create GraphQL schema for shipments:
    - Type: Shipment
    - Queries: getShipment, listShipments, searchShipments
    - Mutations: createShipment, updateShipment, cancelShipment
    - Include filters and pagination
    """
  }) {
    content
    provider
  }
}
```

---

## 🔧 Advanced Options

### With Temperature Control
```graphql
mutation {
  complete(input: {
    prompt: "Your prompt",
    temperature: 0.1    # More focused (0.0-1.0)
  }) {
    content
  }
}
```

### With Token Limits
```graphql
mutation {
  complete(input: {
    prompt: "Your prompt",
    maxTokens: 1000    # Limit output length
  }) {
    content
    outputTokens       # See actual tokens used
  }
}
```

### With System Prompt
```graphql
mutation {
  complete(input: {
    prompt: "Create an invoice model",
    systemPrompt: "You are an expert in Prisma and PostgreSQL. Follow ANKR naming conventions."
  }) {
    content
  }
}
```

### With Persona
```graphql
mutation {
  complete(input: {
    prompt: "Your prompt",
    persona: "captain"   # Use Captain Anil persona
  }) {
    content
  }
}
```

### Enable Tool Calling
```graphql
mutation {
  complete(input: {
    prompt: "Check if GST number 27AAPFU0939F1ZV is valid",
    enableTools: true,
    toolCategories: ["compliance", "validation"]
  }) {
    content
    toolsUsed
    toolCalls
  }
}
```

---

## 📊 Available Fields in Response

```graphql
type Completion {
  id: ID!
  requestId: String!
  content: String!           # Generated text/code
  provider: String!          # "deepseek", "groq", etc.
  model: String!             # "deepseek-chat"
  inputTokens: Int!          # Tokens in your prompt
  outputTokens: Int!         # Tokens in response
  totalTokens: Int!          # Total
  cost: Float!               # Cost ($0 for free providers)
  latencyMs: Int!            # Response time

  # Context & RAG
  contextUsed: Boolean!      # Was context injected?
  contextTokens: Int         # How many tokens from context
  compressionRatio: Float    # Context compression ratio
  ragDecision: String        # RAG decision (used/skipped)

  # Tool Calling
  toolsUsed: Boolean!        # Were tools called?
  toolIterations: Int        # Number of tool calls
  toolCalls: [String!]       # Which tools were used
}
```

---

## 🎨 Complete TypeScript Example

```typescript
import { GraphQLClient } from 'graphql-request';

const client = new GraphQLClient('http://localhost:4444/graphql');

interface AIResponse {
  complete: {
    content: string;
    provider: string;
    model: string;
    latencyMs: number;
    cost: number;
    inputTokens: number;
    outputTokens: number;
  };
}

async function generateCode(prompt: string, options?: {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}) {
  const query = `
    mutation($input: CompleteInput!) {
      complete(input: $input) {
        content
        provider
        model
        latencyMs
        cost
        inputTokens
        outputTokens
      }
    }
  `;

  const variables = {
    input: {
      prompt,
      ...options
    }
  };

  const response = await client.request<AIResponse>(query, variables);
  return response.complete;
}

// Usage
const result = await generateCode(
  'Create a Prisma model for Invoice with GST fields',
  { temperature: 0.3, maxTokens: 500 }
);

console.log(result.content);      // Generated code
console.log(result.provider);     // "deepseek"
console.log(result.latencyMs);    // ~2000ms
console.log(result.cost);         // 0
```

---

## 📈 Performance Tips

1. **Use low temperature** (0.1-0.3) for code generation
2. **Set maxTokens** to avoid excessive output
3. **Reuse connections** in production
4. **Cache common queries** (Prisma models, types)
5. **Enable tools** only when needed (adds latency)

---

## 🔍 Monitoring

### Check Health
```graphql
query {
  health {
    status
    version
    uptime
    providers
    memory
    deepcode
  }
}
```

### View Stats
```graphql
query {
  stats {
    requests
    completions
    totalCost
    ragSkipped
    ragUsed
    tokensSaved
  }
}
```

### Provider Statistics
```graphql
query {
  providerStats(days: 7) {
    provider
    requests
    avgLatency
    totalCost
  }
}
```

---

## 🎯 Cost Optimization

Your AI proxy automatically:
- ✅ Routes to FREE providers first (DeepSeek, Groq)
- ✅ Falls back to paid providers if needed
- ✅ Tracks costs per request
- ✅ Caches context to reduce tokens
- ✅ Skips RAG for simple queries

**Typical costs:**
- Simple queries: $0 (DeepSeek)
- Code generation: $0 (DeepSeek)
- Complex tasks: $0-0.02 (may use premium providers)

---

## 🚀 Quick Start

```bash
# Run interactive examples
/root/ankr-ai-proxy-examples.sh

# Run specific example
/root/ankr-ai-proxy-examples.sh 1    # Prisma model

# Test simple query
curl -X POST http://localhost:4444/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { complete(input: {prompt: \"Hello\"}) { content } }"}'
```

---

## 📚 Resources

- **AI Proxy Endpoint:** http://localhost:4444/graphql
- **GraphQL Playground:** http://localhost:4444/graphiql (if enabled)
- **Examples Script:** `/root/ankr-ai-proxy-examples.sh`
- **Test Report:** `/root/captain-llm-test-report.md`

---

**Your AI Proxy is LIVE! 🎉**

17 providers available • FREE (DeepSeek) • 2s latency • Production-ready
