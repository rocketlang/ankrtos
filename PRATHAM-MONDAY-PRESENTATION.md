# ANKR AI Learning Platform - Technical Proposal for Pratham

**Prepared for:** Ankit Kapoor, Pranav (Pratham Foundation)
**Date:** Monday, January 27, 2026
**Presented by:** Captain Anil Sharma, ANKR Labs

---

## Executive Summary

We've completed the initial analysis of your Quantitative Aptitude content (347 questions, 12 topic clusters). Based on this foundation, we're proposing a modern AI-powered learning system that combines:

- **RAG (Retrieval-Augmented Generation)** for context-aware tutoring
- **Multi-LLM architecture** for cost optimization and quality
- **Dual pedagogical modes** (Explanatory + Socratic)
- **Real-time analytics** for teachers and administrators

This document outlines **three possible directions** we can take, with technical approaches for each.

---

## Background: Your Content Analysis

**What we extracted from your PDF:**
- 347 individual questions with full solutions
- 12 topic clusters (HCF/LCM, Percentages, Time & Distance, etc.)
- Step-by-step explanations with methodology
- Difficulty progression patterns
- Cross-topic relationships and dependencies

**Technical Insight:** This structure is ideal for RAG-based systems, where the LLM can retrieve relevant examples and explanations from your content to provide contextually accurate responses.

---

## Three Possible Directions

### Direction 1: Basic AI Tutor (NotebookLM Approach)

**What this is:**
A conversational AI tutor that answers student questions using your content as reference material, similar to Google's NotebookLM approach.

**Technical Architecture:**

```
Student Question
    ↓
Vector Search (RAG) → Find relevant content from your PDF
    ↓
LLM (GPT-4o) → Generate explanation using retrieved context
    ↓
Response to Student (Hindi/English)
```

**Key Components:**
- **RAG Pipeline:** pgvector database storing embeddings of your 347 questions
- **LLM Backend:** GPT-4o for Hindi language support
- **Simple UI:** Text-based chat interface (web + mobile)

**Pros:**
- ✅ Quick to implement (2-3 weeks)
- ✅ Works well for Q&A and doubt clarification
- ✅ Low technical complexity

**Cons:**
- ❌ No pedagogical differentiation (same approach for all students)
- ❌ Higher AI costs (GPT-4o for everything)
- ❌ Limited learning analytics

**Estimated Cost:**
- Development: ₹2,00,000 (one-time)
- Per student: ₹75/month (AI costs)
- Timeline: 3 weeks

---

### Direction 2: Dual-Mode AI Tutor (Socratic + Explanatory) ⭐ RECOMMENDED

**What this is:**
An intelligent tutoring system with **two pedagogical modes** based on student needs and learning phase:

1. **Explanatory Mode (Norton Method):** Clear, step-by-step explanations for concept learning
2. **Socratic Mode (Guide Approach):** Question-driven guidance for practice and deep understanding

**Technical Architecture:**

```
Student Question
    ↓
Context Analysis → Determine: Learning phase? Practice phase? Struggling?
    ↓
Mode Selection Logic:
├── If learning new concept → Explanatory Mode (GPT-4o)
├── If practicing → Socratic Mode (Gemini 2.0 Flash)
└── If verifying answer → Quick Check (Gemini Flash)
    ↓
RAG Retrieval → Get relevant examples from your content
    ↓
Multi-LLM Backend → Route to optimal model
    ↓
Response (with auto-progression between modes)
```

**Key Technical Innovations:**

**1. Dual Pedagogical Modes:**

**Explanatory Mode (Default for beginners):**
```
Student: "HCF aur LCM mein kya farak hai?"

System:
- Uses RAG to fetch HCF/LCM examples from your PDF
- GPT-4o generates clear Hindi explanation
- Provides step-by-step solution
- Offers practice problems
```

**Socratic Mode (For advanced students):**
```
Student: "24 aur 36 ka HCF kaise nikalun?"

System (doesn't give answer directly):
- "पहले बताओ, 24 को किन numbers से divide कर सकते हो?"
- Student responds...
- "अच्छा! अब 36 को?"
- Student responds...
- "बहुत बढ़िया! अब common numbers में से सबसे बड़ा?"
- Guides to answer through questions
```

**Auto-Progression Logic:**
```
If student.consecutiveCorrect >= 3:
    suggest_socratic_mode()  # "Ready for challenge mode?"
```

**2. Multi-LLM Architecture (Cost Optimization):**

Instead of using GPT-4o for everything (expensive), we route intelligently:

| Task Type | Best LLM | Cost | Reasoning |
|-----------|----------|------|-----------|
| Hindi explanation | GPT-4o | $0.015 | Superior Hindi understanding |
| English explanation | Gemini Flash | $0.003 | 5x cheaper, good quality |
| Math problem generation | Gemini Flash | $0.002 | Fast, structured output |
| Answer verification | Gemini Flash | $0.001 | Simple task, cheapest |
| Step-by-step solution | Gemini Flash | $0.003 | Procedural, fast |

**Cost Impact:**
- Current: $3.00/student/month (all GPT-4o)
- Optimized: $0.82/student/month (multi-LLM)
- **Savings: 72.8%** 💰

**3. RAG with Context Compression:**

```python
# When student asks a question
relevant_chunks = vector_search(question, top_k=5)

# Instead of sending all context (uses more tokens):
compressed_context = llm.summarize(relevant_chunks)

# Reduces tokens by 70%, saves cost
```

**4. Teacher Analytics Dashboard:**

```
Real-time metrics:
- Which topics students struggle with (heatmap)
- Common misconceptions across class
- Student-by-student progress tracking
- Recommended interventions
```

**Pros:**
- ✅ Pedagogically superior (adapts to student level)
- ✅ 73% cost savings vs basic approach
- ✅ Auto-progression (builds confidence → challenge)
- ✅ Teacher insights (data-driven interventions)
- ✅ Works offline (Ollama fallback for low-connectivity)

**Cons:**
- ⚠️ More complex implementation (4-5 weeks)
- ⚠️ Requires teacher training on dual modes

**Estimated Cost:**
- Development: ₹3,50,000 (one-time)
- Per student: ₹50/month (optimized AI costs)
- Timeline: 5 weeks

---

### Direction 3: Full Adaptive Learning Platform (Fermi Approach)

**What this is:**
A comprehensive adaptive learning system that tracks every interaction, builds individual student profiles, and continuously optimizes the learning path.

**Technical Architecture:**

```
Student Interaction
    ↓
Multi-Modal Input (text, voice, handwriting)
    ↓
Intent Classification → What is student trying to do?
    ↓
Knowledge Graph → What concepts are related?
    ↓
Student Model (ML) → What does this student know/not know?
    ↓
Pedagogical Engine:
├── Select optimal mode (Explain/Socratic/Practice)
├── Select difficulty level
├── Generate personalized content
└── Predict struggle points
    ↓
Multi-LLM Execution
    ↓
Feedback Loop → Update student model
    ↓
Teacher Dashboard (real-time insights)
```

**Advanced Features:**

**1. Knowledge Graph:**
```
Concepts as nodes:
- HCF → LCM → Fractions → Ratios → Percentages

Student mastery tracked per node:
- HCF: 85% mastery
- LCM: 60% mastery (recommend more practice)
```

**2. Predictive ML:**
```python
# Predict if student will struggle on next topic
def predict_struggle(student_history, next_topic):
    features = extract_features(student_history)
    model = trained_ml_model.predict(features)
    if model.struggle_probability > 0.7:
        recommend_intervention()
```

**3. Handwriting Support (tablet users):**
```
Student draws problem on tablet
    ↓
OCR (Optical Character Recognition)
    ↓
Parse mathematical notation
    ↓
Analyze approach (not just answer)
    ↓
Provide feedback on methodology
```

**4. Multi-Lingual Voice:**
```
Student speaks in Hindi
    ↓
Speech-to-Text (Whisper API)
    ↓
Process with LLM
    ↓
Text-to-Speech response (Hindi voice)
```

**Pros:**
- ✅ Most sophisticated approach
- ✅ Truly personalized learning
- ✅ Detailed analytics for research
- ✅ Multi-modal (text, voice, handwriting)
- ✅ Predictive interventions

**Cons:**
- ❌ Expensive to build (₹8-10 lakhs)
- ❌ Requires tablets for full features
- ❌ Longer timeline (3 months)
- ❌ Complex for teachers to use

**Estimated Cost:**
- Development: ₹8,00,000 (one-time)
- Per student: ₹75/month
- Timeline: 12 weeks

---

## Technical Deep-Dive: Key Concepts

### 1. RAG (Retrieval-Augmented Generation)

**Problem:** LLMs don't know your specific content (Pratham Quantitative Aptitude book)

**Solution:** RAG pipeline

```
Step 1: Convert your PDF to embeddings (vector representations)
- Each question/solution → 1536-dimensional vector
- Stored in pgvector database

Step 2: When student asks question
- Convert question to vector
- Find similar content from your book (cosine similarity)
- Retrieve top 5 relevant chunks

Step 3: Send to LLM with context
- "Here are relevant examples from the textbook: [chunks]"
- "Now answer student's question using this context"

Result: Responses grounded in your curriculum, not generic
```

**Why this matters:**
- ✅ Ensures answers match your teaching methodology
- ✅ Uses your worked examples and notation
- ✅ Stays within curriculum boundaries

---

### 2. Multi-LLM Architecture

**Problem:** Using one LLM for everything is expensive and suboptimal

**Solution:** Route different tasks to different LLMs

```javascript
function selectModel(taskType, language) {
  if (language === 'hindi') {
    return 'gpt-4o';  // Best for Hindi
  }

  switch(taskType) {
    case 'problem_generation':
      return 'gemini-2.0-flash';  // Fast, cheap, structured
    case 'complex_explanation':
      return 'claude-sonnet';     // Best reasoning
    case 'simple_query':
      return 'groq-llama';        // Cheapest
    default:
      return 'gemini-2.0-flash';  // Good default
  }
}
```

**Available LLMs:**
- **GPT-4o (OpenAI):** Best for Hindi, conversations, complex reasoning
- **Gemini 2.0 Flash (Google):** Fast, cheap, good for math/structured tasks
- **Claude 3.5 Sonnet (Anthropic):** Best for step-by-step explanations
- **Groq (Llama 3.3):** Extremely fast, cheap for simple tasks
- **Ollama (Local):** Offline mode, free

**Cost Optimization Example:**
```
100 student requests per month:
- 20 Hindi explanations → GPT-4o ($0.30)
- 50 math problems → Gemini Flash ($0.10)
- 30 verifications → Gemini Flash ($0.03)

Total: $0.43 vs $1.50 (all GPT-4o) = 71% savings
```

---

### 3. Socratic Method (Pedagogical Approach)

**Traditional Tutoring (Explanatory):**
```
Student: "What is HCF?"
Tutor: "HCF stands for Highest Common Factor. It is the largest number that divides both numbers completely. For example..."
```

**Socratic Method (Question-driven):**
```
Student: "What is HCF of 12 and 18?"
Tutor: "Good question! Let me guide you..."
Tutor: "First, what numbers divide 12?"
Student: "1, 2, 3, 4, 6, 12"
Tutor: "Excellent! Now what numbers divide 18?"
Student: "1, 2, 3, 6, 9, 18"
Tutor: "Great! Which numbers appear in both lists?"
Student: "1, 2, 3, 6"
Tutor: "Perfect! Which is the highest?"
Student: "6!"
Tutor: "Exactly! So HCF(12, 18) = 6. You discovered it yourself!"
```

**Why this works:**
- ✅ Deeper understanding (student discovers vs told)
- ✅ Better retention (active vs passive learning)
- ✅ Builds problem-solving skills

**When to use each:**
- Explanatory: New concept, struggling student, confidence building
- Socratic: Practice phase, advanced student, assessment

**Our Innovation:** Let student/teacher choose mode, auto-suggest progression

---

### 4. NotebookLM Comparison

**Google NotebookLM (Consumer tool):**
```
Upload documents
    ↓
Ask questions
    ↓
Get AI summaries and answers
```

**Limitations for Education:**
- ❌ No pedagogical modes (one-size-fits-all)
- ❌ No progress tracking
- ❌ No teacher analytics
- ❌ Individual use only (not classroom)
- ❌ No curriculum alignment

**ANKR Approach (Educational platform):**
```
Curriculum-aligned content (your PDF)
    ↓
Dual pedagogical modes (Explain/Socratic)
    ↓
Student progress tracking
    ↓
Teacher analytics dashboard
    ↓
Classroom deployment (100s of students)
```

**Positioning:**
- NotebookLM = "AI research assistant for individuals"
- ANKR = "AI tutor for classrooms with curriculum alignment"

---

## Proposed Path Forward

### Recommendation: Direction 2 (Dual-Mode AI Tutor)

**Why this is optimal for Pratham:**

1. **Pedagogically Sound:**
   - Explanatory mode for learning (builds confidence)
   - Socratic mode for practice (deepens understanding)
   - Auto-progression (guided journey)

2. **Cost-Effective:**
   - ₹50/student/month (vs ₹75-100 for basic approach)
   - 73% AI cost savings through multi-LLM routing
   - Scales efficiently to thousands of students

3. **Teacher-Friendly:**
   - Dashboard shows where students struggle
   - Actionable insights (not just data)
   - Reduces doubt-resolution workload

4. **Proven Approach:**
   - Combines best of NotebookLM (RAG) + Fermi (Socratic) + ANKR (accessibility)
   - Based on educational research
   - Adaptable to student needs

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Technical Tasks:**
- [ ] Set up RAG pipeline (pgvector + embeddings)
- [ ] Integrate multi-LLM backend
- [ ] Build basic chat interface
- [ ] Test with Pratham content

**Deliverable:** Working prototype with your PDF content

---

### Phase 2: Dual Modes (Week 3-4)
**Technical Tasks:**
- [ ] Implement explanatory mode (GPT-4o for Hindi)
- [ ] Implement Socratic mode (guided questioning)
- [ ] Build mode selection logic
- [ ] Add auto-progression triggers

**Deliverable:** Students can switch between modes

---

### Phase 3: Analytics (Week 4-5)
**Technical Tasks:**
- [ ] Build teacher dashboard
- [ ] Topic-wise performance tracking
- [ ] Common misconception detector
- [ ] Progress reports (weekly)

**Deliverable:** Teachers get actionable insights

---

### Phase 4: Pilot Launch (Week 5-6)
**Deployment:**
- [ ] Deploy to 100 Pratham students
- [ ] Teacher training (2-hour session)
- [ ] Collect feedback
- [ ] Monitor usage and costs

**Success Metrics:**
- 60%+ weekly active usage
- 40%+ improvement in test scores
- 50%+ teacher time savings on doubt resolution

---

## Technical Stack (Proposed)

### Backend:
```
- Node.js + Fastify (API server)
- PostgreSQL + pgvector (RAG storage)
- Redis (caching, session management)
- LangChain (LLM orchestration)
```

### LLM Providers:
```
- OpenAI GPT-4o (Hindi explanations)
- Google Gemini 2.0 Flash (Math, EN explanations)
- Anthropic Claude (Complex reasoning)
- Groq (Fast, cheap tasks)
- Ollama (Offline fallback)
```

### Frontend:
```
- React (web app)
- React Native (mobile app)
- Tailwind CSS (styling)
- Apollo Client (GraphQL)
```

### Infrastructure:
```
- Docker containers
- PM2 process manager
- Nginx reverse proxy
- PostgreSQL database (existing)
```

---

## Pricing Models (Choose One)

### Model A: Per-Student SaaS (Recommended)
**Pricing:** ₹50/student/month
**Minimum:** 100 students
**Contract:** Monthly rolling (can cancel anytime)

**What's included:**
- Unlimited AI tutoring access
- Both pedagogical modes
- Teacher analytics dashboard
- Mobile + web access
- WhatsApp bot (optional)

**Your investment:** ₹5,000/month for 100 students

---

### Model B: Annual License
**Pricing:** ₹4,00,000/year (up to 500 students)
**Payment:** One-time annual
**Contract:** 12 months

**What's included:**
- Everything in Model A
- Priority support
- Quarterly feature updates
- Custom integrations

**Your investment:** ₹4L upfront, ₹67/student/month effective

---

### Model C: Pilot + Revenue Share
**Pilot:** ₹50,000 (100 students, 2 months)
**Then:** 30% revenue share if you charge students

**Example:**
- You charge students ₹100/month
- We take ₹30, you keep ₹70
- Zero risk, aligned incentives

**Your investment:** ₹50K pilot only

---

## Questions for Discussion

To help us refine the approach, we'd love to understand:

**1. Technical Environment:**
- Do you have existing LMS or tech infrastructure?
- What devices do most students use? (smartphones, tablets, laptops)
- Do students have reliable internet, or is offline mode important?

**2. Pedagogical Preferences:**
- Do you prefer explanatory or Socratic approach by default?
- Should students choose their mode, or teachers decide?
- What role should teachers play? (monitor only, or actively guide)

**3. Deployment:**
- How many students for initial pilot? (we recommend 100)
- Timeline expectations? (we propose 5-6 weeks)
- Any specific exam/curriculum alignment needed beyond QA?

**4. Success Criteria:**
- What would make this a success for Pratham?
- How do you currently measure learning outcomes?
- What's your comfort level with AI/tech adoption?

---

## Next Steps

### Option A: Deep-Dive Technical Discussion
- 1-hour call with our tech team
- Walkthrough of RAG architecture
- Live demo of multi-LLM routing
- Q&A on implementation

### Option B: Quick Prototype
- We build a minimal prototype (1 week)
- Using your PDF content
- You test with 5-10 students
- Decide based on results

### Option C: Pilot Proposal
- We formalize Direction 2 approach
- 100 students, 2 months, ₹50K
- Full deployment with analytics
- Success metrics tracking

---

## Why ANKR?

**Technical Expertise:**
- Built 50+ AI applications across domains
- Deep expertise in RAG, multi-LLM, embeddings
- Production-grade systems (not MVPs)

**Education Focus:**
- Understanding of Indian curriculum and pedagogy
- Hindi language support (not just translation)
- Teacher-centric design (not just student-facing)

**Cost-Conscious:**
- Multi-LLM architecture saves 73% on AI costs
- Can offer ₹50/student (vs ₹200-500 from competitors)
- Scalable to lakhs of students

**Proven Track Record:**
- Logistics AI systems handling 10,000+ transactions/day
- Voice AI in Hindi (SunoKahoBolo project)
- Real-time analytics platforms

---

## Appendix: Technical Glossary

**RAG (Retrieval-Augmented Generation):**
Technique where LLM retrieves relevant information from a knowledge base before generating response. Ensures grounding in specific curriculum.

**LLM (Large Language Model):**
AI model trained on vast text data (GPT-4o, Gemini, Claude). Can understand and generate human-like text.

**Vector Embeddings:**
Mathematical representation of text as numbers. Allows semantic search (finding similar meaning, not just keywords).

**pgvector:**
PostgreSQL extension for storing and searching vector embeddings. Industry-standard for RAG systems.

**Multi-LLM Architecture:**
Using multiple AI models for different tasks to optimize cost and quality. Example: GPT-4o for Hindi, Gemini for math.

**Socratic Method:**
Teaching approach where instructor asks questions to guide student to discover answer themselves, rather than directly explaining.

**Context Compression:**
Technique to reduce amount of text sent to LLM (saves tokens = saves cost). Summarize or extract key points from retrieved context.

**Token:**
Unit of text for LLM pricing. Roughly 1 token = 0.75 words. GPT-4o costs $0.0025 per 1K input tokens.

---

## Contact

**For technical questions:**
Captain Anil Sharma
capt.anil.sharma@powerpbox.org
+91-[YOUR NUMBER]

**For demos/pilots:**
Schedule at your convenience - we're flexible!

**Documentation:**
All technical docs available at: https://ankr.in/project/documents/

---

**Looking forward to building the future of AI education together!**

---

**Document Version:** 1.0
**Date:** January 27, 2026 (for Monday presentation)
**Prepared by:** ANKR Labs
