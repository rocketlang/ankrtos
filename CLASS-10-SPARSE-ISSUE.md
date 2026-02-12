# Class 10 NCERT Mathematics - Sparse Exercise Issue

## Problem
Class 10 Mathematics currently has only **13 exercises** across **3 chapters** out of **15 total chapters**.

## Current Status (Class 10)
- ✅ Real Numbers: 10 exercises
- ✅ Polynomials: 2 exercises
- ✅ Linear Equations: 1 exercise
- ❌ Other 12 chapters: **0 exercises each**

## Expected Chapters (NCERT Class 10 Math)
1. ✅ Real Numbers (10 exercises)
2. ✅ Polynomials (2 exercises)
3. ✅ Pair of Linear Equations in Two Variables (1 exercise)
4. ❌ Quadratic Equations (0 exercises)
5. ❌ Arithmetic Progressions (0 exercises)
6. ❌ Triangles (0 exercises)
7. ❌ Coordinate Geometry (0 exercises)
8. ❌ Introduction to Trigonometry (0 exercises)
9. ❌ Some Applications of Trigonometry (0 exercises)
10. ❌ Circles (0 exercises)
11. ❌ Constructions (0 exercises)
12. ❌ Areas Related to Circles (0 exercises)
13. ❌ Surface Areas and Volumes (0 exercises)
14. ❌ Statistics (0 exercises)
15. ❌ Probability (0 exercises)

## Comparison with Other Classes

| Class | Chapters | Exercises | % of Total | Status |
|-------|----------|-----------|------------|--------|
| 6     | 62       | 162       | 10.8%      | ✅ Good |
| 7     | 31       | 2         | 0.1%       | ❌ Sparse |
| 9     | 63       | 89        | 5.9%       | ⚠️ Low |
| **10**| **15**   | **13**    | **0.9%**   | ❌ **Very Sparse** |
| 11    | 168      | 685       | 45.6%      | ✅ Excellent |
| 12    | 132      | 550       | 36.6%      | ✅ Excellent |

**Total**: 1,501 exercises across all classes

## Root Cause
The NCERT textbook data was **incompletely ingested**. Only a tiny fraction of Class 10 exercises were captured during the original data import.

The database has module entries for all 15 chapters, but `chapter_exercises` table only has data for 3 chapters.

## Impact
- Students selecting Class 10 will see mostly empty chapters
- Poor user experience for the most important class (board exam year)
- LMS appears incomplete

## Solution Options

### ✅ Option 1: Re-scrape NCERT Class 10 Textbook (RECOMMENDED)
**Approach:**
1. Download official NCERT Class 10 Mathematics PDF from ncert.nic.in
2. Use Claude's PDF reading capability to extract exercises chapter-wise
3. Create structured JSON data for each exercise
4. Ingest into `ankr_learning.chapter_exercises` table
5. Run existing solver (already tested with 1,446 exercises)
6. Verify solutions

**Estimated Result:** 200-300 new exercises for Class 10

**Time:** 2-3 hours
- PDF processing: 30 min
- Data structuring: 1 hour
- Database ingestion: 15 min
- Solving: 30-60 min (using existing solver)
- Verification: 30 min

### Option 2: Manual Addition
- Manually copy exercises from NCERT website/PDF
- Type into database
- Very time-consuming
- Error-prone

**Not recommended** - Too slow for 200+ exercises

### Option 3: Use NCERT Official API
- Check if NCERT provides structured exercise data via API
- If available, fetch and transform
- Quick and reliable

**Issue:** NCERT API availability uncertain

## Recommended Action Plan

**Phase 1: Download & Extract (30 minutes)**
```bash
# Download NCERT Class 10 Math PDF
wget https://ncert.nic.in/textbook.php?jemh1=0-0 -O class10-math.pdf

# Use Claude to read PDF and extract exercises
claude-pdf-extract class10-math.pdf --output exercises.json
```

**Phase 2: Structure Data (1 hour)**
- Parse PDF content
- Extract questions, hints, and metadata
- Create JSON structure matching database schema
- Map to existing module IDs

**Phase 3: Ingest (15 minutes)**
```sql
-- Insert exercises into chapter_exercises table
INSERT INTO ankr_learning.chapter_exercises
  (id, module_id, exercise_number, question_number, question_text, hints, difficulty, tags, order)
VALUES ...
```

**Phase 4: Solve (30-60 minutes)**
```bash
# Run existing solver on new Class 10 exercises
cd /root/ankr-labs-nx/packages/ankr-interact
npm run solve -- --class=10 --limit=500
```

**Phase 5: Verify (30 minutes)**
- Spot-check solutions
- Test API endpoints
- Verify student UI displays correctly

## Expected Outcome

**Before:**
- Class 10: 13 exercises (0.9%)

**After:**
- Class 10: ~250 exercises (16-17%)
- Complete coverage of all 15 chapters
- High-quality AI-generated solutions
- Student-ready LMS

## Files Involved

**API Layer:**
- `/root/ankr-labs-nx/packages/ankr-interact/src/server/ncert-routes.ts`

**Database:**
- `ankr_eon.ankr_learning.chapter_exercises`
- `ankr_eon.ankr_learning.modules`
- `ankr_eon.ankr_learning.courses`

**Solver:**
- Already complete and tested (1,446 exercises solved, 100% success rate)
- Can be reused for new Class 10 exercises

**Frontend:**
- `/root/ankr-labs-nx/packages/ankr-interact/src/client/student/`
- Already built and working

## Priority
**HIGH** - Class 10 is the most critical class for Indian students (board exam year)

## Status
- Issue identified: 2026-02-11
- Documentation created: 2026-02-11
- Resolution: Pending

## Next Steps
1. ✅ Document issue (DONE)
2. ⏳ Download NCERT Class 10 PDF
3. ⏳ Extract exercises using AI
4. ⏳ Ingest into database
5. ⏳ Run solver
6. ⏳ Verify and test

---

**Note:** The same issue likely affects Class 7 (2 exercises) and Class 9 (89 exercises). These should be addressed similarly after fixing Class 10.
