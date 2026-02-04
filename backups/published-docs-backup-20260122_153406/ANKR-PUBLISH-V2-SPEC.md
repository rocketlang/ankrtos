# ankr-publish v2 - Enhancement Specification

**Version:** 2.0.0
**Date:** 19 Jan 2026
**Status:** Planned

---

## Current Issues

### 1. Static vs Dynamic Disconnect
- `ankr-publish` generates a static `index.html`
- The web app at `/project/documents/` is a JavaScript SPA
- SPA uses API (`/api/files`) to list files, ignoring `index.html`
- Users can't see the nice static index unless they visit `/index.html` directly

### 2. No Cache Invalidation
- Cloudflare caches the SPA aggressively
- Publishing new files doesn't refresh the viewer cache
- Users see stale file lists

### 3. No Search/Filter in Static Index
- Static `index.html` is just a list
- No search, no filtering, no grouping by project

---

## Proposed Enhancements

### 1. Unified Index System

```
┌─────────────────────────────────────────────────────────────┐
│                    ankr-publish v2                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Static HTML Index (SEO, fallback)                         │
│          ↓                                                  │
│   JSON Manifest (for API/SPA)                               │
│          ↓                                                  │
│   API Cache Invalidation                                    │
│          ↓                                                  │
│   Cloudflare Purge (optional)                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. New Commands

```bash
# Publish with all features
ankr-publish -g "*.md" --rebuild --notify

# Generate JSON manifest for API
ankr-publish manifest

# Purge Cloudflare cache
ankr-publish purge

# Create a project-specific collection
ankr-publish collection "ANKR Universe" --files "ANKR-UNIVERSE-*.md"

# Serve static index (bypass SPA)
ankr-publish serve --static

# Generate shareable links
ankr-publish link ANKR-UNIVERSE-README.md
# Output: https://ankr.in/project/documents/?file=ANKR-UNIVERSE-README.md
```

### 3. Project Collections

Group documents by project for better organization:

```typescript
interface Collection {
  name: string;           // "ANKR Universe"
  slug: string;           // "ankr-universe"
  description?: string;
  files: string[];        // File patterns
  icon?: string;          // Emoji or icon
  featured?: boolean;     // Show on landing
  order?: number;         // Sort order
}
```

**Example manifest.json:**
```json
{
  "version": "2.0.0",
  "generated": "2026-01-19T12:00:00Z",
  "collections": [
    {
      "name": "ANKR Universe",
      "slug": "ankr-universe",
      "description": "AI-powered development ecosystem documentation",
      "files": [
        "ANKR-UNIVERSE-README.md",
        "ANKR-UNIVERSE-VISION.md",
        "ANKR-UNIVERSE-ARCHITECTURE.md",
        "ANKR-UNIVERSE-API-SPEC.md",
        "ANKR-UNIVERSE-SDK.md",
        "ANKR-UNIVERSE-TODO.md",
        "ANKR-UNIVERSE-ROADMAP.md",
        "ANKR-UNIVERSE-BUSINESS-MODEL.md",
        "ANKR-UNIVERSE-SLIDES.md"
      ],
      "icon": "🌌",
      "featured": true,
      "order": 1
    },
    {
      "name": "Kinara",
      "slug": "kinara",
      "files": ["KINARA-*.md"],
      "icon": "🏦"
    },
    {
      "name": "ANKR Forge",
      "slug": "ankr-forge",
      "files": ["ANKR-FORGE-*.md"],
      "icon": "🔨"
    }
  ],
  "files": [
    {
      "name": "ANKR-UNIVERSE-README.md",
      "size": 14886,
      "modified": "2026-01-19T12:49:49.004Z",
      "collection": "ankr-universe",
      "type": "document"
    }
    // ... all files
  ]
}
```

### 4. Enhanced Static Index

New static index with:
- Search box (client-side filtering)
- Project grouping (collapsible sections)
- Quick links (jump to collection)
- Dark/light mode toggle
- Responsive design

```html
<!-- Enhanced index.html structure -->
<div class="search-bar">
  <input type="search" placeholder="Search documents..." />
</div>

<div class="collections">
  <section class="collection" data-slug="ankr-universe">
    <h2>🌌 ANKR Universe</h2>
    <p class="description">AI-powered development ecosystem</p>
    <ul class="file-list">...</ul>
  </section>
</div>
```

### 5. API Integration

New API endpoint for the viewer:

```typescript
// GET /api/manifest
{
  collections: Collection[],
  files: FileInfo[],
  stats: {
    totalFiles: number,
    totalSize: string,
    lastUpdated: string
  }
}
```

### 6. Cache Invalidation

```typescript
// After publishing, notify API server
async notifyServer() {
  await fetch('https://ankr.in/project/documents/api/refresh', {
    method: 'POST',
    headers: { 'X-Publish-Token': process.env.ANKR_PUBLISH_TOKEN }
  });
}

// Optional: Purge Cloudflare cache
async purgeCloudflare() {
  await fetch('https://api.cloudflare.com/client/v4/zones/.../purge_cache', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${CF_TOKEN}` },
    body: JSON.stringify({
      files: ['https://ankr.in/project/documents/']
    })
  });
}
```

---

## Implementation Plan

### Phase 1: Manifest & Collections (Week 1)
- [ ] Add `manifest.json` generation
- [ ] Add collection support to CLI
- [ ] Update static index with collections
- [ ] Add client-side search to static index

### Phase 2: API Integration (Week 2)
- [ ] Add `/api/manifest` endpoint to viewer
- [ ] Add `/api/refresh` endpoint for cache invalidation
- [ ] Update viewer to use manifest for collections
- [ ] Add `--notify` flag to publish command

### Phase 3: Enhanced Features (Week 3)
- [ ] Add `ankr-publish link` for shareable URLs
- [ ] Add `ankr-publish purge` for Cloudflare
- [ ] Add project README rendering in viewer
- [ ] Add download collection as ZIP

### Phase 4: Polish (Week 4)
- [ ] Improve static index design
- [ ] Add PWA support to static index
- [ ] Add RSS feed for new documents
- [ ] Documentation and examples

---

## New CLI Interface

```
ankr-publish v2.0.0

USAGE:
  ankr-publish [files...]           Publish files
  ankr-publish <command> [options]  Run command

COMMANDS:
  list, ls                List published documents
  remove, rm <file>       Remove a document
  rebuild, index          Rebuild index.html
  manifest                Generate manifest.json
  collection <name>       Create/update a collection
  link <file>             Generate shareable link
  purge                   Purge CDN cache
  serve                   Serve static index locally
  url                     Show public URL
  path                    Show local docs path
  open                    Open in browser

OPTIONS:
  -r, --rebuild           Rebuild index after publishing
  -n, --notify            Notify API server to refresh
  -p, --purge             Purge CDN cache after publishing
  -g, --glob              Treat arguments as glob patterns
  -c, --collection <name> Add files to collection
  -q, --quiet             Suppress output
  -v, --verbose           Verbose output
  -h, --help              Show help
  -V, --version           Show version

EXAMPLES:
  # Publish with full refresh
  ankr-publish -g "*.md" -r -n -p

  # Create a project collection
  ankr-publish collection "My Project" -g "MY-PROJECT-*.md"

  # Get shareable link
  ankr-publish link README.md

  # View static index locally
  ankr-publish serve --port 8080
```

---

## Migration Path

1. **v1 → v2 Compatibility**
   - Existing commands work unchanged
   - New features are additive
   - Static index enhanced but backward compatible

2. **Gradual Rollout**
   - Phase 1: Internal testing
   - Phase 2: Beta with `--experimental` flag
   - Phase 3: Stable release

---

## Summary

`ankr-publish` v2 will provide:
- ✅ Project collections for better organization
- ✅ JSON manifest for API/SPA integration
- ✅ Cache invalidation on publish
- ✅ Enhanced static index with search
- ✅ Shareable document links
- ✅ Better developer experience

**Priority:** Medium
**Effort:** 2-4 weeks
**Dependencies:** Viewer API updates

---

*Document created: 19 Jan 2026*
