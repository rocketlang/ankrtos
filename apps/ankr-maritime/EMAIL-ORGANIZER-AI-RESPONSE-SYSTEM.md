# Email Organizer + AI Response System
## Complete Email Intelligence Evolution

**Date**: February 4, 2026
**Status**: Planning Phase
**Scope**: Email Organizer + AI Response Drafting

---

## 🎯 Vision

Transform the email intelligence system from **parsing → organizing → responding** into a complete email management platform with AI-powered assistance.

```
Current State:
  Email → Parser → Entities/Category/Bucket → Done

New Vision:
  Email → Parser → Organizer (Folders/Groups/Indicators) → AI Response Drafter → Send
```

---

## 📋 Requirements (From User)

### 1. Email Organizer
> "evolve to email organiser with files and folders and indicators with notification of how many new, a email notifier alert email with groupings concise mail"

**Interpreted Requirements**:
- ✅ Folders and filing system (like Gmail/Outlook)
- ✅ Indicators showing new/unread count
- ✅ Email notifications/alerts
- ✅ Groupings (thread conversations)
- ✅ Concise mail summaries (AI-generated)

### 2. AI Response Drafting
> "after sorting, parsing and filing, ai can also draft a response (styles: short concise, acknowledge, query reply, etc etc using vector db and) that shall be somehow tagged to email, we can use ai proxy"

**Interpreted Requirements**:
- ✅ AI-powered response drafting
- ✅ Multiple styles: short, concise, acknowledge, query reply, formal, casual
- ✅ Use vector DB for context (PageIndex/RAG)
- ✅ Tag responses to original emails
- ✅ Use AI proxy for generation
- ✅ Context-aware responses using company knowledge base

---

## 🏗️ Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        EMAIL INTELLIGENCE                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: PARSING (✅ Complete)                                 │
│  - Extract entities (vessel, port, date, amount, etc.)         │
│  - Classify category (fixture, operations, claims, etc.)       │
│  - Determine urgency (critical, high, medium, low)             │
│  - Calculate actionability (requires_response, etc.)           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 2: ORGANIZING (NEW)                                      │
│  - File into folders (Inbox, Sent, Urgent, Fixtures, etc.)    │
│  - Group conversations (threading)                              │
│  - Track indicators (unread count, new emails)                 │
│  - Generate concise summaries (AI)                             │
│  - Send notifications (email, SMS, Slack, push)                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 3: AI RESPONSE DRAFTING (NEW)                            │
│  - Analyze email intent and context                            │
│  - Retrieve relevant docs from vector DB (PageIndex)           │
│  - Draft response in selected style                            │
│  - Tag draft to original email                                 │
│  - Allow user review/edit before sending                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 4: SENDING & TRACKING (NEW)                              │
│  - Send via SMTP/API                                           │
│  - Track email status (sent, delivered, read, replied)         │
│  - Update conversation thread                                  │
│  - Learn from user edits (feedback loop)                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Component 1: Email Organizer

### 1.1 Folder System

**Concept**: Gmail/Outlook-style folder hierarchy

**Default Folders**:
```typescript
interface Folder {
  id: string;
  name: string;
  type: 'system' | 'custom' | 'bucket';
  parentId?: string;
  icon: string;
  color: string;
  rules?: FolderRule[];
  unreadCount: number;
  totalCount: number;
}

// System folders (cannot be deleted)
const SYSTEM_FOLDERS = [
  { id: 'inbox', name: 'Inbox', icon: 'Inbox', color: 'blue' },
  { id: 'sent', name: 'Sent', icon: 'Send', color: 'green' },
  { id: 'starred', name: 'Starred', icon: 'Star', color: 'yellow' },
  { id: 'drafts', name: 'Drafts', icon: 'FileEdit', color: 'gray' },
  { id: 'archived', name: 'Archived', icon: 'Archive', color: 'gray' },
  { id: 'trash', name: 'Trash', icon: 'Trash', color: 'red' },
];

// Auto-created from buckets (from plugin designer)
const BUCKET_FOLDERS = [
  { id: 'urgent_fixtures', name: 'Urgent Fixtures', icon: 'AlertCircle', color: 'red' },
  { id: 'operations', name: 'Operations', icon: 'Ship', color: 'blue' },
  { id: 'claims', name: 'Claims', icon: 'FileWarning', color: 'orange' },
  // ... from plugin.buckets
];

// User custom folders
const CUSTOM_FOLDERS = [
  { id: 'follow_up', name: 'Follow Up', icon: 'Clock', color: 'purple' },
  { id: 'vip_clients', name: 'VIP Clients', icon: 'Star', color: 'gold' },
  // ... user-created
];
```

**Features**:
- Drag-drop emails to folders
- Multi-select and bulk move
- Smart folders (auto-organize by rules)
- Nested folders (unlimited depth)
- Folder search
- Right-click context menu

### 1.2 Email Threading/Grouping

**Concept**: Gmail-style conversation threading

```typescript
interface EmailThread {
  id: string;
  subject: string;
  participants: string[];
  messageCount: number;
  unreadCount: number;
  latestMessage: Email;
  firstMessage: Email;
  labels: string[];
  isStarred: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Threading algorithm
function threadEmails(email: Email): string {
  // 1. Match by In-Reply-To / References headers (RFC 5322)
  // 2. Match by subject (strip Re:, Fwd:, etc.)
  // 3. Match by participants + time window (24h)
  // 4. Match by quoted content similarity
  return threadId;
}
```

**Features**:
- Auto-thread by subject + participants
- Expand/collapse threads
- Thread preview (latest 3 messages)
- Thread labels and stars
- Thread-level actions (archive, delete all, mark all read)

### 1.3 Indicators & Notifications

**Concept**: Real-time counters and alerts

```typescript
interface EmailIndicators {
  unread: {
    total: number;
    byFolder: Record<string, number>;
    byUrgency: Record<UrgencyLevel, number>;
  };
  starred: number;
  requiresResponse: number;
  requiresApproval: number;
  overdue: number; // emails past deadline
}

interface EmailNotification {
  id: string;
  type: 'new_email' | 'urgent_email' | 'deadline_approaching' | 'response_required';
  emailId: string;
  title: string;
  body: string;
  channels: ('email' | 'sms' | 'slack' | 'push')[];
  sentAt: Date;
  readAt?: Date;
}
```

**Notification Triggers**:
- ✅ New email in Inbox
- ✅ Urgent email (critical/high urgency)
- ✅ Requires response (actionable type)
- ✅ Deadline approaching (within 2 hours)
- ✅ Email from VIP contact
- ✅ Mentioned in email (@name)
- ✅ Custom rules (user-defined)

**Notification Display**:
- Badge on folder (unread count)
- Toast notification (real-time)
- Browser notification (desktop)
- Email digest (daily summary)
- SMS for critical emails
- Slack/Teams integration

### 1.4 Concise Email Summaries

**Concept**: AI-generated one-line summaries

```typescript
interface EmailSummary {
  emailId: string;
  summary: string; // "Urgent fixture offer for M/V ATLANTIC STAR - Singapore to Rotterdam - USD 18.50/mt"
  keyPoints: string[]; // ["Vessel: M/V ATLANTIC STAR", "Rate: $18.50/mt", "Valid until: 18:00 GMT"]
  action: string; // "Requires urgent response - offer expires today"
  confidence: number;
  generatedAt: Date;
}

// AI Prompt for summary generation
const SUMMARY_PROMPT = `
Summarize this email in ONE concise sentence (max 100 chars):

Subject: {subject}
From: {from}
Body: {body}

Focus on: WHO, WHAT, WHY, DEADLINE
Be specific with numbers, names, dates.
Output format: "Action/Category - Key Detail - Urgency"
`;
```

**Features**:
- One-line summary visible in inbox
- Expand to see key points
- Action badge (requires response, FYI, approval needed)
- Color-coded by urgency
- Click to expand full email

---

## 🤖 Component 2: AI Response Drafting

### 2.1 Response Styles

```typescript
type ResponseStyle =
  | 'acknowledge'        // Brief acknowledgment
  | 'query_reply'        // Answer specific question
  | 'formal'             // Professional, detailed
  | 'concise'            // Short and to the point
  | 'friendly'           // Warm and casual
  | 'follow_up'          // Request additional info
  | 'rejection_polite'   // Decline gracefully
  | 'acceptance'         // Confirm/accept offer
  | 'auto_reply';        // Out of office style

interface ResponseDraft {
  id: string;
  emailId: string;
  style: ResponseStyle;
  subject: string;
  body: string;
  context: ResponseContext;
  confidence: number;
  suggestedEdits: string[];
  generatedAt: Date;
}

interface ResponseContext {
  originalEmail: Email;
  relatedEmails: Email[]; // Thread history
  relevantDocuments: Document[]; // From vector DB
  companyKnowledge: string[]; // From RAG
  userHistory: Email[]; // Previous emails with this contact
}
```

### 2.2 Style Templates

**Acknowledge**:
```
Subject: Re: {original_subject}

Dear {sender_name},

Thank you for your email regarding {key_topic}.

I acknowledge receipt and will {action} by {deadline}.

Best regards,
{user_name}
```

**Query Reply**:
```
Subject: Re: {original_subject}

Dear {sender_name},

Regarding your question about {question_topic}:

{answer_paragraph}

{additional_context}

Please let me know if you need further clarification.

Best regards,
{user_name}
```

**Formal**:
```
Subject: Re: {original_subject}

Dear {sender_name},

Thank you for reaching out regarding {topic}.

{paragraph_1}

{paragraph_2}

{paragraph_3}

We look forward to {next_steps}.

Yours sincerely,
{user_name}
{user_title}
```

**Concise**:
```
Subject: Re: {original_subject}

{sender_name},

{direct_answer}

{action_item}

Regards,
{user_name}
```

### 2.3 Context Retrieval (Vector DB + PageIndex)

```typescript
interface ResponseGenerator {
  async generateResponse(
    email: Email,
    style: ResponseStyle,
    userPreferences: UserPreferences
  ): Promise<ResponseDraft> {

    // Step 1: Analyze email intent
    const intent = await this.analyzeIntent(email);

    // Step 2: Retrieve context from vector DB
    const relevantDocs = await this.retrieveContext(email, intent);

    // Step 3: Get company knowledge (PageIndex)
    const knowledge = await this.getCompanyKnowledge(email.category);

    // Step 4: Get thread history
    const threadHistory = await this.getThreadHistory(email.threadId);

    // Step 5: Generate response using AI proxy
    const response = await this.aiProxy.generate({
      prompt: this.buildPrompt(email, intent, style),
      context: {
        relevantDocs,
        knowledge,
        threadHistory,
      },
      style,
      temperature: 0.7,
    });

    // Step 6: Validate and refine
    const validated = await this.validateResponse(response, email);

    return validated;
  }
}
```

### 2.4 AI Proxy Integration

```typescript
interface AIProxyConfig {
  endpoint: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

class AIResponseProxy {
  private config: AIProxyConfig;

  async generate(request: {
    prompt: string;
    context: any;
    style: ResponseStyle;
    temperature: number;
  }): Promise<string> {

    // Build system prompt
    const systemPrompt = this.buildSystemPrompt(request.style);

    // Build user prompt with context
    const userPrompt = this.buildUserPrompt(request.prompt, request.context);

    // Call AI proxy
    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: request.temperature,
        max_tokens: this.config.maxTokens,
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private buildSystemPrompt(style: ResponseStyle): string {
    const stylePrompts = {
      acknowledge: 'You are a professional assistant. Write brief, polite acknowledgment emails.',
      query_reply: 'You are a knowledgeable expert. Answer questions directly and accurately.',
      formal: 'You are a senior executive. Write formal, professional business correspondence.',
      concise: 'You are efficient and direct. Write short, to-the-point responses.',
      friendly: 'You are warm and approachable. Write friendly, conversational emails.',
      // ...
    };

    return stylePrompts[style] || stylePrompts.formal;
  }
}
```

### 2.5 Response Tagging

```typescript
interface ResponseTag {
  id: string;
  emailId: string;
  draftId: string;
  status: 'draft' | 'reviewed' | 'edited' | 'sent' | 'discarded';
  userEdits: ResponseEdit[];
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  repliedAt?: Date;
}

interface ResponseEdit {
  field: 'subject' | 'body' | 'style';
  originalValue: string;
  editedValue: string;
  editedAt: Date;
  reason?: string; // For ML feedback loop
}

// Tag draft to email
const tag = await tagResponseToEmail(emailId, draftId, {
  status: 'draft',
  createdBy: userId,
  aiGenerated: true,
  style: 'acknowledge',
});

// Track user edits for ML improvement
const edit = await trackEdit(tagId, {
  field: 'body',
  originalValue: 'Thank you for your email...',
  editedValue: 'Thank you for reaching out...',
  reason: 'More personal tone',
});
```

---

## 📦 Database Schema

### New Tables

```sql
-- Email folders
CREATE TABLE email_folders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('system', 'custom', 'bucket')),
  parent_id TEXT REFERENCES email_folders(id),
  icon TEXT,
  color TEXT,
  rules JSONB,
  position INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Email threading
CREATE TABLE email_threads (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  subject TEXT NOT NULL,
  participants TEXT[] NOT NULL,
  message_count INTEGER DEFAULT 0,
  unread_count INTEGER DEFAULT 0,
  first_message_id TEXT REFERENCES emails(id),
  latest_message_id TEXT REFERENCES emails(id),
  labels TEXT[],
  is_starred BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Emails (enhanced)
CREATE TABLE emails (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  thread_id TEXT REFERENCES email_threads(id),
  folder_id TEXT REFERENCES email_folders(id),

  -- Email metadata
  message_id TEXT UNIQUE,
  in_reply_to TEXT,
  references TEXT[],

  -- Content
  from_address TEXT NOT NULL,
  to_addresses TEXT[] NOT NULL,
  cc_addresses TEXT[],
  bcc_addresses TEXT[],
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  attachments JSONB,

  -- Intelligence (from parser)
  entities JSONB,
  category TEXT,
  urgency TEXT,
  urgency_score INTEGER,
  actionable TEXT,
  bucket_id TEXT,
  confidence FLOAT,

  -- Summary
  summary TEXT,
  key_points TEXT[],
  action TEXT,

  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Email summaries
CREATE TABLE email_summaries (
  id TEXT PRIMARY KEY,
  email_id TEXT NOT NULL REFERENCES emails(id),
  summary TEXT NOT NULL,
  key_points TEXT[],
  action TEXT,
  confidence FLOAT,
  generated_by TEXT DEFAULT 'ai',
  generated_at TIMESTAMP DEFAULT NOW()
);

-- Response drafts
CREATE TABLE response_drafts (
  id TEXT PRIMARY KEY,
  email_id TEXT NOT NULL REFERENCES emails(id),
  user_id TEXT NOT NULL REFERENCES users(id),

  style TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,

  -- Context used
  context_docs JSONB,
  context_knowledge JSONB,
  thread_history JSONB,

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'edited', 'sent', 'discarded')),
  confidence FLOAT,

  -- Tracking
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  replied_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Response edits (for ML feedback)
CREATE TABLE response_edits (
  id TEXT PRIMARY KEY,
  draft_id TEXT NOT NULL REFERENCES response_drafts(id),
  field TEXT NOT NULL,
  original_value TEXT NOT NULL,
  edited_value TEXT NOT NULL,
  reason TEXT,
  edited_at TIMESTAMP DEFAULT NOW()
);

-- Email notifications
CREATE TABLE email_notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  email_id TEXT REFERENCES emails(id),

  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  channels TEXT[] NOT NULL,

  sent_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_emails_user_folder ON emails(user_id, folder_id);
CREATE INDEX idx_emails_thread ON emails(thread_id);
CREATE INDEX idx_emails_category ON emails(category);
CREATE INDEX idx_emails_urgency ON emails(urgency);
CREATE INDEX idx_emails_bucket ON emails(bucket_id);
CREATE INDEX idx_emails_unread ON emails(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_threads_user ON email_threads(user_id);
CREATE INDEX idx_folders_user ON email_folders(user_id);
CREATE INDEX idx_drafts_email ON response_drafts(email_id);
```

---

## 🎨 Frontend UI Components

### Email Organizer Interface

```typescript
// Main inbox layout (Gmail-style)
<EmailOrganizer>
  <Sidebar>
    <ComposeButton />
    <FolderTree>
      <SystemFolders />
      <BucketFolders />
      <CustomFolders />
    </FolderTree>
    <Indicators>
      <UnreadBadge count={45} />
      <StarredBadge count={12} />
      <ResponseRequiredBadge count={8} />
    </Indicators>
  </Sidebar>

  <EmailList>
    <SearchBar />
    <FilterBar />
    <ThreadList>
      {threads.map(thread => (
        <ThreadRow
          key={thread.id}
          subject={thread.subject}
          summary={thread.latestMessage.summary}
          participants={thread.participants}
          unreadCount={thread.unreadCount}
          urgency={thread.latestMessage.urgency}
          labels={thread.labels}
          isStarred={thread.isStarred}
          timestamp={thread.updatedAt}
        />
      ))}
    </ThreadList>
  </EmailList>

  <EmailDetail>
    <EmailHeader />
    <EmailContent />
    <AIResponseDrafter />
  </EmailDetail>
</EmailOrganizer>
```

### AI Response Drafter Component

```typescript
<AIResponseDrafter email={currentEmail}>
  <StyleSelector>
    {styles.map(style => (
      <StyleButton
        key={style}
        selected={selectedStyle === style}
        onClick={() => setSelectedStyle(style)}
      >
        {style}
      </StyleButton>
    ))}
  </StyleSelector>

  <GenerateButton
    onClick={() => generateDraft(currentEmail, selectedStyle)}
    loading={generating}
  >
    Generate Response
  </GenerateButton>

  {draft && (
    <DraftPreview>
      <DraftSubject value={draft.subject} onChange={...} />
      <DraftBody value={draft.body} onChange={...} />
      <ContextUsed docs={draft.context.relevantDocs} />
      <ConfidenceScore score={draft.confidence} />
      <ActionButtons>
        <Button onClick={sendDraft}>Send</Button>
        <Button onClick={saveDraft}>Save Draft</Button>
        <Button onClick={regenerate}>Regenerate</Button>
        <Button onClick={discard}>Discard</Button>
      </ActionButtons>
    </DraftPreview>
  )}
</AIResponseDrafter>
```

---

## 📊 Implementation Phases

### Phase 4: Email Organizer (5-7 days)

**Day 1-2**: Database schema + backend API
- Create tables (folders, threads, summaries, notifications)
- GraphQL API for folder CRUD
- GraphQL API for threading
- GraphQL API for indicators

**Day 3-4**: Folder system + threading
- Frontend folder tree component
- Drag-drop email to folder
- Thread grouping algorithm
- Thread expand/collapse

**Day 5**: Indicators + notifications
- Real-time unread counts
- Badge components
- Notification system (email, SMS, Slack, push)
- Toast notifications

**Day 6-7**: AI summaries
- Summary generation service
- AI proxy integration for summaries
- Summary display in inbox
- Key points extraction

**Deliverables**:
- Complete folder management
- Email threading
- Real-time indicators
- Multi-channel notifications
- AI-generated summaries

### Phase 5: AI Response Drafting (5-7 days)

**Day 1-2**: Response generation service
- AI proxy integration
- Style templates
- Context retrieval (vector DB)
- PageIndex integration

**Day 3-4**: Response UI
- Style selector component
- Draft preview component
- Edit/review workflow
- Send/save/discard actions

**Day 5**: Response tagging + tracking
- Tag drafts to emails
- Track user edits
- Delivery tracking
- Read receipts

**Day 6-7**: ML feedback loop
- Collect edit patterns
- Improve prompts based on feedback
- A/B testing different styles
- Analytics dashboard

**Deliverables**:
- 9 response styles
- Context-aware drafting
- User review workflow
- ML feedback loop
- Analytics tracking

---

## 🚀 Tech Stack

### Backend
- **Parsing**: Existing BaseEmailParser (✅ done)
- **Vector DB**: PageIndex + HybridSearchService
- **AI**: AI Proxy (for summaries + responses)
- **Storage**: PostgreSQL (emails, drafts, edits)
- **Queue**: BullMQ (async summary generation)
- **Real-time**: GraphQL subscriptions

### Frontend
- **UI**: React + TailwindCSS
- **State**: Apollo Client (GraphQL)
- **Drag-drop**: react-beautiful-dnd
- **Rich text**: TipTap or ProseMirror
- **Notifications**: react-toastify + browser API

---

## 📈 Success Metrics

**Email Organizer**:
- ✅ 95%+ accurate auto-threading
- ✅ < 100ms indicator updates
- ✅ < 5s summary generation per email
- ✅ 90%+ summary accuracy
- ✅ Zero notification missed (critical emails)

**AI Response Drafting**:
- ✅ < 10s response generation time
- ✅ 80%+ user satisfaction with drafts
- ✅ 50%+ drafts sent with < 20% edits
- ✅ 30%+ time saved on email responses
- ✅ 90%+ context relevance (from vector DB)

---

## 🎯 Summary

**Total Scope**:
- Email Organizer: ~3,000 lines (backend + frontend)
- AI Response Drafting: ~2,500 lines (backend + frontend)
- **Total**: ~5,500 lines

**Timeline**:
- Phase 4: 5-7 days (Email Organizer)
- Phase 5: 5-7 days (AI Response Drafting)
- **Total**: 10-14 days

**Integration with Existing**:
- Uses existing BaseEmailParser (Phase 1)
- Uses existing Plugin Designer (Phase 2)
- Integrates with PageIndex (Phase 3 - TBD)
- Uses AI Proxy (existing)

**Value Proposition**:
- Complete email management platform
- Gmail/Outlook-level UX
- AI-powered intelligence at every step
- Industry-agnostic (works for any business)
- 30%+ time savings on email handling

---

## 🤔 Questions for User

1. **Timeline**: Should we implement this now, or finish Phase 3 (PageIndex integration) first?

2. **Priority**: Which is more important?
   - Option A: Email Organizer first (better UX)
   - Option B: AI Response Drafting first (more AI value)
   - Option C: Both in parallel (faster, needs 2 devs)

3. **Scope**: Any additional features for either component?

4. **Integration**: Should this be part of Mari8X or a separate `@ankr/email-intelligence` standalone product?

5. **SMTP**: Do we need full email sending (SMTP), or just draft generation? (Sending adds 2-3 days)

Ready for your direction! 🚀
