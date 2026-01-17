# ankrBFC - Banking Finance Customer Platform

> Transaction Behavioral Intelligence (TBI) platform for banks, built on ANKR infrastructure.

## Overview

ankrBFC is an enterprise-grade platform that helps banks understand customer behavior, make intelligent credit decisions, deliver personalized offers, and maintain compliance. It combines behavioral analytics with AI-powered decisioning.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      ankrBFC Platform                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   bfc-web    │  │bfc-customer  │  │  bfc-staff   │      │
│  │  Dashboard   │  │   App        │  │    App       │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│  ┌──────▼─────────────────▼─────────────────▼───────┐      │
│  │              bfc-api (GraphQL)                   │      │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │      │
│  │  │ Customers   │  │ Credit      │  │ Offers   │ │      │
│  │  │ Service     │  │ Engine      │  │ Engine   │ │      │
│  │  └─────────────┘  └─────────────┘  └──────────┘ │      │
│  └──────────────────────────────────────────────────┘      │
│                           │                                 │
│  ┌────────────────────────▼─────────────────────────┐      │
│  │              bfc-core (Shared)                   │      │
│  │  RBAC/ABAC │ Notifications │ Compliance │ Crypto │      │
│  └──────────────────────────────────────────────────┘      │
├─────────────────────────────────────────────────────────────┤
│  ANKR Core: EON Memory │ AI Proxy │ Complymitra            │
└─────────────────────────────────────────────────────────────┘
```

## Features

### Customer 360
- Unified customer view across all products
- Behavioral episode tracking
- Risk and trust scoring
- Life event detection
- Churn prediction

### Credit Decisioning
- AI-powered credit decisions
- Policy-based rules engine
- Similar case matching via EON
- Risk grade calculation
- Automated approvals

### Notifications
- Multi-channel (Push, Email, SMS, WhatsApp, In-App)
- Role-Based Access Control (RBAC)
- Attribute-Based Access Control (ABAC)
- Template management
- Approval workflows
- Full audit trail

### Compliance
- KYC verification (PAN, Aadhaar, GSTIN)
- AML transaction screening
- DigiLocker integration
- TDS/GST calculations
- STR/CTR reporting

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Fastify + Mercurius (GraphQL) |
| Database | PostgreSQL + pgvector |
| ORM | Prisma |
| Frontend | React 19 + Vite + TailwindCSS |
| Mobile | Expo Router |
| State | Zustand + Apollo Client |
| AI | ANKR AI Proxy |
| Memory | ANKR EON |
| Cache | Redis |

## Project Structure

```
ankr-bfc/
├── apps/
│   ├── bfc-api/          # GraphQL API (port 4020)
│   ├── bfc-web/          # Admin dashboard (port 3020)
│   ├── bfc-customer-app/ # Customer mobile app
│   └── bfc-staff-app/    # Staff mobile app
├── packages/
│   └── bfc-core/         # Shared library
├── prisma/
│   └── schema.prisma     # Database schema
├── docker-compose.yml
└── Dockerfile
```

## Quick Start

### Prerequisites
- Node.js >= 20
- pnpm >= 8
- PostgreSQL 16 with pgvector
- Redis

### Installation

```bash
# Clone repository
git clone https://github.com/ankr/ankr-bfc.git
cd ankr-bfc

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Edit .env with your credentials

# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:push

# Start development
pnpm dev
```

### Using Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f bfc-api
```

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/bfc

# Redis
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=32-character-encryption-key

# ANKR Services
AI_PROXY_URL=http://localhost:4444
EON_URL=http://localhost:4005
COMPLYMITRA_URL=http://localhost:4015

# API
PORT=4020
```

## API Documentation

### GraphQL Endpoint
```
http://localhost:4020/graphql
```

### Key Queries

```graphql
# Get customer with 360 view
query Customer360($id: ID!) {
  customer(id: $id) {
    id
    name
    riskScore
    trustScore
    segment
    products { type status balance }
    recentEpisodes { action outcome success }
    offers { title confidence status }
  }
}

# Process credit application
mutation CreditDecision($input: CreditInput!) {
  requestCreditDecision(input: $input) {
    decision
    approvedAmount
    interestRate
    riskGrade
    aiReasoning
  }
}
```

## Testing

```bash
# Run unit tests
pnpm test

# Run with coverage
pnpm test -- --coverage

# Run E2E tests
pnpm test:e2e
```

## Deployment

### CI/CD
- Push to `main` → Deploy to staging
- Create tag `v*` → Deploy to production

### Manual Deploy
```bash
# Build all apps
pnpm build

# Deploy via Docker
docker-compose -f docker-compose.prod.yml up -d
```

## Security

- JWT authentication with role-based access
- AES-256-GCM encryption at rest
- RBAC + ABAC for fine-grained permissions
- Audit logging for all sensitive operations
- Data masking for PII (DPDP/GDPR compliant)

## Ports

| Service | Port |
|---------|------|
| bfc-api | 4020 |
| bfc-web | 3020 |
| PostgreSQL | 5432 |
| Redis | 6379 |

## Contributing

1. Create feature branch from `develop`
2. Make changes with tests
3. Submit PR for review
4. Merge after CI passes

## License

Proprietary - ANKR Technologies

## Support

- Documentation: `/docs`
- Issues: GitHub Issues
- Team: bfc-team@ankr.in
