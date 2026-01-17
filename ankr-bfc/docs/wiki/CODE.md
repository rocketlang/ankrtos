# BFC Code Wiki

## Table of Contents
1. [Repository Structure](#repository-structure)
2. [Coding Standards](#coding-standards)
3. [Design Patterns](#design-patterns)
4. [Key Abstractions](#key-abstractions)
5. [Data Flow](#data-flow)
6. [Testing Strategy](#testing-strategy)
7. [Debugging Guide](#debugging-guide)

---

## Repository Structure

```
ankr-bfc/
├── apps/                          # Application packages
│   ├── bfc-api/                   # Backend GraphQL API
│   │   ├── src/
│   │   │   ├── main.ts           # Entry point
│   │   │   ├── app.ts            # Fastify setup
│   │   │   ├── plugins/          # Fastify plugins
│   │   │   ├── resolvers/        # GraphQL resolvers
│   │   │   ├── services/         # Business logic
│   │   │   └── schema/           # GraphQL schema
│   │   └── prisma/               # Database config
│   │
│   ├── bfc-web/                   # React dashboard
│   │   ├── src/
│   │   │   ├── main.tsx          # Entry point
│   │   │   ├── App.tsx           # Root component
│   │   │   ├── pages/            # Page components
│   │   │   ├── components/       # Reusable components
│   │   │   ├── store/            # Zustand stores
│   │   │   └── lib/              # Utilities
│   │   └── e2e/                  # Playwright tests
│   │
│   ├── bfc-customer-app/          # Expo customer app
│   │   └── app/                  # Expo Router pages
│   │
│   └── bfc-staff-app/             # Expo staff app
│       └── app/                  # Expo Router pages
│
├── packages/                      # Shared packages
│   └── bfc-core/                  # Core library
│       └── src/
│           ├── types/            # TypeScript types
│           ├── crypto/           # Encryption
│           ├── security/         # Auth, RBAC
│           ├── notifications/    # Notification system
│           ├── integrations/     # External services
│           ├── reliability/      # Circuit breakers
│           ├── cache/            # Redis caching
│           └── observability/    # Logging, metrics
│
├── prisma/                        # Database schema
│   └── schema.prisma
│
├── docker/                        # Docker configs
├── scripts/                       # Utility scripts
├── docs/                          # Documentation
│   ├── wiki/                     # Wiki pages
│   └── security/                 # Security docs
│
└── .github/                       # CI/CD workflows
```

---

## Coding Standards

### TypeScript Guidelines

```typescript
// ✅ DO: Use explicit types
function processApplication(application: CreditApplication): CreditDecision {
  // ...
}

// ❌ DON'T: Use any
function processApplication(application: any): any {
  // ...
}

// ✅ DO: Use interfaces for objects
interface CustomerProfile {
  id: string;
  name: string;
  riskScore: number;
}

// ✅ DO: Use enums for fixed values
enum KycStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

// ✅ DO: Use const assertions for literals
const CHANNELS = ['push', 'email', 'sms'] as const;
type Channel = typeof CHANNELS[number];
```

### Naming Conventions

```typescript
// Files
customer.service.ts      // Services
customer.resolver.ts     // Resolvers
customer.test.ts         // Tests
CustomerProfile.tsx      // React components

// Variables
const customerCount = 10;           // camelCase
const MAX_RETRY_ATTEMPTS = 3;       // UPPER_SNAKE for constants

// Functions
function calculateRiskScore() {}    // camelCase, verb prefix
async function fetchCustomer() {}   // async functions

// Classes
class CreditEngine {}               // PascalCase
class CustomerService {}

// Interfaces/Types
interface CustomerProfile {}        // PascalCase
type CreditDecision = {}           // PascalCase

// Enums
enum UserRole {                    // PascalCase
  ADMIN = 'ADMIN',                 // UPPER_SNAKE values
  STAFF = 'STAFF',
}
```

### File Organization

```typescript
// Order of imports
// 1. Node built-ins
import { EventEmitter } from 'events';

// 2. External packages
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

// 3. Internal packages
import { logger, metrics } from '@bfc/core';

// 4. Relative imports
import { CustomerService } from './customer.service';
import type { CustomerProfile } from './types';

// Order of exports
// 1. Types/Interfaces
export interface Config {}

// 2. Constants
export const DEFAULT_TIMEOUT = 5000;

// 3. Functions
export function createService() {}

// 4. Classes
export class MyService {}

// 5. Default export (if any)
export default MyService;
```

---

## Design Patterns

### Service Pattern

All business logic is encapsulated in service classes.

```typescript
// services/customer.service.ts

import { PrismaClient } from '@prisma/client';
import { EonClient, AIProxyClient, logger } from '@bfc/core';

export class CustomerService {
  private prisma: PrismaClient;
  private eon: EonClient;
  private ai: AIProxyClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.eon = new EonClient();
    this.ai = new AIProxyClient();
  }

  /**
   * Get customer with full 360 view
   */
  async getCustomer360(customerId: string): Promise<Customer360> {
    // 1. Fetch base customer
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        products: true,
        episodes: { take: 10, orderBy: { createdAt: 'desc' } },
        offers: { where: { status: 'GENERATED' } },
      },
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // 2. Enrich with external data
    const riskScore = await this.calculateRiskScore(customer);
    const insights = await this.getAIInsights(customer);

    // 3. Return unified view
    return {
      ...customer,
      riskScore,
      insights,
    };
  }
}
```

### Repository Pattern (via Prisma)

Database access is abstracted through Prisma.

```typescript
// Direct Prisma usage in services
const customer = await this.prisma.customer.findUnique({
  where: { id },
  include: { products: true },
});

// Complex queries
const highRiskCustomers = await this.prisma.customer.findMany({
  where: {
    riskScore: { gte: 0.7 },
    status: 'ACTIVE',
  },
  orderBy: { riskScore: 'desc' },
  take: 100,
});
```

### Factory Pattern

Used for creating complex objects with multiple configurations.

```typescript
// Circuit breaker factory
export const CircuitBreakerPresets = {
  database: {
    failureThreshold: 5,
    resetTimeout: 30000,
  },
  external: {
    failureThreshold: 3,
    resetTimeout: 60000,
  },
  ai: {
    failureThreshold: 2,
    resetTimeout: 120000,
  },
};

// Usage
const breaker = new CircuitBreaker(CircuitBreakerPresets.external);
```

### Strategy Pattern

Used for pluggable behaviors (notification handlers, CBS adapters).

```typescript
// Notification handler interface
interface NotificationHandler {
  channel: NotificationChannel;
  send(notification: Notification): Promise<boolean>;
}

// Implementations
class PushHandler implements NotificationHandler {
  channel = NotificationChannel.PUSH;
  async send(notification: Notification) { /* ... */ }
}

class EmailHandler implements NotificationHandler {
  channel = NotificationChannel.EMAIL;
  async send(notification: Notification) { /* ... */ }
}

// Usage
const handlers = new Map<NotificationChannel, NotificationHandler>();
handlers.set(NotificationChannel.PUSH, new PushHandler());
handlers.set(NotificationChannel.EMAIL, new EmailHandler());
```

### Decorator Pattern

Used for cross-cutting concerns (retry, circuit breaker, logging).

```typescript
// Retry decorator
function retry(options: RetryOptions) {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      let lastError: Error;

      for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
        try {
          return await original.apply(this, args);
        } catch (error) {
          lastError = error;
          if (attempt < options.maxAttempts) {
            await sleep(options.delay * Math.pow(2, attempt - 1));
          }
        }
      }

      throw lastError;
    };
  };
}

// Usage
class ExternalService {
  @retry({ maxAttempts: 3, delay: 1000 })
  async fetchData() {
    // Will retry up to 3 times with exponential backoff
  }
}
```

---

## Key Abstractions

### Circuit Breaker

Prevents cascading failures when external services are down.

```typescript
import { CircuitBreaker, CircuitBreakerPresets } from '@bfc/core';

const breaker = new CircuitBreaker(CircuitBreakerPresets.external);

// Usage
const result = await breaker.execute(async () => {
  return await externalApi.call();
});

// States: CLOSED (normal) → OPEN (failing) → HALF_OPEN (testing)
```

### Notification Service

Unified notification delivery with access control.

```typescript
import { notificationService, Role, NotificationCategory } from '@bfc/core';

// Check permission
const canSend = rbacService.hasPermission(userRole, 'send', {
  category: NotificationCategory.OFFER,
});

// Send with RBAC/ABAC
const result = await notificationService.send(payload, recipient, sender);
```

### EON Memory Client

Stores and retrieves behavioral patterns.

```typescript
import { EonClient } from '@bfc/core';

const eon = new EonClient();

// Store episode
await eon.remember({
  content: 'Customer applied for home loan, approved at 7.5%',
  metadata: {
    customerId: '123',
    module: 'LOAN',
    outcome: 'APPROVED',
  },
});

// Recall similar cases
const similar = await eon.recall({
  query: 'age 35, income 50L, home loan',
  limit: 5,
  filters: { module: 'LOAN' },
});
```

### Data Masking

Protects PII in logs and displays.

```typescript
import { DataMasker } from '@bfc/core';

const masker = new DataMasker();

// Mask for logging
const masked = masker.mask(customer, ['pan', 'aadhaar', 'phone']);
// Result: { pan: 'ABCD****4F', aadhaar: '****1234', phone: '+91 ****3210' }

// Mask for display (role-based)
const forDisplay = masker.maskForRole(customer, userRole);
```

---

## Data Flow

### Request Flow (API)

```
HTTP Request
     │
     ▼
┌────────────┐
│  Fastify   │──> Authentication (JWT)
│  Server    │──> Rate Limiting
└────────────┘──> Request Logging
     │
     ▼
┌────────────┐
│  GraphQL   │──> Schema Validation
│  Mercurius │──> Query Parsing
└────────────┘
     │
     ▼
┌────────────┐
│  Resolver  │──> Authorization (RBAC)
└────────────┘──> Input Validation
     │
     ▼
┌────────────┐
│  Service   │──> Business Logic
└────────────┘──> External Calls
     │
     ▼
┌────────────┐
│  Prisma    │──> Query Building
│   ORM      │──> Connection Pool
└────────────┘
     │
     ▼
┌────────────┐
│ PostgreSQL │
└────────────┘
```

### State Flow (Frontend)

```
User Action
     │
     ▼
┌────────────┐
│   React    │──> Event Handler
│ Component  │
└────────────┘
     │
     ▼
┌────────────┐
│  Zustand   │──> Update State
│   Store    │──> Persist (if needed)
└────────────┘
     │
     ▼
┌────────────┐
│  Apollo    │──> GraphQL Query/Mutation
│  Client    │──> Cache Update
└────────────┘
     │
     ▼
┌────────────┐
│   React    │──> Re-render
│ Component  │
└────────────┘
```

---

## Testing Strategy

### Unit Tests

Test individual functions and classes in isolation.

```typescript
// __tests__/credit-engine.test.ts
import { describe, it, expect, vi } from 'vitest';
import { CreditEngine } from '../credit-engine';

describe('CreditEngine', () => {
  describe('calculateRiskScore', () => {
    it('should return high risk for low bureau score', () => {
      const engine = new CreditEngine();
      const score = engine.calculateRiskScore({
        bureauScore: 550,
        income: 50000,
      });
      expect(score.riskGrade).toBe('E');
    });
  });
});
```

### Integration Tests

Test service interactions with mocked external dependencies.

```typescript
// __tests__/customer.integration.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { CustomerService } from '../customer.service';

describe('CustomerService Integration', () => {
  let prisma: PrismaClient;
  let service: CustomerService;

  beforeAll(async () => {
    prisma = new PrismaClient();
    service = new CustomerService(prisma);
  });

  it('should create and retrieve customer', async () => {
    const created = await service.createCustomer({
      name: 'Test User',
      phone: '+919876543210',
    });

    const retrieved = await service.getCustomer(created.id);
    expect(retrieved.name).toBe('Test User');
  });
});
```

### E2E Tests

Test complete user flows.

```typescript
// e2e/loan-application.spec.ts
import { test, expect } from '@playwright/test';

test('complete loan application flow', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'user@test.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // Navigate to loans
  await page.click('text=Apply for Loan');

  // Fill application
  await page.selectOption('#productType', 'PERSONAL_LOAN');
  await page.fill('#amount', '500000');
  await page.fill('#tenure', '36');
  await page.click('button:text("Submit")');

  // Verify decision
  await expect(page.locator('.decision-result')).toBeVisible();
});
```

---

## Debugging Guide

### Logging

```typescript
import { logger } from '@bfc/core';

// Levels: error, warn, info, debug, trace
logger.info('Processing application', { applicationId, customerId });
logger.error('Failed to process', { error, stack: error.stack });

// Structured logging
logger.info({
  message: 'Credit decision made',
  applicationId,
  decision: 'APPROVED',
  processingTime: 1234,
});
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=bfc:* pnpm dev

# Specific modules
DEBUG=bfc:credit,bfc:notifications pnpm dev
```

### Common Issues

**Issue: "Cannot find module '@bfc/core'"**
```bash
# Rebuild packages
pnpm build --filter @bfc/core
```

**Issue: "Prisma client not generated"**
```bash
pnpm db:generate
```

**Issue: "Redis connection refused"**
```bash
# Check Redis is running
redis-cli ping
# Should return PONG
```

**Issue: "JWT token invalid"**
```bash
# Check JWT_SECRET matches in all services
echo $JWT_SECRET
```

### Performance Profiling

```typescript
// Time a function
const startTime = performance.now();
const result = await expensiveOperation();
const duration = performance.now() - startTime;
logger.info(`Operation took ${duration}ms`);

// Use built-in metrics
import { metrics } from '@bfc/core';
metrics.histogram('credit_decision_time', duration);
```
