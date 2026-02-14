#!/bin/bash

# Download leads from Google Sheets as CSV
# Usage: ./download-leads.sh

SHEET_ID="1VjuYWfkFhQNX8n0Kaz1XSs2tmm1oPC8FFxHjT6rjBRA"
OUTPUT_FILE="/root/pratham-leads.csv"

echo "📥 Downloading Pratham CRM leads from Google Sheets..."

# Try to download as CSV (works if sheet is public)
wget -q -O "$OUTPUT_FILE" "https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv" 2>&1

if [ $? -eq 0 ] && [ -s "$OUTPUT_FILE" ]; then
    echo "✅ Downloaded successfully to: $OUTPUT_FILE"
    echo ""
    echo "Preview (first 5 rows):"
    head -n 5 "$OUTPUT_FILE"
    echo ""
    echo "📊 Total rows: $(wc -l < "$OUTPUT_FILE")"
    echo ""
    echo "🚀 Next step: Run the importer"
    echo "   cd /root/pratham-telehub-poc"
    echo "   node import-leads.js"
else
    echo "❌ Failed to download. The sheet might not be public."
    echo ""
    echo "Please make the sheet public:"
    echo "1. Open: https://docs.google.com/spreadsheets/d/${SHEET_ID}"
    echo "2. Click 'Share' → 'Anyone with the link can view'"
    echo "3. Run this script again"
    echo ""
    echo "OR manually download:"
    echo "1. File → Download → CSV"
    echo "2. Upload to: $OUTPUT_FILE"
    rm -f "$OUTPUT_FILE"
fi
