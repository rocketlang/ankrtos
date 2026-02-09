
# ICSE Content Download Instructions

## Automated Downloads Completed ✅
Check /root/data/icse-complete/ for downloaded content.

## Manual Downloads Required 📝

### 1. Official CISCE Content
Visit: https://cisce.org

**Download:**
- Latest Syllabi (Class 9, 10, 11, 12)
- Sample Question Papers
- Specimen Papers
- Previous Year Papers

**Steps:**
1. Go to cisce.org
2. Navigate to "Examination" → "Syllabus"
3. Download class-wise syllabi
4. Navigate to "Examination" → "Specimen Question Papers"
5. Download subject-wise papers

### 2. Selina Solutions (Free)
Visit: https://www.vedantu.com/selina-solutions

**Available for:**
- Class 9: Math, Physics, Chemistry, Biology, Geography
- Class 10: Math, Physics, Chemistry, Biology, Geography

**Steps:**
1. Select class
2. Select subject
3. Browse chapters
4. Download PDF solutions (usually available)

### 3. Tiwari Academy (Free PDFs)
Visit: https://www.tiwariacademy.com/icse-books/

**Content:**
- Complete ICSE textbook solutions
- Chapter-wise PDFs
- Free download, no registration

**Steps:**
1. Navigate to ICSE section
2. Select class and subject
3. Download chapter PDFs

### 4. Sample Papers
Visit: https://entrancei.com/icse-sample-papers

**Content:**
- Class 10 board exam papers
- Subject-wise practice papers
- Free downloads

### 5. Study Notes
Visit: https://www.learncbse.in/icse/

**Content:**
- Revision notes
- Important questions
- Quick guides

## Organizing Downloads

Save downloads to:
```
/root/data/icse-complete/
├── official/          → CISCE syllabi, regulations
├── textbooks/         → Selina, Concise solutions
├── sample-papers/     → Practice papers by year
└── notes/            → Study notes, summaries
```

## Next: Process with Curriculum Mapper

Once downloaded, add ICSE books to the batch processor:
```bash
cd /root/ankr-labs-nx/apps/ankr-curriculum-backend
# Update resume-processing.cjs to include ICSE books
```
