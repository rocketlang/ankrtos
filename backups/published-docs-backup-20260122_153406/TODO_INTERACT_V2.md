# ANKR Interact V2 - Knowledge OS Roadmap

> **Version:** 2.0
> **Updated:** 2026-01-20
> **Vision:** Transform ANKR Interact into a powerful **Knowledge OS** - combining Obsidian (graph/linking), Notion (blocks/databases), AFFiNE (canvas), NotebookLLM (AI), with **native ankr-publish integration**.

---

## Table of Contents

1. [Current State](#current-state-v10)
2. [Phase 1: Foundation](#phase-1-foundation-week-1-2)
3. [Phase 2: Obsidian Features](#phase-2-obsidian-features-week-3-4)
4. [Phase 3: Notion Features](#phase-3-notion-features-week-5-6)
5. [Phase 4: NotebookLLM Features](#phase-4-notebooklm-features-week-7-8)
6. [Phase 5: ANKR Integration](#phase-5-ankr-integration-week-9-10)
7. [Phase 6: Enterprise Features](#phase-6-enterprise-features-week-11-12)
8. [Phase 7: AFFiNE Features](#phase-7-affine-inspired-features-week-13-14)
9. [Phase 8: ankr-publish Deep Integration](#phase-8-ankr-publish-deep-integration-week-15-16) ⭐ NEW
10. [Technical Architecture](#technical-architecture)
11. [Competition Analysis](#competition-analysis)

---

## Current State (v1.0)

### Completed Features
| Feature | Status | Notes |
|---------|--------|-------|
| Markdown rendering | ✅ | Full GFM support |
| File browser | ✅ | Multi-source navigation |
| Search (basic) | ✅ | Filename + content |
| Bookmarks | ✅ | Persistent JSON storage |
| Recent files | ✅ | Last 20 files tracked |
| Dark/light theme | ✅ | System preference aware |
| Mobile responsive | ✅ | PWA-ready |
| PDF viewing | ✅ | Via /api/file/raw |
| File upload | ✅ | Multi-file support |
| File editing | ✅ | Save back to source |
| Knowledge graph | ✅ | D3.js force-directed |
| Topic extraction | ✅ | 18 auto-detected topics |
| Multi-source | ✅ | 8+ document sources |

### Infrastructure
| Component | Status | Details |
|-----------|--------|---------|
| Database | ✅ | 14 tables in ankr_viewer |
| Port | 3199 | Configured in ankr-ctl |
| URL | https://ankr.in/viewer | Production ready |
| API | ✅ | 25+ REST endpoints |

---

## Phase 1: Foundation (Week 1-2)
> **Goal:** Stable base with proper data persistence

### 1.1 Database Integration
- [ ] Connect Prisma client to ankr_viewer database
- [ ] Migrate bookmarks.json → Bookmark table
- [ ] Migrate recent.json → RecentFile table
- [ ] Migrate sources.json → Workspace/Folder tables
- [ ] Add document sync (file → Document table)
- [ ] Implement document versioning

### 1.2 Authentication
- [ ] Integrate @ankr/oauth for Google/GitHub login
- [ ] Add user sessions with JWT
- [ ] Role-based access (viewer, editor, admin)
- [ ] Share links with permissions
- [ ] API key generation for programmatic access

### 1.3 Real-time Sync
- [ ] WebSocket connection for live updates
- [ ] Collaborative cursors (who's viewing what)
- [ ] Auto-save with conflict resolution
- [ ] Presence indicators

---

## Phase 2: Obsidian Features (Week 3-4)
> **Goal:** Bidirectional linking and graph visualization

### 2.1 Wiki-style Linking
- [ ] `[[Page Name]]` syntax support
- [ ] Auto-complete for page names
- [ ] Create page on link click if doesn't exist
- [ ] Backlinks panel (who links to this page)
- [ ] Unlinked mentions detection

### 2.2 Graph View (Enhanced)
- [ ] Force-directed graph of all documents
- [ ] Filter by folder, tag, date, author
- [ ] Cluster by topic (AI-detected)
- [ ] Click node to open document
- [ ] Zoom/pan/search in graph
- [ ] Local graph (connections for current doc)
- [ ] Graph depth controls (1-hop, 2-hop, etc.)

### 2.3 Tags & Properties
- [ ] Frontmatter YAML parsing
- [ ] Tag autocomplete (#compliance, #logistics)
- [ ] Custom properties (status, priority, assignee)
- [ ] Filter/sort by properties
- [ ] Property templates per folder

### 2.4 Daily Notes
- [ ] Auto-create daily note
- [ ] Template support
- [ ] Quick capture from anywhere
- [ ] Link to today's meetings/tasks
- [ ] Weekly/monthly rollup views

---

## Phase 3: Notion Features (Week 5-6)
> **Goal:** Block-based editing and databases

### 3.1 Block Editor
- [ ] Paragraph, headings (H1-H6)
- [ ] Bulleted/numbered lists
- [ ] Toggle lists (collapsible)
- [ ] Code blocks with syntax highlighting
- [ ] Callouts (info, warning, error, success)
- [ ] Dividers
- [ ] Quote blocks
- [ ] Tables (inline, editable)

### 3.2 Advanced Blocks
- [ ] Embeds (YouTube, Figma, Miro, Google Docs)
- [ ] File attachments with preview
- [ ] Image galleries
- [ ] Kanban boards
- [ ] Calendars
- [ ] Timelines
- [ ] Math equations (KaTeX)
- [ ] Mermaid diagrams

### 3.3 Databases (Notion-style)
- [ ] Table view
- [ ] Board view (Kanban)
- [ ] List view
- [ ] Calendar view
- [ ] Gallery view
- [ ] Linked databases
- [ ] Formulas
- [ ] Relations between databases
- [ ] Rollups

### 3.4 Templates
- [ ] Meeting notes template
- [ ] Project brief template
- [ ] Bug report template
- [ ] Decision log template
- [ ] Custom template builder
- [ ] Template variables (date, author, etc.)

---

## Phase 4: NotebookLLM Features (Week 7-8)
> **Goal:** AI-powered knowledge synthesis

### 4.1 Document Understanding
- [ ] Auto-summarize on upload
- [ ] Extract key entities (companies, people, dates)
- [ ] Detect document type (invoice, contract, SOP)
- [ ] Generate tags automatically
- [ ] Extract action items and todos

### 4.2 AI Chat Interface
- [ ] "Ask this document" - Q&A on single doc
- [ ] "Ask workspace" - Q&A across all docs
- [ ] Citation with page links
- [ ] Follow-up questions
- [ ] Chat history persistence
- [ ] Share chat sessions

### 4.3 Knowledge Synthesis
- [ ] "Compare these documents"
- [ ] "Summarize this folder"
- [ ] "Find contradictions"
- [ ] "Generate FAQ from docs"
- [ ] "Create study guide"
- [ ] "Extract timeline of events"

### 4.4 Audio Features (like NotebookLLM)
- [ ] Generate podcast from documents
- [ ] Text-to-speech for documents
- [ ] Voice notes with transcription
- [ ] Meeting recording → notes
- [ ] Audio summaries

### 4.5 Smart Search
- [ ] Semantic search (meaning, not just keywords)
- [ ] "Find documents about X"
- [ ] "Show me everything from last week"
- [ ] Natural language filters
- [ ] Search across all sources simultaneously

---

## Phase 5: ANKR Integration (Week 9-10)
> **Goal:** Deep integration with ANKR ecosystem

### 5.1 App Connectors
- [ ] WowTruck: Import shipment docs, LRs, PODs
- [ ] FreightBox: Import BOLs, quotes, contracts
- [ ] CompyMitra: Import compliance docs, filings
- [ ] BFC: Import financial reports, invoices
- [ ] EON: Sync memories and learnings
- [ ] Fr8X: Import load documents

### 5.2 Auto-Documentation
- [ ] Generate API docs from code
- [ ] Generate user guides from features
- [ ] Changelog from git commits
- [ ] Architecture diagrams from code
- [ ] Schema documentation from Prisma

### 5.3 Workflow Integration
- [ ] Create task in CRM from document
- [ ] Generate invoice from quote doc
- [ ] File compliance from document
- [ ] Trigger automation from doc changes
- [ ] Webhook support for external integrations

### 5.4 Knowledge Graph (Cross-App)
- [ ] Connect documents to ANKR entities
- [ ] "Show all docs for customer X"
- [ ] "Show all docs for shipment Y"
- [ ] Cross-app knowledge discovery
- [ ] Entity resolution across apps

---

## Phase 6: Enterprise Features (Week 11-12)
> **Goal:** Ready for enterprise deployment

### 6.1 Security & Compliance
- [ ] End-to-end encryption option
- [ ] Audit logs (who viewed/edited what)
- [ ] Data retention policies
- [ ] GDPR compliance tools
- [ ] SOC2 readiness
- [ ] Data export for compliance

### 6.2 Admin Dashboard
- [ ] User management
- [ ] Workspace analytics
- [ ] Storage usage
- [ ] API usage metrics
- [ ] Billing integration
- [ ] Usage quotas

### 6.3 Advanced Collaboration
- [ ] Comments on any block
- [ ] @mentions with notifications
- [ ] Approval workflows
- [ ] Version comparison (diff view)
- [ ] Restore previous versions
- [ ] Suggested edits (like Google Docs)

### 6.4 Import/Export
- [ ] Import from Notion
- [ ] Import from Confluence
- [ ] Import from Google Docs
- [ ] Import from Obsidian vault
- [ ] Export to PDF/Word/HTML
- [ ] Backup/restore workspaces

---

## Phase 7: AFFiNE-Inspired Features (Week 13-14)
> **Goal:** Adopt best features from AFFiNE
> **Reference:** [AFFiNE GitHub](https://github.com/toeverything/AFFiNE)

### 7.1 Edgeless Canvas Mode
- [ ] **Dual Mode Toggle** - Switch Page ↔ Edgeless with one click
- [ ] **Infinite Canvas** - Boundless spatial workspace (pan/zoom)
- [ ] **Freeform Placement** - Drop any block anywhere on canvas
- [ ] **Shapes & Connectors** - Draw rectangles, circles, arrows, lines
- [ ] **Sticky Notes** - Quick idea capture on canvas
- [ ] **Frames/Groups** - Organize canvas sections
- [ ] **Presentation Mode** - Navigate frames as slides
- [ ] **Mind Maps** - Auto-layout for hierarchical content
- [ ] **Hand Drawing** - Freehand sketch/annotation

### 7.2 Block Transformation System
- [ ] **One-Click Transform** - Paragraph → Heading → Todo → Code
- [ ] **Block to Page** - Convert any block group into a linked page
- [ ] **Page to Block** - Embed page inline as a block
- [ ] **Table Row to Page** - Database row becomes full document
- [ ] **Block to Database** - Convert group into structured data
- [ ] **Drag to Canvas** - Move blocks from doc to edgeless freely

### 7.3 Local-First Architecture (CRDT-based)
- [ ] **Offline-First** - Full functionality without internet
- [ ] **CRDT Sync** - Conflict-free merging when back online
- [ ] **Local Storage** - IndexedDB/SQLite for browser persistence
- [ ] **Selective Sync** - Choose what to sync to cloud
- [ ] **Data Ownership** - Export all data anytime (JSON/Markdown)
- [ ] **P2P Sync Option** - Direct device-to-device sync

### 7.4 Multi-View Databases (Enhanced)
- [ ] **Inline Database** - Create database anywhere in document
- [ ] **View Switcher** - Toggle Table/Board/Calendar/Gallery instantly
- [ ] **Linked Views** - Same data, different views in different docs
- [ ] **Database as Page** - Each database is also a navigable page
- [ ] **Sub-Items** - Nested rows within database entries
- [ ] **Rollups & Lookups** - Cross-database computed fields

### 7.5 Advanced Whiteboard Features
- [ ] **Voting/Reactions** - Add emoji reactions to canvas items
- [ ] **Timer Widget** - Countdown for brainstorming sessions
- [ ] **Cursor Chat** - Quick messages at cursor position
- [ ] **Templates Gallery** - Pre-made canvas templates
- [ ] **Image Backgrounds** - Set canvas background image
- [ ] **Grid/Snap** - Alignment helpers for neat layouts
- [ ] **Export Canvas** - PNG/SVG/PDF export of canvas

### 7.6 BlockSuite-Inspired Editor
- [ ] **Slash Commands** - Type `/` for quick block insertion
- [ ] **Inline Formatting** - Bold, italic, code, highlight inline
- [ ] **Mentions** - `@page`, `@person`, `@date`
- [ ] **Block Handles** - Drag handle for every block
- [ ] **Multi-Select** - Select and manipulate multiple blocks
- [ ] **Copy as Markdown/HTML** - Format-aware clipboard

---

## Phase 8: ankr-publish Deep Integration (Week 15-16) ⭐ NEW
> **Goal:** Make ankr-publish a first-class citizen in ANKR Interact
> **Package:** `@ankr/publish` v2.0.0

### 8.1 Publishing API Endpoints (Backend)
> Add these endpoints to ankr-viewer server

```typescript
// POST /api/publish - Publish document to ankr.in/project/documents
// POST /api/publish/batch - Batch publish multiple documents
// DELETE /api/publish/:filename - Unpublish a document
// GET /api/publish/status - Get publishing status and health
// POST /api/publish/rebuild - Rebuild published index
// GET /api/publish/list - List all published documents
// POST /api/publish/diagnose - Run diagnostics
// POST /api/publish/fix - Auto-fix issues
```

**Implementation Tasks:**
- [ ] Import `@ankr/publish` Publisher class into ankr-viewer server
- [ ] Add `/api/publish` POST endpoint for single file publish
- [ ] Add `/api/publish/batch` POST endpoint for multiple files
- [ ] Add `/api/publish/:filename` DELETE endpoint for unpublish
- [ ] Add `/api/publish/status` GET endpoint (viewer status + doc count)
- [ ] Add `/api/publish/rebuild` POST endpoint to rebuild index.html
- [ ] Add `/api/publish/list` GET endpoint to list published docs
- [ ] Add `/api/publish/diagnose` POST endpoint for health checks
- [ ] Add `/api/publish/fix` POST endpoint for auto-repair
- [ ] Add `/api/publish/link/:filename` GET endpoint for shareable link
- [ ] Add WebSocket events for publish progress/status

### 8.2 Frontend Publish UI Components
> React components for in-app publishing

**Toolbar Integration:**
- [ ] Add "Publish" button (cloud upload icon) to document toolbar
- [ ] Add "Published" indicator badge when doc is live
- [ ] Add "Unpublish" option in document menu
- [ ] Add publish keyboard shortcut (Ctrl+Shift+P)

**Publish Modal/Dialog:**
- [ ] Create `<PublishDialog>` component
- [ ] Show document preview before publishing
- [ ] Visibility selector (Public/Team/Private)
- [ ] Custom slug/URL option
- [ ] Publish confirmation with generated link
- [ ] Copy link to clipboard button
- [ ] Open in new tab button

**Publish Status Panel:**
- [ ] Create `<PublishStatusPanel>` sidebar component
- [ ] Show list of published documents
- [ ] Show publish date and view count (if available)
- [ ] Quick unpublish action
- [ ] Link copy for each document
- [ ] Filter: Published / Unpublished / All

**Batch Publishing:**
- [ ] Create `<BatchPublishDialog>` for folder publishing
- [ ] Folder/file selection tree
- [ ] Select all / Deselect all
- [ ] Publish selected button
- [ ] Progress indicator for batch operations

### 8.3 Publishing Workflow Integration
> Seamless publish experience

**Auto-Publish Features:**
- [ ] Option to auto-publish on save
- [ ] Scheduled publishing (publish at specific time)
- [ ] Auto-publish on git commit (hook integration)
- [ ] Publish queue for offline/batch operations

**Version Control:**
- [ ] Track publish history per document
- [ ] Show diff between published and current version
- [ ] Rollback to previous published version
- [ ] Publish changelog generation

**Notifications:**
- [ ] Toast notification on successful publish
- [ ] Error notification with fix suggestions
- [ ] Webhook/email notification options
- [ ] Slack/Teams integration for publish events

### 8.4 Publishing Analytics Dashboard
> Track published content performance

- [ ] Create `<PublishAnalytics>` dashboard page
- [ ] Total published documents count
- [ ] Total views across all docs
- [ ] Most viewed documents list
- [ ] Publish activity timeline
- [ ] Storage usage meter
- [ ] Health status indicators

### 8.5 CLI ↔ UI Sync
> Keep CLI and UI in sync

- [ ] Detect documents published via CLI
- [ ] Refresh UI when CLI publishes new doc
- [ ] Show CLI-published docs in publish panel
- [ ] Support `ankr-publish notify` to trigger UI refresh
- [ ] Bidirectional source of truth (DB + filesystem)

### 8.6 Public Document Portal
> Enhanced public viewing experience

**Public Page Features:**
- [ ] Custom domain support (docs.yourcompany.com)
- [ ] Custom branding (logo, colors)
- [ ] Document table of contents
- [ ] Full-text search within published docs
- [ ] Print-friendly view
- [ ] PDF download option
- [ ] Share to social media buttons

**SEO & Discovery:**
- [ ] Auto-generate meta tags (title, description, og:image)
- [ ] Sitemap.xml generation
- [ ] robots.txt configuration
- [ ] Structured data (JSON-LD) for documents
- [ ] RSS/Atom feed for updates

### 8.7 Implementation Code Examples

**Backend: Add to ankr-viewer/src/server/index.ts**
```typescript
import { Publisher } from '@ankr/publish';

const publisher = new Publisher();

// Publish single document
fastify.post('/api/publish', async (request, reply) => {
  const { path: filePath } = request.body;
  const fullPath = sanitizePath(filePath);

  const result = publisher.publish(fullPath);

  if (result.success) {
    return {
      success: true,
      file: result.file,
      link: publisher.getLink(result.file),
      url: publisher.getUrl() + result.file
    };
  }

  return reply.status(400).send({ error: result.error });
});

// List published documents
fastify.get('/api/publish/list', async () => {
  return {
    documents: publisher.list(),
    url: publisher.getUrl(),
    viewerOnline: publisher.isViewerRunning()
  };
});

// Health check
fastify.get('/api/publish/status', async () => {
  const health = publisher.diagnose();
  const docs = publisher.list();

  return {
    healthy: health.healthy,
    checks: health.checks,
    documentCount: docs.length,
    url: publisher.getUrl()
  };
});
```

**Frontend: PublishButton.tsx**
```tsx
import { useState } from 'react';
import { CloudUpload, Check, ExternalLink, Copy } from 'lucide-react';

export function PublishButton({ filePath, isPublished }) {
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState(null);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath })
      });
      const data = await res.json();
      if (data.success) {
        setPublishedUrl(data.link);
        // Show success toast
      }
    } finally {
      setPublishing(false);
    }
  };

  return (
    <button onClick={handlePublish} disabled={publishing}>
      {isPublished ? <Check /> : <CloudUpload />}
      {publishing ? 'Publishing...' : isPublished ? 'Published' : 'Publish'}
    </button>
  );
}
```

---

## Phase 9: Full Indic Language Support + Swayam Voice Bot (Week 17-20) ⭐ DIFFERENTIATOR
> **Goal:** Make ANKR Interact the ONLY knowledge platform with full 22+ Indian language support and voice-first interaction
> **Packages:** `@ankr/ai-translate`, `@ankr/i18n`, `@ankr/voice-ai`, Swayam API

### 9.1 Supported Languages (22 Scheduled Languages of India)

| Code | Language | Script | Native | Speakers | Status |
|------|----------|--------|--------|----------|--------|
| `hi` | Hindi | Devanagari | हिंदी | 528M | ✅ @ankr/i18n |
| `ta` | Tamil | Tamil | தமிழ் | 77M | ✅ @ankr/i18n |
| `te` | Telugu | Telugu | తెలుగు | 82M | ✅ @ankr/i18n |
| `kn` | Kannada | Kannada | ಕನ್ನಡ | 45M | ✅ @ankr/i18n |
| `mr` | Marathi | Devanagari | मराठी | 83M | ✅ @ankr/i18n |
| `ml` | Malayalam | Malayalam | മലയാളം | 35M | 🎯 Add |
| `bn` | Bengali | Bengali | বাংলা | 98M | 🎯 Add |
| `gu` | Gujarati | Gujarati | ગુજરાતી | 55M | 🎯 Add |
| `pa` | Punjabi | Gurmukhi | ਪੰਜਾਬੀ | 33M | 🎯 Add |
| `or` | Odia | Odia | ଓଡ଼ିଆ | 37M | 🎯 Add |
| `as` | Assamese | Assamese | অসমীয়া | 15M | 🎯 Add |
| `ur` | Urdu | Perso-Arabic | اردو | 51M | 🎯 Add |
| `kok` | Konkani | Devanagari | कोंकणी | 2.5M | 🎯 Add |
| `mni` | Manipuri | Meitei | মৈতৈলোন | 1.8M | 🎯 Add |
| `ne` | Nepali | Devanagari | नेपाली | 2.9M | 🎯 Add |
| `sa` | Sanskrit | Devanagari | संस्कृतम् | 24K | 🎯 Add |
| `sd` | Sindhi | Arabic/Devanagari | سنڌي | 2.8M | 🎯 Add |
| `brx` | Bodo | Devanagari | बड़ो | 1.5M | 🎯 Add |
| `doi` | Dogri | Devanagari | डोगरी | 2.6M | 🎯 Add |
| `mai` | Maithili | Devanagari | मैथिली | 34M | 🎯 Add |
| `sat` | Santali | Ol Chiki | ᱥᱟᱱᱛᱟᱲᱤ | 7M | 🎯 Add |
| `ks` | Kashmiri | Perso-Arabic | कॉशुर | 7M | 🎯 Add |

### 9.2 UI Internationalization (@ankr/i18n Expansion)

**Current State:** 6 languages (en, hi, ta, te, kn, mr)
**Target:** All 22 languages + regional variants

**Implementation Tasks:**
- [ ] Add missing 16 language locale files to @ankr/i18n
- [ ] Create locale files: `ml.ts`, `bn.ts`, `gu.ts`, `pa.ts`, `or.ts`, etc.
- [ ] Add language selector component to ANKR Interact header
- [ ] Save language preference to user profile/localStorage
- [ ] Support regional variants (hi-IN, ta-IN, etc.)
- [ ] RTL support for Urdu/Sindhi/Kashmiri
- [ ] Font support for all scripts (Google Noto fonts)

**UI Strings to Translate:**
```typescript
// Example from @ankr/i18n
{
  "common.search": "Search / खोजें / தேடு / శోధన",
  "common.bookmarks": "Bookmarks / बुकमार्क / புக்மார்க்குகள்",
  "common.recent": "Recent / हाल ही में / சமீபத்திய",
  "publish.button": "Publish / प्रकाशित करें / வெளியிடு",
  "graph.title": "Knowledge Graph / ज्ञान ग्राफ / அறிவு வரைபடம்"
}
```

### 9.3 Document Translation (@ankr/ai-translate)

**Real-time document translation powered by:**
1. **Sarvam AI** (Premium, India-optimized)
2. **IndicTrans2** (Free, Open-source, 22 languages)
3. **Google Translate** (Fallback)
4. **AI Router LLM** (Complex/domain-specific)

**Features:**
- [ ] "Translate Document" button in toolbar
- [ ] Language selector dropdown (source → target)
- [ ] Side-by-side translation view
- [ ] Translation cache (10,000 phrases)
- [ ] Domain-specific translation (logistics, legal, compliance)
- [ ] Preserve markdown formatting during translation
- [ ] Batch translate entire folders
- [ ] Translation memory (save human corrections)

**API Endpoints:**
```typescript
// POST /api/translate
{
  "text": "Shipment delivered successfully",
  "from": "en",
  "to": "hi",
  "domain": "logistics"
}
// Response: { "translated": "शिपमेंट सफलतापूर्वक डिलीवर हो गया" }

// POST /api/translate/document
{
  "path": "docs/manual.md",
  "to": "hi"
}
// Response: Creates docs/manual.hi.md
```

### 9.4 Voice AI Integration (@ankr/voice-ai)

**Speech-to-Text (STT) - 100+ Languages:**
- [ ] Add voice input button to search bar
- [ ] Voice input for document creation (dictation)
- [ ] Voice commands: "Search for...", "Open...", "Bookmark this"
- [ ] Wake word detection: "Hey ANKR", "अंकर"
- [ ] Language auto-detection from speech
- [ ] Interim results (show text as user speaks)

**Text-to-Speech (TTS) - 500+ Voices:**
- [ ] "Read Aloud" button for any document
- [ ] Voice selection per language (male/female)
- [ ] Speed/pitch controls
- [ ] Generate audio version of documents
- [ ] Audio player with progress tracking
- [ ] Accessibility: read selected text

**Voice Commands (Hindi Example):**
```typescript
const voiceCommands = {
  // Navigation
  "खोजो": (query) => search(query),
  "खोलो": (doc) => openDocument(doc),
  "वापस जाओ": () => goBack(),
  "होम": () => goHome(),

  // Actions
  "बुकमार्क करो": () => bookmark(),
  "प्रकाशित करो": () => publish(),
  "अनुवाद करो": () => translateDialog(),
  "पढ़ो": () => readAloud(),

  // Graph
  "ग्राफ दिखाओ": () => showGraph(),
  "लिंक्स दिखाओ": () => showBacklinks()
};
```

### 9.5 Swayam Voice Bot Integration ⭐ KILLER FEATURE

**What is Swayam?**
- India's first voice-first universal AI assistant
- Supports 11 Indian languages with voice input/output
- Powered by BANI server + Sarvam TTS
- WebSocket-based real-time communication
- 350+ MCP tools available

**Integration Architecture:**
```
┌─────────────────────────────────────────────────────────────┐
│                    ANKR Interact + Swayam                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User: "Hey Swayam, इस document को summarize करो"          │
│           ↓                                                  │
│  ┌─────────────────┐     ┌─────────────────┐               │
│  │  @ankr/voice-ai │────►│  Swayam WebSocket │              │
│  │  STT + TTS      │◄────│  wss://swayam...  │              │
│  └─────────────────┘     └─────────────────┘               │
│           ↓                       ↓                         │
│  ┌─────────────────────────────────────────┐               │
│  │           AI Router + MCP Tools         │               │
│  │  • summarize_document                   │               │
│  │  • translate_text                       │               │
│  │  • search_knowledge_base                │               │
│  │  • create_document                      │               │
│  └─────────────────────────────────────────┘               │
│           ↓                                                  │
│  Response: "यह document FreightBox के बारे में है..."       │
│  (Spoken in Hindi using Sarvam TTS)                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Swayam Commands for ANKR Interact:**
- [ ] "इस document को summarize करो" → AI summary
- [ ] "इसे Hindi में translate करो" → Live translation
- [ ] "Knowledge graph दिखाओ" → Open graph view
- [ ] "यह document किससे connected है?" → Show backlinks
- [ ] "नया document बनाओ about..." → Create with voice
- [ ] "इस folder को publish करो" → Batch publish
- [ ] "सारे compliance docs खोजो" → Semantic search
- [ ] "मुझे FreightBox के docs पढ़कर सुनाओ" → TTS

**Implementation Tasks:**
- [ ] Add Swayam floating button (voice assistant)
- [ ] WebSocket connection to `wss://swayam.digimitra.guru/swayam`
- [ ] Voice activity indicator (listening/processing/speaking)
- [ ] Swayam persona: `interact` for knowledge base
- [ ] Map voice intents to ANKR Interact actions
- [ ] Context injection: current document, selected text
- [ ] Voice feedback for all actions
- [ ] Swayam avatar/animation during interaction

**Swayam React Component:**
```tsx
import { SwayamButton } from '@ankr/voice-ai';

function InteractApp() {
  return (
    <div>
      <MainContent />
      <SwayamButton
        persona="interact"
        language="hi"
        onCommand={(intent, entities) => {
          switch (intent) {
            case 'search': search(entities.query);
            case 'summarize': summarize(currentDoc);
            case 'translate': translate(currentDoc, entities.to);
            case 'publish': publish(currentDoc);
          }
        }}
        position="bottom-right"
        showTranscript={true}
      />
    </div>
  );
}
```

### 9.6 Accessibility Features

**For Visually Impaired:**
- [ ] Screen reader compatibility (ARIA labels in all 22 languages)
- [ ] High contrast mode
- [ ] Font size controls
- [ ] Full keyboard navigation
- [ ] Voice-only mode (no mouse required)

**For Motor Impaired:**
- [ ] Voice-controlled navigation
- [ ] Large click targets
- [ ] Sticky keys support

**For Hearing Impaired:**
- [ ] Visual indicators for all audio
- [ ] Transcript for voice interactions
- [ ] Captions for audio content

### 9.7 Implementation Roadmap

**Week 17: UI Internationalization**
- [ ] Add all 22 language locale files
- [ ] Language selector in header
- [ ] RTL support for Urdu/Sindhi
- [ ] Font loading for all scripts

**Week 18: Translation Integration**
- [ ] @ankr/ai-translate API endpoints
- [ ] Translation UI (button, modal, side-by-side)
- [ ] Translation cache
- [ ] Batch translation

**Week 19: Voice AI**
- [ ] @ankr/voice-ai integration
- [ ] Voice search
- [ ] Voice commands
- [ ] Read aloud feature

**Week 20: Swayam Bot**
- [ ] Swayam WebSocket integration
- [ ] Voice assistant floating button
- [ ] Intent mapping
- [ ] Full voice-first workflow

### 9.8 Unique Differentiators

| Feature | Notion | Obsidian | AFFiNE | Confluence | **ANKR Interact** |
|---------|--------|----------|--------|------------|-------------------|
| Indian Languages | 0 | 0 | 0 | 0 | **22** |
| Voice Input | ❌ | ❌ | ❌ | ❌ | **✅ 100+ langs** |
| Voice Output | ❌ | ❌ | ❌ | ❌ | **✅ 500+ voices** |
| AI Translation | ❌ | ❌ | ❌ | ❌ | **✅ Real-time** |
| Voice Assistant | ❌ | ❌ | ❌ | ❌ | **✅ Swayam** |
| Offline Voice | ❌ | ❌ | ❌ | ❌ | **✅ WebSpeech** |
| RTL Support | ⚠️ | ⚠️ | ⚠️ | ⚠️ | **✅ Native** |
| Accessibility | ⚠️ | ⚠️ | ⚠️ | ⚠️ | **✅ Full WCAG** |

**Market Impact:**
- 1.4 billion+ potential users (Indian languages)
- First knowledge platform with Indic voice-first
- Accessibility-compliant for government contracts
- Differentiated from all Western competitors

---

## Technical Architecture

### Frontend Stack
```
React 19 + Vite
├── TipTap Editor (block-based, like Notion)
├── D3.js / Cytoscape (graph visualization)
├── Excalidraw (whiteboard/canvas) ← NEW for AFFiNE features
├── Monaco Editor (code blocks)
├── Zustand (state management)
├── TanStack Query (data fetching)
├── Tailwind + Shadcn/ui (styling)
└── Yjs (CRDT for real-time collaboration) ← NEW
```

### Backend Stack
```
Fastify + GraphQL (Mercurius)
├── Prisma (database ORM)
├── Socket.io (real-time)
├── Bull (job queues)
├── @ankr/ai-router (AI calls)
├── @ankr/embeddings (vector search)
├── @ankr/publish (publishing) ← INTEGRATED
└── @ankr/oauth (authentication)
```

### Database Schema (ankr_viewer)
```prisma
// Core Content
Document        - Pages with hierarchy
Block           - Notion-style blocks
DocumentLink    - Graph connections
DocumentVersion - Version history

// Organization
Workspace       - Multi-workspace support
Folder          - Folder structure
Tag             - Tagging system
DocumentTag     - Many-to-many

// Collaboration
Comment         - Block-level comments

// AI/Search
SearchIndex     - Vector embeddings (pgvector)

// User
UserPreference  - Settings
Bookmark        - Saved pages
RecentFile      - History
Template        - Reusable templates

// Publishing (NEW)
PublishedDocument - Published docs tracking
PublishHistory    - Version history for published docs
PublishAnalytics  - View counts, etc.
```

---

## Competition Analysis

| Feature | Obsidian | Notion | NotebookLLM | AFFiNE | Confluence | **ANKR Interact** |
|---------|----------|--------|-------------|--------|------------|-------------------|
| Graph View | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Blocks | ❌ | ✅ | ❌ | ✅ | ⚠️ | 🎯 Phase 3 |
| AI Chat | ❌ | ✅ | ✅ | ⚠️ | ❌ | 🎯 Phase 4 |
| Canvas | ⚠️ Plugin | ❌ | ❌ | ✅ | ❌ | 🎯 Phase 7 |
| Local-First | ✅ | ❌ | ❌ | ✅ | ❌ | 🎯 Phase 7 |
| Publishing | ⚠️ Manual | ✅ | ❌ | ✅ | ✅ | ✅ **Native** |
| Open Source | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Self-Hosted | ✅ | ❌ | ❌ | ✅ | ⚠️ | ✅ |
| India Focus | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| App Integration | ❌ | ⚠️ | ❌ | ❌ | ⚠️ | ✅ 15+ apps |
| CLI Publishing | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ ankr-publish |
| Price | $50/yr | $10/user/mo | Free | Free | $6/user/mo | **Free** |

---

## Success Metrics

### Week 4 (Obsidian parity)
- [ ] 1000+ documents indexed
- [ ] Graph view working
- [ ] Backlinks functional
- [ ] 5+ internal users

### Week 8 (NotebookLLM parity)
- [ ] AI chat working
- [ ] Semantic search <2s
- [ ] Audio generation
- [ ] 10+ internal users

### Week 12 (Enterprise ready)
- [ ] Multi-tenant
- [ ] SSO integration
- [ ] First paying customer
- [ ] 99.9% uptime

### Week 16 (Full Platform) ⭐ NEW
- [ ] ankr-publish fully integrated
- [ ] 50+ published documents
- [ ] Canvas mode working
- [ ] Offline mode functional
- [ ] 20+ active users

---

## Phase 11: PRATHAM - AI Quant Aptitude Tutor (Pilot Project) 🎯 EXTERNAL ENGAGEMENT
> **Goal:** Launch first external pilot with PRATHAM Institute using ANKR Interact as AI Tutor Platform
> **Timeline:** 6-8 weeks MVP
> **Target:** 100-300 students for pilot

### 11.1 What PRATHAM is (Simple)

**A personal AI tutor for Quantitative Aptitude**
- Student practices questions → system watches performance → AI tutor guides like real mentor
- Not just marks, but full learning journey: speed, accuracy, weak topics, consistency, revision
- "Handholding tutor" approach: detects where student is stuck, guides step-by-step

### 11.2 Student Experience (MVP)

#### A. Practice Interface
```
Student Flow:
1. Select: Exam/Module/Topic (e.g., Percentages, Time & Work, DI)
2. Solve: Questions in-app with timer
3. Track: System records automatically
```

**What System Records:**
- [ ] Time per question
- [ ] Number of attempts
- [ ] Accuracy rate
- [ ] Hints used count
- [ ] Mistake type classification
- [ ] Question difficulty vs performance

**UI Components:**
- [ ] Question viewer (LaTeX math rendering)
- [ ] Timer (countdown per question)
- [ ] Answer input (MCQ/numerical)
- [ ] Hint button (3 hints max)
- [ ] Skip/bookmark button
- [ ] Progress bar (questions completed)

#### B. Instant Feedback (Like a Teacher)

**After Each Question:**
```
✅ Correct!
"Good speed. You solved in 45 seconds (target: 60s)"

❌ Incorrect
"Common mistake: You used 100 instead of total.
Hint: In percentage, always identify the BASE first."
```

**After Topic/Module:**
```
📊 Your Performance:
✅ Strong: Simplification, Basic Algebra
⚠️  Slow: Time & Work (avg 90s, target 60s)
❌ Weak: Ratio Conversions (40% accuracy)

📝 Recommendation:
1. Practice 10 more ratio questions
2. Watch 5-min video on shortcut trick
3. Revise formula sheet
```

**Implementation:**
- [ ] Real-time feedback component
- [ ] Performance summary card
- [ ] Mistake pattern detection
- [ ] Personalized recommendations

#### C. AI Tutor Chat (Text-First, Multilingual)

**Student Can Ask Anytime:**

```typescript
// Student asks in English
"Why is this wrong?"
→ AI: "You calculated 20% of 500 as 50.
Correct: 20/100 × 500 = 100"

// Student asks in Hindi
"इसका faster trick बताओ"
→ AI: "10% निकालने के लिए simply zero हटा दो.
50 का 10% = 5"

// Practice request
"Make me practice 10 similar questions"
→ AI: [Generates 10 questions on same concept]
```

**Tutor Capabilities:**
- [ ] Explain wrong answers with step-by-step
- [ ] Provide shortcuts and tricks
- [ ] Generate similar practice questions
- [ ] Translate explanations to Hindi/regional
- [ ] Remember student's past mistakes
- [ ] Adjust explanation complexity

**Tech Stack:**
- @ankr/ai-router for LLM responses
- @ankr/ai-translate for multilingual
- @ankr/eon to remember student context
- Question generator using templates

#### D. Personalized Study Plan

**Daily/Weekly Plan Based on Profile:**

```
📅 Your Plan for Today (30 mins)
─────────────────────────────────
09:00 AM - Speed Drill (10 mins)
  → 15 questions, 40 sec each
  → Topic: Percentages

09:15 AM - Accuracy Practice (15 mins)
  → 10 questions, focus on steps
  → Topic: Time & Work (your weak area)

09:30 AM - Formula Revision (5 mins)
  → Review 5 formulas you missed yesterday
```

**Features:**
- [ ] Daily goal setting
- [ ] Time-boxed practice sessions
- [ ] Weak area focus
- [ ] Spaced repetition scheduling
- [ ] Revision reminders
- [ ] Motivational nudges

**Nudges & Reminders:**
```
🔔 "You're on a 5-day streak! Don't break it 🔥"
🔔 "Your Time & Work accuracy improved 15% this week!"
🔔 "Quick revision: 3 formulas in 2 mins?"
```

### 11.3 Admin/Teacher Dashboard (PRATHAM View)

#### A. Student Analytics

**Per Student View:**
```
Student: Rajesh Kumar
─────────────────────────────────
Module Mastery:
  Percentages:     85% ████████▓░
  Time & Work:     45% ████▓░░░░░
  DI:              60% ██████░░░░

Speed Trend: ↗ Improving (+10% faster than last week)
Accuracy Trend: ↘ Declining (5% drop in last 3 days)

Error Patterns:
  1. Ratio conversions (12 mistakes in 7 days)
  2. Reading comprehension in DI (8 mistakes)
  3. Calculation errors (5 mistakes)

Recommended Actions:
  ⚠️  Schedule 1-on-1 call (accuracy dropping)
  📞 Call script: "Focus on careful reading in DI"
```

**Batch View:**
```
Batch: CAT 2026 Morning
─────────────────────────────────
Total Students: 150
Active (7 days): 120 (80%)
Improving: 85 (57%)
Stuck: 25 (17%) ⚠️
Dropping: 10 (7%) 🚨

Top Performers: Priya (92%), Amit (89%)
Need Attention: Rajesh (45%), Sneha (38%)

Module-wise Batch Avg:
  Percentages: 78%
  Time & Work: 62%
  DI: 55%
```

**Implementation:**
- [ ] Student profile page
- [ ] Batch overview dashboard
- [ ] Module mastery charts
- [ ] Trend graphs (speed, accuracy over time)
- [ ] Error pattern visualization
- [ ] Recommendations engine

#### B. Telecaller/Counselor View

**Who to Call & Why:**

```
🚨 Priority Calls (Next 3 Days)
─────────────────────────────────
1. Rajesh Kumar
   Reason: Accuracy dropped 15% in 3 days
   Last active: 2 days ago
   Suggested: "Check if stressed, offer help"

2. Sneha Patel
   Reason: Stuck on Time & Work (30% for 2 weeks)
   Attempts: High, but no improvement
   Suggested: "Recommend 1-on-1 doubt session"

3. Amit Shah
   Reason: Inactive for 5 days (was consistent)
   Suggested: "Check if facing issues, re-engage"
```

**Call Script Generator:**
```
📞 Call: Rajesh Kumar

Opening:
"Hi Rajesh, I noticed your practice has been great,
but accuracy dipped a bit. Everything okay?"

If Student Says "Struggling with DI":
"I see. Your issue is reading speed in DI.
Let me assign you 5 focused DI questions daily
with reading tips. Would that help?"

Follow-up Task:
[ ] Assign DI reading practice (5 q/day for 7 days)
[ ] Schedule check-in call in 3 days
```

**Features:**
- [ ] Priority call list (auto-generated)
- [ ] Call reasons with data
- [ ] Suggested talking points
- [ ] Action items after call
- [ ] Track call outcomes

### 11.4 The Data We Use

#### A. Historical Data (If Available from PRATHAM)
- Past test scores, topic-wise marks
- Attempt history from old batches
- Success/failure patterns (what leads to good results)
- Benchmark times per question type
- Common mistake patterns from previous cohorts

#### B. Current Material (PRATHAM Provides)
- Question bank with solutions
- Module/topic structure
- Exam pattern mapping
- Difficulty levels per question
- Formula sheets and shortcuts

#### C. Live Student Data (Generated Daily)
- Time per question
- Attempts per question
- Accuracy per topic
- Hint usage patterns
- Revision effectiveness
- Drop-off points / inactivity
- Peak practice hours
- Device usage (mobile/desktop)

### 11.5 Core Signals (Metrics We Compute)

| Signal | Formula | Purpose |
|--------|---------|---------|
| **Speed Score** | Avg time per Q ÷ Target time | Identify slow topics |
| **Accuracy Score** | Correct ÷ Total attempts | Overall performance |
| **Mastery Score** | (Accuracy × Speed × Consistency) | Topic readiness |
| **Consistency Score** | Active days ÷ Total days | Practice regularity |
| **Mistake Fingerprint** | Cluster similar errors | Pattern detection |
| **Confidence Score** | Performance variance | Stability under pressure |
| **Improvement Rate** | (Current - Past) ÷ Time | Learning velocity |

**Implementation:**
```typescript
// Example: Calculate Speed Score
const calculateSpeedScore = (avgTime: number, targetTime: number) => {
  const ratio = avgTime / targetTime;
  if (ratio <= 1) return 100; // Faster than target
  if (ratio >= 2) return 0;   // 2x slower
  return Math.max(0, 100 - (ratio - 1) * 100);
};

// Example: Mastery Score
const masteryScore = (accuracy: number, speedScore: number, consistency: number) => {
  return (accuracy * 0.5) + (speedScore * 0.3) + (consistency * 0.2);
};
```

### 11.6 Recommendation Engine (MVP Logic)

**Smart Rules:**

| Condition | Recommendation |
|-----------|----------------|
| Slow + Accurate | Speed drills (timed practice, shortcuts) |
| Fast + Inaccurate | Accuracy drills (step-by-step, concept revision) |
| Topic mastery < 50% | Micro-lessons + guided practice |
| Inconsistent practice | Nudges + short 10-min sessions |
| Repeating mistake type | Targeted explanation + 10 similar questions |
| Stuck for 3+ days | Human intervention (telecaller call) |
| High performer | Challenge mode (harder questions) |
| Inactive 2+ days | Re-engagement notification |

**Implementation:**
```typescript
const getRecommendation = (student: Student) => {
  const { speed, accuracy, consistency, weakTopic } = student.metrics;

  if (speed < 60 && accuracy > 80) {
    return {
      type: 'speed_drill',
      message: 'Your accuracy is great! Let's work on speed.',
      action: 'Practice 20 questions in timed mode (30 sec each)'
    };
  }

  if (speed > 80 && accuracy < 60) {
    return {
      type: 'accuracy_drill',
      message: 'You're fast, but let's focus on getting answers right.',
      action: 'Solve 10 questions step-by-step without timer'
    };
  }

  if (weakTopic && weakTopic.mastery < 50) {
    return {
      type: 'concept_revision',
      message: `${weakTopic.name} needs attention.`,
      action: `Watch 5-min video + solve 5 easy questions`
    };
  }

  // ... more rules
};
```

### 11.7 Implementation Timeline (6-8 Weeks MVP)

**Week 1: Scope & Setup**
- [ ] Map PRATHAM content to modules/topics
- [ ] Define all metrics and signals
- [ ] Set up ankr_tutor database schema
- [ ] Import question bank (100 questions for pilot)

**Week 2-3: Data Layer & Practice Tracking**
- [ ] Build practice interface (question viewer + timer)
- [ ] Implement answer submission & validation
- [ ] Track all student interactions (time, attempts, hints)
- [ ] Build metrics computation engine
- [ ] Dashboard skeleton (student + admin views)

**Week 4-6: AI Tutor & Recommendations**
- [ ] Integrate @ankr/ai-router for chat
- [ ] Build recommendation rules engine
- [ ] Create feedback components (instant + summary)
- [ ] Implement nudge/reminder system
- [ ] Daily plan generator
- [ ] Telecaller priority list

**Week 7-8: Pilot & Iteration**
- [ ] Onboard 100-300 students
- [ ] Monitor performance metrics
- [ ] Collect student feedback
- [ ] Fix bugs and improve UX
- [ ] Measure success criteria

### 11.8 Success Criteria (Pilot)

**Define Upfront:**

| Metric | Baseline | Target (8 weeks) | Measurement |
|--------|----------|------------------|-------------|
| Avg Speed | 80 sec/q | 60 sec/q (-25%) | Time tracking |
| Topic Accuracy | 55% | 70% (+15%) | Correct/total |
| Practice Consistency | 3 days/week | 5 days/week | Active days |
| Student Satisfaction | N/A | 4/5 rating | Feedback survey |
| Telecaller Efficiency | N/A | 30% fewer calls | Call volume |

**Hard Success Metrics:**
- [ ] 70%+ students improve speed by 15%+
- [ ] 60%+ students improve accuracy by 10%+
- [ ] 80%+ students practice 4+ days/week
- [ ] 4/5 average satisfaction rating
- [ ] 25%+ reduction in "stuck students" needing calls

### 11.9 Technical Architecture (PRATHAM + ANKR Interact)

```
┌─────────────────────────────────────────────────────────────┐
│              PRATHAM AI Tutor (ANKR Interact)                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Student App                    Admin Dashboard             │
│  ┌─────────────────┐           ┌─────────────────┐         │
│  │ Practice UI     │           │ Student Analytics│         │
│  │ • Timer         │           │ • Performance    │         │
│  │ • Q&A Interface │           │ • Error Patterns │         │
│  │ • Progress Bar  │           │ • Recommendations│         │
│  └─────────────────┘           └─────────────────┘         │
│  ┌─────────────────┐           ┌─────────────────┐         │
│  │ AI Tutor Chat   │           │ Telecaller View │         │
│  │ • Explanations  │           │ • Priority Calls │         │
│  │ • Hints         │           │ • Call Scripts   │         │
│  │ • Q Generator   │           │ • Track Outcomes │         │
│  └─────────────────┘           └─────────────────┘         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Backend Services                                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ @ankr/tutor  │ │ @ankr/ai-    │ │ @ankr/       │        │
│  │ Quiz, Track  │ │ router (LLM) │ │ learning     │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ Metrics      │ │ Recommendation│ │ @ankr/eon    │        │
│  │ Engine       │ │ Engine        │ │ (Memory)     │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                 │
│  PostgreSQL (ankr_tutor)      Redis (Cache)                 │
│  • Questions, Answers         • Session data                │
│  • Student progress           • Real-time metrics           │
│  • Performance metrics        • Leaderboard                 │
└─────────────────────────────────────────────────────────────┘
```

### 11.10 Database Schema (PRATHAM-Specific)

```prisma
model PrathamQuestion {
  id          String   @id @default(cuid())
  module      String   // Percentages, Time & Work, DI
  topic       String   // Simple Interest, Compound Interest
  difficulty  String   // easy, medium, hard
  question    String   @db.Text
  options     String[] // For MCQ
  answer      String
  solution    String   @db.Text
  timeTarget  Int      // Target time in seconds
  hints       String[]
  createdAt   DateTime @default(now())
}

model PrathamAttempt {
  id          String   @id @default(cuid())
  studentId   String
  questionId  String
  question    PrathamQuestion @relation(fields: [questionId], references: [id])
  timeTaken   Int      // seconds
  isCorrect   Boolean
  hintsUsed   Int
  attemptNum  Int      // 1st, 2nd, 3rd attempt
  mistakeType String?  // conceptual, calculation, reading
  createdAt   DateTime @default(now())
}

model PrathamStudentMetrics {
  id             String   @id @default(cuid())
  studentId      String   @unique
  moduleScores   Json     // { "Percentages": 85, "Time & Work": 45 }
  speedScore     Float
  accuracyScore  Float
  masteryScore   Float
  consistencyScore Float
  weakTopics     String[]
  strongTopics   String[]
  errorPatterns  Json
  lastActive     DateTime
  updatedAt      DateTime @updatedAt
}

model PrathamRecommendation {
  id          String   @id @default(cuid())
  studentId   String
  type        String   // speed_drill, accuracy_drill, concept_revision
  message     String
  action      String
  priority    Int      // 1 (high) to 5 (low)
  completed   Boolean  @default(false)
  createdAt   DateTime @default(now())
}

model PrathamTelecallerTask {
  id          String   @id @default(cuid())
  studentId   String
  reason      String
  callScript  String   @db.Text
  priority    Int
  status      String   @default("pending") // pending, completed, skipped
  callerId    String?
  outcome     String?
  notes       String?
  createdAt   DateTime @default(now())
  completedAt DateTime?
}
```

### 11.11 Business Terms (Clean & Practical)

#### A. Ownership / IP
- **PRATHAM owns:** Question bank, content, solutions, brand
- **ANKR owns:** AI Tutor framework, analytics engine, recommendation system
- **License model:** PRATHAM gets custom deployment OR joint IP (TBD)

#### B. Data Privacy & Usage
- Student data used **only** for PRATHAM tutoring outcomes
- No external reuse without written permission
- Data retention: Anonymize after 2 years (or as agreed)
- GDPR-compliant if students are international

#### C. Autonomy & Decision-Making
- **Product + Tech roadmap:** Led by Anil/ANKR (execution ownership)
- **Academic inputs:** PRATHAM provides (content, validation, pilot feedback)
- **Weekly checkpoints:** Fast iteration cycles, joint review

#### D. Commercial Model (After Pilot)

| Option | Pricing | Notes |
|--------|---------|-------|
| **Option 1** | Fixed build + ₹50K/month maintenance | Predictable cost |
| **Option 2** | ₹50/student/month | Scales with enrollment |
| **Option 3** | 20% revenue share on incremental conversions | Performance-based |

**Pilot Agreement:**
- Free for 100-300 students (8 weeks)
- Success criteria defined upfront
- Commercial terms decided after pilot results

### 11.12 What Makes PRATHAM AI Tutor Different

**Not Just "Content + Tests"**

| Traditional Coaching | PRATHAM AI Tutor |
|---------------------|------------------|
| One-size-fits-all tests | Personalized practice path |
| Marks-focused | Journey-focused (speed, accuracy, consistency) |
| Manual telecaller outreach | AI-prioritized calls (who needs help) |
| Generic doubt clearing | Targeted explanations based on mistake type |
| No real-time tracking | Live performance monitoring |
| Student lost in crowd | Every student gets attention |

**True Handholding:**
- Detects **where** student is stuck
- Guides **step-by-step** with hints
- Recommends **what to practice next**
- Alerts teachers **who needs help**
- Turns learning into **measurable journey**

### 11.13 Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Low student adoption | Pilot fails | Onboarding support, UX polish |
| Question bank too small | Limited practice | Start with 500+ questions |
| AI tutor not accurate | Bad feedback | Human review + feedback loop |
| Students game the system | Fake progress | Time tracking, attempt patterns |
| Teacher resistance | Low usage | Teacher training, show value |
| Technical issues | Poor UX | Beta test with 20 students first |

---

## Immediate Next Steps

### Today
1. [ ] Add `@ankr/publish` to ankr-viewer dependencies
2. [ ] Create `/api/publish` endpoint
3. [ ] Create basic PublishButton component

### This Week
1. [ ] Complete all Phase 8.1 API endpoints
2. [ ] Create PublishDialog component
3. [ ] Add publish status to document toolbar
4. [ ] Test end-to-end publishing flow

### Next Week
1. [ ] Implement batch publishing
2. [ ] Add publish analytics
3. [ ] Create public document portal improvements
4. [ ] Add CLI ↔ UI sync

---

## Resources

### Documentation
- ankr-publish: `/root/ankr-labs-nx/packages/ankr-publish/README.md`
- ankr-viewer: `/root/ankr-labs-nx/packages/ankr-viewer/README.md`
- AFFiNE: https://github.com/toeverything/AFFiNE

### API Endpoints (Current)
- Server: `http://localhost:3199`
- Files: `/api/files`, `/api/file`
- Search: `/api/search`, `/api/knowledge/search`
- Graph: `/api/knowledge/graph`
- Bookmarks: `/api/bookmarks`
- Sources: `/api/sources`

### Ports
- ankr-viewer: 3199
- ankr-publish docs: https://ankr.in/project/documents/

---

*Created: 2026-01-20*
*Author: Claude + ANKR Team*
*Status: Planning - Ready for Implementation*
