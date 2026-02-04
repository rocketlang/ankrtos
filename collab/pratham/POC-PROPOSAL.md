# Pratham x ANKR - POC Proposal

**Prepared by:** ANKR Labs
**For:** Pratham Test Prep
**Date:** January 2026
**Version:** 1.0

---

## Executive Summary

ANKR proposes a Proof of Concept to build an **AI-powered Voice Tutor** for Pratham that enables students to ask doubts in their native language and receive instant, curriculum-grounded responses. This will differentiate Pratham from Byju's/Unacademy clones and unlock Tier 2/3 India market.

---

## The Opportunity

| Problem | ANKR Solution |
|---------|---------------|
| Students can't ask doubts 24x7 | AI-powered instant response |
| Regional language students underserved | 22 Indian languages via BANI |
| Generic AI gives wrong answers | RAG grounds responses in Pratham syllabus |
| Expensive enterprise solutions | ₹500/month pricing |

---

## POC Scope

### What We Will Build

**"Pratham Voice Saathi"** - A voice-enabled AI tutor

### Features (POC)

| Feature | Description |
|---------|-------------|
| **Voice Input** | Student speaks doubt in Hindi |
| **AI Understanding** | SWAYAM processes query |
| **RAG Retrieval** | Pulls relevant content from Pratham materials |
| **Voice Response** | Responds in Hindi with BANI |
| **Basic Analytics** | Track topics, doubts, weak areas |

### Subject Coverage (POC)
- **Single Subject:** Legal Reasoning (CLAT prep)
- **Reason:** Well-defined syllabus, clear right/wrong answers

### Language (POC)
- Hindi + English (bilingual)

### User Base (POC)
- 100 beta students

---

## Technical Approach

```
┌─────────────────────────────────────────────────────────────┐
│                 PRATHAM VOICE SAATHI (POC)                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  STUDENT                                                    │
│  ┌─────────────────────────────────────────────────┐       │
│  │  "Contract mein consideration ka matlab         │       │
│  │   samjhao please"                               │       │
│  └─────────────────────────────────────────────────┘       │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────┐       │
│  │  BANI STT (Hindi Speech → Text)                 │       │
│  └─────────────────────────────────────────────────┘       │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────┐       │
│  │  SWAYAM AI (Query Understanding)                │       │
│  └─────────────────────────────────────────────────┘       │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────┐       │
│  │  EON RAG (Retrieve from Pratham Legal Content)  │       │
│  └─────────────────────────────────────────────────┘       │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────┐       │
│  │  BANI TTS (Response in Hindi Voice)             │       │
│  └─────────────────────────────────────────────────┘       │
│                          │                                  │
│                          ▼                                  │
│  STUDENT HEARS                                              │
│  ┌─────────────────────────────────────────────────┐       │
│  │  "Consideration ka matlab hai ki contract mein  │       │
│  │   dono parties ko kuch dena ya karna padta hai. │       │
│  │   Jaise agar aap ghar khareed rahe ho, toh      │       │
│  │   aapka consideration hai paisa, aur seller ka  │       │
│  │   consideration hai ghar dena..."               │       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Requirements from Pratham

### Content (Must Have)
| Item | Format | Purpose |
|------|--------|---------|
| Legal Reasoning syllabus | PDF/Word | Define scope |
| Study material | PDF/Word | RAG knowledge base |
| Sample questions + answers | Excel/PDF | Q&A training |
| Past year papers | PDF | Pattern analysis |

### Access (Must Have)
| Item | Purpose |
|------|---------|
| Subject Matter Expert | Content validation |
| Student beta group | Testing |
| Feedback mechanism | Iteration |

### Nice to Have
- Recorded video lectures (for transcription)
- Existing doubt bank from students
- Performance data (anonymized)

---

## Deliverables

### Week 4 Delivery

| Deliverable | Description |
|-------------|-------------|
| **Voice Tutor App** | PWA/Web app with voice interface |
| **RAG System** | Indexed Pratham content |
| **Analytics Dashboard** | Basic usage and topic tracking |
| **Demo Video** | Recorded walkthrough |
| **Findings Report** | What worked, what needs improvement |

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Voice Recognition Accuracy | >90% | % queries correctly understood |
| Response Relevance | >85% | SME rating of AI answers |
| Student Satisfaction | >4/5 | Post-session rating |
| Engagement | >10 queries/student | Usage analytics |
| Latency | <3 seconds | End-to-end response time |

---

## Timeline

| Week | Activities |
|------|------------|
| **Week 1** | Content ingestion, RAG setup, voice pipeline |
| **Week 2** | Integration, initial testing, SME review |
| **Week 3** | Beta launch (50 students), feedback collection |
| **Week 4** | Iteration, scale to 100 students, final demo |

**Total Duration:** 4 weeks

---

## Team

### ANKR Side
| Role | Responsibility |
|------|----------------|
| Project Lead | Overall delivery |
| AI Engineer | SWAYAM + RAG integration |
| Voice Engineer | BANI setup |
| Frontend Dev | Student interface |

### Pratham Side
| Role | Responsibility |
|------|----------------|
| Content Owner | Provide materials, validate answers |
| Student Coordinator | Manage beta group |
| Feedback Collector | Gather student input |

---

## Investment

### POC Pricing

| Component | Cost |
|-----------|------|
| Development | ₹0 (partnership investment) |
| Infrastructure | At cost (cloud, API) |
| Content prep | Pratham responsibility |

**ANKR Investment:** Development effort at zero cost for POC
**Pratham Investment:** Content, SME time, beta students

### Post-POC Commercial Model (To Be Discussed)
- Per-student subscription
- Revenue share
- Technology licensing

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Content delay | Start with available digital content |
| Voice accuracy issues | Fallback to text interface |
| Low student adoption | Incentivize beta participation |
| Scope creep | Fixed POC scope, defer to Phase 2 |

---

## Why Partner with ANKR?

| Factor | ANKR Advantage |
|--------|----------------|
| **Voice AI** | BANI: 22 languages, <500ms latency |
| **RAG** | EON: Production-tested knowledge retrieval |
| **Pricing** | 100x cheaper than enterprise |
| **Speed** | 4-week POC delivery |
| **India Focus** | Built for Indian languages, infrastructure |

---

## Next Steps

1. **Pratham Review:** Feedback on this proposal
2. **Content Handover:** Share Legal Reasoning materials
3. **Kickoff Call:** Align on timeline and expectations
4. **Week 1 Start:** Begin development

---

## Contact

**ANKR Labs**
- Lead: Captain Anil Sharma
- Email: [To be added]
- Phone: [To be added]

---

*"Voice Tutor in Your Language - Pratham Powered by ANKR AI"*
