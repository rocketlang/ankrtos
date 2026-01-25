# 🎓 PRATHAM AI Tutor - POC Plan & Analysis

## 📧 Project Context

**Stakeholders:**
- **Pratham (IIFM):** Ankit Kapoor, Pranav (PC)
- **SocialKyte:** Bharat Agarwal (Facilitator)
- **ANKR Labs:** Captain Anil Sharma (Implementation)

**Objective:** Create AI-powered educational assistant for Pratham's QA module

---

## 📚 Content Analysis - Uploaded Module

### Book Details
- **Title:** 6 Bookset QA - Comprehensive Book with First page (ISBN)
- **Pages:** 268 pages
- **Size:** 4.8 MB
- **Format:** PDF (text-extractable)
- **Status:** ✅ Uploaded & Processed
- **Book ID:** pratham-1769195982617-92x93sy70

### Content Structure (Initial Analysis)
```
✅ Text Extracted: First 500 words indexed
✅ Metadata: Complete
✅ Searchable: Full-text search enabled
✅ Thumbnail: Generated
```

---

## 🤖 AI Tutor POC - Features & Capabilities

### Phase 1: Core AI Tutor (2-3 weeks)

#### 1.1 Question Answering System
```typescript
// AI can answer questions from the module
Student: "What is covered in Chapter 3?"
AI Tutor: [Searches 268 pages, provides chapter summary]

Student: "Explain the concept of [topic]"
AI Tutor: [Extracts relevant sections, explains in simple language]
```

**Technical Stack:**
- ✅ PDF text extraction (pdftotext) - DONE
- ✅ Vector embeddings (pgvector) - Available
- ✅ LLM integration (AI Proxy) - Running on port 4444
- ⏳ RAG pipeline (Retrieval Augmented Generation) - TO BUILD
- ⏳ Context-aware responses - TO BUILD

#### 1.2 Study Assistant Features
- **Summarization:** Chapter-wise summaries
- **Key Points:** Extract main concepts
- **Explanations:** Simplify complex topics
- **Examples:** Generate practice examples
- **Definitions:** Define technical terms

#### 1.3 Search & Navigation
- ✅ Full-text search across 268 pages
- ✅ Page navigation
- ⏳ Semantic search (find by meaning, not just keywords)
- ⏳ Related topics suggestions

### Phase 2: Assessment & Analytics (3-4 weeks)

#### 2.1 Question Generation
```typescript
// Auto-generate questions from content
AI: Generate 10 MCQs from Chapter 5
→ Creates multiple-choice questions
→ Includes answer key
→ Difficulty levels: Easy/Medium/Hard
```

#### 2.2 Test Analysis
```typescript
// Analyze student performance
Student completes test → AI analyzes:
- Weak areas identified
- Topics needing revision
- Personalized study plan
- Practice recommendations
```

#### 2.3 Progress Tracking
- Reading progress (% completed)
- Time spent on each chapter
- Questions attempted vs correct
- Learning pace analysis
- Retention rates

### Phase 3: Advanced Features (4-6 weeks)

#### 3.1 Adaptive Learning
- Personalized content based on performance
- Difficulty adjustment
- Custom learning paths
- Spaced repetition for revision

#### 3.2 Multilingual Support
- English (primary)
- Hindi translation
- Regional languages (as needed)
- Voice-to-text (Hindi/English)

#### 3.3 Interactive Elements
- Flashcards generation
- Mind maps
- Practice quizzes
- Gamification (points, badges, leaderboards)

---

## 🔧 Technical Architecture

### Current Infrastructure (ANKR LMS)
```
ANKR LMS (ankrlms.ankr.in)
├── Frontend (Vite + React) - Port 5173 ✅
├── Backend API - Port 3199 ✅
├── AI Proxy (Multi-LLM Router) - Port 4444 ✅
├── EON Memory System - Port 4005 ✅
├── PostgreSQL + pgvector ✅
└── Redis Cache ✅
```

### New Components Needed

#### 1. RAG Pipeline (Retrieval Augmented Generation)
```typescript
// Convert PDF content to vector embeddings
Document → Chunks → Embeddings → Vector DB → RAG Query

Student Question
    ↓
Find Relevant Sections (Vector Search)
    ↓
Send to LLM with Context
    ↓
Generate Accurate Answer
```

**Location:** `/root/ankr-labs-nx/packages/pratham-ai-tutor/`

#### 2. Question Generation Engine
```typescript
// Extract content → Generate questions
- MCQ Generator
- Short Answer Generator
- True/False Generator
- Fill-in-the-blanks Generator
```

#### 3. Assessment Analytics Engine
```typescript
// Track & analyze student performance
- Answer correctness
- Time spent
- Difficulty levels
- Learning patterns
- Weak areas identification
```

#### 4. Personalization Engine
```typescript
// Adapt content based on student
- Performance history
- Learning speed
- Preferred topics
- Revision needs
```

---

## 📊 POC Deliverables

### Minimum Viable Product (MVP)
1. ✅ **Content Upload** - 268-page module loaded
2. ✅ **PDF Viewer** - Read online with navigation
3. ✅ **Basic Search** - Find content by keywords
4. ⏳ **AI Q&A** - Answer questions from module
5. ⏳ **Chapter Summaries** - AI-generated overviews
6. ⏳ **Quiz Generator** - Auto-create 10 questions per chapter
7. ⏳ **Progress Dashboard** - Track reading progress

### Demo Use Cases
```
Use Case 1: Student has question
- Student asks: "What are the key topics in Chapter 5?"
- AI scans pages, provides structured summary
- Shows relevant page numbers

Use Case 2: Practice test
- Student requests: "Give me 10 practice questions"
- AI generates MCQs from recent chapters
- Student answers, gets instant feedback
- AI shows weak areas

Use Case 3: Concept explanation
- Student: "I don't understand [concept]"
- AI finds relevant sections
- Provides simplified explanation
- Suggests related topics to study
```

---

## 🎯 Implementation Roadmap

### Week 1: Foundation
- [x] Upload & process PDF content
- [x] Set up ANKR LMS viewer
- [ ] Build RAG pipeline for Q&A
- [ ] Create embeddings for all 268 pages
- [ ] Test basic AI Q&A functionality

### Week 2: Core Features
- [ ] Implement chapter-wise navigation
- [ ] Build question generation system
- [ ] Create summary generation
- [ ] Add bookmark & annotation features
- [ ] Integrate voice search (Hindi/English)

### Week 3: Assessment
- [ ] Build quiz creation interface
- [ ] Implement answer evaluation
- [ ] Create progress tracking
- [ ] Design analytics dashboard
- [ ] Add weak area identification

### Week 4: Polish & Demo
- [ ] User testing with sample students
- [ ] Refine AI responses
- [ ] Optimize performance
- [ ] Prepare demo presentation
- [ ] Create documentation

---

## 💰 Cost Estimation (POC)

### Infrastructure (Already Available)
- Server: Running on 216.48.185.29 ✅
- ANKR LMS: Active at ankrlms.ankr.in ✅
- AI Gateway: Multi-provider LLM routing ✅
- Database: PostgreSQL + pgvector ✅

### Additional Costs
- **LLM API calls:**
  - For Q&A: ~$0.002 per question
  - For summaries: ~$0.01 per chapter
  - For quiz generation: ~$0.01 per 10 questions
  - **Estimated POC cost:** $50-100 for testing

- **Development Time:** 3-4 weeks for MVP
- **Storage:** Minimal (PDF + embeddings < 100 MB)

---

## 📈 Success Metrics

### Quantitative
- Response accuracy: >85%
- Response time: <3 seconds
- Quiz quality: >80% relevance
- User engagement: >70% completion rate

### Qualitative
- Student satisfaction
- Ease of use
- Learning effectiveness
- Teacher feedback

---

## 🔄 Next Steps (Immediate)

### 1. Content Analysis (This Week)
```bash
# Extract chapter structure
node /root/analyze-pratham-content.js

# Generate chapter-wise index
node /root/create-chapter-index.js

# Create embeddings for vector search
node /root/generate-embeddings.js
```

### 2. Build RAG Pipeline (Next Week)
- Chunk content into manageable sections
- Generate vector embeddings
- Store in pgvector
- Build retrieval system
- Test Q&A accuracy

### 3. Stakeholder Demo (2 Weeks)
- Prepare demo environment
- Create sample questions
- Show 3-4 use cases
- Get feedback
- Refine based on input

---

## 📞 Proposed Working Call Agenda

### Topics to Discuss:
1. **Content Scope**
   - Is this the complete syllabus or one module?
   - Are there more books to be added?
   - What subjects/topics are covered?

2. **Target Users**
   - What grades/classes?
   - Current class size?
   - Student tech proficiency?

3. **Use Cases Priority**
   - What's most important: Q&A, Testing, or Analytics?
   - Any specific learning outcomes?
   - Integration with existing systems?

4. **Timeline & Milestones**
   - When do you need POC ready?
   - When can we do user testing?
   - Launch timeline expectations?

5. **Success Criteria**
   - How will you measure success?
   - What KPIs matter most?
   - Expected improvements vs current methods?

---

## 🎯 Competitive Positioning (vs Byju's)

### ANKR Advantages:
1. **Customized for Pratham's Content** - Not generic
2. **On-premise Option** - Data stays with Pratham
3. **Open Architecture** - Can be modified/extended
4. **Cost Effective** - Pay for what you use
5. **Hindi/Regional Language Native** - Built-in support
6. **Offline Mode** - Works without internet
7. **Flexible Pricing** - No per-student costs

### Byju's Advantages:
1. Brand recognition
2. Gamified content library
3. Video lessons
4. Large user base
5. Professional content creation

### ANKR Strategy:
- Focus on **personalization** over scale
- Leverage **existing Pratham content** vs creating new
- Enable **teachers** to customize vs fixed curriculum
- Emphasize **data privacy** and local control

---

## 📋 Required from Pratham Team

1. **Content:**
   - [ ] Full list of modules/books to be included
   - [ ] Any existing question banks
   - [ ] Chapter/topic structure if available
   - [ ] Learning objectives per chapter

2. **Use Cases:**
   - [ ] 3-5 most important use cases
   - [ ] Sample student queries
   - [ ] Current pain points in teaching/learning

3. **Access:**
   - [ ] Sample student accounts for testing
   - [ ] Teacher accounts for admin access
   - [ ] Feedback mechanism preferences

4. **Timeline:**
   - [ ] POC review date
   - [ ] User testing window
   - [ ] Expected pilot launch date

---

## ✅ Current Status

**Phase:** Initial Content Seeding - COMPLETE ✅

**Completed:**
- ✅ PDF uploaded (4.8 MB, 268 pages)
- ✅ Metadata extracted
- ✅ Text indexed for search
- ✅ Thumbnail generated
- ✅ ANKR LMS integration
- ✅ Basic viewer accessible

**Next:** Build RAG pipeline for AI Q&A

**Access:** https://ankrlms.ankr.in/library/pratham

---

**Prepared by:** ANKR Labs
**Date:** 2026-01-24
**Status:** Ready for stakeholder review
**Contact:** capt.anil.sharma@powerpbox.org
