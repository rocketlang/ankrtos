# Documentation Clusters - Quick Start Guide

## What is it?

A **timeline view** of all published documentation, organized by date. Easily see what was published when and browse documents chronologically.

## How to Access

1. Navigate to: **https://ankrlms.ankr.in/clusters**
2. Login with your credentials
3. View the documentation timeline

## Demo Users

| Email | Password | Access |
|-------|----------|--------|
| admin@ankr.demo | Demo123! | Full access + Sync |
| teacher@ankr.demo | Demo123! | View only |
| student11@ankr.demo | Demo123! | View only |
| student12@ankr.demo | Demo123! | View only |

## Features

### 📊 Statistics Dashboard
See at a glance:
- **Total Documents**: 256 published docs
- **Date Range**: Earliest to latest publication
- **Publication Days**: How many days have publications

### 📅 Timeline View
```
┌─ Thursday, January 23, 2026 ──────────┐
│  4 documents published                │
│                                       │
│  ✓ ANKR LMS Razorpay Integration     │
│  ✓ Performance Improvements Applied  │
│  ✓ System Performance Report         │
│  ✓ File Chunker Fix                  │
└───────────────────────────────────────┘

┌─ Wednesday, January 22, 2026 ─────────┐
│  8 documents published                │
│  [Click to expand...]                 │
└───────────────────────────────────────┘
```

### 🔄 Sync Documents (Admin Only)
Admin users can click **"Sync Documents"** to import the latest published documents from the filesystem.

Results show:
- **Imported**: New documents added
- **Updated**: Existing documents refreshed
- **Errors**: Any failed imports
- **Total**: Total documents processed

## API Endpoints

### Get Summary
```bash
GET /api/docs/clusters/summary
```

Response:
```json
{
  "totalDocuments": 256,
  "dateRange": {
    "earliest": "2026-01-15",
    "latest": "2026-01-23"
  },
  "clusters": [
    { "date": "2026-01-23", "count": 4 }
  ]
}
```

### Get Clusters
```bash
GET /api/docs/clusters?limit=30&offset=0
```

### Get Specific Date
```bash
GET /api/docs/clusters/2026-01-23
```

### Get Date Range
```bash
GET /api/docs/clusters/range?startDate=2026-01-20&endDate=2026-01-23
```

### Sync from Filesystem (Admin)
```bash
POST /api/docs/clusters/sync
```

## Use Cases

### 1. Browse Recent Publications
See what documentation was added today, this week, or this month.

### 2. Track Project Activity
Understand when documentation activity was highest.

### 3. Find Historical Docs
Locate documents published on specific dates.

### 4. Import Published Docs
Admin users can sync the latest publications into the system.

## Technical Stack

- **Backend**: Fastify REST API
- **Database**: PostgreSQL with timestamp indexes
- **Frontend**: React + TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Security

✅ Authentication required for all endpoints
✅ RBAC for sync (admin only)
✅ SQL injection protection
✅ Session-based authorization

## Integration

The feature integrates with:
- **@ankr/publish** - Document publishing system
- **PublishedDocument table** - Database storage
- **ankr.in** - Public documentation URLs

## What's Next

After testing the timeline view, we can enhance it with:
- Calendar picker for date filtering
- Search within date clusters
- Document preview
- Export functionality
- Email notifications
- RSS feed

## Links

- **Live URL**: https://ankrlms.ankr.in/clusters
- **Documentation**: https://ankr.in/project/documents/?file=ANKR-INTERACT-DOC-CLUSTERS-COMPLETE.md
- **Commit**: 82b9f237

---

**Quick Test:**
1. Visit https://ankrlms.ankr.in/clusters
2. Login with admin@ankr.demo / Demo123!
3. Click "Sync Documents"
4. Expand any date to see documents
5. Click a document to open it

✨ Built with ANKR Interact - The complete educational platform
