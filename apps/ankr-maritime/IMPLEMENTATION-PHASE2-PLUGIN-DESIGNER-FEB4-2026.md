# Phase 2: Maritime Plugin + Visual Plugin Designer
## February 4, 2026

## 🎯 Vision: No-Code Email Intelligence

**Goal**: Allow ANY user (layman, non-technical) to create industry-specific email parsers through a visual interface - no coding required!

**User Flow**:
```
1. Open Plugin Designer
2. Enter industry name (e.g., "Real Estate")
3. Add entity extractors visually:
   - Type: "Property Address"
   - Examples: "123 Main St", "456 Oak Ave"
   - AI learns pattern automatically
4. Define categories with keywords
5. Set up routing buckets with drag-drop conditions
6. Test with sample emails
7. Export as JSON plugin
8. Share plugin on marketplace
```

---

## 📊 Architecture

```
┌────────────────────────────────────────────────────────┐
│         PLUGIN DESIGNER UI (React)                     │
│                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐│
│  │   Entity     │  │  Category    │  │   Bucket    ││
│  │  Designer    │  │  Designer    │  │  Designer   ││
│  │              │  │              │  │             ││
│  │ • Add type   │  │ • Add cat.   │  │ • Add rule  ││
│  │ • Examples   │  │ • Keywords   │  │ • Condition ││
│  │ • AI learn   │  │ • Weight     │  │ • Routing   ││
│  └──────────────┘  └──────────────┘  └─────────────┘│
│                                                        │
│  ┌─────────────────────────────────────────────────┐ │
│  │          EMAIL TESTER                           │ │
│  │  • Paste sample email                           │ │
│  │  • See extracted entities (live)                │ │
│  │  • See category/urgency/bucket (live)           │ │
│  │  • Adjust patterns if needed                    │ │
│  └─────────────────────────────────────────────────┘ │
│                                                        │
│  ┌─────────────────────────────────────────────────┐ │
│  │          PLUGIN PREVIEW                         │ │
│  │  • JSON preview                                 │ │
│  │  • Export to file                               │ │
│  │  • Save to database                             │ │
│  │  • Share on marketplace                         │ │
│  └─────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementation

### Part 1: Maritime Plugin (Reference)

First, create maritime plugin as reference implementation.

**File**: `backend/src/services/email-intelligence/plugins/maritime/index.ts`

### Part 2: Plugin Designer UI (React)

**Files**:
1. `frontend/src/pages/PluginDesigner.tsx` (main page)
2. `frontend/src/components/plugin-designer/EntityDesigner.tsx`
3. `frontend/src/components/plugin-designer/CategoryDesigner.tsx`
4. `frontend/src/components/plugin-designer/BucketDesigner.tsx`
5. `frontend/src/components/plugin-designer/EmailTester.tsx`
6. `frontend/src/components/plugin-designer/PluginPreview.tsx`

### Part 3: GraphQL API

**File**: `backend/src/schema/types/plugin-designer.ts`

---

## 📝 Let's Build It!

Starting with maritime plugin, then the visual designer...
