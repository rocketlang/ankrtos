# Pratham Test Prep - Discovery Document

**Collaboration Partner:** Bharat
**ANKR Lead:** Anil
**Date:** January 2026
**Status:** Discovery Phase

---

## 1. Company Overview

### About Pratham Test Prep
- **Founded:** Established player in Delhi-NCR region
- **Focus:** Undergraduate entrance exam preparation (non-science streams)
- **Primary Markets:** North India (Delhi, Chandigarh, Lucknow)
- **Students Served:** 80,000+ students
- **Positioning:** "India NCR's #1 Entrance Prep Institute"

### Exams Covered
| Exam | Full Name | Target |
|------|-----------|--------|
| CUET | Common University Entrance Test | Central/State University Admissions |
| CLAT | Common Law Admission Test | National Law Universities |
| IPMAT | Integrated Program Management Aptitude Test | IIM 5-year programs |
| DU JAT | Delhi University Joint Admission Test | DU BMS/BBA programs |
| Hotel Management | NCHMCT JEE | Hotel Management Institutes |

### Current Digital Offerings
- eLectures and recorded content
- Student Dashboard with handouts, assignments
- 200+ Mock Tests (latest patterns)
- 250+ Practice Tests
- Concept Videos
- Past Year Papers & Analysis

**Source:** [Pratham Online](https://www.prathamonline.com/)

---

## 2. Market Analysis

### Competitive Landscape

| Player | Strengths | Weaknesses |
|--------|-----------|------------|
| **Byju's** | Brand, funding, content library | Generic, expensive, financial troubles |
| **Unacademy** | Large educator base, live classes | Less specialized for UG entrance |
| **Testbook** | Affordable, test-focused | Limited personalization |
| **iQuanta** | 24x7 doubt solving, community | Less structured curriculum |
| **Hitbullseye** | AI analysis, 2+2 model | Limited regional language support |

### Pratham's Current Position
- **Strength:** Regional dominance in North India, strong offline presence
- **Gap:** Limited digital scale, no regional language offerings, basic personalization

### Market Opportunity
- CUET is now **mandatory** for Delhi University, BHU, and other central universities
- Growing demand from Tier 2/3 cities
- Regional language students underserved
- AI-powered personalization is emerging but not dominant

---

## 3. The Opportunity for ANKR

### Problem Statement
Pratham wants to:
1. Expand beyond North India to other regions
2. Create low-cost digital products for price-sensitive students
3. Differentiate from Byju's/Unacademy clones
4. Offer courses in regional languages (Hindi, Marathi, Tamil, Telugu, etc.)

### Why This Matters
- 50%+ of India's UG aspirants are from non-English medium backgrounds
- Existing EdTech largely English-only
- Voice-based learning removes literacy barrier
- Personalization increases completion rates by 40-60%

---

## 4. ANKR Solution Architecture

### Proposed Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    PRATHAM x ANKR PLATFORM                  │
├─────────────────────────────────────────────────────────────┤
│  STUDENT INTERFACE                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Voice Tutor │  │ Smart Tests │  │ Dashboard   │         │
│  │ (Regional)  │  │ (Adaptive)  │  │ (Analytics) │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  ANKR AI LAYER                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  SWAYAM     │  │    RAG      │  │    MCP      │         │
│  │  (Voice AI) │  │ (Knowledge) │  │ (Orchestr.) │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  CONTENT LAYER                                              │
│  ┌─────────────────────────────────────────────────┐       │
│  │ Pratham Course Content (Syllabus, Videos, Q&A)  │       │
│  └─────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

#### 4.1 SWAYAM - Voice AI Engine
**What it does:**
- Vernacular speech recognition (Hindi, Tamil, Telugu, Marathi, Bengali)
- Text-to-speech in regional accents
- Conversational AI for doubt resolution

**Student Experience:**
- Student asks doubt in Hindi: "Yeh question samajh nahi aaya"
- System understands, retrieves relevant content, responds in Hindi
- Tracks what topics cause confusion

#### 4.2 RAG - Knowledge Retrieval System
**What it does:**
- Indexes Pratham's entire course content
- Retrieves contextually relevant explanations
- Grounds AI responses in actual syllabus (prevents hallucination)

**Research Backing:**
- RAG-based tutoring systems achieve 86% answer accuracy
- Reduces hallucination risk significantly vs. vanilla LLMs
- Enables real-time knowledge updates

**Source:** [ScienceDirect - RAG for Educational Applications](https://www.sciencedirect.com/science/article/pii/S2666920X25000578)

#### 4.3 MCP - Model Context Protocol
**What it does:**
- Orchestrates multiple AI tools in unified workflow
- Voice → RAG → Test Generator → Analytics (seamless)
- Maintains context across student sessions

#### 4.4 Adaptive Testing Engine
**What it does:**
- Generates questions based on student's weak areas
- Adjusts difficulty dynamically
- Provides detailed performance analytics

---

## 5. Killer Features (Differentiation)

### 5.1 "Voice Tutor in Your Language"
**Concept:** Student speaks doubt in their native language, AI responds using Pratham's course content

**Why it's different:**
- Byju's: Pre-recorded videos, no interaction
- Unacademy: Live classes, but scheduled and expensive
- ANKR+Pratham: 24x7 personalized tutor in your language

**Implementation:**
1. Student opens app, speaks: "Contract law ka consideration kya hota hai?"
2. SWAYAM transcribes Hindi speech
3. RAG retrieves relevant section from CLAT legal reasoning module
4. Response generated in Hindi, spoken back
5. Follow-up questions logged for weak area analysis

### 5.2 Personalized Study Plans
**Based on:**
- Mock test performance
- Topic-wise accuracy
- Time spent per question type
- Historical weak areas

**Output:**
- Daily study schedule optimized for student
- Recommended topics to revise
- Predicted score improvement trajectory

### 5.3 Exam Pattern Intelligence
**What it does:**
- Analyzes past 5 years of CUET/CLAT/IPMAT papers
- Identifies high-frequency topics
- Predicts likely question patterns
- Alerts students to focus areas

---

## 6. Technical Requirements

### From Pratham
- [ ] Course content in digital format (PDFs, videos, transcripts)
- [ ] Question bank with categorization (topic, difficulty, exam)
- [ ] Historical student performance data (anonymized)
- [ ] Subject matter expert access for content validation

### From ANKR
- [ ] SWAYAM voice AI deployment
- [ ] RAG pipeline setup and content indexing
- [ ] MCP integration framework
- [ ] Analytics dashboard development
- [ ] Regional language model fine-tuning

### Infrastructure
- Cloud hosting (AWS/GCP)
- Vector database for RAG (Pinecone/Weaviate)
- Audio processing pipeline
- Mobile app (React Native/Flutter)

---

## 7. Competitive Moat

| Feature | Byju's | Unacademy | Testbook | ANKR+Pratham |
|---------|--------|-----------|----------|--------------|
| Regional Languages | Limited | No | No | **Yes (5+)** |
| Voice Interaction | No | No | No | **Yes** |
| RAG-Grounded | No | No | No | **Yes** |
| Adaptive Testing | Basic | Basic | Yes | **Advanced** |
| 24x7 Doubt Solving | No | No | No | **Yes (AI)** |
| Price Point | High | Medium | Low | **Low** |

**Moat:** Combination of regional language + voice + RAG-grounded personalization doesn't exist in market.

---

## 8. Revenue Model Options

### Option A: B2B2C (Pratham White-Label)
- ANKR provides tech platform
- Pratham maintains brand, content, marketing
- Revenue share on subscriptions

### Option B: Co-Branded Product
- "Pratham Powered by ANKR AI"
- Joint go-to-market
- Higher revenue share for ANKR

### Option C: Technology Licensing
- Per-student licensing fee
- SLA-based pricing
- Lower risk, predictable revenue

---

## 9. Implementation Roadmap

### Phase 1: POC (8 weeks)
- [ ] Single subject (Legal Reasoning for CLAT)
- [ ] Hindi language only
- [ ] Basic voice Q&A with RAG
- [ ] 100 beta students

### Phase 2: MVP (12 weeks)
- [ ] All CLAT subjects
- [ ] Hindi + English
- [ ] Adaptive testing integration
- [ ] Mobile app
- [ ] 1,000 students

### Phase 3: Scale (Ongoing)
- [ ] CUET, IPMAT subjects
- [ ] 3+ regional languages
- [ ] Full analytics suite
- [ ] 10,000+ students

---

## 10. Success Metrics

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Voice Query Success Rate | >85% | Core feature reliability |
| Content Relevance Score | >90% | RAG accuracy |
| Student Engagement | >30 min/day | Stickiness |
| Completion Rate | >60% | vs. 10-15% industry avg |
| NPS Score | >50 | Word of mouth |
| Cost Per Student | <₹500/month | Unit economics |

---

## 11. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Voice recognition accuracy in noisy environments | High | Noise cancellation, fallback to text |
| Content quality inconsistency | Medium | SME review pipeline |
| Student adoption of voice | Medium | Hybrid voice+text interface |
| Regional accent variations | High | Accent-specific fine-tuning |
| Pratham content digitization delays | High | Start with already-digital content |

---

## 12. Next Steps

1. **Immediate:** Schedule deep-dive call with Pratham team
2. **Week 1:** Get sample content for RAG indexing trial
3. **Week 2:** Voice AI demo with Hindi legal reasoning content
4. **Week 3:** Technical architecture review
5. **Week 4:** POC scope finalization and timeline

---

## 13. References

- [Pratham Test Prep Official](https://www.prathamonline.com/)
- [RAG for Educational Applications - ScienceDirect](https://www.sciencedirect.com/science/article/pii/S2666920X25000578)
- [KG-RAG Adaptive AI Tutor - arXiv](https://arxiv.org/abs/2311.17696)
- [LPITutor RAG System - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC12453719/)
- [NEETI AI Assistant - NLTI](https://www.clatnlti.com/blog-details/166/smart-ai-assistant-for-clat-nlsat-cuet-llb-neeti-by-nlti)

---

*Document Version: 1.0*
*Last Updated: January 2026*
