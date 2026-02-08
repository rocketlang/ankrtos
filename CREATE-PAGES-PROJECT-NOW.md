# Create Cloudflare Pages Project - Simple Guide

## ❌ Cannot Create Via API

The API token doesn't have permission to create Pages projects.

**Error:** `Unable to authenticate request [code: 10001]`

---

## ✅ Create Via Dashboard (3 minutes)

This is the **only** way forward with current credentials.

### Step-by-Step:

**1. Open Cloudflare Pages**
```
https://dash.cloudflare.com/1c452912df3eea9e8f1a2a973ff337f5/pages
```

**2. Click "Create a project"**

**3. Click "Connect to Git"**

**4. Select "GitHub" as provider**
- Authorize Cloudflare to access your GitHub if prompted

**5. Select repository**
- Find: `rocketlang/dodd-icd`
- Click "Begin setup"

**6. Configure build settings:**

```
Project name:              mari8x
Production branch:         master

Framework preset:          Vite

Build command:             cd apps/ankr-maritime/frontend && npm install && npx vite build
Build output directory:    apps/ankr-maritime/frontend/dist
Root directory:            (leave empty or /)

Environment variables:
  NODE_VERSION = 20
```

**7. Click "Save and Deploy"**

**8. Wait 2-3 minutes for first build**

**9. Add custom domain (after first deploy succeeds):**
- Go to project settings → Custom domains
- Add: `mari8x.com`
- Cloudflare auto-configures DNS

---

## 🎉 Result

Once created:
- ✅ First deployment completes
- ✅ Site live at mari8x.com
- ✅ GitHub Actions will work for future deployments
- ✅ Every `git push` auto-deploys

---

## 📊 What Will Deploy

- 46,043,522 vessel positions
- 36,018 active vessels
- 12,714 global ports
- 2.15% OpenSeaMap coverage (273 ports)
- 6 live stat cards
- Enhanced landing page

**Build ready:** 4.1 MB (987 KB gzipped)

---

## ⚠️ Why API Doesn't Work

The token `adf7e11d951f21a7007bf9ddd1d4713178a77` lacks permissions:
- Cannot create Pages projects
- Cannot access account resources

**To fix:** Generate new token at https://dash.cloudflare.com/profile/api-tokens with:
- Account: Cloudflare Pages - Edit
- User: User Details - Read
- Zone: Zone - Read

But for now, **dashboard method is faster and easier!**

---

**Next:** Open the dashboard link above and follow the 9 steps. Takes 3 minutes total.
