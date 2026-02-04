# Phase 2: Plugin Designer Complete - Email Intelligence Evolution Roadmap
## February 4, 2026

## 🎉 Phase 2 Complete: Visual Plugin Designer

### What Was Built

**Backend (GraphQL API)** ✅
- File: `backend/src/schema/types/plugin-designer.ts` (349 lines)
- **Queries**:
  - `plugins` - List all available plugins with stats
  - `plugin(industry)` - Get plugin details by industry
  - `testEmail(industry, subject, body)` - Live email testing
- **Mutations**:
  - `savePlugin(...)` - Create/update plugin configuration
  - `deletePlugin(industry)` - Delete plugin (TODO)
  - `learnPattern(entityType, examples)` - AI pattern learning from examples
- **Types**: EntityExtractor, CategoryConfig, BucketConfig, IndustryPlugin, EmailTestResult

**Frontend (React Components)** ✅
1. **EntityDesigner.tsx** (300+ lines)
   - Add/edit/delete entity extractors
   - Training examples with AI pattern learning
   - Regex, multi-pattern, and RAG extraction modes
   - Visual extractor cards with expand/collapse

2. **CategoryDesigner.tsx** (300+ lines)
   - Category configuration with keywords
   - Bulk keyword import (comma/newline separated)
   - Weight adjustment for scoring
   - Keyword pills with inline editing

3. **BucketDesigner.tsx** (350+ lines)
   - Visual bucket routing rules
   - Drag-drop condition builder
   - 7 operators: equals, contains, matches, gt, lt, in, not_in
   - Notification channel selection (email, sms, slack, teams, push)

4. **EmailTester.tsx** (300+ lines)
   - Live email testing with sample data
   - Real-time entity extraction visualization
   - Category, urgency, bucket classification display
   - Performance metrics (processing time, confidence)
   - Load sample email button

5. **PluginPreview.tsx** (250+ lines)
   - JSON preview with syntax highlighting
   - Copy to clipboard
   - Download as JSON file
   - Save to database
   - Share to marketplace (coming soon)
   - Plugin statistics dashboard

6. **PluginDesigner.tsx** (500+ lines) - Main page
   - Tab navigation: Info, Entities, Categories, Buckets, Test, Preview
   - Basic plugin info form (industry, displayName, version, author, description)
   - Progress tracking with counts
   - Save/export functionality

**Total Code**: ~2,300 lines across 7 files

---

## ✅ Phase 2 Summary

### Features Delivered

1. **No-Code Plugin Creation** ✅
   - Visual interface for non-technical users
   - No coding required
   - Industry-agnostic design

2. **Entity Designer** ✅
   - Add custom entity types
   - Provide training examples
   - AI learns patterns automatically
   - Manual regex editing option

3. **Category Designer** ✅
   - Define email categories
   - Keyword-based classification
   - Adjustable weights
   - Bulk keyword import

4. **Bucket Designer** ✅
   - Visual routing rules
   - Multi-condition AND logic
   - Notification channel configuration
   - Assignment rules

5. **Live Testing** ✅
   - Test emails in real-time
   - See extracted entities
   - View classification results
   - Performance metrics

6. **Export & Share** ✅
   - JSON export
   - Copy to clipboard
   - Download file
   - Database save (with TODO for persistence)

---

## 🚀 Next Evolution: Email Organizer + AI Response System

### User Requirements (From Latest Messages)

**Message 1**: "email organiser with files and folders and indicators with notification of how many new , a email notifier alert emaik with groupings conscise mail"

**Message 2**: "after sorting , parsing and filing , ai can also draft a response ( stykes short cincise , acknowldge , query reply , etc etc using vector db and ) that shalk be sonehow tagged to email , we cann use ai proxy"

### Evolution Phases

```
Phase 1: Email Parser (✅ COMPLETE)
    └─> Parse emails, extract entities

Phase 2: Visual Plugin Designer (✅ COMPLETE)
    └─> No-code plugin creation

Phase 3: Email Organizer (⏳ NEXT - 5 days)
    ├─> Folder structure (Inbox, Sent, Drafts, Archive, Custom)
    ├─> Email indicators (unread count, priority badges)
    ├─> Email notifier (desktop, mobile, browser)
    ├─> Email groupings (by vessel, by port, by category)
    └─> Concise mail summaries (AI-powered)

Phase 4: AI Response System (⏳ PENDING - 3 days)
    ├─> Response drafting engine
    ├─> Response styles (short, concise, acknowledge, query, etc.)
    ├─> Vector DB integration for context
    ├─> AI Proxy integration
    └─> Response tagging to original emails
```

---

## 📋 Phase 3: Email Organizer (DETAILED PLAN)

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     EMAIL ORGANIZER UI                          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────────────────────────────┐   │
│  │   SIDEBAR    │  │        EMAIL LIST VIEW               │   │
│  │              │  │  ┌────────────────────────────────┐  │   │
│  │ 📁 Inbox (5) │  │  │ [★] M/V ATLANTIC - Urgent      │  │   │
│  │ 📁 Sent      │  │  │ Fixture offer expires EOD...   │  │   │
│  │ 📁 Drafts (2)│  │  └────────────────────────────────┘  │   │
│  │ 📁 Archive   │  │  ┌────────────────────────────────┐  │   │
│  │ 📁 Spam      │  │  │ Port Agent - Singapore Arrival │  │   │
│  │              │  │  │ Vessel arriving tomorrow...    │  │   │
│  │ Groupings:   │  │  └────────────────────────────────┘  │   │
│  │ 🚢 By Vessel │  └──────────────────────────────────────┘   │
│  │ 🏢 By Port   │                                              │
│  │ 📑 By Type   │  ┌──────────────────────────────────────┐   │
│  │              │  │        EMAIL DETAIL VIEW             │   │
│  │ Custom:      │  │  Subject: M/V ATLANTIC - Urgent      │   │
│  │ + New Folder │  │  From: broker@example.com            │   │
│  └──────────────┘  │  To: you@example.com                 │   │
│                    │                                      │   │
│                    │  [AI Summary] Urgent fixture offer   │   │
│                    │  for M/V ATLANTIC from Singapore to  │   │
│                    │  Rotterdam. Expires today 18:00 GMT. │   │
│                    │  Rate: USD 18.50/mt                  │   │
│                    │                                      │   │
│                    │  [Full Email Body...]                │   │
│                    │                                      │   │
│                    │  ┌────────────────────────────────┐  │   │
│                    │  │ 🤖 AI Draft Response (Short)   │  │   │
│                    │  │ "Thank you for the offer. We   │  │   │
│                    │  │ are reviewing and will revert  │  │   │
│                    │  │ within 2 hours."               │  │   │
│                    │  └────────────────────────────────┘  │   │
│                    └──────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Components to Build

#### 1. Database Schema Extensions

```sql
-- Email storage
CREATE TABLE "Email" (
  id TEXT PRIMARY KEY,
  organizationId TEXT REFERENCES "Organization"(id),
  userId TEXT REFERENCES "User"(id),

  -- Email metadata
  messageId TEXT UNIQUE, -- external email ID
  threadId TEXT, -- for grouping conversations
  subject TEXT NOT NULL,
  from TEXT NOT NULL,
  to TEXT[],
  cc TEXT[],
  bcc TEXT[],

  -- Email content
  bodyHtml TEXT,
  bodyText TEXT,
  attachments JSONB, -- [{name, url, size, type}]

  -- Parsing results
  parsedEntities JSONB, -- extracted entities
  category TEXT, -- classified category
  urgency TEXT, -- urgency level
  bucket TEXT, -- assigned bucket

  -- Organization
  folderId TEXT REFERENCES "EmailFolder"(id),
  tags TEXT[], -- user-defined tags

  -- Status
  isRead BOOLEAN DEFAULT false,
  isStarred BOOLEAN DEFAULT false,
  isArchived BOOLEAN DEFAULT false,
  isDraft BOOLEAN DEFAULT false,
  isSpam BOOLEAN DEFAULT false,

  -- AI features
  aiSummary TEXT, -- concise AI-generated summary
  aiDraftResponseId TEXT, -- linked draft response

  -- Timestamps
  receivedAt TIMESTAMP NOT NULL,
  readAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_email_org ON "Email"(organizationId);
CREATE INDEX idx_email_folder ON "Email"(folderId);
CREATE INDEX idx_email_thread ON "Email"(threadId);
CREATE INDEX idx_email_received ON "Email"(receivedAt DESC);
CREATE INDEX idx_email_unread ON "Email"(organizationId, isRead) WHERE isRead = false;

-- Email folders
CREATE TABLE "EmailFolder" (
  id TEXT PRIMARY KEY,
  organizationId TEXT REFERENCES "Organization"(id),
  name TEXT NOT NULL,
  displayName TEXT NOT NULL,
  icon TEXT, -- emoji or icon name
  color TEXT, -- hex color
  type TEXT NOT NULL, -- system (inbox, sent, drafts) or custom
  parentId TEXT REFERENCES "EmailFolder"(id), -- for nested folders
  sortOrder INTEGER DEFAULT 0,

  -- Counts (denormalized for performance)
  totalCount INTEGER DEFAULT 0,
  unreadCount INTEGER DEFAULT 0,

  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),

  UNIQUE(organizationId, name)
);

-- Email groupings (dynamic views)
CREATE TABLE "EmailGrouping" (
  id TEXT PRIMARY KEY,
  organizationId TEXT REFERENCES "Organization"(id),
  name TEXT NOT NULL,
  displayName TEXT NOT NULL,
  groupBy TEXT NOT NULL, -- vessel, port, category, sender, date
  icon TEXT,
  color TEXT,
  filters JSONB, -- additional filters
  sortOrder INTEGER DEFAULT 0,

  createdAt TIMESTAMP DEFAULT NOW(),
  UNIQUE(organizationId, name)
);

-- Email notifications
CREATE TABLE "EmailNotification" (
  id TEXT PRIMARY KEY,
  organizationId TEXT REFERENCES "Organization"(id),
  userId TEXT REFERENCES "User"(id),
  emailId TEXT REFERENCES "Email"(id),

  type TEXT NOT NULL, -- new_email, urgent, mention, reply
  title TEXT NOT NULL,
  message TEXT,

  -- Channels
  sentToDesktop BOOLEAN DEFAULT false,
  sentToMobile BOOLEAN DEFAULT false,
  sentToBrowser BOOLEAN DEFAULT false,
  sentToEmail BOOLEAN DEFAULT false,

  -- Status
  isRead BOOLEAN DEFAULT false,
  readAt TIMESTAMP,

  createdAt TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notification_user_unread ON "EmailNotification"(userId, isRead) WHERE isRead = false;
```

#### 2. Backend Services

**File**: `backend/src/services/email-organizer.service.ts` (800 lines)

```typescript
export class EmailOrganizerService {
  // Folder management
  async createFolder(orgId: string, data: {...}): Promise<EmailFolder>;
  async getFolders(orgId: string): Promise<EmailFolder[]>;
  async updateFolder(folderId: string, data: {...}): Promise<EmailFolder>;
  async deleteFolder(folderId: string): Promise<void>;
  async moveToFolder(emailId: string, folderId: string): Promise<void>;

  // Email management
  async getEmails(orgId: string, filters: {...}): Promise<Email[]>;
  async getEmail(emailId: string): Promise<Email>;
  async markAsRead(emailIds: string[]): Promise<void>;
  async markAsUnread(emailIds: string[]): Promise<void>;
  async starEmail(emailId: string): Promise<void>;
  async archiveEmail(emailId: string): Promise<void>;
  async deleteEmail(emailId: string): Promise<void>;

  // Groupings
  async createGrouping(orgId: string, data: {...}): Promise<EmailGrouping>;
  async getGroupedEmails(groupingId: string): Promise<Record<string, Email[]>>;

  // Indicators & counts
  async getUnreadCounts(orgId: string): Promise<Record<string, number>>;
  async getTotalCounts(orgId: string): Promise<Record<string, number>>;

  // AI summaries
  async generateSummary(emailId: string): Promise<string>;
  async generateAllSummaries(orgId: string): Promise<void>;
}
```

**File**: `backend/src/services/email-notifier.service.ts` (600 lines)

```typescript
export class EmailNotifierService {
  // Notification creation
  async notifyNewEmail(email: Email): Promise<void>;
  async notifyUrgentEmail(email: Email): Promise<void>;
  async notifyMention(email: Email, mentionedUserId: string): Promise<void>;
  async notifyReply(email: Email, originalEmailId: string): Promise<void>;

  // Multi-channel dispatch
  async sendDesktopNotification(userId: string, notification: {...}): Promise<void>;
  async sendMobileNotification(userId: string, notification: {...}): Promise<void>;
  async sendBrowserNotification(userId: string, notification: {...}): Promise<void>;
  async sendEmailNotification(userId: string, notification: {...}): Promise<void>;

  // User preferences
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences>;
  async updateNotificationPreferences(userId: string, prefs: {...}): Promise<void>;
}
```

#### 3. GraphQL API

**File**: `backend/src/schema/types/email-organizer.ts` (800 lines)

```graphql
# Queries
type Query {
  # Folders
  emailFolders: [EmailFolder!]!
  emailFolder(id: ID!): EmailFolder

  # Emails
  emails(folderId: ID, filters: EmailFilters): EmailConnection!
  email(id: ID!): Email

  # Groupings
  emailGroupings: [EmailGrouping!]!
  groupedEmails(groupingId: ID!): [EmailGroup!]!

  # Indicators
  emailCounts: EmailCounts!
  unreadEmails: [Email!]!
}

# Mutations
type Mutation {
  # Folders
  createFolder(input: CreateFolderInput!): EmailFolder!
  updateFolder(id: ID!, input: UpdateFolderInput!): EmailFolder!
  deleteFolder(id: ID!): Boolean!

  # Emails
  moveToFolder(emailIds: [ID!]!, folderId: ID!): Boolean!
  markAsRead(emailIds: [ID!]!): Boolean!
  markAsUnread(emailIds: [ID!]!): Boolean!
  starEmail(emailId: ID!): Boolean!
  archiveEmail(emailId: ID!): Boolean!
  deleteEmail(emailId: ID!): Boolean!
  addTag(emailId: ID!, tag: String!): Boolean!
  removeTag(emailId: ID!, tag: String!): Boolean!

  # Groupings
  createGrouping(input: CreateGroupingInput!): EmailGrouping!
  deleteGrouping(id: ID!): Boolean!

  # AI features
  generateSummary(emailId: ID!): String!
}

# Subscriptions
type Subscription {
  newEmail: Email!
  emailUpdated(id: ID!): Email!
  unreadCountChanged: EmailCounts!
}

# Types
type Email {
  id: ID!
  subject: String!
  from: String!
  to: [String!]!
  bodyHtml: String
  bodyText: String
  attachments: [Attachment!]!

  # Parsing results
  parsedEntities: JSON
  category: String
  urgency: String
  bucket: String

  # Organization
  folder: EmailFolder
  tags: [String!]!

  # Status
  isRead: Boolean!
  isStarred: Boolean!
  isArchived: Boolean!

  # AI
  aiSummary: String
  aiDraftResponse: DraftResponse

  receivedAt: DateTime!
  readAt: DateTime
}

type EmailFolder {
  id: ID!
  name: String!
  displayName: String!
  icon: String
  color: String
  type: String!
  parent: EmailFolder
  children: [EmailFolder!]!

  totalCount: Int!
  unreadCount: Int!
}

type EmailGrouping {
  id: ID!
  name: String!
  displayName: String!
  groupBy: String!
  icon: String
  color: String
}

type EmailGroup {
  key: String!
  displayName: String!
  emails: [Email!]!
  count: Int!
}

type EmailCounts {
  inbox: Int!
  sent: Int!
  drafts: Int!
  archived: Int!
  spam: Int!
  unread: Int!
  starred: Int!
}
```

#### 4. Frontend Components

**File**: `frontend/src/pages/EmailOrganizer.tsx` (1,000+ lines)
- Main email organizer page
- Sidebar with folders and groupings
- Email list view with indicators
- Email detail view with AI summary
- Notification center

**File**: `frontend/src/components/email/EmailSidebar.tsx` (400 lines)
- Folder tree with counts
- Grouping sections
- Create folder/grouping buttons

**File**: `frontend/src/components/email/EmailList.tsx` (600 lines)
- Email list with virtual scrolling
- Unread indicators
- Priority badges
- Bulk actions (mark read, move, delete)
- Search and filters

**File**: `frontend/src/components/email/EmailDetail.tsx` (500 lines)
- Email header (subject, from, to, date)
- AI summary card
- Full email body
- Attachments
- Actions (reply, forward, archive, delete)

**File**: `frontend/src/components/email/EmailNotifier.tsx` (300 lines)
- Desktop notification support
- Browser notification support
- Toast notifications
- Notification preferences

---

## 📋 Phase 4: AI Response System (DETAILED PLAN)

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  AI RESPONSE DRAFTING SYSTEM                    │
│                                                                 │
│  Email Input → Vector DB Context → AI Proxy → Draft Response   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  VECTOR DB (PageIndex)                                   │  │
│  │  • Previous emails from sender                           │  │
│  │  • Company email templates                               │  │
│  │  • Vessel/port specific context                          │  │
│  │  • User writing style examples                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  AI PROXY (OpenAI / Anthropic)                           │  │
│  │  • Claude Sonnet 4.5 for complex responses               │  │
│  │  • Claude Haiku for short acks                           │  │
│  │  • Temperature adjusted per style                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  RESPONSE STYLES                                         │  │
│  │  • Short (1-2 sentences)                                 │  │
│  │  • Concise (3-4 sentences)                               │  │
│  │  • Acknowledge (confirm receipt)                         │  │
│  │  • Query (ask clarifying questions)                      │  │
│  │  • Detailed (full response with context)                │  │
│  │  • Formal / Informal tone options                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Components to Build

#### 1. Database Schema Extensions

```sql
-- Draft responses
CREATE TABLE "DraftResponse" (
  id TEXT PRIMARY KEY,
  emailId TEXT REFERENCES "Email"(id) UNIQUE, -- one draft per email
  organizationId TEXT REFERENCES "Organization"(id),
  userId TEXT REFERENCES "User"(id),

  -- Response content
  subject TEXT, -- Re: [original subject]
  body TEXT NOT NULL,
  style TEXT NOT NULL, -- short, concise, acknowledge, query, detailed
  tone TEXT NOT NULL, -- formal, neutral, informal

  -- AI metadata
  model TEXT, -- claude-sonnet-4-5, claude-haiku-4-5
  temperature FLOAT,
  contextUsed JSONB, -- vector DB results used
  confidence FLOAT, -- 0-1

  -- Status
  isApproved BOOLEAN DEFAULT false,
  isSent BOOLEAN DEFAULT false,
  sentAt TIMESTAMP,

  -- Editing
  editHistory JSONB, -- [{timestamp, before, after}]

  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_draft_email ON "DraftResponse"(emailId);
CREATE INDEX idx_draft_user ON "DraftResponse"(userId);

-- Response templates (learned from user)
CREATE TABLE "ResponseTemplate" (
  id TEXT PRIMARY KEY,
  organizationId TEXT REFERENCES "Organization"(id),
  userId TEXT REFERENCES "User"(id),

  name TEXT NOT NULL,
  style TEXT NOT NULL,
  tone TEXT NOT NULL,
  template TEXT NOT NULL, -- template with {{placeholders}}

  usageCount INTEGER DEFAULT 0,
  lastUsedAt TIMESTAMP,

  createdAt TIMESTAMP DEFAULT NOW(),
  UNIQUE(organizationId, userId, name)
);

-- AI response settings
CREATE TABLE "AIResponseSettings" (
  id TEXT PRIMARY KEY,
  organizationId TEXT REFERENCES "Organization"(id),
  userId TEXT REFERENCES "User"(id) UNIQUE,

  -- Preferences
  defaultStyle TEXT DEFAULT 'concise',
  defaultTone TEXT DEFAULT 'neutral',
  autoDraft BOOLEAN DEFAULT true, -- auto-generate draft on email open
  requireApproval BOOLEAN DEFAULT true, -- require user approval before send

  -- Model settings
  preferredModel TEXT DEFAULT 'claude-sonnet-4-5',
  temperature FLOAT DEFAULT 0.7,

  -- Vector DB settings
  useEmailHistory BOOLEAN DEFAULT true,
  useTemplates BOOLEAN DEFAULT true,
  useCompanyKnowledge BOOLEAN DEFAULT true,

  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

#### 2. Backend Services

**File**: `backend/src/services/ai-response-drafter.service.ts` (1,000 lines)

```typescript
import { HybridSearchService } from './hybrid-search.service.js';
import { AIProxyService } from './ai-proxy.service.js';

export class AIResponseDrafterService {
  constructor(
    private hybridSearch: HybridSearchService,
    private aiProxy: AIProxyService
  ) {}

  // Main draft generation
  async draftResponse(
    emailId: string,
    style: ResponseStyle,
    tone: ResponseTone,
    options?: DraftOptions
  ): Promise<DraftResponse> {
    // 1. Load email
    const email = await this.loadEmail(emailId);

    // 2. Gather context from Vector DB
    const context = await this.gatherContext(email);

    // 3. Build prompt based on style
    const prompt = this.buildPrompt(email, style, tone, context);

    // 4. Call AI Proxy
    const model = this.selectModel(style);
    const response = await this.aiProxy.chat(model, prompt, {
      temperature: this.getTemperature(style),
      maxTokens: this.getMaxTokens(style),
    });

    // 5. Save draft
    const draft = await this.saveDraft({
      emailId: email.id,
      body: response.content,
      style,
      tone,
      model,
      contextUsed: context,
      confidence: response.confidence,
    });

    return draft;
  }

  // Context gathering from Vector DB
  async gatherContext(email: Email): Promise<Context> {
    const context: Context = {
      previousEmails: [],
      templates: [],
      companyKnowledge: [],
    };

    // 1. Find previous emails from same sender
    context.previousEmails = await this.hybridSearch.search({
      query: `emails from ${email.from}`,
      index: 'emails',
      limit: 5,
    });

    // 2. Find relevant templates
    context.templates = await this.hybridSearch.search({
      query: email.subject + ' ' + email.bodyText,
      index: 'templates',
      limit: 3,
    });

    // 3. Find company knowledge
    context.companyKnowledge = await this.hybridSearch.search({
      query: email.bodyText,
      index: 'knowledge-base',
      limit: 5,
    });

    return context;
  }

  // Prompt building based on style
  buildPrompt(email: Email, style: ResponseStyle, tone: ResponseTone, context: Context): string {
    const basePrompt = `You are drafting a response to the following email:

Subject: ${email.subject}
From: ${email.from}
Body:
${email.bodyText}

---

CONTEXT FROM PREVIOUS INTERACTIONS:
${this.formatContext(context)}

---

Please draft a ${style} response with ${tone} tone.`;

    const styleInstructions = {
      short: 'Response should be 1-2 sentences max. Be direct and to the point.',
      concise: 'Response should be 3-4 sentences. Include key information only.',
      acknowledge: 'Simply acknowledge receipt and confirm next steps if any.',
      query: 'Ask clarifying questions about unclear points. List questions clearly.',
      detailed: 'Provide a comprehensive response addressing all points raised.',
    };

    const toneInstructions = {
      formal: 'Use formal business language. Address as "Dear [Name]" and end with "Best regards".',
      neutral: 'Use professional but approachable language.',
      informal: 'Use casual, friendly language while remaining professional.',
    };

    return `${basePrompt}

${styleInstructions[style]}
${toneInstructions[tone]}

Draft the response now:`;
  }

  // Model selection based on style
  selectModel(style: ResponseStyle): string {
    switch (style) {
      case 'short':
      case 'acknowledge':
        return 'claude-haiku-4-5'; // Fast, cheap for simple responses
      case 'concise':
      case 'query':
      case 'detailed':
        return 'claude-sonnet-4-5'; // Better quality for complex responses
      default:
        return 'claude-sonnet-4-5';
    }
  }

  // Temperature based on style
  getTemperature(style: ResponseStyle): number {
    switch (style) {
      case 'short':
      case 'acknowledge':
        return 0.3; // More deterministic
      case 'concise':
      case 'query':
        return 0.5; // Balanced
      case 'detailed':
        return 0.7; // More creative
      default:
        return 0.5;
    }
  }

  // Max tokens based on style
  getMaxTokens(style: ResponseStyle): number {
    switch (style) {
      case 'short':
        return 100;
      case 'acknowledge':
        return 150;
      case 'concise':
        return 300;
      case 'query':
        return 400;
      case 'detailed':
        return 1000;
      default:
        return 500;
    }
  }

  // Update draft (user editing)
  async updateDraft(draftId: string, body: string): Promise<DraftResponse>;

  // Approve and send
  async approveDraft(draftId: string): Promise<void>;

  // Learn from user edits
  async learnFromEdits(draftId: string): Promise<void>;
}
```

**File**: `backend/src/services/ai-proxy.service.ts` (400 lines)

```typescript
export class AIProxyService {
  async chat(
    model: string,
    prompt: string,
    options: ChatOptions
  ): Promise<ChatResponse> {
    // Route to appropriate provider
    if (model.startsWith('claude')) {
      return this.chatClaude(model, prompt, options);
    } else if (model.startsWith('gpt')) {
      return this.chatOpenAI(model, prompt, options);
    }
    throw new Error(`Unsupported model: ${model}`);
  }

  private async chatClaude(model: string, prompt: string, options: ChatOptions): Promise<ChatResponse>;
  private async chatOpenAI(model: string, prompt: string, options: ChatOptions): Promise<ChatResponse>;
}
```

#### 3. GraphQL API

**File**: `backend/src/schema/types/ai-response.ts` (600 lines)

```graphql
# Queries
type Query {
  draftResponse(emailId: ID!): DraftResponse
  draftResponses(filters: DraftResponseFilters): [DraftResponse!]!
  responseTemplates: [ResponseTemplate!]!
  aiResponseSettings: AIResponseSettings!
}

# Mutations
type Mutation {
  # Draft generation
  generateDraft(
    emailId: ID!
    style: ResponseStyle!
    tone: ResponseTone!
  ): DraftResponse!

  # Draft editing
  updateDraft(id: ID!, body: String!): DraftResponse!
  approveDraft(id: ID!): Boolean!
  rejectDraft(id: ID!): Boolean!
  regenerateDraft(id: ID!, style: ResponseStyle!, tone: ResponseTone!): DraftResponse!

  # Templates
  saveAsTemplate(draftId: ID!, name: String!): ResponseTemplate!
  deleteTemplate(id: ID!): Boolean!

  # Settings
  updateAIResponseSettings(input: AIResponseSettingsInput!): AIResponseSettings!
}

# Types
enum ResponseStyle {
  SHORT
  CONCISE
  ACKNOWLEDGE
  QUERY
  DETAILED
}

enum ResponseTone {
  FORMAL
  NEUTRAL
  INFORMAL
}

type DraftResponse {
  id: ID!
  email: Email!
  subject: String
  body: String!
  style: ResponseStyle!
  tone: ResponseTone!

  # AI metadata
  model: String!
  temperature: Float!
  contextUsed: JSON!
  confidence: Float!

  # Status
  isApproved: Boolean!
  isSent: Boolean!
  sentAt: DateTime

  # Editing
  editHistory: [Edit!]!

  createdAt: DateTime!
  updatedAt: DateTime!
}

type ResponseTemplate {
  id: ID!
  name: String!
  style: ResponseStyle!
  tone: ResponseTone!
  template: String!
  usageCount: Int!
  lastUsedAt: DateTime
}

type AIResponseSettings {
  id: ID!
  defaultStyle: ResponseStyle!
  defaultTone: ResponseTone!
  autoDraft: Boolean!
  requireApproval: Boolean!
  preferredModel: String!
  temperature: Float!
  useEmailHistory: Boolean!
  useTemplates: Boolean!
  useCompanyKnowledge: Boolean!
}
```

#### 4. Frontend Components

**File**: `frontend/src/components/email/DraftResponsePanel.tsx` (800 lines)
- Style selector (buttons for short, concise, acknowledge, query, detailed)
- Tone selector (formal, neutral, informal)
- Draft display with edit button
- Regenerate button
- Approve/Send button
- Save as template button
- Confidence indicator

**File**: `frontend/src/components/email/ResponseStyleSelector.tsx` (200 lines)
- Visual style picker with examples
- Tone toggle
- Settings button (opens preferences)

**File**: `frontend/src/pages/AIResponseSettings.tsx` (400 lines)
- Default style and tone
- Auto-draft toggle
- Require approval toggle
- Model selection
- Temperature slider
- Context source toggles

---

## 📊 Implementation Timeline

### Phase 3: Email Organizer (5 days)

**Day 1: Database & Backend Services**
- Create database schema (3 hours)
- Implement EmailOrganizerService (5 hours)

**Day 2: Backend Services cont. + GraphQL API**
- Implement EmailNotifierService (4 hours)
- Create GraphQL API (4 hours)

**Day 3: Frontend - Email List**
- EmailSidebar component (4 hours)
- EmailList component (4 hours)

**Day 4: Frontend - Email Detail & Notifier**
- EmailDetail component (4 hours)
- EmailNotifier component (4 hours)

**Day 5: Integration & Testing**
- Connect all components (4 hours)
- Test folder management (2 hours)
- Test notifications (2 hours)

### Phase 4: AI Response System (3 days)

**Day 6: AI Services**
- Create database schema (2 hours)
- Implement AIResponseDrafterService (6 hours)

**Day 7: GraphQL API & Frontend**
- Create GraphQL API (4 hours)
- DraftResponsePanel component (4 hours)

**Day 8: Settings & Testing**
- AIResponseSettings page (4 hours)
- Integration testing (4 hours)

**Total: 8 days for both phases**

---

## 🎯 Success Criteria

### Phase 3: Email Organizer
- ✅ Users can create custom folders
- ✅ Emails automatically sorted into folders based on parsing
- ✅ Unread count indicators on folders
- ✅ Email groupings by vessel, port, category
- ✅ AI-generated concise summaries for all emails
- ✅ Desktop/browser/mobile notifications working
- ✅ Real-time updates via subscriptions

### Phase 4: AI Response System
- ✅ Draft responses generated in <3 seconds
- ✅ 5 response styles available (short, concise, acknowledge, query, detailed)
- ✅ 3 tone options (formal, neutral, informal)
- ✅ Vector DB context incorporated (previous emails, templates, knowledge base)
- ✅ Users can edit drafts before sending
- ✅ Response quality rated >80% by users
- ✅ Drafts tagged to original emails

---

## 💡 Key Technical Decisions

1. **Vector DB Integration**: Use existing PageIndex + HybridSearchService
2. **AI Model Selection**:
   - Claude Haiku for simple responses (fast, cheap)
   - Claude Sonnet for complex responses (quality)
3. **Real-time Updates**: GraphQL subscriptions for email counts
4. **Notification System**: Multi-channel (desktop, browser, mobile, email)
5. **Draft Storage**: Database storage for editing history and learning

---

## 🚀 Future Enhancements (Phase 5+)

1. **Smart Threading**: Automatic email conversation threading
2. **Email Scheduling**: Send email at specific time
3. **Follow-up Reminders**: Auto-remind if no response after X days
4. **Bulk Operations**: Apply actions to multiple emails
5. **Advanced Search**: Full-text search with filters
6. **Email Templates**: Pre-defined templates for common scenarios
7. **Signature Management**: Multiple signatures for different contexts
8. **Email Rules**: Auto-rules like Gmail filters
9. **Snooze**: Temporarily hide emails until specific time
10. **Collaborative Inbox**: Team shared inboxes

---

**Created**: February 4, 2026
**Phase 2 Complete**: 2,300 lines of code
**Next**: Phase 3 (Email Organizer) + Phase 4 (AI Response) = 8 days

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
