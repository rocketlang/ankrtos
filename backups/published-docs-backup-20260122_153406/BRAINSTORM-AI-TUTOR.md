# ANKR Interact as AI Tutor - Brainstorm

> **Vision:** Transform ANKR Interact from knowledge management into a full-fledged **AI Tutor Platform** for students - competing with Byju's, Unacademy, Khan Academy

---

## Current Assets

### Existing Packages
| Package | What It Does | How We Use It |
|---------|--------------|---------------|
| `@ankr/tutor` | Universal learning engine with quiz, progress, badges | Core tutoring logic |
| `@ankr/learning` | AI that learns from interactions, predicts patterns | Adaptive learning, personalization |
| `@ankr/voice-ai` | Voice input (100+ langs), TTS (500 voices) | Voice-first learning for regional languages |
| `@ankr/ai-translate` | 22 Indian language translation | Multilingual content delivery |
| `@ankr/i18n` | UI in 22 languages | Student-friendly in their language |
| `@ankr/ai-router` | 15 LLMs, cost-optimized routing | AI explanations, doubt solving |
| `@ankr/eon-rag` | Hybrid search, semantic retrieval | Find relevant study material |
| Swayam Bot | Voice-first AI assistant | "Explain this chapter in Hindi" |

### Current ANKR Interact Features
- ✅ Document viewing (Markdown, PDF)
- ✅ Knowledge graph (connect concepts)
- ✅ Search (semantic + keyword)
- ✅ Bookmarks & recent files
- ✅ Publishing (share notes)
- 🎯 Blocks editor (Notion-style) - Phase 3
- 🎯 Canvas mode (whiteboard) - Phase 7
- 🎯 Voice commands - Phase 9

---

## The Big Idea

### ANKR Interact = **Knowledge OS for Students**

Imagine a student opens ANKR Interact and:

1. **Uploads NCERT textbook PDF** → Auto-converts to interactive chapters
2. **Asks in Hindi**: "Chapter 5 को explain करो" → AI tutor explains with examples
3. **Takes chapter test** → AI generates 10 MCQs from chapter content
4. **Gets instant feedback** → Wrong answers get AI explanations
5. **Tracks progress** → Badges, streaks, leaderboard
6. **Voice notes**: "मुझे photosynthesis समझाओ" → AI responds in Hindi voice

**Differentiator:** First **voice-first, Indic-language AI tutor** with full document integration.

---

## Phase 10: AI Tutor Integration (Week 21-26)

### 10.1 Chapter Management (@ankr/tutor Integration)

**Documents → Courses → Chapters**

```typescript
// Convert any PDF/Markdown into a course
POST /api/tutor/course/create
{
  "title": "NCERT Physics Class 12",
  "documents": [
    "Chapter-1-Electricity.pdf",
    "Chapter-2-Magnetism.pdf"
  ],
  "language": "hi",
  "subject": "physics",
  "grade": "12"
}

// Response: Course created with 12 chapters
{
  "courseId": "course-123",
  "chapters": [
    { "id": "ch1", "title": "Electricity", "sections": 5 },
    { "id": "ch2", "title": "Magnetism", "sections": 4 }
  ]
}
```

**Features:**
- [ ] Auto-detect chapters from PDF structure (headings, page breaks)
- [ ] Extract key concepts, formulas, diagrams from PDFs
- [ ] Create concept map (knowledge graph) for each chapter
- [ ] Support multiple formats: PDF, Markdown, EPUB
- [ ] Bulk import from Google Drive, OneDrive
- [ ] Chapter navigation sidebar with progress indicators

### 10.2 AI Tutor Chat (@ankr/ai-router + @ankr/tutor)

**Talk to Your Textbook**

```typescript
// Student asks in Hindi
POST /api/tutor/chat
{
  "sessionId": "session-123",
  "chapterId": "ch1",
  "query": "Ohm's law क्या है?",
  "language": "hi"
}

// AI responds with explanation + examples
{
  "answer": "Ohm's law कहता है कि current voltage के directly proportional है...",
  "examples": ["V = IR example with bulb circuit"],
  "relatedConcepts": ["resistance", "voltage", "current"],
  "confidence": 0.95
}
```

**Capabilities:**
- [ ] Explain concepts in student's language (22 languages)
- [ ] Provide step-by-step solutions for problems
- [ ] Give analogies and real-world examples
- [ ] Suggest related concepts to learn next
- [ ] Track what student has already learned
- [ ] Adjust explanation complexity based on student level
- [ ] Voice input/output (speak to tutor in Hindi/Tamil)

**Swayam Integration:**
```typescript
// Voice command: "Hey Swayam, Chapter 1 explain karo"
SwayamButton
  .onCommand("explain_chapter", { chapterId: "ch1" })
  .then(explanation => speak(explanation, "hi"))
```

### 10.3 Interactive Quizzes (@ankr/tutor Quiz Engine)

**Auto-Generate Tests from Chapters**

```typescript
// Generate quiz from chapter content
POST /api/tutor/quiz/generate
{
  "chapterId": "ch1",
  "type": "mcq",
  "count": 10,
  "difficulty": "medium",
  "language": "hi"
}

// AI generates questions
{
  "quiz": [
    {
      "id": "q1",
      "question": "Ohm's law में V का मतलब क्या है?",
      "options": ["Voltage", "Volume", "Velocity", "Vibration"],
      "correctAnswer": "Voltage",
      "explanation": "V stands for Voltage in Ohm's law..."
    }
  ]
}
```

**Quiz Types:**
- [ ] Multiple Choice (MCQ)
- [ ] True/False
- [ ] Fill in the blanks
- [ ] Match the following
- [ ] Short answer (AI-graded)
- [ ] Numerical problems (for Physics/Maths)
- [ ] Diagram labeling (image-based MCQs)

**Features:**
- [ ] Instant feedback with explanations
- [ ] Hint system (3 hints per question)
- [ ] Timer for timed tests (JEE/NEET style)
- [ ] Adaptive difficulty (harder if student scores high)
- [ ] Review wrong answers after test
- [ ] Retry incorrect questions
- [ ] Voice-based quizzes (speak answers)

### 10.4 Progress Tracking & Gamification (@ankr/tutor)

**Student Dashboard**

```typescript
// Get student progress
GET /api/tutor/progress/:studentId

{
  "totalChapters": 12,
  "completedChapters": 5,
  "currentStreak": 7, // days
  "badges": ["Fast Learner", "Quiz Master"],
  "points": 850,
  "rank": 42, // out of 1000 students
  "weakAreas": ["Magnetism", "Circuits"],
  "strongAreas": ["Ohm's Law", "Resistance"]
}
```

**Gamification Elements:**
- [ ] **Badges**: "Quiz Master", "7-Day Streak", "Chapter Champion"
- [ ] **Points**: Earn points for completing chapters, quizzes, daily login
- [ ] **Leaderboard**: School/class/global rankings
- [ ] **Streaks**: Track consecutive days of learning
- [ ] **Levels**: Beginner → Intermediate → Advanced → Expert
- [ ] **Achievements**: "Solved 100 problems", "Aced Physics"
- [ ] **Challenges**: Weekly/monthly challenges with prizes

**Visual Progress:**
- [ ] Circular progress bars for each chapter
- [ ] Calendar heatmap (like GitHub contributions)
- [ ] Subject mastery spider chart
- [ ] Time spent per subject/chapter graph

### 10.5 Adaptive Learning (@ankr/learning Integration)

**System Learns Student's Learning Patterns**

```typescript
// After each interaction
await learning.learn({
  type: 'student_answer',
  source: '@ankr/tutor',
  data: {
    studentId: '123',
    chapterId: 'ch1',
    questionId: 'q1',
    correct: false,
    timeTaken: 45 // seconds
  },
  outcome: 'incorrect'
});

// Predict weak areas
const prediction = await learning.predict('weak_area', {
  studentId: '123',
  subject: 'physics'
});

// Output: { weakArea: 'Magnetism', confidence: 0.88 }
```

**Adaptive Features:**
- [ ] Adjust quiz difficulty based on performance
- [ ] Recommend chapters based on weak areas
- [ ] Predict exam readiness
- [ ] Suggest optimal study schedule
- [ ] Detect learning style (visual, auditory, kinesthetic)
- [ ] Personalize explanation style per student
- [ ] Early warning: "Student struggling with topic X"

### 10.6 Voice-First Learning (Swayam + @ankr/voice-ai)

**Study by Talking (India-first Feature)**

| Voice Command (Hindi) | Action |
|----------------------|--------|
| "Hey Swayam, Chapter 1 पढ़ाओ" | Explains chapter in voice |
| "इस question का answer बताओ" | Solves problem with steps |
| "Photosynthesis क्या है?" | Explains concept |
| "10 questions पूछो" | Starts voice quiz |
| "मेरा progress दिखाओ" | Reads progress report |
| "Magnetism समझाओ" | Explains in simple Hindi |

**Voice Quiz Flow:**
```
Swayam: "Question 1: Ohm's law क्या है? A, B, C, या D?"
Student: "B"
Swayam: "Correct! Next question..."
```

**Features:**
- [ ] Hands-free learning (for commute, household work)
- [ ] Voice notes capture (speak to save notes)
- [ ] Read aloud entire chapter
- [ ] Voice-controlled navigation
- [ ] Multilingual voice (Hindi, Tamil, Telugu, etc.)
- [ ] Offline voice (Web Speech API)

### 10.7 Study Tools & Features

**Flashcards:**
- [ ] Auto-generate flashcards from chapter content
- [ ] Spaced repetition (SM2 algorithm)
- [ ] Swipe left (don't know), right (know)
- [ ] Voice-based flashcard review

**Notes & Annotations:**
- [ ] Highlight text in PDFs/documents
- [ ] Add sticky notes to chapters
- [ ] Handwriting support (tablet/stylus)
- [ ] Voice notes attached to sections
- [ ] Share notes with classmates
- [ ] Export notes as PDF/Markdown

**Formula Sheet:**
- [ ] Auto-extract formulas from chapters
- [ ] LaTeX rendering for equations
- [ ] Quick reference sheet per chapter
- [ ] Search formulas by name
- [ ] Practice problems for each formula

**Mind Maps:**
- [ ] Auto-generate mind map from chapter
- [ ] Interactive concept connections
- [ ] Export as image/PDF
- [ ] Collaborate on mind maps

### 10.8 Exam Preparation Mode

**JEE/NEET/UPSC/Board Exams**

```typescript
// Enter exam prep mode
POST /api/tutor/exam-prep
{
  "exam": "JEE-Main-2026",
  "subjects": ["Physics", "Chemistry", "Maths"],
  "targetDate": "2026-04-15"
}

// System creates study plan
{
  "daysLeft": 120,
  "chaptersToComplete": 45,
  "dailyTarget": "2 chapters + 1 quiz",
  "schedule": {
    "week1": ["Physics Ch1-3", "Chem Ch1-2"],
    "week2": ["Maths Ch1-4", "Physics Ch4-5"]
  }
}
```

**Features:**
- [ ] Countdown to exam
- [ ] Custom study schedule
- [ ] Previous year papers (auto-import)
- [ ] Mock tests (full-length, timed)
- [ ] Performance analytics (chapter-wise score)
- [ ] Peer comparison (anonymized rankings)
- [ ] Daily motivational quotes
- [ ] Stress management tips
- [ ] Revision reminders

### 10.9 Collaborative Learning

**Study Groups:**
- [ ] Create private study groups (5-20 students)
- [ ] Group chat with AI tutor present
- [ ] Shared notes and flashcards
- [ ] Group quizzes (compete or collaborate)
- [ ] Ask doubts, get peer + AI answers
- [ ] Study together mode (pomodoro timer)

**Teacher Dashboard:**
- [ ] Track entire class progress
- [ ] Assign chapters/quizzes to students
- [ ] Grade assignments
- [ ] View analytics (who's struggling)
- [ ] Send announcements
- [ ] Create custom tests

### 10.10 Content Ecosystem

**Where Students Get Content:**

1. **Upload Own:**
   - NCERT PDFs, school notes, coaching material
   - Voice notes from classes
   - Scanned handwritten notes (OCR)

2. **Pre-loaded Library:**
   - NCERT (Class 6-12, all subjects)
   - State boards (Maharashtra, Tamil Nadu, etc.)
   - JEE/NEET question banks
   - UPSC syllabus & previous papers

3. **User-Generated:**
   - Students share notes
   - Teachers upload curated content
   - Community-contributed Q&A

4. **AI-Generated:**
   - Auto-generate summaries from textbooks
   - Create practice questions from chapters
   - Generate diagrams/mind maps

---

## Architecture Integration

```
┌─────────────────────────────────────────────────────────────┐
│                    ANKR Interact (Tutor Mode)                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Document     │  │ Chapter      │  │ Quiz         │      │
│  │ Viewer       │  │ Manager      │  │ Engine       │      │
│  │ (PDF/MD)     │  │ (@ankr/tutor)│  │ (@ankr/tutor)│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ AI Tutor     │  │ Progress     │  │ Swayam       │      │
│  │ Chat         │  │ Tracker      │  │ Voice Bot    │      │
│  │ (@ankr/ai)   │  │ (@ankr/tutor)│  │ (Hindi)      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │         Backend: @ankr/learning (Adaptive AI)           ││
│  │         Storage: PostgreSQL (ankr_tutor DB)             ││
│  │         Cache: Redis (quiz results, progress)           ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema (New Tables)

```prisma
// Add to ankr_viewer schema or create new ankr_tutor DB

model Course {
  id          String    @id @default(cuid())
  title       String
  subject     String    // physics, chemistry, maths
  grade       String    // 6, 7, 8, 9, 10, 11, 12
  language    String    @default("en")
  chapters    Chapter[]
  createdAt   DateTime  @default(now())
}

model Chapter {
  id          String    @id @default(cuid())
  courseId    String
  course      Course    @relation(fields: [courseId], references: [id])
  title       String
  content     String    @db.Text // Markdown or HTML
  documentPath String?  // Link to original PDF
  order       Int
  concepts    Concept[]
  quizzes     Quiz[]
}

model Concept {
  id          String    @id @default(cuid())
  chapterId   String
  chapter     Chapter   @relation(fields: [chapterId], references: [id])
  name        String
  definition  String    @db.Text
  examples    String[]
  relatedTo   String[]  // IDs of related concepts
}

model Quiz {
  id          String      @id @default(cuid())
  chapterId   String
  chapter     Chapter     @relation(fields: [chapterId], references: [id])
  title       String
  type        String      // mcq, true_false, short_answer
  difficulty  String      // easy, medium, hard
  questions   Question[]
  attempts    QuizAttempt[]
}

model Question {
  id          String    @id @default(cuid())
  quizId      String
  quiz        Quiz      @relation(fields: [quizId], references: [id])
  question    String    @db.Text
  options     String[]  // For MCQ
  answer      String
  explanation String?   @db.Text
  points      Int       @default(1)
}

model QuizAttempt {
  id          String    @id @default(cuid())
  quizId      String
  quiz        Quiz      @relation(fields: [quizId], references: [id])
  studentId   String
  score       Int
  totalPoints Int
  answers     Json      // Store student answers
  timeTaken   Int       // seconds
  createdAt   DateTime  @default(now())
}

model StudentProgress {
  id            String    @id @default(cuid())
  studentId     String
  courseId      String
  chaptersRead  String[]  // Chapter IDs completed
  badges        String[]
  points        Int       @default(0)
  streak        Int       @default(0)
  lastActive    DateTime  @default(now())
}

model Badge {
  id          String    @id @default(cuid())
  name        String
  description String
  icon        String
  criteria    Json      // { type: "streak", value: 7 }
}
```

---

## Competitive Landscape

| Feature | Byju's | Unacademy | Khan Academy | **ANKR Interact** |
|---------|--------|-----------|--------------|-------------------|
| Price | ₹40K/year | ₹15K/year | Free | **Free (open-source)** |
| Languages | 2-3 | English | English | **22 (all Indic)** |
| Voice Input | ❌ | ❌ | ❌ | **✅ 11 Indian langs** |
| Voice Output | ⚠️ Limited | ❌ | ❌ | **✅ 500+ voices** |
| Offline | ⚠️ | ⚠️ | ⚠️ | **✅ Full offline** |
| Own Content | ❌ | ❌ | ❌ | **✅ Upload PDFs** |
| AI Tutor | ⚠️ Paid | ⚠️ Paid | ❌ | **✅ Free (Swayam)** |
| Open Source | ❌ | ❌ | ✅ | **✅** |
| Self-Hosted | ❌ | ❌ | ❌ | **✅** |
| Adaptive | ✅ | ⚠️ | ✅ | **✅ @ankr/learning** |

**Differentiators:**
1. **Voice-first** (India's first voice tutor in 11+ languages)
2. **Free & Open-source** (vs ₹15-40K/year competitors)
3. **Bring your own content** (upload any PDF/notes)
4. **Offline-capable** (works without internet)
5. **Multilingual** (22 Indian languages)
6. **Privacy-first** (self-hosted, no data sharing)

---

## Go-to-Market Strategy

### Target Users
1. **Tier 2/3 City Students** - Can't afford Byju's/Unacademy
2. **Government School Students** - Free + regional language support
3. **Rural Students** - Offline mode, voice-first
4. **Competitive Exam Students** - JEE/NEET/UPSC
5. **Self-learners** - Upload own study material

### Pricing
| Tier | Price | Features |
|------|-------|----------|
| **Free** | ₹0 | 5 courses, basic AI, 100 quizzes/month |
| **Student** | ₹499/year | Unlimited courses, full AI tutor, voice |
| **Teacher** | ₹2999/year | Class management, custom tests, analytics |
| **School** | ₹50K/year | 500 students, admin dashboard, API access |

### Monetization
1. **Freemium Model** - Free basic, paid premium
2. **B2B (Schools)** - Sell to schools/coaching centers
3. **Content Marketplace** - Teachers sell courses
4. **White-label** - License to other EdTech companies
5. **API Access** - Charge for AI tutor API usage

---

## Implementation Phases

### Phase 10A: Core Tutor (Week 21-22)
- [ ] Integrate @ankr/tutor package
- [ ] PDF to chapter conversion
- [ ] Basic quiz engine
- [ ] Progress tracking UI

### Phase 10B: AI Tutor (Week 23-24)
- [ ] AI chat integration (@ankr/ai-router)
- [ ] Auto-generate quizzes from chapters
- [ ] Concept extraction from PDFs
- [ ] Knowledge graph for concepts

### Phase 10C: Voice Learning (Week 25)
- [ ] Swayam voice bot integration
- [ ] Voice quizzes
- [ ] Read aloud chapters
- [ ] Voice commands for navigation

### Phase 10D: Gamification (Week 26)
- [ ] Badges & achievements
- [ ] Leaderboards
- [ ] Streaks & daily goals
- [ ] Social features (study groups)

---

## Success Metrics

**Within 3 months:**
- 1,000 students using ANKR Interact for studies
- 50 courses uploaded (NCERT + competitive exams)
- 10,000 quizzes taken
- 100 teachers creating content

**Within 6 months:**
- 10,000 active students
- 500 courses in library
- 5 school partnerships
- Voice tutor in 5 Indian languages

**Within 1 year:**
- 100,000 students
- 5,000 courses
- 100 schools
- Voice tutor in all 22 languages
- First paying enterprise customer

---

## Next Steps (Immediate)

1. **Review @ankr/tutor source code** - Understand quiz engine, progress tracking
2. **Design tutor UI** - Mockups for chapter view, quiz interface
3. **Database schema** - Add tutor tables to ankr_viewer or create ankr_tutor DB
4. **Proof of concept** - Upload one NCERT PDF, auto-convert to chapters, generate 5 quizzes
5. **Test Swayam integration** - "Hey Swayam, explain Chapter 1"

---

**Created:** 2026-01-22
**Status:** Brainstorm - Ready for Discussion
**Next:** Get feedback, prioritize features, start POC
