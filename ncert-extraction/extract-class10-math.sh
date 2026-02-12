#!/bin/bash

# NCERT Class 10 Mathematics - Complete Extraction Script
# Downloads NCERT PDF and prepares for exercise extraction

set -e

echo "════════════════════════════════════════════════════════════"
echo "  NCERT Class 10 Mathematics - Exercise Extraction"
echo "════════════════════════════════════════════════════════════"
echo ""

# Create directories
EXTRACT_DIR="/root/ncert-extraction"
mkdir -p "$EXTRACT_DIR/pdfs"
mkdir -p "$EXTRACT_DIR/data"
mkdir -p "$EXTRACT_DIR/logs"

cd "$EXTRACT_DIR"

# NCERT Class 10 Mathematics PDF URLs
# Official NCERT website: ncert.nic.in

echo "📥 Step 1: Downloading NCERT Class 10 Mathematics PDF..."

# Primary URL (NCERT official)
PDF_URL="https://ncert.nic.in/textbook/pdf/jemh1dd.pdf"
OUTPUT_FILE="pdfs/class10-mathematics.pdf"

if [ -f "$OUTPUT_FILE" ]; then
    echo "   ℹ️  PDF already exists: $OUTPUT_FILE"
    PDF_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    echo "   File size: $PDF_SIZE"
else
    echo "   Downloading from: $PDF_URL"
    wget -q --show-progress "$PDF_URL" -O "$OUTPUT_FILE" || {
        echo "   ⚠️  Primary download failed, trying alternate source..."
        # Alternate: Try direct NCERT mirror
        wget -q --show-progress "https://ncert.nic.in/pdf/publication/schand/jemh/jemh1.pdf" -O "$OUTPUT_FILE"
    }

    if [ -f "$OUTPUT_FILE" ]; then
        PDF_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
        echo "   ✅ Downloaded successfully: $PDF_SIZE"
    else
        echo "   ❌ Download failed!"
        exit 1
    fi
fi

echo ""
echo "📄 Step 2: PDF Information..."
pdfinfo "$OUTPUT_FILE" 2>/dev/null | grep -E "Pages|File size|PDF version" || echo "   (pdfinfo not available)"

echo ""
echo "📋 Step 3: NCERT Class 10 Mathematics Chapter List..."
cat > data/class10-math-chapters.json << 'EOF'
{
  "book": {
    "id": "class-10-mathematics",
    "class": 10,
    "subject": "Mathematics",
    "title": "Mathematics for Class 10",
    "ncert_code": "jemh1dd",
    "total_chapters": 15
  },
  "chapters": [
    {
      "number": 1,
      "title": "Real Numbers",
      "module_id": "ch1-real-numbers",
      "page_start": 1,
      "exercises": ["1.1", "1.2", "1.3", "1.4"]
    },
    {
      "number": 2,
      "title": "Polynomials",
      "module_id": "ch2-polynomials",
      "page_start": 28,
      "exercises": ["2.1", "2.2", "2.3", "2.4"]
    },
    {
      "number": 3,
      "title": "Pair of Linear Equations in Two Variables",
      "module_id": "ch3-linear-equations",
      "page_start": 44,
      "exercises": ["3.1", "3.2", "3.3", "3.4", "3.5", "3.6", "3.7"]
    },
    {
      "number": 4,
      "title": "Quadratic Equations",
      "module_id": "ch4-quadratic-equations",
      "page_start": 73,
      "exercises": ["4.1", "4.2", "4.3", "4.4"]
    },
    {
      "number": 5,
      "title": "Arithmetic Progressions",
      "module_id": "ch5-arithmetic-progressions",
      "page_start": 99,
      "exercises": ["5.1", "5.2", "5.3", "5.4"]
    },
    {
      "number": 6,
      "title": "Triangles",
      "module_id": "ch6-triangles",
      "page_start": 121,
      "exercises": ["6.1", "6.2", "6.3", "6.4", "6.5", "6.6"]
    },
    {
      "number": 7,
      "title": "Coordinate Geometry",
      "module_id": "ch7-coordinate-geometry",
      "page_start": 161,
      "exercises": ["7.1", "7.2", "7.3", "7.4"]
    },
    {
      "number": 8,
      "title": "Introduction to Trigonometry",
      "module_id": "ch8-trigonometry",
      "page_start": 181,
      "exercises": ["8.1", "8.2", "8.3", "8.4"]
    },
    {
      "number": 9,
      "title": "Some Applications of Trigonometry",
      "module_id": "ch9-trigonometry-applications",
      "page_start": 203,
      "exercises": ["9.1"]
    },
    {
      "number": 10,
      "title": "Circles",
      "module_id": "ch10-circles",
      "page_start": 213,
      "exercises": ["10.1", "10.2"]
    },
    {
      "number": 11,
      "title": "Constructions",
      "module_id": "ch11-constructions",
      "page_start": 219,
      "exercises": ["11.1", "11.2"]
    },
    {
      "number": 12,
      "title": "Areas Related to Circles",
      "module_id": "ch12-areas-circles",
      "page_start": 227,
      "exercises": ["12.1", "12.2", "12.3"]
    },
    {
      "number": 13,
      "title": "Surface Areas and Volumes",
      "module_id": "ch13-surface-areas-volumes",
      "page_start": 244,
      "exercises": ["13.1", "13.2", "13.3", "13.4", "13.5"]
    },
    {
      "number": 14,
      "title": "Statistics",
      "module_id": "ch14-statistics",
      "page_start": 270,
      "exercises": ["14.1", "14.2", "14.3", "14.4"]
    },
    {
      "number": 15,
      "title": "Probability",
      "module_id": "ch15-probability",
      "page_start": 308,
      "exercises": ["15.1", "15.2"]
    }
  ]
}
EOF

echo "   ✅ Chapter metadata created: data/class10-math-chapters.json"

echo ""
echo "📊 Expected Extraction Summary:"
echo "   Total Chapters: 15"
echo "   Total Exercise Sets: 56"
echo "   Estimated Questions: 250-300"
echo ""

echo "════════════════════════════════════════════════════════════"
echo "  ✅ Download Complete - Ready for Extraction"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Extract exercises using AI (Claude PDF reading)"
echo "  2. Structure data for database ingestion"
echo "  3. Insert into ankr_learning.chapter_exercises"
echo "  4. Run solver to generate solutions"
echo ""
echo "PDF location: $OUTPUT_FILE"
echo "Metadata: data/class10-math-chapters.json"
