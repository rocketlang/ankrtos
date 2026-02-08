# Mari8X Manual Deployment (2 Minutes)

## Simple Upload Method

Your frontend is ready at: `/root/mari8x-frontend-upload.tar.gz`

### Option 1: Cloudflare Pages Dashboard Upload

1. Go to: https://dash.cloudflare.com/1c452912df3eea9e8f1a2a973ff337f5/pages

2. Find "mari8x" project (or create new one)

3. Click "Upload assets" or "Create deployment"

4. Upload the files from `/root/apps/ankr-maritime/frontend/dist/`
   - Just drag and drop all 6 files
   - Or upload the .tar.gz and it will extract

5. Done! Live in 30 seconds

### Option 2: Git Auto-Deploy (One-time setup, then automatic)

1. Go to: https://dash.cloudflare.com/pages
2. Click: "Connect to Git"
3. Select: `rocketlang/dodd-icd`
4. Configure:
   ```
   Project: mari8x
   Branch: master
   Build command: cd apps/ankr-maritime/frontend && npm install && npx vite build
   Build output: apps/ankr-maritime/frontend/dist
   ```
5. Every `git push` auto-deploys

### Option 3: Download and Upload Locally

If you want to download the build and upload from your computer:

```bash
# Download from server
scp -i ~/.ssh/your-key root@your-server:/root/mari8x-frontend-upload.tar.gz .

# Extract
tar -xzf mari8x-frontend-upload.tar.gz -C mari8x-dist

# Upload via Cloudflare dashboard
# (drag files from mari8x-dist folder)
```

---

## What Gets Deployed

✅ **6 Live Stat Cards:**
- 46,043,522 vessel positions
- 36,018 active vessels
- 12,714 global ports (103 countries)
- 45 port tariffs
- 12.8 knots average speed
- 2.15% OpenSeaMap coverage (273 ports)

✅ **Enhanced Landing Page:**
- Professional USP showcase
- Real-time GraphQL data
- Fast load times (<1s)
- Mobile responsive

✅ **All 137 Pages Ready**

---

## Quick Deploy: Copy-Paste Commands

If you have direct access to the mari8x server:

```bash
# SSH into server
ssh your-user@your-server

# Download build
curl -O http://your-transfer-service/mari8x-frontend-upload.tar.gz

# Extract to web root
tar -xzf mari8x-frontend-upload.tar.gz -C /var/www/mari8x/

# Set permissions
chown -R www-data:www-data /var/www/mari8x/

# Done!
```

---

## Current Status

✅ Frontend built (4.1 MB)
✅ Code pushed to GitHub
✅ Backend live at mari8x.com/health
⏳ Frontend awaiting upload

**Next:** Choose one of the 3 options above and you're live in 2 minutes!
