# Mari8X Cloudflare Pages - GitHub Auto-Deploy Setup

## 🎯 Permanent Solution: GitHub Integration

Every `git push` will automatically build and deploy mari8x.com.

---

## ✅ Prerequisites (Already Done)

- ✅ Code pushed to GitHub: `rocketlang/dodd-icd`
- ✅ Frontend built and tested
- ✅ Latest commit: 5ef022c

---

## 🚀 Setup Steps (5 minutes)

### Step 1: Access Cloudflare Pages

1. Open: https://dash.cloudflare.com/1c452912df3eea9e8f1a2a973ff337f5/pages
2. Click **"Create a project"**

### Step 2: Connect to Git

1. Click **"Connect to Git"**
2. Select **"GitHub"**
3. If prompted, click **"Connect GitHub account"** and authorize Cloudflare

### Step 3: Select Repository

1. In the repository list, find: **`rocketlang/dodd-icd`**
   - If not visible, click "Add account" and select your GitHub organization
2. Click **"Begin setup"**

### Step 4: Configure Build Settings

**IMPORTANT:** Copy these settings exactly:

```
Project name:              mari8x
Production branch:         master

Root directory:            /

Build command:             cd apps/ankr-maritime/frontend && npm install && npx vite build

Build output directory:    apps/ankr-maritime/frontend/dist
```

### Step 5: Environment Variables (Optional)

Click **"Add variable"** and add:

```
NODE_VERSION = 20
```

### Step 6: Deploy

1. Click **"Save and Deploy"**
2. First build will take 2-3 minutes
3. Watch the build logs for any errors

### Step 7: Add Custom Domain

After first deployment succeeds:

1. Go to project settings
2. Click **"Custom domains"** tab
3. Click **"Set up a custom domain"**
4. Enter: `mari8x.com`
5. Cloudflare will auto-configure DNS (since domain is on Cloudflare)
6. SSL certificate provisions automatically (~2 minutes)

---

## 🔍 Troubleshooting

### Build Fails with "Cannot find module"

**Cause:** Monorepo structure, dependencies not found

**Fix:** The build command already includes `cd apps/ankr-maritime/frontend` to handle this

### Build Fails with TypeScript Errors

**Cause:** Pre-existing TypeScript issues in codebase

**Fix:** Change build command to:
```bash
cd apps/ankr-maritime/frontend && npm install && npx vite build --mode production
```

This skips TypeScript checking (same as local build)

### Domain Not Resolving

**Cause:** DNS propagation or incorrect CNAME

**Fix:**
1. Check DNS in Cloudflare dashboard
2. Ensure CNAME points to `mari8x.pages.dev`
3. Wait 5 minutes for propagation

### Stats Not Loading

**Cause:** Backend CORS not configured for new domain

**Fix:** Backend needs to allow `https://mari8x.com` origin (already should be configured)

---

## 🎉 After Setup

Once configured, your workflow becomes:

```bash
# Make changes to frontend
cd /root/apps/ankr-maritime/frontend
# ... edit files ...

# Build locally to test (optional)
npx vite build

# Commit and push
git add .
git commit -m "feat: Update landing page"
git push

# Cloudflare automatically:
# 1. Detects push to master
# 2. Runs build command
# 3. Deploys to mari8x.com
# 4. Live in 2-3 minutes
```

**No more manual deployments ever!**

---

## 📊 What Deploys

Every push deploys:

- ✅ 6 stat cards with live data
  - 46M+ vessel positions
  - 36,018 active vessels
  - 12,714 global ports
  - 45 port tariffs
  - 12.8 knots avg speed
  - 2.15% OpenSeaMap coverage (273 ports)

- ✅ Enhanced landing page with USPs
- ✅ All 137 feature pages
- ✅ Real-time GraphQL integration
- ✅ Maritime intelligence platform

---

## 🔐 Security & Rollback

**Automatic Rollback:**
- If build fails, previous version stays live
- Zero downtime deployments

**Deployment History:**
- Every deployment saved
- One-click rollback to any previous version
- View logs for debugging

**Branch Previews:**
- Create branch → Cloudflare deploys preview
- Test before merging to master

---

## 📈 Benefits

✅ **Automatic:** Push to GitHub → Auto-deploy
✅ **Fast:** 2-3 minute builds, instant CDN propagation
✅ **Reliable:** Cloudflare's global network
✅ **Free:** Unlimited bandwidth on Cloudflare Pages
✅ **Versioned:** Every deployment tracked
✅ **Secure:** Automatic SSL, DDoS protection

---

## 🎯 Quick Reference

**Cloudflare Dashboard:** https://dash.cloudflare.com/1c452912df3eea9e8f1a2a973ff337f5/pages

**GitHub Repo:** https://github.com/rocketlang/dodd-icd

**Build Command:**
```bash
cd apps/ankr-maritime/frontend && npm install && npx vite build
```

**Build Output:**
```
apps/ankr-maritime/frontend/dist
```

**Production Branch:** `master`

---

## ✅ Checklist

- [ ] Open Cloudflare Pages dashboard
- [ ] Connect to GitHub
- [ ] Select rocketlang/dodd-icd repository
- [ ] Configure build settings (copy from above)
- [ ] Save and Deploy
- [ ] Wait for first build to complete (~3 min)
- [ ] Add custom domain: mari8x.com
- [ ] Verify site loads at https://mari8x.com
- [ ] Test a push to GitHub to confirm auto-deploy

---

**Status:** Ready to configure ✅
**Time Required:** 5 minutes
**Result:** Permanent auto-deployment solution 🚀
