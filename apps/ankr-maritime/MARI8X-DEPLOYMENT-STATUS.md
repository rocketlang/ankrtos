# Mari8X Landing Page - Deployment Status

## ✅ DEPLOYED TO SERVER

### Frontend Build
- ✅ Built successfully at `/root/apps/ankr-maritime/frontend/dist`
- ✅ 3,241 modules transformed
- ✅ Bundle size: 3.9 MB (963 KB gzipped)
- ✅ Build time: 10.04s

### Nginx Configuration
- ✅ Config file: `/etc/nginx/sites-available/mari8x.com`
- ✅ Symlink: `/etc/nginx/sites-enabled/mari8x.com`
- ✅ Config test: PASSED
- ✅ Nginx: RELOADED

### Files Served
```
/root/apps/ankr-maritime/frontend/dist/
├── assets/
│   ├── index-CZ_bLAb7.css (169.58 KB)
│   └── index-CyXTHtrT.js (3.9 MB)
├── index.html (655 bytes)
└── locales/
```

## ⚠️ Cloudflare Configuration Needed

The domain `mari8x.com` is currently behind Cloudflare and showing a health endpoint response. 

### Current Response
```json
{"status":"OK","timestamp":"2026-02-04T11:01:08.551Z","plugins":["auth","iam","wire","security","ai"]}
```

### To Make Landing Page Live

**Option 1: Update Cloudflare Origin Server**
1. Log into Cloudflare dashboard
2. Go to DNS settings for mari8x.com
3. Ensure A record points to this server's IP
4. Check SSL/TLS settings (should be "Flexible" or "Full")
5. Clear Cloudflare cache

**Option 2: Test Directly**
Access via server IP to bypass Cloudflare:
```bash
curl -H "Host: mari8x.com" http://SERVER_IP/
```

**Option 3: Disable Cloudflare Proxy (Orange Cloud)**
1. In Cloudflare DNS settings
2. Click the orange cloud next to mari8x.com
3. Turn it gray (DNS only)
4. Wait for DNS propagation

## 🌐 URLs

Once Cloudflare is configured:
- **Landing Page:** https://mari8x.com
- **AIS Dashboard:** https://mari8x.com/ais/live  
- **Login:** https://mari8x.com/login
- **Beta Signup:** https://mari8x.com/beta/signup

## 📝 What's Deployed

### Landing Page Features
- ✅ Hero section with live AIS stats
- ✅ 96+ features across 8 categories
- ✅ Live vessel feed (will update when backend connects)
- ✅ Professional dark glassmorphism design
- ✅ Responsive mobile-first layout
- ✅ Multiple CTAs (Join Beta, View Live Data)

### Note on Live Data
The animated counters and live vessel feed will activate once:
1. Backend is running on port 4051
2. GraphQL endpoint is accessible
3. Apollo Client can connect

Currently, the page will load but show 0 for live stats until backend is connected.

## 🔧 Server Configuration

**Nginx Config:**
```nginx
server {
    listen 80;
    server_name mari8x.com www.mari8x.com;
    root /root/apps/ankr-maritime/frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /graphql {
        proxy_pass http://localhost:4051/graphql;
    }
}
```

**Status:** 
- ✅ Nginx serving files correctly
- ⏳ Waiting for Cloudflare configuration
- ⏳ Backend needed for live data

## 🚀 Next Steps

1. **Configure Cloudflare** to point to this server
2. **Start Backend** on port 4051 for live data
3. **Verify** landing page loads at https://mari8x.com
4. **Test** live data feed and GraphQL connection

---

**Deployed:** February 4, 2026 16:32 IST  
**Status:** ✅ Server-side complete, waiting for Cloudflare config  
**Files:** Production-ready and served by nginx
