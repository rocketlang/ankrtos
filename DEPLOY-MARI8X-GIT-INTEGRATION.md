# Mari8X Cloudflare Pages Deployment via Git Integration

**Date:** February 6, 2026
**Status:** Ready for Deployment
**Method:** Git Integration (Recommended)

---

## 🎯 Deployment Status

✅ **Frontend Build:** Complete (`/root/apps/ankr-maritime/frontend/dist/`)
✅ **Code Pushed:** GitHub `rocketlang/dodd-icd` (commit: 5ef022c)
✅ **Backend Live:** mari8x.com/health
⏳ **Frontend:** Awaiting Cloudflare Pages connection

---

## 🚀 Deployment Steps (5 minutes)

### Step 1: Access Cloudflare Dashboard

1. Go to https://dash.cloudflare.com/
2. Log in with your Cloudflare account
3. Navigate to **Pages** in the left sidebar

### Step 2: Create New Pages Project

1. Click **"Create a project"**
2. Select **"Connect to Git"**
3. Choose **GitHub** as the provider
4. If prompted, authorize Cloudflare to access your GitHub account

### Step 3: Select Repository

1. Search for: **`rocketlang/dodd-icd`**
2. Click **"Begin setup"**

### Step 4: Configure Build Settings

Fill in the configuration:

```
Project Name: mari8x
Production Branch: master

Build Settings:
  Framework preset: Vite
  Build command: cd apps/ankr-maritime/frontend && npm install && npx vite build
  Build output directory: apps/ankr-maritime/frontend/dist
  Root directory: /
```

**Environment Variables (if needed):**
```
NODE_VERSION = 20
```

### Step 5: Add Custom Domain

After the first deployment completes:

1. Go to your **mari8x** project
2. Click **"Custom domains"** tab
3. Click **"Set up a custom domain"**
4. Enter: **`mari8x.com`**
5. Cloudflare will automatically configure DNS if your domain is on Cloudflare
6. Wait 1-2 minutes for SSL provisioning

### Step 6: Verify Deployment

1. Check build logs in Cloudflare dashboard
2. Visit https://mari8x.com
3. Verify 6 stat cards are showing:
   - 46M+ vessel positions
   - 36,018 active vessels
   - 12,714 global ports
   - 45 port tariffs
   - 12.8 knots avg speed
   - 2.3% OpenSeaMap coverage (291 ports)

---

## 🔄 Future Deployments

Once connected, deployments are **automatic**:

- Every `git push` to `master` triggers a new deployment
- Build time: ~2-3 minutes
- Zero downtime deployments
- Automatic rollback on build failures

---

## 📊 What Gets Deployed

**Current Frontend Features:**
- ✅ 6 live stat cards with real data
- ✅ Enhanced landing page with USPs
- ✅ 137 feature-rich pages
- ✅ GraphQL API integration
- ✅ Real-time vessel tracking (41M+ positions)
- ✅ Maritime stats API
- ✅ OpenSeaMap coverage tracking

**Data Sources:**
- AIS positions: 46,043,522 (36,018 vessels)
- Global ports: 12,714 (103 countries)
- Port tariffs: 45 verified tariffs
- OpenSeaMap: 291 ports (2.3% coverage, 1000-port check in progress)

---

## 🛠️ Alternative: Manual Upload (Not Recommended)

If Git integration isn't working:

1. Build locally: `cd /root/apps/ankr-maritime/frontend && npx vite build`
2. Create deployment package: `tar -czf dist.tar.gz dist/`
3. Upload via Cloudflare dashboard: Pages → Upload assets

**Why not recommended:**
- Manual uploads every time you make changes
- No automatic deployments
- No deployment history
- More error-prone

---

## 🔍 Troubleshooting

### Build Fails

**Error:** "Command failed"
**Fix:** Ensure build command includes `cd apps/ankr-maritime/frontend` since project is in monorepo

### Domain Not Resolving

**Error:** Site not accessible at mari8x.com
**Fix:**
1. Verify DNS records in Cloudflare DNS tab
2. Ensure A/CNAME points to Cloudflare Pages
3. Wait up to 5 minutes for DNS propagation

### Stats Not Showing

**Error:** Stat cards show "0" or loading state
**Fix:**
1. Verify backend is running: https://mari8x.com/health
2. Check GraphQL endpoint: https://mari8x.com/graphql
3. Ensure CORS is configured for mari8x.com origin

---

## 📈 Expected Impact

**User Experience:**
- Landing page loads in <1s (Cloudflare CDN)
- Real-time data from GraphQL API
- 6 compelling stat cards demonstrating capability
- Professional showcase of Mari8X V2

**SEO Benefits:**
- Fast page loads improve rankings
- Rich data showcases maritime expertise
- Custom domain builds brand authority

---

## 📝 Next Steps After Deployment

1. **Monitor:** Check Cloudflare Analytics for traffic
2. **Optimize:** Review Core Web Vitals in dashboard
3. **Scale:** OpenSeaMap coverage check will complete (~4 hours remaining)
4. **Enhance:** Implement UX simplification strategies from `UX-SIMPLIFICATION-STRATEGY.md`

---

## 🎨 UX Simplification Roadmap

After initial deployment, consider implementing:

**Phase 1 (Weeks 1-2):** Universal search bar (Cmd+K)
**Phase 2 (Weeks 3-6):** Role-based dashboards
**Phase 3 (Weeks 7-11):** AI sidebar with proactive suggestions
**Phase 4 (Weeks 12-14):** Progressive disclosure system

See: `/root/apps/ankr-maritime/frontend/UX-SIMPLIFICATION-STRATEGY.md`

---

## ✅ Deployment Checklist

- [x] Frontend built successfully
- [x] Code committed to git (5ef022c)
- [x] Code pushed to GitHub
- [x] Backend live and healthy
- [ ] Cloudflare Pages project created
- [ ] GitHub repo connected
- [ ] Build settings configured
- [ ] First deployment successful
- [ ] Custom domain mari8x.com configured
- [ ] SSL certificate provisioned
- [ ] Frontend accessible at https://mari8x.com
- [ ] Stats loading correctly
- [ ] Map rendering properly

---

**Repository:** https://github.com/rocketlang/dodd-icd
**Branch:** master
**Latest Commit:** 5ef022c (OpenSeaMap tracking + maritime stats)
**Backend:** https://mari8x.com/health ✅
**Frontend:** Pending Git connection

---

## 🚀 Let's Deploy!

The easiest path forward is Git integration. It takes 5 minutes to set up and then every `git push` automatically deploys. No API tokens, no manual builds, no hassle.

Once connected, your Mari8X platform will be live at **https://mari8x.com** with:
- 46M+ vessel positions showcased
- 12,714 global ports displayed
- Real-time maritime intelligence
- Professional, compelling landing page

**Status:** Ready to deploy ✨
