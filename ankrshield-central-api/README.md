# ankrshield Central Intelligence API

GraphQL API server for crowdsourced threat intelligence aggregation.

## Architecture

```
Field Apps → GraphQL API → PostgreSQL (ankrshield_central)
                ↓
           Admin Dashboard
```

## Features

- **GraphQL API** with Mercurius
- **Threat report ingestion** from field installations
- **Automatic aggregation** of threat intelligence
- **Auto-approval logic** (>=100 reports, >=0.95 confidence)
- **Definition distribution** (like antivirus updates)
- **Rate limiting** by installation_id
- **Privacy-preserving** (anonymous installation IDs)

## Quick Start

```bash
# Install dependencies
npm install

# Setup database (already done)
# Database: ankrshield_central

# Start development server
npm run dev

# GraphQL Playground: http://localhost:4260/graphql
# Health check: http://localhost:4260/health
```

## Environment Variables

```bash
PORT=4260
DATABASE_URL=postgresql://ankrshield_central:ankrshield_central_2026@localhost:5432/ankrshield_central
NODE_ENV=development
LOG_LEVEL=info
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000
AUTO_APPROVE_MIN_REPORTS=100
AUTO_APPROVE_MIN_CONFIDENCE=0.95
```

## GraphQL Operations

### Submit Threat Report (Field App)

```graphql
mutation SubmitReport {
  submitReport(input: {
    report_id: "550e8400-e29b-41d4-a716-446655440000"
    domain: "tracker.example.com"
    behavioral_signature: {
      thirdPartyCookies: true
      canvasFingerprinting: true
      crossSiteRequests: 5
    }
    confidence: 0.96
    client_version: "0.1.0"
    platform: LINUX
    installation_id: "123e4567-e89b-12d3-a456-426614174000"
  }) {
    success
    message
    report_id
  }
}
```

### Get Latest Definition (Field App)

```graphql
query GetLatestDefinition {
  latestDefinition {
    version
    release_date
    total_trackers
    tracker_list
    changelog
  }
}
```

### Get Statistics

```graphql
query GetStats {
  stats {
    total_installations
    active_24h
    opt_in_count
    total_reports
    pending_threats
    approved_threats
    latest_definition_version
  }
}
```

### Get Pending Threats (Admin)

```graphql
query GetPendingThreats {
  pendingThreats(limit: 20) {
    domain
    report_count
    avg_confidence
    category
    first_seen
    last_seen
  }
}
```

### Review Threat (Admin)

```graphql
mutation ReviewThreat {
  reviewThreat(input: {
    domain: "tracker.example.com"
    status: APPROVED
    category: ADVERTISING
    notes: "Confirmed advertising tracker"
  }) {
    success
    message
    threat {
      domain
      status
      category
    }
  }
}
```

## Database Schema

See `/root/ankrshield-central/schema.sql` for complete schema.

**Main Tables**:
- `threat_reports` - Raw reports from field
- `aggregated_threats` - Processed intelligence
- `daily_definitions` - Published updates
- `field_installations` - Anonymous tracking
- `admin_users` - Admin access
- `admin_activity_log` - Audit trail

## Rate Limiting

- Per installation_id: 100 requests per minute
- Prevents abuse from single installation
- IP-based fallback if installation_id not present

## Auto-Approval Logic

Threats are auto-approved if:
- Report count >= 100
- Average confidence >= 0.95
- Status is 'pending'

## Production Deployment

```bash
# Build
npm run build

# Start with PM2
pm2 start dist/server.js --name ankrshield-central-api

# Environment
# Set DATABASE_URL to production database
# Set NODE_ENV=production
# Set LOG_LEVEL=warn
```

## API Endpoints

- **GraphQL**: `http://localhost:4260/graphql`
- **Health**: `http://localhost:4260/health`
- **Playground**: http://localhost:4260/graphql (dev only)

## Next Steps

1. ✅ GraphQL API server created
2. [ ] Admin dashboard (Next.js)
3. [ ] Aggregation worker (cron job)
4. [ ] Definition builder (daily)
5. [ ] Field app integration
