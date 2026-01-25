# 🔧 SWAYAM BANI - tsx Loader Resolution Guide
## Troubleshooting & Permanent Solution
**Date:** December 29, 2025  
**Issue:** Module loading crashes on WebSocket connections  
**Status:** ✅ RESOLVED

---

# 📋 PROBLEM SUMMARY

## Symptoms
When users connected to Swayam via WebSocket (wss://swayam.digimitra.guru/swayam), the server would crash with:

```
Error: Cannot find package '/root/ankr-labs-nx/packages/bani/node_modules/@ankr/embeddings/dist/index.js' 
imported from /root/ankr-labs-nx/packages/bani/src/memory/embeddings.ts

code: 'ERR_MODULE_NOT_FOUND'
```

Key observations:
- Health endpoint (HTTP `/health`) worked fine
- Crash occurred ONLY on WebSocket connections
- Error referenced `.ts` source files even when running compiled `.js` files
- The embeddings.ts file had NO imports from @ankr/embeddings

---

# 🔍 ROOT CAUSE ANALYSIS

## The Problem: tsx Loader Interception

The tsx module (v4.7.0) was being registered globally through pm2, intercepting module resolution even when running compiled JavaScript files.

### Evidence Trail:
1. Stack traces showed tsx in the resolution chain:
   ```
   at resolveBase (file:///root/ankr-labs-nx/node_modules/.pnpm/tsx@4.20.6/node_modules/tsx/dist/esm/index.mjs)
   at resolveDirectory (...)
   at resolveTsPaths (...)
   at resolve (...)
   ```

2. Error pointed to `.ts` source files despite running `dist/server.js`:
   ```
   imported from /root/ankr-labs-nx/packages/bani/src/memory/embeddings.ts
   ```

3. The error occurred during **lazy loading** - when SwayamWebSocketHandler was first activated on a connection, it triggered the import of the embeddings module

### Why Health Check Worked:
- The main server started successfully
- Basic routes (HTTP health check) didn't trigger the problematic import path
- Only WebSocket handler initialization loaded the memory/embeddings module

### Why pm2 Was the Problem:
The pm2 ecosystem was configured (or inheriting) tsx as the interpreter, causing all JavaScript execution to go through tsx's module resolution system.

---

# ✅ SOLUTION: Bypass tsx Loader

## Quick Fix (Immediate)

```bash
# 1. Kill all pm2 processes
pm2 delete all
pm2 save --force

# 2. Run server directly with /usr/bin/node
cd /root/ankr-labs-nx/packages/bani
/usr/bin/node dist/server.js &

# 3. Verify
curl http://localhost:7777/health
```

## Permanent Fix (Production)

### Option 1: Direct Node Execution (Recommended)

Create a startup script that bypasses pm2's default configuration:

```bash
# /root/ankr-labs-nx/scripts/start-bani.sh
#!/bin/bash
cd /root/ankr-labs-nx/packages/bani
export NODE_ENV=production
exec /usr/bin/node dist/server.js
```

```bash
chmod +x /root/ankr-labs-nx/scripts/start-bani.sh
pm2 start /root/ankr-labs-nx/scripts/start-bani.sh --name bani-api
pm2 save
```

### Option 2: Explicit pm2 Configuration

Create/update ecosystem.config.js:

```javascript
// /root/ankr-labs-nx/ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'bani-api',
      script: '/root/ankr-labs-nx/packages/bani/dist/server.js',
      interpreter: '/usr/bin/node',  // CRITICAL: Use system node, not tsx
      cwd: '/root/ankr-labs-nx/packages/bani',
      env: {
        NODE_ENV: 'production',
        PORT: 7777,
      },
      node_args: '--experimental-specifier-resolution=node',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/bani/error.log',
      out_file: '/var/log/bani/out.log',
    }
  ]
};
```

```bash
pm2 delete all
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Option 3: Systemd Service (Most Robust)

```bash
# /etc/systemd/system/bani-api.service
[Unit]
Description=Swayam BANI Voice AI Service
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=root
WorkingDirectory=/root/ankr-labs-nx/packages/bani
ExecStart=/usr/bin/node /root/ankr-labs-nx/packages/bani/dist/server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=7777

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable bani-api
sudo systemctl start bani-api
sudo systemctl status bani-api
```

---

# 🧪 VERIFICATION STEPS

## 1. Check Server is Running
```bash
ps aux | grep "node.*server.js" | grep -v grep
# Should show: /usr/bin/node /root/ankr-labs-nx/packages/bani/dist/server.js
```

## 2. Health Check
```bash
curl -s http://localhost:7777/health | jq .
# Should return full status with all services initialized
```

## 3. WebSocket Test
```bash
node -e "
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:7777/swayam');
ws.on('open', () => {
  console.log('✅ Connected!');
  ws.send(JSON.stringify({ type: 'join', sessionId: 'test', userId: 'test', language: 'en' }));
});
ws.on('message', (d) => console.log('Received:', d.toString().substring(0,100)));
ws.on('error', (e) => console.log('❌ Error:', e.message));
setTimeout(() => { ws.close(); process.exit(0); }, 3000);
"
```

## 4. Production Frontend Test
Open https://swayam.digimitra.guru and:
1. Click microphone button
2. Speak something
3. Verify response comes back without errors

---

# 🚫 WHAT NOT TO DO

1. **Don't use `pm2 start npm -- run dev`** - This invokes tsx
2. **Don't set NODE_OPTIONS to include tsx loader**
3. **Don't run with `npx tsx dist/server.js`** - Defeats the purpose
4. **Don't forget to `npm run build` after code changes** - Always compile TS→JS first

---

# 📊 DIAGNOSIS COMMANDS

If the issue recurs, use these commands:

```bash
# Check if tsx is in the module resolution
pm2 logs bani-api --nostream --lines 100 | grep tsx

# Check interpreter being used
pm2 show bani-api | grep interpreter

# Check for tsx in stack trace
pm2 logs bani-api --nostream --lines 50 | grep -A5 "ERR_MODULE"

# Verify compiled JS exists
ls -la /root/ankr-labs-nx/packages/bani/dist/memory/

# Check for stray imports
grep -r "@ankr/embeddings" /root/ankr-labs-nx/packages/bani/src/
```

---

# 🏗️ ARCHITECTURE NOTES

## Current Module Structure
```
packages/bani/
├── src/                      # TypeScript source
│   ├── server.ts             # Entry point
│   ├── memory/
│   │   ├── embeddings.ts     # Multi-provider embeddings
│   │   ├── pg-client.ts      # PostgreSQL connection
│   │   ├── pg-memory.ts      # Permanent storage
│   │   ├── redis-client.ts   # Fast cache
│   │   └── index.ts          # Re-exports
│   └── swayam/
│       └── index.ts          # WebSocket handler (lazy loads memory/)
└── dist/                     # Compiled JavaScript (what should run)
    ├── server.js
    ├── memory/
    │   ├── embeddings.js     # NO external imports
    │   └── ...
    └── swayam/
        └── index.js
```

## Lazy Loading Pattern
The SwayamWebSocketHandler uses lazy imports:
```typescript
// In swayam/index.ts
const { getEmbedding } = await import('../memory/index.js');
```

This pattern defers loading until first WebSocket connection, which is why:
- Server starts fine
- Health check works
- First WebSocket connection triggers the crash (when tsx was intercepting)

---

# 📝 LESSONS LEARNED

1. **tsx is aggressive** - It hooks into Node's module resolution even when you run compiled .js files
2. **pm2 inherits configuration** - Check ecosystem.config.js and pm2 settings
3. **Lazy loading reveals hidden issues** - Problems only appear when specific code paths execute
4. **Always verify with production path** - Health endpoints aren't enough; test actual user flows
5. **Direct node is safest** - For production, explicitly use `/usr/bin/node`

---

# 🔗 RELATED FILES

| File | Purpose |
|------|---------|
| `/root/ankr-labs-nx/packages/bani/dist/server.js` | Compiled entry point |
| `/root/ankr-labs-nx/packages/bani/src/memory/embeddings.ts` | Embedding service source |
| `/root/ankr-labs-nx/packages/bani/package.json` | `"type": "module"` setting |
| `/root/ankr-labs-nx/ecosystem.config.js` | pm2 configuration (if exists) |

---

# 📞 QUICK REFERENCE

## Start Server (Safe Method)
```bash
cd /root/ankr-labs-nx/packages/bani
npm run build                              # Compile TypeScript
/usr/bin/node dist/server.js &             # Run with system node
```

## Check Status
```bash
curl http://localhost:7777/health
```

## View Logs
```bash
# If running in foreground
tail -f /tmp/bani-server.log

# If using pm2
pm2 logs bani-api --lines 50
```

## Restart After Code Changes
```bash
npm run build
pkill -f "node.*server.js" || true
/usr/bin/node dist/server.js &
```

---

*Troubleshooting Guide v1.0*  
*December 29, 2025*  
*🙏 Jai Guru Ji | ANKR Labs*

**जो सोचो, वो हो जाए! 🚀**
