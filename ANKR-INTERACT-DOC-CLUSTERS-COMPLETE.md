# ANKR Interact - Documentation Clusters Feature

**Date:** January 23, 2026
**Status:** ✅ Complete
**URL:** https://ankrlms.ankr.in/clusters

## Overview

Created a date-based documentation timeline system that organizes all published documents by their publication date, making it easy to browse "what was published when."

## Features Implemented

### Backend API (`doc-clusters.ts`)

#### 1. **GET /api/docs/clusters**
Get documents grouped by date with pagination:
```json
{
  "clusters": [
    {
      "date": "2026-01-23",
      "count": 4,
      "documents": [
        {
          "id": "doc-id",
          "filename": "ANKR-LMS-RAZORPAY-INTEGRATION-COMPLETE.md",
          "title": "ANKR LMS Razorpay Integration",
          "url": "https://ankr.in/project/documents/?file=...",
          "publishedAt": "2026-01-23T15:30:00Z",
          "size": 6144,
          "source": "filesystem"
        }
      ]
    }
  ],
  "pagination": {
    "limit": 30,
    "offset": 0,
    "hasMore": false
  }
}
```

#### 2. **GET /api/docs/clusters/summary**
Overview statistics:
```json
{
  "totalDocuments": 256,
  "dateRange": {
    "earliest": "2026-01-15",
    "latest": "2026-01-23"
  },
  "clusters": [
    { "date": "2026-01-23", "count": 4 },
    { "date": "2026-01-22", "count": 8 },
    { "date": "2026-01-21", "count": 5 }
  ]
}
```

#### 3. **GET /api/docs/clusters/:date**
Get all documents for a specific date:
```bash
GET /api/docs/clusters/2026-01-23
```

#### 4. **GET /api/docs/clusters/range**
Query by date range:
```bash
GET /api/docs/clusters/range?startDate=2026-01-20&endDate=2026-01-23
```

#### 5. **POST /api/docs/clusters/sync** (Admin Only)
Import published documents from filesystem into database:
```json
{
  "success": true,
  "imported": 15,
  "updated": 241,
  "errors": 0,
  "total": 256
}
```

### Frontend UI (`DocumentClusters.tsx`)

#### Visual Features
- 📅 **Calendar Timeline View**: Documents grouped by publication date
- 📊 **Statistics Dashboard**: Total docs, date range, publication days
- 🔽 **Expandable Clusters**: Click any date to see documents published that day
- 🔄 **Sync Button**: Admin users can import latest published documents
- 📄 **Document Cards**: Display filename, size, source, and time
- 🔗 **Direct Links**: Click any document to open in new tab

#### UI Components

**Header Section:**
```
┌────────────────────────────────────────────┐
│ 📅 Documentation Timeline                  │
│    Browse documents by publish date        │
│                               [Sync Docs]  │
└────────────────────────────────────────────┘
```

**Stats Dashboard:**
```
┌─────────────┬─────────────┬─────────────┐
│ Total: 256  │ Range:      │ Days: 15    │
│ Documents   │ Jan 15-23   │ Publishing  │
└─────────────┴─────────────┴─────────────┘
```

**Date Clusters:**
```
┌────────────────────────────────────────────┐
│ 📅 Thursday, January 23, 2026              │
│    4 documents published                   │
└────────────────────────────────────────────┘
  │
  ├─ ANKR LMS Razorpay Integration (6.0K)
  ├─ Performance Improvements Applied (7.0K)
  ├─ System Performance Report (12.6K)
  └─ File Chunker Fix (9.0K)
```

## Database Integration

Uses the `PublishedDocument` table in `ankr_viewer` database:

```sql
TABLE PublishedDocument
  - id: text (primary key)
  - filename: text (unique)
  - title: text
  - path: text
  - url: text
  - publishedAt: timestamp (indexed)
  - lastModified: timestamp
  - size: integer
  - source: text (indexed)
  - viewCount: integer
  - createdAt: timestamp
  - updatedAt: timestamp
```

### Indexes
- `PublishedDocument_publishedAt_idx` - Fast date queries
- `PublishedDocument_filename_idx` - Quick filename lookups
- `PublishedDocument_source_idx` - Filter by source

## Use Cases

### 1. **What was published today?**
Navigate to `/clusters` and see the latest date cluster expanded by default.

### 2. **What changed this week?**
Use the date range query to see all publications in a week:
```
GET /api/docs/clusters/range?startDate=2026-01-17&endDate=2026-01-23
```

### 3. **Browse by timeline**
Scroll through the chronological list of dates to discover when specific documentation was published.

### 4. **Admin document sync**
Click "Sync Documents" to import the latest published documents from the filesystem into the database.

### 5. **Quick document access**
Click any document title to open it directly in a new tab at ankr.in.

## Integration with @ankr/publish

The sync feature integrates with the existing `@ankr/publish` package:

```typescript
const { Publisher } = require('@ankr/publish');
const publisher = new Publisher();
const documents = await publisher.listDocuments();
```

This automatically imports:
- All markdown files from `/var/www/ankr-landing/project/documents/`
- Document metadata (size, modification time)
- Public URLs (https://ankr.in/project/documents/?file=...)

## Access & Authentication

- **URL:** https://ankrlms.ankr.in/clusters
- **Authentication:** Required (all authenticated users can view)
- **Sync Permission:** Admin only
- **Auto-redirect:** Non-authenticated users redirected to login

## Technical Details

### Query Performance
- Efficient date grouping using PostgreSQL `DATE()` function
- JSON aggregation for nested document arrays
- Indexed timestamp columns for fast lookups
- Pagination support for large document sets

### Error Handling
- Invalid date format validation (YYYY-MM-DD)
- Database connection error handling
- Sync error tracking (per-document)
- User-friendly error messages

### Security
- Authentication required for all endpoints
- RBAC for sync endpoint (admin only)
- SQL injection protection (parameterized queries)
- Session-based authorization

## Future Enhancements

### Planned Features
1. **Date Filters**: Add calendar picker for custom date ranges
2. **Search in Clusters**: Search documents within specific dates
3. **Export Timeline**: Download cluster data as JSON/CSV
4. **Document Preview**: Inline markdown preview without opening new tab
5. **Analytics**: Most active publishing days, document trends
6. **Bookmarks**: Save favorite documents from timeline
7. **Tags**: Filter clusters by document tags
8. **Notifications**: Get notified when new docs are published

### Integration Opportunities
1. **RAG System**: Use clusters for temporal context in Q&A
2. **AI Tutor**: "Teach me what was published this week"
3. **Email Digests**: Daily/weekly summary of new publications
4. **RSS Feed**: Subscribe to documentation updates
5. **Slack/Discord Bot**: Post new publications to channels

## Files Modified

### Backend
- `packages/ankr-interact/src/server/doc-clusters.ts` (new, 320 lines)
- `packages/ankr-interact/src/server/index.ts` (added route registration)

### Frontend
- `packages/ankr-interact/src/client/pages/DocumentClusters.tsx` (new, 350 lines)
- `packages/ankr-interact/src/client/App.tsx` (added /clusters route)

## Testing

### Manual Testing
```bash
# 1. Login to get session
curl -X POST http://localhost:3199/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ankr.demo","password":"Demo123!"}'

# 2. Get summary
curl http://localhost:3199/api/docs/clusters/summary

# 3. Get clusters
curl http://localhost:3199/api/docs/clusters?limit=10

# 4. Get specific date
curl http://localhost:3199/api/docs/clusters/2026-01-23

# 5. Sync documents (admin only)
curl -X POST http://localhost:3199/api/docs/clusters/sync
```

### Browser Testing
1. Navigate to https://ankrlms.ankr.in/clusters
2. Login with demo account
3. View timeline of documents
4. Click date to expand/collapse
5. Click document to open
6. Test sync button (admin account)

## Commit

**Commit:** 82b9f237
**Message:** feat(ankr-interact): Add date-based documentation clusters

```
Backend:
- doc-clusters.ts: Date-based clustering API with 5 endpoints
- GET /api/docs/clusters - Paginated date clusters
- GET /api/docs/clusters/summary - Stats overview
- GET /api/docs/clusters/:date - Single date query
- GET /api/docs/clusters/range - Date range query
- POST /api/docs/clusters/sync - Admin sync from filesystem

Frontend:
- DocumentClusters.tsx: Timeline UI with calendar view
- Expandable date clusters
- Real-time document counts
- Admin sync functionality
- Direct document links

Routes:
- /clusters protected route added to App.tsx
- Authentication required, all users can view
```

## Related Features

- **Document Import**: `/import` - Upload new documents
- **Document Q&A**: `/ask` - Ask questions about uploaded docs
- **Admin Dashboard**: `/admin` - Manage users and system
- **Document Viewer**: `/viewer` - Browse and edit documents

## Benefits

✅ **Discoverability**: Easily find when documents were published
✅ **Organization**: Chronological view of documentation evolution
✅ **Accountability**: Track publication activity over time
✅ **Integration**: Seamless sync with @ankr/publish
✅ **Performance**: Indexed queries for fast date lookups
✅ **Scalability**: Pagination support for thousands of documents

---

**Implementation Time:** ~1.5 hours
**Lines of Code:** 670 lines (320 backend + 350 frontend)
**API Endpoints:** 5 new REST endpoints
**UI Components:** 1 complete page with timeline view
**Status:** ✅ Complete and committed
