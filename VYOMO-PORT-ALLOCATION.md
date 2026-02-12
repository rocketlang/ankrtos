# ✅ Vyomo Port Allocation - Complete

**Date**: 2026-02-11
**Status**: ✅ **Ports Allocated via ankr-ctl**
**Config**: Centralized in `/root/.ankr/config/ports.json`

---

## 🔌 Port Assignments

| Service | Port | Config Location | Status |
|---------|------|-----------------|--------|
| **Vyomo Frontend** | 3011 | `frontend.vyomo` | ✅ Allocated |
| **Vyomo Backend API** | 4025 | `backend.vyomo` | ✅ Allocated |
| **AI Proxy** | 4444 | `ai.proxy` | ✅ Reserved |

---

## 📋 Configuration Files Updated

### 1. ankr-ctl Ports Config
**File**: `/root/.ankr/config/ports.json`

```json
{
  "frontend": {
    "vyomo": 3011
  },
  "backend": {
    "vyomo": 4025
  },
  "ai": {
    "proxy": 4444
  }
}
```

### 2. Vyomo Config Package
**File**: `/root/ankr-options-standalone/packages/config/src/index.ts`

```typescript
export const VYOMO_PORTS = {
  api: 4025,    // Backend API
  ws: 4021,     // WebSocket Server
  web: 3011     // Frontend Web (updated from 3010)
} as const;
```

### 3. Vyomo API Server
**File**: `/root/ankr-options-standalone/apps/vyomo-api/src/main.ts`

```typescript
import { getApiPort, getHost } from '@vyomo/config'

const PORT = getApiPort()  // 4025
const HOST = getHost()     // localhost (dev) | 0.0.0.0 (prod)
```

---

## 🔧 Port Conflict Resolution

### Issue
Both `frontend.coralAstrology` and `frontend.vyomo` were using port **3010**

### Solution
- **coralAstrology**: Kept on 3010
- **vyomo**: Moved to **3011**
- Updated `/root/.ankr/config/ports.json`
- Updated `@vyomo/config` package

---

## 🚀 Usage

### Check Port Allocations
```bash
ankr-ctl ports
```

### Start Vyomo Services
```bash
# Backend API (port 4025)
cd /root/ankr-options-standalone/apps/vyomo-api
pnpm dev

# Frontend (port 3011)
cd /root/ankr-options-standalone/apps/vyomo-web
pnpm dev
```

### Access Services
- **Frontend**: http://localhost:3011
- **API GraphQL**: http://localhost:4025/graphql
- **API Health**: http://localhost:4025/health

---

## 🌐 Environment Variables (Optional Override)

```bash
# Override ports via environment variables
export VYOMO_WEB_PORT=3011
export VYOMO_API_PORT=4025
export VYOMO_WS_PORT=4021
export VYOMO_API_HOST=localhost

# Or in .env file
VYOMO_WEB_PORT=3011
VYOMO_API_PORT=4025
VYOMO_WS_PORT=4021
VYOMO_API_HOST=localhost
```

---

## 📊 ANKR Port Ranges

| Category | Range | Vyomo Ports |
|----------|-------|-------------|
| Frontend | 3000-3099 | **3011** (web) |
| Backend | 4000-4099 | **4025** (api) |
| AI Services | 4400-4499 | 4444 (ai-proxy) |

---

## 🔒 Reserved Ports (DO NOT USE)

- **4444**: AI Proxy (embeddings, LLM routing)
- **4000**: ANKR TMS Backend
- **3010**: Coral Astrology Frontend

---

## ✅ Verification

```bash
# Check if ports are available
lsof -ti:3011  # Should be empty (Vyomo web not running)
lsof -ti:4025  # Should be empty (Vyomo API not running)
lsof -ti:4444  # Should show PID (AI proxy running)

# Start Vyomo API
cd /root/ankr-options-standalone/apps/vyomo-api
pnpm dev

# Verify it's listening on 4025
lsof -ti:4025  # Should show PID

# Test health endpoint
curl http://localhost:4025/health
```

---

## 📝 Summary

✅ **Port Conflicts Resolved**
✅ **Centralized Configuration via ankr-ctl**
✅ **@vyomo/config Package Updated**
✅ **Environment Variable Support**
✅ **No Hardcoded Ports**

**All Vyomo services now use ANKR Labs standard port allocation!**

---

**Created**: 2026-02-11
**Updated**: `/root/.ankr/config/ports.json`
**Tool**: `ankr-ctl ports`
