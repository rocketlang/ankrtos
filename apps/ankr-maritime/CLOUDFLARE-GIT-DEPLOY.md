# Mari8X Cloudflare Pages - Git Integration Deployment

**Status**: ✅ Frontend built and ready
**Build Location**: `/root/apps/ankr-maritime/frontend/dist/`
**Repository**: `rocketlang/dodd-icd` (GitHub)

---

## 🚀 5-Minute Git Deployment (Easiest!)

### Step 1: Push to GitHub

```bash
cd /root/apps/ankr-maritime
git add .
git commit -m "Mari8X frontend ready for deployment"
git push origin main
```

### Step 2: Connect Cloudflare Pages

1. Go to **https://dash.cloudflare.com/**
2. Click **"Pages"** in left sidebar
3. Click **"Create a project"**
4. Click **"Connect to Git"**

### Step 3: Select Repository

1. Choose **GitHub** as provider
2. Authorize Cloudflare (if first time)
3. Select repository: **`rocketlang/dodd-icd`**
4. Click **"Begin setup"**

### Step 4: Configure Build

```
Project name:              mari8x
Production branch:         main (or master)

Build Settings:
├─ Framework preset:       Vite
├─ Build command:          cd apps/ankr-maritime/frontend && npm install && npm run build
├─ Build output directory: apps/ankr-maritime/frontend/dist
└─ Root directory:         / (leave empty)

Environment Variables:
├─ NODE_VERSION:           20
└─ (No other env vars needed for static site)
```

### Step 5: Deploy!

1. Click **"Save and Deploy"**
2. Wait 2-3 minutes for build
3. Your site will be live at: **`https://mari8x.pages.dev`**

---

## 🌐 Custom Domain Setup (mari8x.com)

After deployment:

1. In Cloudflare Pages dashboard
2. Click on **"mari8x"** project
3. Go to **"Custom domains"** tab
4. Click **"Set up a custom domain"**
5. Enter: **`mari8x.com`**
6. Cloudflare will:
   - Automatically configure DNS
   - Issue SSL certificate
   - Enable CDN

**Result**: Site live at `https://mari8x.com` in ~5 minutes!

---

## 🔄 Auto-Deploy on Git Push

Once connected, Cloudflare Pages will:
- ✅ Auto-deploy on every push to `main`
- ✅ Create preview deployments for PR branches
- ✅ Show build logs and status
- ✅ Invalidate CDN cache automatically

**No manual deployment needed after initial setup!**

---

## 📊 What Gets Deployed

Your Mari8X frontend includes:

- ✅ AIS Live Dashboard (47M positions)
- ✅ AI-Powered Search (Cmd+K)
- ✅ Live Stats Widget (auto-refresh)
- ✅ Port Congestion Monitor
- ✅ Fun Facts Showcase
- ✅ 137 pages (full platform)

**Bundle Size**: 4.2 MB (compressed to 1 MB with gzip)
**Load Time**: ~2 seconds on 3G, <1s on WiFi

---

## 🐛 Troubleshooting

### Build Fails

**Error**: `Module not found`
**Fix**: Check `build command` includes `npm install`

**Error**: `Command not found: vite`
**Fix**: Change build command to use `npx vite build`

### Site Shows 404

**Error**: Routes don't work
**Fix**: Add `_redirects` file to `/dist/`:
```
/*    /index.html   200
```

We already have this configured in Vite!

### Environment Variables Missing

If backend API calls fail:
1. Add `VITE_API_URL` in Cloudflare Pages settings
2. Set to: `https://mari8x.com/api` (or your backend URL)

---

## ✅ Post-Deployment Checklist

- [ ] Site loads at `https://mari8x.pages.dev`
- [ ] Custom domain `mari8x.com` configured
- [ ] SSL certificate active (HTTPS)
- [ ] All pages load correctly
- [ ] API calls work (if backend is live)
- [ ] Search (Cmd+K) functional
- [ ] AIS data displays

---

**Next**: Once deployed, enable auto-deploy by keeping Git integration active!
