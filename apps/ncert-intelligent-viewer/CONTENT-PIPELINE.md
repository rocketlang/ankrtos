# NCERT Content Pipeline

Complete system for downloading, converting, and enriching NCERT textbooks with AI-powered learning features.

## 📋 Overview

The content pipeline transforms NCERT PDFs into intelligent, interactive markdown content with:
- ✓ **Fermi Estimation Questions** - Order-of-magnitude reasoning
- ✓ **Socratic Dialogues** - Guided discovery learning
- ✓ **Logic Challenges** - Critical thinking exercises
- ✓ **Hindi Translation** - Bilingual support

## 🧪 Test Results (Verified Working)

```bash
cd scripts && npx tsx test-question-generation.ts
```

**All 4 AI Services: ✅ WORKING**

### Sample Output:

**1. Fermi Questions** (2 generated)
```
"A typical LED bulb... operates at 220 volts. Estimate the number
of electrons passing through... every second"
→ Order of magnitude: 10^17 electrons/second
→ 3 hints provided
```

**2. Socratic Tutor** (Opening + Follow-up)
```
Opening: "Imagine you're playing a video game and suddenly your phone
charger stops working..."

Follow-up: "What determines how much current actually flows when that
push is applied?"
```

**3. Logic Challenges** (2 generated)
```
Type: CONDITIONAL
"If a material is a good conductor, then it has low resistance..."
→ 4 options with correct answer marked
→ Full explanation provided

Type: NECESSARY-SUFFICIENT
"For current to flow through a circuit, there must be potential difference"
→ Tests understanding of logical conditions
```

**4. Translation** (English → Hindi)
```
Original: "Electric Current and Circuit"
Translated: "विद्युत धारा और परिपथ"
Duration: ~8 seconds
```

## 🚀 Quick Start

### Prerequisites

```bash
# Install dependencies
cd /root/apps/ncert-intelligent-viewer/scripts
npm install

# Ensure NCERT backend is running
pm2 restart ncert-backend
```

### Method 1: Test with Existing Content

```bash
# Test all AI services with Chapter 12 (Electricity)
npm run test-questions
```

### Method 2: Manual Ingestion

For pre-existing markdown files:

```bash
# Process all markdown files in content/converted-md/
npm run ingest
```

Expected output:
```
🤖 Processing: Electricity
   Class 10 science - Chapter 12
   → Generating Fermi questions...
   ✓ Fermi: 3 questions → ch12-fermi.json
   → Generating Logic challenges...
   ✓ Logic: 3 challenges → ch12-logic.json
   → Translating to Hindi...
   ✓ Translation: Hindi version → ch12-electricity-hi.md
   ✅ Completed: 3/3 AI services successful
```

### Method 3: Full PDF Pipeline

Download PDFs, convert to markdown, generate questions:

```bash
# Process Class 10 books
npm run pipeline:class10

# Process all books
npm run pipeline
```

## 📁 Directory Structure

```
content/
├── raw-pdfs/              # Original NCERT PDFs
│   └── class10-science.pdf
├── converted-md/          # Markdown conversions
│   └── class-10/
│       └── science/
│           ├── full-book.md
│           ├── ch1-chemical-reactions.md
│           ├── ch12-electricity.md
│           └── images/
├── questions/             # AI-generated questions
│   └── class-10/
│       └── science/
│           ├── ch12-fermi.json
│           ├── ch12-logic.json
│           └── ch12-socratic.json
└── class-10/              # Current working directory
    └── science/
        └── chapters/
            └── ch12-electricity.md  ✓ Ready
```

## 📚 Available Books (Catalog)

### Class 10
- **Science** (16 chapters)
  - Ch 1: Chemical Reactions and Equations
  - Ch 2: Acids, Bases and Salts
  - ...
  - Ch 12: Electricity ✓ (Sample content ready)
  - Ch 13: Magnetic Effects of Electric Current

- **Mathematics** (15 chapters)
  - Ch 1: Real Numbers
  - Ch 2: Polynomials
  - ...

### Class 12
- Physics (15 chapters)
- Chemistry (16 chapters)
- Mathematics (13 chapters)

## 🔧 Scripts Reference

| Script | Command | Purpose |
|--------|---------|---------|
| **Test Questions** | `npm run test-questions` | Verify all AI services work |
| **Manual Ingest** | `npm run ingest` | Process existing markdown |
| **Full Pipeline** | `npm run pipeline` | Download → Convert → Generate |
| **Class 10 Only** | `npm run pipeline:class10` | Process Class 10 books |

## 🤖 AI Services Configuration

**Backend**: `http://localhost:4090`
**AI Proxy**: `http://localhost:4444` (Claude Sonnet 4.5)

### Service Endpoints

```typescript
POST /api/ncert/questions/fermi
Body: {
  chapterId: "class10-science-ch12",
  section: "Electric Current",
  content: "...",  // First 2000 chars
  difficulty: "medium",
  count: 3
}

POST /api/ncert/questions/socratic
Body: {
  sessionId: "unique-session-id",
  chapterId: "class10-science-ch12",
  concept: "Ohms Law",
  userMessage: "...",  // Optional
  action: "start" | "continue"
}

POST /api/ncert/questions/logic
Body: {
  chapterId: "class10-science-ch12",
  concept: "Electricity",
  content: "...",
  difficulty: "medium",
  count: 3
}

POST /api/ncert/translate
Body: {
  text: "Electric current is the flow of electrons",
  from: "en",
  to: "hi"
}
```

## 📊 Generation Metrics

Based on Chapter 12 (Electricity) test:

| Metric | Value |
|--------|-------|
| **Content Length** | 9,973 characters |
| **Fermi Questions** | 2 generated (17s) |
| **Socratic Exchanges** | 2 turns (12s) |
| **Logic Challenges** | 2 generated (19s) |
| **Translation Speed** | 500 chars in 8.5s |
| **Success Rate** | 100% (4/4 services) |

## 🔄 Workflow

### For New Content

1. **Prepare**: Place NCERT PDF in `content/raw-pdfs/`
2. **Convert**: Run `npm run pipeline` (uses Pandoc)
3. **Generate**: AI creates questions automatically
4. **Review**: Check `content/questions/` for output
5. **Deploy**: Content ready for frontend

### For Existing Markdown

1. **Place**: Put markdown in `content/converted-md/class-X/subject/`
2. **Name**: Format as `chN-title.md` (e.g., `ch12-electricity.md`)
3. **Run**: `npm run ingest`
4. **Done**: Questions generated in `content/questions/`

## 🎯 Next Steps

1. **Download all NCERT PDFs** (Class 10 Science, Math - priority)
2. **Convert with Pandoc** (batch processing)
3. **Generate questions** (automated via pipeline)
4. **Update backend** (load questions into database)
5. **Deploy frontend** (connect to AI services)

## 🐛 Troubleshooting

**Backend not accessible?**
```bash
pm2 status ncert-backend
pm2 restart ncert-backend
pm2 logs ncert-backend --lines 50
```

**Pandoc not installed?**
```bash
apt-get install pandoc -y
pandoc --version
```

**AI services failing?**
```bash
# Check AI Proxy
pm2 status ai-proxy
curl http://localhost:4444/health

# Test individual service
curl -X POST http://localhost:4090/api/ncert/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello","from":"en","to":"hi"}'
```

## 📈 Scaling Plan

**Phase 1** (Current): Class 10 Science Ch 12 ✅
**Phase 2** (Week 1): Class 10 Science (all 16 chapters)
**Phase 3** (Week 2): Class 10 Math (15 chapters)
**Phase 4** (Month 1): Class 10 Complete (3 subjects)
**Phase 5** (Month 2): Class 12 Science
**Phase 6** (Month 3): All 150+ NCERT books

**Estimated**: ~10 minutes per chapter for AI generation
**Total**: 150 books × 15 avg chapters × 10 min = ~375 hours (can parallelize)

## 🎓 Quality Assurance

Each generated question set includes:
- ✓ Contextual relevance (tied to chapter content)
- ✓ Age-appropriate difficulty (Class 10-12)
- ✓ Pedagogical correctness (Fermi/Socratic/Logic principles)
- ✓ Language quality (English + Hindi)
- ✓ Explanation clarity (hints, reasoning, answers)

---

**Status**: ✅ Pipeline Ready | AI Services Verified | Sample Content Working
**Last Updated**: 2026-02-08
**Next Milestone**: Process all Class 10 Science chapters
