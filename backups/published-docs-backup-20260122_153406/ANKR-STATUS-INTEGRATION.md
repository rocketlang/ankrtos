# ANKR Enhanced Service Status Integration

**Date**: 2026-01-22
**Purpose**: Integrate enhanced service status display into ankr-pulse dashboard

## What Was Built

### 1. ankr-status-api (New Service)

**Location**: `/root/ankr-labs-nx/apps/ankr-status-api/`
**Port**: 4100
**Description**: REST API providing enhanced service status information

**Features**:
- Reads service configuration from `/root/.ankr/config/`
- Determines service TYPE from portPath (Frontend, Backend, AI, Dashboard, etc.)
- Gets real-time process metrics (CPU, Memory, Uptime, PID)
- Maps services to their databases
- Intelligent sorting: Running → Stopped → Disabled, then by type

**Endpoints**:
```bash
# Health check
GET http://localhost:4100/health

# Enhanced status
GET http://localhost:4100/api/status
```

**Response Format**:
```json
{
  "services": [
    {
      "name": "ankr-pulse",
      "type": "Dashboard",
      "port": "4320",
      "status": "RUNNING",
      "pid": "1965052",
      "cpu": "0.0%",
      "memory": "45.0MB",
      "uptime": "2d 08h",
      "database": "-",
      "description": "Real-time Observability Dashboard"
    }
  ],
  "summary": {
    "running": 1,
    "stopped": 28,
    "disabled": 7,
    "total": 35
  }
}
```

### 2. EnhancedServiceStatus Component

**Location**: `/root/ankr-labs-nx/apps/ankr-pulse/src/components/EnhancedServiceStatus.tsx`

**Features**:
- **Full-width table** with 9 columns: SERVICE | TYPE | PORT | STATUS | PID | CPU | MEMORY | UPTIME | DATABASE
- **Summary stats bar**: Running/Stopped/Disabled/Total counts
- **Type filters**: All, Frontend, Backend, AI, Dashboard, etc.
- **Search box**: Filter by service name or description
- **Auto-refresh**: Updates every 10 seconds (toggleable)
- **Color-coded status**: 🟢 RUNNING | 🔴 STOPPED | 🟡 DISABLED
- **Responsive design**: Horizontal scroll for narrow screens

### 3. Integration into ankr-pulse

**Location**: `/root/ankr-labs-nx/apps/ankr-pulse/src/App.tsx`

Added new "Status" tab:
- Tab order: Services → **Status** → PM2 → Ports → Packages → Agents → Costs → System → Security → Logs
- Icon: 📋
- Direct access via ankr-pulse dashboard

## Configuration Updates

### 1. Port Registration
**File**: `/root/.ankr/config/ports.json`

```json
"dashboard": {
  "statusApi": 4100
}
```

### 2. Service Registration
**File**: `/root/.ankr/config/services.json`

```json
"ankr-status-api": {
  "portPath": "dashboard.statusApi",
  "path": "/root/ankr-labs-nx/apps/ankr-status-api",
  "command": "npx tsx src/index.ts",
  "description": "Enhanced Service Status API",
  "healthEndpoint": "/health",
  "enabled": true
}
```

## Usage

### CLI (ankr-ctl)
```bash
# Start the status API
ankr-ctl start ankr-status-api

# Check if running
ankr-ctl status ankr-status-api

# View all services (enhanced display)
ankr-ctl status
```

### Web Dashboard (ankr-pulse)
```bash
# Open browser
http://localhost:4320

# Click the "Status" tab
# You'll see the full enhanced service status table
```

### Direct API Access
```bash
# Get status JSON
curl http://localhost:4100/api/status | jq

# Get summary only
curl http://localhost:4100/api/status | jq '.summary'

# Get running services
curl -s http://localhost:4100/api/status | jq '.services[] | select(.status == "RUNNING")'

# Get services by type
curl -s http://localhost:4100/api/status | jq '.services[] | select(.type == "Backend")'
```

## Benefits

### 1. Unified View
- Single source of truth for service status (same data as `ankr-ctl status`)
- Web and CLI access to identical information

### 2. Enhanced Information
Compared to basic PM2 view, now shows:
- **Service Type** (Frontend, Backend, AI, etc.)
- **Port number** (from ports.json)
- **Database mapping** (from databases.json)
- **Service description**
- **Real-time metrics** (CPU, Memory, Uptime)

### 3. Better Organization
- Smart sorting: Running services first
- Filter by type or search
- Summary statistics at a glance

### 4. Web-Based Monitoring
- Access from any device
- No need for SSH/terminal access
- Real-time auto-refresh
- Modern, responsive UI

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      ankr-pulse (4320)                      │
│                   React Dashboard + Vite                     │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  EnhancedServiceStatus Component                      │  │
│  │  - Fetches from ankr-status-api                       │  │
│  │  - Displays table with filters                        │  │
│  │  - Auto-refresh every 10s                             │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ↓ HTTP GET                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  ankr-status-api (4100)                     │
│                   Fastify REST API                           │
│                                                               │
│  Reads:                                                      │
│  • /root/.ankr/config/services.json                         │
│  • /root/.ankr/config/databases.json                        │
│  • /root/.ankr/config/ports.json                            │
│                                                               │
│  Queries:                                                    │
│  • pm2 jlist (process status)                               │
│  • ps commands (CPU, memory, uptime)                        │
│                                                               │
│  Returns: Enhanced service status JSON                      │
└─────────────────────────────────────────────────────────────┘
```

## Comparison: ankr-ctl vs Web View

### CLI (ankr-ctl status)
```
╔════════════════════════════════════════════════════════════════╗
║                    ANKR SERVICES STATUS (v3.0)                 ║
╠════════════════════════════════════════════════════════════════╣
║ SERVICE       │ TYPE      │ PORT │ STATUS  │ PID    │ CPU  ...║
╠════════════════════════════════════════════════════════════════╣
║ ankr-pulse    │ Dashboard │ 4320 │ RUNNING │ 196505 │ 0.0% ...║
╚════════════════════════════════════════════════════════════════╝

  Running: 1  Stopped: 0  Total: 1 services
```

### Web (ankr-pulse Status tab)
- Same data in searchable, filterable table
- Click column headers to sort
- Type filters (Frontend, Backend, AI, etc.)
- Search box for quick filtering
- Color-coded status indicators
- Auto-refresh toggle

## Files Created/Modified

### Created:
1. `/root/ankr-labs-nx/apps/ankr-status-api/src/index.ts` - API server
2. `/root/ankr-labs-nx/apps/ankr-status-api/package.json` - Dependencies
3. `/root/ankr-labs-nx/apps/ankr-pulse/src/components/EnhancedServiceStatus.tsx` - React component

### Modified:
1. `/root/ankr-labs-nx/apps/ankr-pulse/src/App.tsx` - Added Status tab
2. `/root/.ankr/config/ports.json` - Added statusApi: 4100
3. `/root/.ankr/config/services.json` - Added ankr-status-api service

## Next Steps (Optional)

### 1. Add Service Control
Extend the UI to add Start/Stop/Restart buttons for each service

### 2. Add Logs View
Click a service to view its logs in a modal

### 3. Add Health Checks
Ping service health endpoints and show response times

### 4. Add Alerts
Email/Slack notifications when services go down

### 5. Add Historical Data
Store metrics in TimescaleDB for trend analysis

### 6. Add Service Groups
Group related services (e.g., "WowTruck Stack", "FreightBox Stack")

## Maintenance

### Updating Service Configs
All service metadata comes from `/root/.ankr/config/`:
- **services.json** - Service definitions, paths, commands
- **ports.json** - Port assignments
- **databases.json** - Database mappings

Any changes to these files automatically reflect in the Status view.

### Adding New Services
1. Add service to `services.json` with `portPath`
2. Add port to `ports.json`
3. If service uses a database, update `databases.json`
4. Restart ankr-status-api: `ankr-ctl restart ankr-status-api`

---

**Built with**: Fastify, React, TypeScript, Vite
**Integration**: ankr-ctl + ankr-pulse
**Port**: 4100 (API), 4320 (Dashboard)
