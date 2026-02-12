#!/bin/bash
echo "=== CHECKING MISSING EXTRACTIONS ==="
echo ""
echo "Total PDFs: $(ls /root/data/ncert-extracted/*.pdf 2>/dev/null | wc -l)"
echo "Total JSONs: $(ls extracted-data/*.json 2>/dev/null | wc -l)"
echo ""
echo "Missing (PDFs without JSON):"
for pdf in /root/data/ncert-extracted/*.pdf; do
    basename=$(basename "$pdf" .pdf)
    if [ ! -f "extracted-data/${basename}.json" ]; then
        echo "  - $basename"
    fi
done | head -20
