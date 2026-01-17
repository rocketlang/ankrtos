# BFC Setup Guide

## Prerequisites

### Required Software

| Software | Version | Notes |
|----------|---------|-------|
| Node.js | >= 20.0 | LTS recommended |
| pnpm | >= 8.0 | Package manager |
| PostgreSQL | >= 16 | With pgvector extension |
| Redis | >= 7.0 | For caching |
| Docker | >= 24.0 | Optional, for containerized setup |

### ANKR Services (Required)

| Service | Port | Purpose |
|---------|------|---------|
| AI Proxy | 4444 | LLM gateway |
| EON Memory | 4005 | Behavioral memory |
| Complymitra | 4015 | Compliance services |

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/ankr/ankr-bfc.git
cd ankr-bfc
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Setup

```bash
# Copy example env file
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL=postgresql://ankr:password@localhost:5432/bfc

# Redis
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
ENCRYPTION_KEY=your-32-character-encryption-key!

# ANKR Services
AI_PROXY_URL=http://localhost:4444
EON_URL=http://localhost:4005
COMPLYMITRA_URL=http://localhost:4015

# App Config
PORT=4020
NODE_ENV=development
```

### 4. Database Setup

```bash
# Install pgvector extension (if not already)
psql -d bfc -c "CREATE EXTENSION IF NOT EXISTS vector;"
psql -d bfc -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"

# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:push

# (Optional) Seed data
pnpm db:seed
```

### 5. Start Development

```bash
# Start all apps in development mode
pnpm dev

# Or start individually
pnpm dev:api     # API only (port 4020)
pnpm dev:web     # Web only (port 3020)
```

## Docker Setup

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Building Images

```bash
# Build API image
docker build --target bfc-api -t bfc-api .

# Build Web image
docker build --target bfc-web -t bfc-web .
```

## Configuration

### Database Configuration

The platform uses PostgreSQL with pgvector for vector similarity search.

**Schema Location:** `/prisma/schema.prisma`

Key tables:
- `Customer` - Customer master data
- `CustomerEpisode` - Behavioral episodes
- `CustomerProduct` - Product relationships
- `CustomerOffer` - Personalized offers
- `TransactionEvent` - Transaction history
- `Alert` - Risk alerts

### Redis Configuration

Redis is used for:
- Session caching
- Rate limiting
- Real-time pub/sub
- API response caching

Cache keys follow this pattern:
```
bfc:customer:{id}        # Customer data
bfc:offers:{customerId}  # Offers
bfc:session:{token}      # Sessions
bfc:rate:{userId}        # Rate limits
```

### Security Configuration

**JWT Configuration:**
- Tokens expire after 24 hours
- Refresh tokens valid for 7 days
- Stored in Redis for session management

**Encryption:**
- AES-256-GCM for data at rest
- PBKDF2 for password hashing
- Field-level encryption for PII

### RBAC Configuration

Roles are defined in `packages/bfc-core/src/notifications/rbac.ts`

To add a new role:

```typescript
{
  role: Role.NEW_ROLE,
  permissions: [
    { action: 'send', category: NotificationCategory.TASK },
    { action: 'receive' },
  ],
  maxBulkRecipients: 100,
}
```

### ABAC Policies

Policies are in `packages/bfc-core/src/notifications/abac.ts`

To add a custom policy:

```typescript
{
  id: 'custom-policy',
  name: 'Custom Policy',
  description: 'Description',
  priority: 100,
  effect: 'deny',
  condition: (subject, resource, environment, action) => {
    // Return true to apply effect
    return subject.role === Role.STAFF && resource.containsSensitiveData;
  },
}
```

## Mobile App Setup

### Customer App

```bash
cd apps/bfc-customer-app

# Install Expo CLI
npm install -g expo-cli

# Start development
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android
```

### Staff App

```bash
cd apps/bfc-staff-app
npx expo start
```

### Environment for Mobile

Create `apps/bfc-customer-app/.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:4020/graphql
```

## Testing

### Unit Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test -- --coverage

# Run specific package
pnpm --filter @bfc/core test
```

### E2E Tests

```bash
# Install Playwright browsers
pnpm exec playwright install

# Run E2E tests
pnpm test:e2e

# Run with UI
pnpm exec playwright test --ui
```

### Load Testing

```bash
# Using k6
k6 run tests/load/credit-decision.js
```

## Troubleshooting

### Common Issues

**Database Connection Failed**
```
Error: P1001: Can't reach database server
```
Solution: Check PostgreSQL is running and DATABASE_URL is correct.

**pgvector Extension Missing**
```
Error: extension "vector" is not available
```
Solution: Install pgvector extension:
```bash
# Ubuntu/Debian
sudo apt install postgresql-16-pgvector

# macOS
brew install pgvector
```

**Redis Connection Refused**
```
Error: ECONNREFUSED 127.0.0.1:6379
```
Solution: Start Redis server:
```bash
redis-server
```

**Port Already in Use**
```
Error: EADDRINUSE
```
Solution: Find and kill process:
```bash
lsof -i :4020
kill -9 <PID>
```

**Prisma Client Not Generated**
```
Error: @prisma/client not found
```
Solution: Generate client:
```bash
pnpm db:generate
```

### Logs

```bash
# API logs
tail -f /var/log/bfc/api.log

# Docker logs
docker-compose logs -f bfc-api

# PM2 logs
pm2 logs bfc-api
```

## Production Deployment

### Pre-flight Checklist

- [ ] Environment variables set
- [ ] Database migrations run
- [ ] SSL certificates configured
- [ ] Redis persistence enabled
- [ ] Backups configured
- [ ] Monitoring setup
- [ ] Log aggregation setup
- [ ] Rate limits configured
- [ ] CORS origins set

### Deployment Steps

```bash
# Build production
pnpm build

# Run database migrations
pnpm db:migrate

# Start with PM2
pm2 start ecosystem.config.js

# Or with Docker
docker-compose -f docker-compose.prod.yml up -d
```

### Health Checks

```bash
# API health
curl http://localhost:4020/health

# Redis health
redis-cli ping

# Database health
psql -c "SELECT 1"
```

## Support

- Documentation: `/docs`
- Issues: GitHub Issues
- Email: bfc-support@ankr.in
