# NCERT Complete Download & Processing Plan

## 🎯 Goal

Download **ALL NCERT textbooks** across:
- **Classes:** 6-12 (7 years)
- **Subjects:** Math, Science, Physics, Chemistry, Biology, Social Science, English, Hindi, etc.
- **Languages:** English, Hindi, Urdu, Sanskrit (where available)
- **Format:** Keep ZIPs for archival, extract chapters for processing

## 📚 What Will Be Downloaded

### Complete Catalog (~40-50 books)

#### Class 10 (12 books)
**English:**
- Mathematics (14 chapters)
- Science (16 chapters)
- Social Science: History, Geography, Political Science, Economics (4 books)
- English: First Flight, Footprints without Feet (2 books)

**Hindi:**
- Kshitij, Kritika, Sparsh, Sanchayan (4 books)

#### Class 9 (12 books)
- Similar structure to Class 10

#### Class 11 (8 books)
- Mathematics
- Physics Part 1 & 2
- Chemistry Part 1 & 2
- Biology
- (Plus Hindi versions)

#### Class 12 (8 books)
- Mathematics Part 1 & 2
- Physics Part 1 & 2
- Chemistry Part 1 & 2
- Biology
- (Plus Hindi versions)

#### Classes 6-8 (10-12 books)
- Math, Science, Social Science, English, Hindi for each class

**Total: ~40-50 books across 7 classes**

## 📂 Storage Structure

```
/root/data/ncert-complete/
├── zips/                          # Original ZIP files (archival)
│   ├── jemh1dd.zip               # Class 10 Math
│   ├── jesc1dd.zip               # Class 10 Science
│   ├── kemh1dd.zip               # Class 11 Math
│   └── ...                       # ~40-50 ZIPs
│
└── extracted/                     # Extracted chapters
    ├── class_10/
    │   ├── jemh1/                # Math chapters
    │   │   ├── jemh101.pdf
    │   │   ├── jemh102.pdf
    │   │   └── ...
    │   ├── jesc1/                # Science chapters
    │   └── jhks1/                # Hindi Kshitij
    ├── class_11/
    └── class_12/
```

## 🚀 Three-Phase Approach

### Phase 1: Download All Books (2-3 hours)

**Script:** `/root/download-all-ncert.sh`

**What it does:**
1. Downloads all ~40-50 NCERT book ZIPs
2. Saves ZIPs to `/root/data/ncert-complete/zips/`
3. Extracts chapters to `/root/data/ncert-complete/extracted/`
4. Verifies each download
5. Logs everything

**Run:**
```bash
bash /root/download-all-ncert.sh
```

**Monitor:**
```bash
tail -f /tmp/ncert-download.log
```

**Expected output:**
- ~40-50 ZIPs (2-3 GB total)
- ~400-500 extracted chapter PDFs
- Complete catalog with all languages

### Phase 2: Inventory & Verification (10 minutes)

After downloads complete:

```bash
# Count ZIPs
ls -1 /root/data/ncert-complete/zips/*.zip | wc -l

# Count extracted PDFs
find /root/data/ncert-complete/extracted -name "*.pdf" | wc -l

# List by class
ls -d /root/data/ncert-complete/extracted/class_*

# Sample verification - check a few PDFs are valid
file /root/data/ncert-complete/extracted/class_10/jemh1/*.pdf | head -5
```

### Phase 3: Process & Seed to Database (Per Book)

**Strategy:** Process one book at a time

**Why per-book processing:**
- Better progress tracking
- Easier to resume if interrupted
- Can prioritize important books first
- Quality control per book

**Priority order:**
1. Class 10 (high priority for exams)
2. Class 9
3. Class 11-12
4. Class 6-8

**Example processing one book:**
```bash
# Process Class 10 Math
cd /root/ankr-labs-nx/apps/ankr-curriculum-backend

# Create processing script on-demand
cat > /tmp/process-one-book.js << 'EOF'
const { createMasterOrchestrator } = require('@ankr/curriculum-mapper');
const fs = require('fs').promises;
const path = require('path');

async function processBook(bookDir, metadata) {
  console.log(`\n📚 Processing: ${metadata.bookName}\n`);

  const files = await fs.readdir(bookDir);
  const chapters = files.filter(f => f.match(/\d{2}\.pdf$/)).sort();

  console.log(`Found ${chapters.length} chapters\n`);

  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    const pdfPath = path.join(bookDir, chapter);

    console.log(`[${i+1}/${chapters.length}] ${chapter}`);

    const orchestrator = createMasterOrchestrator({
      board: 'CBSE',
      grade: `CLASS_${metadata.class}`,
      subject: metadata.subject,
      language: metadata.language,
      pdfPath: pdfPath,
      outputFormat: 'DATABASE',
      mode: 'LIVE',
      enableTranslation: false,
      aiProvider: 'ANTHROPIC',
      verbose: false,
      courseGeneration: {
        includeVideos: false,
        includeQuizzes: true,
        includeAssignments: false,
        questionsPerModule: 10,
        difficultyDistribution: { easy: 0.3, medium: 0.5, hard: 0.2 },
        realWorldExamples: false,
        hindiTranslation: metadata.language === 'hi',
        boardStyle: 'CBSE',
      },
    });

    await orchestrator.run();
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`\n✅ Completed: ${metadata.bookName}\n`);
}

// Example: Class 10 Math
processBook('/root/data/ncert-complete/extracted/class_10/jemh1', {
  class: 10,
  subject: 'mathematics',
  language: 'en',
  bookName: 'NCERT Class 10 Mathematics'
}).catch(console.error);
EOF

DATABASE_URL="postgresql://ankr:indrA@0612@localhost:5432/ankr_eon?schema=ankr_learning" \
node /tmp/process-one-book.js
```

## 📊 Expected Timeline

### Downloads (Phase 1):
- **Duration:** 2-3 hours
- **Output:** ~40-50 books, ~2-3 GB
- **Can run:** Overnight or in background

### Processing (Phase 3):
- **Per chapter:** 3-5 minutes
- **Per book (~15 chapters):** 45-75 minutes
- **All 40 books:** 30-50 hours total

**Strategy:** Process in batches
- Batch 1: Class 10 (12 books) → ~12-15 hours
- Batch 2: Class 9 (12 books) → ~12-15 hours
- Batch 3: Classes 11-12 (16 books) → ~16-20 hours
- Batch 4: Classes 6-8 (10 books) → ~10-12 hours

## 🎯 Recommended Workflow

### Day 1: Download Everything
```bash
# Start in morning
bash /root/download-all-ncert.sh

# Monitor
tail -f /tmp/ncert-download.log

# By evening: All books downloaded
```

### Day 2-3: Process Class 10 (Priority)
```bash
# Process all 12 Class 10 books
# These are most important for exams
# ~12-15 hours total
```

### Day 4-5: Process Class 9
```bash
# Process all 12 Class 9 books
# ~12-15 hours
```

### Week 2: Process Classes 11-12
```bash
# Process higher secondary
# ~16-20 hours
```

### Week 3: Process Classes 6-8
```bash
# Complete the collection
# ~10-12 hours
```

## 📁 File Structure After Download

```
/root/data/ncert-complete/
├── zips/                          # 2-3 GB
│   └── [40-50 ZIP files]
│
├── extracted/                     # 3-4 GB
│   ├── class_6/
│   ├── class_7/
│   ├── class_8/
│   ├── class_9/
│   ├── class_10/
│   ├── class_11/
│   └── class_12/
│
└── README.txt                     # Auto-generated inventory
```

## 🔍 Verification Checklist

After downloads complete:

```bash
# 1. Count downloads
echo "ZIPs downloaded:"
ls -1 /root/data/ncert-complete/zips/*.zip | wc -l

# 2. Count extracted PDFs
echo "PDFs extracted:"
find /root/data/ncert-complete/extracted -name "*.pdf" | wc -l

# 3. Check class coverage
echo "Classes available:"
ls -d /root/data/ncert-complete/extracted/class_* | wc -l

# 4. Verify PDF validity (sample)
echo "Checking PDF validity:"
find /root/data/ncert-complete/extracted -name "*.pdf" | head -10 | while read pdf; do
  file "$pdf" | grep -q "PDF" && echo "✅ $pdf" || echo "❌ $pdf"
done

# 5. Generate inventory
find /root/data/ncert-complete/extracted -name "*.pdf" | \
  awk -F/ '{print $6, $7, $8}' | \
  sort | \
  uniq -c > /root/data/ncert-complete/inventory.txt
```

## 💡 Next Steps After Download

1. **Verify inventory** (10 min)
2. **Test process 1 chapter** (5 min)
3. **Process Class 10 Math** (1 hour - full book test)
4. **If successful, continue with remaining books**

## 🚨 Important Notes

- **Keep ZIPs:** Don't delete! They're your archival copy
- **ZIPs are official:** Downloaded directly from ncert.nic.in
- **Per-book processing:** Easier to track and debug
- **Time commitment:** Full processing takes ~50 hours
- **Can pause/resume:** Process books incrementally
- **Verify as you go:** Check database after each book

## 📝 Current Status vs. This Plan

**Currently:**
- ✅ Processing 29 books (your uploaded files)
- ⏱️  ~2 hours remaining

**After this download:**
- 📥 Will have ~40-50 complete NCERT books
- 📚 All languages, all classes
- 🎯 Can process systematically

**Recommendation:**
1. ✅ Let current 29 books finish
2. 📥 Start NCERT download tonight (runs while you sleep)
3. 📚 Tomorrow: Process downloaded books systematically

---

**Ready to start?**

```bash
# Run this to begin full NCERT download
bash /root/download-all-ncert.sh
```
