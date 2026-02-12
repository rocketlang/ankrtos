# NCERT Complete Exercise Extraction Plan

## Objective
Extract ALL exercises from ALL NCERT textbooks across ALL subjects and ALL classes (6-12), with Class 10 as top priority.

## Scope

### Classes
- Class 6, 7, 8, 9, **10 (PRIORITY)**, 11, 12

### Subjects by Class

**Class 10 (PRIORITY):**
1. Mathematics (15 chapters) - CRITICAL
2. Science (16 chapters)
3. Social Science (History, Geography, Political Science, Economics)
4. English (First Flight, Footprints without Feet)
5. Hindi (Sparsh, Sanchayan)

**Classes 6-9:**
- Mathematics
- Science
- Social Science
- English
- Hindi

**Classes 11-12:**
- Mathematics (Part I & II)
- Physics (Part I & II)
- Chemistry (Part I & II)
- Biology
- Computer Science
- Accountancy
- Business Studies
- Economics
- History
- Geography
- Political Science
- Psychology
- Sociology
- English

### Estimated Exercise Count
- **Class 10 Mathematics alone**: ~250-300 exercises
- **Class 10 All subjects**: ~800-1,000 exercises
- **All classes, all subjects**: ~8,000-10,000 exercises

## Execution Strategy

### Phase 1: Class 10 Complete (PRIORITY) - Days 1-2
**Target: 800-1,000 exercises**

#### Day 1 Morning: Mathematics (Top Priority)
1. Download: NCERT Class 10 Mathematics PDF
2. Extract: ~250 exercises across 15 chapters
3. Ingest: Database insertion
4. Solve: Run AI solver
5. Verify: Spot-check solutions

#### Day 1 Afternoon: Science
1. Download: NCERT Class 10 Science PDF
2. Extract: ~200 exercises across 16 chapters
3. Ingest & Solve

#### Day 2 Morning: Social Science
1. Download: 4 PDFs (History, Geography, Civics, Economics)
2. Extract: ~250 exercises combined
3. Ingest & Solve

#### Day 2 Afternoon: English & Hindi
1. Download: English (2 books), Hindi (2 books)
2. Extract: ~150 exercises combined
3. Ingest & Solve

### Phase 2: Classes 11-12 (High Priority) - Days 3-5
**Target: 4,000-5,000 exercises**

These are board exam classes with extensive content.

#### Science Stream Priority:
- Mathematics (Part I, II)
- Physics (Part I, II)
- Chemistry (Part I, II)
- Biology

#### Commerce/Humanities:
- Accountancy
- Business Studies
- Economics
- History, Geography, Political Science

### Phase 3: Classes 6-9 (Medium Priority) - Days 6-7
**Target: 3,000-4,000 exercises**

Foundation classes with moderate exercise counts.

### Phase 4: Specialized Subjects - Day 8
- Computer Science
- Psychology
- Sociology
- Optional subjects

## Technical Implementation

### Step 1: Download NCERT PDFs
```bash
#!/bin/bash
# NCERT official URLs
BASE_URL="https://ncert.nic.in/textbook.php"

# Class 10 Mathematics
wget "https://ncert.nic.in/textbook/pdf/jemh1dd.pdf" -O class10-math.pdf

# Class 10 Science
wget "https://ncert.nic.in/textbook/pdf/jesc1dd.pdf" -O class10-science.pdf

# ... (full list to be generated)
```

### Step 2: PDF Extraction Script
```typescript
// extract-ncert-exercises.ts
import { readPDF } from '@ankr/pdf-reader';
import { AI } from '@ankr/ai-proxy';

async function extractExercises(pdfPath: string, class: number, subject: string) {
  // Read PDF using Claude's vision capability
  const pdfContent = await readPDF(pdfPath);

  // Use AI to extract exercises
  const prompt = `
    Extract all exercises from this NCERT ${subject} textbook for Class ${class}.
    For each exercise, extract:
    - Chapter number and title
    - Exercise number
    - Question number
    - Full question text
    - Any hints or notes
    - Difficulty estimate (easy/medium/hard)

    Return as structured JSON array.
  `;

  const exercises = await AI.extract(pdfContent, prompt);
  return exercises;
}
```

### Step 3: Database Ingestion
```typescript
// ingest-exercises.ts
async function ingestExercises(exercises: Exercise[], moduleId: string) {
  for (const exercise of exercises) {
    await prisma.chapter_exercises.create({
      data: {
        id: generateExerciseId(exercise),
        module_id: moduleId,
        exercise_number: exercise.exerciseNumber,
        question_number: exercise.questionNumber,
        question_text: exercise.questionText,
        hints: exercise.hints,
        difficulty: exercise.difficulty,
        tags: exercise.tags,
        order: exercise.order,
      }
    });
  }
}
```

### Step 4: Batch Solver
```bash
# Run solver on all new exercises
npm run solve:batch -- \
  --class=10 \
  --subject=all \
  --concurrency=5 \
  --limit=10000
```

## Database Schema Updates

### New Tables Needed

#### subjects table
```sql
CREATE TABLE ankr_learning.subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_hi TEXT,
  category TEXT, -- STEM, Humanities, Commerce
  icon TEXT,
  color TEXT
);
```

#### books table
```sql
CREATE TABLE ankr_learning.books (
  id TEXT PRIMARY KEY,
  class INTEGER NOT NULL,
  subject_id TEXT REFERENCES subjects(id),
  title TEXT NOT NULL,
  title_hi TEXT,
  pdf_url TEXT,
  ncert_code TEXT,
  chapter_count INTEGER,
  metadata JSONB
);
```

### Update courses table
- Link to subjects
- Link to books
- Add more metadata

## Resource Requirements

### Storage
- PDFs: ~5GB (all NCERT books)
- Database: ~500MB (exercises + solutions)
- Total: ~6GB

### Processing
- AI API calls: ~15,000-20,000 (for solving)
- Cost estimate: $150-200 (Claude API)
- Time: 8-10 days (with automation)

### Optimization: Parallel Processing
- Process multiple classes simultaneously
- Process multiple subjects in parallel
- Use batch API calls
- Cache intermediate results

**Optimized time: 3-4 days**

## Progress Tracking

### Dashboard Requirements
```typescript
interface ExtractionProgress {
  totalBooks: number;
  booksProcessed: number;
  totalExercises: number;
  exercisesExtracted: number;
  exercisesSolved: number;

  byClass: {
    [class: number]: {
      totalSubjects: number;
      subjectsProcessed: number;
      exerciseCount: number;
      solvedCount: number;
    }
  };

  bySubject: {
    [subject: string]: {
      totalExercises: number;
      extractedExercises: number;
      solvedExercises: number;
    }
  };
}
```

## Quality Assurance

### Validation Steps
1. **PDF Quality Check**: Ensure PDFs are readable
2. **Exercise Extraction Accuracy**: Spot-check 10% of exercises
3. **Solution Quality**: Verify solutions for correctness
4. **Database Integrity**: Check foreign keys, duplicates
5. **API Testing**: Verify all endpoints return correct data
6. **UI Testing**: Check student interface displays properly

### Acceptance Criteria
- ✅ All NCERT PDFs downloaded
- ✅ 95%+ exercise extraction accuracy
- ✅ 90%+ solution success rate
- ✅ Zero database errors
- ✅ All API endpoints functional
- ✅ Student UI fully operational

## Deliverables

### Week 1 Deliverables
1. ✅ Complete Class 10 all subjects (800-1,000 exercises)
2. ✅ Complete Classes 11-12 Mathematics & Science (2,000 exercises)
3. ✅ Database schema updates
4. ✅ API endpoints for new subjects
5. ✅ Updated student UI with all subjects

### Week 2 Deliverables
1. ✅ Complete Classes 6-9 all subjects (3,000 exercises)
2. ✅ Complete Classes 11-12 humanities/commerce (2,000 exercises)
3. ✅ Quality assurance complete
4. ✅ Documentation updated
5. ✅ Production deployment

## Risk Mitigation

### Risks
1. **PDF Quality Issues**: Some PDFs may have poor OCR
   - Mitigation: Manual review of problematic chapters

2. **AI Extraction Errors**: AI may misinterpret questions
   - Mitigation: Human-in-the-loop validation

3. **Solver Failures**: Some questions may be unsolvable
   - Mitigation: Mark as "requires manual review"

4. **Database Performance**: 10,000+ exercises may slow queries
   - Mitigation: Proper indexing, query optimization

5. **API Rate Limits**: Claude API may throttle requests
   - Mitigation: Batch processing, rate limiting, retries

## Success Metrics

### Targets
- **Coverage**: 100% of NCERT exercises extracted
- **Accuracy**: 95%+ extraction accuracy
- **Solutions**: 90%+ successfully solved
- **Speed**: Complete in 7-10 days
- **Quality**: User satisfaction score > 4.5/5

### KPIs
- Exercises per day: 1,000-1,500
- Extraction accuracy: 95%+
- Solution accuracy: 90%+
- API uptime: 99.9%
- Student engagement: Track usage

## Timeline Summary

| Phase | Duration | Exercises | Status |
|-------|----------|-----------|--------|
| Phase 1: Class 10 Complete | 2 days | 800-1,000 | ⏳ Starting |
| Phase 2: Classes 11-12 | 3 days | 4,000-5,000 | ⏳ Pending |
| Phase 3: Classes 6-9 | 2 days | 3,000-4,000 | ⏳ Pending |
| Phase 4: Specialized | 1 day | 500-1,000 | ⏳ Pending |
| **Total** | **8 days** | **8,300-10,000** | **⏳ In Progress** |

With parallel processing: **3-4 days**

## Next Immediate Steps

1. ✅ Create extraction infrastructure
2. ✅ Download Class 10 Mathematics PDF
3. ✅ Extract first chapter as proof of concept
4. ✅ Validate extraction quality
5. ✅ Scale to all Class 10 subjects
6. ✅ Expand to other classes

---

**Status**: Ready to begin
**Priority**: Class 10 Mathematics
**Start Date**: 2026-02-11
**Target Completion**: 2026-02-19
