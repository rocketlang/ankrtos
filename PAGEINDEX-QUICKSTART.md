# PageIndex Quick Start Guide
## Get Started in 5 Minutes

**Created:** February 1, 2026
**Status:** Ready to Begin

---

## 🎯 What is This Project?

PageIndex is a revolutionary RAG (Retrieval-Augmented Generation) approach that uses **tree search** instead of vector embeddings to navigate long documents. Think "AlphaGo for documents."

**Why ANKR Needs This:**
- Your maritime charter parties (100+ pages) have complex cross-references
- Compliance docs require precise section navigation
- Current RAG accuracy on complex queries: **60%**
- PageIndex achieves: **98.7%** on similar documents

---

## 📄 Project Documents

| Document | Purpose | Location |
|----------|---------|----------|
| **Project Report** | Full analysis, architecture, ROI | `/root/PAGEINDEX-PROJECT-REPORT.md` |
| **TODO Plan** | Detailed tasks, phases, timelines | `/root/PAGEINDEX-TODO.md` |
| **This Guide** | Quick start instructions | `/root/PAGEINDEX-QUICKSTART.md` |

---

## 🚀 Start Here: 5-Minute Setup

### Step 1: Read the Project Report (10 min)

```bash
# Open in your editor
code /root/PAGEINDEX-PROJECT-REPORT.md

# Or read in terminal
less /root/PAGEINDEX-PROJECT-REPORT.md
```

**What to focus on:**
- Section 3: Use Case Analysis (Maritime Charter Parties)
- Section 6: Implementation Phases
- Section 7: Cost-Benefit Analysis

### Step 2: Clone PageIndex Repository (2 min)

```bash
cd /root/ankr-labs-nx/packages

# Clone the official PageIndex repo
git clone https://github.com/VectifyAI/PageIndex.git ankr-pageindex-vendor

# Install dependencies
cd ankr-pageindex-vendor
npm install
```

### Step 3: Run the Example (3 min)

```bash
# PageIndex comes with cookbook examples
cd cookbook

# List available examples
ls -la

# Run simple RAG example
node pageindex_RAG_simple.js

# Expected output:
# "Building document index..."
# "Navigating to section: Financial Terms..."
# "Answer: The EBITDA calculation is..."
```

---

## 📊 Key Resources

### Official PageIndex Links

- **Main Repo:** https://github.com/VectifyAI/PageIndex
- **Documentation:** https://docs.pageindex.ai/
- **MCP Server:** https://github.com/VectifyAI/pageindex-mcp
- **Benchmark Results:** https://github.com/VectifyAI/Mafin2.5-FinanceBench

### ANKR Current RAG Implementation

```bash
# Your existing RAG systems
/root/HybridSearch.service.ts                                    # Core hybrid search
/root/apps/ankr-maritime/backend/src/services/rag/maritime-rag.ts # Maritime RAG
/root/ankr-labs-nx/packages/ankr-mcp/src/tools/logistics/rag.ts  # Logistics RAG
```

---

## 🎯 Decision Points

### Should You Proceed?

**✅ YES, if:**
- You have long documents (>10 pages) with structure
- You need high accuracy on complex queries
- Multi-hop questions are common ("See Appendix X")
- Your users are frustrated with current search

**❌ NO, if:**
- Most queries are simple lookups
- Documents are short (<5 pages)
- Speed is more critical than accuracy
- Budget is extremely tight

### Quick ROI Check

| Metric | Current | With PageIndex | Impact |
|--------|---------|----------------|--------|
| Charter party accuracy | 60% | 95%+ | **+58%** ✅ |
| Time per query | 5 min | 30 sec | **90% faster** ✅ |
| Compliance incidents/year | 1 ($50K) | 0 | **$50K saved** ✅ |
| Initial cost | $0 | $40K | Investment ⚠️ |

**Break-even:** ~2.2 years

---

## 📅 Project Timeline

```
Week 1:  Phase 0 - Setup & Planning          ⬜
Week 2:  Phase 1 - POC (Indexing)            ⬜
Week 3:  Phase 1 - POC (Testing)             ⬜
Week 4:  Phase 2 - Router (Development)      ⬜
Week 5:  Phase 2 - Router (Integration)      ⬜
Week 6:  Phase 3 - Production (Batch Index)  ⬜
Week 7:  Phase 3 - Production (Deploy)       ⬜
Week 8:  Phase 3 - Production (Optimize)     ⬜
Ongoing: Phase 4 - Expansion                 ⬜
```

**Total Time to Production:** 7-8 weeks

---

## 🏁 Next Immediate Actions

### Today (30 minutes)

**1. Review Project Documents**
```bash
# Read the executive summary
head -100 /root/PAGEINDEX-PROJECT-REPORT.md

# Check TODO plan structure
grep "^## " /root/PAGEINDEX-TODO.md
```

**2. Test PageIndex Installation**
```bash
cd /root/ankr-labs-nx/packages/ankr-pageindex-vendor

# Verify it works
npm run test

# Check examples
ls cookbook/
```

**3. Identify Your First Test Document**
```bash
# Find a complex charter party
cd /root/apps/ankr-maritime

# List available documents
# (Adjust path to your actual DMS location)
ls -lh backend/storage/documents/ | grep -i charter
```

### This Week (Week 1: Phase 0)

**Priority Tasks from TODO:**
- ⬜ TASK-001: Clone and review PageIndex *(4 hours)*
- ⬜ TASK-002: Audit current RAG implementation *(6 hours)*
- ⬜ TASK-003: Select 10 test documents *(3 hours)*
- ⬜ TASK-004: Create 50-query test set *(4 hours)*
- ⬜ TASK-009: Stakeholder review & approval *(2 hours)*

**Deliverables:**
- Phase 0 complete ✅
- Approval to proceed ✅
- Phase 1 kickoff ready ✅

### Next Week (Week 2-3: Phase 1 POC)

**Goal:** Prove PageIndex works on your documents

**Key Milestones:**
1. Index 10 charter parties
2. Run 50 test queries
3. Measure accuracy improvement
4. Make GO/NO-GO decision

**Success Criteria:**
- Accuracy improvement >20%
- Latency <3 seconds
- User satisfaction >80%

---

## 👥 Team Assignments

| Role | Responsibilities | Time Commitment |
|------|------------------|-----------------|
| **Project Lead** | Overall coordination, decisions | 25% (10 hrs/week) |
| **Backend Engineer** | PageIndex integration, router | 100% (40 hrs/week) |
| **QA Engineer** | Testing, benchmarking | 50% (20 hrs/week) |
| **Maritime Product** | Document selection, UAT | 25% (10 hrs/week) |
| **DevOps** | Deployment, monitoring | 25% (10 hrs/week) |

**Total:** ~1.5 FTE for Phase 1 (2 weeks)

---

## 💡 Quick Wins

While planning, you can start small:

### 1. Test PageIndex on ONE Document (1 hour)

```bash
cd /root/ankr-labs-nx/packages/ankr-pageindex-vendor

# Create a test script
cat > test-one-doc.js <<'EOF'
const PageIndex = require('./dist/index.js');

async function test() {
  // Load your charter party PDF
  const doc = await PageIndex.loadDocument('./test-charter.pdf');

  // Build index
  const index = await PageIndex.createIndex(doc);

  // Test query
  const result = await PageIndex.navigate({
    index,
    query: "What's the demurrage rate?"
  });

  console.log('Answer:', result.answer);
  console.log('Sources:', result.sources);
}

test();
EOF

# Run it
node test-one-doc.js
```

### 2. Compare with HybridSearch (30 min)

```bash
# Test same query with your current RAG
cd /root

# Create comparison script
cat > compare-rag.ts <<'EOF'
import { HybridSearchService } from './HybridSearch.service';
import { PageIndexSearch } from './ankr-labs-nx/packages/ankr-pageindex/src/search/PageIndexSearch';

const query = "What is the demurrage calculation in charter ABC?";

// Test hybrid
const hybrid = await hybridSearch.search(query);
console.log('Hybrid:', hybrid.answer);

// Test PageIndex
const pageindex = await pageIndexSearch.navigate(query);
console.log('PageIndex:', pageindex.answer);

// Compare
console.log('\nComparison:');
console.log('Hybrid sources:', hybrid.sources.length);
console.log('PageIndex sources:', pageindex.sources.length);
console.log('Hybrid latency:', hybrid.latency, 'ms');
console.log('PageIndex latency:', pageindex.latency, 'ms');
EOF

npx tsx compare-rag.ts
```

---

## 🛠️ Troubleshooting

### Issue: PageIndex Installation Fails

```bash
# Check Node version (needs v18+)
node --version

# Update if needed
nvm install 18
nvm use 18

# Reinstall
cd packages/ankr-pageindex-vendor
rm -rf node_modules package-lock.json
npm install
```

### Issue: Can't Extract Table of Contents

PageIndex needs document structure. If your PDFs don't have bookmarks:

```typescript
// Fallback: Extract from headings
import { extractHeadings } from './utils/pdf-extractor';

const toc = await extractHeadings(pdfBuffer, {
  pattern: /^(CLAUSE|SECTION|APPENDIX)\s+\d+/i
});
```

### Issue: Latency Too High (>5s)

```typescript
// Optimization 1: Reduce max depth
const result = await PageIndex.navigate({
  index,
  query,
  maxDepth: 3  // Default is 5
});

// Optimization 2: Use Haiku for navigation
const result = await PageIndex.navigate({
  index,
  query,
  llmConfig: {
    model: 'claude-haiku-4-20250514',  // Faster than Sonnet
    temperature: 0
  }
});
```

---

## 📞 Get Help

### Internal Resources

- **Project Lead:** Check TODO plan for task owner
- **Technical Questions:** Backend team lead
- **Maritime Use Cases:** Maritime product manager

### External Resources

- **PageIndex Issues:** https://github.com/VectifyAI/PageIndex/issues
- **PageIndex Discord:** (Check their README for invite link)
- **Documentation:** https://docs.pageindex.ai/

### Emergency Contacts

If PageIndex is causing production issues:

```bash
# Disable PageIndex routing immediately
echo "PAGEINDEX_ENABLED=false" >> /root/ankr-labs-nx/.env

# Restart backend
ankr-ctl restart ankr-maritime-backend

# Verify fallback to HybridSearch
curl http://localhost:4003/graphql \
  -d '{"query": "{ searchDocuments(query: \"test\") { answer method } }"}'
```

---

## 🎓 Learning Path

### For Developers

**Day 1: Understand the Concept**
1. Read VentureBeat article (in project report Appendix A)
2. Watch: Search YouTube for "PageIndex RAG" demos
3. Read: PageIndex blog - https://pageindex.ai/blog/pageindex-intro

**Day 2: Hands-On**
1. Run PageIndex examples
2. Index a test document
3. Compare with vector search

**Day 3: Integration Planning**
1. Review current ANKR RAG architecture
2. Identify integration points
3. Design router logic

### For Product Managers

**Key Questions to Answer:**
1. Which document types benefit most? (Charter parties? Compliance?)
2. What queries fail today? (Multi-hop? Cross-references?)
3. What's acceptable latency? (1s? 3s? 5s?)
4. How to measure success? (User feedback? Accuracy? Time saved?)

### For QA Engineers

**Testing Focus:**
1. Accuracy benchmarking (create ground truth dataset)
2. Latency measurement (p50, p95, p99)
3. Failure scenarios (what if PageIndex times out?)
4. Edge cases (documents without ToC, malformed PDFs)

---

## ✅ Checklist: Are You Ready?

Before proceeding to Phase 1 POC:

**Technical Readiness:**
- [ ] PageIndex repo cloned and examples working
- [ ] Current RAG architecture documented
- [ ] Integration points identified
- [ ] Test environment ready (staging database, LLM API keys)

**Team Readiness:**
- [ ] Backend engineer allocated (100% for 2 weeks)
- [ ] QA engineer allocated (50% for 2 weeks)
- [ ] Stakeholders reviewed project report
- [ ] Budget approved ($8,000 for Phase 1)

**Document Readiness:**
- [ ] 10 test documents selected (5 charter parties, 3 compliance, 2 financial)
- [ ] 50 test queries prepared (25 simple, 25 complex)
- [ ] Ground truth answers documented
- [ ] Documents extracted and accessible

**Decision Readiness:**
- [ ] Success criteria defined (>20% accuracy improvement)
- [ ] Rollback plan documented (if POC fails)
- [ ] Next steps clear (proceed to Phase 2 if successful)

**If all checked:** 🎉 **You're ready to start Phase 1 POC!**

---

## 🚀 Launch Sequence

```bash
# 1. Create project tracking
cd /root/ankr-labs-nx
mkdir -p projects/pageindex-integration

# 2. Copy project docs
cp /root/PAGEINDEX-*.md projects/pageindex-integration/

# 3. Set up packages
mkdir -p packages/ankr-pageindex
mkdir -p packages/ankr-rag-router

# 4. Initialize git branch
git checkout -b feature/pageindex-integration

# 5. Create first task
echo "TASK-001: Clone and review PageIndex" > projects/pageindex-integration/CURRENT-TASK.md

# 6. Start the timer ⏱️
echo "Phase 1 POC Started: $(date)" >> projects/pageindex-integration/timeline.log
```

---

## 🎯 Success Looks Like...

**After 2 Weeks (Phase 1 Complete):**
- ✅ 10 documents indexed with PageIndex
- ✅ 50 queries tested, results documented
- ✅ Accuracy improvement measured (target: >20%)
- ✅ Decision made: GO to Phase 2 or NO-GO

**After 5 Weeks (Phase 2 Complete):**
- ✅ Smart router deployed to staging
- ✅ Queries automatically routed to best method
- ✅ Caching reduces latency by 30%+
- ✅ Ready for production deployment

**After 8 Weeks (Phase 3 Complete):**
- ✅ 500+ charter parties indexed
- ✅ Production deployment (gradual rollout)
- ✅ User satisfaction >80%
- ✅ Support tickets reduced 60%

**Ongoing (Phase 4):**
- ✅ Expansion to compliance, financial docs
- ✅ Integration with logistics MCP tools
- ✅ Mobile app support
- ✅ Multi-document queries

---

## 🎉 You're All Set!

**Your next action:**

```bash
# Open the TODO plan and start TASK-001
code /root/PAGEINDEX-TODO.md

# Or if you prefer terminal
cd /root/ankr-labs-nx/packages
git clone https://github.com/VectifyAI/PageIndex.git ankr-pageindex-vendor
cd ankr-pageindex-vendor && npm install

echo "PageIndex journey started! 🚀"
```

**Questions?** Review the project report: `/root/PAGEINDEX-PROJECT-REPORT.md`

**Ready to build?** Follow the TODO plan: `/root/PAGEINDEX-TODO.md`

**Good luck!** 🍀

---

**Last Updated:** February 1, 2026
**Version:** 1.0
**Status:** Ready to Launch 🚀
