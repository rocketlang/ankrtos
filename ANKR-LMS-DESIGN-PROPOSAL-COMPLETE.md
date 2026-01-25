# ANKR Learning Platform - Complete Design Proposal 🎓

**For:** Pratham Foundation & Future Public Release
**Date:** January 2026
**Status:** Design Phase - Ready to Build

---

## 🌟 Vision: Two Platforms, One Technology

### **Platform 1: ANKR EDU (For Students & Teachers)**
Focus: K-12 education, simple interface, guided learning

### **Platform 2: ANKR RESEARCH (For Professionals & Researchers)**
Focus: Multi-source analysis, report generation, research tools

### **Platform 3: ANKR OPEN (Open Source Community Version)**
Focus: Self-hosted, privacy-first, customizable for any use case

---

## 📚 What We Will Build

### **Core Concept**
A smart platform that helps you:
- **Ask questions** to your documents (textbooks, research papers, reports)
- **Get instant answers** with exact page references
- **Generate content** (quizzes, audio lessons, summaries, reports)
- **Learn visually** (mind maps, concept graphs, diagrams)
- **Track progress** (for students) or organize research (for professionals)

---

## 🎯 Part 1: ANKR EDU (Education Version)

### **For Students: Your Personal Study Assistant**

#### **Feature 1: Ask Questions to Your Textbook**

**What it will do:**
```
Student uploads: Math textbook (268 pages)

Question: "I don't understand probability. Explain simply."

Answer in 10 seconds:
"Probability measures how likely something is to happen.

Example: Flip a coin
- 2 outcomes: Heads or Tails
- Chance of Heads = 1 out of 2 = 50%

If you flip 100 times, you'll get Heads about 50 times.

📖 From your textbook: Pages 194-198"
```

**How it will work (Using RAG):**

RAG = **Retrieval Augmented Generation**

Think of it like a smart librarian:
```
Step 1: Upload textbook (PDF)
   ↓
Step 2: Break into small chunks (512 words each)
   ↓
Step 3: Create "embeddings" (mathematical fingerprints)
   ↓
Step 4: Store in smart database (PostgreSQL + pgvector)
   ↓
When student asks question:
   ↓
Step 5: Search database for relevant chunks
         (This is the "Retrieval" part)
   ↓
Step 6: Send chunks to AI to write answer
         (This is the "Generation" part)
   ↓
Step 7: Show answer with page numbers
```

**Why RAG is important:**
- ✅ AI reads ONLY your textbook (not random internet)
- ✅ Answers are accurate (from actual book)
- ✅ Shows page numbers (can verify)
- ✅ Works offline (after downloading)

---

#### **Feature 2: Audio Lessons (Listen While Commuting)**

**What it will do:**
```
Student clicks: "Make Audio Lesson - Chapter 5"
   ↓
Wait 30 seconds
   ↓
Download MP3 file
   ↓
Listen on bus/train:

🎧 "Welcome! Today we're learning algebra.
    Let's start with simple equations.
    Imagine you have some chocolates..."

[15 minutes of natural voice explanation]
```

**How it will work:**
```
Step 1: Extract chapter text from PDF
   ↓
Step 2: Simplify complex sentences (using AI)
   ↓
Step 3: Add conversational tone
   ↓
Step 4: Convert to speech (Text-to-Speech engine)
   ↓
Step 5: Generate MP3 file (small size: 2MB for 15 min)
   ↓
Student downloads and listens offline!
```

---

#### **Feature 3: Auto Quiz Generation**

**What it will do:**
```
Teacher selects: Chapter 5 - Algebra
Number of questions: 10
Difficulty: Medium

Click "Generate"
   ↓
30 seconds later:
   ↓
10 brand new questions ready!

Example:
Q1: Solve for x: 2x + 5 = 15
○ x = 3
○ x = 4
● x = 5  (Correct answer)
○ x = 6

[Auto-grading included!]
```

---

#### **Feature 4: Knowledge Graphs (Visual Learning)**

**What it will do (NEW!):**
```
Upload: Math textbook
   ↓
System generates interactive mind map:

         Mathematics
        /     |      \
    Algebra Geometry Statistics
      /         |          \
  Linear    Triangles   Probability
  Equations    |            |
      |     Theorems    Distributions
  Examples     |            |
             Proofs      Examples

Click any node → Jump to that section
See connections between topics!
```

**Why this helps:**
- ✅ Visual learners understand better
- ✅ See how topics connect
- ✅ Find related concepts easily
- ✅ Navigate textbook visually

---

#### **Feature 5: Complete Study Packages (NEW!)**

**What it will do:**
```
Teacher clicks: "Create Study Package - Chapter 5"
   ↓
System generates:
   ↓
📦 Complete Package:
├── 📄 Text Summary (2 pages)
├── 🎥 Video Explanation (10 min YouTube link)
├── 🎧 Audio Lesson (15 min MP3)
├── 🗺️ Mind Map (interactive)
├── 📝 Practice Quiz (10 questions)
├── 🎴 Flashcards (15 cards)
└── 📊 Progress Tracker

Student gets EVERYTHING needed! 🎁
```

---

### **For Teachers: Work Smarter**

#### **Feature 6: Multi-Source Upload**

**What it will do:**
```
Upload multiple books:
1. Math Textbook (Class 10)
2. Science Textbook (Class 10)
3. Previous Year Questions
4. Reference Guide
5. Teacher's Manual

Now students can ask questions across ALL books!

Example:
Question: "How is algebra used in physics?"

Answer combines info from Math + Science books! 🔗
```

---

#### **Feature 7: Weak Area Detection**

**What it will do:**
```
Teacher Dashboard shows:

Class 10-A (50 students):
┌─────────────────────────────────┐
│ Common Weak Areas:              │
│ 🔴 Quadratic Equations (35/50) │
│ 🟡 Probability (20/50)         │
│ 🟢 Linear Algebra (5/50)       │
│                                 │
│ Suggested Action:               │
│ → Create extra quiz for Chapter│
│ → Schedule doubt session        │
│ → Share video resources         │
└─────────────────────────────────┘
```

---

## 🔬 Part 2: ANKR RESEARCH (Professional Version)

### **For Researchers & Professionals**

#### **Feature 8: Multi-Document Analysis**

**What it will do:**
```
Upload up to 50 documents:
- Research papers (PDFs)
- Articles
- Reports
- Spreadsheets
- Web pages

Ask: "What are the common findings across all papers?"

System analyzes ALL 50 and provides:
- Summary of findings
- Contradictions
- Gaps in research
- Citation network
- Comparative table
```

**Using RAG at scale:**
```
50 papers × 20 pages each = 1,000 pages
   ↓
Break into chunks: ~5,000 chunks
   ↓
Create embeddings for all
   ↓
Store in vector database
   ↓
Query finds relevant info across ALL papers
   ↓
Generate comprehensive synthesis
```

---

#### **Feature 9: Research Report Generation**

**What it will do:**
```
Input: 20 research papers on climate change
Prompt: "Generate literature review"

Output:
📄 30-page Literature Review
├── Introduction
├── Methodology Analysis
├── Key Findings
│   ├── Theme 1: Temperature Rise
│   ├── Theme 2: Sea Level
│   └── Theme 3: Policy Impact
├── Contradictions & Debates
├── Research Gaps
├── Future Directions
└── References (auto-generated)

Format: PDF, Word, LaTeX
```

---

#### **Feature 10: Citation Network Visualization**

**What it will do:**
```
Upload research papers
   ↓
System creates interactive graph:

   Paper A ←─────→ Paper B
      ↓              ↓
   Paper C ←───→ Paper D
      ↓
   Paper E

Click any paper → See:
- Abstract
- Key findings
- Which papers cite it
- Which papers it cites
- Related papers
```

---

#### **Feature 11: Data Table Extraction**

**What it will do:**
```
Upload: 10 research papers with data tables
   ↓
System extracts all tables
   ↓
Converts to Excel/CSV
   ↓
Student can:
- Sort and filter
- Create charts
- Compare across papers
- Export for further analysis
```

---

## 🌐 Part 3: ANKR OPEN (Open Source Version)

### **What We Will Open Source**

#### **Core Features (Free Forever):**
- ✅ RAG engine (upload PDFs, ask questions)
- ✅ Quiz generation
- ✅ Audio lesson generation
- ✅ Knowledge graphs
- ✅ Multi-source upload
- ✅ Basic analytics

#### **Self-Hosted:**
```
Organizations can:
- Download code from GitHub
- Install on their own servers
- Customize everything
- Keep ALL data private
- No monthly fees
- Community support
```

#### **Community Benefits:**
```
Open Source means:
✅ Transparent (everyone can see code)
✅ Secure (community reviews code)
✅ Customizable (modify for your needs)
✅ Free Forever (no vendor lock-in)
✅ Privacy (data stays with you)
```

---

## 🧠 Technical Deep Dive: How RAG Works

### **RAG Explained Simply**

**Traditional AI (Without RAG):**
```
You: "What's in Chapter 5 of my textbook?"
AI: "I don't know. I wasn't trained on your textbook."
❌ Useless!
```

**AI with RAG:**
```
You: "What's in Chapter 5 of my textbook?"

System:
1. Searches YOUR uploaded textbook
2. Finds Chapter 5 content
3. Reads it
4. Generates answer from YOUR book

AI: "Chapter 5 covers algebraic equations. Here's what it says..."
✅ Useful!
```

### **RAG Architecture**

```
┌─────────────────────────────────────────┐
│ 1. DOCUMENT INGESTION                  │
├─────────────────────────────────────────┤
│ Upload PDF → Extract Text → Clean Text │
│ → Split into Chunks → Create Embeddings│
│ → Store in Vector Database              │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ 2. RETRIEVAL (when user asks question) │
├─────────────────────────────────────────┤
│ User Question → Create Query Embedding  │
│ → Search Vector DB → Find Top 5 Chunks │
│ → Rank by Relevance                     │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ 3. GENERATION (create answer)          │
├─────────────────────────────────────────┤
│ Top 5 Chunks + User Question → Send to │
│ AI → Generate Answer → Add Citations → │
│ Return to User                          │
└─────────────────────────────────────────┘
```

### **Why RAG vs Fine-Tuning?**

**Fine-Tuning:**
```
❌ Expensive ($10,000+ per model)
❌ Takes weeks
❌ Can't update easily (retrain entire model)
❌ Need ML expertise
```

**RAG:**
```
✅ Cheap (use existing AI models)
✅ Works instantly (just upload docs)
✅ Update anytime (upload new docs)
✅ No ML expertise needed
```

---

## 🔧 Technical Deep Dive: MCP (Model Context Protocol)

### **What is MCP?**

MCP = **Model Context Protocol**

Think of it as a **universal translator** that lets AI talk to different tools and services.

### **MCP Explained Simply**

**Without MCP:**
```
AI needs to connect to:
- Database (different code)
- Email system (different code)
- Calendar (different code)
- Payment gateway (different code)

Result: Write custom code for each! ❌
```

**With MCP:**
```
AI uses MCP to connect to:
- Database ✅
- Email ✅
- Calendar ✅
- Payment ✅

One standard protocol! All tools work the same way! ✅
```

### **How We'll Use MCP in ANKR**

#### **Example 1: Student Progress Tracking**

```
Student asks: "Show my progress"

MCP flow:
1. AI receives question
2. MCP calls "database" tool
3. Gets student data
4. MCP calls "chart" tool
5. Generates progress chart
6. Returns to student

All automated via MCP! 🚀
```

#### **Example 2: Send Quiz Results to Parent**

```
Teacher: "Send quiz results to parents"

MCP flow:
1. AI receives instruction
2. MCP calls "database" tool → Get results
3. MCP calls "whatsapp" tool → Format message
4. MCP calls "send" tool → Send to parents

Done! Parents get WhatsApp message! 📱
```

#### **Example 3: Multi-Source Research**

```
Researcher: "Analyze sentiment in all papers"

MCP flow:
1. AI receives task
2. MCP calls "file" tool → Get all PDFs
3. MCP calls "nlp" tool → Analyze each
4. MCP calls "chart" tool → Create graph
5. MCP calls "export" tool → Generate report

Automated research pipeline! 📊
```

### **MCP Tools We'll Build**

```
ANKR MCP Server:
├── Document Tools
│   ├── upload_pdf
│   ├── extract_text
│   ├── chunk_document
│   └── create_embeddings
├── Query Tools
│   ├── semantic_search
│   ├── get_citations
│   └── multi_document_search
├── Generation Tools
│   ├── generate_quiz
│   ├── generate_audio
│   ├── generate_summary
│   └── create_mind_map
├── Analysis Tools
│   ├── find_weak_areas
│   ├── compare_documents
│   └── extract_tables
└── Integration Tools
    ├── send_whatsapp
    ├── send_email
    ├── export_to_excel
    └── create_report
```

---

## 🏗️ Technology Stack (What We'll Use)

### **Database Layer**
```
PostgreSQL 14+
├── pgvector extension (for embeddings)
├── Full-text search (for keyword search)
└── JSON support (for flexible data)
```

### **Backend Layer**
```
Fastify (Fast web server)
├── GraphQL API (flexible queries)
├── REST API (simple endpoints)
└── WebSocket (real-time updates)
```

### **AI Layer**
```
Local AI (Ollama)
├── nomic-embed-text (embeddings - FREE!)
├── llama3.2 (text generation - FREE!)
└── whisper (speech-to-text - optional)

Cloud AI (Fallback)
└── AI Proxy (routes to cheapest provider)
```

### **Vector Search**
```
pgvector
├── Cosine similarity search
├── Stores 768-dimension embeddings
└── Millions of vectors supported
```

### **Frontend Layer**
```
React 18
├── Vite (fast builds)
├── TailwindCSS (styling)
├── D3.js (knowledge graphs)
└── Excalidraw (mind maps)
```

### **File Processing**
```
pdf-parse (extract text from PDFs)
mammoth (extract from Word docs)
xlsx (extract from Excel)
```

### **Audio Generation**
```
edge-tts (FREE!)
├── 22 Indian languages
├── Natural voices
└── Unlimited usage
```

---

## 📊 How RAG Will Help Pratham

### **Problem 1: Students Can't Find Answers in Textbook**

**Old Way:**
```
Student has question
   ↓
Flip through 268 pages
   ↓
Can't find answer
   ↓
Give up ❌
```

**With RAG:**
```
Student asks question
   ↓
RAG searches entire book in 1 second
   ↓
Finds relevant pages
   ↓
AI explains in simple words
   ↓
Student understands! ✅
```

### **Problem 2: Teacher Needs to Create Quiz**

**Old Way:**
```
Read chapter
   ↓
Think of questions (2 hours)
   ↓
Write them down
   ↓
Create answer key
❌ Exhausting!
```

**With RAG:**
```
Teacher selects chapter
   ↓
RAG reads chapter
   ↓
Generates 10 questions (30 seconds)
   ↓
Auto-creates answer key
✅ Done!
```

### **Problem 3: Student Needs Multi-Concept Understanding**

**Old Way:**
```
Algebra is in Math book (page 45)
Physics uses algebra (Science book page 89)
Real-world examples (Reference book page 23)

Student has to find ALL three manually ❌
```

**With RAG:**
```
Student: "How is algebra used in real life?"

RAG searches:
- Math textbook
- Science textbook
- Reference book
- Previous year papers

Combines all info into one answer! ✅
```

---

## 🎯 Feature Comparison: EDU vs RESEARCH vs OPEN

| Feature | ANKR EDU | ANKR RESEARCH | ANKR OPEN |
|---------|----------|---------------|-----------|
| **Upload PDFs** | ✅ (up to 10) | ✅ (up to 50) | ✅ (unlimited) |
| **Ask Questions** | ✅ | ✅ | ✅ |
| **Quiz Generation** | ✅ | ❌ | ✅ |
| **Audio Lessons** | ✅ | ❌ | ✅ |
| **Knowledge Graphs** | ✅ | ✅ | ✅ |
| **Study Packages** | ✅ | ❌ | ✅ |
| **Multi-Doc Analysis** | ❌ | ✅ | ✅ |
| **Citation Networks** | ❌ | ✅ | ✅ |
| **Report Generation** | ❌ | ✅ | ✅ |
| **Data Extraction** | ❌ | ✅ | ✅ |
| **Self-Hosted** | ❌ | ❌ | ✅ |
| **Customizable** | ❌ | ❌ | ✅ |
| **Price** | ₹50/mo | ₹500/mo | FREE |

---

## 🚀 Implementation Roadmap

### **Phase 1: Core RAG System (Months 1-2)**
```
✅ Build document ingestion pipeline
✅ Implement vector search
✅ Create Q&A interface
✅ Test with 100 students
```

### **Phase 2: Educational Features (Months 3-4)**
```
✅ Audio lesson generation
✅ Quiz generation
✅ Progress tracking
✅ Study packages
```

### **Phase 3: Visual Learning (Months 5-6)**
```
✅ Knowledge graphs
✅ Mind maps
✅ Concept visualization
✅ Interactive diagrams
```

### **Phase 4: Research Features (Months 7-9)**
```
✅ Multi-document analysis
✅ Report generation
✅ Citation networks
✅ Data extraction
```

### **Phase 5: Open Source Release (Months 10-12)**
```
✅ Code cleanup
✅ Documentation
✅ Community setup
✅ GitHub release
```

---

## 💡 Success Metrics

### **For Students:**
- 70% daily active usage
- 60% complete at least 5 chapters/month
- 15% average grade improvement
- 80% satisfaction score

### **For Teachers:**
- 10 hours/week time saved
- 90% use quiz generator
- 85% say students more engaged

### **For Researchers:**
- 50% faster literature reviews
- 30% more papers analyzed
- 20 hours/week saved

### **For Open Source:**
- 1,000 GitHub stars (Year 1)
- 100 active contributors
- 50 organizations using it

---

## 📞 Next Steps for Pratham

### **1. Design Review (This Week)**
- Review this proposal
- Ask questions
- Suggest changes
- Approve design

### **2. Pilot Planning (Week 2)**
- Select 2 classrooms (100 students)
- Choose textbooks to upload
- Set timeline (2 months)

### **3. Development Starts (Week 3)**
- Build core RAG system
- Implement basic features
- Weekly demos to Pratham

### **4. Testing (Months 2-3)**
- Deploy to pilot classrooms
- Gather feedback
- Fix issues
- Improve features

---

## 🎉 Vision: Impact at Scale

### **Year 1: Pratham Foundation**
- 10,000 students using ANKR EDU
- 500 teachers saving 10 hours/week
- 15% average grade improvement
- Foundation for national scale

### **Year 2: National Rollout**
- 100,000 students across India
- Available in 22 languages
- Partnerships with more NGOs
- Open source version launched

### **Year 3: Global Impact**
- 1 million students worldwide
- Research version for universities
- Open source community thriving
- Education transformed!

---

**This is not just a platform. This is a movement to make learning accessible to every child and researcher in India and beyond.** 🇮🇳🌍

---

**Ready to build this together?** 🚀

**Contact:**
📧 Email: capt.anil.sharma@ankr.digital
🌐 Website: ankr.in

---

*Designed with care for Pratham Foundation and the future of education*

**Document Version:** 1.0 - Design Proposal
**Last Updated:** January 2026
**Status:** Ready for Review & Approval
