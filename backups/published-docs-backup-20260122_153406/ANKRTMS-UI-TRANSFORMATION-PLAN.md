# ANKRTMS UI-Only Transformation Plan
## Lowest Risk, Frontend-First Approach

**Date:** 2026-01-22
**Strategy:** Transform user-facing UI only - NO backend/database changes
**Risk Level:** LOW
**Estimated Time:** 60-90 minutes
**Rollback Time:** <5 minutes

---

## Overview

This plan focuses on **UI-only changes** - renaming all user-facing pages, subdomains, and branding from "WowTruck" to "ANKR TMS" without touching backend code or databases.

### What We'll Change
1. ✅ Subdomain names (`wowtruck.ankr.in` → `ankrtms.ankr.in`)
2. ✅ Nginx configurations
3. ✅ HTML page titles and meta tags
4. ✅ Static marketing pages (`/var/www/wowtruck/`)
5. ✅ React frontend branding
6. ✅ Frontend package names (UI packages only)

### What We WON'T Change
- ❌ Backend API code
- ❌ Database schemas or data
- ❌ Backend services or ports
- ❌ GraphQL resolvers
- ❌ Business logic

---

## Discovery Summary

### Active Web Services

#### 1. Main TMS Frontend
- **Current Domain:** `wowtruck.ankr.in`
- **New Domain:** `ankrtms.ankr.in`
- **Nginx Config:** `/etc/nginx/sites-available/wowtruck`
- **Frontend Source:** `/root/rocketlang/ankr-labs-nx/apps/wowtruck/frontend/`
- **Built Files:** `/root/rocketlang/ankr-labs-nx/apps/wowtruck/frontend/dist/`
- **Static Pages:** `/var/www/wowtruck/`
- **Backend Proxy:** `localhost:4000` (unchanged)

**Pages Served:**
- `/` - React app (index.html: "WowTruck 2.0")
- `/demo` - Demo slides
- `/capabilities` - Capability document
- `/qr-codes` - QR codes page
- `/slides` - Presentation slides
- `/email` - Email template
- `/download` - Documentation ZIP

#### 2. CRM Subdomain
- **Current Domain:** `crm.wowtruck.ankr.in`
- **New Domain:** `crm.ankrtms.ankr.in`
- **Nginx Config:** `/etc/nginx/sites-available/ankr-crm-wowtruck`
- **Backend:** `localhost:4012` (BFF - unchanged)
- **Frontend:** `localhost:5175` (dev server - unchanged)

---

## Phase 1: Backup & Preparation (10 mins)

### Step 1.1: Create Backup
```bash
# Backup nginx configs
cp -r /etc/nginx/sites-available /etc/nginx/sites-available.backup-$(date +%Y%m%d_%H%M%S)

# Backup static web files
tar -czf /root/backups/var-www-wowtruck-$(date +%Y%m%d_%H%M%S).tar.gz /var/www/wowtruck/

# Backup frontend source
tar -czf /root/backups/wowtruck-frontend-$(date +%Y%m%d_%H%M%S).tar.gz \
  /root/rocketlang/ankr-labs-nx/apps/wowtruck/frontend/
```

### Step 1.2: Stop Nginx (Optional - for safety)
```bash
# Test current config first
sudo nginx -t

# Optional: Stop nginx during changes
sudo systemctl stop nginx
```

---

## Phase 2: Rename Static Web Files (15 mins)

### Step 2.1: Rename /var/www/wowtruck Directory
```bash
# Rename directory
sudo mv /var/www/wowtruck /var/www/ankrtms

# Verify
ls -la /var/www/ | grep ankrtms
```

### Step 2.2: Update HTML Page Titles
```bash
# Update index.html
sudo sed -i 's/WowTruck 2\.0/ANKR TMS/g' /var/www/ankrtms/index.html
sudo sed -i 's/WowTruck/ANKR TMS/g' /var/www/ankrtms/index.html

# Update capabilities doc
sudo sed -i 's/WowTruck 2\.0/ANKR TMS/g' /var/www/ankrtms/wowtruck-capabilities.html
sudo sed -i 's/WowTruck/ANKR TMS/g' /var/www/ankrtms/wowtruck-capabilities.html

# Update demo slides
sudo sed -i 's/WowTruck/ANKR TMS/g' /var/www/ankrtms/demo-slides.html

# Update presentation slides
sudo sed -i 's/WowTruck/ANKR TMS/g' /var/www/ankrtms/slides.html

# Update QR codes page
sudo sed -i 's/WowTruck/ANKR TMS/g' /var/www/ankrtms/qr-codes.html

# Update email template
sudo sed -i 's/WowTruck/ANKR TMS/g' /var/www/ankrtms/email-template.html
sudo sed -i 's/WowTruck/ANKR TMS/g' /var/www/ankrtms/email-plain.txt
```

### Step 2.3: Rename Files with "wowtruck" in Name
```bash
cd /var/www/ankrtms/

# Rename capabilities file
mv wowtruck-capabilities.html ankrtms-capabilities.html

# Rename docs ZIP
mv wowtruck-docs.zip ankrtms-docs.zip

# Verify
ls -la | grep -i truck
# Should return nothing
```

---

## Phase 3: Update Nginx Configurations (20 mins)

### Step 3.1: Update Main TMS Nginx Config
```bash
# Edit /etc/nginx/sites-available/wowtruck
sudo nano /etc/nginx/sites-available/wowtruck

# Make these changes:
# 1. Change server_name: wowtruck.ankr.in → ankrtms.ankr.in
# 2. Update root path: /var/www/wowtruck → /var/www/ankrtms
# 3. Update alias paths: /var/www/wowtruck/ → /var/www/ankrtms/
# 4. Update file references: wowtruck-capabilities.html → ankrtms-capabilities.html
# 5. Update download filename: wowtruck-docs.zip → ankrtms-docs.zip
```

**Specific Changes:**
```nginx
# Line 96: Change server_name
server_name ankrtms.ankr.in;

# Line 102: Change server_name
server_name ankrtms.ankr.in;

# Line 111: NO CHANGE - keep pointing to apps/wowtruck/frontend/dist for now
# (We'll change directory structure later)

# Line 234: Update alias
location /qr-codes {
    alias /var/www/ankrtms/;
    index qr-codes.html;
}

# Lines 240, 246, 254, 262: Update all /var/www/wowtruck/ to /var/www/ankrtms/

# Line 256: Update file reference
try_files $uri $uri/ /ankrtms-capabilities.html;

# Line 263: Update file reference
try_files $uri $uri/ /ankrtms-capabilities.html;

# Line 270: Update filename
try_files /ankrtms-docs.zip =404;
add_header Content-Disposition "attachment; filename=ankrtms-docs.zip";
```

### Step 3.2: Update CRM Subdomain Nginx Config
```bash
# Edit /etc/nginx/sites-available/ankr-crm-wowtruck
sudo nano /etc/nginx/sites-available/ankr-crm-wowtruck

# Make these changes:
# 1. Change server_name: crm.wowtruck.ankr.in → crm.ankrtms.ankr.in
# 2. Update upstream names (optional but cleaner)
```

**Specific Changes:**
```nginx
# Line 3: Update upstream name (optional)
upstream ankr_crm_bff_ankrtms {

# Line 8: Update upstream name (optional)
upstream ankr_crm_frontend_ankrtms {

# Line 16: Change server_name
server_name crm.ankrtms.ankr.in;

# Line 30: Change server_name
server_name crm.ankrtms.ankr.in;

# Lines 38, 47: Update upstream references if you renamed them
proxy_pass http://ankr_crm_bff_ankrtms/graphql;
proxy_pass http://ankr_crm_frontend_ankrtms;
```

### Step 3.3: Rename Nginx Config Files
```bash
cd /etc/nginx/sites-available/

# Rename main TMS config
sudo mv wowtruck ankrtms

# Rename CRM config
sudo mv ankr-crm-wowtruck ankr-crm-ankrtms

# Update symlinks in sites-enabled
cd /etc/nginx/sites-enabled/

# Remove old symlinks if they exist
sudo rm -f wowtruck ankr-crm-wowtruck

# Create new symlinks
sudo ln -s /etc/nginx/sites-available/ankrtms ankrtms
sudo ln -s /etc/nginx/sites-available/ankr-crm-ankrtms ankr-crm-ankrtms

# Verify
ls -la | grep ankrtms
```

### Step 3.4: Test Nginx Configuration
```bash
# Test for syntax errors
sudo nginx -t

# Should output:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

---

## Phase 4: Update Frontend React App (20 mins)

### Step 4.1: Update Frontend index.html
```bash
cd /root/rocketlang/ankr-labs-nx/apps/wowtruck/frontend

# Update source index.html
sed -i 's/WowTruck 2\.0/ANKR TMS/g' index.html
sed -i 's/WowTruck/ANKR TMS/g' index.html

# Update meta description
sed -i 's/Transport Management System/ANKR Transport Management System/g' index.html
```

**Manual Edit Option:**
```bash
nano /root/rocketlang/ankr-labs-nx/apps/wowtruck/frontend/index.html
```

Change:
```html
<!-- FROM: -->
<meta name="description" content="WowTruck 2.0 - Transport Management System" />
<title>WowTruck 2.0</title>

<!-- TO: -->
<meta name="description" content="ANKR TMS - Transport Management System" />
<title>ANKR TMS</title>
```

### Step 4.2: Update App.tsx Branding (If Applicable)
```bash
# Search for hardcoded "WowTruck" in React components
grep -r "WowTruck" /root/rocketlang/ankr-labs-nx/apps/wowtruck/frontend/src/ \
  --include="*.tsx" --include="*.ts"

# Replace all occurrences
find /root/rocketlang/ankr-labs-nx/apps/wowtruck/frontend/src/ \
  -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/WowTruck/ANKR TMS/g'
```

### Step 4.3: Rebuild Frontend
```bash
cd /root/rocketlang/ankr-labs-nx/apps/wowtruck/frontend

# Clean previous build
rm -rf dist/

# Rebuild
npm run build
# OR
pnpm build
# OR
npx vite build

# Verify build output
ls -la dist/
cat dist/index.html | grep -i "ANKR TMS"
```

---

## Phase 5: SSL Certificate Update (15 mins)

### Step 5.1: Check Current SSL Certificate
```bash
# Check certificate domains
sudo openssl x509 -in /etc/letsencrypt/live/wowtruck.ankr.in/fullchain.pem -noout -text | grep DNS

# Should show: wowtruck.ankr.in
```

### Step 5.2: Request New SSL Certificate
```bash
# Option 1: Using Cloudflare (if using Cloudflare DNS)
# - Go to Cloudflare dashboard
# - Add DNS record: ankrtms.ankr.in → your-server-ip
# - Wait for DNS propagation (1-5 mins)

# Option 2: Using Let's Encrypt Certbot
sudo certbot certonly --nginx -d ankrtms.ankr.in -d crm.ankrtms.ankr.in

# Follow prompts, should create certificate at:
# /etc/letsencrypt/live/ankrtms.ankr.in/
```

### Step 5.3: Update Nginx SSL Paths
```bash
# Edit main config
sudo nano /etc/nginx/sites-available/ankrtms

# Update SSL certificate paths:
ssl_certificate /etc/letsencrypt/live/ankrtms.ankr.in/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/ankrtms.ankr.in/privkey.pem;
```

---

## Phase 6: DNS Update (External - 5 mins)

### Step 6.1: Add DNS Records
**If using Cloudflare:**
1. Login to Cloudflare dashboard
2. Select `ankr.in` domain
3. Go to DNS → Records
4. Add A record:
   - **Name:** `ankrtms`
   - **Type:** A
   - **Content:** Your server IP
   - **Proxy:** Enabled (orange cloud)
5. Add A record for CRM:
   - **Name:** `crm.ankrtms`
   - **Type:** A
   - **Content:** Your server IP
   - **Proxy:** Enabled

### Step 6.2: Wait for DNS Propagation
```bash
# Check DNS resolution (may take 1-5 minutes)
dig ankrtms.ankr.in +short
dig crm.ankrtms.ankr.in +short

# Should return your server IP
```

---

## Phase 7: Restart & Test (10 mins)

### Step 7.1: Reload Nginx
```bash
# Reload nginx with new config
sudo systemctl reload nginx

# OR restart if reload doesn't work
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
```

### Step 7.2: Test Endpoints

**Test HTTP → HTTPS Redirect:**
```bash
curl -I http://ankrtms.ankr.in
# Should return: 301 Moved Permanently
# Location: https://ankrtms.ankr.in/
```

**Test Main Page:**
```bash
curl -s https://ankrtms.ankr.in/ | grep -i "ANKR TMS"
# Should find: <title>ANKR TMS</title>
```

**Test Static Pages:**
```bash
curl -s https://ankrtms.ankr.in/capabilities | grep -i "ANKR TMS"
curl -s https://ankrtms.ankr.in/demo | grep -i "ANKR TMS"
curl -s https://ankrtms.ankr.in/qr-codes | grep -i "ANKR TMS"
```

**Test Backend Proxy (Should still work):**
```bash
curl -s https://ankrtms.ankr.in/health
# Should return backend health status
```

**Test CRM Subdomain:**
```bash
curl -I https://crm.ankrtms.ankr.in/
# Should return: 200 OK
```

### Step 7.3: Browser Testing
1. Open browser
2. Navigate to: `https://ankrtms.ankr.in/`
3. Verify:
   - ✅ Page loads successfully
   - ✅ Page title shows "ANKR TMS"
   - ✅ No "WowTruck" branding visible
   - ✅ Backend API calls work (check Network tab)
4. Test CRM: `https://crm.ankrtms.ankr.in/`

---

## Phase 8: Optional - Keep Old Domain Redirect (Low Risk)

### Option: Redirect wowtruck.ankr.in → ankrtms.ankr.in
This ensures old links still work.

```bash
sudo nano /etc/nginx/sites-available/wowtruck-redirect
```

**Add this config:**
```nginx
# Redirect old WowTruck domain to ANKR TMS
server {
    listen 80;
    listen 443 ssl http2;
    server_name wowtruck.ankr.in;

    ssl_certificate /etc/letsencrypt/live/wowtruck.ankr.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wowtruck.ankr.in/privkey.pem;

    return 301 https://ankrtms.ankr.in$request_uri;
}

server {
    listen 80;
    listen 443 ssl http2;
    server_name crm.wowtruck.ankr.in;

    ssl_certificate /etc/letsencrypt/live/wowtruck.ankr.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wowtruck.ankr.in/privkey.pem;

    return 301 https://crm.ankrtms.ankr.in$request_uri;
}
```

**Enable redirect:**
```bash
sudo ln -s /etc/nginx/sites-available/wowtruck-redirect /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**Test redirect:**
```bash
curl -I https://wowtruck.ankr.in/
# Should return: 301 → https://ankrtms.ankr.in/
```

---

## Verification Checklist

### Frontend UI
- [ ] Page title is "ANKR TMS" (not "WowTruck")
- [ ] Meta description updated
- [ ] No visible "WowTruck" branding in UI
- [ ] React app loads successfully
- [ ] Static pages load (demo, capabilities, etc.)

### Nginx
- [ ] `ankrtms.ankr.in` resolves and loads
- [ ] `crm.ankrtms.ankr.in` resolves and loads
- [ ] SSL certificates valid
- [ ] HTTP → HTTPS redirect works
- [ ] Backend proxy still works (`/graphql`, `/health`)
- [ ] Static file paths correct

### DNS
- [ ] DNS records created for ankrtms.ankr.in
- [ ] DNS records created for crm.ankrtms.ankr.in
- [ ] DNS propagation complete

### Files & Directories
- [ ] `/var/www/ankrtms/` directory exists
- [ ] HTML files updated with "ANKR TMS"
- [ ] File names updated (ankrtms-capabilities.html, etc.)
- [ ] Nginx config files renamed

### Backend (Should be UNCHANGED)
- [ ] Backend still running on port 4000
- [ ] GraphQL endpoint functional
- [ ] Database connections unchanged
- [ ] API responses normal

---

## Rollback Plan (If Needed)

### Quick Rollback (<5 mins)
```bash
# 1. Stop nginx
sudo systemctl stop nginx

# 2. Restore nginx configs
sudo rm -rf /etc/nginx/sites-available
sudo mv /etc/nginx/sites-available.backup-YYYYMMDD_HHMMSS /etc/nginx/sites-available

# 3. Restore static files
sudo rm -rf /var/www/ankrtms
tar -xzf /root/backups/var-www-wowtruck-YYYYMMDD_HHMMSS.tar.gz -C /

# 4. Restart nginx
sudo systemctl start nginx

# 5. Verify old domain works
curl -I https://wowtruck.ankr.in/
```

---

## What's NOT Changed (Backend Remains Intact)

### Unchanged Components
- ✅ Backend API code (still in `apps/wowtruck/backend/`)
- ✅ Database schemas (still `wowtruck` schema)
- ✅ GraphQL resolvers
- ✅ Service ports (4000, 4012, 5175)
- ✅ Environment variables (`WOWTRUCK_URL` still works)
- ✅ Package imports in backend
- ✅ Prisma client

**Backend directory structure still uses "wowtruck":**
```
/root/rocketlang/ankr-labs-nx/apps/wowtruck/
  ├── backend/         ← UNCHANGED
  └── frontend/        ← Only UI text changed
```

This ensures **zero disruption** to backend services!

---

## Next Steps After UI Transformation

Once UI transformation is complete and tested:

1. **Monitor for 24-48 hours** - Ensure everything works
2. **Collect user feedback** - Do users notice issues?
3. **Plan backend transformation** - Use full migration plan
4. **Update documentation** - API docs still reference "WowTruck"
5. **Notify stakeholders** - New domain names

---

## Timeline Summary

| Phase | Task | Time |
|-------|------|------|
| 1 | Backup & Preparation | 10 min |
| 2 | Rename Static Files | 15 min |
| 3 | Update Nginx Configs | 20 min |
| 4 | Update Frontend React | 20 min |
| 5 | SSL Certificate | 15 min |
| 6 | DNS Update | 5 min |
| 7 | Restart & Test | 10 min |
| 8 | Optional Redirect | 5 min |
| **Total** | | **60-90 min** |

---

## Success Criteria

- ✅ `https://ankrtms.ankr.in/` loads successfully
- ✅ `https://crm.ankrtms.ankr.in/` loads successfully
- ✅ Page title shows "ANKR TMS"
- ✅ No "WowTruck" visible in UI
- ✅ Backend API still works
- ✅ SSL certificates valid
- ✅ Zero downtime for backend
- ✅ Easy rollback available

---

**Status:** Ready for Execution
**Risk Level:** LOW (UI-only, backend untouched)
**Rollback:** <5 minutes
**Created:** 2026-01-22
