# ANKR Email Addresses for Migadu Setup

**Date:** 2026-01-22
**Email Server:** Migadu
**Domain:** ankr.in

---

## Email Addresses to Create (10 Required)

### 1. Leadership & Admin (4 emails)
- **admin@ankr.in** - Super Admin (main admin account)
- **ceo@ankr.in** - CEO
- **captain@ankr.in** - Co-Founder ⭐
- **coo@ankr.in** - COO (Chief Operating Officer)

### 2. HR Department (2 emails)
- **hr@ankr.in** - CHRO (Chief HR Officer)
- **hrmanager@ankr.in** - HR Manager

### 3. Operations (2 emails)
- **opsmanager@ankr.in** - Operations Manager
- **dispatch@ankr.in** - Dispatcher

### 4. Finance (1 email)
- **accounts@ankr.in** - Accountant

### 5. Customer-Facing (2 emails)
- **support@ankr.in** - Customer Support (used in landing page)
- **sales@ankr.in** - Sales Inquiries (used in email inbox demo)

---

## Total: 11 Email Addresses

---

## Where These Are Used

### Login Page Demo Accounts
All these emails can login with password: `Admin@123`

```
admin@ankr.in       - Super Admin
ceo@ankr.in         - CEO
coo@ankr.in         - COO
hr@ankr.in          - CHRO
hrmanager@ankr.in   - HR Manager
opsmanager@ankr.in  - Operations Manager
dispatch@ankr.in    - Dispatcher
accounts@ankr.in    - Accountant
```

### Landing Page (https://ankrtms.ankr.in)
- **support@ankr.in** - Contact link in footer and header

### Email Inbox Demo
- **sales@ankr.in** - Demo emails from sales
- **support@ankr.in** - Demo support emails

### E-Manual Documentation
- Portal URL example: `yourcompany.ankrtms.ankr.in/portal`

---

## Migadu Setup Steps

1. Login to Migadu dashboard
2. Go to your `ankr.in` domain
3. Create mailboxes for each email above
4. Set passwords (recommend using strong passwords, not demo password)
5. Optional: Set up aliases if needed

### Suggested Migadu Configuration

**For each mailbox:**
- Storage quota: 1 GB per mailbox (adjust as needed)
- Enable IMAP/POP3 access
- Enable webmail if desired
- Set up SPF, DKIM, DMARC for better deliverability

**Aliases (Optional):**
You can create aliases to reduce actual mailboxes:
- Create main mailbox: `admin@ankr.in`
- Add aliases pointing to admin: `ceo@ankr.in`, `coo@ankr.in`, etc.

This way all emails go to one inbox initially, then split later as needed.

---

## Frontend Files Updated

### Source Files (React)
✅ `/root/rocketlang/ankr-labs-nx/apps/wowtruck/frontend/src/pages/Login.tsx`
   - Updated 8 demo account emails
   - Updated auto-fill buttons

✅ `/root/rocketlang/ankr-labs-nx/apps/wowtruck/frontend/src/pages/Landing.tsx`
   - Updated support email links (2 locations)

✅ `/root/rocketlang/ankr-labs-nx/apps/wowtruck/frontend/src/pages/EmailInbox.tsx`
   - Updated sales@ankr.in (4 locations)
   - Updated support@ankr.in (1 location)

✅ `/root/rocketlang/ankr-labs-nx/apps/wowtruck/frontend/src/components/EManual.tsx`
   - Updated portal URL example

### Built Files (Production)
✅ `/root/ankr-labs-nx/apps/wowtruck/frontend/dist/assets/index-Cy5jzY_d.js`
   - Updated all @wowtruck.in → @ankr.in (19 occurrences)
   - Updated portal URL

---

## Verification

### Source Code
```bash
$ grep -r "@wowtruck.in" src/ --include="*.tsx" --include="*.ts"
# Result: 0 occurrences ✅
```

### Built Distribution
```bash
$ grep -o "@ankr.in" dist/assets/index-Cy5jzY_d.js | wc -l
# Result: 19 occurrences ✅

$ grep -o "@wowtruck.in" dist/assets/index-Cy5jzY_d.js | wc -l
# Result: 0 occurrences ✅
```

---

## Live on Website

All email addresses are now live at:
- **https://ankrtms.ankr.in**

Test by:
1. Go to login page: https://ankrtms.ankr.in/login
2. Click "Quick Login" buttons
3. See demo accounts using @ankr.in emails
4. Landing page footer shows support@ankr.in

---

## Email Mapping Summary

| Old Email (wowtruck.in) | New Email (ankr.in) | Role |
|-------------------------|---------------------|------|
| admin@wowtruck.in | admin@ankr.in | Super Admin |
| ceo@wowtruck.in | ceo@ankr.in | CEO |
| coo@wowtruck.in | coo@ankr.in | COO |
| chro@wowtruck.in | hr@ankr.in | CHRO |
| hr.manager@wowtruck.in | hrmanager@ankr.in | HR Manager |
| ops.manager@wowtruck.in | opsmanager@ankr.in | Ops Manager |
| dispatcher@wowtruck.in | dispatch@ankr.in | Dispatcher |
| accounts@wowtruck.in | accounts@ankr.in | Accountant |
| support@wowtruck.in | support@ankr.in | Customer Support |
| sales@wowtruck.in | sales@ankr.in | Sales |

---

## Additional Emails (Optional)

If you want to expand later:
- **cfo@ankr.in** - CFO (Chief Financial Officer)
- **cto@ankr.in** - CTO (Chief Technology Officer)
- **demo@ankr.in** - Generic demo account
- **info@ankr.in** - General inquiries
- **billing@ankr.in** - Billing inquiries
- **noreply@ankr.in** - System emails

---

## Notes

1. **captain@ankr.in** is designated for Co-Founder (as per your specification)
2. **coo@ankr.in** remains COO (not replaced by captain)
3. All demo accounts use password: `Admin@123` (change in production!)
4. Migadu supports unlimited aliases per mailbox
5. You can forward all to one inbox initially, then split as team grows

---

## Next Steps

1. ✅ Frontend updated with new @ankr.in emails
2. ✅ Built files updated and deployed
3. ✅ Nginx reloaded
4. ⏳ **Create email accounts on Migadu** (your action)
5. ⏳ Test login with new email addresses
6. ⏳ Update backend authentication if needed

---

## Backend Consideration

**Note:** Frontend now uses @ankr.in emails, but backend authentication might still expect @wowtruck.in emails in the database.

**Action Required (Later):**
If backend stores user emails in database, you'll need to:
1. Update user table: `email` column from @wowtruck.in → @ankr.in
2. Or add email aliases support in backend
3. Or keep backend using old emails (frontend display vs backend storage)

**Recommendation:**
- Create @ankr.in emails on Migadu first
- Test frontend login
- Then decide if backend needs updating

---

**Status:** ✅ Frontend Complete
**Next:** Create emails on Migadu
**File Location:** `/root/ANKR-EMAIL-ADDRESSES-MIGADU.md`
