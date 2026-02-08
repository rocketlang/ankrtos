# Complete Processing Plan - Feb 8, 2026

## 📊 Current Status

### Batch 1: English Books (IN PROGRESS)
- **Status:** ✅ Running (PID 813734)
- **Books:** 29 (2 Cambridge + 14 Math + 13 Science)
- **Started:** 18:39
- **ETA:** ~1.5-2 hours from start
- **Log:** `/tmp/processing-all-29-books.log`

### Batch 2: Hindi Books (READY TO START)
- **Status:** ⏳ Waiting for Batch 1
- **Books:** 38 Hindi chapters (4 textbooks)
- **ETA:** ~2.5 hours
- **Script:** `/root/process-hindi-books.sh`

## 🎯 Step-by-Step Guide

### Step 1: Monitor Current Processing

```bash
# Quick status check
bash /root/monitor-processing.sh

# Watch live progress
tail -f /tmp/processing-all-29-books.log

# Check if still running
ps -p 813734
```

### Step 2: Wait for Completion

**Signs it's done:**
- Process 813734 no longer in `ps` output
- Log shows "✅ Processing complete!" or similar
- Database has 29+ courses

**Check completion:**
```bash
# Check if process finished
ps -p 813734 > /dev/null && echo "Still running" || echo "Completed!"

# Count courses in database
PGPASSWORD='indrA@0612' psql -h localhost -U ankr -d ankr_eon -c \
  "SELECT COUNT(*) FROM ankr_learning.courses;"
```

### Step 3: Verify Batch 1 Results

```bash
# Check what was created
PGPASSWORD='indrA@0612' psql -h localhost -U ankr -d ankr_eon << 'EOF'
SELECT
    COUNT(DISTINCT c.id) as courses,
    COUNT(DISTINCT m.id) as modules,
    COUNT(DISTINCT l.id) as lessons,
    COUNT(DISTINCT q.id) as questions
FROM ankr_learning.courses c
LEFT JOIN ankr_learning.modules m ON m.course_id = c.id
LEFT JOIN ankr_learning.lessons l ON l.module_id = m.id
LEFT JOIN ankr_learning.quizzes qz ON qz.lesson_id = l.id
LEFT JOIN ankr_learning.questions q ON q.quiz_id = qz.id;
EOF
```

### Step 4: Start Hindi Processing

Once Batch 1 is complete:

```bash
# Start Hindi books (Batch 2)
bash /root/process-hindi-books.sh

# It will ask for confirmation - press 'y'
```

**Monitor Hindi processing:**
```bash
tail -f /tmp/processing-hindi-batch2.log
```

### Step 5: Final Verification

After both batches complete:

```bash
# Total courses (should be ~67)
PGPASSWORD='indrA@0612' psql -h localhost -U ankr -d ankr_eon -c \
  "SELECT COUNT(*) as total_courses FROM ankr_learning.courses;"

# Breakdown by language
PGPASSWORD='indrA@0612' psql -h localhost -U ankr -d ankr_eon -c \
  "SELECT
     CASE
       WHEN 'hi' = ANY(language) THEN 'Hindi'
       ELSE 'English'
     END as lang,
     COUNT(*) as courses
   FROM ankr_learning.courses
   GROUP BY lang;"
```

## 📈 Expected Results

### After Batch 1 (English):
```
✅ 29 courses
✅ ~87 modules
✅ ~290 questions
⏱️  Duration: 1.5-2 hours
```

### After Batch 2 (Hindi):
```
✅ 38 courses
✅ ~114 modules
✅ ~380 questions
⏱️  Duration: 2.5 hours
```

### Total Final Results:
```
✅ 67 courses
✅ ~201 modules
✅ ~670 questions
💾 All in PostgreSQL
⏱️  Total time: 4-4.5 hours
```

## 🚨 Troubleshooting

### If Batch 1 Seems Stuck:

```bash
# Check if process is actually running
ps aux | grep 813734

# Check last log update time
stat -c '%y' /tmp/processing-all-29-books.log

# Check for errors in log
tail -100 /tmp/processing-all-29-books.log | grep -i error
```

### If Process Died:

```bash
# Check exit reason in log
tail -50 /tmp/processing-all-29-books.log

# Restart from where it left off (manual)
cd /root/ankr-labs-nx/apps/ankr-curriculum-backend
DATABASE_URL="postgresql://ankr:indrA@0612@localhost:5432/ankr_eon?schema=ankr_learning" \
node dist/scripts/process-working-books.js
```

### Common Issues:

**Issue:** "Cannot find module"
- **Fix:** `cd /root/ankr-labs-nx/apps/ankr-curriculum-backend && npm run build`

**Issue:** "Database connection failed"
- **Fix:** Check PostgreSQL is running: `sudo systemctl status postgresql`

**Issue:** "Out of memory"
- **Fix:** Process books in smaller batches of 10-15

## 📋 File Locations

### Scripts:
- Current batch monitor: `/root/monitor-processing.sh`
- Hindi batch script: `/root/process-hindi-books.sh`

### Logs:
- Batch 1 (English): `/tmp/processing-all-29-books.log`
- Batch 2 (Hindi): `/tmp/processing-hindi-batch2.log` (after started)

### Documentation:
- This file: `/root/COMPLETE-PROCESSING-PLAN.md`
- Scraper fix details: `/root/SCRAPER-FIX-SUMMARY.md`
- Status snapshot: `/root/PROCESSING-STATUS-FEB8.md`

### Source Files:
- English/Science/Math PDFs: `/root/data/uploads/je*.pdf` & `/root/data/cambridge/`
- Hindi PDFs: `/root/data/uploads/jh*.pdf`
- Processing script source: `/root/ankr-labs-nx/apps/ankr-curriculum-backend/src/scripts/process-working-books.ts`

## 🎯 What's Next (After Both Batches)

### Immediate (10 minutes):
1. ✅ Verify all 67 courses in database
2. ✅ Test GraphQL queries
3. ✅ Sample question quality

### Short-term (1 day):
1. Download more subjects (Social Science, English literature)
2. Process Class 9, 11, 12 textbooks
3. Fix NCERT scraper to automate downloads
4. Set up automated quality review

### Long-term (1 week):
1. Add more boards (ICSE, State Boards)
2. Build student-facing UI
3. Implement adaptive learning
4. Add video content suggestions
5. Generate course thumbnails

## 💡 Quick Commands Reference

```bash
# Monitor current batch
bash /root/monitor-processing.sh

# Watch live
tail -f /tmp/processing-all-29-books.log

# Check if done
ps -p 813734 || echo "Batch 1 complete!"

# Start Hindi batch
bash /root/process-hindi-books.sh

# Check database
PGPASSWORD='indrA@0612' psql -h localhost -U ankr -d ankr_eon -c \
  "SELECT COUNT(*) FROM ankr_learning.courses;"
```

---

**Current Time:** Feb 8, 2026 19:00
**Batch 1 Started:** 18:39
**Estimated Batch 1 Completion:** 20:00-20:30
**Estimated Batch 2 Start:** 20:30
**Estimated All Complete:** 23:00

**Status:** ✅ On track!
