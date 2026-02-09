#!/bin/bash
# GCE Guide Bulk Downloader
# Downloads past papers from papers.gceguide.com

BASE_URL="https://papers.gceguide.com"
OUTPUT_DIR="/root/data/cambridge-comprehensive"

# IGCSE Mathematics 0580
echo "Downloading IGCSE Mathematics (0580)..."
for year in {2020..2024}; do
  mkdir -p "$OUTPUT_DIR/igcse/past-papers/mathematics/$year"
  wget -r -np -nd -A "*.pdf" \
    -P "$OUTPUT_DIR/igcse/past-papers/mathematics/$year" \
    "$BASE_URL/Cambridge%20IGCSE/Mathematics%20(0580)/$year/"
done

# Add more subjects as needed
