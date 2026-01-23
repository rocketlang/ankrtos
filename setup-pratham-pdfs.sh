#!/bin/bash
# One-command setup for Pratham PDFs

echo "🎓 ANKR LMS - Pratham PDF Setup"
echo "================================"
echo ""

# Step 1: Process PDFs
echo "📖 Step 1: Processing PDFs..."
node /root/process-pratham-pdfs.js

# Step 2: Import to LMS
echo ""
echo "📚 Step 2: Importing to ANKR LMS..."
node /root/import-pdfs-to-ankr-lms.js

# Step 3: Show results
echo ""
echo "✅ Setup complete!"
echo ""
echo "📊 Statistics:"
ls -lh /root/pdfs-pratham/*.pdf 2>/dev/null | wc -l | xargs echo "  PDFs uploaded:"
ls -lh /root/ankr-labs-nx/node_modules/@ankr/interact/data/pdfs/*.pdf 2>/dev/null | wc -l | xargs echo "  PDFs processed:"
ls -lh /root/ankr-labs-nx/node_modules/@ankr/interact/data/metadata/*.json 2>/dev/null | wc -l | xargs echo "  Metadata files:"
echo ""
echo "🌐 Access ANKR LMS at: https://ankrlms.ankr.in"
