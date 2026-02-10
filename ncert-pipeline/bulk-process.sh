#!/bin/bash

##
# NCERT Bulk Processing Pipeline
# Extracts all 369 chapter PDFs and imports to database
##

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PDF_DIR="/root/data/ncert-complete/extracted"
EXTRACT_SCRIPT="$SCRIPT_DIR/extract-pdf.py"
IMPORT_SCRIPT="$SCRIPT_DIR/db-importer.js"
EXTRACTED_DIR="$SCRIPT_DIR/extracted"
LOG_FILE="$SCRIPT_DIR/bulk-process.log"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "========================================"
echo "  NCERT BULK PROCESSING PIPELINE"
echo "========================================"
echo ""
echo "PDF Directory: $PDF_DIR"
echo "Total PDFs: $(find $PDF_DIR -name '*.pdf' | wc -l)"
echo ""

# Initialize counters
TOTAL=0
SUCCESS=0
FAILED=0

# Mapping of directory codes to course IDs
declare -A COURSE_MAP

# Class 6
COURSE_MAP[gemh1]="class-6-mathematics"
COURSE_MAP[gesc1]="class-6-science"

# Class 7
COURSE_MAP[hemh1]="class-7-mathematics"
COURSE_MAP[hesc1]="class-7-science"

# Class 8
COURSE_MAP[iemh1]="class-8-mathematics"
COURSE_MAP[iesc1]="class-8-science"

# Class 9
COURSE_MAP[iemh1]="class-9-mathematics"
COURSE_MAP[iesc1]="class-9-science"
COURSE_MAP[iess1]="class-9-social-science"
COURSE_MAP[iess2]="class-9-social-science"
COURSE_MAP[iess3]="class-9-social-science"
COURSE_MAP[iess4]="class-9-social-science"

# Class 10
COURSE_MAP[jemh1]="class-10-mathematics"
COURSE_MAP[jesc1]="class-10-science"
COURSE_MAP[jess1]="class-10-social-science"
COURSE_MAP[jess2]="class-10-social-science"
COURSE_MAP[jess3]="class-10-social-science"
COURSE_MAP[jess4]="class-10-social-science"

# Class 11
COURSE_MAP[kemh1]="class-11-mathematics"
COURSE_MAP[keph1]="class-11-physics"
COURSE_MAP[keph2]="class-11-physics"
COURSE_MAP[kech1]="class-11-chemistry"
COURSE_MAP[kech2]="class-11-chemistry"
COURSE_MAP[kebo1]="class-11-biology"

# Class 12
COURSE_MAP[lemh1]="class-12-mathematics"
COURSE_MAP[lemh2]="class-12-mathematics"
COURSE_MAP[leph1]="class-12-physics"
COURSE_MAP[leph2]="class-12-physics"
COURSE_MAP[lech1]="class-12-chemistry"
COURSE_MAP[lech2]="class-12-chemistry"
COURSE_MAP[lebo1]="class-12-biology"

# Find all PDF directories
for subject_dir in $PDF_DIR/class_*/*/ ; do
    subject_name=$(basename "$subject_dir")
    course_id=${COURSE_MAP[$subject_name]}

    if [ -z "$course_id" ]; then
        echo -e "${BLUE}⊘ Skipping unknown subject: $subject_name${NC}"
        continue
    fi

    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}Processing: $subject_name → $course_id${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    # Process each PDF in the directory
    for pdf_file in "$subject_dir"/*.pdf; do
        if [ ! -f "$pdf_file" ]; then
            continue
        fi

        filename=$(basename "$pdf_file" .pdf)
        json_file="$EXTRACTED_DIR/${filename}.json"

        TOTAL=$((TOTAL + 1))

        # Skip if already processed
        if [ -f "$json_file" ]; then
            echo "  ✓ Already extracted: $filename"
        else
            echo "  📄 Extracting: $filename"

            # Extract PDF to JSON
            if python3 "$EXTRACT_SCRIPT" "$pdf_file" >> "$LOG_FILE" 2>&1; then
                echo "    ✅ Extracted"
            else
                echo -e "    ${RED}❌ Extraction failed${NC}"
                FAILED=$((FAILED + 1))
                continue
            fi
        fi

        # Import to database
        echo "  📥 Importing to database..."
        if node "$IMPORT_SCRIPT" "$json_file" "$course_id" >> "$LOG_FILE" 2>&1; then
            echo "    ✅ Imported"
            SUCCESS=$((SUCCESS + 1))
        else
            echo -e "    ${RED}❌ Import failed${NC}"
            FAILED=$((FAILED + 1))
        fi

        echo ""
    done
done

echo ""
echo "========================================"
echo "  BULK PROCESSING COMPLETE"
echo "========================================"
echo "Total PDFs: $TOTAL"
echo -e "${GREEN}Success: $SUCCESS${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""
echo "Log file: $LOG_FILE"
echo ""
