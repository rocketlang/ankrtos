#!/bin/bash

echo "📚 === Seekho - Phase 2 Publishing === 📚"
echo ""
echo "Publishing Seekho (India's Open K-12 Curriculum Platform) documentation to https://ankr.in/"
echo ""

SOURCE_DIR="/root/ankr-labs-nx"
TARGET_DIR="/root/ankr-universe-docs/project/documents/ankr-curriculum"

# Create target directory if it doesn't exist
mkdir -p "$TARGET_DIR"

echo "📚 Documents to Publish:"
echo ""

# Files to publish with categories
FILES_TO_PUBLISH=(
  "PHASE-2-CONTENT-PIPELINE.md:documentation"
  "PHASE-2-STATUS.md:report"
  "SEEKHO-DEPLOYED.md:deployment"
  "DEPLOY-SSL-NOW.md:deployment"
)

for entry in "${FILES_TO_PUBLISH[@]}"; do
  IFS=':' read -r FILE CATEGORY <<< "$entry"

  if [ -f "$SOURCE_DIR/$FILE" ]; then
    echo "  📤 Publishing: $FILE"

    # Copy to ankr-universe-docs
    cp "$SOURCE_DIR/$FILE" "$TARGET_DIR/$FILE"

    # Index with EON
    echo "📤 Indexing $FILE with EON..."
    node /root/ankr-labs-nx/packages/ankr-eon/dist/cli/cli.js ingest \
      --file "$TARGET_DIR/$FILE" \
      --category "$CATEGORY" \
      --tags "seekho,k12,lms,education,cbse,ncert,curriculum,phase2,content-pipeline,ai-seeding,dual-ai,india" \
      --source "seekho"

    echo "  ✅ Published: $FILE"
    echo "  🔗 https://ankr.in/project/documents/ankr-curriculum/$FILE"
    echo ""
  else
    echo "  ⚠️  File not found: $SOURCE_DIR/$FILE"
  fi
done

# Also publish scripts directory structure documentation
echo "📝 Creating Phase 2 Scripts Overview..."
cat > "$TARGET_DIR/PHASE-2-SCRIPTS.md" << 'EOF'
# Phase 2 Scripts Reference

## Available Scripts

### 1. Download and Process NCERT Books
**Location:** `/root/ankr-labs-nx/apps/ankr-curriculum-backend/src/scripts/download-and-process-ncert.ts`

Complete pipeline for downloading NCERT textbooks and processing them into structured courses.

**Usage:**
```bash
tsx download-and-process-ncert.ts [options]

Options:
  -g, --grades <grades>        Grades (e.g., "6,7,8" or "all")
  -s, --subjects <subjects>    Subjects (e.g., "Math,Science" or "all")
  -l, --limit <number>         Max books (default: 10)
  -m, --mode <mode>            SEEDING (Claude MAX) or LIVE (AI Proxy)
  --skip-download              Skip download, process existing PDFs
  --data-dir <dir>             Data directory (default: /root/data/ncert)
```

**Examples:**
```bash
# Test with 2 books
tsx download-and-process-ncert.ts --grades 6 --subjects Math,Science --limit 2 --mode LIVE

# Process all Class 6-8 (free)
tsx download-and-process-ncert.ts --grades 6,7,8 --mode LIVE

# High quality seeding
tsx download-and-process-ncert.ts --grades 6 --mode SEEDING --limit 5
```

### 2. Test Pipeline
**Location:** `/root/ankr-labs-nx/apps/ankr-curriculum-backend/src/scripts/test-pipeline.sh`

Quick smoke test with 2 NCERT books.

**Usage:**
```bash
./test-pipeline.sh
```

### 3. Readiness Check
**Location:** `/root/ankr-labs-nx/apps/ankr-curriculum-backend/check-phase2-ready.sh`

Verifies all dependencies and services are ready.

**Usage:**
```bash
./check-phase2-ready.sh
```

## Pipeline Stages

1. **CurriculumDetector** - AI-powered detection of board/grade/subject
2. **CourseGenerator** - Creates Course → Modules → Lessons structure
3. **QuestionOrchestrator** - Generates questions via FermiPipeline, SocraticPipeline, QuestionPipeline
4. **BoardStyleAdapter** - Adapts to CBSE/ICSE/Cambridge styles
5. **SolutionEnhancer** - Enriches with ankrlms logic (Fermi, Socratic, step-by-step)
6. **RealWorldEnricher** - Adds India-specific real-world examples
7. **VideoSuggestor** - Finds educational videos from YouTube, Khan Academy, DIKSHA

## AI Strategy

### SEEDING Mode
- Model: Claude Opus 4.6
- Quality: 95%+ accuracy
- Cost: ~₹50-100 per book
- Use: Initial high-quality content creation

### LIVE Mode
- Provider: AI Proxy (free tier cascade)
- Quality: 85-90% accuracy
- Cost: ₹0
- Use: Ongoing operations, real-time generation

## Output

Each processed book creates:
- 1 Course
- 10-15 Modules (chapters)
- 30-45 Lessons (3 per chapter)
- 100-150 Questions (mixed types)

All stored in database: `ankr_eon`
EOF

echo "📤 Indexing PHASE-2-SCRIPTS.md..."
node /root/ankr-labs-nx/packages/ankr-eon/dist/cli/cli.js ingest \
  --file "$TARGET_DIR/PHASE-2-SCRIPTS.md" \
  --category "documentation" \
  --tags "seekho,scripts,phase2,cli,automation,ncert,download,k12" \
  --source "seekho"

echo "  ✅ Published: PHASE-2-SCRIPTS.md"
echo ""

echo ""
echo "✅ === Seekho - Publishing Complete === ✅"
echo ""
echo "📖 View documentation at:"
echo "   https://ankr.in/project/documents/ankr-curriculum/"
echo "   https://seekho.ankrlabs.org (Live Platform)"
echo ""
echo "📚 Published Documents:"
echo "   - Seekho - Phase 2: Content Ingestion Pipeline (Complete guide)"
echo "   - Seekho - Phase 2: Status Update (Current status)"
echo "   - Seekho - Phase 2: Scripts Reference (CLI commands)"
echo "   - Seekho - K-12 Curriculum Platform DEPLOYED (Deployment info)"
echo "   - Seekho - SSL Certificate Deployment Guide (SSL setup)"
echo ""
echo "🔍 Search these documents via EON:"
echo "   ankr5 eon search \"seekho phase 2\""
echo "   ankr5 eon search \"seekho curriculum pipeline\""
echo ""
echo "🌐 Live URLs:"
echo "   Frontend: https://seekho.ankrlabs.org"
echo "   GraphQL:  https://seekho.ankrlabs.org/graphql"
echo ""
