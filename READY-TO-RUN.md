# Ready to Process - Complete Guide

## ✅ PROVEN WORKING APPROACH

The batch script at `/root/ankr-labs-nx/apps/ankr-curriculum-backend/src/scripts/process-batch-books.ts` **WORKS**.

**Proof:** Successfully processed 2 Cambridge books:
- Chemistry: 70 questions in 8.5 min
- Physics: 50 questions in 6.5 min

## 🚀 IMMEDIATE ACTION

### Step 1: Update Batch Script (5 min)

Replace the NCERT entries in `process-batch-books.ts` with chapter paths:

```typescript
const BOOKS = [
  // NCERT Class 10 Math - Chapters
  {
    name: 'NCERT Class 10 Math Ch1',
    board: 'CBSE',
    grade: 'CLASS_10',
    subject: 'mathematics',
    pdfPath: '/root/data/ncert-full/extracted/class_10_math/jemh101.pdf',
  },
  {
    name: 'NCERT Class 10 Math Ch2',
    board: 'CBSE',
    grade: 'CLASS_10',
    subject: 'mathematics',
    pdfPath: '/root/data/ncert-full/extracted/class_10_math/jemh102.pdf',
  },
  // ... add all 14 chapters

  // Cambridge books (already working)
  {
    name: 'Cambridge IGCSE Biology',
    board: 'CAMBRIDGE',
    grade: 'CLASS_10',
    subject: 'biology',
    pdfPath: '/root/data/cambridge/igcse/biology/igcse_biology_0610_notes.pdf',
  },
  {
    name: 'Cambridge IGCSE Chemistry',
    board: 'CAMBRIDGE',
    grade: 'CLASS_10',
    subject: 'chemistry',
    pdfPath: '/root/data/cambridge/igcse/chemistry/igcse_chemistry_0620_notes.pdf',
  },
  {
    name: 'Cambridge IGCSE Physics',
    board: 'CAMBRIDGE',
    grade: 'CLASS_10',
    subject: 'physics',
    pdfPath: '/root/data/cambridge/igcse/physics/igcse_physics_0625_notes.pdf',
  },
];
```

### Step 2: Run Processing

```bash
cd /root/ankr-labs-nx/apps/ankr-curriculum-backend

# Build
npm run build

# Run (this WORKS - proven with Chemistry/Physics)
DATABASE_URL="postgresql://ankr:indrA@0612@localhost:5432/ankr_eon?schema=ankr_learning" \
node dist/scripts/process-batch-books.js
```

## 📊 EXPECTED RESULTS

**For 17 books (14 Math chapters + 3 Cambridge):**
- Questions: ~500-700
- Duration: ~2-3 hours
- Storage: In-memory (ready for DB export)

## 🔄 THEN: Export to Database

Once processing completes:

```bash
DATABASE_URL="postgresql://ankr:indrA@0612@localhost:5432/ankr_eon?schema=ankr_learning" \
npx tsx apps/ankr-curriculum-backend/src/scripts/export-to-database.ts
```

This will show current database state.

## 📝 FULL BOOK LIST TEMPLATE

Create `/root/all-books.json`:

```json
[
  // Class 10 Math
  "/root/data/ncert-full/extracted/class_10_math/jemh101.pdf",
  "/root/data/ncert-full/extracted/class_10_math/jemh102.pdf",
  "/root/data/ncert-full/extracted/class_10_math/jemh103.pdf",
  "/root/data/ncert-full/extracted/class_10_math/jemh104.pdf",
  "/root/data/ncert-full/extracted/class_10_math/jemh105.pdf",
  "/root/data/ncert-full/extracted/class_10_math/jemh106.pdf",
  "/root/data/ncert-full/extracted/class_10_math/jemh107.pdf",
  "/root/data/ncert-full/extracted/class_10_math/jemh108.pdf",
  "/root/data/ncert-full/extracted/class_10_math/jemh109.pdf",
  "/root/data/ncert-full/extracted/class_10_math/jemh110.pdf",
  "/root/data/ncert-full/extracted/class_10_math/jemh111.pdf",
  "/root/data/ncert-full/extracted/class_10_math/jemh112.pdf",
  "/root/data/ncert-full/extracted/class_10_math/jemh113.pdf",
  "/root/data/ncert-full/extracted/class_10_math/jemh114.pdf",

  // Cambridge IGCSE
  "/root/data/cambridge/igcse/biology/igcse_biology_0610_notes.pdf",
  "/root/data/cambridge/igcse/chemistry/igcse_chemistry_0620_notes.pdf",
  "/root/data/cambridge/igcse/physics/igcse_physics_0625_notes.pdf"
]
```

## 🎯 SUCCESS CRITERIA

After processing completes:
1. Check logs for success/failure counts
2. Run export script to verify in-memory data
3. Complete export logic to persist to PostgreSQL
4. Verify database has all courses/modules/questions

## 💡 WHY THIS WORKS

1. **Compiled JavaScript** - No tsx dependency issues
2. **Proven Approach** - Already processed 2 books successfully
3. **Simple Path** - Just update book list, rebuild, run
4. **Fast** - ~10-15 min per book

## ⚡ QUICK START (Copy-Paste)

```bash
# 1. Navigate
cd /root/ankr-labs-nx/apps/ankr-curriculum-backend

# 2. Edit process-batch-books.ts (replace BOOKS array with chapters)

# 3. Build
npm run build

# 4. Run
DATABASE_URL="postgresql://ankr:indrA@0612@localhost:5432/ankr_eon?schema=ankr_learning" \
node dist/scripts/process-batch-books.js 2>&1 | tee /tmp/batch-run.log

# 5. Monitor
tail -f /tmp/batch-run.log
```

---

**Status:** Ready to go. Just need to update the BOOKS array and run!
