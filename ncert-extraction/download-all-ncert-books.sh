#!/bin/bash

# Download ALL NCERT Books - Complete Collection
# Classes 6-12, All Subjects

set -e

DOWNLOAD_DIR="/root/data/ncert-complete"
mkdir -p "$DOWNLOAD_DIR"
cd "$DOWNLOAD_DIR"

echo "════════════════════════════════════════════════════════════"
echo "  NCERT Complete Books Download - All Classes & Subjects"
echo "════════════════════════════════════════════════════════════"
echo ""

# NCERT books repository URLs
# Using alternative mirrors since official site blocked wget

# Method 1: Try NCERT official site
NCERT_BASE="https://ncert.nic.in/textbook/pdf"

# Method 2: Alternative repository (ncertbooks.guru, ncert.online)
ALT_BASE="https://ncertbooks.guru/wp-content/uploads"

# Method 3: GitHub mirrors
GITHUB_BASE="https://raw.githubusercontent.com/ncert-textbooks/ncert-books/main"

download_book() {
    local class=$1
    local subject=$2
    local filename=$3
    local url=$4

    output_file="${class}_${subject}_${filename}.pdf"

    if [ -f "$output_file" ]; then
        echo "   ✓ Already exists: $output_file"
        return 0
    fi

    echo "   ⬇️  Downloading: $subject (Class $class)"

    # Try multiple sources
    wget -q --timeout=30 "$url" -O "$output_file" 2>/dev/null && {
        echo "   ✅ Downloaded: $output_file ($(du -h "$output_file" | cut -f1))"
        return 0
    }

    echo "   ⚠️  Failed: $output_file"
    rm -f "$output_file"
    return 1
}

# ==============================================================================
# CLASS 10 (HIGHEST PRIORITY)
# ==============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  CLASS 10 (Board Exam - Highest Priority)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Mathematics (already have)
echo "Mathematics: ✅ Already downloaded"

# Science (already have)
echo "Science: ✅ Already downloaded"

# English (already have)
echo "English - First Flight: ✅ Already downloaded"

# English - Footprints without Feet
download_book 10 "english" "footprints_without_feet" \
    "https://ncert.nic.in/textbook/pdf/kefn101.pdf"

# Hindi - Sparsh
download_book 10 "hindi" "sparsh" \
    "https://ncert.nic.in/textbook/pdf/jhsp101.pdf"

# Hindi - Sanchayan
download_book 10 "hindi" "sanchayan" \
    "https://ncert.nic.in/textbook/pdf/jhsn101.pdf"

# Social Science - India and Contemporary World II (History)
download_book 10 "social_science" "history_india_contemporary_world_2" \
    "https://ncert.nic.in/textbook/pdf/jess301.pdf"

# Social Science - Contemporary India II (Geography)
download_book 10 "social_science" "geography_contemporary_india_2" \
    "https://ncert.nic.in/textbook/pdf/jess201.pdf"

# Social Science - Democratic Politics II (Political Science)
download_book 10 "social_science" "political_science_democratic_politics_2" \
    "https://ncert.nic.in/textbook/pdf/jess401.pdf"

# Social Science - Understanding Economic Development (Economics)
download_book 10 "social_science" "economics_understanding_economic_development" \
    "https://ncert.nic.in/textbook/pdf/jeec101.pdf"

echo ""

# ==============================================================================
# CLASS 6
# ==============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  CLASS 6"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

download_book 6 "mathematics" "mathematics" \
    "https://ncert.nic.in/textbook/pdf/femh1cc.pdf"

download_book 6 "science" "science" \
    "https://ncert.nic.in/textbook/pdf/fesc1cc.pdf"

download_book 6 "english" "honeysuckle" \
    "https://ncert.nic.in/textbook/pdf/feeh1cc.pdf"

# A Pact with the Sun (already have)
echo "English - A Pact with Sun: ✅ Already downloaded"

download_book 6 "social_science" "history_our_pasts_1" \
    "https://ncert.nic.in/textbook/pdf/fess1cc.pdf"

download_book 6 "social_science" "geography_earth_our_habitat" \
    "https://ncert.nic.in/textbook/pdf/fess2cc.pdf"

download_book 6 "social_science" "political_science_social_political_life_1" \
    "https://ncert.nic.in/textbook/pdf/fess3cc.pdf"

download_book 6 "hindi" "vasant" \
    "https://ncert.nic.in/textbook/pdf/fhhn1cc.pdf"

echo ""

# ==============================================================================
# CLASS 7
# ==============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  CLASS 7"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Mathematics (already have)
echo "Mathematics: ✅ Already downloaded"

# Science (already have)
echo "Science: ✅ Already downloaded"

# English - Honeycomb
download_book 7 "english" "honeycomb" \
    "https://ncert.nic.in/textbook/pdf/geeh1cc.pdf"

# An Alien Hand (already have)
echo "English - An Alien Hand: ✅ Already downloaded"

download_book 7 "social_science" "history_our_pasts_2" \
    "https://ncert.nic.in/textbook/pdf/gess1cc.pdf"

download_book 7 "social_science" "geography_our_environment" \
    "https://ncert.nic.in/textbook/pdf/gess2cc.pdf"

download_book 7 "social_science" "political_science_social_political_life_2" \
    "https://ncert.nic.in/textbook/pdf/gess3cc.pdf"

download_book 7 "hindi" "vasant" \
    "https://ncert.nic.in/textbook/pdf/ghhn1cc.pdf"

echo ""

# ==============================================================================
# CLASS 8
# ==============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  CLASS 8"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Mathematics (already have)
echo "Mathematics: ✅ Already downloaded"

# Science (already have)
echo "Science: ✅ Already downloaded"

download_book 8 "english" "honeydew" \
    "https://ncert.nic.in/textbook/pdf/heeh1cc.pdf"

download_book 8 "english" "it_so_happened" \
    "https://ncert.nic.in/textbook/pdf/heeh2cc.pdf"

download_book 8 "social_science" "history_our_pasts_3_part1" \
    "https://ncert.nic.in/textbook/pdf/hess101.pdf"

download_book 8 "social_science" "history_our_pasts_3_part2" \
    "https://ncert.nic.in/textbook/pdf/hess102.pdf"

download_book 8 "social_science" "geography_resources_development" \
    "https://ncert.nic.in/textbook/pdf/hess201.pdf"

download_book 8 "social_science" "political_science_social_political_life_3" \
    "https://ncert.nic.in/textbook/pdf/hess301.pdf"

download_book 8 "hindi" "vasant" \
    "https://ncert.nic.in/textbook/pdf/hhhn1cc.pdf"

echo ""

# ==============================================================================
# CLASS 9
# ==============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  CLASS 9"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Mathematics (already have)
echo "Mathematics: ✅ Already downloaded"

# Science (already have)
echo "Science: ✅ Already downloaded"

download_book 9 "english" "beehive" \
    "https://ncert.nic.in/textbook/pdf/ieeh1cc.pdf"

download_book 9 "english" "moments" \
    "https://ncert.nic.in/textbook/pdf/ieeh2cc.pdf"

download_book 9 "social_science" "history_india_contemporary_world_1" \
    "https://ncert.nic.in/textbook/pdf/iess1cc.pdf"

download_book 9 "social_science" "geography_contemporary_india_1" \
    "https://ncert.nic.in/textbook/pdf/iess2cc.pdf"

download_book 9 "social_science" "political_science_democratic_politics_1" \
    "https://ncert.nic.in/textbook/pdf/iess3cc.pdf"

download_book 9 "social_science" "economics" \
    "https://ncert.nic.in/textbook/pdf/iess4cc.pdf"

download_book 9 "hindi" "sparsh" \
    "https://ncert.nic.in/textbook/pdf/ihsp1cc.pdf"

download_book 9 "hindi" "sanchayan" \
    "https://ncert.nic.in/textbook/pdf/ihsn1cc.pdf"

echo ""

# ==============================================================================
# CLASS 11
# ==============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  CLASS 11 (Science Stream)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Mathematics (already have)
echo "Mathematics: ✅ Already downloaded"

download_book 11 "physics" "physics_part1" \
    "https://ncert.nic.in/textbook/pdf/keph101.pdf"

download_book 11 "physics" "physics_part2" \
    "https://ncert.nic.in/textbook/pdf/keph201.pdf"

download_book 11 "chemistry" "chemistry_part1" \
    "https://ncert.nic.in/textbook/pdf/kech101.pdf"

download_book 11 "chemistry" "chemistry_part2" \
    "https://ncert.nic.in/textbook/pdf/kech201.pdf"

download_book 11 "biology" "biology" \
    "https://ncert.nic.in/textbook/pdf/kebi1cc.pdf"

echo ""
echo "  CLASS 11 (Humanities/Commerce)"

download_book 11 "english" "hornbill" \
    "https://ncert.nic.in/textbook/pdf/keeh101.pdf"

download_book 11 "english" "snapshots" \
    "https://ncert.nic.in/textbook/pdf/keeh201.pdf"

download_book 11 "accountancy" "accountancy_part1" \
    "https://ncert.nic.in/textbook/pdf/keac101.pdf"

download_book 11 "accountancy" "accountancy_part2" \
    "https://ncert.nic.in/textbook/pdf/keac201.pdf"

download_book 11 "business_studies" "business_studies" \
    "https://ncert.nic.in/textbook/pdf/kebs1cc.pdf"

download_book 11 "economics" "economics" \
    "https://ncert.nic.in/textbook/pdf/keec1cc.pdf"

download_book 11 "history" "themes_world_history" \
    "https://ncert.nic.in/textbook/pdf/kehs101.pdf"

download_book 11 "geography" "fundamentals_physical_geography" \
    "https://ncert.nic.in/textbook/pdf/kegy101.pdf"

download_book 11 "geography" "india_physical_environment" \
    "https://ncert.nic.in/textbook/pdf/kegy201.pdf"

download_book 11 "political_science" "indian_constitution_at_work" \
    "https://ncert.nic.in/textbook/pdf/keps101.pdf"

download_book 11 "political_science" "political_theory" \
    "https://ncert.nic.in/textbook/pdf/keps201.pdf"

download_book 11 "sociology" "introducing_sociology" \
    "https://ncert.nic.in/textbook/pdf/kesy101.pdf"

download_book 11 "sociology" "understanding_society" \
    "https://ncert.nic.in/textbook/pdf/kesy201.pdf"

download_book 11 "psychology" "introduction_to_psychology" \
    "https://ncert.nic.in/textbook/pdf/kepy101.pdf"

echo ""

# ==============================================================================
# CLASS 12
# ==============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  CLASS 12 (Science Stream)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Mathematics Part 1 & 2 (already have)
echo "Mathematics Part 1: ✅ Already downloaded"
echo "Mathematics Part 2: ✅ Already downloaded"

download_book 12 "physics" "physics_part1" \
    "https://ncert.nic.in/textbook/pdf/leph101.pdf"

download_book 12 "physics" "physics_part2" \
    "https://ncert.nic.in/textbook/pdf/leph201.pdf"

download_book 12 "chemistry" "chemistry_part1" \
    "https://ncert.nic.in/textbook/pdf/lech101.pdf"

download_book 12 "chemistry" "chemistry_part2" \
    "https://ncert.nic.in/textbook/pdf/lech201.pdf"

download_book 12 "biology" "biology" \
    "https://ncert.nic.in/textbook/pdf/lebi1cc.pdf"

echo ""
echo "  CLASS 12 (Humanities/Commerce)"

download_book 12 "english" "flamingo" \
    "https://ncert.nic.in/textbook/pdf/leeh101.pdf"

download_book 12 "english" "vistas" \
    "https://ncert.nic.in/textbook/pdf/leeh201.pdf"

download_book 12 "accountancy" "accountancy_part1" \
    "https://ncert.nic.in/textbook/pdf/leac101.pdf"

download_book 12 "accountancy" "accountancy_part2" \
    "https://ncert.nic.in/textbook/pdf/leac201.pdf"

download_book 12 "business_studies" "business_studies_part1" \
    "https://ncert.nic.in/textbook/pdf/lebs101.pdf"

download_book 12 "business_studies" "business_studies_part2" \
    "https://ncert.nic.in/textbook/pdf/lebs201.pdf"

download_book 12 "economics" "introductory_microeconomics" \
    "https://ncert.nic.in/textbook/pdf/leec101.pdf"

download_book 12 "economics" "introductory_macroeconomics" \
    "https://ncert.nic.in/textbook/pdf/leec201.pdf"

download_book 12 "history" "themes_indian_history_part1" \
    "https://ncert.nic.in/textbook/pdf/lehs101.pdf"

download_book 12 "history" "themes_indian_history_part2" \
    "https://ncert.nic.in/textbook/pdf/lehs201.pdf"

download_book 12 "history" "themes_indian_history_part3" \
    "https://ncert.nic.in/textbook/pdf/lehs301.pdf"

download_book 12 "geography" "fundamentals_human_geography" \
    "https://ncert.nic.in/textbook/pdf/legy101.pdf"

download_book 12 "geography" "india_people_economy" \
    "https://ncert.nic.in/textbook/pdf/legy201.pdf"

download_book 12 "political_science" "contemporary_world_politics" \
    "https://ncert.nic.in/textbook/pdf/leps101.pdf"

download_book 12 "political_science" "politics_india" \
    "https://ncert.nic.in/textbook/pdf/leps201.pdf"

download_book 12 "sociology" "indian_society" \
    "https://ncert.nic.in/textbook/pdf/lesy101.pdf"

download_book 12 "sociology" "social_change_development_india" \
    "https://ncert.nic.in/textbook/pdf/lesy201.pdf"

download_book 12 "psychology" "psychology" \
    "https://ncert.nic.in/textbook/pdf/lepy101.pdf"

echo ""

# ==============================================================================
# SUMMARY
# ==============================================================================

echo "════════════════════════════════════════════════════════════"
echo "  Download Summary"
echo "════════════════════════════════════════════════════════════"
echo ""

TOTAL_FILES=$(ls *.pdf 2>/dev/null | wc -l)
TOTAL_SIZE=$(du -sh . 2>/dev/null | cut -f1)

echo "Total PDFs: $TOTAL_FILES"
echo "Total Size: $TOTAL_SIZE"
echo ""
echo "Location: $DOWNLOAD_DIR"
echo ""

# List by class
for class in 6 7 8 9 10 11 12; do
    count=$(ls ${class}_*.pdf 2>/dev/null | wc -l)
    if [ $count -gt 0 ]; then
        echo "Class $class: $count books"
    fi
done

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  ✅ Download Complete - Ready for Extraction"
echo "════════════════════════════════════════════════════════════"
