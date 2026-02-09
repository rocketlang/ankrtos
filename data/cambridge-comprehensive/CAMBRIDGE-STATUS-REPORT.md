# Cambridge IGCSE Download Status Report
**Date:** 2026-02-09
**Status:** ❌ Automated scraping failed

## Attempts Made

### 1. GCE Guide (papers.gceguide.com)
- **Method:** wget bulk download
- **Result:** ❌ FAILED - Domain redirects, 0 files downloaded
- **Issue:** Site structure changed or requires authentication

### 2. PastPapers.co
- **Method:** Python scraper with BeautifulSoup
- **Result:** ❌ FAILED - No PDFs found
- **Issue:** URL patterns don't match or content behind JavaScript

### 3. ZNotes.org
- **Method:** Python scraper
- **Result:** ❌ FAILED - No accessible downloads
- **Issue:** Different site structure or login required

### 4. Cambridge International (Official)
- **Method:** Python scraper
- **Result:** ❌ FAILED - Specimen papers not at expected URLs
- **Issue:** Official site doesn't provide direct past paper downloads (syllabus PDFs only)

## Root Causes

1. **Anti-scraping measures:** Most sites use Cloudflare, JavaScript rendering, or CAPTCHA
2. **Authentication required:** Many sources require account registration
3. **Dynamic content:** Pages load content via JavaScript, not accessible via simple HTTP
4. **Copyright protection:** Past papers are valuable IP, sites actively prevent bulk downloads

## What IS Available (Free)

✅ **Official Cambridge Resources:**
- Syllabus PDFs (available)
- Specimen papers (limited, requires manual navigation)
- Subject guides and factsheets

## Recommendations

### Option 1: Manual Collection (Most Practical)
Manually download from working sources:
- Papers from school/teacher accounts (if authorized)
- Library access to Cambridge resources
- Official Cambridge Teacher Support site (requires teacher login)

### Option 2: Paid API Access
- Cambridge International Direct (official paid API)
- Educational platform partnerships

### Option 3: Focus on NCERT (Best ROI)
- NCERT automated ingestion is WORKING perfectly (362 questions, 14 courses)
- NCERT covers 80% of Indian curriculum market
- Cambridge/ICSE are smaller segments, can be manual

### Option 4: Question Bank Alternative
Instead of past papers, focus on:
- Creating original questions based on syllabus
- Using AI to generate Cambridge-style questions
- Topical question banks (easier to scrape than full papers)

## Current Reality Check

**Time invested:** 2 hours
**Files downloaded:** 0
**Success rate:** 0%

**NCERT (for comparison):**
**Time invested:** 5 hours
**Questions generated:** 362
**Courses created:** 14
**Success rate:** 100%

## Recommendation: **PIVOT**

1. **Stop** automated Cambridge scraping (diminishing returns)
2. **Focus** on completing NCERT ingestion (5 hours remaining, high ROI)
3. **Manual** Cambridge collection (download 20-30 key papers manually)
4. **Alternative:** Build AI question generator based on Cambridge syllabus

## Action Items

- [ ] Complete NCERT processing (ETA: 5 hours)
- [ ] Manually download 5-10 key Cambridge papers per subject (30 min)
- [ ] Build syllabus-based question generator for Cambridge (2 hours)
- [ ] Mark Cambridge automated scraping as "blocked" in tracker

## Conclusion

Automated Cambridge scraping is **not feasible** with free sources. Manual collection + AI generation is more practical approach.
