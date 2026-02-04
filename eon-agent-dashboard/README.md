# ANKR-EON Agent Dashboard Integration Guide

## Overview

This module provides:
1. **Backend API** - Fastify routes for agent monitoring, memory inspection, and note exploration
2. **React Components** - Pre-built dashboard components for ankr-pulse
3. **WebSocket Support** - Real-time agent activity streaming

## Quick Start

### 1. Install Dependencies

```bash
cd /root/ankr-labs-nx/packages/ankr-eon
pnpm add @fastify/websocket @fastify/cors
```

### 2. Add API Routes to ankr-eon server

Edit `/root/ankr-labs-nx/packages/ankr-eon/src/server.ts`:

```typescript
import { registerAgentDashboardRoutes } from './api/agent-dashboard';

// In your server setup:
await registerAgentDashboardRoutes(app);
```

### 3. Copy Components to ankr-pulse

```bash
# Copy React components
cp -r /path/to/eon-agent-dashboard/components/* \
  /root/ankr-labs-nx/apps/ankr-pulse/src/components/agents/

# Add route in ankr-pulse
# apps/ankr-pulse/src/pages/agents/index.tsx
import { AgentDashboard } from '../../components/agents/AgentDashboard';
export default AgentDashboard;
```

### 4. Update ankr-pulse routing

```tsx
// apps/ankr-pulse/src/App.tsx
import { AgentDashboard } from './components/agents/AgentDashboard';

// Add route:
<Route path="/agents" element={<AgentDashboard />} />
```

## API Endpoints

### Agents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agents` | List all agent configurations |
| GET | `/api/agents/:domain` | Get agent config for domain |
| GET | `/api/agents/:domain/stats` | Get performance stats |
| POST | `/api/agents` | Create new agent config |
| PUT | `/api/agents/:id/activate` | Activate a config |

### Memory
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/memory/sessions` | List recent sessions |
| GET | `/api/memory/:sessionId` | Get memory tree for session |
| GET | `/api/memory/:sessionId/artifacts` | Get artifacts |

### Notes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notes` | List strategy notes |
| GET | `/api/notes/hindsight` | List hindsight (failure) notes |
| GET | `/api/notes/:id` | Get specific note |
| POST | `/api/notes` | Create strategy note |
| POST | `/api/notes/hindsight` | Create hindsight note |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/summary` | Overall dashboard summary |

### WebSocket
| Endpoint | Description |
|----------|-------------|
| `ws://host/ws/agents` | Real-time agent activity stream |

## React Components

### AgentDashboard
Main dashboard page with all components integrated.

```tsx
import { AgentDashboard } from '@ankr/eon-dashboard';
<AgentDashboard />
```

### AgentMonitor
Grid of agent status cards showing active configs and performance.

```tsx
import { AgentMonitor } from '@ankr/eon-dashboard';
<AgentMonitor />
```

### AgentStatusCard
Individual agent status card.

```tsx
import { AgentStatusCard } from '@ankr/eon-dashboard';
<AgentStatusCard 
  domain="tms"
  config={agentConfig}
  stats={agentStats}
  onClick={() => handleClick()}
/>
```

### MemoryTreeView
Hierarchical memory scope viewer.

```tsx
import { MemoryTreeView } from '@ankr/eon-dashboard';
<MemoryTreeView sessionId="optional-session-id" />
```

### NoteExplorer
Browse strategy and hindsight notes.

```tsx
import { NoteExplorer } from '@ankr/eon-dashboard';
<NoteExplorer />
```

### LiveActivityFeed
Real-time WebSocket feed of agent activity.

```tsx
import { LiveActivityFeed } from '@ankr/eon-dashboard';
<LiveActivityFeed />
```

## Broadcasting Events

From anywhere in your code, broadcast agent events:

```typescript
import { broadcastAgentEvent } from './api/agent-dashboard';

broadcastAgentEvent({
  timestamp: new Date().toISOString(),
  agent: 'tms',
  action: 'Route optimized Mumbai → Pune',
  status: 'success'
});
```

## Database Tables Used

This dashboard reads from the Confucius memory tables:
- `agent_configs` - Agent configurations
- `memory_scopes` - Hierarchical memory
- `scope_artifacts` - Decisions, errors, todos
- `notes` - Strategy notes
- `hindsight_notes` - Failure analysis

## Screenshots

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🎛️ ANKR-EON Agent Observatory                              LIVE      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │  📡 Live Activity │
│  │ TMS    ✅   │ │ WMS    ⏳   │ │ OMS    ⏳   │  │                   │
│  │ v1.0.0      │ │ N/A        │ │ N/A        │  │  15:30:45 TMS ✅   │
│  │ Rate: 89%   │ │ Rate: --   │ │ Rate: --   │  │  15:30:42 Voice ✅ │
│  └─────────────┘ └─────────────┘ └─────────────┘  │  15:30:38 TMS ✅   │
│                                                    │                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  └───────────────────┘
│  │ Voice  ✅   │ │ Comply ⏳   │ │ Gov    ⏳   │
│  │ v1.0.0      │ │ N/A        │ │ N/A        │
│  │ Rate: 94%   │ │ Rate: --   │ │ Rate: --   │
│  └─────────────┘ └─────────────┘ └─────────────┘
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  🧠 Memory Inspector              │  📝 Note Explorer                   │
│  ┌─────────────────────────────┐  │  ┌─────────────────────────────┐   │
│  │ ▼ SESSION                   │  │  │ [Hindsight] [Strategy]      │   │
│  │   ├─ TASK: Route planning   │  │  │                             │   │
│  │   │   └─ ACTION: API call   │  │  │ ⚠️ TimeoutError - TMS       │   │
│  │   └─ TASK: Notification     │  │  │ ✅ Resolved: Added retry    │   │
│  └─────────────────────────────┘  │  └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Customization

### Styling
Components use Tailwind CSS classes. Override by:
1. Wrapping components in custom containers
2. Using Tailwind's `@apply` in your CSS
3. Modifying component source

### API Base URL
Set `API_BASE` in components or use environment variable:
```typescript
const API_BASE = process.env.REACT_APP_EON_API || '/api';
```

---

🙏 Jai Guru Ji | ANKR Labs | PowerBox IT Solutions
