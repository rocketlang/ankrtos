# 🤖 Mari8X Deployment - FULLY AUTOMATED

## ✅ What's Been Set Up

**GitHub Actions Workflow Created:** `.github/workflows/deploy-mari8x.yml`

Every time you `git push` to master, GitHub will automatically:
1. ✅ Detect changes in `apps/ankr-maritime/frontend/`
2. ✅ Install dependencies
3. ✅ Build with Vite
4. ✅ Deploy to Cloudflare Pages
5. ✅ Update mari8x.com

**Zero manual work after initial setup!**

---

## 🔐 One-Time Setup (2 minutes)

### Step 1: Add Cloudflare API Token to GitHub

1. Go to: **https://github.com/rocketlang/dodd-icd/settings/secrets/actions**

2. Click: **"New repository secret"**

3. Fill in:
   - **Name:** `CLOUDFLARE_API_TOKEN`
   - **Value:** Your Cloudflare API token (the one you provided earlier)

4. Click: **"Add secret"**

### Step 2: Enable GitHub Actions (if disabled)

1. Go to: **https://github.com/rocketlang/dodd-icd/actions**

2. If you see "Workflows are disabled", click **"I understand my workflows, go ahead and enable them"**

---

## 🚀 How to Deploy

### First Deployment

**Option A:** Trigger manually from GitHub
```
Go to: https://github.com/rocketlang/dodd-icd/actions/workflows/deploy-mari8x.yml
Click: "Run workflow" → "Run workflow"
```

**Option B:** Push any change
```bash
cd /root/apps/ankr-maritime/frontend
# Make any small change
git commit -am "feat: Trigger first deployment"
git push
```

### Future Deployments

Just push to master - that's it!
```bash
git push
```

GitHub Actions automatically:
- Detects the push
- Builds the frontend
- Deploys to mari8x.com
- Takes 2-3 minutes
- You get notified if it fails

---

## 📊 Monitor Deployments

**GitHub Actions Dashboard:**
https://github.com/rocketlang/dodd-icd/actions

You'll see:
- ✅ Build status (green = success, red = failed)
- ⏱️ Build time
- 📝 Deployment logs
- 🔔 Email notifications on failure

**Cloudflare Pages Dashboard:**
https://dash.cloudflare.com/1c452912df3eea9e8f1a2a973ff337f5/pages/view/mari8x

You'll see:
- 🌐 Live deployment
- 📈 Analytics
- 🔗 Preview URLs
- ⏮️ Rollback options

---

## 🛠️ Troubleshooting

### Build Fails with Authentication Error

**Problem:** API token not configured or invalid

**Fix:**
1. Check token is added to GitHub secrets: https://github.com/rocketlang/dodd-icd/settings/secrets/actions
2. Ensure token has these permissions:
   - Account: Cloudflare Pages - Edit
   - User: User Details - Read
   - Zone: Zone - Read

### Workflow Doesn't Trigger

**Problem:** Path filter or branch mismatch

**Fix:** Check the workflow file triggers on:
```yaml
on:
  push:
    branches: [master]
    paths: ['apps/ankr-maritime/frontend/**']
```

Make sure you're pushing to `master` branch and changing files in the frontend directory.

### Build Succeeds but Site Not Updated

**Problem:** Domain not configured in Cloudflare Pages

**Fix:**
1. Go to Cloudflare Pages dashboard
2. Add custom domain: `mari8x.com`
3. Wait 2-3 minutes for DNS

---

## 🎯 Alternative: Cloudflare API Direct Setup

If GitHub Actions doesn't work, use the API automation:

```bash
# Run the API automation script
export CLOUDFLARE_API_TOKEN='your-token'
/root/automate-cloudflare-pages-setup.sh
```

This will:
- Create/update the Pages project via API
- Connect it to GitHub repository
- Configure build settings
- Add custom domain
- Trigger deployment

---

## 📋 Summary

| Method | Setup Time | Future Effort | Best For |
|--------|-----------|---------------|----------|
| **GitHub Actions** ✅ | 2 min | Zero (auto on push) | Permanent solution |
| API Script | 1 min | Zero (auto on push) | If Actions blocked |
| Dashboard Manual | 5 min | Zero (auto on push) | UI preference |

**Recommended:** GitHub Actions (already set up!)

---

## ✅ Checklist

- [ ] Add `CLOUDFLARE_API_TOKEN` to GitHub secrets
- [ ] Enable GitHub Actions if disabled
- [ ] Trigger first deployment (manual or push)
- [ ] Verify at https://mari8x.com
- [ ] Enjoy automated deployments forever!

---

## 🎉 What You Get

**46,043,522** vessel positions
**36,018** active vessels
**12,714** global ports
**2.15%** OpenSeaMap coverage (273 ports)
**6** live stat cards
**137** feature pages
**Automated** deployments on every push

**Status:** Configuration complete, awaiting GitHub secret 🚀

---

## 📖 Files Created

- `.github/workflows/deploy-mari8x.yml` - GitHub Actions workflow
- `apps/ankr-maritime/frontend/wrangler.toml` - Wrangler config
- `apps/ankr-maritime/frontend/.cloudflare-pages.json` - Pages config
- `/root/automate-cloudflare-pages-setup.sh` - API automation script
- `/root/CLOUDFLARE-PAGES-SETUP.md` - Full manual setup guide

---

**Next Action:** Add CLOUDFLARE_API_TOKEN to GitHub repo secrets, then push any change!
