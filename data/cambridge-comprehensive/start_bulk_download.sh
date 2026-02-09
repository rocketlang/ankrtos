#!/bin/bash
# Cambridge Bulk Downloader - GCE Guide
# Downloads past papers, mark schemes, and examiner reports

set -e

BASE_URL="https://papers.gceguide.com"
OUTPUT_DIR="/root/data/cambridge-comprehensive"

echo "🚀 Cambridge Bulk Download Started"
echo "Source: GCE Guide (papers.gceguide.com)"
echo "Target: IGCSE Past Papers 2020-2024"
echo "=================================="
echo ""

# Function to download a subject's papers
download_subject() {
    local code=$1
    local name=$2
    local years=$3

    echo "📚 Downloading IGCSE $code - $name"

    for year in $years; do
        echo "   📅 Year $year..."

        # Create output directory
        mkdir -p "$OUTPUT_DIR/igcse/past-papers/$code-$name/$year"

        # Download using wget
        # -r: recursive
        # -np: no parent directories
        # -nd: no directories (flatten)
        # -A: accept only PDFs
        # -P: output directory
        # -q: quiet mode
        # --wait=1: wait 1 second between files (rate limiting)

        wget -r -np -nd -A "*.pdf" \
             --wait=1 --random-wait \
             --tries=3 --timeout=60 \
             -P "$OUTPUT_DIR/igcse/past-papers/$code-$name/$year" \
             "$BASE_URL/Cambridge%20IGCSE/$code%20$name/$year/" \
             2>&1 | grep -E "saved|error" || true

        # Count files downloaded
        count=$(find "$OUTPUT_DIR/igcse/past-papers/$code-$name/$year" -name "*.pdf" 2>/dev/null | wc -l)
        echo "   ✅ Downloaded $count files for $year"
    done

    echo ""
}

# Priority 1: Core Sciences and Math (most popular)
echo "🎯 Priority 1: Core Subjects"
echo ""

download_subject "0580" "Mathematics" "2024 2023 2022 2021 2020"
download_subject "0625" "Physics" "2024 2023 2022 2021 2020"
download_subject "0620" "Chemistry" "2024 2023 2022 2021 2020"
download_subject "0610" "Biology" "2024 2023 2022 2021 2020"

# Priority 2: Other popular subjects
echo "🎯 Priority 2: Additional Subjects"
echo ""

download_subject "0478" "Computer%20Science" "2024 2023 2022 2021 2020"
download_subject "0455" "Economics" "2024 2023 2022 2021 2020"
download_subject "0450" "Business%20Studies" "2024 2023 2022 2021 2020"

# Summary
echo "=================================="
echo "✅ Bulk Download Complete!"
echo ""
echo "📁 Location: $OUTPUT_DIR/igcse/past-papers/"
echo ""
echo "📊 Summary:"
find "$OUTPUT_DIR/igcse/past-papers" -name "*.pdf" 2>/dev/null | wc -l | xargs echo "   Total PDFs:"
du -sh "$OUTPUT_DIR/igcse/past-papers" 2>/dev/null | awk '{print "   Total Size: " $1}'
echo ""
