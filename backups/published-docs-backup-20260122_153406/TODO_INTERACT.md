# ANKR Interact - Enhancement Roadmap

> **Vision:** Transform ANKR Interact from a simple document viewer into a powerful **Knowledge OS** - combining the best of Obsidian (graph/linking), Notion (blocks/databases), and NotebookLLM (AI-powered insights).

---

## Why This Is A Game-Changer

### 1. **Single Source of Truth for ANKR Ecosystem**
- All 15+ ANKR apps generate documentation, logs, and knowledge
- Currently scattered across files, databases, and people's heads
- ANKR Interact becomes the **central brain** that connects everything

### 2. **Competitive Advantage**
| Tool | Limitation | ANKR Interact Advantage |
|------|------------|------------------------|
| Obsidian | Local-only, no AI | Cloud-native + AI-powered |
| Notion | Generic, expensive | Built for Indian enterprise, integrated with ANKR apps |
| NotebookLLM | Google-owned, limited | Self-hosted, customizable, privacy-first |
| Confluence | Slow, expensive | Fast, free, modern |
| **AFFiNE** | No India focus, no integrations | India-first, 15+ app connectors, domain AI |

### 3. **Revenue Potential**
- **SaaS Model:** ₹999/user/month for enterprise knowledge management
- **White-label:** Sell to logistics companies, CAs, law firms
- **API Access:** Charge for AI-powered document queries

### 4. **AI Training Ground**
- Every document becomes training data for ANKR's AI models
- Build domain-specific knowledge (logistics, compliance, finance)
- Create competitive moat through proprietary data

---

## Current State (v1.0)

```
✅ Markdown rendering
✅ File browser
✅ Search (basic)
✅ Bookmarks
✅ Recent files
✅ Dark/light theme
✅ Mobile responsive
✅ PDF viewing
```

**Database:** 14 tables (just created)
**Port:** 3199
**URL:** https://ankr.in/project/documents/

---

## Enhancement Phases

### Phase 1: Foundation (Week 1-2)
> **Goal:** Stable base with proper data persistence

#### 1.1 Database Integration
- [ ] Connect Prisma client to ankr_viewer database
- [ ] Migrate bookmarks.json → Bookmark table
- [ ] Migrate recent.json → RecentFile table
- [ ] Migrate sources.json → Workspace/Folder tables
- [ ] Add document sync (file → Document table)

#### 1.2 Authentication
- [ ] Integrate @ankr/oauth for Google/GitHub login
- [ ] Add user sessions
- [ ] Role-based access (viewer, editor, admin)
- [ ] Share links with permissions

#### 1.3 Real-time Sync
- [ ] WebSocket connection for live updates
- [ ] Collaborative cursors (who's viewing what)
- [ ] Auto-save with conflict resolution

---

### Phase 2: Obsidian Features (Week 3-4)
> **Goal:** Bidirectional linking and graph visualization

#### 2.1 Wiki-style Linking
- [ ] `[[Page Name]]` syntax support
- [ ] Auto-complete for page names
- [ ] Create page on link click if doesn't exist
- [ ] Backlinks panel (who links to this page)

#### 2.2 Graph View
- [ ] Force-directed graph of all documents
- [ ] Filter by folder, tag, date
- [ ] Cluster by topic (AI-detected)
- [ ] Click node to open document
- [ ] Zoom/pan/search in graph

#### 2.3 Tags & Properties
- [ ] Frontmatter YAML parsing
- [ ] Tag autocomplete (#compliance, #logistics)
- [ ] Custom properties (status, priority, assignee)
- [ ] Filter/sort by properties

#### 2.4 Daily Notes
- [ ] Auto-create daily note
- [ ] Template support
- [ ] Quick capture from anywhere
- [ ] Link to today's meetings/tasks

---

### Phase 3: Notion Features (Week 5-6)
> **Goal:** Block-based editing and databases

#### 3.1 Block Editor
- [ ] Paragraph, headings (H1-H6)
- [ ] Bulleted/numbered lists
- [ ] Toggle lists (collapsible)
- [ ] Code blocks with syntax highlighting
- [ ] Callouts (info, warning, error, success)
- [ ] Dividers
- [ ] Quote blocks
- [ ] Tables (inline)

#### 3.2 Advanced Blocks
- [ ] Embeds (YouTube, Figma, Miro, Google Docs)
- [ ] File attachments
- [ ] Image galleries
- [ ] Kanban boards
- [ ] Calendars
- [ ] Timelines

#### 3.3 Databases (Notion-style)
- [ ] Table view
- [ ] Board view (Kanban)
- [ ] List view
- [ ] Calendar view
- [ ] Gallery view
- [ ] Linked databases
- [ ] Formulas
- [ ] Relations between databases

#### 3.4 Templates
- [ ] Meeting notes template
- [ ] Project brief template
- [ ] Bug report template
- [ ] Decision log template
- [ ] Custom template builder

---

### Phase 4: NotebookLLM Features (Week 7-8)
> **Goal:** AI-powered knowledge synthesis

#### 4.1 Document Understanding
- [ ] Auto-summarize on upload
- [ ] Extract key entities (companies, people, dates)
- [ ] Detect document type (invoice, contract, SOP)
- [ ] Generate tags automatically

#### 4.2 AI Chat Interface
- [ ] "Ask this document" - Q&A on single doc
- [ ] "Ask workspace" - Q&A across all docs
- [ ] Citation with page links
- [ ] Follow-up questions

#### 4.3 Knowledge Synthesis
- [ ] "Compare these documents"
- [ ] "Summarize this folder"
- [ ] "Find contradictions"
- [ ] "Generate FAQ from docs"
- [ ] "Create study guide"

#### 4.4 Audio Features (like NotebookLLM)
- [ ] Generate podcast from documents
- [ ] Text-to-speech for documents
- [ ] Voice notes with transcription
- [ ] Meeting recording → notes

#### 4.5 Smart Search
- [ ] Semantic search (meaning, not just keywords)
- [ ] "Find documents about X"
- [ ] "Show me everything from last week"
- [ ] Natural language filters

---

### Phase 5: ANKR Integration (Week 9-10)
> **Goal:** Deep integration with ANKR ecosystem

#### 5.1 App Connectors
- [ ] WowTruck: Import shipment docs, LRs, PODs
- [ ] FreightBox: Import BOLs, quotes, contracts
- [ ] CompyMitra: Import compliance docs, filings
- [ ] BFC: Import financial reports, invoices
- [ ] EON: Sync memories and learnings

#### 5.2 Auto-Documentation
- [ ] Generate API docs from code
- [ ] Generate user guides from features
- [ ] Changelog from git commits
- [ ] Architecture diagrams from code

#### 5.3 Workflow Integration
- [ ] Create task in CRM from document
- [ ] Generate invoice from quote doc
- [ ] File compliance from document
- [ ] Trigger automation from doc changes

#### 5.4 Knowledge Graph
- [ ] Connect documents to ANKR entities
- [ ] "Show all docs for customer X"
- [ ] "Show all docs for shipment Y"
- [ ] Cross-app knowledge discovery

---

### Phase 6: Enterprise Features (Week 11-12)
> **Goal:** Ready for enterprise deployment

#### 6.1 Security & Compliance
- [ ] End-to-end encryption option
- [ ] Audit logs (who viewed/edited what)
- [ ] Data retention policies
- [ ] GDPR compliance tools
- [ ] SOC2 readiness

#### 6.2 Admin Dashboard
- [ ] User management
- [ ] Workspace analytics
- [ ] Storage usage
- [ ] API usage metrics
- [ ] Billing integration

#### 6.3 Advanced Collaboration
- [ ] Comments on any block
- [ ] @mentions with notifications
- [ ] Approval workflows
- [ ] Version comparison (diff view)
- [ ] Restore previous versions

#### 6.4 Import/Export
- [ ] Import from Notion
- [ ] Import from Confluence
- [ ] Import from Google Docs
- [ ] Export to PDF/Word/HTML
- [ ] Backup/restore workspaces

---

## Technical Architecture

### Frontend
```
React 19 + Vite
├── TipTap Editor (block-based, like Notion)
├── D3.js / Cytoscape (graph visualization)
├── Monaco Editor (code blocks)
├── Zustand (state management)
├── TanStack Query (data fetching)
└── Tailwind + Shadcn/ui (styling)
```

### Backend
```
Fastify + GraphQL (Mercurius)
├── Prisma (database ORM)
├── Socket.io (real-time)
├── Bull (job queues)
├── @ankr/ai-router (AI calls)
└── @ankr/embeddings (vector search)
```

### Database
```
PostgreSQL (ankr_viewer)
├── Documents, Blocks, Links (content)
├── Workspaces, Folders (organization)
├── Users, Permissions (access control)
├── SearchIndex + pgvector (AI search)
└── AuditLog (compliance)
```

### AI Pipeline
```
Document Upload
    ↓
Text Extraction (PDFKit, Mammoth)
    ↓
Chunking (semantic splitting)
    ↓
Embedding (OpenAI/Cohere)
    ↓
Store in pgvector
    ↓
Query → Retrieve → Generate
```

---

## Database Schema (Already Created)

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
SearchIndex     - Vector embeddings

// User
UserPreference  - Settings
Bookmark        - Saved pages
RecentFile      - History
Template        - Reusable templates
```

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

---

## Built-in Publishing (ankr-publish Integration)

> **Goal:** Make ANKR Interact self-publishing - no CLI needed

### Current: ankr-publish CLI
```bash
ankr-publish /path/to/file.md -l   # Publish with link
ankr-publish rebuild               # Rebuild index
ankr-publish notify                # Refresh viewer
```

### Future: In-App Publishing
- [ ] **Publish Button** in editor toolbar
- [ ] **One-click publish** any document
- [ ] **Batch publish** entire folders
- [ ] **Schedule publish** for later
- [ ] **Unpublish** to remove from public
- [ ] **Publish history** with rollback
- [ ] **Custom URLs** for published docs
- [ ] **Analytics** (views, downloads)

### Publishing Workflow
```
Edit Document
    ↓
Click "Publish" ▶
    ↓
Choose visibility:
  • Public (anyone with link)
  • Team (logged-in users)
  • Private (only me)
    ↓
Auto-generate shareable link
    ↓
Track views & engagement
```

### Why This Matters
1. **No CLI needed** - Non-technical users can publish
2. **Version control** - See what was published when
3. **Access control** - Public vs private documents
4. **Analytics** - Know what content is popular
5. **SEO** - Auto-generate meta tags, sitemap

---

## Immediate Next Steps

### Today
1. [ ] Generate Prisma client for ankr-viewer
2. [ ] Create basic CRUD API for documents
3. [ ] Add document sync from file system

### This Week
1. [ ] Implement [[wiki links]] parsing
2. [ ] Add backlinks panel
3. [ ] Basic graph view (D3.js)

### Next Week
1. [ ] TipTap editor integration
2. [ ] Block-based editing
3. [ ] AI summarization on upload

---

## Why NOW is the Right Time

1. **Database Ready:** Just created ankr_viewer with 14 tables
2. **AI Infrastructure:** @ankr/ai-router, @ankr/embeddings exist
3. **User Base:** 15+ ANKR apps generating documents
4. **Market Gap:** No good Indian knowledge management tool
5. **Competitive Timing:** NotebookLLM just launched, market is hot

---

## Resources Required

| Resource | Current | Needed |
|----------|---------|--------|
| Developer | 0 dedicated | 1 full-time |
| Designer | 0 | 0.5 (can use Shadcn) |
| AI/ML | Shared | Shared (existing infra) |
| Infrastructure | ✅ Ready | ✅ Ready |
| Database | ✅ Created | ✅ Created |

**Estimated Cost:** ₹0 additional (using existing infra)
**Estimated Time:** 12 weeks to enterprise-ready
**Potential Revenue:** ₹10L/month within 6 months

---

## Competition Analysis

### Obsidian
- **Pros:** Fast, local-first, plugins
- **Cons:** No real collaboration, no AI, desktop-only
- **Our Edge:** Cloud-native, AI-powered, mobile-first

### Notion
- **Pros:** Beautiful, collaborative, databases
- **Cons:** Slow, expensive ($10/user), US-focused
- **Our Edge:** Fast, affordable, India-focused, integrated

### NotebookLLM
- **Pros:** AI-powered, Google backing
- **Cons:** Limited to PDFs, no editing, Google lock-in
- **Our Edge:** Full editing, self-hosted, multi-format

### Confluence
- **Pros:** Enterprise standard, Jira integration
- **Cons:** Slow, ugly, expensive, outdated
- **Our Edge:** Modern, fast, affordable, AI-powered

### AFFiNE (New Competitor - Open Source)
- **Pros:** Open-source, local-first, Notion+Miro hybrid, edgeless canvas, CRDT sync
- **Cons:** Still maturing, smaller community, limited integrations
- **Our Edge:** India-focused, integrated with ANKR ecosystem, enterprise connectors, domain-specific AI

---

## Phase 7: AFFiNE-Inspired Features (Week 13-14)
> **Goal:** Adopt best features from AFFiNE - the rising open-source Notion+Miro alternative
> **Reference:** [AFFiNE GitHub](https://github.com/toeverything/AFFiNE) | [AFFiNE Docs](https://docs.affine.pro/)

### 7.1 Edgeless Canvas Mode (Miro-like)
> AFFiNE's killer feature: seamlessly switch between document mode and infinite canvas

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
> "Everything is a block, and each block can be transformed into another type with just a click"

- [ ] **One-Click Transform** - Paragraph → Heading → Todo → Code
- [ ] **Block to Page** - Convert any block group into a linked page
- [ ] **Page to Block** - Embed page inline as a block
- [ ] **Table Row to Page** - Database row becomes full document
- [ ] **Block to Database** - Convert group into structured data
- [ ] **Drag to Canvas** - Move blocks from doc to edgeless freely

### 7.3 Local-First Architecture (CRDT-based)
> AFFiNE uses OctoBase (Rust) + Yjs for conflict-free offline sync

- [ ] **Offline-First** - Full functionality without internet
- [ ] **CRDT Sync** - Conflict-free merging when back online
- [ ] **Local Storage** - IndexedDB/SQLite for browser persistence
- [ ] **Selective Sync** - Choose what to sync to cloud
- [ ] **Data Ownership** - Export all data anytime (JSON/Markdown)
- [ ] **P2P Sync Option** - Direct device-to-device sync

### 7.4 Multi-View Databases (Enhanced)
> "Every block group has infinite views"

- [ ] **Inline Database** - Create database anywhere in document
- [ ] **View Switcher** - Toggle Table/Board/Calendar/Gallery instantly
- [ ] **Linked Views** - Same data, different views in different docs
- [ ] **Database as Page** - Each database is also a navigable page
- [ ] **Sub-Items** - Nested rows within database entries
- [ ] **Rollups & Lookups** - Cross-database computed fields

### 7.5 Advanced Whiteboard Features
> Borrowed from Miro/FigJam

- [ ] **Voting/Reactions** - Add emoji reactions to canvas items
- [ ] **Timer Widget** - Countdown for brainstorming sessions
- [ ] **Cursor Chat** - Quick messages at cursor position
- [ ] **Templates Gallery** - Pre-made canvas templates (retrospective, user journey, etc.)
- [ ] **Image Backgrounds** - Set canvas background image
- [ ] **Grid/Snap** - Alignment helpers for neat layouts
- [ ] **Export Canvas** - PNG/SVG/PDF export of canvas

### 7.6 BlockSuite-Inspired Editor
> AFFiNE's editor framework is open-source as BlockSuite

- [ ] **Slash Commands** - Type `/` for quick block insertion
- [ ] **Inline Formatting** - Bold, italic, code, highlight inline
- [ ] **Mentions** - `@page`, `@person`, `@date`
- [ ] **Block Handles** - Drag handle for every block
- [ ] **Multi-Select** - Select and manipulate multiple blocks
- [ ] **Copy as Markdown/HTML** - Format-aware clipboard

---

## AFFiNE Feature Comparison

| Feature | AFFiNE | Notion | Obsidian | ANKR Interact (Target) |
|---------|--------|--------|----------|------------------------|
| Edgeless Canvas | ✅ | ❌ | ❌ (plugin) | 🎯 Phase 7 |
| Local-First | ✅ | ❌ | ✅ | 🎯 Phase 7 |
| CRDT Sync | ✅ | ❌ | ❌ | 🎯 Phase 7 |
| Block Transform | ✅ | ⚠️ Limited | ❌ | 🎯 Phase 7 |
| Open Source | ✅ | ❌ | ❌ | ✅ Already |
| AI Integration | ⚠️ Paid | ✅ | ❌ | ✅ @ankr/ai-router |
| India Localization | ❌ | ❌ | ❌ | ✅ Built-in |
| App Integrations | ❌ | ⚠️ Limited | ❌ | ✅ 15+ ANKR apps |
| Self-Hosted | ✅ | ❌ | ✅ | ✅ Already |
| Mobile Apps | ✅ | ✅ | ⚠️ Limited | 🎯 Phase 8 |

---

## The Vision

> **ANKR Interact** becomes the **second brain** for every ANKR user.
>
> Every document, every conversation, every decision - captured, connected, and queryable.
>
> "What did we decide about X?" → Instant answer with source.
> "Show me everything related to customer Y" → Complete knowledge graph.
> "Summarize our compliance status" → AI-generated report.

This is not just a document viewer. This is **Knowledge Infrastructure**.

---

*Created: 2026-01-20*
*Author: Claude + ANKR Team*
*Status: Planning*
