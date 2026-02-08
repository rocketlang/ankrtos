# Mari8X Registration in ankr-ctl

## ✅ Status: Fully Registered

Mari8X OSRM is now fully registered in the ANKR service orchestration system.

---

## 📋 Configuration Details

### Service Registration

**Files Updated:**
- `/root/.ankr/config/ports.json` - Port assignments
- `/root/.ankr/config/services.json` - Service definitions
- `/root/.ankr/config/databases.json` - Database configuration

### Port Assignments

| Component | Port | Path |
|-----------|------|------|
| **Backend** | 4051 | /root/apps/ankr-maritime/backend |
| **Frontend** | 3008 | /root/apps/ankr-maritime/frontend |
| **Database** | 6432 (pgbouncer) → 5432 (postgres) | ankr_maritime |

### Service Names

**Primary:** `ankr-maritime-backend`

**Aliases:**
- `mari8x`
- `maritime`
- `mrk8x`
- `mari8x-osrm`
- `shipping`

---

## 🚀 Usage

### Start/Stop Services

```bash
# Start backend
ankr-ctl start ankr-maritime-backend
ankr-ctl start mari8x  # Using alias

# Stop backend
ankr-ctl stop ankr-maritime-backend

# Restart backend
ankr-ctl restart ankr-maritime-backend

# Check status
ankr-ctl status ankr-maritime-backend
```

### Database Operations

```bash
# Get database identity
ankr-ctl db identity mari8x

# Get DATABASE_URL (for scripts)
ankr-ctl db url mari8x

# Output:
# postgresql://ankr:indrA@0612@localhost:6432/ankr_maritime
```

### View All Services

```bash
# View all ANKR services
ankr-ctl apps

# View port allocations
ankr-ctl ports

# Check for port conflicts
ankr-ctl conflicts
```

---

## 📊 Database Configuration

```json
{
  "ankr_maritime": {
    "server": "local-postgres",
    "name": "ankr_maritime",
    "schema": "public",
    "user": "ankr",
    "password": "indrA@0612",
    "tables": 18,
    "description": "Mari8X OSRM - Maritime Operations & Route Management",
    "apps": ["ankr-maritime-backend"],
    "prisma": "/root/apps/ankr-maritime/backend/prisma/schema.prisma",
    "env": "/root/apps/ankr-maritime/backend/.env"
  }
}
```

### Special Features

- **TimescaleDB Integration**: 55M+ AIS positions in hypertables
- **pgbouncer**: Connection pooling via port 6432
- **Compression**: 90% storage reduction on historical data
- **Real-time Updates**: Live vessel tracking with WebSocket subscriptions

---

## 🗺️ Service Definition

```json
{
  "ankr-maritime-backend": {
    "portPath": "backend.ankrMaritime",
    "path": "/root/apps/ankr-maritime/backend",
    "command": "npx tsx src/main.ts",
    "description": "Mari8X Maritime Operations API (Fastify + GraphQL)",
    "healthEndpoint": "/health",
    "enabled": true,
    "pm2Name": "mari8x-backend",
    "domain": "mari8x.com",
    "env": {
      "NODE_ENV": "production",
      "DATABASE_URL": "postgresql://ankr:indrA@0612@localhost:6432/ankr_maritime",
      "JWT_SECRET": "mrk8x-jwt-secret-2026",
      "FRONTEND_URL": "https://mari8x.com",
      "ENABLE_AIS": "true"
    }
  }
}
```

---

## 📦 App Group: Maritime

Mari8X is registered under the **maritime** app group:

```json
{
  "maritime": {
    "description": "Maritime & Shipping Operations",
    "apps": {
      "ankr-maritime-backend": "Mari8X OSRM - Maritime Operations & Route Management (55M+ AIS positions, TimescaleDB)"
    }
  }
}
```

---

## 🎯 Features Enabled

### Via ankr-ctl:

- ✅ **Auto-restart** on crash
- ✅ **Port conflict detection**
- ✅ **Health monitoring** (/health endpoint)
- ✅ **Database identity tracking**
- ✅ **Resource monitoring** (CPU, Memory, Uptime)
- ✅ **Alias support** (use short names like `mari8x`)
- ✅ **Environment variable injection**
- ✅ **PM2 integration ready**

### Monitoring:

```bash
# Current status
ankr-ctl status mari8x

# Expected output:
# ╔═══════════════════════════════════════════════════════╗
# ║ SERVICE: ankr-maritime-backend                        ║
# ║ STATUS: ✅ RUNNING                                    ║
# ║ PORT: 4051                                            ║
# ║ MEMORY: ~60MB                                         ║
# ║ DATABASE: ankr_maritime (55M+ positions)              ║
# ║ DOMAIN: mari8x.com                                    ║
# ╚═══════════════════════════════════════════════════════╝
```

---

## 🔧 Environment Variables

Set via `/root/apps/ankr-maritime/backend/.env`:

```bash
PORT=4051
NODE_ENV=production
DATABASE_URL=postgresql://ankr:indrA@0612@localhost:6432/ankr_maritime
JWT_SECRET=mrk8x-jwt-secret-2026
FRONTEND_URL=https://mari8x.com
ENABLE_AIS=true
```

---

## 🌐 Integration Points

### Nginx Proxy

```nginx
# /etc/nginx/sites-enabled/mari8x.com
location /graphql {
  proxy_pass http://localhost:4051;
  # ... proxy headers
}

location /api/ {
  proxy_pass http://localhost:4051;
  # ... proxy headers
}
```

### GraphQL Endpoint

- **URL**: http://localhost:4051/graphql
- **Public**: https://mari8x.com/graphql
- **GraphiQL IDE**: http://localhost:4051/graphiql

### Health Check

```bash
curl http://localhost:4051/health
# Expected: {"status": "ok", "database": "connected"}
```

---

## 📈 Current Deployment

| Metric | Value |
|--------|-------|
| **Status** | ✅ RUNNING |
| **Uptime** | Managed by ankr-ctl |
| **Backend Port** | 4051 |
| **Database** | ankr_maritime (18 models) |
| **Vessel Positions** | 55.3M (TimescaleDB) |
| **Unique Vessels** | 43K tracked |
| **API Performance** | <10ms (P95 with TimescaleDB) |
| **Maps** | 29K+ vessels rendering |
| **Domain** | https://mari8x.com |

---

## 🔄 Comparison with Other ANKR Services

| Service | Frontend | Backend | Database | Status |
|---------|----------|---------|----------|--------|
| **Mari8X** | 3008 | 4051 | ankr_maritime | ✅ RUNNING |
| FreightBox | 3001 | 4003 | freightbox | STOPPED |
| Fr8X | 3006 | 4050 | fr8x | STOPPED |
| EON Memory | - | 4005 | ankr_eon | RUNNING |
| AI Proxy | - | 4444 | - | RUNNING |
| Odoo | - | 8019 | odoo_freightbox | RUNNING |

---

## 📝 Next Steps

### Optional Enhancements:

1. **PM2 Integration**: Enable PM2 mode for advanced process management
   ```bash
   pm2 start ankr-ctl -- start mari8x
   pm2 save
   ```

2. **Auto-start on Boot**: Add to system startup
   ```bash
   # Via systemd or PM2 startup
   pm2 startup
   ```

3. **Log Rotation**: Configure log management
   ```bash
   # Logs location: /root/.ankr/logs/ankr-maritime-backend.log
   ```

4. **Backup Automation**: Enable automatic database backups
   ```bash
   ankr-ctl db backup mari8x
   ```

---

## 🎯 Summary

**Mari8X OSRM is now fully integrated into the ANKR ecosystem!**

- ✅ Registered in ankr-ctl
- ✅ Port 4051 dedicated and managed
- ✅ Database tracked (ankr_maritime)
- ✅ Health monitoring enabled
- ✅ Alias support (mari8x, maritime, etc.)
- ✅ Production-ready deployment

**Manage with:**
```bash
ankr-ctl start|stop|restart|status mari8x
```

**Author**: ANKR Labs | Jai Guru Ji
**Date**: February 8, 2026
**Version**: 1.0.0
