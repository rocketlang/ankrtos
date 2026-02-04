# Mari8X Multi-Role Portal

Dedicated portals for each maritime stakeholder role.

## Portals

### 1. **Owner Portal** (`/owner`)
- Fleet overview dashboard
- Vessel positions (AIS real-time)
- Voyage P&L reports
- Time charter hire tracking
- Fleet utilization analytics
- Bunker consumption monitoring
- Certificate expiry tracking

### 2. **Charterer Portal** (`/charterer`)
- Cargo enquiry management
- Fixture pipeline
- Voyage estimates
- Nominated vessels
- Charter party library
- Laytime tracking
- Invoice management

### 3. **Broker Portal** (`/broker`)
- Open tonnage list
- Cargo opportunities
- Fixture tracking (commission)
- Market intelligence
- Deal probability scoring
- Email-to-fixture parser
- Fixture recap generation

### 4. **Agent Portal** (`/agent`)
- Port call schedule
- PDA/FDA management
- Arrival/departure notifications
- Document handling
- Cash to master tracking
- Supplier coordination
- Customs clearance

## Features

- ✅ **Role-based routing** - Each user sees only relevant portal
- ✅ **Real-time updates** - WebSocket subscriptions for live data
- ✅ **Responsive design** - Works on desktop, tablet, mobile
- ✅ **Dark theme** - Maritime-optimized UI
- ✅ **GraphQL API** - Efficient data fetching

## Getting Started

```bash
# Install dependencies
cd apps/ankr-maritime/portal
npm install

# Start development server
npm run dev  # Runs on http://localhost:3009

# Build for production
npm run build
```

## Authentication

Integrated with main Mari8X backend:
- JWT authentication
- RBAC (role-based access control)
- Multi-tenancy support

## Customization

Each portal can be white-labeled:
- Custom branding (logo, colors)
- Module visibility (enable/disable features)
- Custom dashboards per company

---

*Part of the Mari8X Maritime Operations Platform*
